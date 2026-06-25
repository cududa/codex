# Codex Review Orientation

This document orients agents reviewing upstream Codex commits through Review
Dedeluger MCP access. It teaches the review posture and judgment this workflow
needs. It does not duplicate the concern-area catalog, replace tool output, or
turn routing hints into conclusions.

The review is about noticing changes that may alter the working cadence between
a user, Codex, and the harness. Small changes to prompts, hidden context,
message roles, continuation behavior, tool affordances, permissions, or context
recovery can materially affect how the agent understands and carries work across
turns.

Many upstream commits are improvements. The work is not to search for bad
commits. The work is to notice behaviorally meaningful changes early enough that
the user can understand, adapt to, or modify them before accepting an upstream
version.

## Purpose

Review each assigned commit through this question:

```text
Could this commit change how Codex understands instructions, sees context,
assigns authority, continues work, uses tools, requests permission, or interprets
the user's intent?
```

This lens is broader than any one concern area. A commit can be relevant to an
important surface and still be a clear improvement. A commit can also look small
in line count while changing the model-visible prompt, the tool schema the model
chooses from, or the continuation path that resumes work without a fresh user
turn.

The useful review result is a calm explanation of what the commit is, what it
changes, what behavior path it touches, and whether any uncertainty remains.

## Working From Broad To Focused

The initial queue can contain hundreds of commits. Start with compact routing
context, then narrow into focused commit packets.

Use routing cards to understand:

- Commit order, title, short SHA, and message excerpt
- Current review mark and current concern areas
- File count and line additions/removals
- Changed path prefixes and compact changed-file summaries
- Existing agent-review and review-note counts

Routing cards help size and assign work. They do not prove concern relevance.
They also do not show enough detail to decide a commit. Use the focused review
packet before recording judgment.

Use focused packets to inspect:

- Full commit message and commit metadata
- Changed files in persisted order
- Diff artifacts and source anchors for the assigned files
- Existing agent reviews, notes, discussions, and plan metadata
- The canonical concern-area catalog entries available for evaluation

Review Dedeluger MCP access is an API-backed workflow surface. The MCP server
should be treated as a thin client for curated review actions and resources,
with the Review Dedeluger API server as the only application process that owns
review state. If MCP access fails because the API server is not running, stop
and ask for the Review Dedeluger workspace to be started, normally with
`pnpm dev`. Do not compensate by reading or writing SQLite directly, trying a
different database path, or re-ingesting a version from the Codex workspace.

When a commit is large, follow the behavior path far enough to understand the
review lens. Large generated files or mechanical moves may be supporting
context. Small prompt, role, permission, or tool-schema changes may deserve the
closest reading.

## Concern Areas As Human Reasons

The tooling may surface concern areas. Treat them as paths into the work, not as
the answer.

`harness-prompts` matters because model-visible wording, prompt selection, and
instruction order can change the agent's posture, persistence, or interpretation
of user intent.

`message-roles` matters because role assignment controls authority and
visibility. A change in whether content is treated as system, developer, user,
assistant, or a role-like phase can change how strongly Codex should follow it.

`hidden-context` matters because harness-injected context should not be confused
with ordinary user turns. Changes here can affect transcript parsing, replay,
rollback, compaction, or what the model sees as current user intent.

`goal-continuation` matters because active goals can cause Codex to resume work
without a fresh user message. Changes here affect whether that continuation
feels aligned, persistent, and appropriately bounded.

`goal-behavior` matters because goal creation, editing, completion, pausing,
budgeting, and display shape how the user steers ongoing work.

`context-compaction` matters because summarization, truncation, rollback,
resume, and reconstruction determine what continuity survives across long
threads and context pressure.

`tool-affordances` matters because tool names, descriptions, schemas,
availability, mutability, routing, and result shapes affect what the model can
do and how confidently it can choose the right action.

`none-apply` is the explicit review result for commits that do not touch a
canonical concern area after inspection.

## Inspection Pattern

Start by reading the commit's stated purpose. Then inspect the files that could
affect the review lens.

Ask:

- What user-visible, model-visible, or workflow-visible path does this change?
- Does the change affect what Codex is told, what it sees, or what it can do?
- Does it alter a continuation, permission, compaction, replay, or tool-selection
  path?
- Is the interesting change in hand-written source, generated schema output,
  tests, prompt templates, or a combination?
- Is this merely near a concern area, or does it actually affect the concern
  area's behavior?

Do not stop at filenames when behavior is unclear. A seed-path or title match is
an invitation to inspect, not a conclusion.

Do not over-read ordinary implementation churn. A large refactor can pass when
the behavior path is preserved. A small wording change can remain flagged when
it changes model-visible instructions and the effect needs human attention.

## Decision Shape

Use review states to record current judgment, not to score whether the upstream
commit is good or bad.

Use `PASS` when the commit has been reviewed under this lens and no follow-up is
needed.

Use `PASS` with one or more concern areas only when the commit is relevant to
those areas, the behavior is understood, and the change is narrow enough that no
human or downstream maintainer follow-up is needed.

Use `FLAG` when human attention, downstream maintainer attention, more context,
another agent pass, or a clearer explanation is still needed.

Concern-area relevance is not failure. A commit can touch an important surface,
be fully understood, and pass.

