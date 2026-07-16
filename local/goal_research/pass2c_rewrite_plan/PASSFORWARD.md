$task-alignment
# Passforward: Pass 2C Row 008

## Intent Snapshot

Continue Pass 2C execution after rows 001-007 have closed. The next default
work is Packet 08 row 008, not another planning layer, not cutover, and not a
restart at an earlier row.

Rows 001-007 are closed. Treat them as prior execution state, not material to
re-summarize in this handoff unless a later row exposes a concrete conflict.

Next source row:

- Order: 008
- Slice ID: `src-goal-authority-grounding-truth--h08-durable-state`
- Source range: `goal-authority-grounding-truth.md` h08
- Primary target: `T-DURABLE`
- Secondary checks: `T-BEHAVIOR`, `T-CLEANUP`
- Route flag: `RV-DURABLE`
- Audit: `durable`
- Successor draft:
  `local/goal_research/pass2c_rewrite/successor_drafts/draft-durable-cadence-state.md`
- Record path:
  `local/goal_research/pass2c_rewrite/slice_records/src-goal-authority-grounding-truth--h08-durable-state.md`

## Corrected Writing Posture

- Treat successor drafts as staged Pass 2C authority. They become standing
  authority only through cutover, but closed sections already read as successor
  contract text.
- Write successor prose directly: state what the target owns, what is
  forbidden, and which durable, behavior, cleanup, cadence, final-input,
  history, or test-prep boundary controls the behavior.
- Use route material to sharpen the successor rule when it preserves the
  source concept. Keep route-file names and reconciliation evidence in the
  slice record, not in standing successor prose.
- Do not frame successor prose as draft-reporting or route-suggestion text.
- Do not use "may" when the source means "is limited to", "must", or "owns".
- Do not turn row-boundary discipline into design hedging.
- Do not leave behavior only in records, route notes, navigation text, or
  operational comments.

## Explicit Exclusions

- Do not perform cutover.
- Do not move, archive, rename, or delete current source docs.
- Do not close traceability or concept-ledger rows.
- Do not create records for all remaining rows up front.
- Do not rewrite from target memory; start from the source slice.
- Do not drift into Rust implementation unless the user explicitly redirects.
- Do not carry forward a growing ledger of prior-row summaries in this file.

## Suggested Skills

- `task-alignment`: required before editing execution artifacts.
- `codebase-design`: use for owner, seam, interface, support-target, and
  pointer-only vocabulary when row material needs that vocabulary.
- `domain-modeling`: use only if target language or Goal terms need
  sharpening while writing successor prose.
- `handoff`: use only when writing the next passforward.

## Authority Grounding

Start with:

- `local/goal_research/AGENTS.md`
- `local/goal_research/PASS2C_REWRITE_PLAN.md`
- `local/goal_research/pass2c_rewrite_plan/README.md`
- `local/goal_research/pass2c_rewrite_plan/packet-01-draft-workspace-and-naming.md`
- `local/goal_research/pass2c_rewrite_plan/packet-02-successor-target-inventory.md`
- `local/goal_research/pass2c_rewrite_plan/packet-08-ordered-slice-table.md`
- `local/goal_research/pass2c_rewrite_plan/packet-09-route-verification-question-families.md`
- `local/goal_research/pass2c_rewrite_plan/packet-10-slice-workflow-and-record-shape.md`
- `local/goal_research/pass2c_rewrite_plan/packet-11-repeated-authority-compression-gates.md`
- `local/goal_research/pass2c_rewrite_plan/packet-12-fidelity-audit-categories.md`
- `local/goal_research/pass2c_rewrite_plan/packet-13-cutover-gates.md`

For row 008, then read:

- `local/goal_research/goal-authority-grounding-truth.md`, h08 exactly and in
  order: `## Durable State`.
- Matching row in `PASS2_SECTION_TRACEABILITY.md`, especially row 121.
- Matching concepts in `PASS2_CONCEPT_LEDGER.md`, especially durable Goal
  facts and runtime archaeology forbidden. Check durable facts version,
  pending cadence intent, exact-key consumption, supersedence, active durable
  state alone, current authority proof sources, and structured recorded request
  evidence only if the source or route check touches those concepts.
- Pass 2B target interfaces for `T-DURABLE`, `T-BEHAVIOR`, and `T-CLEANUP`.
- Pass 2B.5 repeated-authority entries for runtime archaeology, durable facts
  as current authority, active durable state alone, cleanup/reconstruction
  support behavior, and any pending-intent or exact-key material the route
  check actually touches.
- The existing row 007 durable successor draft and record only to avoid
  duplicate durable contract text. Do not use them as a substitute for reading
  h08 from the source corpus.
- Packet 09 `RV-DURABLE` route files enough to complete the route check.

For `RV-DURABLE`, check:

