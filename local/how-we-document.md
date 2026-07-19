# How We Document Feature Areas

This guide describes the default documentation shape for substantial feature
areas in this fork. Use it when creating or replacing authority docs before
implementation, review, or major maintenance work.

The goal is not to create more documents. The goal is to create a live reader
surface that lets agents distinguish intended behavior from current terrain,
temporary planning notes, and historical implementation shape.

## Core Rule

Document feature areas by ownership seams and reader jobs.

Do not document by source-file order, historical implementation order,
planning-packet shape, workstream order, or the topology of old docs unless
the seam independently requires that shape.

Current code is terrain. It helps locate the work, but it does not decide the
desired authority model.

## Reader Jobs

A finished documentation set should let these readers succeed:

- Implementation agent: find what to build, where authority lives, what not
  to infer from current code, and which files are likely terrain.
- Planning agent: identify seams, dependencies, sequencing constraints, and
  stop conditions without inventing architecture.
- Reviewer: check behavior, ownership, proof, and regression risk against the
  owning docs.
- Maintenance agent: find the owner of a rule and distinguish canonical
  authority from local reminders.

If a doc set cannot support these reader jobs without repository archaeology,
temporary planning files, or deleted scaffolding, it is not finished.

## Finished Doc Set Shape

A feature-area documentation set should usually contain these roles. Small
feature areas can collapse roles into fewer files, but the role boundaries
should remain explicit.

### Area `AGENTS.md`

Use for:

- reading posture
- authority order
- conflict handling
- compact non-negotiable reminders
- validation posture

Do not use for full behavior authority. If `AGENTS.md` has to explain a rule
in detail, the rule probably belongs in an owning authority doc.

### Area `README.md`

Use for:

- reader routing
- "which doc answers what?"
- document-role summaries
- current terrain anchors

Do not use for behavior authority. A README should route the reader to the
owning doc instead of adjudicating the behavior itself.

### Optional `CONTEXT.md`

Use for glossary terms only.

Do not hide edge cases, lifecycle rules, test requirements, or behavior
contracts in a glossary. If a definition starts carrying behavior, move that
behavior to the owning authority doc and keep the glossary definition short.

### Behavior Authority Docs

Use for canonical rules about what must be true, especially:

- active authority rules
- forbidden substitutes
- negative rules
- behavior-level invariants
- non-negotiable edge cases

### Lifecycle, State, Or Interface Docs

Use for seams that answer how facts change or how data crosses a boundary:

- lifecycle ordering
- state mutation and persistence
- request, event, rendering, projection, or API shape
- ownership of inputs, outputs, and side effects

### Proof And Readiness Docs

Use for:

- tests, snapshots, and validation posture
- proof matrices or proof clusters
- readiness/open/blocker meanings
- implementation handoff expectations
- stale-symbol or final audit gates

Proof docs prove behavior. They do not define behavior. If a test expectation
conflicts with an owning authority doc, the authority doc wins and the test
expectation must be corrected.

## Standard Authority Doc Shape

Authority docs should start with a compact navigation header:

```markdown
## Navigation Header

- Role:
- Owns:
- Does not own:
- Primary pointers:
- Fidelity note:
```

Then prefer this broad order when it fits the seam:

- `Core Rule`
- owned behavior
- boundaries and non-ownership
- edge cases and negative rules
- implementation terrain, explicitly labeled as terrain
- proof or review expectations that are local to the seam

Not every doc needs every section. The important structural invariant is that
a fresh reader can learn what the doc owns, what it does not own, and where to
go next before reading the whole file.

## Ownership Rules

- Every durable rule has exactly one owning doc.
- Other docs may contain short local reminders when a reader needs the rule to
  avoid a local mistake.
- Full duplicate explanations are drift risk.
- Pointers should name the owning doc and why the reader should go there.
- Local reminders must not silently become a second owner.
- Navigation docs route. They do not decide.
- Glossary docs define terms. They do not carry behavior.
- Proof docs verify. They do not authorize behavior.

Repeated text is acceptable when it is a short reminder, a local boundary, or
a proof expectation. Repeated text is suspect when it restates another doc's
core rule as if this doc also owns it.

## Drafting Rules

- Start from reader jobs and required authority surfaces.
- Design the doc set before writing full prose.
- Choose docs by seam ownership, not by source-file names, old-doc names, or
  planning artifact names.
