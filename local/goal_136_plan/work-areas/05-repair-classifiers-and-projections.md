# Work Area 05: Repair Classifiers And Projections

This Work Area consolidates Goal artifact classification and converts the
projection, compaction, reconstruction, and raw-notification callsites that
still depend on the old active Goal context shim.

It does not decide when Goal speaks. It does not own active Goal model-input
construction. Active repair remains owned by the Work Area 02 final request-input
shaping path in `codex-rs/core/src/goal_cadence/`.

## Realignment Note

Read this Work Area with
`goal-work-area-coordination-note.md#accepted-v136-placement-default`.
Classifiers and internal-context helpers are cleanup/projection infrastructure
only. They may help identify source-tagged Goal text, wrong-role current Goal
items, or legacy `<goal_context>` artifacts, but they do not select cadence,
recover durable Goal facts, or construct active model input. Active Goal
authority remains the exact current Goal `ResponseItem` with outer
`role: "developer"` in final request input.

Use `core/src/goal_cadence/` for request-input shaping. The rejected shape is a
single growing `goal_cadence.rs` file.

## Direction Lock

Request:

- author Work Area 05 as an execution-ready doc for repair classifiers and
  projections
- ground the plan in direct code reads around the relevant classifier,
  projection, compaction, reconstruction, and raw-notification paths
- do not implement Rust code in this planning pass

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_136_plan/AGENTS.md`
- `local/goal_136_plan/work-areas/AGENTS.md`
- `local/goal_136_plan/work-areas/goal-work-area-coordination-note.md`
- `local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`

Local terrain:

- `codex-rs/core/src/context/goal_context.rs`
  - owns active `<goal_context>` rendering
  - owns `GoalContextRole`
  - exposes `is_goal_context_text(...)` and
    `is_goal_context_response_item(...)`
- `codex-rs/core/src/context/contextual_user_message.rs`
  - treats `is_goal_context_text(...)` as contextual user content
  - skips legacy Goal context while parsing hook prompt fragments
- `codex-rs/core/src/event_mapping.rs`
  - treats Goal marker text as contextual developer content
  - hides user-role pure Goal marker messages from typed turn projection
  - ignores developer-role messages entirely in `parse_turn_item(...)`
- `codex-rs/core/src/context_manager/history.rs`
  - uses contextual user/developer predicates for rollback trimming and user
    turn boundary detection
- `codex-rs/core/src/compact.rs`
  - imports `is_goal_context_response_item(...)`
  - filters legacy Goal context from collected user messages
  - mid-turn compaction reinjects current-turn concrete Goal
    `ResponseInputItem`s through `sess.current_turn_goal_steering_items()`
- `codex-rs/core/src/compact_remote.rs`
  - filters `is_goal_context_response_item(...)` from compacted history output
  - mid-turn remote compaction reinjects current-turn concrete Goal
    `ResponseInputItem`s
- `codex-rs/core/src/compact_remote_v2.rs`
  - retains user/developer/system messages, then relies on
    `should_keep_compacted_history_item(...)`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
  - filters pure legacy Goal context from replacement history and replayed
    rollout response items through `is_goal_context_response_item(...)`
- `codex-rs/core/src/session/input_queue.rs` and
  `codex-rs/core/src/state/turn.rs`
  - still expose concrete current-turn Goal carry as `ResponseInputItem`
- `codex-rs/core/src/session/mod.rs`
  - `record_conversation_items(...)` persists raw `ResponseItem`s and emits
    `EventMsg::RawResponseItem` for every recorded response item
  - `record_response_item_and_emit_turn_item(...)` emits typed turn items
    through `parse_turn_item(...)`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
  - locally drops raw Goal context notifications with a duplicate
    `is_goal_context_response_item(...)`
- app-server typed/materialized projection:
  - `codex-rs/app-server-protocol/src/protocol/thread_history.rs` rebuilds
    hook prompts from rollout `ResponseItem`s and otherwise ignores plain user
    response items
  - `codex-rs/app-server/src/request_processors/thread_processor.rs` and
    `thread_summary.rs` call `codex_core::parse_turn_item(...)`
- current tests still assert old Goal marker behavior in:
  - `codex-rs/core/src/context/contextual_user_message_tests.rs`
  - `codex-rs/core/src/event_mapping_tests.rs`
  - `codex-rs/core/src/context_manager/history_tests.rs`
  - `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
  - `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
  - `codex-rs/app-server/src/bespoke_event_handling.rs`
  - `codex-rs/core/src/session/tests.rs`
  - `codex-rs/app-server/tests/suite/v2/thread_resume.rs`

Upstream terrain:

- `rust-v0.136.0` has generic `internal_model_context.rs` helper terrain with
  source validation and legacy `<goal_context>` matching. It is useful
  rendering and parsing terrain, but it is user-role contextual helper
  infrastructure and not Goal authority.
- `rust-v0.136.0` app-server emits raw response item notifications without the
  local Goal raw overlay. That confirms Goal raw hiding is local fork behavior
  to remove, not an upstream baseline to preserve.
- `rust-v0.136.0` compaction and rollout reconstruction do not carry the local
  Goal-only filter/carry shape as a baseline requirement. The local filters are
  replacement terrain created by the fork overlay.
- `rust-v0.139.0` keeps the same internal-model-context helper direction. It
  does not change the local authority rule that helper output is not active
  Goal authority.
- `rust-v0.140.0` adds typed replay precedent through
  `RolloutItem::InterAgentCommunication` and reconstructs that item as model
  input via `to_model_input_item()`. That is migration terrain for structured
  replay carriers only. Goal request evidence must remain metadata-only and
  must not get a `to_model_input_item`-style active steering path.

Code-shape temptation:

- keep `GoalContext` because it already renders and detects marker text
- replace scattered `is_goal_context_*` calls with another broad predicate that
  callers treat as authority
- let compaction or reconstruction "repair" active Goal state from rendered
  artifacts
- hide raw response items because typed projections hide Goal artifacts
- make classifier output stand in for current Goal authority
- treat `GoalRequestEvidence` as a raw item, projection item, classifier result,
  or rendered-text recovery path
- copy the v140 typed replay materialization pattern instead of keeping Goal
  request evidence as commit metadata

Locked direction:

- introduce a strict shared classifier for pure current Goal internal-context
  items and pure legacy `<goal_context>` artifacts
- keep whole-message purity as the central classifier invariant
- route active request cleanup/repair through `core/src/goal_cadence/`
- convert typed/materialized projection, history boundary, compaction, and
  reconstruction callsites to use classifier output only for cleanup/hiding
- remove the app-server raw Goal overlay so raw response item notifications
  remain raw
- keep `GoalRequestEvidence` as structured Created-event commit metadata only;
  projection, classifier, compaction, reconstruction, and raw-notification
  helpers must not emit it as conversation prose or treat it as authority
- replace old marker-preservation tests with classifier/projection tests and
  final request-input cleanup tests

Exclusions:

- no new Goal cadence policy
- no durable cadence state changes
- no extension mutation conversion
- no app-server Goal product API redesign
- no recorded-request-evidence carrier implementation
- no final deletion sweep of every old Goal shim symbol; Work Area 06 owns final
  dead-code deletion and global acceptance
- no user-role active Goal steering compatibility

## Bounded Code Terrain Read

Files read directly for this Work Area:

- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/context/fragment.rs`
- `codex-rs/core/src/context/fragments.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/stream_events_utils.rs`
- `codex-rs/core/src/thread_rollout_truncation.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_summary.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/app-server-protocol/src/protocol/event_mapping.rs`
- `codex-rs/protocol/src/models.rs`
- `codex-rs/protocol/src/items.rs`
- `codex-rs/core/tests/common/responses.rs`
- relevant test sections in:
  - `codex-rs/core/src/context/contextual_user_message_tests.rs`
  - `codex-rs/core/src/event_mapping_tests.rs`
  - `codex-rs/core/src/context_manager/history_tests.rs`
  - `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
  - `codex-rs/core/src/compact_tests.rs`
  - `codex-rs/core/src/session/tests.rs`
  - `codex-rs/app-server/src/bespoke_event_handling.rs`
  - `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
  - `codex-rs/app-server-protocol/src/protocol/thread_history.rs`

