# Slice Record: src-goal-authority-final-request-input-and-commit--h05-h07-shaping-selection

Status: closed

Packet 08 order: 005

Source range: `goal-authority-final-request-input-and-commit.md` h05-h07

Primary target: `T-FINAL`

Secondary checks: `T-CADENCE`, `T-DURABLE`, `T-IDLE`, `T-CLEANUP`,
`T-HISTORY`

Route flag: `RV-FINAL`

Audit category: final

Future record path: `pass2c_rewrite/slice_records/src-goal-authority-final-request-input-and-commit--h05-h07-shaping-selection.md`

Successor files touched:

- `pass2c_rewrite/successor_drafts/draft-goal-authority-final-request-input-and-commit.md`

## Grounding Read

- Source slice: `goal-authority-final-request-input-and-commit.md` h05-h07,
  read directly before editing.
- Pass 2 traceability: rows 194-196 for Final Request-Input Shaping, Shaping
  Responsibilities, and Selection Order; row 197 kept as the next-row boundary.
- Concept ledger: Goal authority, developer-role active steering,
  internal-context provenance, active Goal steering text shape, final model
  request input, final request-input shaping, commit metadata and item
  fingerprint, durable Goal facts, durable facts version, pending cadence
  intent, exact-key consumption, cadence events, supersedence, Initial,
  ObjectiveUpdated, BudgetLimit, automatic Continuation, feature and
  collaboration eligibility, ordinary user turns, cadence-required authority,
  request repair, current authority proof sources, retry behavior, same-turn
  follow-up, current-turn carry, model-visible history key, eligible progress
  projection, Continuation watermark, resume hydration, classifier outputs,
  purity rules, compaction, previous-response/model-context transitions, and
  high-risk repeated authority rows 139-150 where applicable.
- Target interfaces: `T-FINAL`, `T-CADENCE`, and `T-DURABLE` from Pass 2B
  Packet 1; `T-IDLE`, `T-HISTORY`, and `T-CLEANUP` from Pass 2B Packet 2;
  Packet 5 consistency checked for no owner conflict.
- Repeated authority: Pass 2B.5 Batch 1 final request-input developer-role
  proof, pending Initial/ObjectiveUpdated/BudgetLimit until commit, exact-key
  consumption, active durable state alone, ordinary user turns; Batch 2
  automatic Continuation and watermarking, retry/follow-up/same-turn metadata,
  current-turn carry; Batch 3 request-local repair and
  classifier/provenance/helper/projection non-authority.
- Route material: `02-final-request-input-shaping-and-commit.md`,
  `02-direct-split-readiness-check.md`, `03g-continuation-created-commit.md`,
  `03i-retry-failure-and-stale-synthetic-turn-tests.md`,
  `04a-adapter-runtime-ordering-and-cadence-request-adapter.md`,
  `04h-wa04-tests-and-final-payload-verification.md`,
  `06b-core-active-producer-and-carry-deletion.md`,
  `06g-final-acceptance-tests-and-audit-gates.md`, and
  `goal-work-area-coordination-note.md`.

## Source-To-Target Trace

| Source clause | Successor placement | Treatment |
| --- | --- | --- |
| The shaping function owns Goal authority for a request attempt. | `Final Request-Input Shaping` | Preserved directly as the request-input shaper owning Goal authority for one model request attempt. |
| Logical signature for `finalize_goal_request_input(...)`. | `Final Request-Input Shaping` | Preserved as the logical contract. |
| Attempt context fields: thread and turn id, attempt ordinal, current durable snapshot and facts version, pending Initial/ObjectiveUpdated/BudgetLimit snapshot, optional runtime Continuation request, eligibility facts, model-visible history key, transport context, and repair context. | `Final Request-Input Shaping` | Preserved completely; durable, idle, history, transport, and cleanup internals remain with their owners. |
| Output fields `input`, `commit`, and `repair_report`. | `Final Request-Input Shaping` | Preserved directly and sharpened as shaped input, exact-item inert commit metadata, and diagnostic/test support. |
| Feature or collaboration ineligibility selects no active item and consumes no pending cadence intent. | `Final Request-Input Shaping` | Preserved directly as a delivery-gate rule, not cadence authority, durable facts, helper authority, or proof. |
| Inspect the actual `Vec<ResponseItem>` that would otherwise become `Prompt.input`. | `Shaping Responsibilities` | Preserved directly and aligned with the request-loop placement route. |
| Classify current Goal internal-context items and legacy `<goal_context>` artifacts. | `Shaping Responsibilities` | Preserved as cleanup support, not authority. |
| Remove, ignore, or replace stale, wrong-role, duplicate, legacy, or pre-injected Goal-looking items. | `Shaping Responsibilities` | Preserved with cleanup contract boundary. |
| Select at most one Goal cadence item. | `Shaping Responsibilities` | Preserved as final seam selection from cadence-owned due inputs. |
| Render selected Goal text from current durable Goal facts. | `Shaping Responsibilities` | Preserved while leaving durable state semantics with `T-DURABLE`. |
| Insert or verify exactly one outer developer-role Goal `ResponseItem` when cadence-required authority is due. | `Shaping Responsibilities` | Preserved as the final-input proof surface. |
| Return commit metadata tied to that exact item. | `Shaping Responsibilities` | Preserved as selected-item commit metadata, with commit timing left to commit rows. |
| Do not insert Goal steering merely because an active durable Goal exists. | `Shaping Responsibilities` | Preserved directly as the active-state-alone negative rule at the final seam. |
| Selection order is BudgetLimit, ObjectiveUpdated, Initial, Continuation. | `Selection Order` | Preserved directly. |
| Continuation never supersedes persisted pending intent. | `Selection Order` | Preserved directly and sharpened as an idle-selected runtime request only. |