- Keep current code paths in terrain sections, not authority sections.
- Use traceability and concept inventories as coverage checks, not as the
  writing algorithm.
- Preserve edge cases, caveats, negative rules, and stop conditions.
- Prefer concise core rules over repeated explanatory scaffolding.
- Stop when source concepts, intended behavior, and implementation-route
  decisions genuinely conflict; name the conflict instead of smoothing it over.

## Compression Rules

The finished reader surface should be lean.

During discovery, temporary artifacts can be useful: requirements notes,
topology sketches, traceability tables, concept ledgers, compression guides,
handoffs, cursors, and review prompts. Those artifacts should not remain part
of the normal reader path once the final docs stand on their own.

When hardening docs:

- keep canonical authority in the owner doc
- convert repeated prose into local reminders or pointers
- remove broad cross-doc boundary matrices when a short pointer is enough
- keep local proof obligations only when genuinely local
- route broad proof posture to the proof/readiness doc
- remove source-input inventories after coverage has been accepted
- delete or move temporary support artifacts out of the live reader surface

Do not keep prep artifacts as an archive inside the working doc tree just
because they sound careful. Repository history is available for explicit
provenance questions.

## Size And Usability Rules

Use size as a reader-signal, not a hard limit:

- Navigation and glossary docs should be short enough to scan quickly.
- Authority docs should usually stay focused on one seam.
- If a doc is large because it owns multiple unrelated seams, split it.
- If a doc is large because one seam is inherently complex, keep it together
  but improve sectioning, core rules, and pointers.
- Do not split only to make files smaller if the result forces cross-doc
  hunting for one coherent rule.

The useful test is whether a fresh agent can answer the local question without
reading unrelated docs or resurrecting temporary artifacts.

## Finished-State Test

A feature-area doc set is not finished until a fresh agent can answer:

- What docs are live authority?
- What is the authority order?
- What does each doc own?
- What does each doc explicitly not own?
- What must not be inferred from current code?
- Where are tests, proof, and review gates defined?
- Which terrain anchors are relevant but non-authoritative?
- Which support artifacts are no longer normal inputs?
- What should stop implementation or planning?

Use cold-reader review as a real validation step. Ask an agent with no
conversation context to read only the live docs and explain the authority model
or plan a bounded seam. If the agent needs deleted artifacts or hidden context,
the docs need more hardening.

## Planning And Implementation Handoffs

Planning prompts should:

- name the live authority docs
- name the bounded seam
- name the terrain files as terrain
- require a Direction Lock when task-alignment applies
- forbid implementation during planning
- forbid deleted planning/source artifacts as normal inputs
- ask for module/API shape, call sites, dependencies, slices, validation, and
  stop conditions

Implementation prompts should:

- start from the accepted plan and owning authority docs
- keep slices narrow
- keep tests proportional to risk
- route conflicts back to the owning doc instead of inventing behavior in code
- update docs only when an owning-doc gap is real and the task allows it

## Helpful Hints For Future Agents

- Read the live docs top to bottom before trusting grep hits.
- Treat the user's supplied route as intentional unless a concrete conflict
  proves otherwise.
- Prefer naming the owner of a rule over repeating the rule everywhere.
- When current code has an old shape, describe it as migration terrain.
- Do not preserve an old helper, marker, adapter, or test just because it
  resembles the new behavior.
- Do not turn evidence, snapshots, logs, projections, helpers, or durable
  facts into behavior authority unless the owning docs say so.
- When a support artifact did its job, remove it from the normal reader path.
- If a doc contradiction would change implementation, stop and name it plainly.

## Non-Authoritative Sketches

The sketches below are examples only. They are not authority for subagents,
TUI rendering, or any future feature area. Do not copy them mechanically. Do
not treat omitted docs as disallowed or listed docs as required. Design the
actual doc set from the feature's reader jobs and ownership seams.

For a subagent feature area, possible seams might include delegation authority,
task lifecycle, result ingestion, review/approval, failure/cancellation,
state/history, and proof/readiness.

For a TUI rendering feature area, possible seams might include rendering model,
layout/wrapping, style/component rules, event/update ownership, snapshot proof,
and readiness.

These examples exist only to show that the same structure rules can apply to
very different domains.
