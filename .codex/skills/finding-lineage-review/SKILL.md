---
name: finding-lineage-review
description: Use when a new Review Dedeluger version creates or duplicates a Review Finding from prior lineage, and the task is to review incoming upstream commits against maintained local intent before drafting artifact treatments or a remediation plan.
metadata:
  short-description: Review new-version findings against maintained local intent using the review-dedeluger MCP
---

# Finding Lineage Review

Use this skill when a Review Finding has been carried into a new version because
incoming upstream commits overlap with maintained local work. The new finding is
a starting hypothesis, not finished truth.

The task is to decide how local intent should travel into the new version.

The prior finding carries lineage. Maintained commits show how the intent has
been embodied locally. The new relevant commits show incoming pressure. The
review decides which incoming shapes to accept, adapt, reject, defer, or bring
back for discussion.

## Source Order

Use sources in this order:

1. Current user instructions
2. The new version's Review Finding
3. Prior findings in the same lineage
4. Maintained commits linked to the lineage
5. The new version's relevant upstream commits
6. Artifact treatments, notes, discussions, and concern areas
7. Applicable `AGENTS.md` files and user-named docs
8. Existing code, generated files, parked diffs, tests, and historical artifacts
   as review terrain

Do not treat the prior finding text as finished truth for the new version. Treat
it as lineage context to re-check against the incoming commits.

## Workflow

### 1. Retrieve The Lineage

Retrieve the new Review Finding through the Review Dedeluger MCP.

Gather:

- the prior finding or findings in the lineage
- maintained commits linked to the lineage
- same-version related findings
- notes, discussions, and concern areas
- any existing remediation plan
- attached relevant upstream commits for the new version

Capture the durable intent, local contract, non-goals, and the reason this
finding exists in the new version.

### 2. Lineage Review Lock

Before broad repo inspection, state the review direction.

Use this checkpoint:

```markdown
## Lineage Review Lock

- New finding:
- Prior lineage:
- Durable intent:
- Local embodiment:
- Incoming commits:
- Artifact status:
- Review question:
- Exclusions:
- Expected output:
```

`Local embodiment` means where the intent currently lives. It does not mean the
current file layout, helper shape, ownership shape, or API surface is
automatically preferred.

### 3. Understand The Local Intent

Read the prior finding lineage and maintained commits to understand the "what"
of the local work before deciding the "how" of the new version.

Look for:

- the invariant that must survive
- the role or boundary that carries the behavior
- local contracts and non-goals
- why prior upstream shapes were accepted, adapted, rejected, or deferred
- how the current local code embodies the intent

The question is not "how do we keep old code?" The question is "what local
intent must remain visible as this version changes?"

### 4. Review Incoming Terrain

Inspect the upstream commits attached to the new finding. Focus on the commits
and files that overlap with the maintained intent.

Classify incoming shapes:

- accept as-is
- adapt to carry local intent
- reject for this version
- defer as future-upstream context
- needs discussion
- out of scope

Do not treat upstream as automatically correct. Do not treat local code as
automatically preferred. Compare both against the durable intent and the user's
current direction.

### 5. Classify Artifacts

Name the status of important artifacts before drafting the review result:

- live local code
- maintained commits
- incoming upstream commits
- parked incoming blocks or preserved diffs
- generated files
- tests and snapshots
- prior finding text
- future-version notes
- existing remediation plans

Artifact status is the map legend. It helps the agent decide which stratum is
source material for this version and which is background context.

### 6. Draft The Review Result

Update Review Dedeluger only after the direction is clear.

Possible outputs:

- update finding intent, local contract, conflict, or concern areas
- create or update artifact treatments
- add notes or discussion summaries
- link related findings
- draft or update a remediation plan
- summarize why no implementation is needed
- ask the user to resolve a specific review question

The review result should explain how the local intent travels into the new
version, including which incoming shapes should carry it.

### 7. Pause And Ask

Pause when proceeding would require changing the review route rather than
following it:

- the new finding or prior lineage cannot be retrieved
- maintained commits are missing or unclear
- upstream relevant commits do not appear to overlap the stated intent
- prior finding text and maintained code point to different local contracts
- artifact status cannot be classified from the available source material
- the right outcome depends on a product or architecture decision not already
  present in the finding lineage

Use direct language: conflict, missing lineage, unclear local embodiment,
scope-changing ambiguity, missing artifact status, or needs user decision.

### 8. Verification

For lineage review, verification means checking the review result against:

- the new finding
- prior lineage
- maintained commits
- incoming upstream commits
- artifact treatments
- concern areas and non-goals
- any user-requested output

Do not run broad tests during lineage review unless the user explicitly asks.
Targeted test reading can help understand behavior. Test execution belongs to
implementation or verification work once a remediation route exists.

Close by reporting:

- reviewed finding and prior lineage
- incoming commits or files that mattered
- artifact classifications made
- Review Dedeluger updates performed
- unresolved questions
- whether tests were not run

The desired posture is calm continuity: understand the intent, study the new
incoming shape, and leave a route another agent can trust.
