# Packet 08: Ordered Slice Table

Status: closed.

## Purpose

Create the first ordered source-slice table for future Pass 2C source-bounded
rewrite execution.

## Scope

This packet owns source-slice order, stable slice IDs, exact source ranges,
primary target routing, secondary target checks, route-verification flags, and
expected audit categories.

It does not start rewrite execution, create successor drafts, create slice
records, define the slice workflow, close traceability rows, or define cutover.

## Required Grounding

- Packet 03 target owner boundaries
- Packet 04 target source-feed map
- Packet 05 source-slice unit rules
- Packet 06e consolidated split-review rollup
- Packet 07 source dependency order rules
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- source headings and below-heading split labels checked directly
- Pass 2B and Pass 2B.5 inputs where owner, local reminder, or pointer-only
  routing affects target checks

## Decisions

Packet 08 uses these compact route-verification flags. Packet 09 owns the full
question-family plan; the flags here only mark which future row needs that
verification before or during rewrite execution.

| Flag | Meaning |
| --- | --- |
| `RV-FINAL` | Final request-input shaping, capture, retry/follow-up, commit, selected item identity, or current-turn carry. |
| `RV-DURABLE` | Durable storage, facts version, pending intent, exact-key consumption, or durable-state non-ownership. |
| `RV-IDLE` | Idle legal callers, stage order, reservation, resume hydration, same-turn metadata, or stale candidate behavior. |
| `RV-HISTORY` | Model-visible history key, eligible progress projection, capture point, watermark, resume/restart, or compaction effects. |
| `RV-EVIDENCE` | Structured recorded request evidence, persistence, replay, rollback/fork, compaction, or projection support. |
| `RV-CLEANUP` | Classifier, repair, projection, raw notification, compaction, reconstruction, rollback, or fork behavior. |
| `RV-EXT` | Extension ownership, reachability, config compatibility, or extension mutation routing. |
| `RV-SHIM` | Fake-shim roots, shim-dependent consumers, demolition work areas, or local overlay test-removal terrain. |
| `None` | No implementation-route question is needed to establish ordering. |

`Primary target` names the first successor draft destination for the slice.
`Secondary checks` are target interfaces that must be checked while rewriting
because the source unit crosses owner seams. Pointer-only checks do not make
the secondary target an owner.

Pre-first-heading source text has no `##` ordinal. The two source units that
Packet 06 split before a first `##` heading use `--intro` IDs:
`src-AGENTS--intro` and `src-README--intro`. All other IDs follow Packet 05.

## Ordered Source-Slice Table