Understanding a change is not by itself enough to pass it. Keep a commit flagged
when it materially changes the architecture, ownership, persistence model,
metadata flow, API boundary, or execution path for a concern area. These changes
may affect local patches or mechanisms maintained by other agents even when the
upstream implementation appears intentional and correct.

For the initial upstream review, `FLAG` means "maintenance-relevant behavior
changed and should stay visible." It does not mean the commit is bad.

For this initial pass, do not use human approval. Do not make a stronger review
state assertion unless the active workflow explicitly asks for it.

## Note Style

Prefer evidence-first, measured language. The note should help the human see
what the commit is, what it changes, why it matters to the review lens, and what
uncertainty remains.

Every reviewed commit should have a commit-scoped review note. The note is not
only a concern-area justification. Start with the reviewer agent's plain-language
read of the focused packet: what this commit appears to be doing and what changed.
Then state whether that change touches a canonical concern area or why
`none-apply` is appropriate.

Useful note shapes:

- `This commit is...`
- `This changes...`
- `This may affect...`
- `I did not find...`
- `I am leaving this flagged because...`

Good notes avoid dramatizing routine work. They also avoid hiding uncertainty.
If the commit needs a second pass, say what part needs the second pass.

Examples of useful phrasing:

- `This changes the default mutability assumption for unknown contributed tools.
  I reviewed it under tool-affordances because it can affect whether Codex treats
  a tool call as requiring more caution.`
- `This moves memory prompt injection from session construction into an
  app-server extension. I did not find a prompt wording change in this packet,
  but the injection path changed, so I am leaving the prompt-surface concern
  visible.`
- `This appears to be generated schema churn around permission profile shape.
  The behavioral question is whether workspace roots replace the previous
  profile modifications path; that needs a focused permissions pass.`

## Review Posture

Be curious about the commit's purpose, precise about evidence, and gentle about
uncertainty. The aim is to give the human a useful map of behaviorally
meaningful changes, not to dramatize routine implementation work.

Firm boundaries support good judgment:

- Agents do not approve commits.
- Agents do not turn routing hints into conclusions.
- Agents do not mark uncertainty as certainty.
- Agents leave useful uncertainty visible in a note.
- Agents record concern areas because the commit touches the review lens, not
  because the commit is bad.
- Agents use `none-apply` only after checking that no canonical concern area
  applies.

## Representative Commit Shapes

Use these shapes as examples of how to think, not as a fixed checklist.

### Documentation Or AGENTS Guidance

Example shape: a small commit clarifies `AGENTS.md` or docs folder guidance.

Review question: does this change model-visible repository guidance, or is it
ordinary documentation cleanup?

Likely outcome: `PASS` with `none-apply` when it only clarifies docs ownership
and does not change model-facing task behavior. Use a concern area only if the
guidance changes what agents are told to do or where authority lives.

### Tool Default Or Tool Schema Change

Example shape: a small commit changes the default for unknown contributed tools
from non-mutating to mutating.

Review question: does this change how Codex exposes, selects, pauses for, or
executes tools?

Likely outcome: `PASS` with `tool-affordances` if the behavior is understood and
the new default is intentional. Use `FLAG` if the effect on permission prompts,
parallel execution, or model-visible tool descriptions remains unclear.

### Goal Continuation And Hidden Context

Example shape: a commit changes goal continuation prompts, hidden goal context,
or the role used for injected continuation messages.

Review question: does this change how active goals resume work, how continuation
is represented in transcript history, or whether goal steering is visible as an
ordinary user turn?

Likely outcome: often at least `goal-continuation`; possibly `hidden-context`,
`message-roles`, or `harness-prompts` when those paths are directly touched.
Use `FLAG` when the prompt role, hidden-context filtering, or continuation
ordering needs human review.

### Large MCP Or Tool Plumbing Refactor

Example shape: many files simplify MCP tool handler plumbing or move tool
executor interfaces.

Review question: what behavior changed after the plumbing move? Look for tool
name resolution, schema serialization, mutability, parallel-call support,
missing-tool handling, routing, or result shape changes.

Likely outcome: `PASS` with `tool-affordances` when behavior is preserved or the
change is understood. Use `FLAG` for large refactors when the focused packet
shows model-visible tool behavior changed but the effect is not yet clear.

### Permissions Or Workspace Roots

Example shape: permission profile changes touch app-server protocol schemas,
TUI state, core config, and execution policy.

Review question: does this change when Codex proceeds, pauses, requests
permission, resolves workspace roots, or describes sandbox state to the model?

Likely outcome: concern areas may include `tool-affordances`, `hidden-context`,
or a permissions-oriented review note depending on the exact path. Generated
schema churn alone is not enough; find the source behavior behind it.

### Prompt Injection Ownership Move

Example shape: memory prompt injection moves from core session construction into
an app-server extension.

Review question: does the model-visible prompt text, injection ordering,
feature gating, or config source change?

Likely outcome: `PASS` with `harness-prompts` if the prompt behavior is
equivalent and the ownership move is clear. Use `FLAG` if injection order,
extension loading, or feature gating could alter what Codex sees.

### Removed Legacy Helper

Example shape: a helper for legacy permissions instructions is removed.

Review question: is the helper truly unused, or did it provide a fallback path
that still matters to model-visible permissions instructions?

Likely outcome: `PASS` when callers and tests show the legacy path is gone.
Use `FLAG` if the removal may leave a launch mode, profile path, or permission
summary without equivalent instruction construction.
