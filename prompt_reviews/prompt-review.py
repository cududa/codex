#!/usr/bin/env python3

from __future__ import annotations

import argparse
import difflib
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


PROMPT_REVIEWS_DIR = "prompt_reviews"
SCHEMA = "prompt-review/v1"


@dataclass(frozen=True)
class CommitInfo:
    sha: str
    short_sha: str
    parent_sha: str
    subject: str


@dataclass(frozen=True)
class Target:
    name: str
    path: str
    start_line: int | None
    end_line: int | None


@dataclass(frozen=True)
class Block:
    kind: str
    block_id: str
    before_start: int | None
    before_end: int | None
    after_start: int | None
    after_end: int | None
    before_lines: list[str]
    after_lines: list[str]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract explicit before/after prompt text into review docs."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    extract_parser = subparsers.add_parser("extract", help="extract explicit prompt targets")
    extract_parser.add_argument("commit", help="commit, tag, or ref to compare with its parent")
    extract_parser.add_argument(
        "targets",
        nargs="+",
        help="target as name=path or name=path:start-end",
    )
    extract_parser.add_argument(
        "--root",
        default=PROMPT_REVIEWS_DIR,
        help=f"artifact root directory (default: {PROMPT_REVIEWS_DIR})",
    )

    comment_parser = subparsers.add_parser("comment", help="append a structured comment")
    comment_parser.add_argument("review", help="path to a .prompt-review.md file")
    comment_parser.add_argument("--target", required=True, help="block id, e.g. change-001")
    comment_parser.add_argument("--body", required=True)
    comment_parser.add_argument("--author", default="agent")
    comment_parser.add_argument("--status", default="open")
    comment_parser.add_argument(
        "--type",
        choices=("block", "string", "lines"),
        default="block",
        help="anchor type (default: block)",
    )
    comment_parser.add_argument("--side", choices=("before", "after"))
    comment_parser.add_argument("--text", help="exact text for string anchors")
    comment_parser.add_argument("--occurrence", type=int, default=1)
    comment_parser.add_argument("--start", type=int, help="start line for line anchors")
    comment_parser.add_argument("--end", type=int, help="end line for line anchors")

    args = parser.parse_args()
    if args.command == "extract":
        return extract(args.commit, args.targets, Path(args.root))
    if args.command == "comment":
        return append_comment(args)
    raise AssertionError(f"unhandled command {args.command}")


def extract(commitish: str, target_specs: list[str], artifact_root: Path) -> int:
    repo_root = Path(run_git("rev-parse", "--show-toplevel").strip())
    commit = commit_info(commitish)
    commit_dir = repo_root / artifact_root / commit.short_sha
    commit_dir.mkdir(parents=True, exist_ok=True)

    outputs: list[Path] = []
    for spec in target_specs:
        target = parse_target(spec)
        before = git_show_text(commit.parent_sha, target.path)
        after = git_show_text(commit.sha, target.path)
        if before is None and after is None:
            print(f"target path not found in before or after: {target.path}", file=sys.stderr)
            return 1

        before_lines = selected_lines(before or "", target)
        after_lines = selected_lines(after or "", target)
        line_offset = (target.start_line or 1) - 1
        blocks = diff_blocks(before_lines, after_lines, line_offset)
        output = commit_dir / f"{slugify(target.name)}.prompt-review.md"
        output.write_text(
            render_review(commit, target, blocks),
            encoding="utf-8",
            newline="\n",
        )
        outputs.append(output)

    print(f"Wrote {len(outputs)} prompt review file(s):")
    for output in outputs:
        print(path_for_display(output, repo_root))
    return 0


