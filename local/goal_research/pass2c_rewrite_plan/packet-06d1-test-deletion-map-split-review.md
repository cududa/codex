# Packet 06d1: Test Deletion Map Split Review

Status: closed.

## Purpose

Apply Packet 05 source-slice rules to the test deletion map source doc.

## Scope

This packet owns whole-doc versus heading-range disposition for:

- `goal-test-deletion-map.md`

It does not review readiness, navigation, operations, glossary, exclusion
candidates, or source docs assigned to 06a, 06b, or 06c.

## Required Grounding

- Packet 05
- Packet 06 parent
- Packet 06d parent/index
- Packet 01 for future artifact boundaries
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- the assigned source doc, read directly top to bottom

## Decisions

`goal-test-deletion-map.md` must not close as one whole-doc source slice.

The doc has one dominant test-prep role, but Packet 05 does not allow a
whole-doc slice when large test matrices and cross-seam proof obligations
would crowd the semantic audit. Direct reading shows separate prep rule,
local-only deletion, upstream-baseline, replacement-profile, and snapshot
families. Traceability also marks review debt where raw notification,
extension/shim, final-input, steering-role config, and replacement-test
semantics can be weakened by a broad summary.

Use these source units:

| Source unit | Disposition | Reason |
| --- | --- | --- |
| Title, `## Navigation Header`, intro, and `## Prep Rule` | One opening heading-range slice | The title/header/intro define the test-prep frame: remove false compatibility pressure, preserve upstream baseline obligations, use `rust-v0.136.0`, and keep budget/usage as upstream facts. The `Prep Rule` is the executable sequence for that frame, so the top matter belongs with it. |
| `## Delete Local-Only Fake Context Tests` | One `##` slice | This is one local-only fake-context deletion family. It carries a cleanup/shim local reminder: raw response item notifications remain raw and legacy `<goal_context>` coverage must stay limited to cleanup/projection hiding, not active steering. |
| `## Delete Local-Only Core Overlay Tests` | One `##` slice | This section deletes local tests for fabricated resume Initial, late unsampled injection, and configured objective-limit behavior, then names the replacement coverage family. |
| `## Delete Local-Only App-Server Steering Overlay` | One `##` slice | This section deletes one old marker-transport scheduling test and preserves the final request-input replacement proof clauses. |
| `## Delete Local-Only TUI Overlay Tests` | One `##` slice | This is one local TUI overlay deletion family. The section says the behaviors are not rejected, only removed from the prep suite until replacement command/pause/interruption contracts exist. |
| `## Revert Steering-Role Config Overlay` | One `##` slice | This section owns steering-role config overlay test removal and the local reminder that user-role active Goal steering must not survive as compatibility. |
| `## Revert Existing Test Files To Upstream Baseline` | One `##` slice | This is a file-list baseline restoration rule. It must stay distinct from local-only deletion because it says to use file-specific diffs and not blindly reset unrelated work. |
| `## Upstream Baseline Tests That Remain Active` | Split below `##` by labeled test family | The section is a large baseline matrix. Split its internal labeled groups so core, app-server, TUI command/validation, TUI status/budget/review/action, and extension-backend baseline obligations can each be audited without flattening the extension conversion/removal caveat. |
| `## Replacement Test Profile To Add After Prep` | Split below `##` by labeled proof family | The section is the replacement proof matrix and crosses many behavior owners. Split by its labels: final model request input, durable pending cadence intent, resume and idle lifecycle, repair and legacy artifacts, recorded request evidence, and local behavior re-additions. `T-TEST-PREP` owns the matrix; behavior targets retain their local proof obligations. |
| `## Snapshot Handling` | One `##` slice | Snapshot handling is one TUI snapshot posture: delete only with local-only owner tests, restore upstream-owned snapshots, and update/add replacement snapshots only for intentional UI changes. |

No other `##` section needs below-`##` splitting. The below-`##` splits above
are not target-destination assignments; they are source-granularity decisions
for large matrices whose internal labeled groups carry different audit
families.

No unresolved split question carries to Packet 06d7. The rollup only needs to
record that this doc uses heading slices plus below-heading splits for the
upstream-baseline and replacement-profile matrices.

## Output Expected

A compact split disposition for the test deletion map source doc, with reasons
grounded in Packet 05 criteria and direct source reading.

## Closure Criteria

- The assigned source doc has a disposition: heading slices, with
  below-heading splits for two large matrices.
- Split reasons distinguish source granularity from test ownership.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Reviewing source docs assigned to 06a, 06b, 06c, 06d2-06d6.
- Defining cutover gates.
- Consolidating all Packet 06d decisions.
- Starting rewrite execution.