Upstream terrain read for the v136/v139/v140 bridge:

- `rust-v0.136.0:codex-rs/core/src/context/internal_model_context.rs`
- `rust-v0.136.0:codex-rs/core/src/context/contextual_user_message.rs`
- `rust-v0.136.0:codex-rs/core/src/context/mod.rs`
- `rust-v0.136.0:codex-rs/core/src/event_mapping.rs`
- `rust-v0.136.0:codex-rs/core/src/compact.rs`
- `rust-v0.136.0:codex-rs/core/src/compact_remote.rs`
- `rust-v0.136.0:codex-rs/core/src/session/rollout_reconstruction.rs`
- `rust-v0.136.0:codex-rs/app-server/src/bespoke_event_handling.rs`
- `rust-v0.136.0:codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `rust-v0.139.0:codex-rs/core/src/context/internal_model_context.rs`
- `rust-v0.140.0:codex-rs/protocol/src/protocol.rs`
- `rust-v0.140.0:codex-rs/core/src/session/rollout_reconstruction.rs`
- `rust-v0.140.0:codex-rs/rollout/src/policy.rs`
- `rust-v0.140.0:codex-rs/thread-store/src/live_thread.rs`

Findings:

- there is no current generic source-tagged internal-context classifier in the
  v136 tree. Current code uses the contextual user fragment framework and the
  Goal-specific `<goal_context>` shim.
- `GoalContext` is both active steering renderer and legacy artifact
  classifier today. Work Area 05 must split those responsibilities instead of
  keeping `GoalContext` as shared infrastructure.
- `ContextualUserFragment::matches_text(...)` uses trimmed start/end marker
  matching, and current Goal detection inherits that behavior. Work Area 05 must
  require whole-message purity at the `ResponseItem` / content-list level, not
  only marker substring matching.
- `event_mapping::parse_turn_item(...)` already ignores developer messages.
  The remaining projection risk is user-role pure Goal artifacts and mixed
  content with marker-like text.
- `ContextManager::drop_last_n_user_turns(...)` trims contiguous contextual
  developer/user messages above rollback cuts. It currently inherits Goal
  behavior through `is_contextual_*` predicates.
- local and remote compaction both reinsert initial context during mid-turn
  compaction and currently append concrete current-turn Goal
  `ResponseInputItem`s from `sess.current_turn_goal_steering_items()`.
- `compact_remote_v2` first keeps message roles and then delegates filtering
  to `should_keep_compacted_history_item(...)`, so replacing that shared filter
  updates v2 too.
- rollout reconstruction filters pure legacy Goal context from replacement
  history and replayed rollout response items, but it has no representation for
  current internal-context Goal artifacts or committed Goal metadata repair.
- `Session::record_conversation_items(...)` emits raw response item events for
  every response item; app-server then drops Goal context in
  `maybe_emit_raw_response_item_completed(...)`. This local app-server raw
  overlay is the behavior to remove.
- app-server materialized history from rollout response items only rebuilds
  hook prompts from response items. Other typed/materialized surfaces use
  `codex_core::parse_turn_item(...)`, so core classifier semantics carry most
  projection behavior.
- current tests contain local-only assertions that preserve active
  `<goal_context>`, `GoalContextRole`, raw hiding, and concrete carry.
  Work Area 05 should replace only the projection/classifier/repair-support
  coverage, leaving final dead-code deletion to Work Area 06.
- upstream v136/v139 internal-model-context helper code is useful source
  validation and rendering terrain, but its contextual user conversion path is
  not a Goal authority path.
- upstream v136 app-server raw response handling emits raw items without the
  local Goal raw overlay; WA05 should remove the fork overlay, not move
  it behind a new classifier.
- upstream v140 typed replay shows how a structured `RolloutItem` can survive
  persistence and reconstruction. For Goal request evidence, this is metadata
  carrier precedent only; WA05 must not introduce a model-input materialization
  path or projection surface for evidence.

## Ownership Split For This Work Area

Work Area 05 adds shared cleanup infrastructure. It must not create a competing
Goal authority module.

- `codex-rs/core/src/goal_cadence/` remains the active Goal authority seam.
  It owns final request-input cleanup, repair decisions, selected current
  developer-role Goal item construction, and repair reports.
- `codex-rs/core/src/context/internal_context.rs` or an equivalent new private
  context module owns generic source-tagged internal-context rendering and pure
  internal-context parsing.
- `codex-rs/core/src/goal_artifacts.rs` or an equivalent new private module
  owns Goal artifact classification over `ResponseItem`s. It may call generic
  internal-context parsing and legacy marker detection. It does not choose
  cadence or construct active model input.
- `codex-rs/core/src/context/goal_context.rs` is legacy terrain after Work Areas
  02-04. If it still exists, it is limited to old `<goal_context>` artifact
  detection until Work Area 06 deletes or reduces it. It must not stay as an active
  steering renderer.
- `codex-rs/core/src/event_mapping.rs`,
  `context/contextual_user_message.rs`, `context_manager/history.rs`,
  `compact.rs`, `compact_remote.rs`, `compact_remote_v2.rs`, and
  `session/rollout_reconstruction.rs` are classifier consumers. They decide
  caller-local projection/filtering behavior from classifier output. They do
  not infer active Goal facts or pending cadence intent.
- `codex-rs/app-server/src/bespoke_event_handling.rs` owns raw app-server
  notification mapping. It must not hide Goal raw items.
- app-server typed/materialized projection remains a consumer of
  `codex_core::parse_turn_item(...)` and rollout replay behavior. It must not
  add a second Goal classifier in app-server.
- `codex-rs/core/src/session/input_queue.rs` and
  `codex-rs/core/src/state/turn.rs` should no longer provide concrete Goal
  carry to compaction paths. If Work Area 02/03 committed carry metadata exists,
  Work Area 05 may consume only that metadata as repair context through the
  request-input shaper.

## Required Edits

### 1. Add Generic Internal-Context Rendering And Parsing

Edit:

- `codex-rs/core/src/context/mod.rs`
- add `codex-rs/core/src/context/internal_context.rs`, or use the equivalent
  module introduced by Work Area 02 if it already exists

Add a small internal-context module for source-tagged internal text. Suggested
logical shape:

```rust
pub(crate) struct InternalContextSource(String);

