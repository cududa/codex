# Concern Detector Architecture

This document describes the durable architecture and review model. It is not an
implementation checklist.

## Review Entity Model

Detector evidence attaches to existing `prompt_reviews` review entities:

- `version`
- `commit`
- `commit_file`
- `diff_block`

Detector evidence supports comments, decisions, plans, editable concern-area
assignments, and commit-level review marks, but it does not replace them.
Human-finalized decisions remain authoritative.

## Concern Map

Each concern area has a stable slug, a human definition, source seeds, expansion
cues, and false-positive exclusions. The map should be human-reviewable as
tracked repository content so changes to the detector policy are themselves easy
to review.

Useful map fields:

- concern slug
- label
- behavior definition
- seed paths and glob patterns
- seed symbols
- seed string or template markers
- expansion edge types
- false-positive exclusions
- representative fixture expectations

## Source Graph

The source graph is the detector's memory of review-relevant source surfaces.
It can include:

- Rust items, functions, impls, enum variants, trait impls, and call-like paths
- template, Markdown, SQL, JSON, and TypeScript markers
- registration arrays and dispatch edges
- `include_str!` targets
- config fields and wire type names
- tests and snapshots that assert model-visible behavior

Graph expansion should be bounded and explainable. Every expanded node should
record the concern slug, the seed or parent node that pulled it in, the edge
type, the detector version, and the commit or refresh run that discovered it.
Avoid uncontrolled whole-repo closure; allowed edge types should be explicit per
concern area.

## Sequential Growth

During upstream version ingestion, commits are reasoned about in order:

1. evaluate the commit against the concern graph as it exists before the commit;
2. record any findings for touched monitored surfaces;
3. expand or refresh graph nodes made reachable by that commit.

This order matters. If commit A adds a graph-connected helper and commit B
later changes that helper, B should be flagged even if the helper was not in the
original seed map.

Local self-maintained commits need a graph refresh path too. That refresh is for
keeping local graph state current; it is not the same thing as creating upstream
review findings.

## Finding Semantics

A finding means:

> This commit, file, or diff block touched a source graph node belonging to a
> monitored concern area.

Useful finding fields:

- concern slug
- target scope and id
- commit id, commit file id, and diff block id when available
- file path
- old/new side when relevant
- line range
- symbol or marker
- matched graph node key
- evidence kind
- rationale
- deterministic confidence
- detector run id
- timestamps

Confidence should remain rule-based:

- `high`: changed lines overlap a seeded node or directly seeded marker
- `medium`: changed lines overlap an expanded graph node
- `low`: path-level or supporting/generated evidence without range overlap

## Extraction And Scanning Shape

Rust surfaces need syntax-aware extraction where semantics matter. A lightweight
AST extractor is sufficient if it can identify files, items, impls, enum
variants, function names, call-like paths, trait impls, literal markers, line
ranges, byte ranges, registration arrays, and `include_str!` dependencies.

Template and Markdown prompt files can be scanned as structured text. SQL, JSON
schema, and TypeScript protocol/API surfaces can use lighter parsing, provided
findings still anchor to paths, symbols, fields, wire names, or markers.

Determinism matters more than cleverness. Extracted nodes and edges should have
stable keys and sorted output.

## Storage Shape

Detector state is conceptually separate from review workflow state. Do not
overload editable review state or old tag/classification metadata as graph
storage.

Useful storage concepts:

- concern graph nodes
- concern graph edges
- detector runs
- detector findings

Findings are tied to detector runs. Runs can be regenerated for a version.
Generated graph data can be replaced deterministically without deleting comments,
decisions, plans, editable concern-area assignments, or review marks.

## Review Surfacing

Findings are most useful when visible where review actually happens:

- commit queue summaries
- commit detail
- file queue summaries
- file detail
- diff block review views
- MCP tools used by reviewing agents

Compact surfaces should show concern slugs, finding counts, highest confidence,
and short evidence summaries. Full finding detail should remain reachable when a
file or diff block needs closer inspection.

For MCP review workflows, useful surfaces include:

- `list_remaining_commits`: finding summary per commit
- `list_commit_files`: finding summary per file
- `get_file_review`: full file and diff-block findings
- optional read-only listing by version or commit if existing outputs become too
  large

## Relationship To Review State

Concern-area assignments and review marks remain human or agent review concepts.
Detector findings may suggest concern areas, but detector evidence should remain
distinguishable from editable assignments, review marks, and human decisions.

Any queue pressure derived from findings should be traceable and reversible
without deleting human review artifacts.

## Guardrails

- The detector should avoid files with `env` in the name unless the user
  explicitly asks and secret output is redacted.
- Do not require a local `rust-analyzer` installation.
- Do not put detector-specific code into `codex-core` when a narrower home is
  available.
- Treat generated TypeScript and JSON schema diffs as supporting evidence unless
  a source wire shape changed too.
- The detector should flag review-relevant surfaces; it should not accept,
  reject, classify, finalize, or create human decisions automatically.