| Order | Slice ID | Source range | Primary target | Secondary checks | Route flag | Audit |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `src-goal-authority-grounding-truth--h01-h03-core-truth` | `goal-authority-grounding-truth.md` title, h01-h03 | `T-BEHAVIOR` | `T-FINAL`, `NAV-README` | `RV-FINAL` | authority |
| 002 | `src-goal-authority-grounding-truth--h04-required-active-steering-shape` | `goal-authority-grounding-truth.md` h04 | `T-BEHAVIOR` | `T-FINAL`, `T-CLEANUP`, `T-EXT`, `T-SHIM` | `RV-FINAL` | authority |
| 003 | `src-goal-authority-final-request-input-and-commit--h01-h03-code-terrain` | `goal-authority-final-request-input-and-commit.md` title, h01-h03 | `T-FINAL` | `T-BEHAVIOR`, `NAV-README` | `RV-FINAL` | final |
| 004 | `src-goal-authority-final-request-input-and-commit--h04-core-rule` | `goal-authority-final-request-input-and-commit.md` h04 | `T-FINAL` | `T-BEHAVIOR`, `T-CADENCE`, `T-CLEANUP` | `RV-FINAL` | final |
| 005 | `src-goal-authority-final-request-input-and-commit--h05-h07-shaping-selection` | `goal-authority-final-request-input-and-commit.md` h05-h07 | `T-FINAL` | `T-CADENCE`, `T-DURABLE`, `T-IDLE`, `T-CLEANUP`, `T-HISTORY` | `RV-FINAL` | final |
| 006 | `src-goal-authority-grounding-truth--h12-anti-patterns` | `goal-authority-grounding-truth.md` h12 | `T-BEHAVIOR` | `T-FINAL`, `T-CLEANUP`, `T-SHIM`, `T-TEST-PREP` | `RV-FINAL` | authority |
| 007 | `src-goal-authority-durable-cadence-state--all` | `goal-authority-durable-cadence-state.md` whole doc | `T-DURABLE` | `T-CADENCE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`, `T-TEST-PREP` | `RV-DURABLE` | durable |
| 008 | `src-goal-authority-grounding-truth--h08-durable-state` | `goal-authority-grounding-truth.md` h08 | `T-DURABLE` | `T-BEHAVIOR`, `T-CLEANUP` | `RV-DURABLE` | durable |
| 009 | `src-goal-authority-primary-cadence-contract--h01-h03-non-negotiable-shape` | `goal-authority-primary-cadence-contract.md` title, h01-h03 | `T-CADENCE` | `T-BEHAVIOR`, `T-FINAL`, `NAV-README` | `RV-FINAL` | cadence |
| 010 | `src-goal-authority-primary-cadence-contract--h04s01-durable-goal-facts` | `goal-authority-primary-cadence-contract.md` h04 intro and s01 | `T-DURABLE` | `T-CADENCE`, `T-FINAL` | `RV-DURABLE` | durable |
| 011 | `src-goal-authority-primary-cadence-contract--h04s02-pending-cadence-intent` | `goal-authority-primary-cadence-contract.md` h04 s02 | `T-DURABLE` | `T-CADENCE`, `T-FINAL`, `T-IDLE`, `T-EXT` | `RV-DURABLE` | durable |
| 012 | `src-goal-authority-primary-cadence-contract--h05-cadence-is-primary` | `goal-authority-primary-cadence-contract.md` h05 | `T-CADENCE` | `T-FINAL`, `T-CLEANUP`, `T-DURABLE` | `RV-FINAL` | cadence |
| 013 | `src-goal-authority-primary-cadence-contract--h06s01-initial` | `goal-authority-primary-cadence-contract.md` h06 intro and s01 | `T-CADENCE` | `T-DURABLE`, `T-FINAL`, `T-IDLE` | `RV-DURABLE` | cadence |
| 014 | `src-goal-authority-primary-cadence-contract--h06s03-objectiveupdated` | `goal-authority-primary-cadence-contract.md` h06 s03 | `T-CADENCE` | `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-EXT` | `RV-DURABLE` | cadence |
| 015 | `src-goal-authority-primary-cadence-contract--h06s04-budgetlimit` | `goal-authority-primary-cadence-contract.md` h06 s04 | `T-CADENCE` | `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-EXT`, `T-TEST-PREP` | `RV-DURABLE` | cadence |
| 016 | `src-goal-authority-primary-cadence-contract--h07-supersedence-rules` | `goal-authority-primary-cadence-contract.md` h07 | `T-CADENCE` | `T-DURABLE`, `T-FINAL`, `T-IDLE` | `RV-DURABLE` | cadence |
| 017 | `src-goal-authority-primary-cadence-contract--h09-ordinary-user-turns` | `goal-authority-primary-cadence-contract.md` h09 | `T-CADENCE` | `T-IDLE`, `T-FINAL`, `T-TEST-PREP` | `RV-IDLE` | cadence |
| 018 | `src-goal-authority-grounding-truth--h06-primary-cadence` | `goal-authority-grounding-truth.md` h06 | `T-CADENCE` | `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY` | `RV-DURABLE` | cadence |
| 019 | `src-goal-authority-grounding-truth--h07-ordinary-user-turns` | `goal-authority-grounding-truth.md` h07 | `T-CADENCE` | `T-IDLE`, `T-FINAL` | `RV-IDLE` | cadence |
| 020 | `src-goal-authority-primary-cadence-contract--h08-final-model-request-input` | `goal-authority-primary-cadence-contract.md` h08 | `T-FINAL` | `T-CADENCE`, `T-DURABLE`, `T-CLEANUP` | `RV-FINAL` | final |
| 021 | `src-goal-authority-final-request-input-and-commit--h08-commit-metadata` | `goal-authority-final-request-input-and-commit.md` h08 | `T-FINAL` | `T-HISTORY`, `T-EVIDENCE`, `T-DURABLE` | `RV-FINAL` | final |
| 022 | `src-goal-authority-final-request-input-and-commit--h09-recorded-request-evidence` | `goal-authority-final-request-input-and-commit.md` h09 | `T-FINAL` | `T-EVIDENCE`, `T-DURABLE`, `T-HISTORY` | `RV-EVIDENCE` | final |
| 023 | `src-goal-authority-final-request-input-and-commit--h10-commit-point` | `goal-authority-final-request-input-and-commit.md` h10 | `T-FINAL` | `T-DURABLE`, `T-HISTORY`, `T-EVIDENCE` | `RV-FINAL` | final |
| 024 | `src-goal-authority-primary-cadence-contract--h10-current-authority` | `goal-authority-primary-cadence-contract.md` h10 | `T-BEHAVIOR` | `T-FINAL`, `T-CLEANUP`, `T-DURABLE` | `RV-FINAL` | authority |
| 025 | `src-goal-authority-primary-cadence-contract--h11-proving-current-authority` | `goal-authority-primary-cadence-contract.md` h11 | `T-FINAL` | `T-CLEANUP`, `T-BEHAVIOR` | `RV-FINAL` | final |
| 026 | `src-goal-authority-final-request-input-and-commit--h11-retry-and-follow-up` | `goal-authority-final-request-input-and-commit.md` h11 | `T-FINAL` | `T-CADENCE`, `T-DURABLE`, `T-HISTORY`, `T-EVIDENCE` | `RV-FINAL` | final |
| 027 | `src-goal-authority-primary-cadence-contract--h04s04-current-turn-carry` | `goal-authority-primary-cadence-contract.md` h04 s04 | `T-FINAL` | `T-CLEANUP`, `T-IDLE`, `T-HISTORY` | `RV-FINAL` | final |
| 028 | `src-goal-authority-final-request-input-and-commit--h12-current-turn-carry` | `goal-authority-final-request-input-and-commit.md` h12 | `T-FINAL` | `T-CLEANUP`, `T-IDLE`, `T-HISTORY`, `T-TEST-PREP` | `RV-FINAL` | final |
| 029 | `src-goal-authority-final-request-input-and-commit--h13-goals-rs-adapter` | `goal-authority-final-request-input-and-commit.md` h13 | `T-FINAL` | `T-CADENCE`, `T-EXT`, `T-SHIM` | `RV-FINAL` | final |
| 030 | `src-goal-authority-primary-cadence-contract--h06s02-continuation` | `goal-authority-primary-cadence-contract.md` h06 s02 | `T-IDLE` | `T-CADENCE`, `T-HISTORY`, `T-FINAL` | `RV-IDLE` | idle |
| 031 | `src-goal-authority-primary-cadence-contract--h04s03-runtime-continuation-accounting` | `goal-authority-primary-cadence-contract.md` h04 s03 | `T-HISTORY` | `T-IDLE`, `T-FINAL`, `T-CADENCE`, `T-DURABLE` | `RV-HISTORY` | history |
| 032 | `src-goal-authority-idle-continuation-contract--h01-h04-semantic-contract` | `goal-authority-idle-continuation-contract.md` title, h01-h04 | `T-IDLE` | `T-CADENCE`, `T-FINAL`, `T-HISTORY` | `RV-IDLE` | idle |
| 033 | `src-goal-authority-idle-continuation-contract--h05-legal-callers` | `goal-authority-idle-continuation-contract.md` h05 | `T-IDLE` | `T-CADENCE`, `T-FINAL` | `RV-IDLE` | idle |
| 034 | `src-goal-authority-idle-continuation-contract--h06-required-stage-order` | `goal-authority-idle-continuation-contract.md` h06 | `T-IDLE` | `T-CADENCE`, `T-DURABLE`, `T-FINAL` | `RV-IDLE` | idle |
| 035 | `src-goal-authority-idle-continuation-contract--h07-stage-1-pending-non-goal-work` | `goal-authority-idle-continuation-contract.md` h07 | `T-IDLE` | `T-CADENCE` | `RV-IDLE` | idle |
| 036 | `src-goal-authority-idle-continuation-contract--h08-stage-2-pending-durable-goal-cadence-intent` | `goal-authority-idle-continuation-contract.md` h08 | `T-IDLE` | `T-DURABLE`, `T-CADENCE`, `T-FINAL`, `T-EXT` | `RV-IDLE` | idle |
| 037 | `src-goal-authority-idle-continuation-contract--h09-stage-3-automatic-continuation` | `goal-authority-idle-continuation-contract.md` h09 | `T-IDLE` | `T-HISTORY`, `T-FINAL`, `T-CADENCE` | `RV-IDLE` | idle |
| 038 | `src-goal-authority-idle-continuation-contract--h10-lock-and-reservation` | `goal-authority-idle-continuation-contract.md` h10 | `T-IDLE` | `T-FINAL`, `T-HISTORY` | `RV-IDLE` | idle |
| 039 | `src-goal-authority-idle-continuation-contract--h11-resume-behavior` | `goal-authority-idle-continuation-contract.md` h11 | `T-IDLE` | `T-DURABLE`, `T-HISTORY`, `T-EVIDENCE`, `T-CADENCE` | `RV-IDLE` | idle |
| 040 | `src-goal-authority-idle-continuation-contract--h12-external-goal-mutation-behavior` | `goal-authority-idle-continuation-contract.md` h12 | `T-IDLE` | `T-EXT`, `T-DURABLE`, `T-CADENCE`, `T-FINAL` | `RV-IDLE` | idle |
| 041 | `src-goal-authority-primary-cadence-contract--h17-ordering-with-pending-work` | `goal-authority-primary-cadence-contract.md` h17 | `T-IDLE` | `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-EXT` | `RV-IDLE` | idle |
| 042 | `src-goal-authority-idle-continuation-contract--h13-request-repair-interaction` | `goal-authority-idle-continuation-contract.md` h13 | `T-IDLE` | `T-CLEANUP`, `T-FINAL`, `T-CADENCE` | `RV-CLEANUP` | idle |
| 043 | `src-goal-authority-idle-continuation-contract--h14-current-terrain-to-replace` | `goal-authority-idle-continuation-contract.md` h14 | `T-IDLE` | `T-SHIM`, `T-EXT`, `T-CLEANUP` | `RV-SHIM` | idle |
| 044 | `src-goal-authority-model-visible-history-key--h01-h03-code-terrain` | `goal-authority-model-visible-history-key.md` title, h01-h03 | `T-HISTORY` | `T-IDLE`, `T-FINAL`, `NAV-README` | `RV-HISTORY` | history |
| 045 | `src-goal-authority-model-visible-history-key--h04-key-shape` | `goal-authority-model-visible-history-key.md` h04 | `T-HISTORY` | `T-IDLE`, `T-DURABLE`, `T-EVIDENCE` | `RV-HISTORY` | history |
| 046 | `src-goal-authority-model-visible-history-key--h05-eligible-progress-projection` | `goal-authority-model-visible-history-key.md` h05 | `T-HISTORY` | `T-CLEANUP`, `T-IDLE` | `RV-HISTORY` | history |
| 047 | `src-goal-authority-model-visible-history-key--h06-capture-point` | `goal-authority-model-visible-history-key.md` h06 | `T-HISTORY` | `T-FINAL`, `T-EVIDENCE` | `RV-HISTORY` | history |
| 048 | `src-goal-authority-model-visible-history-key--h07-runtime-watermark` | `goal-authority-model-visible-history-key.md` h07 | `T-HISTORY` | `T-IDLE`, `T-FINAL`, `T-DURABLE` | `RV-HISTORY` | history |
| 049 | `src-goal-authority-model-visible-history-key--h08-resume-and-restart` | `goal-authority-model-visible-history-key.md` h08 | `T-HISTORY` | `T-IDLE`, `T-DURABLE`, `T-EVIDENCE` | `RV-HISTORY` | history |
| 050 | `src-goal-authority-model-visible-history-key--h09-compaction-and-reconstruction` | `goal-authority-model-visible-history-key.md` h09 | `T-HISTORY` | `T-CLEANUP`, `T-EVIDENCE`, `T-FINAL` | `RV-HISTORY` | history |
| 051 | `src-goal-authority-recorded-request-evidence--h01-h03-code-terrain` | `goal-authority-recorded-request-evidence.md` title, h01-h03 | `T-EVIDENCE` | `T-FINAL`, `T-HISTORY`, `NAV-README` | `RV-EVIDENCE` | evidence |
| 052 | `src-goal-authority-recorded-request-evidence--h04-h05-core-rule-correctness-split` | `goal-authority-recorded-request-evidence.md` h04-h05 | `T-EVIDENCE` | `T-FINAL`, `T-DURABLE`, `T-HISTORY` | `RV-EVIDENCE` | evidence |
| 053 | `src-goal-authority-recorded-request-evidence--h06-carrier-choice` | `goal-authority-recorded-request-evidence.md` h06 | `T-EVIDENCE` | `T-FINAL`, `T-HISTORY` | `RV-EVIDENCE` | evidence |
| 054 | `src-goal-authority-recorded-request-evidence--h07-h08-evidence-shape-fingerprints` | `goal-authority-recorded-request-evidence.md` h07-h08 | `T-EVIDENCE` | `T-FINAL`, `T-DURABLE`, `T-HISTORY` | `RV-EVIDENCE` | evidence |
| 055 | `src-goal-authority-recorded-request-evidence--h09-h10-commit-timing-failure-policy` | `goal-authority-recorded-request-evidence.md` h09-h10 | `T-EVIDENCE` | `T-FINAL`, `T-DURABLE` | `RV-EVIDENCE` | evidence |
| 056 | `src-goal-authority-recorded-request-evidence--h11-replay-semantics` | `goal-authority-recorded-request-evidence.md` h11 | `T-EVIDENCE` | `T-HISTORY`, `T-CLEANUP`, `T-FINAL` | `RV-EVIDENCE` | evidence |
| 057 | `src-goal-authority-recorded-request-evidence--h12-resume-and-continuation-suppression` | `goal-authority-recorded-request-evidence.md` h12 | `T-EVIDENCE` | `T-IDLE`, `T-HISTORY`, `T-DURABLE` | `RV-EVIDENCE` | evidence |
| 058 | `src-goal-authority-recorded-request-evidence--h13-rollback-and-fork` | `goal-authority-recorded-request-evidence.md` h13 | `T-EVIDENCE` | `T-CLEANUP`, `T-HISTORY`, `T-DURABLE` | `RV-EVIDENCE` | evidence |
| 059 | `src-goal-authority-recorded-request-evidence--h14-compaction` | `goal-authority-recorded-request-evidence.md` h14 | `T-EVIDENCE` | `T-CLEANUP`, `T-HISTORY`, `T-FINAL` | `RV-EVIDENCE` | evidence |
| 060 | `src-goal-authority-recorded-request-evidence--h15-raw-and-typed-projection` | `goal-authority-recorded-request-evidence.md` h15 | `T-EVIDENCE` | `T-CLEANUP`, `T-TEST-PREP` | `RV-EVIDENCE` | evidence |
| 061 | `src-goal-authority-recorded-request-evidence--h16-version-plan-notes` | `goal-authority-recorded-request-evidence.md` h16 | `T-EVIDENCE` | `T-READINESS`, `T-FINAL`, `T-DURABLE` | `RV-EVIDENCE` | evidence |
| 062 | `src-goal-authority-grounding-truth--h09-legacy-goal-artifact-handling` | `goal-authority-grounding-truth.md` h09 | `T-CLEANUP` | `T-SHIM`, `T-BEHAVIOR` | `RV-CLEANUP` | cleanup |
| 063 | `src-goal-authority-grounding-truth--h10-h11-request-repair-decision-table` | `goal-authority-grounding-truth.md` h10-h11 | `T-CLEANUP` | `T-FINAL`, `T-CADENCE`, `T-IDLE` | `RV-CLEANUP` | cleanup |
| 064 | `src-goal-authority-primary-cadence-contract--h12-h13-request-repair-decision-table` | `goal-authority-primary-cadence-contract.md` h12-h13 | `T-CLEANUP` | `T-FINAL`, `T-CADENCE`, `T-IDLE` | `RV-CLEANUP` | cleanup |
| 065 | `src-goal-authority-primary-cadence-contract--h14-legacy-goal-artifact` | `goal-authority-primary-cadence-contract.md` h14 | `T-CLEANUP` | `T-SHIM`, `T-BEHAVIOR` | `RV-CLEANUP` | cleanup |
| 066 | `src-goal-authority-primary-cadence-contract--h16-shared-classification` | `goal-authority-primary-cadence-contract.md` h16 | `T-CLEANUP` | `T-FINAL`, `T-BEHAVIOR`, `T-SHIM` | `RV-CLEANUP` | cleanup |
| 067 | `src-goal-authority-repair-classifier-integration--h01-h03-code-terrain` | `goal-authority-repair-classifier-integration.md` title, h01-h03 | `T-CLEANUP` | `T-FINAL`, `NAV-README` | `RV-CLEANUP` | cleanup |
| 068 | `src-goal-authority-repair-classifier-integration--h04-h05-classifier-output-purity` | `goal-authority-repair-classifier-integration.md` h04-h05 | `T-CLEANUP` | `T-FINAL`, `T-BEHAVIOR`, `GLOSSARY` | `RV-CLEANUP` | cleanup |
| 069 | `src-goal-authority-repair-classifier-integration--h06-final-request-input-repair` | `goal-authority-repair-classifier-integration.md` h06 | `T-CLEANUP` | `T-FINAL`, `T-CADENCE`, `T-IDLE` | `RV-CLEANUP` | cleanup |
| 070 | `src-goal-authority-repair-classifier-integration--h07-event-mapping-and-typed-projection` | `goal-authority-repair-classifier-integration.md` h07 | `T-CLEANUP` | `T-SHIM`, `T-TEST-PREP` | `RV-CLEANUP` | cleanup |
| 071 | `src-goal-authority-repair-classifier-integration--h08-contextual-parsing-and-history-boundaries` | `goal-authority-repair-classifier-integration.md` h08 | `T-CLEANUP` | `T-HISTORY`, `T-SHIM` | `RV-CLEANUP` | cleanup |
| 072 | `src-goal-authority-repair-classifier-integration--h09-compaction` | `goal-authority-repair-classifier-integration.md` h09 | `T-CLEANUP` | `T-FINAL`, `T-HISTORY`, `T-EVIDENCE` | `RV-CLEANUP` | cleanup |
| 073 | `src-goal-authority-repair-classifier-integration--h10-rollout-reconstruction-rollback-fork` | `goal-authority-repair-classifier-integration.md` h10 | `T-CLEANUP` | `T-FINAL`, `T-HISTORY`, `T-EVIDENCE` | `RV-CLEANUP` | cleanup |
| 074 | `src-goal-authority-repair-classifier-integration--h11-raw-response-notifications` | `goal-authority-repair-classifier-integration.md` h11 | `T-CLEANUP` | `T-EVIDENCE`, `T-TEST-PREP` | `RV-CLEANUP` | cleanup |
| 075 | `src-goal-authority-repair-classifier-integration--h12-classifier-ownership` | `goal-authority-repair-classifier-integration.md` h12 | `T-CLEANUP` | `T-FINAL`, `T-SHIM` | `RV-CLEANUP` | cleanup |
| 076 | `src-goal-authority-ext-goal-ownership--h01-h02-purpose` | `goal-authority-ext-goal-ownership.md` title, h01-h02 | `T-EXT` | `T-BEHAVIOR`, `T-FINAL`, `NAV-README` | `RV-EXT` | extension |
| 077 | `src-goal-authority-ext-goal-ownership--h03-h04-code-terrain-upstream-shape` | `goal-authority-ext-goal-ownership.md` h03-h04 | `T-EXT` | `T-SHIM`, `T-FINAL`, `NAV-README` | `RV-EXT` | extension |
| 078 | `src-goal-authority-ext-goal-ownership--h05-ownership-decision` | `goal-authority-ext-goal-ownership.md` h05 | `T-EXT` | `T-FINAL`, `T-CADENCE`, `T-DURABLE` | `RV-EXT` | extension |
| 079 | `src-goal-authority-ext-goal-ownership--h06-required-replacement-shape` | `goal-authority-ext-goal-ownership.md` h06 | `T-EXT` | `T-IDLE`, `T-DURABLE`, `T-CADENCE`, `T-FINAL` | `RV-EXT` | extension |
| 080 | `src-goal-authority-ext-goal-ownership--h07-configuration` | `goal-authority-ext-goal-ownership.md` h07 | `T-EXT` | `T-BEHAVIOR`, `T-TEST-PREP` | `RV-EXT` | extension |
| 081 | `src-goal-authority-ext-goal-ownership--h08-reachability-rule` | `goal-authority-ext-goal-ownership.md` h08 | `T-EXT` | `T-SHIM`, `T-FINAL`, `T-TEST-PREP` | `RV-EXT` | extension |
| 082 | `src-goal-authority-ext-goal-ownership--h09-file-specific-work-areas` | `goal-authority-ext-goal-ownership.md` h09 | `T-EXT` | `T-FINAL`, `T-SHIM`, `T-TEST-PREP` | `RV-EXT` | extension |
| 083 | `src-goal-authority-primary-cadence-contract--h15-fake-shim-deletion-target` | `goal-authority-primary-cadence-contract.md` h15 | `T-SHIM` | `T-FINAL`, `T-EXT`, `T-CLEANUP`, `T-CADENCE` | `RV-SHIM` | shim |
| 084 | `src-goal-authority-fake-shim-removal-map--h01-h02-purpose` | `goal-authority-fake-shim-removal-map.md` title, h01-h02 | `T-SHIM` | `T-BEHAVIOR`, `T-FINAL`, `NAV-README` | `RV-SHIM` | shim |
| 085 | `src-goal-authority-fake-shim-removal-map--h03s01-core-goalcontext-shim` | `goal-authority-fake-shim-removal-map.md` h03 s01 | `T-SHIM` | `T-CLEANUP`, `T-FINAL` | `RV-SHIM` | shim |
| 086 | `src-goal-authority-fake-shim-removal-map--h03s02-core-goal-steering-producer` | `goal-authority-fake-shim-removal-map.md` h03 s02 | `T-SHIM` | `T-FINAL`, `T-CADENCE`, `T-EXT` | `RV-SHIM` | shim |
| 087 | `src-goal-authority-fake-shim-removal-map--h03s03-extension-goal-steering-producer` | `goal-authority-fake-shim-removal-map.md` h03 s03 | `T-SHIM` | `T-EXT`, `T-FINAL`, `T-CADENCE` | `RV-SHIM` | shim |
| 088 | `src-goal-authority-fake-shim-removal-map--h04-shim-dependent-consumers-intro` | `goal-authority-fake-shim-removal-map.md` h04 intro | `T-SHIM` | `T-CLEANUP`, `T-FINAL` | `RV-SHIM` | shim |
| 089 | `src-goal-authority-fake-shim-removal-map--h04s01-event-and-ui-hiding` | `goal-authority-fake-shim-removal-map.md` h04 s01 | `T-CLEANUP` | `T-SHIM`, `T-TEST-PREP` | `RV-CLEANUP` | cleanup |
| 090 | `src-goal-authority-fake-shim-removal-map--h04s02-compaction` | `goal-authority-fake-shim-removal-map.md` h04 s02 | `T-CLEANUP` | `T-FINAL`, `T-SHIM`, `T-HISTORY` | `RV-CLEANUP` | cleanup |
| 091 | `src-goal-authority-fake-shim-removal-map--h04s03-rollout-reconstruction` | `goal-authority-fake-shim-removal-map.md` h04 s03 | `T-CLEANUP` | `T-EVIDENCE`, `T-HISTORY`, `T-SHIM` | `RV-CLEANUP` | cleanup |
| 092 | `src-goal-authority-fake-shim-removal-map--h04s04-history-and-user-turn-boundaries` | `goal-authority-fake-shim-removal-map.md` h04 s04 | `T-CLEANUP` | `T-HISTORY`, `T-IDLE`, `T-SHIM` | `RV-CLEANUP` | cleanup |
| 093 | `src-goal-authority-fake-shim-removal-map--h04s05-contextual-fragment-infrastructure` | `goal-authority-fake-shim-removal-map.md` h04 s05 | `T-CLEANUP` | `T-FINAL`, `T-SHIM`, `GLOSSARY` | `RV-CLEANUP` | cleanup |
| 094 | `src-goal-authority-fake-shim-removal-map--h05-what-to-remove` | `goal-authority-fake-shim-removal-map.md` h05 | `T-SHIM` | `T-READINESS`, `T-TEST-PREP` | `RV-SHIM` | shim |
| 095 | `src-goal-authority-fake-shim-removal-map--h06-required-legacy-artifact-handling` | `goal-authority-fake-shim-removal-map.md` h06 | `T-CLEANUP` | `T-SHIM`, `T-TEST-PREP` | `RV-CLEANUP` | cleanup |
| 096 | `src-goal-authority-fake-shim-removal-map--h07-what-to-replace-with` | `goal-authority-fake-shim-removal-map.md` h07 | `T-FINAL` | `T-CLEANUP`, `T-CADENCE`, `T-SHIM` | `RV-FINAL` | final |
| 097 | `src-goal-authority-fake-shim-removal-map--h08-required-work-areas-intro` | `goal-authority-fake-shim-removal-map.md` h08 intro | `T-SHIM` | `T-READINESS`, `T-TEST-PREP` | `RV-SHIM` | shim |
| 098 | `src-goal-authority-fake-shim-removal-map--h08s01-final-request-input-goal-shaping` | `goal-authority-fake-shim-removal-map.md` h08 s01 | `T-FINAL` | `T-CLEANUP`, `T-TEST-PREP`, `T-SHIM` | `RV-FINAL` | final |
| 099 | `src-goal-authority-fake-shim-removal-map--h08s02-generic-internal-context-helpers` | `goal-authority-fake-shim-removal-map.md` h08 s02 | `T-CLEANUP` | `T-FINAL`, `T-TEST-PREP`, `T-SHIM` | `RV-CLEANUP` | cleanup |
| 100 | `src-goal-authority-fake-shim-removal-map--h08s03-classifiers-and-legacy-handling` | `goal-authority-fake-shim-removal-map.md` h08 s03 | `T-CLEANUP` | `T-TEST-PREP`, `T-SHIM` | `RV-CLEANUP` | cleanup |
| 101 | `src-goal-authority-fake-shim-removal-map--h08s04-active-core-steering` | `goal-authority-fake-shim-removal-map.md` h08 s04 | `T-FINAL` | `T-CADENCE`, `T-TEST-PREP`, `T-SHIM` | `RV-FINAL` | final |
| 102 | `src-goal-authority-fake-shim-removal-map--h08s05-extension-steering` | `goal-authority-fake-shim-removal-map.md` h08 s05 | `T-EXT` | `T-FINAL`, `T-TEST-PREP`, `T-SHIM` | `RV-EXT` | extension |
| 103 | `src-goal-authority-fake-shim-removal-map--h08s06-cleanup-consumers` | `goal-authority-fake-shim-removal-map.md` h08 s06 | `T-CLEANUP` | `T-TEST-PREP`, `T-SHIM` | `RV-CLEANUP` | cleanup |
| 104 | `src-goal-authority-fake-shim-removal-map--h09-integration-with-cadence-contract` | `goal-authority-fake-shim-removal-map.md` h09 | `T-SHIM` | `T-CADENCE`, `T-FINAL` | `RV-SHIM` | shim |
| 105 | `src-goal-authority-final-request-input-and-commit--h14-tests` | `goal-authority-final-request-input-and-commit.md` h14 | `T-TEST-PREP` | `T-FINAL`, `T-CADENCE`, `T-DURABLE` | `RV-FINAL` | test-prep |
| 106 | `src-goal-authority-idle-continuation-contract--h15-acceptance-tests` | `goal-authority-idle-continuation-contract.md` h15 | `T-TEST-PREP` | `T-IDLE`, `T-HISTORY`, `T-CADENCE`, `T-FINAL` | `RV-IDLE` | test-prep |
| 107 | `src-goal-authority-model-visible-history-key--h10-tests` | `goal-authority-model-visible-history-key.md` h10 | `T-TEST-PREP` | `T-HISTORY`, `T-IDLE`, `T-FINAL` | `RV-HISTORY` | test-prep |
| 108 | `src-goal-authority-recorded-request-evidence--h17-tests` | `goal-authority-recorded-request-evidence.md` h17 | `T-TEST-PREP` | `T-EVIDENCE`, `T-FINAL`, `T-HISTORY`, `T-CLEANUP` | `RV-EVIDENCE` | test-prep |
| 109 | `src-goal-authority-repair-classifier-integration--h13-tests` | `goal-authority-repair-classifier-integration.md` h13 | `T-TEST-PREP` | `T-CLEANUP`, `T-FINAL`, `T-SHIM` | `RV-CLEANUP` | test-prep |
| 110 | `src-goal-authority-ext-goal-ownership--h10-tests` | `goal-authority-ext-goal-ownership.md` h10 | `T-TEST-PREP` | `T-EXT`, `T-FINAL`, `T-SHIM` | `RV-EXT` | test-prep |
| 111 | `src-goal-authority-grounding-truth--h13-acceptance-standard` | `goal-authority-grounding-truth.md` h13 | `T-TEST-PREP` | `T-BEHAVIOR`, `T-FINAL`, `T-EVIDENCE`, `T-CLEANUP`, `T-CADENCE` | `RV-FINAL` | test-prep |
| 112 | `src-goal-authority-primary-cadence-contract--h18-verification-checklist` | `goal-authority-primary-cadence-contract.md` h18 | `T-TEST-PREP` | `T-CADENCE`, `T-FINAL`, `T-DURABLE`, `T-IDLE` | `RV-DURABLE` | test-prep |
| 113 | `src-goal-test-deletion-map--h01-h02-prep-rule` | `goal-test-deletion-map.md` title, h01-h02 | `T-TEST-PREP` | `OP-AGENTS`, `NAV-README` | `RV-SHIM` | test-prep |
| 114 | `src-goal-test-deletion-map--h03-delete-local-only-fake-context-tests` | `goal-test-deletion-map.md` h03 | `T-TEST-PREP` | `T-CLEANUP`, `T-SHIM` | `RV-SHIM` | test-prep |
| 115 | `src-goal-test-deletion-map--h04-delete-local-only-core-overlay-tests` | `goal-test-deletion-map.md` h04 | `T-TEST-PREP` | `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE` | `RV-DURABLE` | test-prep |
| 116 | `src-goal-test-deletion-map--h05-delete-local-only-app-server-steering-overlay` | `goal-test-deletion-map.md` h05 | `T-TEST-PREP` | `T-FINAL`, `T-BEHAVIOR` | `RV-FINAL` | test-prep |
| 117 | `src-goal-test-deletion-map--h06-delete-local-only-tui-overlay-tests` | `goal-test-deletion-map.md` h06 | `T-TEST-PREP` | `T-CADENCE`, `T-IDLE`, `T-EXT` | `None` | test-prep |
| 118 | `src-goal-test-deletion-map--h07-revert-steering-role-config-overlay` | `goal-test-deletion-map.md` h07 | `T-TEST-PREP` | `T-EXT`, `T-BEHAVIOR` | `RV-EXT` | test-prep |
| 119 | `src-goal-test-deletion-map--h08-revert-existing-test-files-to-upstream-baseline` | `goal-test-deletion-map.md` h08 | `T-TEST-PREP` | `OP-AGENTS` | `None` | test-prep |
| 120 | `src-goal-test-deletion-map--h09s01-core-runtime-tool-baseline` | `goal-test-deletion-map.md` h09 labeled core runtime/tool family | `T-TEST-PREP` | `T-CADENCE`, `T-DURABLE`, `T-IDLE` | `RV-DURABLE` | test-prep |
| 121 | `src-goal-test-deletion-map--h09s02-app-server-goal-api-baseline` | `goal-test-deletion-map.md` h09 labeled app-server family | `T-TEST-PREP` | `T-BEHAVIOR`, `T-FINAL` | `None` | test-prep |
| 122 | `src-goal-test-deletion-map--h09s03-tui-command-validation-baseline` | `goal-test-deletion-map.md` h09 labeled TUI command/validation family | `T-TEST-PREP` | `OP-AGENTS`, `T-EXT` | `None` | test-prep |
| 123 | `src-goal-test-deletion-map--h09s04-tui-status-budget-review-action-baseline` | `goal-test-deletion-map.md` h09 labeled TUI status/budget/review/action family | `T-TEST-PREP` | `T-CADENCE`, `OP-AGENTS` | `None` | test-prep |
| 124 | `src-goal-test-deletion-map--h09s05-extension-backend-baseline` | `goal-test-deletion-map.md` h09 labeled extension backend family | `T-TEST-PREP` | `T-EXT`, `T-SHIM` | `RV-EXT` | test-prep |
| 125 | `src-goal-test-deletion-map--h10s01-final-model-request-input` | `goal-test-deletion-map.md` h10 labeled final model request input family | `T-TEST-PREP` | `T-BEHAVIOR`, `T-FINAL` | `RV-FINAL` | test-prep |
| 126 | `src-goal-test-deletion-map--h10s02-durable-pending-cadence-intent` | `goal-test-deletion-map.md` h10 labeled durable pending cadence intent family | `T-TEST-PREP` | `T-DURABLE`, `T-CADENCE`, `T-FINAL` | `RV-DURABLE` | test-prep |
| 127 | `src-goal-test-deletion-map--h10s03-resume-and-idle-lifecycle` | `goal-test-deletion-map.md` h10 labeled resume and idle lifecycle family | `T-TEST-PREP` | `T-IDLE`, `T-HISTORY`, `T-DURABLE` | `RV-IDLE` | test-prep |
| 128 | `src-goal-test-deletion-map--h10s04-repair-and-legacy-artifacts` | `goal-test-deletion-map.md` h10 labeled repair and legacy artifacts family | `T-TEST-PREP` | `T-CLEANUP`, `T-FINAL`, `T-SHIM` | `RV-CLEANUP` | test-prep |
| 129 | `src-goal-test-deletion-map--h10s05-recorded-request-evidence` | `goal-test-deletion-map.md` h10 labeled recorded request evidence family | `T-TEST-PREP` | `T-EVIDENCE`, `T-FINAL`, `T-HISTORY`, `T-CLEANUP` | `RV-EVIDENCE` | test-prep |
| 130 | `src-goal-test-deletion-map--h10s06-local-behavior-readditions` | `goal-test-deletion-map.md` h10 labeled local behavior re-additions family | `T-TEST-PREP` | `T-CADENCE`, `T-IDLE`, `OP-AGENTS` | `None` | test-prep |
| 131 | `src-goal-test-deletion-map--h11-snapshot-handling` | `goal-test-deletion-map.md` h11 | `T-TEST-PREP` | `OP-AGENTS` | `None` | test-prep |
| 132 | `src-goal-authority-grounding-truth--h14-conformance-requirements` | `goal-authority-grounding-truth.md` h14 | `T-READINESS` | `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`, `T-CLEANUP`, `T-EVIDENCE`, `T-TEST-PREP` | `RV-FINAL` | readiness |
| 133 | `src-goal-authority-primary-cadence-contract--h19-version-plan-requirements` | `goal-authority-primary-cadence-contract.md` h19 | `T-READINESS` | `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-TEST-PREP` | `RV-DURABLE` | readiness |
| 134 | `src-goal-authority-open-design-deliverables--h01-h02-corrected-posture` | `goal-authority-open-design-deliverables.md` title, h01-h02 | `T-READINESS` | `T-BEHAVIOR`, `T-FINAL`, `NAV-README` | `RV-FINAL` | readiness |
| 135 | `src-goal-authority-open-design-deliverables--h03-consolidated-docs` | `goal-authority-open-design-deliverables.md` h03 | `T-READINESS` | `T-DURABLE`, `T-FINAL`, `T-EVIDENCE` | `None` | readiness |
| 136 | `src-goal-authority-open-design-deliverables--h04-current-status` | `goal-authority-open-design-deliverables.md` h04 | `T-READINESS` | `OP-AGENTS`, `NAV-README` | `None` | readiness |
| 137 | `src-goal-authority-open-design-deliverables--h05s01-durable-cadence-state` | `goal-authority-open-design-deliverables.md` h05 s01 | `T-READINESS` | `T-DURABLE`, `T-CADENCE` | `RV-DURABLE` | readiness |
| 138 | `src-goal-authority-open-design-deliverables--h05s02-final-request-input-shaping-and-commit` | `goal-authority-open-design-deliverables.md` h05 s02 | `T-READINESS` | `T-FINAL`, `T-DURABLE`, `T-HISTORY` | `RV-FINAL` | readiness |
| 139 | `src-goal-authority-open-design-deliverables--h05s03-model-visible-history-key` | `goal-authority-open-design-deliverables.md` h05 s03 | `T-READINESS` | `T-HISTORY`, `T-IDLE`, `T-CLEANUP` | `RV-HISTORY` | readiness |
| 140 | `src-goal-authority-open-design-deliverables--h05s04-ext-goal-ownership` | `goal-authority-open-design-deliverables.md` h05 s04 | `T-READINESS` | `T-EXT`, `T-SHIM`, `T-FINAL` | `RV-EXT` | readiness |
| 141 | `src-goal-authority-open-design-deliverables--h05s05-repair-and-classifier-integration` | `goal-authority-open-design-deliverables.md` h05 s05 | `T-READINESS` | `T-CLEANUP`, `T-FINAL`, `T-EVIDENCE` | `RV-CLEANUP` | readiness |
| 142 | `src-goal-authority-open-design-deliverables--h06-readiness-rule` | `goal-authority-open-design-deliverables.md` h06 | `T-READINESS` | `OP-AGENTS`, `NAV-README` | `None` | readiness |
| 143 | `src-goal-authority-grounding-truth--h05-terminology` | `goal-authority-grounding-truth.md` h05 | `GLOSSARY` | `T-BEHAVIOR`, `T-CADENCE`, `T-FINAL`, `T-CLEANUP` | `None` | glossary |
| 144 | `src-AGENTS--intro` | `AGENTS.md` title and intro before h01 | `OP-AGENTS` | `NAV-README`, `T-READINESS` | `None` | operations |
| 145 | `src-AGENTS--h01-authority-order` | `AGENTS.md` h01 | `OP-AGENTS` | `NAV-README`, `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-EXT`, `T-SHIM`, `T-TEST-PREP`, `T-READINESS` | `None` | operations |
| 146 | `src-AGENTS--h02-navigation-and-document-roles` | `AGENTS.md` h02 | `OP-AGENTS` | `NAV-README`, `GLOSSARY` | `None` | operations |
| 147 | `src-AGENTS--h03-design-deliverables` | `AGENTS.md` h03 | `OP-AGENTS` | `T-READINESS` | `None` | operations |
| 148 | `src-AGENTS--h04-non-negotiables` | `AGENTS.md` h04 | `OP-AGENTS` | `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-EXT`, `T-SHIM`, `T-TEST-PREP` | `None` | operations |
| 149 | `src-AGENTS--h05-test-prep-posture` | `AGENTS.md` h05 | `OP-AGENTS` | `T-TEST-PREP` | `None` | operations |
| 150 | `src-AGENTS--h06-working-posture` | `AGENTS.md` h06 | `OP-AGENTS` | `NAV-README`, `T-SHIM`, `T-READINESS` | `None` | operations |
| 151 | `src-AGENTS--h07-verification` | `AGENTS.md` h07 | `OP-AGENTS` | `T-TEST-PREP` | `None` | operations |
| 152 | `src-README--intro` | `README.md` title, intro, and `Start with` list before h01 | `NAV-README` | `OP-AGENTS`, `GLOSSARY` | `None` | navigation |
| 153 | `src-README--h01-authority-spine` | `README.md` h01 | `NAV-README` | `T-BEHAVIOR`, `T-CADENCE`, `T-IDLE`, `T-SHIM`, `T-TEST-PREP` | `None` | navigation |
| 154 | `src-README--h02-core-through-line` | `README.md` h02 | `NAV-README` | `T-DURABLE`, `T-FINAL`, `T-EVIDENCE`, `T-CLEANUP` | `None` | navigation |
| 155 | `src-README--h03-supporting-seams` | `README.md` h03 | `NAV-README` | `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-EXT`, `T-SHIM`, `T-TEST-PREP`, `T-READINESS`, `OP-AGENTS`, `GLOSSARY` | `None` | navigation |
| 156 | `src-README--h04-current-terrain-anchors` | `README.md` h04 | `NAV-README` | `T-SHIM`, `T-FINAL`, `T-DURABLE`, `T-HISTORY`, `T-CLEANUP`, `T-EXT` | `None` | navigation |
| 157 | `src-README--h05-document-roles` | `README.md` h05 | `NAV-README` | `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-EXT`, `T-SHIM`, `T-TEST-PREP`, `T-READINESS`, `OP-AGENTS`, `GLOSSARY` | `None` | navigation |
| 158 | `src-README--h06-pass-2-guardrails` | `README.md` h06 | `NAV-README` | `OP-AGENTS`, `T-READINESS`, `T-TEST-PREP` | `None` | navigation |
| 159 | `src-CONTEXT--all` | `CONTEXT.md` whole doc | `GLOSSARY` | `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-EXT`, `T-SHIM`, `T-TEST-PREP`, `T-READINESS`, `OP-AGENTS`, `NAV-README` | `None` | glossary |

