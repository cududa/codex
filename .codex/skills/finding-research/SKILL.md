---
name: finding-research
description: Use when researching a focused question inside an existing Review Dedeluger finding, updating finding notes, discussions, intent, local contract, or research context without implementing code changes.
metadata:
  short-description: Research and annotate an existing Review Finding using the review-dedeluger MCP
---

# Finding Research

Use this skill when the user asks you to research a Review Finding, clarify part
of its intent or contract, investigate a claim, or update notes and finding
context. This is map work, not trail work: study the finding, improve the
annotations, and leave implementation for a separate request.

The Review Finding gives the route context. The research question gives the
focus. Existing code, upstream commits, maintained commits, notes, discussions,
and docs are source material to inspect with care.

## Source Order

Use sources in this order:

1. Current user instructions and the focused research question
2. The named Review Finding
3. Finding remediation plan, notes, discussions, linked findings, prior
   findings, maintained commits, and concern areas
4. Applicable `AGENTS.md` files and user-named docs
5. Relevant implementation code, upstream commits, tests, generated artifacts,
   and external primary sources when needed

## Workflow

### 1. Finding Retrieval

Retrieve the Review Finding through the Review Dedeluger MCP before reading
implementation code.

Also retrieve the remediation plan when one exists. Gather linked findings,
prior findings, notes, discussions, maintained commits, and concern areas when
they are relevant to the question.

Capture:

- the finding title
- the research question or uncertainty
- the finding's intent or guiding invariant
- the local contract
- explicit non-goals
- relevant linked context
- open questions or unresolved discussions

### 2. Research Lock

Before broad repo inspection, state the research direction.

Use this checkpoint:

```markdown
## Research Lock

- Finding:
- Question:
- Intent:
- Local contract:
- Relevant context:
- Initial source material:
- Exclusions:
- Expected output:
```

The research lock keeps the inquiry focused. It does not need to solve the
question yet.

### 3. Tree-Walk The Concepts

Start by walking the code and concepts named by the finding, plan, or user.
Follow types, functions, modules, commit context, and ownership boundaries until
the concept has a shape.

Prefer this kind of careful tree-walk before broad grep passes or test dives.
Broad search and tests are useful tools, but they consume a lot of attention
when used before the mental model is warm.

Use tests as source material when they explain behavior or when the research
question points there. Do not run tests merely to discover the concept unless
the user asked for that or the finding's plan names a targeted test. For
research, reading the relevant test narrowly is often enough.

### 4. Inspect Source Material

Inspect only the material needed to answer the question:

- upstream commits attached to the finding
- maintained commits linked to the lineage
- files or code targets named by the finding
- relevant live code
- focused tests or snapshots
- notes and discussions
- user-named docs
- external primary sources, if the question depends on outside facts

Keep the inquiry connected to the finding's intent. If a nearby artifact starts
pulling the work toward a different question, name that and return to the
research lock.

### 5. Update The Finding Context

When the research produces a useful result, update the requested finding surface:

- add or update a ReviewNote
- update a discussion
- revise `intentMarkdown`, `localContractMarkdown`, or `conflictMarkdown`
- link related findings or context
- summarize the result for the user without changing the finding when that was
  the request

Keep implementation out of scope unless the user explicitly asks for code
changes.

### 6. Pause And Ask

Pause when proceeding would require changing the research route rather than
following it:

- the finding cannot be retrieved
- the research question depends on missing context not available in the repo or
  MCP
- linked findings or discussions contradict the current question
- answering would require implementation or broad verification the user did not
  request
- the result would materially change the finding's intent or local contract and
  the user has not asked you to edit it

Use direct language: conflict, missing context, scope-changing ambiguity,
implementation requested by the evidence, or finding update needs confirmation.

### 7. Research Closeout

Close by reporting:

- what you researched
- what source material mattered
- what changed in Review Dedeluger, if anything
- unresolved questions or assumptions
- tests not run, unless the user requested targeted verification

The desired posture is steady inquiry: read the finding, tree-walk the relevant
concept, improve the annotation, and leave a clearer map behind.