pub(crate) struct InternalContextFragment {
    pub(crate) source: InternalContextSource,
    pub(crate) body: String,
}

pub(crate) enum InternalContextParse<'a> {
    Pure {
        source: &'a str,
        body: &'a str,
    },
    NotInternalContext,
}
```

Required helpers, equivalent names acceptable:

```rust
pub(crate) fn render_internal_context(source: &InternalContextSource, body: &str) -> String;

pub(crate) fn parse_pure_internal_context_text(text: &str) -> InternalContextParse<'_>;
```

Required representation:

```text
<codex_internal_context source="goal">
...
</codex_internal_context>
```

The exact implementation may use a structured XML helper if the repo already
has one available. Do not use ad hoc substring parsing when an existing
structured parser is available and practical. If no suitable parser exists,
the local parser must still enforce:

- trimmed text starts with the exact current internal-context open tag shape
- source value is parsed and validated
- trimmed text ends with the matching close tag
- body is separated from wrapper text
- malformed or mixed text returns `NotInternalContext`

Source validation:

- accept `goal`
- accept future source names only through an explicit validation rule
- reject empty source
- reject source values containing whitespace, quotes, angle brackets, slash, or
  equals

This module may render text and classify pure internal-context text. It must
not construct active Goal `ResponseItem`s for cadence delivery. The only caller
that wraps selected Goal text into active model input is
`core/src/goal_cadence/`.

### 2. Add Shared Goal Artifact Classifier

Edit:

- add `codex-rs/core/src/goal_artifacts.rs`
- `codex-rs/core/src/lib.rs`
- `codex-rs/core/BUILD.bazel` if the core crate uses explicit source lists

Add classifier output equivalent to:

```rust
pub(crate) enum GoalArtifactClassification<'a> {
    CurrentGoalInternalContext {
        role: &'a str,
        body: &'a str,
        body_fingerprint: GoalArtifactFingerprint,
    },
    LegacyGoalContextArtifact {
        role: &'a str,
        body_fingerprint: GoalArtifactFingerprint,
    },
    NonGoalInternalContext {
        role: &'a str,
        source: &'a str,
    },
    MixedOrOrdinary,
}