- `local/goal_136_plan/work-areas/01-durable-cadence-state.md`
- `local/goal_136_plan/work-areas/01-existing-pass-validation.md`
- `local/goal_136_plan/work-areas/01a-durable-facts-version-plumbing.md`
- `local/goal_136_plan/work-areas/01b-pending-cadence-intent-storage.md`
- `local/goal_136_plan/work-areas/01c-cadence-aware-store-operations.md`
- `local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/03e-idle-pending-durable-intent-delivery.md`
- `local/goal_136_plan/work-areas/04c-extension-tool-goal-mutations.md`
- `local/goal_136_plan/work-areas/04d-extension-runtime-objective-effects.md`
- `local/goal_136_plan/work-areas/04e-extension-budget-limit-cadence-intent.md`
- `local/goal_136_plan/work-areas/goal-work-area-coordination-note.md`

Do not use trace rows, target keys, Packet 08 labels, route indexes, or
existing successor prose as a substitute for reading the row 008 source slice.

## Execution State

Rows 001-007 are closed. Execution artifacts live under:

- `local/goal_research/pass2c_rewrite/successor_drafts/`
- `local/goal_research/pass2c_rewrite/slice_records/`

Current successor drafts exist for `T-BEHAVIOR`, `T-FINAL`, and `T-DURABLE`.
Row 008 updates the existing durable successor draft; it does not open a new
successor target.

## Direction Lock

- Request: Continue Packet 08 execution from row 008, closing one source slice
  under Packet 10.
- Authority: Current source docs are the source corpus until cutover; Packet
  08 is the source queue; Packet 10 is the record workflow; Packets 09, 11, 12,
  and 13 define route, compression, audit, and cutover checks.
- Terrain: Row 008 is the grounding-truth Durable State section. It reinforces
  durable Goal state as the source of truth for current Goal facts and forbids
  recovering Goal state or cadence intent from rendered artifacts.
- Code-shape temptation: Treat row 008 as another whole durable-state rewrite,
  over-import row 007 state APIs, move the no-runtime-archaeology rule only to
  cleanup or behavior prose, or let historical rendered text become a recovery
  path for active Goal facts.
- Locked direction: Execute row 008 from h08, integrate relevant `RV-DURABLE`
  route decisions into standalone durable contract prose, create the row 008
  slice record, validate, and stop before row 009 unless the user explicitly
  asks to continue.
- Exclusions: No cutover, no source-doc moves/deletes, no trace row closure,
  no all-row record generation, no route-plan edits, no Rust/code
  implementation.

## Recommended Next Pocket

Start row 008:

1. Read the exact source slice:
   `goal-authority-grounding-truth.md` h08.
2. Pull traceability row 121 and the matching concept-ledger entries.
3. Read the primary and secondary target interfaces.
4. Read relevant Pass 2B.5 repeated-authority entries before compressing or
   moving repeated clauses.
5. Run the Packet 09 `RV-DURABLE` route check against the listed 136-plan
   route material.
6. Update only this successor draft unless the source slice proves another
   successor target is actually touched:
   `local/goal_research/pass2c_rewrite/successor_drafts/draft-durable-cadence-state.md`.
7. Create one slice record:
   `local/goal_research/pass2c_rewrite/slice_records/src-goal-authority-grounding-truth--h08-durable-state.md`.
8. Follow Packet 10's record workflow exactly.
9. Apply Packet 11 only for repeated-authority material found in the slice.
10. Apply Packet 12 audit category `durable` plus any secondary target
    categories the slice actually touches.
11. Mark the record `closed` only if every source unit is accounted for and no
    blocking route, owner-boundary, repeated-authority, or fidelity debt
    remains.

Row 008 source obligations:

- durable Goal state is the source of truth for current Goal facts;
- current Goal item construction reads from durable Goal state;
- rendered Goal items must not be parsed at runtime to recover active Goal
  state, current objective, budget state, cadence intent, or pending steering
  kind; and
- if durable structured Goal state is absent, runtime must not resurrect a
  Goal from historical rendered text.

Expected successor edit: add a compact durable-source-of-truth and
no-runtime-archaeology contract to
`draft-durable-cadence-state.md`. Keep the text standalone and directive.
Avoid duplicating row 007's full durable storage and mutation contract. Touch
`T-BEHAVIOR` or `T-CLEANUP` successor prose only if direct source and target
boundary checks prove the row requires a local reminder there.

The route check confirms current Goal facts come from durable state, current
Goal item construction reads durable state, and rendered artifacts are not a
recovery path for active Goal facts or cadence intent. Mark user review if
route material would let historical rendered text, classifier output,
reconstruction support, recorded request evidence, or cleanup projection become
live durable authority.

Do not start row 009 in this passforward pocket unless the user explicitly
asks. Row 009 is a cadence-contract transition and should get its own fresh
Direction Lock.

## Verification State

After docs-only Pass 2C edits, run:

```powershell
git diff --check -- local\goal_research
rg -n "[ \t]$" local\goal_research
```

`git diff --check` may report pre-existing CRLF warnings on already-dirty
planning docs. `rg` exits with code 1 when it finds no trailing-whitespace
matches. No Rust tests are needed unless the session changes Rust code,
generated schema, snapshots, or other implementation artifacts.
