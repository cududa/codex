# Maintained Codex Review Workflow

This workflow is for maintaining a local Codex variant while regularly
reviewing incoming OpenAI Codex releases. The goal is to make each upstream
version comparison durable, repeatable, and reviewable without manually walking
file diffs every time.

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
What would change if the next official OpenAI Codex version were applied to our
current maintained Codex version?
```

Represent that question with explicit refs:

```text
base:   our maintained version tag
target: an integration branch with the upstream version applied
```

Example:

```text
base:   cududa-v0.130.0
target: review/openai-v0.131.0-on-cududa-v0.130.0
```

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

## Create An Incoming Version Review Branch

Start from the local maintained baseline:

```bash
git switch -c review/openai-v0.131.0-on-cududa-v0.130.0 cududa-v0.130.0
```

Apply the official upstream version as a squash merge:

```bash
git merge --squash rust-v0.131.0
```

Resolve conflicts if Git reports any. Then commit the applied upstream release:

```bash
git commit -m "Apply OpenAI Codex v0.131.0 onto cududa v0.130.0"
```

This branch is a review artifact. It should answer:

```text
What would OpenAI Codex v0.131.0 add, remove, or change relative to our
maintained v0.130.0?
```

## Review The Incoming Version

The clean Git comparison is:

```bash
git diff --stat cududa-v0.130.0..review/openai-v0.131.0-on-cududa-v0.130.0
git diff cududa-v0.130.0..review/openai-v0.131.0-on-cududa-v0.130.0
```

Review Dedeluger should ingest the same conceptual range:

```text
base:   cududa-v0.130.0
target: review/openai-v0.131.0-on-cududa-v0.130.0
```

That keeps Review Dedeluger focused on the real review question instead of on
raw branch divergence.

## Adapt And Land The Maintained Version

After reviewing the incoming version, create an adaptation branch from the same
baseline:

```bash
git switch -c adapt/cududa-v0.131.0 cududa-v0.130.0
```

Bring in the reviewed upstream application. Depending on the situation, this
can be a merge, cherry-pick, or manual application of the reviewed result.

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
orientation, but it is usually a poor durable review artifact.

It can mix together:

- upstream commits not yet reviewed
- local commits not present upstream
- release changes beyond the intended version
- merge-base surprises
- conflict-resolution noise
- branch maintenance history

For release review, prefer comparing a local maintained version tag to a
purpose-built integration branch.

## When To Use upstream/main

Use `upstream/main` when the goal is to preview the current official development
tip rather than a named release.

In that case, name the branch accordingly:

```bash
git switch -c review/openai-main-on-cududa-v0.130.0 cududa-v0.130.0
git merge --squash upstream/main
git commit -m "Apply OpenAI Codex upstream main onto cududa v0.130.0"
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
```

If the diff stat is unexpectedly enormous, stop and check whether the target is
a release tag, a main-branch tip, or a branch that includes unrelated local
work.

## Recommended Release Loop

1. Tag the current maintained version, such as `cududa-v0.130.0`.
2. Fetch official upstream tags.
3. Create a review branch from the maintained tag.
4. Squash-merge the official OpenAI version into that branch.
5. Resolve conflicts and commit the review artifact.
6. Review the range from the maintained tag to the review branch.
7. Adapt and land the next maintained version.
8. Tag the result, such as `cududa-v0.131.0`.

This keeps each review anchored to a durable local baseline and a concrete
incoming upstream version.