pub(crate) struct GoalArtifactFingerprint(String);
```

Required interface:

```rust
pub(crate) fn classify_goal_artifact(
    item: &ResponseItem,
) -> GoalArtifactClassification<'_>;

pub(crate) fn is_pure_goal_artifact(item: &ResponseItem) -> bool;

pub(crate) fn is_pure_current_goal_internal_context(item: &ResponseItem) -> bool;

pub(crate) fn is_pure_legacy_goal_context_artifact(item: &ResponseItem) -> bool;
```

The exact names may change, but the interface must make the caller's intent
visible:

- current internal-context Goal item
- legacy `<goal_context>` artifact
- non-Goal internal-context item
- mixed or ordinary content

Required purity rules:

- item must be `ResponseItem::Message`
- role must be `user` or `developer` for Goal cleanup classification
- content must be exactly one `ContentItem::InputText`
- text must wholly match the current internal-context representation or legacy
  `<goal_context>` representation after trimming outer whitespace
- mixed ordinary prose, additional content spans, images, output text, or
  marker-like substrings must classify as `MixedOrOrdinary`

Classifier semantics:

- `CurrentGoalInternalContext` is cleanup/projection evidence only
- user-role current Goal internal context is classified as cleanup terrain, not
  valid authority
- `LegacyGoalContextArtifact` never creates durable Goal state, pending intent,
  current objective, or active steering
- `NonGoalInternalContext` is not Goal and must not be hidden by Goal-specific
  projection logic unless a generic internal-context projection rule explicitly
  says so
- `MixedOrOrdinary` must be preserved by projection, compaction, and
  reconstruction unless another non-Goal rule applies
- `GoalRequestEvidence` or an equivalent committed metadata carrier is not a
  `ResponseItem`, not classifier input, not projection content, and not hidden
  or emitted by classifier helpers

Do not expose a classifier method named like `has_current_goal_authority`.
That would invite callers to treat classification as authority.

### 3. Convert Request-Input Shaper Cleanup To Shared Classification

Edit:

- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/goal_artifacts.rs`

Replace any Work Area 02 private Goal-looking cleanup predicates with the shared
classifier.

`core/src/goal_cadence/` remains the only caller that may use classifier output
to repair active Goal authority in final request input.

Required behavior:

- remove pure legacy `<goal_context>` artifacts from final request input
- remove stale current Goal internal-context items
- dedupe duplicate current Goal internal-context items
- replace or remove user-role current Goal internal-context items only under
  cadence/repair rules
- preserve mixed ordinary messages that contain marker-like strings
- report cleanup counts in `GoalRepairReport`
- never select Initial, ObjectiveUpdated, BudgetLimit, or Continuation because
  a classifier found an artifact
- never consume pending intent because a classifier found an artifact

If Work Area 02 has a narrow private internal-context renderer in
`core/src/goal_cadence/`, move it behind the generic internal-context module in
this Work Area. `core/src/goal_cadence/` should call the generic renderer; it
still constructs the developer-role `ResponseItem`.

### 4. Convert Contextual User Parsing

Edit:

- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/context/contextual_user_message_tests.rs`

Replace direct `is_goal_context_text(...)` usage with shared classifier or a
legacy pure-text predicate from `goal_artifacts.rs`.

Required behavior:

- pure user-role current Goal internal-context items do not become ordinary
  user messages
- pure user-role legacy `<goal_context>` artifacts do not become ordinary user
  messages
- pure non-Goal contextual user fragments keep existing behavior
- hook prompt parsing still extracts visible hook prompt fragments while
  skipping pure contextual fragments
- mixed content remains ordinary or invalid for hook prompt parsing according
  to existing non-Goal hook rules

Delete or rewrite local-only tests named by `goal-test-deletion-map.md`:

- `detects_goal_context_fragment`
- `goal_context_response_input_item_uses_explicit_steering_role`

Replacement tests should assert classifier behavior directly, not keep
`GoalContext` as a contextual user fragment.

### 5. Convert Event Mapping And Typed Projection

Edit:

- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/event_mapping_tests.rs`
- app-server typed/materialized projection tests that rely on
  `codex_core::parse_turn_item(...)`

