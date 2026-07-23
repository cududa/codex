# Concept Ledger

Use this table as the temporary extraction surface for skill/plugin/app
invocation research. Do not treat ledger rows as authority until the fact has
been moved into a future owning live doc or explicitly accepted as packet
posture.

## Status Values

- `candidate`: extracted or proposed but not yet sorted.
- `ready`: accepted for a specific future owning doc.
- `moved`: written into an owning live doc.
- `pointer-only`: useful context, but not owned by the target doc.
- `conflict`: terrain and intended model need user or reviewer resolution.
- `rejected`: not part of invocation authority.

## Ledger

| Concept | Candidate definition or fact | Source terrain | Future owner | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Operative invocation | A user or trusted runtime request that should cause Codex to resolve a skill/plugin/app mention and inject the corresponding guidance or expose tools for the current turn. | `local/skill_invocation_bug.md`; `turn.rs` | `invocation-authority.md` | candidate | Needs a sharper name if research finds existing repo language. |
| Model-visible input | Any `ResponseItem` or input item that can be included in the model request. | `client_common.rs`; `turn.rs` | `source-provenance.md` | candidate | Model visibility alone must not imply invocation authority. |
| Invocation-bearing source | A source category permitted to carry operative invocations. | `input_queue.rs`; `turn.rs` | `source-provenance.md` | candidate | Central concept for the bug. |
| Model-visible-only source | A source category that may be sent to the model but must not trigger skill/plugin/app injection. | `ResponseItem` terrain | `source-provenance.md` | candidate | Likely includes replay, summaries, tool output, and quoted evidence. |
| Structured skill selection | A `UserInput::Skill` item resolved by path against discovered enabled skills. | `core-skills/src/injection.rs` | `mention-resolution.md` | sampled | Current code prioritizes these before text mentions. |
| Plain text skill mention | A `$name` token extracted from text and resolved to an unambiguous enabled skill. | `core-skills/src/injection.rs` | `mention-resolution.md` | sampled | Must be scoped by source authority. |
| Linked skill mention | A text link whose path identifies a skill resource or path. | `core-skills/src/injection.rs` | `mention-resolution.md` | candidate | Need exact current path rules. |
| Structured app/plugin mention | A `UserInput::Mention` or linked mention whose path resolves to app/plugin identity. | `plugins/mentions.rs`; `turn.rs` | `mention-resolution.md` | candidate | Plugin uses `@` linked text handling; app uses tool mention paths. |
| Injected guidance | The model-visible guidance produced after invocation resolution, such as user-role `<skill>` or developer plugin sections. | `turn.rs`; `plugins/injection.rs` | `injection-placement.md` | candidate | It is an effect, not an invocation source by itself. |
| Skill body injection | User-role message containing `<skill>` body, name, and path. | `core/tests/suite/skills.rs` | `injection-placement.md` | sampled | Existing test proves user-turn case. |
| Plugin capability guidance | Developer message sections describing enabled plugin capabilities. | `core/tests/suite/plugins.rs` | `injection-placement.md` | sampled | Need distinguish baseline plugin guidance from explicit plugin mention behavior. |
| Quoted/evidence text | Text included for model understanding or review that may quote user/model/tool content but should not be operative. | guardian/review/compaction terrain | `source-provenance.md` | candidate | Needs negative proof. |
| Replay artifact | Historical or reconstructed item included from rollout, compaction, fork, or resume. | `compact*.rs`; rollout reconstruction | `source-provenance.md` | candidate | Replayed mentions should not reinvoke unless a trusted rehydration rule says so. |
| Source policy | The rule that decides whether a source category is invocation-bearing, model-visible-only, or rejected. | this packet | `invocation-authority.md` | candidate | Might become the key implementation seam. |
| Mention scan input | The normalized input passed to skill/plugin/app mention collectors. | `turn.rs`; collectors | `mention-resolution.md` | candidate | Should not be confused with `UserInput` if other sources are admitted. |
| Invocation effect proof | A test or trace showing the expected injected guidance or tool exposure appears in the outbound request only for accepted sources. | existing skills/plugins tests | `proof-and-readiness.md` | candidate | Proof should inspect final outbound request, not helper state. |

## Extraction Notes

Add rows freely during slice work. Before finishing a slice, change each
touched row to `ready`, `pointer-only`, `conflict`, or `rejected`.

If a parent slice is decomposed, use the `Notes` column to name the subslice
that owns the next action. Do not add new ledger columns unless the table stops
being readable.