## Explicit Source-Slice Exclusions

| Excluded material | Reason |
| --- | --- |
| `goal-authority-recorded-request-evidence-design-pass-handoff.md` | Executed handoff/provenance artifact. The source feed is `goal-authority-recorded-request-evidence.md`. |
| `PASS2_SECTION_TRACEABILITY.md` and `PASS2_CONCEPT_LEDGER.md` | Pass 2A prep and audit artifacts. Use them for coverage and tripwire checks, not source rewrite rows. |
| `PASS2B_TARGET_INTERFACES.md`, `pass2b_target_interfaces/README.md`, target-interface packets, repeated-authority index, and repeated-authority batch files | Pass 2B and Pass 2B.5 interface/compression inputs. Use them for owner and repeated-authority checks, not as source authority prose. |
| `PASS2C_PLANNING_HANDOFF.md`, `PASS2C_REWRITE_PLAN.md`, `pass2c_rewrite_plan/README.md`, `pass2c_rewrite_plan/PASSFORWARD.md`, and `pass2c_rewrite_plan/packet-*.md` | Pass 2C planning and handoff artifacts. They guide execution design but are not source-corpus rows. |
| Future `pass2c_rewrite/` artifacts | Future execution outputs or closure records, not input source corpus for replacing the old docs. |

