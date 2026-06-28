#!/usr/bin/env python3
# pyright: strict
"""Build and install the single blessed local Codex npm route."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import tempfile
import tomllib
import winreg
from pathlib import Path
from typing import Any, cast


REPO_ROOT = Path(__file__).resolve().parent.parent
CODEX_CLI_ROOT = REPO_ROOT / "codex-cli"
CODEX_RS_ROOT = REPO_ROOT / "codex-rs"
CODEX_SDK_ROOT = REPO_ROOT / "sdk" / "typescript"
TARGET_TRIPLE = "aarch64-pc-windows-msvc"
LOCAL_VERSION_SUFFIX = "cududa"
CODEX_NPM_NAME = "@cududa/codex"
CODEX_SDK_NPM_NAME = "@cududa/codex-sdk"
PUBLIC_CODEX_NPM_NAME = "@openai/codex"
PUBLIC_CODEX_SDK_NPM_NAME = "@openai/codex-sdk"
LEGACY_INSTALL_ROOT = Path(r"C:\Program Files\CodexPinned")
LEGACY_BIN_DIR = LEGACY_INSTALL_ROOT / "bin"
JsonObject = dict[str, Any]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--version",
        help="Npm package version. Defaults to <codex-rs workspace.package.version>-cududa.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=REPO_ROOT / "dist" / "npm-local",
        help="Directory for generated tarballs and local smoke-test install.",
    )
    parser.add_argument(
        "--codex-bin",
        type=Path,
        default=CODEX_RS_ROOT / "target" / TARGET_TRIPLE / "local-release" / "codex.exe",
        help="Path to the local-release codex.exe to package.",
    )
    parser.add_argument(
        "--rg-source",
        type=Path,
        help="Path to rg.exe. Defaults to resolving rg from PATH.",
    )
    parser.add_argument(
        "--reuse-codex-bin",
        action="store_true",
        help="Reuse --codex-bin instead of rebuilding Codex. Only for SDK/node iteration.",
    )
    parser.add_argument(
        "--skip-sdk-build",
        action="store_true",
        help="Reuse sdk/typescript/dist instead of rebuilding the SDK. Only for debugging.",
    )
    parser.add_argument(
        "--skip-local-install",
        action="store_true",
        help="Skip the generated dist/npm-local pnpm install smoke environment.",
    )
    parser.add_argument(
        "--skip-global-install",
        action="store_true",
        help="Skip installing @cududa/codex and @cududa/codex-sdk into global npm.",
    )
    parser.add_argument(
        "--skip-path-normalization",
        action="store_true",
        help="Skip removing the legacy CodexPinned PATH entry and adding global npm to User PATH.",
    )
    parser.add_argument(
        "--skip-legacy-delete",
        action="store_true",
        help="Skip deleting C:\\Program Files\\CodexPinned after npm route verification.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    version = args.version or derive_local_version()
    output_dir = args.output_dir.resolve()
    tarballs_dir = output_dir / "tarballs"
    packages_dir = output_dir / "packages"
    codex_package_dir = packages_dir / "codex"
    sdk_package_dir = packages_dir / "codex-sdk"
    codex_tarball = tarballs_dir / f"codex-npm-{version}.tgz"
    sdk_tarball = tarballs_dir / f"codex-sdk-npm-{version}.tgz"

    if args.reuse_codex_bin:
        print("Reusing existing local-release Codex binary.", flush=True)
    else:
        build_codex()

    codex_bin = args.codex_bin.resolve()
    require_file(codex_bin, "Codex binary")
    rg_source = resolve_rg_source(args.rg_source, output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)
    tarballs_dir.mkdir(parents=True, exist_ok=True)
    packages_dir.mkdir(parents=True, exist_ok=True)

    if args.reuse_codex_bin and (codex_package_dir / "package.json").is_file():
        print("Reusing existing staged Codex npm package.", flush=True)
        stage_codex_package(
            codex_package_dir,
            version,
            codex_bin,
            rg_source,
            copy_codex_binary=False,
        )
    else:
        reset_dir(codex_package_dir)
        stage_codex_package(codex_package_dir, version, codex_bin, rg_source)
    run_npm_pack(codex_package_dir, codex_tarball)
    reset_dir(sdk_package_dir)
    stage_sdk_package(
        sdk_package_dir,
        version,
        sdk_tarball,
        skip_sdk_build=args.skip_sdk_build,
    )

    write_consumer_manifest(output_dir, version, codex_tarball.name, sdk_tarball.name)
    write_pnpm_workspace(output_dir, codex_tarball.name)
    if not args.skip_local_install:
        run_command(
            [resolve_command("pnpm"), "install", "--no-frozen-lockfile"],
            cwd=output_dir,
            env={"CI": "true"},
        )

    npm_prefix = npm_global_prefix()
    if not args.skip_global_install:
        install_global_packages(npm_prefix, codex_package_dir, sdk_package_dir)
        verify_global_npm_route(npm_prefix)

    if not args.skip_path_normalization:
        normalize_path(npm_prefix)
        verify_process_codex_resolution(npm_prefix)

    if not args.skip_legacy_delete:
        delete_legacy_install()

    print(f"Installed local Codex npm route {version}", flush=True)
    print(f"  {codex_tarball}", flush=True)
    print(f"  {sdk_tarball}", flush=True)
    return 0


def build_codex() -> None:
    run_command(
        [
            resolve_command("cargo"),
            "build",
            "-p",
            "codex-cli",
            "--bin",
            "codex",
            "--profile",
            "local-release",
            "--target",
            TARGET_TRIPLE,
        ],
        cwd=CODEX_RS_ROOT,
    )


def derive_local_version() -> str:
    cargo_toml = CODEX_RS_ROOT / "Cargo.toml"
    with open(cargo_toml, "rb") as fh:
        cargo_config = tomllib.load(fh)
    version = cargo_config.get("workspace", {}).get("package", {}).get("version")
    if not isinstance(version, str) or not version:
        raise RuntimeError(f"Unable to read workspace.package.version from {cargo_toml}")
    return f"{version}-{LOCAL_VERSION_SUFFIX}"


def resolve_rg_source(override: Path | None, output_dir: Path) -> Path:
    if override is not None:
        rg_source = override.resolve()
    else:
        found = find_command_outside("rg", output_dir)
        if found is None:
            raise FileNotFoundError("Unable to find rg on PATH. Pass --rg-source.")
        rg_source = found
    require_file(rg_source, "rg binary")
    return rg_source


def find_command_outside(name: str, excluded_root: Path) -> Path | None:
    executable_names = [name]
    if os.name == "nt" and not name.lower().endswith((".exe", ".cmd", ".bat", ".ps1")):
        executable_names = [f"{name}.exe", f"{name}.cmd", f"{name}.bat", name]
    for entry in split_path(os.environ.get("PATH", "")):
        for executable_name in executable_names:
            candidate = (Path(entry) / executable_name).resolve()
            if candidate.is_file() and not candidate.is_relative_to(excluded_root):
                return candidate
    return None


def stage_codex_package(
    staging_dir: Path,
    version: str,
    codex_bin: Path,
    rg_source: Path,
    *,
    copy_codex_binary: bool = True,
) -> None:
    codex_dest_dir = staging_dir / "vendor" / TARGET_TRIPLE / "codex"
    path_dest_dir = staging_dir / "vendor" / TARGET_TRIPLE / "path"
    bin_dir = staging_dir / "bin"
    codex_dest_dir.mkdir(parents=True, exist_ok=True)
    path_dest_dir.mkdir(parents=True, exist_ok=True)
    bin_dir.mkdir(parents=True, exist_ok=True)

    shutil.copy2(CODEX_CLI_ROOT / "bin" / "codex.js", bin_dir / "codex.js")
    if copy_codex_binary:
        shutil.copy2(codex_bin, codex_dest_dir / "codex.exe")
    else:
        require_file(codex_dest_dir / "codex.exe", "staged Codex binary")
    shutil.copy2(rg_source, path_dest_dir / "rg.exe")

    readme_src = REPO_ROOT / "README.md"
    if readme_src.exists():
        shutil.copy2(readme_src, staging_dir / "README.md")

    with open(CODEX_CLI_ROOT / "package.json", "r", encoding="utf-8") as fh:
        package_json = cast(JsonObject, json.load(fh))
    package_json["name"] = CODEX_NPM_NAME
    package_json["version"] = version
    package_json["private"] = True
    package_json["files"] = ["bin", "vendor"]
    package_json.pop("optionalDependencies", None)
    write_json(staging_dir / "package.json", package_json)


def stage_sdk_package(
    staging_dir: Path,
    version: str,
    pack_output: Path,
    *,
    skip_sdk_build: bool,
) -> None:
    if not skip_sdk_build:
        run_command(
            [
                resolve_command("pnpm"),
                "install",
                "--ignore-workspace",
                "--no-frozen-lockfile",
                "--ignore-scripts",
            ],
            cwd=CODEX_SDK_ROOT,
        )
        run_command([resolve_command("pnpm"), "run", "build"], cwd=CODEX_SDK_ROOT)

    dist_src = CODEX_SDK_ROOT / "dist"
    require_dir(dist_src, "SDK dist directory")
    shutil.copytree(dist_src, staging_dir / "dist")

    for source, destination_name in [
        (CODEX_SDK_ROOT / "README.md", "README.md"),
        (REPO_ROOT / "LICENSE", "LICENSE"),
    ]:
        if source.exists():
            shutil.copy2(source, staging_dir / destination_name)

    with open(CODEX_SDK_ROOT / "package.json", "r", encoding="utf-8") as fh:
        package_json = cast(JsonObject, json.load(fh))
    package_json["name"] = CODEX_SDK_NPM_NAME
    package_json["version"] = version
    package_json["private"] = True
    scripts_value = package_json.get("scripts")
    if isinstance(scripts_value, dict):
        scripts = cast(JsonObject, scripts_value)
        scripts.pop("prepare", None)
    write_json(staging_dir / "package.json", package_json)
    run_npm_pack(staging_dir, pack_output)


def write_consumer_manifest(
    output_dir: Path,
    version: str,
    codex_tarball_name: str,
    sdk_tarball_name: str,
) -> None:
    write_json(
        output_dir / "package.json",
        {
            "name": "cududa-codex-local-npm-route",
            "version": version,
            "private": True,
            "type": "module",
            "engines": {"node": ">=22", "pnpm": ">=10.33.0"},
            "packageManager": package_manager(),
            "dependencies": {
                CODEX_NPM_NAME: f"file:./tarballs/{codex_tarball_name}",
                CODEX_SDK_NPM_NAME: f"file:./tarballs/{sdk_tarball_name}",
            },
        },
    )


def write_pnpm_workspace(output_dir: Path, codex_tarball_name: str) -> None:
    workspace = (
        "packages:\n"
        "  - .\n"
        "overrides:\n"
        f"  \"{CODEX_NPM_NAME}\": \"file:./tarballs/{codex_tarball_name}\"\n"
    )
    with open(output_dir / "pnpm-workspace.yaml", "w", encoding="utf-8") as fh:
        fh.write(workspace)


def package_manager() -> str:
    with open(REPO_ROOT / "package.json", "r", encoding="utf-8") as fh:
        root_package = cast(JsonObject, json.load(fh))
    value = root_package.get("packageManager")
    return value if isinstance(value, str) and value else "pnpm@10.33.0"


def run_npm_pack(staging_dir: Path, output_path: Path) -> None:
    output_path = output_path.resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="codex-local-npm-pack-") as pack_dir_str:
        pack_dir = Path(pack_dir_str)
        stdout = subprocess.check_output(
            [resolve_command("npm"), "pack", "--json", "--pack-destination", str(pack_dir)],
            cwd=staging_dir,
            text=True,
        )
        pack_output = cast(list[JsonObject], json.loads(stdout))
        if not pack_output:
            raise RuntimeError("npm pack did not produce an output tarball.")
        filename = pack_output[0].get("filename") or pack_output[0].get("name")
        if not isinstance(filename, str) or not filename:
            raise RuntimeError("Unable to determine npm pack output filename.")
        packed = pack_dir / filename
        require_file(packed, "npm pack output")
        shutil.move(str(packed), output_path)


def install_global_packages(npm_prefix: Path, codex_package_dir: Path, sdk_package_dir: Path) -> None:
    run_command(
        [
            resolve_command("npm"),
            "uninstall",
            "-g",
            PUBLIC_CODEX_NPM_NAME,
            PUBLIC_CODEX_SDK_NPM_NAME,
        ],
        cwd=REPO_ROOT,
    )
    delete_global_public_scope(npm_prefix)
    run_command(
        [resolve_command("npm"), "install", "-g", str(codex_package_dir), str(sdk_package_dir)],
        cwd=REPO_ROOT,
    )
    delete_hidden_scope_cleanup_dirs(npm_prefix, "@cududa")


def npm_global_prefix() -> Path:
    stdout = subprocess.check_output([resolve_command("npm"), "prefix", "-g"], text=True)
    prefix = Path(stdout.strip()).resolve()
    require_dir(prefix, "npm global prefix")
    return prefix


def verify_global_npm_route(npm_prefix: Path) -> None:
    codex_cmd = npm_prefix / "codex.cmd"
    require_file(codex_cmd, "global npm codex.cmd")
    run_command([str(codex_cmd), "--version"], cwd=REPO_ROOT)
    run_command(
        [
            resolve_command("node"),
            "--input-type=module",
            "-e",
            "import('@cududa/codex-sdk').then(({ Codex }) => { new Codex(); console.log('sdk ok'); })",
        ],
        cwd=npm_prefix / "node_modules",
    )


def normalize_path(npm_prefix: Path) -> None:
    remove_path_entry("User", LEGACY_BIN_DIR)
    remove_path_entry("Machine", LEGACY_BIN_DIR)
    ensure_user_path_entry(npm_prefix)
    process_entries = split_path(os.environ.get("PATH", ""))
    process_entries = [entry for entry in process_entries if not same_path(entry, LEGACY_BIN_DIR)]
    if not any(same_path(entry, npm_prefix) for entry in process_entries):
        process_entries.insert(0, str(npm_prefix))
    os.environ["PATH"] = os.pathsep.join(process_entries)


def verify_process_codex_resolution(npm_prefix: Path) -> None:
    codex = shutil.which("codex")
    if codex is None:
        raise RuntimeError("codex is not resolvable after PATH normalization.")
    resolved = Path(codex).resolve()
    if not resolved.is_relative_to(npm_prefix):
        raise RuntimeError(f"codex resolves outside global npm after PATH normalization: {resolved}")
    print(f"codex resolves to {resolved}", flush=True)


def remove_path_entry(scope: str, path_to_remove: Path) -> None:
    value, value_type = read_windows_path(scope)
    entries = split_path(value)
    filtered = [entry for entry in entries if not same_path(entry, path_to_remove)]
    if filtered != entries:
        write_windows_path(scope, os.pathsep.join(filtered), value_type)


def ensure_user_path_entry(path_to_add: Path) -> None:
    value, value_type = read_windows_path("User")
    entries = split_path(value)
    if not any(same_path(entry, path_to_add) for entry in entries):
        entries.append(str(path_to_add))
        write_windows_path("User", os.pathsep.join(entries), value_type)


def read_windows_path(scope: str) -> tuple[str, int]:
    root, subkey = windows_path_key(scope)
    try:
        with winreg.OpenKey(root, subkey, 0, winreg.KEY_READ) as key:
            value, value_type = winreg.QueryValueEx(key, "Path")
            return str(value), int(value_type)
    except FileNotFoundError:
        return "", winreg.REG_EXPAND_SZ


def write_windows_path(scope: str, value: str, value_type: int) -> None:
    root, subkey = windows_path_key(scope)
    with winreg.OpenKey(root, subkey, 0, winreg.KEY_SET_VALUE) as key:
        winreg.SetValueEx(key, "Path", 0, value_type, value)


def windows_path_key(scope: str) -> tuple[int, str]:
    if scope == "User":
        return winreg.HKEY_CURRENT_USER, "Environment"
    if scope == "Machine":
        return winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment"
    raise ValueError(f"Unsupported PATH scope: {scope}")


def delete_legacy_install() -> None:
    delete_path_or_schedule(LEGACY_INSTALL_ROOT)


def delete_global_public_scope(npm_prefix: Path) -> None:
    delete_path_or_schedule(npm_prefix / "node_modules" / "@openai")


def delete_hidden_scope_cleanup_dirs(npm_prefix: Path, scope: str) -> None:
    scope_dir = npm_prefix / "node_modules" / scope
    if not scope_dir.is_dir():
        return
    for child in scope_dir.iterdir():
        if child.name.startswith("."):
            delete_path_or_schedule(child)


def delete_path_or_schedule(root: Path) -> None:
    if not root.exists():
        return
    running = running_processes_under(root)
    if running:
        details = ", ".join(f"{name}({pid})" for pid, name in running)
        schedule_delete_after_exit(root, running)
        print(
            f"Scheduled {root} for deletion after running Codex exits: {details}",
            flush=True,
        )
        return
    try:
        shutil.rmtree(root)
    except OSError:
        running_after_failure = running_processes_under(root)
        if not running_after_failure and root.name.startswith("."):
            running_after_failure = running_processes_under(root.parent)
        if running_after_failure:
            schedule_delete_after_exit(root, running_after_failure)
            details = ", ".join(f"{name}({pid})" for pid, name in running_after_failure)
            print(
                f"Scheduled {root} for deletion after running Codex exits: {details}",
                flush=True,
            )
            return
        raise


def schedule_delete_after_exit(root: Path, running: list[tuple[int, str]]) -> None:
    pids = ",".join(str(pid) for pid, _name in running)
    log_path = Path(os.environ.get("TEMP", str(REPO_ROOT))) / "codex-local-npm-route-cleanup.log"
    script = (
        "$ErrorActionPreference = 'SilentlyContinue'; "
        f"$pids = @({pids}); "
        "foreach ($pidToWait in $pids) { "
        "  $p = Get-Process -Id $pidToWait -ErrorAction SilentlyContinue; "
        "  if ($p) { Wait-Process -Id $pidToWait; } "
        "} "
        f"Remove-Item -LiteralPath {powershell_quote(str(root))} -Recurse -Force; "
        f"Add-Content -LiteralPath {powershell_quote(str(log_path))} -Value "
        f"{powershell_quote('deleted ' + str(root))};"
    )
    subprocess.run(
        [
            resolve_command("powershell"),
            "-NoProfile",
            "-Command",
            "Start-Process -WindowStyle Hidden powershell "
            f"-ArgumentList {powershell_quote('-NoProfile -Command ' + powershell_quote(script))}",
        ],
        check=True,
    )


def running_processes_under(root: Path) -> list[tuple[int, str]]:
    ps = (
        "Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and "
        "$_.ExecutablePath.StartsWith("
        f"{powershell_quote(str(root))}, [System.StringComparison]::OrdinalIgnoreCase) "
        "} | Select-Object ProcessId,Name | ConvertTo-Json"
    )
    stdout = subprocess.check_output(
        [resolve_command("powershell"), "-NoProfile", "-Command", ps],
        text=True,
    ).strip()
    if not stdout:
        return []
    value = cast(object, json.loads(stdout))
    if isinstance(value, list):
        rows = cast(list[object], value)
    else:
        rows = [value]
    result: list[tuple[int, str]] = []
    for row in rows:
        if isinstance(row, dict):
            process = cast(dict[str, object], row)
            pid = process.get("ProcessId")
            name = process.get("Name")
            if isinstance(pid, int) and isinstance(name, str):
                result.append((pid, name))
    return result


def split_path(value: str) -> list[str]:
    return [entry for entry in value.split(os.pathsep) if entry]


def same_path(left: str | Path, right: str | Path) -> bool:
    return os.path.normcase(os.path.normpath(str(left))) == os.path.normcase(os.path.normpath(str(right)))


def powershell_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def require_file(path: Path, label: str) -> None:
    if not path.is_file():
        raise FileNotFoundError(f"{label} not found: {path}")


def require_dir(path: Path, label: str) -> None:
    if not path.is_dir():
        raise FileNotFoundError(f"{label} not found: {path}")


def write_json(path: Path, value: object) -> None:
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(value, fh, indent=2)
        fh.write("\n")


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True)


def run_command(cmd: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> None:
    print("+", " ".join(str(part) for part in cmd), flush=True)
    command_env = os.environ.copy()
    if env is not None:
        command_env.update(env)
    subprocess.run(cmd, cwd=cwd, check=True, env=command_env)


def resolve_command(name: str) -> str:
    candidates = [name]
    if os.name == "nt" and not name.lower().endswith((".exe", ".cmd", ".bat", ".ps1")):
        candidates = [f"{name}.cmd", f"{name}.exe", f"{name}.bat", name]
    for candidate in candidates:
        resolved = shutil.which(candidate)
        if resolved:
            return resolved
    raise FileNotFoundError(f"Unable to find required command on PATH: {name}")


if __name__ == "__main__":
    raise SystemExit(main())