## Target Edits

| File | Edit | Reason |
| --- | --- | --- |
| `draft-goal-authority-final-request-input-and-commit.md` | Added `Final Request-Input Shaping`, `Shaping Responsibilities`, and `Selection Order`. | Carries h05-h07 into `T-FINAL` as the per-attempt shaping, exact selected-item, and selection-order contract. |

## Route Reconciliation

Route family: `RV-FINAL`

Conclusion: integrated-sharpening.

The RV-FINAL route confirms that shaping belongs inside the request attempt
path after the attempt's base input is known and before `Prompt.input`; retry
attempts reshape from the rebuilt base input; attempt ordinal belongs to the
attempt being finalized; same-turn and idle metadata are recheck inputs rather
than prebuilt model input; helper output, classifier output, durable state
alone, raw notifications, ordinary rollout evidence, current-turn carry, and
rendered text are not authority; and final-payload proof inspects the captured
logical request input.

The successor prose integrates those route decisions without naming route files
as standing authority. It keeps route evidence in this record and keeps the
standing draft focused on the final-input contract.

No route mismatch requires user review. Route material did not conflict with
the source slice or make a support artifact into authority.

## Repeated Authority Treatment

| Family | Treatment |
| --- | --- |
| Final request-input developer-role proof | Closed for this slice in `T-FINAL`: the shaper owns the per-attempt final input, selected-item insertion or verification, and exact-item commit metadata. |
| Pending Initial, ObjectiveUpdated, and BudgetLimit until commit | Preserved locally through no pending-intent consumption on ineligible attempts and through Continuation being last in selection order. Durable pending shape and exact commit consumption remain with their owner rows. |
| Exact-key consumption | Kept as a local reminder only: row 005 prevents premature consumption but does not define exact-key storage fields. |
| Active durable state alone | Preserved directly: the shaper does not insert Goal steering merely because an active durable Goal exists. |
| Ordinary user turns | Kept bounded: row 005 selects only due cadence items and does not treat active durable state or ordinary user activity as a cadence event. |
| Automatic Continuation and watermarking | Preserved as runtime-only Continuation input selected by idle lifecycle, last in order, and unable to supersede persisted pending intent. History watermark mechanics stay with `T-HISTORY`. |
| Retry, follow-up, and same-turn metadata | Preserved as per-attempt shaping and metadata-as-recheck-input, not prebuilt input, proof, or pending-intent consumption. |
| Request-local repair | Preserved through repair context, cleanup responsibilities, and diagnostic repair report. Repair does not become cadence authority. |
| Classifier/provenance/helper/projection non-authority | Preserved through classifier-as-cleanup-support and final authority requiring the selected outer developer-role item in final input. |

## Fidelity Debt

Blocking debt: none.

Non-blocking debt: none.

## Closure Review

- Source slice accounted for: yes.
- Traceability rows accounted for: yes.
- Concept ledger concepts accounted for: yes.
- Primary and secondary target boundaries preserved: yes.
- Route flag reconciled: yes.
- Repeated authority compressed to owner/local-reminder shape: yes.
- Final-input audit complete: yes.
- No helper output, classifier output, durable state alone, prebuilt input, or
  current-turn carry made authoritative: yes.
- No source docs moved, renamed, deleted, retired, or cut over: yes.
- Record can close: yes.