def parse_target(spec: str) -> Target:
    if "=" not in spec:
        raise SystemExit(f"target must be name=path or name=path:start-end: {spec}")
    name, location = spec.split("=", 1)
    name = name.strip()
    if not name:
        raise SystemExit(f"target name is empty: {spec}")

    path = location
    start_line = None
    end_line = None
    range_match = re.search(r":(?P<start>[0-9]+)(?:-(?P<end>[0-9]+))?$", location)
    if range_match:
        path = location[: range_match.start()]
        start_line = int(range_match.group("start"))
        end_line = int(range_match.group("end") or start_line)
        if end_line < start_line:
            raise SystemExit(f"target line range ends before it starts: {spec}")
    path = path.strip().replace("\\", "/")
    if not path:
        raise SystemExit(f"target path is empty: {spec}")
    return Target(name=name, path=path, start_line=start_line, end_line=end_line)


def selected_lines(text: str, target: Target) -> list[str]:
    lines = text.splitlines()
    if target.start_line is None:
        return lines
    start_index = max(target.start_line - 1, 0)
    end_index = min(target.end_line or target.start_line, len(lines))
    return lines[start_index:end_index]


def diff_blocks(before: list[str], after: list[str], line_offset: int) -> list[Block]:
    matcher = difflib.SequenceMatcher(a=before, b=after, autojunk=False)
    blocks: list[Block] = []
    same_count = 0
    change_count = 0

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            same_count += 1
            kind = "same"
            block_id = f"same-{same_count:03d}"
        else:
            change_count += 1
            kind = "change"
            block_id = f"change-{change_count:03d}"

        blocks.append(
            Block(
                kind=kind,
                block_id=block_id,
                before_start=line_number_or_none(i1, i2, line_offset),
                before_end=line_number_or_none(i2 - 1, i2, line_offset),
                after_start=line_number_or_none(j1, j2, line_offset),
                after_end=line_number_or_none(j2 - 1, j2, line_offset),
                before_lines=before[i1:i2],
                after_lines=after[j1:j2],
            )
        )

    return blocks


def line_number_or_none(index: int, end: int, line_offset: int) -> int | None:
    if end <= index:
        return None
    return index + line_offset + 1


def render_review(commit: CommitInfo, target: Target, blocks: list[Block]) -> str:
    lines = [
        "---",
        f"schema: {SCHEMA}",
        f"commit: {commit.sha}",
        f"parent: {commit.parent_sha}",
        f"shortCommit: {commit.short_sha}",
        f"subject: {yaml_scalar(commit.subject)}",
        f"target: {yaml_scalar(target.name)}",
        "source:",
        f"  before: {commit.parent_sha}:{target.path}",
        f"  after: {commit.sha}:{target.path}",
    ]
    if target.start_line is not None:
        lines.extend(
            [
                "selection:",
                f"  startLine: {target.start_line}",
                f"  endLine: {target.end_line}",
            ]
        )
    lines.extend(["---", "", f"# {target.name}", ""])

    for block in blocks:
        lines.extend(render_block(block))

    lines.extend(
        [
            "## Comments",
            "",
            "<!--",
            "Append comments with:",
            "python prompt_reviews/prompt-review.py comment <file> --target change-001 --type block --body \"...\"",
            "",
            "Supported anchors:",
            "  type: block  + target",
            "  type: string + target + side + text + occurrence",
            "  type: lines  + target + side + start + end",
            "-->",
            "",
        ]
    )
    return "\n".join(lines)


def render_block(block: Block) -> list[str]:
    title = "Same" if block.kind == "same" else "Changed"
    lines = [
        f"## {title} `{block.block_id}`",
        "",
        "<!--",
        f"id: {block.block_id}",
        f"kind: {block.kind}",
        f"beforeLines: {range_for_display(block.before_start, block.before_end)}",
        f"afterLines: {range_for_display(block.after_start, block.after_end)}",
        "-->",
        "",
    ]

    if block.kind == "same":
        fence = fence_for(block.before_lines)
        lines.append(f"{fence}text id={block.block_id} side=both")
        lines.extend(block.before_lines)
        lines.extend([fence, ""])
        return lines

    diff_lines = [f"- {line}" for line in block.before_lines]
    diff_lines.extend(f"+ {line}" for line in block.after_lines)
    fence = fence_for(diff_lines)
    lines.append(f"{fence}diff id={block.block_id}")
    lines.extend(diff_lines)
    lines.extend([fence, ""])
    return lines