## Coverage Check

Every source doc in Packet 06e is represented in the ordered table or in the
explicit exclusions:

- `goal-authority-grounding-truth.md`
- `goal-authority-primary-cadence-contract.md`
- `goal-authority-idle-continuation-contract.md`
- `goal-authority-durable-cadence-state.md`
- `goal-authority-final-request-input-and-commit.md`
- `goal-authority-model-visible-history-key.md`
- `goal-authority-recorded-request-evidence.md`
- `goal-authority-repair-classifier-integration.md`
- `goal-authority-ext-goal-ownership.md`
- `goal-authority-fake-shim-removal-map.md`
- `goal-test-deletion-map.md`
- `goal-authority-open-design-deliverables.md`
- `AGENTS.md`
- `README.md`
- `CONTEXT.md`

No unresolved row-order, source-coverage, or exclusion question remains for
Packet 08. Packet 09 may now plan the route-verification question families
named by this table without changing the source-slice order by default.

## Output Expected

A concrete ordered source-slice table that later source-slice execution can
use as its first source queue, subject to Packet 09 route verification and the
workflow/record shape still owned by later packets.

## Closure Criteria

- Every included source slice has a bounded source range and stable ID.
- Every reviewed source doc is included or explicitly excluded.
- Every row has a primary target, secondary checks, route flag, and audit
  category.
- The table follows Packet 07 owner-anchor ordering.
- The table does not start rewrite execution or create successor drafts,
  source-slice records, trace closures, workflow templates, audit checklists,
  or cutover gates.

## Non-Goals

- Writing successor authority prose.
- Creating `pass2c_rewrite/` execution artifacts.
- Defining route-verification question families in detail.
- Defining per-slice workflow or record schema.
- Defining repeated-authority compression gates.
- Defining cutover gates.
