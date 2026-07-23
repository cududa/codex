# WA05a: Internal Context And Goal Artifact Classifier

This pass creates the shared cleanup vocabulary used by the rest of Work Area
05. It does not construct active Goal model input and does not decide when Goal
speaks. Source-tagged helper output, legacy marker recognition, and classifier
matches are cleanup terrain only; active Goal authority remains the final
request-input seam owned by Work Areas 02 and 03.

## Direction Lock

Request:

- add or reuse generic source-tagged internal-context rendering/parsing
- add the strict shared Goal artifact classifier
- do not implement consumer conversions in this pass

Authority:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`
- `local/goal_research/goal-recorded-request-evidence.md`
- `local/how-we-test.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md`

Terrain:

- `codex-rs/core/src/context/goal_context.rs` currently combines active
  `<goal_context>` rendering, `GoalContextRole`, `ResponseInputItem`
  construction, and legacy marker detection.
- `codex-rs/core/src/context/mod.rs` exports `GoalContext`,
  `GoalContextRole`, `is_goal_context_text(...)`, and
  `is_goal_context_response_item(...)`.
- `codex-rs/core/src/context/contextual_user_message.rs` and
  `codex-rs/core/src/event_mapping.rs` consume the old marker predicates.
- `codex-rs/core/src/context/internal_model_context.rs`, or the equivalent
  upstream v136 terrain if this branch changes, provides useful source
  validation and source-tagged text terrain, but contextual-user conversion is
  not active Goal authority.

Code-shape temptation:

- keep `GoalContext` as the shared helper because it already renders and
  detects old marker text
- expose a broad predicate that callers can mistake for current Goal authority

Locked direction:

- add generic internal-context helper infrastructure for rendering and pure
  parsing only, or adapt the existing internal-model-context helper into that
  shape
- add a strict `ResponseItem`-level Goal artifact classifier with
  whole-message purity
- keep active model-input construction in `core/src/goal_cadence/`

Exclusions:

- no cadence selection
- no pending-intent consumption
- no Continuation watermark changes
- no app-server raw behavior changes
- no final deletion sweep of old `GoalContext` exports

## Authority Docs Read

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`
- `local/goal_research/goal-idle-history-lifecycle.md`
- `local/goal_research/goal-recorded-request-evidence.md`
- `local/how-we-test.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`

## Code Terrain Read

- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/context/internal_model_context.rs`, or
  `rust-v0.136.0:codex-rs/core/src/context/internal_model_context.rs` if the
  branch-local helper is absent

## Pass Goal

Create the reusable foundation for source-tagged internal context and strict
Goal artifact classification. All later WA05 consumers should call this module
instead of parsing Goal marker text locally. The vocabulary is intentionally
cleanup-oriented: it can say that an item is a pure current Goal artifact, a
pure legacy artifact, a pure non-Goal internal context, or mixed/ordinary
content, but it cannot say that the item is valid active Goal authority.

## Exact Files To Edit

- `codex-rs/core/src/context/mod.rs`
- add `codex-rs/core/src/context/internal_context.rs`, or adapt the existing
  `codex-rs/core/src/context/internal_model_context.rs` / equivalent module if
  prior work already introduced it
- add `codex-rs/core/src/goal_artifacts.rs`
- `codex-rs/core/src/lib.rs`
- `codex-rs/core/BUILD.bazel` if explicit source lists require it

## Required Edits

- Add a private generic internal-context module that owns:
  - source validation equivalent to `[a-z][a-z0-9_]*`
  - rendering of `<codex_internal_context source="...">...</codex_internal_context>`
  - pure internal-context parsing that returns source and body
  - rejection of malformed or mixed text
- If the branch already has `internal_model_context.rs`, preserve the useful
  source validation/rendering terrain but separate generic current
  internal-context parsing from legacy Goal artifact classification. Legacy
  `<goal_context>` must not be treated as a current source-tagged internal
  context.
- Add or expose only helper functions that return text or parse text. Do not
  add a helper that returns active Goal `ResponseItem` / `ResponseInputItem`.
- Add `core/src/goal_artifacts.rs` with a small classifier over
  `ResponseItem`, logically distinguishing:
  - pure current Goal internal context with source `goal`
  - pure legacy `<goal_context>` artifact
  - pure non-Goal internal context
  - mixed or ordinary content
- Enforce whole-message purity:
  - `ResponseItem::Message` only
  - role `user` or `developer` for cleanup classification
  - exactly one `ContentItem::InputText`
  - trimmed text wholly matches the current or legacy representation
  - multi-span content, image content, output text, or ordinary prose with
    marker-like substrings is mixed/ordinary
- Classify user-role current Goal internal context as cleanup terrain only.
  The source tag is provenance; it does not compensate for the wrong outer
  model role.
- Add a stable body fingerprint type for current and legacy Goal artifact
  classifications. The fingerprint identifies the rendered body for cleanup,
  diagnostics, and evidence-pairing support. It must not include parsed
  durable Goal facts.
- Keep names cleanup-oriented. Avoid names that imply the classifier identifies
  active Goal authority.
- Leave old `GoalContext` active exports for later passes if still referenced.
  This pass establishes the replacement vocabulary; WA06 owns global dead-code
  deletion.
- The classifier must not take durable Goal facts, pending intent snapshots,
  request metadata, recorded evidence, rollout items, raw notifications, or
  history-version values as input.

## Tests And Checks

Use `local/how-we-test.md` and the cleanup triage doc. This pass is primarily
test-surface burn-down for old active `GoalContext`, `GoalContextRole`,
`<goal_context>` authority, and injectable `ResponseInputItem` behavior after
that code is removed. Delete those fake-shim tests with no replacement by
default. Keep or add focused unit coverage only when the new
classifier/internal-context boundary would otherwise have no useful validation.
Do not add tests whose only purpose is confirming old tests were removed.

Only keep or add focused boundary cases when they protect the new boundary and
are not already covered:

- pure current source-tagged Goal text parses and classifies
- user-role current Goal text classifies as cleanup terrain only
- pure legacy `<goal_context>` classifies as legacy artifact
- pure non-Goal internal context does not classify as Goal
- mixed marker-like prose is preserved as mixed/ordinary
- multiple content spans are not pure artifacts
- input image or output text mixes are not pure artifacts
- malformed source values are rejected
- body fingerprint changes when body text changes

Use `pretty_assertions::assert_eq` and compare whole objects where practical.
For docs/test-deletion-only work, diff inspection is valid validation.

## Branch Continuation State

After this pass:

- later WA05 passes can call a shared classifier instead of local marker
  parsing
- active Goal producers may still not be fully deleted
- old consumers may still call `is_goal_context_*` until their specific pass
  converts them
- no runtime behavior is accepted merely because the classifier exists

## Non-Goals

- no request-input cleanup integration
- no event mapping or history conversion
- no compaction or reconstruction conversion
- no app-server raw or materialized projection change
- no recorded request evidence carrier
- no final global stale-symbol audit