Required behavior:

- `parse_turn_item(...)` returns `None` for pure user-role current Goal
  internal-context items
- `parse_turn_item(...)` returns `None` for pure user-role legacy
  `<goal_context>` artifacts
- developer-role pure Goal items remain hidden from typed turn projection
  because developer messages are not typed user-visible turn items
- mixed user-role messages containing current or legacy markers remain visible
  user messages
- mixed developer messages continue to count as having non-contextual developer
  content for rollback/reference-context invalidation
- non-Goal internal-context source values are not classified as Goal

Replace local-only tests:

- `goal_context_does_not_parse_as_visible_turn_item`
- `developer_goal_context_is_contextual_without_invalidating_by_itself`
- `mixed_developer_goal_context_remains_non_contextual`

Add tests with names like:

- `goal_artifact_projection_hides_pure_current_goal_internal_context`
- `goal_artifact_projection_hides_pure_legacy_goal_context`
- `goal_artifact_projection_preserves_mixed_marker_like_user_prose`
- `goal_artifact_projection_keeps_non_goal_internal_context_out_of_goal_classification`
- `goal_artifact_developer_mixed_content_invalidates_reference_context`

The tests should assert `TurnItem` or classifier equality where practical.
Avoid substring-only assertions except to build intentionally malformed or
mixed marker-like fixtures.

### 6. Convert History Boundary And Rollback Trimming

Edit:

- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`
- `codex-rs/core/src/thread_rollout_truncation.rs`
- `codex-rs/core/src/thread_rollout_truncation_tests.rs`, if existing tests
  need adjustment

Required behavior:

- pure user-role current Goal internal-context items are not user turn
  boundaries
- pure user-role legacy `<goal_context>` artifacts are not user turn
  boundaries
- mixed user messages containing marker-like text remain user turn boundaries
- rollback trimming may remove pure contextual Goal/internal-context items
  immediately above a rolled-back turn
- mixed developer messages continue to clear `reference_context_item` when
  trimmed because they contain persistent developer content

Replace local-only tests:

- `drop_last_n_user_turns_trims_developer_goal_context_above_rolled_back_turn`
- `user_goal_context_is_not_a_user_turn_boundary`

Add tests with names like:

- `goal_artifact_user_current_internal_context_is_not_user_turn_boundary`
- `goal_artifact_legacy_context_is_not_user_turn_boundary`
- `goal_artifact_mixed_marker_like_user_text_is_user_turn_boundary`
- `goal_artifact_rollback_trims_pure_goal_artifacts_only`

Do not make `ContextManager` a Goal authority component. It sees artifacts only
for history shaping.

### 7. Convert Local And Remote Compaction Cleanup

Edit:

- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/compact_tests.rs`
- focused compact integration tests under `codex-rs/core/tests/suite/compact*.rs`
  only if request shape changes need coverage

Replace direct imports or calls to:

- `crate::context::is_goal_context_response_item(...)`
- `sess.current_turn_goal_steering_items()` for Goal authority preservation

with:

- shared classifier calls for filtering pure Goal artifacts
- committed Goal carry metadata from Work Area 02/03 as repair context, when
  needed
- `core/src/goal_cadence/` request-local repair for any active request that
  actually needs a current Goal item after compaction

Required behavior:

- `collect_user_messages(...)` excludes pure current Goal internal-context
  items and pure legacy `<goal_context>` artifacts
- `collect_user_messages(...)` preserves mixed marker-like user prose
- `should_keep_compacted_history_item(...)` drops pure current Goal
  internal-context items and pure legacy artifacts from model-provided compact
  output
- remote v2 compacted history benefits from the same
  `should_keep_compacted_history_item(...)` behavior
- mid-turn compaction no longer reinjects concrete Goal `ResponseInputItem`s
  from `TurnState`
- mid-turn compaction may preserve committed Goal carry metadata only as
  request-local repair context for the next request-input shaping pass
- compaction does not create Goal steering from active durable state alone
- compaction does not parse rendered Goal artifact text to recover objective,
  goal id, status, facts version, pending intent, or watermark data
- compaction does not synthesize `GoalRequestEvidence`, accept rollout trace
  payloads as committed Goal delivery metadata, or use raw notification output
  as a reconstruction source

If implementation cannot remove `sess.current_turn_goal_steering_items()` from
both local and remote compaction in this Work Area because prior Work Areas have not
established committed carry metadata yet, stop and fix the dependency ordering. Do
not keep concrete carry as a Work Area 05 continuation state.

Add focused tests:

- `goal_artifact_collect_user_messages_filters_pure_current_and_legacy`
- `goal_artifact_collect_user_messages_preserves_mixed_marker_like_user_text`
- `goal_artifact_process_compacted_history_filters_pure_goal_artifacts`
- `goal_artifact_process_compacted_history_preserves_mixed_messages`
- `goal_artifact_mid_turn_compaction_does_not_reinject_pre_finalizer_goal_input`

