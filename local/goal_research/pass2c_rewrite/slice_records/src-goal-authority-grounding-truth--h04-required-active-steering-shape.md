# Slice Record: src-goal-authority-grounding-truth--h04-required-active-steering-shape

Status: closed

Packet 08 order: 002

Source range: `goal-authority-grounding-truth.md` h04

Primary target: `T-BEHAVIOR`

Secondary checks: `T-FINAL`, `T-CLEANUP`, `T-EXT`, `T-SHIM`

Route flag: `RV-FINAL`

Audit category: authority

Future record path: `pass2c_rewrite/slice_records/src-goal-authority-grounding-truth--h04-required-active-steering-shape.md`

Successor files touched:

- `pass2c_rewrite/successor_drafts/draft-goal-authority-behavior.md`

## Grounding Read

- Source slice: `goal-authority-grounding-truth.md` h04, read directly before editing.
- Pass 2 traceability: row 117 for Required Active Steering Shape; related rows 116, 132, 189-196, 240-248.
- Concept ledger: Goal authority, developer-role active steering, internal-context provenance, active Goal steering text shape, final model request input, final request-input shaping, extension reachability, steering-role config compatibility, fake-shim removal, legacy Goal artifact handling, runtime archaeology forbidden, classifier outputs.
- Target interfaces: `T-BEHAVIOR` and `T-FINAL` from Packet 1; `T-CLEANUP` from Packet 2; `T-EXT` and `T-SHIM` from Packet 3.
- Repeated authority: Pass 2B.5 Batch 1 final request-input developer-role proof; Batch 3 classifier/provenance/helper non-authority; Batch 4 extension reachability, steering-role config compatibility, and fake-shim removal.
- Route material: `02-final-request-input-shaping-and-commit.md`, `02-direct-split-readiness-check.md`, `04a-adapter-runtime-ordering-and-cadence-request-adapter.md`, `04f-extension-steering-role-config-removal.md`, `04g-steering-module-and-injection-api-cleanup.md`, `06b-core-active-producer-and-carry-deletion.md`, `06c-steering-role-config-removal.md`, `06d-extension-steering-cleanup.md`, and `06g-final-acceptance-tests-and-audit-gates.md`.

## Source-To-Target Trace

| Source clause | Successor placement | Treatment |
| --- | --- | --- |
| Active steering must be established at final request-input shaping point; logical `Vec<ResponseItem>` becomes `Prompt.input` then `ResponsesApiRequest.input`. | `Required Active Steering Boundary`; `Behavioral Truth` | Preserved as the behavior-level proof boundary; detailed finalizer mechanics remain with `T-FINAL`. |
| Generic internal context is limited to Goal text rendering and `source = "goal"` provenance; it is not authority. | `Required Active Steering Boundary`; `Behavior-Level Item Shape`; `Invalid Proof Substitutes` | Preserved and connected to cleanup/provenance as support only. |
| Existing Goal-only active context path is deletion terrain, not architecture to preserve. | `Required Active Steering Boundary`; `Invalid Proof Substitutes` | Preserved as a behavior-level rejection and checked against `T-SHIM`. |
| Expected `ResponseItem::Message { role: "developer", content: ... }` shape. | `Behavior-Level Item Shape` | Preserved as behavioral shape while leaving exact helper names to `T-FINAL`. |
| Goal cadence selects whether steering is due. | `Required Active Steering Boundary` | Preserved as responsibility split; cadence details remain outside `T-BEHAVIOR`. |
| Internal-context rendering owns text/provenance/classification only. | `Required Active Steering Boundary` | Preserved; cleanup target owns classifier details. |
| `ResponseItem::Message.role` is authority source. | `Required Active Steering Boundary`; `Behavior-Level Item Shape` | Preserved as the behavior-level authority rule. |
| Role enum or developer-role helper is insufficient without final-input proof. | `Required Active Steering Boundary`; `Invalid Proof Substitutes` | Preserved as repeated-authority compression rule. |
| Active Goal authority is proven only by exactly one current Goal developer-role `ResponseItem::Message` in final input. | `Required Active Steering Boundary`; `Behavioral Truth` | Preserved and sharpened to "selected current" to align with final-shaper route. |
| `ContextualUserFragment::into(...)` or equivalents that infer user role are forbidden. | `Required Active Steering Boundary`; `Invalid Proof Substitutes` | Preserved directly. |
| No user-role active Goal steering path. | `Required Active Steering Boundary`; `Invalid Proof Substitutes` | Preserved directly. |
| Plans may add generic helpers but must not treat them as authority; they must identify the final request-input shaping point. | `Required Active Steering Boundary`; `Behavioral Truth` | Preserved as behavior-level boundary; implementation API details remain outside this source slice. |
| Older role override config must be removed, rejected, or mapped to developer behavior; no user-role compatibility. | `Required Active Steering Boundary`; `Invalid Proof Substitutes` | Preserved as local behavior rule and checked against `T-EXT`/`T-SHIM`. |

## Target Edits

| File | Edit | Reason |
| --- | --- | --- |
| `draft-goal-authority-behavior.md` | Added `Required Active Steering Boundary`. | Carries row 002's final-input boundary, responsibility split, helper non-authority rule, user-role ban, and config compatibility rejection. |
| `draft-goal-authority-behavior.md` | Expanded `Behavior-Level Item Shape`. | Preserves the source's expected developer-role message shape without importing finalizer mechanics. |
| `draft-goal-authority-behavior.md` | Expanded `Invalid Proof Substitutes`. | Captures helper/role-enum, active context path, user-role conversion, and role-config substitutes as invalid authority proof. |

## Route Reconciliation

Route family: `RV-FINAL`

Conclusion: integrated-sharpening.

The route material agrees with the source's boundary and sharpens where the proof occurs: the WA02 final request-input shaper owns per-attempt insertion or verification before `Prompt.input` becomes `ResponsesApiRequest.input`. The route also confirms that extension-origin work must arrive as durable intent or metadata requests, not active model input, and that old role config must be removed or made inert. No route material requires weakening the source's "no user-role path" rule.

The behavior successor states the final-input proof boundary and negative rules. Commit timing, item selection APIs, cleanup classifier mechanics, extension lifecycle, and shim demolition details remain with their owner targets.

## Repeated Authority Treatment

| Family | Treatment |
| --- | --- |
| Final request-input developer-role proof | Canonicalized in `T-BEHAVIOR` as behavior-level truth. `T-FINAL` owns exact per-attempt mechanics and commit proof. |
| Classifier/provenance/helper output non-authority | Preserved as local behavior rule; `T-CLEANUP` remains owner of strict classifier and projection details. |
| Fake-shim removal | Preserved as invalid authority architecture and deletion terrain. `T-SHIM` remains owner of concrete demolition map and callsite routing. |
| Extension reachability and steering-role config compatibility | Preserved as no-user-role compatibility rule. `T-EXT` remains owner of extension lifecycle, config treatment, and reachability proof. |

## Fidelity Debt

Blocking debt: none.

Non-blocking debt: none.

## Closure Review

- Source slice accounted for: yes.
- Target owner boundary preserved: yes.
- Route flag reconciled: yes.
- Repeated authority compressed to owner/local-reminder shape: yes.
- Support targets kept from becoming authority engines: yes.
- Successor prose avoids permanent route-plan citation: yes.
- Record can close: yes.