def append_comment(args: argparse.Namespace) -> int:
    review_path = Path(args.review)
    if not review_path.is_file():
        print(f"review file not found: {review_path}", file=sys.stderr)
        return 1

    validate_comment_args(args)
    text = review_path.read_text(encoding="utf-8")
    comment_id = next_comment_id(text)
    block = render_comment_block(args, comment_id)
    review_path.write_text(text.rstrip() + "\n\n" + block, encoding="utf-8", newline="\n")
    print(f"Added comment {comment_id} to {review_path}")
    return 0


def validate_comment_args(args: argparse.Namespace) -> None:
    if args.type in {"string", "lines"} and args.side is None:
        raise SystemExit(f"{args.type} comments require --side")
    if args.type == "string" and not args.text:
        raise SystemExit("string comments require --text")
    if args.type == "lines" and (args.start is None or args.end is None):
        raise SystemExit("line comments require --start and --end")
    if args.type == "lines" and args.end < args.start:
        raise SystemExit("--end must be greater than or equal to --start")


def render_comment_block(args: argparse.Namespace, comment_id: str) -> str:
    lines = [
        "```comment",
        f"id: {comment_id}",
        "anchor:",
        f"  type: {args.type}",
        f"  target: {args.target}",
    ]
    if args.side:
        lines.append(f"  side: {args.side}")
    if args.type == "string":
        lines.append(f"  text: {yaml_scalar(args.text)}")
        lines.append(f"  occurrence: {args.occurrence}")
    if args.type == "lines":
        lines.append(f"  start: {args.start}")
        lines.append(f"  end: {args.end}")
    lines.extend(
        [
            f"author: {yaml_scalar(args.author)}",
            f"status: {yaml_scalar(args.status)}",
            "body: |",
        ]
    )
    lines.extend(f"  {line}" if line else "" for line in args.body.splitlines())
    lines.extend(["```", ""])
    return "\n".join(lines)


def next_comment_id(text: str) -> str:
    highest = 0
    for match in re.finditer(r"^id:\s*c(?P<num>[0-9]+)\s*$", text, re.MULTILINE):
        highest = max(highest, int(match.group("num")))
    return f"c{highest + 1:03d}"


def commit_info(commitish: str) -> CommitInfo:
    sha = run_git("rev-parse", commitish).strip()
    parents = run_git("rev-list", "--parents", "-n", "1", sha).strip().split()
    if len(parents) < 2:
        raise SystemExit(f"{sha} has no parent; nothing to compare")
    subject = run_git("show", "-s", "--format=%s", sha).strip()
    short_sha = run_git("rev-parse", "--short=10", sha).strip()
    return CommitInfo(
        sha=sha,
        short_sha=short_sha,
        parent_sha=parents[1],
        subject=subject,
    )


def git_show_text(commit: str, path: str) -> str | None:
    result = subprocess.run(
        ["git", "show", f"{commit}:{path}"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        return None
    return result.stdout


def run_git(*args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return result.stdout


def yaml_scalar(value: str | None) -> str:
    if value is None:
        return '""'
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def fence_for(lines: list[str]) -> str:
    longest = 2
    for line in lines:
        for match in re.finditer(r"`+", line):
            longest = max(longest, len(match.group(0)))
    return "`" * (longest + 1)


def range_for_display(start: int | None, end: int | None) -> str:
    if start is None or end is None:
        return "none"
    if start == end:
        return str(start)
    return f"{start}-{end}"


def slugify(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9_.-]+", "-", value.strip())
    slug = re.sub(r"-{2,}", "-", slug).strip("-._")
    return slug[:80] or "prompt"


def path_for_display(path: Path, repo_root: Path) -> str:
    try:
        return str(path.relative_to(repo_root))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    raise SystemExit(main())