Use integration request-shape tests only for behavior that cannot be validated by
unit tests around `process_compacted_history(...)` or
`should_keep_compacted_history_item(...)`.

### 8. Convert Rollout Reconstruction, Rollback, And Fork Cleanup

Edit:

- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
- `codex-rs/core/tests/suite/compact_resume_fork.rs`, only if integration
  request-shape coverage is needed

Replace `filter_goal_context_response_items(...)` with classifier-backed
filtering.

Required behavior:

- filter pure legacy `<goal_context>` artifacts from replacement history and
  replayed rollout response items
- filter pure current Goal internal-context artifacts from replacement history
  and replayed rollout response items when they are not being reconstructed
  from structured committed Goal metadata
- preserve mixed ordinary messages
- never reconstruct active Goal facts, pending cadence intent, current
  objective, or Continuation watermark by parsing rendered Goal artifacts
- if structured committed Goal request evidence says a recorded cadence item was
  lost, reconstruction may request recorded-history repair through
  `core/src/goal_cadence/`
- reconstruction must pair any structured committed Goal request evidence with
  the surviving item fingerprint before treating it as replay metadata
- ordinary rollout `ResponseItem`s, rollout trace payloads, raw notifications,
  classifier matches, and rendered Goal text are not structured committed Goal
  request evidence and must not be used to invent repair metadata

Add tests:

- `goal_artifact_reconstruction_filters_pure_current_and_legacy`
- `goal_artifact_reconstruction_preserves_mixed_marker_like_messages`
- `goal_artifact_reconstruction_does_not_recover_goal_state_from_legacy_text`
- `goal_artifact_reconstruction_uses_committed_metadata_for_recorded_repair`
  if Work Area 02/03 exposes structured committed metadata to this path
- `goal_artifact_reconstruction_rejects_unstructured_evidence_substitutes`
  if structured committed metadata is available in this path

If committed metadata is not yet available to reconstruction, Work Area 05 should
still filter artifacts and should leave recorded-history reconstruction repair
as a Work Area 06 acceptance item. Do not fall back to rendered text parsing.

### 9. Remove App-Server Raw Goal Suppression

Edit:

- `codex-rs/app-server/src/bespoke_event_handling.rs`

Remove the local app-server helpers:

- `is_goal_context_response_item(...)`
- `is_goal_context_text(...)`

Remove this behavior from `maybe_emit_raw_response_item_completed(...)`:

```rust
if is_goal_context_response_item(&item) {
    return;
}
```

Required behavior:

- raw response item notifications emit pure legacy `<goal_context>` response
  items unchanged
- raw response item notifications emit pure current Goal internal-context
  response items unchanged
- raw response item notifications emit mixed Goal-looking response items
  unchanged
- typed/materialized projection hiding remains separate and does not affect
  raw streams
- `GoalRequestEvidence` is not a raw response item. It must not be routed
  through raw response item notifications or materialized as conversation prose.

Replace the local-only test:

- `suppresses_goal_context_raw_response_item_notifications`

with tests like:

- `emits_legacy_goal_context_raw_response_item_notifications`
- `emits_current_goal_internal_context_raw_response_item_notifications`
- `emits_mixed_goal_context_raw_response_item_notifications`

These tests should assert `RawResponseItemCompletedNotification.item` equality.

### 10. Convert App-Server Materialized Projection Tests

Edit:

- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`, only for
  preview/materialized routes that call `codex_core::parse_turn_item(...)`
- `codex-rs/app-server/src/request_processors/thread_summary.rs`, only for
  summary/materialized routes that call `codex_core::parse_turn_item(...)`
- app-server request processor tests that inspect typed/materialized history,
  if any fail after core classifier changes

The current test
`ignores_goal_context_response_items_in_rollout_replay` is local-only
fake-shim pressure if it preserves active `<goal_context>` behavior. Replace
it with route-accurate classifier/projection coverage:

- pure legacy Goal artifacts in rollout replay do not create
  `ThreadItem::UserMessage`
- pure current Goal internal-context items in rollout replay do not create
  `ThreadItem::UserMessage`
- plain or mixed non-hook user-role rollout `ResponseItem`s keep the existing
  `ThreadHistoryBuilder` replay baseline and do not become
  `ThreadItem::UserMessage`
- hook prompt response items still rebuild `ThreadItem::HookPrompt`
- mixed marker-like user prose remains visible in app-server routes that
  materialize `codex_core::parse_turn_item(...)` output, such as preview or
  summary projection, when those routes otherwise expose user-visible content
- structured committed Goal request evidence, when implemented, remains typed
  replay metadata. It must not become a `ThreadItem::UserMessage`, hook prompt,
  raw response item, or any other user-visible conversation item.

Do not add app-server-only Goal marker classifiers. App-server should use core
projection behavior or exact rollout replay rules, not duplicate authority
logic.

### 11. Update Tests That Still Assert Active `<goal_context>` Or Concrete Carry

Edit as needed after Work Areas 00-04:

- `codex-rs/core/src/session/tests.rs`
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

Work Area 05 should not reimplement Work Areas 02-04, but it must not leave tests
that force old projection/repair behavior to survive.

Required treatment:

- tests that assert final active steering is `<goal_context>` belong to
  Work Areas 02-04 replacement payload tests or Work Area 06 deletion
- tests that assert user-role Goal steering remains valid must be deleted or
  rewritten under Work Area 00/04 posture
- tests that assert concrete `ResponseInputItem` carry is persisted or
  reinserted by compaction must be rewritten to committed metadata plus
  request-input shaping behavior
- tests that assert raw Goal hiding must be replaced in this Work Area

Do not convert every old active steering test into a classifier test. Classifier
coverage is not authority coverage.

## Classifier Interface Contract

The shared classifier is a deep module: callers pass a `ResponseItem` and get a
small typed result. Callers should not know the marker grammar, source-tag
grammar, or fingerprint details.

The classifier must make these cases unambiguous:

| Input shape | Classification | Caller consequence |
| --- | --- | --- |
| developer-role pure current `source="goal"` internal context | `CurrentGoalInternalContext` | request-input shaper may keep/replace/dedupe; typed projection hides; raw emits |
| user-role pure current `source="goal"` internal context | `CurrentGoalInternalContext` | cleanup terrain only, never valid authority; typed projection hides; raw emits |
| developer/user pure legacy `<goal_context>` | `LegacyGoalContextArtifact` | legacy cleanup/projection only; raw emits |
| pure non-Goal internal context | `NonGoalInternalContext` | not Goal; caller applies generic contextual rules if any |
| ordinary prose containing `<goal_context>` text | `MixedOrOrdinary` | preserve as ordinary content |
| multiple text spans, one of which is Goal-looking | `MixedOrOrdinary` | preserve as ordinary/mixed content |
| images or output text mixed with Goal-looking text | `MixedOrOrdinary` | preserve as ordinary/mixed content |

The classifier must not expose durable Goal facts. It must not take a
`ThreadGoal` snapshot. Durable matching belongs to `core/src/goal_cadence/`.

## Focused Tests

### Core Classifier Tests

Add tests near the classifier implementation, for example in
`codex-rs/core/src/goal_artifacts.rs`.

Required tests:

- `goal_artifact_classifies_pure_current_goal_internal_context`
- `goal_artifact_classifies_user_role_current_goal_as_cleanup_only`
- `goal_artifact_classifies_pure_legacy_goal_context`
- `goal_artifact_classifies_non_goal_internal_context`
- `goal_artifact_preserves_mixed_marker_like_text`
- `goal_artifact_rejects_multiple_content_spans_as_pure_artifact`
- `goal_artifact_rejects_input_image_or_output_text_mixes`
- `goal_artifact_rejects_malformed_internal_context_source`
- `goal_artifact_fingerprint_changes_when_body_changes`

Use `pretty_assertions::assert_eq` and prefer equality over field-by-field
assertions where possible.

### Request-Input Cleanup Tests

Add or update tests in:

- `codex-rs/core/tests/suite/goal_authority.rs`
- `codex-rs/core/src/session/tests.rs` only when a unit-level seam is more
  practical

Required tests:

- `goal_authority_cleanup_uses_classifier_for_legacy_and_current_artifacts`
- `goal_authority_cleanup_preserves_mixed_marker_like_prose`
- `goal_authority_wrong_role_current_goal_replaced_only_when_cadence_required`
- `goal_authority_duplicate_current_goal_items_are_deduped`
- `goal_authority_active_goal_without_pending_intent_does_not_repair_every_turn`

Assertions must inspect final `/responses` input or request-input shaper output,
not generic classifier output alone.

### Projection And History Tests

Add or update tests in:

- `codex-rs/core/src/event_mapping_tests.rs`
- `codex-rs/core/src/context/contextual_user_message_tests.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`

Required tests:

- pure current Goal internal-context item is hidden from typed projection
- pure legacy `<goal_context>` artifact is hidden from typed projection
- mixed marker-like user prose remains visible
- pure current and legacy Goal items are not user turn boundaries
- mixed marker-like user prose remains a user turn boundary
- app-server rollout replay does not materialize pure current or legacy Goal
  artifacts as user-visible items
- hook prompt replay remains unchanged

### Compaction And Reconstruction Tests

Add or update tests in:

- `codex-rs/core/src/compact_tests.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
- focused compact/resume integration tests only when necessary

Required tests:

- compact user-message collection filters pure current and legacy Goal items
- compact user-message collection preserves mixed marker-like prose
- remote compact output filtering drops pure current and legacy Goal artifacts
- remote compact output filtering preserves mixed marker-like prose
- rollout reconstruction filters pure current and legacy Goal artifacts
- rollout reconstruction preserves mixed marker-like prose
- rollout reconstruction does not recover Goal state from legacy text
- rollout reconstruction rejects ordinary rollout `ResponseItem`, rollout
  trace payload, raw notification, classifier match, and rendered Goal text as
  structured committed Goal request evidence
- mid-turn compaction no longer reinjects pre-shaper concrete Goal input

