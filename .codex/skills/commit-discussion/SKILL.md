---
name: commit-discussion
description: Use when researching or discussing a particular upstream review commit in a Review Dedeluger version, especially when the user gives a commit SHA and wants comments, discussion threads, or replies added through the review-dedeluger MCP.
metadata:
  short-description: Research and discuss a Review Dedeluger commit using the review-dedeluger MCP
---

# Commit Discussion

Use this skill when the user asks you to inspect, research, comment on, or
discuss a particular commit in a Review Dedeluger version. This is focused
commit research and discussion work, not implementation.

The commit packet gives the local conversation surface. The user's question
gives the focus. The changed files, existing comments, discussions, linked
Review Findings, and nearby code are source material to inspect with care.

## MCP Route

For commit discussion work, use the Review Dedeluger MCP in this order:

1. Use `lookup_review_commit_by_sha` to resolve the SHA to the review commit.
2. Use `get_commit_review_packet` to inspect the commit files plus existing
   comments and discussions.
3. To add a new discussion, use `open_discussion_thread` with IDs from the
   packet.
4. To reply to an existing discussion, use `reply_to_discussion_thread` with
   the packet's `threadId` and optional `parentMessageId`.

Do not invent commit, file, thread, or comment IDs. Use IDs from the lookup and
packet.

## Source Order

Use sources in this order:

1. Current user instructions and the commit SHA or review commit target
2. The resolved Review Dedeluger review commit
3. The commit review packet, including changed files, comments, and discussions
4. Linked Review Findings, notes, concern areas, or remediation plans when the
   packet or user points to them
5. Applicable `AGENTS.md` files and user-named docs
6. Relevant implementation code, focused tests, generated artifacts, and
   external primary sources when needed

## Workflow

### 1. Resolve The Commit

Resolve the user-provided SHA with `lookup_review_commit_by_sha`.

Then retrieve the review packet with `get_commit_review_packet`.

Capture:

- commit title and SHA
- review mark or status, if present
- files changed
- existing comments and discussion threads
- linked findings or concern areas
- the user's specific question or requested discussion outcome

If the SHA cannot be resolved, pause and say the commit lookup is blocked.

### 2. Discussion Lock

Before broad repo inspection, state the discussion direction.

Use this checkpoint:

```markdown
## Discussion Lock

- Commit:
- Question:
- Packet context:
- Existing discussions:
- Linked findings:
- Initial source material:
- Exclusions:
- Expected output:
```

The discussion lock keeps the work tied to the commit and the user's question.
It does not need to answer the question yet.

### 3. Tree-Walk The Change

Start with the changed files and concepts in the packet. Follow types,
functions, modules, ownership boundaries, and linked findings until the commit's
effect has a shape.

Prefer this careful tree-walk before broad grep passes or test dives. Broad
search and tests are useful tools, but they can consume a lot of attention when
used before the mental model is warm.

Use tests as source material when they explain the changed behavior or the user
asks about test impact. Do not run tests merely to discover what the commit is
doing unless the user asks for that or a linked plan names a targeted command.

### 4. Inspect Source Material

Inspect only the material needed to understand the commit discussion:

- files and hunks from the packet
- existing inline comments and discussion threads
- linked Review Findings or remediation plans
- relevant local code around the changed files
- focused tests or snapshots that explain behavior
- maintained commits when the commit overlaps local intent
- external primary sources, if the question depends on outside facts

Keep the inquiry connected to the commit. If a nearby artifact starts pulling
the work toward a broader finding or implementation task, name that and return
to the discussion lock.

### 5. Write Or Reply

When the research produces a useful comment, use the packet IDs to update the
discussion surface the user requested.

Use `open_discussion_thread` when starting a new discussion on a file, hunk, or
commit target from the packet.

Use `reply_to_discussion_thread` when continuing an existing discussion. Use the
packet's `threadId`, and include `parentMessageId` when the reply belongs under
a specific message.

Write comments that are grounded in the commit and useful to a future reviewer.
Prefer concise claims with the relevant evidence and the question or requested
follow-up made clear.

### 6. Pause And Ask

Pause when proceeding would require changing the discussion route rather than
following it:

- the commit SHA cannot be resolved
- the packet is missing IDs needed to open or reply to a discussion
- the user's requested comment depends on source material not available in the
  packet, repo, MCP, or named docs
- existing discussions already cover the point and the right action is unclear
- answering would require implementation or broad verification the user did not
  request
- the commit appears to belong under a Review Finding review rather than a
  single-commit discussion

Use direct language: conflict, missing packet ID, missing context,
scope-changing ambiguity, implementation requested by the evidence, or better
handled as finding review.

### 7. Closeout

Close by reporting:

- commit reviewed
- packet material that mattered
- discussion opened or replied to, if any
- unresolved questions or assumptions
- tests not run, unless the user requested targeted verification

The desired posture is focused annotation: resolve the commit, understand the
change in context, and leave the discussion surface clearer for the next reader.
