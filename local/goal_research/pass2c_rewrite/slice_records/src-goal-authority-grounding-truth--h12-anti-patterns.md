# Slice Record: src-goal-authority-grounding-truth--h12-anti-patterns

Status: closed

Packet 08 order: 006

Source range: `goal-authority-grounding-truth.md` h12

Primary target: `T-BEHAVIOR`

Secondary checks: `T-FINAL`, `T-CLEANUP`, `T-SHIM`, `T-TEST-PREP`

Route flag: `RV-FINAL`

Audit category: authority

Future record path: `pass2c_rewrite/slice_records/src-goal-authority-grounding-truth--h12-anti-patterns.md`

Successor files touched:

- `pass2c_rewrite/successor_drafts/draft-goal-authority-behavior.md`

## Grounding Read

- Source slice: `goal-authority-grounding-truth.md` h12, read directly before
  editing.
- Pass 2 traceability: rows 125-126 for Anti-Patterns and the individual
  forbidden patterns.
- Concept ledger: Goal authority, developer-role active steering,
  internal-context provenance, active Goal steering text shape, final model
  request input, final request-input shaping, cadence events, ordinary user
  turns, cadence-required authority, request repair, current authority proof
  sources, classifier outputs, purity rules, typed/materialized projection,
  legacy Goal artifact handling, fake-shim removal, raw response
  notifications, and replacement test profile.
- Target interfaces: `T-BEHAVIOR` from Pass 2B Packet 1; `T-FINAL` from
  Packet 1; `T-CLEANUP` from Packet 2; `T-SHIM` and `T-TEST-PREP` from
  Packet 3.
- Repeated authority: Pass 2B.5 Batch 1 final request-input developer-role
  proof, active durable state alone, ordinary user turns; Batch 2 retry,
  follow-up, and current-turn carry non-authority where relevant; Batch 3
  request-local repair and classifier/provenance/helper/projection
  non-authority.
- Route material: `02-final-request-input-shaping-and-commit.md`,
  `02-direct-split-readiness-check.md`,
  `04h-wa04-tests-and-final-payload-verification.md`,
  `06b-core-active-producer-and-carry-deletion.md`,
  `06g-final-acceptance-tests-and-audit-gates.md`, and
  `goal-work-area-coordination-note.md`.

## Source-To-Target Trace

| Source clause | Successor placement | Treatment |
| --- | --- | --- |
| Anti-Patterns section as behavioral forbidden list. | `Anti-Patterns` | Preserved as an explicit behavior-level rejection list instead of relying on the compact invalid-substitutes list. |
| Goal Every Turn. | `Anti-Patterns / Goal Every Turn` | Preserved directly: active Goal state must not become repeated full Goal reminders on every ordinary user turn. |
| User-Role Goal Steering. | `Anti-Patterns / User-Role Goal Steering` | Preserved directly: user-role active Goal steering is invalid and provenance cannot compensate. |
| Rendered Text As Authority. | `Anti-Patterns / Rendered Text As Authority` | Preserved directly: `<goal_context>` and `source = "goal"` are not authority; the outer model role carries authority. |
| Goal-Only Fake Provenance. | `Anti-Patterns / Goal-Only Fake Provenance` | Preserved directly: no Goal-specific active context helper, no replacement helper-only authority layer, and no compatibility/migration preservation of the active path. |
| Runtime Archaeology. | `Anti-Patterns / Runtime Archaeology` | Preserved directly: runtime must not parse rendered artifacts to recover active Goal state. |
| Tool Output As Steering. | `Anti-Patterns / Tool Output As Steering` | Preserved directly: tool output can report Goal state but is not Goal steering. |
| Hiddenness As Authority. | `Anti-Patterns / Hiddenness As Authority` | Preserved directly: UI hiding, hidden classification, and invisible metadata do not prove model authority. |
| Repair As Cadence. | `Anti-Patterns / Repair As Cadence` | Preserved directly: repair must not decide when Goal steering is due. |

## Target Edits

| File | Edit | Reason |
| --- | --- | --- |
| `draft-goal-authority-behavior.md` | Added `Anti-Patterns` with each named source subsection. | `T-BEHAVIOR` owns forbidden authority shapes and must keep the named negative rules visible for downstream targets. |

## Route Reconciliation

Route family: `RV-FINAL`

Conclusion: integrated-sharpening.

The RV-FINAL route confirms that final request input is the active Goal
authority seam and rejects the same substitutes named by the source slice:
user-role internal-context steering, `GoalContext` and `GoalContextRole` active
paths, active `<goal_context>`, helper output, classifier output, raw
notifications, rollout trace payloads, rendered Goal text, durable state alone,
prebuilt active-turn items, current-turn carry, and tests that prove helper
output instead of captured final request input.

The successor prose keeps the route decisions as behavioral prohibitions and
does not import final-shaper mechanics, classifier internals, shim demolition
sequencing, or test-prep matrices into `T-BEHAVIOR`.

No route mismatch requires user review. Route material did not conflict with
the h12 source or make a support artifact into authority.

## Repeated Authority Treatment

| Family | Treatment |
| --- | --- |
| Final request-input developer-role proof | Kept as behavior-level owner text: authority requires the selected final-input developer-role item; `T-FINAL` owns mechanics. |
| Active durable state alone | Preserved through `Goal Every Turn`: active state alone does not create cadence-required authority or repeated ordinary-turn reminders. |
| Ordinary user turns | Preserved locally as a negative behavioral rule; cadence and idle targets own ordinary-turn delivery details. |
| User-role steering and steering-role compatibility | Preserved as a behavior-level prohibition; extension/config/test-prep targets keep local reminders. |
| Helper/provenance/classifier/projection non-authority | Preserved through rendered text, fake provenance, hiddenness, and runtime archaeology anti-patterns; `T-CLEANUP` owns classifier and projection mechanics. |
| Request repair is not cadence | Preserved through `Repair As Cadence`; `T-CLEANUP` owns repair mechanics and `T-CADENCE` owns due decisions. |
| Fake-shim removal | Preserved as behavior-level invalidity of Goal-only active context helpers; `T-SHIM` owns demolition terrain. |
| Replacement test profile | Kept pointer-only: tests must prove these behavior contracts, but `T-TEST-PREP` does not become behavior authority. |

## Fidelity Debt

Blocking debt: none.

Non-blocking debt: none.

## Closure Review

- Source slice accounted for: yes.
- Every named anti-pattern preserved: yes.
- Traceability rows accounted for: yes.
- Concept ledger concepts accounted for: yes.
- Primary and secondary target boundaries preserved: yes.
- Route flag reconciled: yes.
- Repeated authority compressed to owner/local-reminder shape: yes.
- Authority audit complete: yes.
- No final-shaper mechanics, classifier internals, shim sequencing, or
  test-prep matrix imported into behavior prose: yes.
- No source docs moved, renamed, deleted, retired, or cut over: yes.
- Record can close: yes.
