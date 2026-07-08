#!/usr/bin/env python3
"""Remove explicit Git fetch refspecs for remote branches that no longer exist."""

from __future__ import annotations

import argparse
import subprocess
import sys


def run_git(args: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        check=check,
        encoding="utf-8",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def get_fetch_refspecs(remote: str) -> list[str]:
    result = run_git(["config", "--get-all", f"remote.{remote}.fetch"], check=False)
    if result.returncode not in (0, 1):
        raise RuntimeError(result.stderr.strip())
    return [line for line in result.stdout.splitlines() if line]


def get_remote_branches(remote: str) -> set[str]:
    result = run_git(["ls-remote", "--heads", remote])
    branches = set()
    for line in result.stdout.splitlines():
        _sha, ref = line.split(maxsplit=1)
        branches.add(ref.removeprefix("refs/heads/"))
    return branches


def branch_from_explicit_refspec(refspec: str, remote: str) -> str | None:
    source, separator, destination = refspec.removeprefix("+").partition(":")
    if not separator:
        return None

    source_prefix = "refs/heads/"
    destination_prefix = f"refs/remotes/{remote}/"
    if not source.startswith(source_prefix) or not destination.startswith(destination_prefix):
        return None

    branch = source.removeprefix(source_prefix)
    destination_branch = destination.removeprefix(destination_prefix)
    if branch == "*" or destination_branch == "*" or branch != destination_branch:
        return None

    return branch


def remove_refspec(remote: str, refspec: str) -> None:
    run_git(["config", "--unset", "--fixed-value", f"remote.{remote}.fetch", refspec])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Remove stale explicit remote fetch refspecs left behind after review "
            "branches are merged and deleted."
        )
    )
    parser.add_argument(
        "remote",
        nargs="?",
        default="origin",
        help="Git remote to inspect. Defaults to origin.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show stale refspecs without changing Git config.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    refspecs = get_fetch_refspecs(args.remote)
    if not refspecs:
        print(f"No fetch refspecs found for remote {args.remote!r}.", file=sys.stderr)
        return 1

    remote_branches = get_remote_branches(args.remote)
    stale_refspecs = []
    for refspec in refspecs:
        branch = branch_from_explicit_refspec(refspec, args.remote)
        if branch is not None and branch not in remote_branches:
            stale_refspecs.append((branch, refspec))

    if not stale_refspecs:
        print(f"No stale explicit fetch refspecs found for {args.remote}.")
        return 0

    action = "Would remove" if args.dry_run else "Removing"
    for branch, refspec in stale_refspecs:
        print(f"{action} stale refspec for {args.remote}/{branch}: {refspec}")
        if not args.dry_run:
            remove_refspec(args.remote, refspec)

    if not args.dry_run:
        print(f"Removed {len(stale_refspecs)} stale refspec(s) from {args.remote}.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
