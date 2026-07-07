import importlib.util
import json
import tarfile
import tempfile
import unittest
from types import SimpleNamespace
from unittest import mock
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parent / "stage_local_codex_sdk_bundle.py"
SPEC = importlib.util.spec_from_file_location("stage_local_codex_sdk_bundle", SCRIPT_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load {SCRIPT_PATH}")
stage_local = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(stage_local)


class StageLocalCodexSdkBundleTest(unittest.TestCase):
    def test_stage_codex_package_uses_canonical_private_no_sandbox_layout(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            staging_dir = tmp_dir / "package"
            codex_bin = tmp_dir / "codex.exe"
            rg_source = tmp_dir / "rg.exe"
            codex_bin.write_bytes(b"codex")
            rg_source.write_bytes(b"rg")

            stage_local.stage_codex_package(
                staging_dir,
                "0.133.0-cududa",
                codex_bin,
                rg_source,
            )

            package_root = staging_dir / "vendor" / stage_local.TARGET_TRIPLE
            metadata_path = package_root / "codex-package.json"
            with open(metadata_path, encoding="utf-8") as fh:
                metadata = json.load(fh)
            self.assertEqual(
                metadata,
                {
                    "layoutVersion": 1,
                    "version": "0.133.0-cududa",
                    "target": stage_local.TARGET_TRIPLE,
                    "variant": "codex",
                    "entrypoint": "bin/codex.exe",
                    "resourcesDir": "codex-resources",
                    "pathDir": "codex-path",
                },
            )

            self.assertTrue((package_root / "bin" / "codex.exe").is_file())
            self.assertTrue((package_root / "codex-path" / "rg.exe").is_file())
            self.assertTrue((package_root / "codex-resources").is_dir())
            self.assertTrue(
                (package_root / "codex-resources" / stage_local.NO_SANDBOX_RESOURCES_MARKER).is_file()
            )
            self.assertFalse((package_root / "codex-resources" / "codex-command-runner.exe").exists())
            self.assertFalse(
                (package_root / "codex-resources" / "codex-windows-sandbox-setup.exe").exists()
            )
            self.assertFalse((package_root / "codex" / "codex.exe").exists())
            self.assertFalse((package_root / "path" / "rg.exe").exists())

            with open(staging_dir / "package.json", encoding="utf-8") as fh:
                package_json = json.load(fh)
            self.assertEqual(package_json["name"], stage_local.CODEX_NPM_NAME)
            self.assertEqual(package_json["version"], "0.133.0-cududa")
            self.assertEqual(package_json["private"], True)
            self.assertEqual(package_json["files"], ["bin", "vendor"])
            self.assertNotIn("optionalDependencies", package_json)

    def test_stage_codex_package_reuses_canonical_staged_binary(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            staging_dir = tmp_dir / "package"
            package_root = staging_dir / "vendor" / stage_local.TARGET_TRIPLE
            staged_bin = package_root / "bin" / "codex.exe"
            rg_source = tmp_dir / "rg.exe"
            staged_bin.parent.mkdir(parents=True)
            (package_root / "codex").mkdir(parents=True)
            (package_root / "path").mkdir(parents=True)
            staged_bin.write_bytes(b"staged")
            (package_root / "codex" / "codex.exe").write_bytes(b"pre-v133")
            (package_root / "path" / "rg.exe").write_bytes(b"pre-v133-rg")
            rg_source.write_bytes(b"rg")

            stage_local.stage_codex_package(
                staging_dir,
                "0.133.0-cududa",
                tmp_dir / "unused-codex.exe",
                rg_source,
                copy_codex_binary=False,
            )

            self.assertEqual(staged_bin.read_bytes(), b"staged")
            self.assertTrue((package_root / "codex-path" / "rg.exe").is_file())
            self.assertFalse((package_root / "codex" / "codex.exe").exists())
            self.assertFalse((package_root / "path" / "rg.exe").exists())

    def test_npm_pack_preserves_codex_resources_directory(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            staging_dir = tmp_dir / "package"
            codex_bin = tmp_dir / "codex.exe"
            rg_source = tmp_dir / "rg.exe"
            pack_output = tmp_dir / "codex-npm-0.133.0-cududa.tgz"
            codex_bin.write_bytes(b"codex")
            rg_source.write_bytes(b"rg")

            stage_local.stage_codex_package(
                staging_dir,
                "0.133.0-cududa",
                codex_bin,
                rg_source,
            )
            stage_local.run_npm_pack(staging_dir, pack_output)

            with tarfile.open(pack_output, "r:gz") as package:
                names = set(package.getnames())

            package_root = f"package/vendor/{stage_local.TARGET_TRIPLE}"
            self.assertIn(
                f"{package_root}/codex-resources/{stage_local.NO_SANDBOX_RESOURCES_MARKER}",
                names,
            )
            self.assertNotIn(f"{package_root}/codex-resources/codex-command-runner.exe", names)
            self.assertNotIn(f"{package_root}/codex-resources/codex-windows-sandbox-setup.exe", names)

    def test_main_reuse_staged_package_does_not_require_external_codex_bin(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            output_dir = tmp_dir / "npm-local"
            staging_dir = output_dir / "packages" / "codex"
            package_root = staging_dir / "vendor" / stage_local.TARGET_TRIPLE
            staged_bin = package_root / "bin" / "codex.exe"
            rg_source = tmp_dir / "rg.exe"
            staged_bin.parent.mkdir(parents=True)
            (package_root / "codex").mkdir(parents=True)
            (package_root / "path").mkdir(parents=True)
            staging_dir.mkdir(parents=True, exist_ok=True)
            staged_bin.write_bytes(b"staged")
            (package_root / "codex" / "codex.exe").write_bytes(b"pre-v133")
            (package_root / "path" / "rg.exe").write_bytes(b"pre-v133-rg")
            rg_source.write_bytes(b"rg")
            (staging_dir / "package.json").write_text("{}", encoding="utf-8")

            args = SimpleNamespace(
                version="0.133.0-cududa",
                output_dir=output_dir,
                codex_bin=tmp_dir / "missing-codex.exe",
                rg_source=rg_source,
                reuse_codex_bin=True,
                skip_sdk_build=True,
                skip_local_install=True,
                skip_global_install=True,
                skip_path_normalization=True,
                skip_legacy_delete=True,
            )

            with (
                mock.patch.object(stage_local, "parse_args", return_value=args),
                mock.patch.object(stage_local, "run_npm_pack"),
                mock.patch.object(stage_local, "stage_sdk_package"),
                mock.patch.object(stage_local, "write_consumer_manifest"),
                mock.patch.object(stage_local, "write_pnpm_workspace"),
            ):
                self.assertEqual(stage_local.main(), 0)

            self.assertEqual(staged_bin.read_bytes(), b"staged")
            self.assertTrue((package_root / "codex-path" / "rg.exe").is_file())
            self.assertFalse((package_root / "codex" / "codex.exe").exists())
            self.assertFalse((package_root / "path" / "rg.exe").exists())


if __name__ == "__main__":
    unittest.main()
