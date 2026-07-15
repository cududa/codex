# WA05a: Internal Context And Goal Artifact Classifier

This pass creates the shared cleanup vocabulary used by the rest of Work Area
05. It does not construct active Goal model input and does not decide when Goal
speaks.

## Direction Lock

Request:

- add or reuse generic source-tagged internal-context rendering/parsing
- add the strict shared Goal artifact classifier
- do not implement consumer conversions in this pass

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`
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
- `rust-v0.136.0:codex-rs/core/src/context/internal_model_context.rs`
  provides useful source validation and source-tagged text terrain, but its
  contextual-user conversion is not active Goal authority.

Code-shape temptation:

- keep `GoalContext` as the shared helper because it already renders and
  detects old marker text
- expose a broad predicate that callers can mistake for current Goal authority

Locked direction:

- add generic internal-context helper infrastructure for rendering and pure
  parsing only
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
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`

## Code Terrain Read

- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `rust-v0.136.0:codex-rs/core/src/context/internal_model_context.rs`

## Pass Goal

Create the reusable foundation for source-tagged internal context and strict
Goal artifact classification. All later WA05 consumers should call this module
instead of parsing Goal marker text locally.

## Exact Files To Edit

- `codex-rs/core/src/context/mod.rs`
- add `codex-rs/core/src/context/internal_context.rs`, or adapt the equivalent
  module if prior work already introduced it
- add `codex-rs/core/src/goal_artifacts.rs`
- `codex-rs/core/src/lib.rs`
- `codex-rs/core/BUILD.bazel` if explicit source lists require it

## Required Edits

- Add a private generic internal-context module that owns:
  - source validation equivalent to `[a-z][a-z0-9_]*`
  - rendering of `<codex_internal_context source="...">...</codex_internal_context>`
  - pure internal-context parsing that returns source and body
  - rejection of malformed or mixed text
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
- Add a stable body fingerprint type for current and legacy Goal artifact
  classifications. The fingerprint identifies the rendered body for cleanup,
  diagnostics, and evidence-pairing support. It must not include parsed
  durable Goal facts.
- Keep names cleanup-oriented. Avoid names that imply the classifier proves
  current Goal authority.
- Leave old `GoalContext` active exports for later passes if still referenced.
  This pass establishes the replacement vocabulary; WA06 owns global dead-code
  deletion.

## Tests And Checks

Add focused unit tests near the new implementation:

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
