$task-alignment
# Passforward: Pass 2C Execution Start

## Intent Snapshot

Continue after the Pass 2C planning scaffold has closed. Packets 00-13 under
`local/goal_research/pass2c_rewrite_plan/` are closed.

The next default work is to begin Pass 2C execution from the closed scaffold,
not to create another planning layer. The first execution pocket should create
only the execution artifacts needed to start source-bounded rewrite work and
then work Packet 08 row 001 unless the user redirects.

First source row:

- Order: 001
- Slice ID: `src-goal-authority-grounding-truth--h01-h03-core-truth`
- Source range: `goal-authority-grounding-truth.md` title, h01-h03
- Primary target: `T-BEHAVIOR`
- Secondary checks: `T-FINAL`, `NAV-README`
- Route flag: `RV-FINAL`
- Audit: `authority`

Explicit exclusions:

- Do not perform cutover.
- Do not move, archive, rename, or delete current source docs.
- Do not close traceability or concept-ledger rows.
- Do not create records for all 159 rows up front.
- Do not rewrite from target memory; start from the source slice.
- Do not drift into Rust implementation unless the user explicitly redirects.

## Suggested Skills

- `task-alignment`: required before editing execution artifacts.
- `codebase-design`: use for owner, seam, interface, support-target, and
  pointer-only vocabulary.
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

For row 001, then read:

- `local/goal_research/goal-authority-grounding-truth.md`, at least the title
  through h03 directly and in order.
- Matching rows in `PASS2_SECTION_TRACEABILITY.md`.
- Matching concepts in `PASS2_CONCEPT_LEDGER.md`, especially Goal authority,
  developer-role active steering, final model request input, and helper/output
  non-authority concepts.
- Pass 2B target interfaces for `T-BEHAVIOR`, `T-FINAL`, and `NAV-README`.
- Pass 2B.5 entries for final request-input developer-role proof.
- Packet 09 `RV-FINAL` route files enough to complete the route check.

Do not use trace rows, target keys, Packet 08 labels, or route indexes as a
substitute for reading the source slice.

## Closed Planning State

The planning scaffold now answers:

- where future execution artifacts live: `local/goal_research/pass2c_rewrite/`;
- which successor target drafts exist and their draft filenames;
- owner, local-reminder, pointer-only, support, navigation, operations, and
  glossary boundaries;
- source-feed map, source-slice unit rules, source-doc split review, dependency
  order, and the 159-row ordered source-slice table;
- route-verification families;
- per-slice workflow and record shape;
- repeated-authority compression gates;
- fidelity-audit categories; and
- cutover gates and source-retirement conditions.

The planning scaffold does not itself create successor drafts, slice records,
cutover records, or source-doc moves.

## Direction Lock

- Request: Begin Pass 2C execution from the closed planning scaffold, starting
  with the execution workspace bootstrap and Packet 08 row 001.
- Authority: Current source docs are the source corpus until cutover; Packet
  08 is the source queue; Packet 10 is the record workflow; Packets 09, 11, 12,
  and 13 define route, compression, audit, and cutover checks.
- Terrain: Planning artifacts are closed. Execution artifacts may now be
  created only as needed for the active source slice.
- Code-shape temptation: Reopen planning, generate all records mechanically,
  draft target docs from memory, or use support/navigation text as behavior
  authority.
- Locked direction: Create the minimal execution workspace and execute the
  first source-bounded slice according to Packet 10.
- Exclusions: No cutover, no source-doc moves/deletes, no trace row closure,
  no all-row record generation, no route-plan edits, no Rust/code
  implementation.

## Recommended Next Pocket

First, create the execution workspace only as needed:

- `local/goal_research/pass2c_rewrite/`
- `local/goal_research/pass2c_rewrite/successor_drafts/`
- `local/goal_research/pass2c_rewrite/slice_records/`
- `local/goal_research/pass2c_rewrite/audits/`
- `local/goal_research/pass2c_rewrite/cutover/`

Then start row 001:

1. Create or update only the successor draft files touched by row 001:
   `draft-goal-authority-behavior.md`,
   `draft-final-request-input-and-commit.md`, and
   `draft-reader-map-and-navigation.md`.
2. Create one slice record:
   `local/goal_research/pass2c_rewrite/slice_records/src-goal-authority-grounding-truth--h01-h03-core-truth.md`.
3. Follow Packet 10's workflow exactly.
4. Run the `RV-FINAL` route check from Packet 09.
5. Apply Packet 11 only for repeated-authority material found in the slice.
6. Apply Packet 12 audit categories for `authority` plus any secondary target
   categories the slice actually touches.
7. Mark the record `closed` only if every source unit is accounted for and no
   blocking route, owner-boundary, repeated-authority, or fidelity debt remains.

If row 001 closes cleanly and context remains strong, continue to row 002 only
after checking the user has not redirected. Do not batch rows merely because
they share a source file.

## Verification State

For docs-only execution artifact edits, run:

```powershell
git diff --check -- local\goal_research
rg -n "[ \t]$" local\goal_research
```

`rg` exits with code 1 when it finds no trailing-whitespace matches. No Rust
tests are needed unless the next session changes Rust code or generated
artifacts.
