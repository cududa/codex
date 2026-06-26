# Maintained Codex Review Workflow

This workflow is for maintaining a local Codex variant while regularly
reviewing incoming OpenAI Codex releases. The goal is to make each upstream
version comparison durable, repeatable, and reviewable commit-by-commit without
manually walking file diffs every time.

Review Dedeluger can benefit from this workflow because it receives a clean Git
range to ingest, but the workflow itself should stand on ordinary Git refs,
tags, and branches.

## Core Idea

Treat the local maintained Codex line as its own release line.

Do not compare an arbitrary local branch directly against an arbitrary upstream
branch unless the question really is "what differs between these two branch
tips?"

For release review, the better question is:

```text
Which upstream OpenAI Codex commits are incoming relative to our maintained
Codex version, and how should we handle each one?
```

Represent that question with explicit refs:

```text
base:   our maintained version tag
target: a history-preserving review branch with the upstream version merged
```

Example:

```text
base:   cududa-v0.130.0
target: review/openai-v0.131.0-on-cududa-v0.130.0
```

The target branch must preserve upstream commit history. Do not squash the
incoming release for this workflow, because Review Dedeluger is meant to review
the individual commits between the maintained baseline and the incoming version.

## Ref Naming

Use durable tags for local maintained versions:

```text
cududa-v0.130.0
cududa-v0.131.0
cududa-v0.132.0
```

Use upstream tags exactly as OpenAI publishes them:

```text
rust-v0.130.0
rust-v0.131.0
rust-v0.132.0
```

Use temporary review branches for incoming release comparisons:

```text
review/openai-v0.131.0-on-cududa-v0.130.0
review/openai-v0.132.0-on-cududa-v0.131.0
```

Use local working branches for actually adapting and landing your maintained
version:

```text
adapt/cududa-v0.131.0
adapt/cududa-v0.132.0
```

## One-Time Setup

Make sure the upstream remote points at the official OpenAI Codex repository:

```bash
git remote -v
git remote add upstream https://github.com/openai/codex.git
git fetch upstream --tags
```

If `upstream` already exists, update it:

```bash
git remote set-url upstream https://github.com/openai/codex.git
git fetch upstream --tags
```

## Tag The Maintained Baseline

When the current local branch represents your maintained version of a release,
tag it explicitly.

For example, if the current branch is your local maintained 0.130:

```bash
git switch main
git status
git tag cududa-v0.130.0
```

If you need to tag a specific commit instead:

```bash
git tag cududa-v0.130.0 <sha>
```

Before moving on, confirm the tag:

```bash
git show --stat cududa-v0.130.0
```

## Keep The Review Artifact Clean

Before creating or merging into a review branch, make sure unrelated local edits
are either committed, stashed, or otherwise kept out of the merge.

This matters especially for local workflow files, notes, or scratch changes
that may exist while preparing the review:

```bash
git status
git stash push -m "preserve local review notes" -- local/review_workflow/README.md
```

Only stash files that are unrelated to the review artifact. If a local change is
part of the maintained baseline, commit it first and tag that committed state.

## Create An Incoming Version Review Branch

Start from the local maintained baseline:

```bash
git switch -c review/openai-v0.131.0-on-cududa-v0.130.0 cududa-v0.130.0
```

Merge the official upstream version while preserving upstream history:

```bash
git merge --no-ff rust-v0.131.0
```

Do not use `git merge --squash`, `git cherry-pick --no-commit`, or patch
application for the review branch. Those can preserve the final file contents,
but they destroy the per-commit review surface.

If Git reports conflicts, resolve them and finish the merge. The resulting
branch should contain the upstream commits as ancestry, plus a merge commit if
one was needed.

This branch is a review artifact. It should answer:

```text
Which OpenAI Codex v0.131.0 commits are incoming relative to our maintained
v0.130.0, and what does each commit change?
```

Before using the branch for review, confirm the commit list is present:

```bash
git log --oneline --reverse cududa-v0.130.0..review/openai-v0.131.0-on-cududa-v0.130.0
```

This range should show the incoming upstream commit sequence, usually followed
by the merge commit if conflicts were resolved. Seeing many commits is expected.
If this shows only one applied-release commit, the branch is wrong for this
workflow.

Also confirm the upstream release tag is preserved in branch history:

```bash
git merge-base --is-ancestor rust-v0.131.0 review/openai-v0.131.0-on-cududa-v0.130.0
```

An exit code of `0` means the upstream release tag is an ancestor of the review
branch. Any other exit code means the branch does not preserve the upstream
release history correctly.

## Review The Incoming Version

The clean Git comparison is:

```bash
git diff --stat cududa-v0.130.0..review/openai-v0.131.0-on-cududa-v0.130.0
git diff cududa-v0.130.0..review/openai-v0.131.0-on-cududa-v0.130.0
```

