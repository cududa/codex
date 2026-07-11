#!/usr/bin/env python3
"""Restore the local-release Cargo profile after upstream merges remove it."""

from __future__ import annotations

from pathlib import Path


LOCAL_RELEASE_PROFILE = """[profile.local-release]
inherits = "release"
# Local pinned builds install npm-style artifacts but skip upstream fat LTO
# so Windows ARM VMs do not need the full official release build footprint.
lto = false
codegen-units = 16
debug = "none"

"""


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    cargo_toml = repo_root / "codex-rs" / "Cargo.toml"
    contents = cargo_toml.read_text(encoding="utf-8")

    if "[profile.local-release]" in contents:
        print("local-release profile already present")
        return 0

    marker = "[profile.profiling]"
    if marker not in contents:
        raise RuntimeError(f"Could not find insertion marker in {cargo_toml}: {marker}")

    updated = contents.replace(marker, f"{LOCAL_RELEASE_PROFILE}{marker}", 1)
    cargo_toml.write_text(updated, encoding="utf-8", newline="")
    print(f"restored local-release profile in {cargo_toml}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
