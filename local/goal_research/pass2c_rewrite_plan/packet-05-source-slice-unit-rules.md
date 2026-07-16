# Packet 05: Source Slice Unit Rules

Status: closed.

## Purpose

Define what counts as one executable source slice for future Pass 2C rewrite
execution.

## Scope

This packet owns abstract source-slice unit criteria, heading-range split
triggers, title/navigation-header handling, and slice ID shape.

It does not apply those criteria to every source doc. Packet 06 owns
source-by-source split review, Packet 07 owns dependency-order principles, and
Packet 08 owns the ordered source-slice table.

## Required Grounding

- Packet 00
- `local/goal_research/AGENTS.md`
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- representative authority spine and seam docs, read for document structure
  and concept density
- Packets 02-04 as target, owner, and source-feed constraints

Representative source reading showed three relevant shapes: dense spine docs
with many cross-target clauses, focused seam contracts with one dominant owner
and local reminders, and demolition/test/navigation docs with large terrain or
support lists. These patterns motivate the criteria below; they are not
source-by-source split decisions.

## Decisions

An executable source slice is one contiguous unit of current source text:

- a whole source doc, or
- one bounded heading or heading range inside a source doc.

The slice must be small enough for one fresh agent to read the source text,
consult its trace and concept rows, check target owner/source-feed constraints,
write the successor draft updates, and record closure honestly in one focused
context window.

Start Packet 06 evaluation with the whole source doc as the candidate unit, but
close it as a whole-doc slice only if all of these are true:

- the doc has one dominant source role or target-owner family;
- supporting clauses are local reminders, pointers, or tests for that same
  family rather than separate owner contracts;
- traceability does not require several independent `Split` or
  `Canonicalize` treatments across unrelated owner targets;
- high-risk concept-ledger rows can be audited without holding several
  unrelated seams at once;
- any tables or file lists are support material for the same slice decision,
  not a separate test-prep, terrain, or cutover matrix; and
- the whole doc can be source-read, reconciled, drafted, and closure-recorded
  by one fresh agent without relying on memory summaries.

Split by heading or heading range when any of these are true:

- one source doc contains independent owner contracts, such as behavior,
  cadence, durable state, final-input, idle lifecycle, history, evidence,
  cleanup, extension, shim, or test-prep semantics;
- a heading range would require different implementation-route verification
  families from neighboring headings;
- a section combines desired authority, current broken terrain, and removal or
  test instructions that later packets must audit differently;
- repeated authority needs canonical owner, local reminder, and pointer-only
  routing across several targets;
- a large table, checklist, code-terrain list, or test matrix would crowd the
  semantic audit for nearby authority prose; or
- a fresh agent could not account for every clause in the candidate unit
  without producing a broad summary.

Split at `##` heading boundaries by default. Split below that only when a
single `##` section contains separable `###` subcontracts that would otherwise
cross owner seams or audit categories. Do not create sentence-level slices
unless a later source review finds an unavoidable fidelity conflict.

Titles and navigation headers are accounted for, not ignored:

- the source title belongs to the first slice for that source doc, or to the
  whole-doc slice when the doc stays whole;
- a standard authority-doc `Navigation Header` is metadata and routing context,
  not standalone behavior authority;
- include that header with the first substantive slice unless Packet 06 finds
  it must be handled with navigation/operations source material; and
- for docs whose body is itself navigation, glossary, or operations material,
  the title and introductory routing prose are substantive source text for the
  navigation, glossary, or operations target.

Stable slice IDs use source text, not target names or execution order:

```text
src-<source-slug>--all
src-<source-slug>--hNN-<heading-slug>
src-<source-slug>--hNN-hMM-<range-slug>
```

Rules:

- `<source-slug>` is the source filename without `.md`.
- `hNN` is the two-digit ordinal of the `##` heading after the document title.
- Use a range only for contiguous headings.
- If Packet 06 splits below `##`, add a `sNN` subheading ordinal after the
  heading number.
- Do not include target keys in slice IDs; target destinations belong in slice
  records and the ordered table.

## Output Expected

Packet 06 can apply these criteria source by source to decide whole-doc versus
heading-range slices and to assign proposed IDs without inventing its own unit
rules.

## Closure Criteria

- The packet defines a source slice in terms of source text, not target topics.
- Whole-doc and heading-range criteria are specific enough for Packet 06.
- Titles and navigation headers are accounted for.
- Slice IDs are stable and sortable without embedding target destinations.
- No source-by-source split decisions, actual ordered table, successor draft,
  or source-slice record is created.

## Non-Goals

- Deciding which named source docs are whole-doc slices.
- Assigning actual source slice IDs.
- Choosing dependency order or execution order.
- Defining workflow templates or record fields.
- Starting rewrite execution.