The commit sequence to review is:

```bash
git log --oneline --reverse cududa-v0.130.0..review/openai-v0.131.0-on-cududa-v0.130.0
```

Review Dedeluger should ingest the same range:

```text
base:   cududa-v0.130.0
target: review/openai-v0.131.0-on-cududa-v0.130.0
```

That keeps Review Dedeluger focused on the real review question: the ordered
incoming commits and their changed files.

Review agents should use Review Dedeluger through its configured MCP workflow,
but that MCP server is only a client of the Review Dedeluger API. The API server
is the application owner of review state. If MCP reads or writes fail because
the Review Dedeluger server is not running, start the Review Dedeluger workspace
with `pnpm dev` or point the MCP server at the correct
`REVIEW_DEDELUGER_API_URL`. Do not recover by opening a local SQLite database
from the Codex workspace, switching to another database path, or re-ingesting
the version without explicit human direction.

## Adapt And Land The Maintained Version

After reviewing the incoming version, create an adaptation branch from the same
baseline:

```bash
git switch -c adapt/cududa-v0.131.0 cududa-v0.130.0
```

Bring in the reviewed upstream history and any local adaptations needed for
your maintained version. Depending on the situation, this can be a merge,
selected cherry-picks, or a branch based on the reviewed merge result.

The important rule is that the final adapted branch should represent the next
maintained local version:

```text
cududa v0.131.0 = OpenAI v0.131.0 plus our maintained local changes
```

When the adapted version is accepted:

```bash
git tag cududa-v0.131.0
```

The next cycle then starts from `cududa-v0.131.0`.

## Why Not Compare Directly Against upstream/main?

Directly comparing local `main` to `upstream/main` is useful for quick
orientation, but it is usually a poor durable release-review artifact.

It can mix together:

- upstream commits not yet reviewed
- local commits not present upstream
- release changes beyond the intended version
- merge-base surprises
- conflict-resolution noise
- branch maintenance history

For release review, prefer comparing a local maintained version tag to a
purpose-built history-preserving review branch.

## When To Use upstream/main

Use `upstream/main` when the goal is to preview the current official development
tip rather than a named release.

In that case, name the branch accordingly and preserve history:

```bash
git switch -c review/openai-main-on-cududa-v0.130.0 cududa-v0.130.0
git merge --no-ff upstream/main
```

Then compare:

```text
base:   cududa-v0.130.0
target: review/openai-main-on-cududa-v0.130.0
```

## Practical Checks

Before creating a review branch:

```bash
git fetch upstream --tags
git status
git tag --list "cududa-v*"
git tag --list "rust-v*"
```

Before ingesting or reviewing a range:

```bash
git rev-parse <base-ref>
git rev-parse <target-ref>
git diff --stat <base-ref>..<target-ref>
git log --oneline --reverse <base-ref>..<target-ref>
```

If the diff stat is unexpectedly enormous, stop and check whether the target is
a release tag, a main-branch tip, or a branch that includes unrelated local
work.

If the log shows a single commit that represents the whole incoming release,
stop. That branch collapsed the commit history and is not suitable for
commit-by-commit review.

Also verify that the upstream release tag is in the target branch history:

```bash
git merge-base --is-ancestor <upstream-release-tag> <target-ref>
```

For example:

```bash
git merge-base --is-ancestor rust-v0.131.0 review/openai-v0.131.0-on-cududa-v0.130.0
```

## Recover From A Bad Review Branch

If a review branch was created with a squash merge, patch application, or other
history-collapsing approach, delete it and recreate it from the maintained
baseline. Do not reuse it for commit-by-commit review.

For example:

```bash
git switch main
git branch -D review/openai-v0.131.0-on-cududa-v0.130.0
git switch -c review/openai-v0.131.0-on-cududa-v0.130.0 cududa-v0.130.0
git merge --no-ff rust-v0.131.0
```

Then rerun the practical checks before sending the branch to Review Dedeluger.

## Recommended Release Loop

1. Tag the current maintained version, such as `cududa-v0.130.0`.
2. Stash or commit unrelated local edits so the review artifact stays clean.
3. Fetch official upstream tags.
4. Create a review branch from the maintained tag.
5. Merge the official OpenAI version into that branch with history preserved.
6. Resolve conflicts and finish the merge if needed.
7. Confirm the incoming upstream commits are visible in `git log`.
8. Confirm the upstream release tag is an ancestor of the review branch.
9. Review the range from the maintained tag to the review branch.
10. Adapt and land the next maintained version.
11. Tag the result, such as `cududa-v0.131.0`.

This keeps each review anchored to a durable local baseline and a concrete
incoming upstream version while preserving the per-commit review surface.