### Raw Notification Tests

Add or update tests in:

- `codex-rs/app-server/src/bespoke_event_handling.rs`

Required tests:

- pure legacy Goal context emits
  `RawResponseItemCompletedNotification`
- pure current Goal internal-context emits
  `RawResponseItemCompletedNotification`
- mixed Goal-looking item emits
  `RawResponseItemCompletedNotification`
- hook prompt raw response item behavior remains unchanged

## Verification

Docs-only validation for this planning Work Area:

```powershell
git diff --check -- local/goal_research local/goal_136_plan
```

Implementation validation for Work Area 05:

```powershell
cd codex-rs
just fmt
```

Focused classifier and projection tests:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_artifact
cargo test -p codex-core --lib goal_artifact_projection
```

Focused compaction and reconstruction tests:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_artifact_compaction
cargo test -p codex-core --lib goal_artifact_reconstruction
```

Focused final request-input cleanup tests if added under the integration suite:

```powershell
cd codex-rs
cargo test -p codex-core --test suite goal_authority_cleanup
```

Focused app-server raw/projection tests:

```powershell
cd codex-rs
cargo test -p codex-app-server --lib raw_response_item
cargo test -p codex-app-server-protocol --lib goal_artifact
```

If a focused app-server integration scenario is added:

```powershell
cd codex-rs
cargo test -p codex-app-server --test suite goal_artifact
```

Do not run broad workspace or full crate suites by default on this
workstation.

## Target State

This Work Area's target state is:

- a shared classifier distinguishes pure current Goal internal-context items,
  pure legacy `<goal_context>` artifacts, non-Goal internal context, and mixed
  ordinary content
- whole-message purity is enforced for every Goal artifact classification
- `core/src/goal_cadence/` uses the classifier for final request-input cleanup while
  remaining the only active repair/cadence authority
- no classifier, projection, compaction, reconstruction, or raw-notification
  helper consumes pending intent or advances Continuation watermarking
- no classifier, projection, compaction, reconstruction, or raw-notification
  helper writes, emits, hides, or materializes `GoalRequestEvidence`
- typed/materialized projections hide pure current Goal internal-context items
  and pure legacy artifacts
- typed/materialized projections preserve mixed marker-like ordinary prose
- user-turn boundary and rollback trimming behavior uses classifier output
  without treating mixed messages as pure artifacts
- local and remote compaction filter pure Goal artifacts and preserve mixed
  messages
- compaction no longer reinjects pre-shaper concrete Goal
  `ResponseInputItem`s as authority
- rollout reconstruction filters pure current and legacy Goal artifacts
- rollout reconstruction does not recover active Goal state, current objective,
  pending intent, or watermark state from rendered artifact text
- rollout reconstruction treats structured committed Goal request evidence as
  metadata only and rejects ordinary rollout items, rollout trace payloads, raw
  notifications, classifier matches, and rendered Goal text as substitutes
- app-server raw response item notifications emit pure current Goal, pure
  legacy Goal, and mixed Goal-looking items unchanged
- old app-server raw Goal overlay helpers are removed
- old local tests that preserve raw hiding or active `<goal_context>`
  projection behavior are deleted or rewritten
- focused tests cover classifier, projection, compaction, reconstruction, raw
  notification, and request-input cleanup behavior

## Non-Goals

This Work Area does not:

- decide whether Initial, ObjectiveUpdated, BudgetLimit, or Continuation is due
- construct active Goal model input outside `core/src/goal_cadence/`
- consume durable pending cadence intent
- advance automatic Continuation watermarks
- create or mutate durable Goal facts
- create, append, or interpret recorded Goal request evidence
- implement extension mutation/accounting ownership
- redesign app-server Goal product APIs
- parse rendered Goal artifacts to recover active Goal state
- make request repair the primary cadence mechanism
- delete every remaining old Goal shim symbol
- remove upstream Goal product behavior such as `/goal`, status/footer
  projection, pause/edit/clear, budget, or usage

## Continuation Constraints

Work Area 05 should be implemented after Work Areas 02-04 because it depends on:

- final request-input cleanup and commit ownership in `core/src/goal_cadence/`
- committed Goal carry metadata replacing pre-shaper concrete carry
- extension/app-server producers no longer depending on active
  `GoalContext` injection

Allowed continuation state while Work Area 06 remains:

- legacy `<goal_context>` pure-artifact detection still exists behind the
  shared classifier
- some old symbols remain if they are unreachable active steering terrain and
  Work Area 06 is explicitly removing them
- app-server typed projection remains implemented through
  `codex_core::parse_turn_item(...)`
- request-input cleanup uses classifier output, but final global grep/audit is
  left to Work Area 06

Not allowed for this Work Area's target state:

- `GoalContext` or `GoalContextRole` retained as active steering architecture
- classifier output treated as active Goal authority
- request repair emitting Goal on every ordinary active-Goal turn
- app-server raw Goal hiding
- compaction preserving active Goal authority by carrying pre-shaper
  `ResponseInputItem`s
- reconstruction parsing rendered Goal text to recover Goal state or intent
- tests that assert only helper text while final request input or projection
  output remains untested
