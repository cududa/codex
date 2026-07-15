# WA05 Repair Classifiers And Projections Surface Map

This is the pre-pass surface map for
`05-repair-classifiers-and-projections.md`.

It is not an implementation pass doc. It exists to make the classifier,
projection, compaction, reconstruction, and raw-notification surfaces explicit
before WA05 split planning.

## Direction Lock

Request:

- produce only the WA05 surface map
- ground it in `local/goal_research`, completed WA02/WA03/WA04 pre-pass route
  context, the WA05 parent doc, and real local/upstream terrain
- do not implement Rust code
- do not write WA05 implementation pass docs in this pass

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`

Route context:

- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections.md`

Terrain:

- local code still has `GoalContext`, `GoalContextRole`, active
  `<goal_context>` rendering, and scattered `is_goal_context_*` consumers
- local contextual parsing and event mapping classify Goal marker text at the
  text/content-fragment level, not as a strict whole `ResponseItem`
- local and remote compaction still read concrete current-turn Goal
  `ResponseInputItem` carry and splice it into replacement history
- local rollout reconstruction filters pure legacy Goal context from
  replacement history and replayed `RolloutItem::ResponseItem`
- local app-server raw event handling has a fork-only Goal-specific raw
  response overlay that drops pure Goal context raw notifications
- `core/src/goal_cadence/` and `core/src/goal_artifacts.rs` do not exist yet
  in the current tree; this map names their planned ownership from WA02/WA05
- `rust-v0.136.0` has useful internal-context rendering/source-validation
  terrain and no app-server Goal raw overlay
- `rust-v0.140.0` typed replay is migration precedent for structured metadata,
  not authority and not a Goal model-input materialization path

Code-shape temptation:

- preserve `GoalContext` because it already renders and detects marker text
- replace scattered predicates with a broad classifier that callers treat as
  authority
- preserve the app-server raw overlay behind a new classifier
- make compaction or reconstruction recover active Goal state from rendered
  artifacts
- treat `GoalRequestEvidence`, ordinary rollout items, rollout trace payloads,
  raw notifications, classifier matches, or rendered Goal text as active Goal
  authority or facts recovery

Locked direction:

- map WA05 as cleanup/projection replacement surfaces only
- add generic source-tagged internal-context rendering and strict pure parsing
  as helper infrastructure
- add a shared Goal artifact classifier that requires whole-message purity
- keep active request cleanup and repair decisions inside
  `core/src/goal_cadence/`
- convert projection, history, compaction, reconstruction, and app-server
  surfaces to consume classifier output only for cleanup/hiding
- delete the local app-server raw overlay and restore raw response
  notifications to raw behavior
- keep recorded request evidence metadata-only and outside classifier,
  projection, raw notification, and rendered-text recovery paths

Exclusions:

- no Rust implementation
- no WA05 implementation pass docs
- no cadence selection, pending-intent consumption, durable Goal mutation, or
  Continuation watermark advancement
- no extension mutation conversion
- no recorded request evidence carrier implementation
- no final global dead-code deletion sweep; WA06 owns final audit/deletion

## Terrain Findings

### Local Current-Tree Findings

- `codex-rs/core/src/context/goal_context.rs` combines active steering
  rendering, active role choice, `ResponseInputItem` construction, and legacy
  marker detection.
- `ContextualUserFragment::matches_text(...)` trims and checks start/end
  markers. That is not enough for WA05 because classifier purity must be
  decided over the whole `ResponseItem` and the complete content list.
- `codex-rs/core/src/context/contextual_user_message.rs` currently treats
  `is_goal_context_text(...)` like contextual user infrastructure and skips it
  during hook prompt parsing.
- `codex-rs/core/src/event_mapping.rs` hides user-role pure Goal marker text
  from typed turn projection and treats developer-role Goal marker text as
  contextual developer content.
- `ContextManager::drop_last_n_user_turns(...)` and
  `is_user_turn_boundary(...)` inherit Goal behavior through contextual
  user/developer predicates.
- `codex-rs/core/src/compact.rs` filters legacy Goal context from collected
  user messages and reinjects concrete current-turn Goal steering items during
  mid-turn compaction.
- `codex-rs/core/src/compact_remote.rs` filters Goal context from remote
  compacted output and also reinjects concrete current-turn Goal items during
  mid-turn remote compaction.
- `codex-rs/core/src/compact_remote_v2.rs` retains user/developer/system
  messages, then delegates filtering to
  `should_keep_compacted_history_item(...)`.
- `codex-rs/core/src/session/rollout_reconstruction.rs` filters pure legacy
  Goal context from replacement history and replayed response items, but has
  no structured Goal evidence pairing path.
- `codex-rs/core/src/session/mod.rs::record_conversation_items(...)` appends
  ordinary response items to history, persists them as rollout response items,
  and emits raw response item events.
- `codex-rs/app-server/src/bespoke_event_handling.rs` locally drops raw
  Goal context notifications before emitting
  `RawResponseItemCompletedNotification`.
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs` builds
  materialized turns from rollout event items and only reconstructs hook
  prompts from response items; plain user response items are ignored.
- Current tests still assert local-only `<goal_context>`, `GoalContextRole`,
  raw hiding, and concrete carry behavior named by
  `goal-test-deletion-map.md`.

### Upstream Terrain Findings

- `rust-v0.136.0` `internal_model_context.rs` provides useful
  `InternalContextSource` validation and `<codex_internal_context
  source="...">` rendering/parsing terrain.
- The upstream v136 internal-context helper still implements
  `ContextualUserFragment` and therefore is not a Goal authority path for this
  fork.
- `rust-v0.136.0` app-server raw event handling emits raw response item
  notifications directly; the local Goal raw overlay is fork
  terrain to delete, not upstream baseline behavior to preserve.
- `rust-v0.136.0` compaction/reconstruction lacks the local concrete Goal
  carry and Goal filter overlay; those are fork terrain.
- `rust-v0.140.0` typed replay reconstructs
  `InterAgentCommunication` through a model-input materialization method.
  That is useful typed replay precedent, but Goal request evidence must remain
  metadata-only and must not get an equivalent active model-input conversion.

## Surface Map

### 1. Generic Internal-Context Rendering And Parsing

Owner files/modules:

- planned `codex-rs/core/src/context/internal_context.rs`
- `codex-rs/core/src/context/mod.rs`
- current `codex-rs/core/src/context/fragment.rs` as terrain, not the active
  Goal authority owner
- `rust-v0.136.0:codex-rs/core/src/context/internal_model_context.rs` as
  migration terrain

Current callsites and old shim behavior:

- current `GoalContext` renders `<goal_context>` and implements
  `ContextualUserFragment`
- upstream v136 generic internal-context helper renders
  `<codex_internal_context source="...">`, but through user-role contextual
  conversion
- no local current-tree generic source-tagged internal-context module exists

Replacement classifier/projection behavior:

- add or reuse a private generic internal-context helper for source validation,
  rendering text, and parsing pure internal-context text
- use the current representation:
  `<codex_internal_context source="goal">...</codex_internal_context>`
- parse source and body without treating helper output as authority
- enforce source validation equivalent to `[a-z][a-z0-9_]*`
- leave active `ResponseItem` construction to `core/src/goal_cadence/`

What must wait:

- WA02 owns final developer-role `ResponseItem` construction.
- WA06 owns final deletion/reduction of old public `GoalContext` exports.

Tests:

- source validation accepts `goal` and rejects malformed sources
- rendered source-tagged text roundtrips as pure internal context
- malformed or mixed text is not parsed as pure internal context
- helper output alone does not consume intent, advance watermarks, or prove
  authority

Implementation pass boundary pressure:

- natural first WA05 pass with the classifier, unless WA02 has already added a
  narrow renderer that WA05 can generalize in place

### 2. Strict Shared Goal Artifact Classifier

Owner files/modules:

- planned `codex-rs/core/src/goal_artifacts.rs`
- `codex-rs/core/src/lib.rs` export surface if needed by existing consumers
- `codex-rs/core/BUILD.bazel` if source lists require updates
- current `codex-rs/core/src/context/goal_context.rs` as legacy marker terrain

Current callsites and old shim behavior:

- `is_goal_context_text(...)` and `is_goal_context_response_item(...)` are
  scattered Goal-specific predicates
- current matching accepts pure user/developer Goal marker messages, but the
  implementation lives beside active steering construction

Replacement classifier/projection behavior:

- classify only complete `ResponseItem::Message` values with role `user` or
  `developer` and exactly one `ContentItem::InputText`
- distinguish:
  - pure current Goal internal context
  - pure legacy `<goal_context>` artifact
  - pure non-Goal internal context
  - mixed or ordinary content
- require whole-message purity; multiple content spans, images, output text,
  or ordinary prose with marker-like substrings remain mixed/ordinary
- expose cleanup-oriented names only; do not expose a
  `has_current_goal_authority`-style predicate

What must wait:

- durable Goal matching and selected-current-item authority remains in
  `core/src/goal_cadence/`
- final removal of all old `is_goal_context_*` exports is WA06 audit work if
  unreachable symbols remain

Tests:

- pure current Goal internal context classified by `source="goal"`
- user-role current Goal classified as cleanup-only, not valid authority
- pure legacy `<goal_context>` classified as legacy artifact
- non-Goal internal context not classified as Goal
- mixed marker-like prose and multi-span content preserved
- fingerprints change when body changes if a fingerprint type is introduced

Implementation pass boundary pressure:

- pair with generic internal-context helper or land immediately after it
- subsequent consumer passes should depend on this classifier instead of
  reimplementing marker parsing

### 3. Request-Input Cleanup Helper Integration

Owner files/modules:

- planned `codex-rs/core/src/goal_cadence/`
- planned `codex-rs/core/src/goal_artifacts.rs`

Current callsites and old shim behavior:

- current tree has no `core/src/goal_cadence/` yet
- old active paths inject concrete `ResponseInputItem`s before request
  shaping, so request cleanup has to treat pre-injected Goal-looking items as
  terrain

Replacement classifier/projection behavior:

- `goal_cadence` uses the shared classifier for final request-input cleanup:
  remove legacy artifacts, stale current Goal items, wrong-role current Goal
  items, duplicate current Goal items, and pre-injected Goal-looking items
- classifier output supports cleanup reporting only
- cadence selection, durable facts matching, selected item construction, and
  commit metadata stay in `goal_cadence`

What must wait:

- WA02 must create the request-input shaper API and final-payload tests.
- WA05 should not invent fallback request shaping if WA02 is not present.

Tests:

- final request input or shaper output has duplicate/wrong-role/legacy items
  cleaned according to cadence rules
- mixed marker-like ordinary messages survive cleanup
- active Goal with no pending intent is not repaired every ordinary turn

Implementation pass boundary pressure:

- keep this separate from typed projection and compaction unless the shaper
  already owns the classifier adapter

### 4. Contextual User Parsing

Owner files/modules:

- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/context/contextual_user_message_tests.rs`

Current callsites and old shim behavior:

- `is_contextual_user_fragment(...)` treats `is_goal_context_text(...)` as a
  contextual user fragment
- `parse_visible_hook_prompt_message(...)` skips Goal context text while
  collecting hook prompt fragments

Replacement classifier/projection behavior:

- replace direct Goal marker text checks with a pure-text or
  `ResponseItem`-level classifier adapter appropriate for this callsite
- pure current Goal internal-context text and pure legacy `<goal_context>` text
  remain contextual cleanup fragments
- non-Goal contextual fragments and hook prompt parsing preserve existing
  behavior
- mixed text must not be skipped as contextual Goal content

What must wait:

- no WA02/WA03/WA04 dependency unless the active current representation is not
  available yet
- WA06 owns deletion of obsolete `GoalContext` active exports

Tests:

- delete local-only fake-context tests named by `goal-test-deletion-map.md`
- add pure-current and pure-legacy contextual parsing tests
- add mixed marker-like hook/user text tests proving mixed text is preserved

Implementation pass boundary pressure:

- can land with event mapping/history boundary conversion because they share
  contextual predicates

### 5. Event Mapping And Typed/Materialized Projection

Owner files/modules:

- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/event_mapping_tests.rs`
- app-server typed/materialized projection consumers of
  `codex_core::parse_turn_item(...)`

Current callsites and old shim behavior:

- `parse_turn_item(...)` hides user-role pure Goal marker messages through
  contextual user parsing
- developer messages are ignored by typed turn projection, while
  `is_contextual_dev_fragment(...)` affects rollback/reference-context
  handling

Replacement classifier/projection behavior:

- typed/materialized projections hide pure current Goal internal-context items
  and pure legacy artifacts
- mixed user-role messages containing marker-like text remain visible user
  messages
- mixed developer content continues to count as non-contextual developer
  content when appropriate
- non-Goal internal context is not classified as Goal
- projection hiding is not authority and does not write evidence

What must wait:

- request-input authority tests remain WA02/WA06, not projection tests
- app-server should continue to consume core projection behavior rather than
  duplicate Goal classifier logic

Tests:

- pure current Goal internal context hidden from typed projection
- pure legacy Goal artifact hidden from typed projection
- mixed marker-like user prose visible
- developer mixed content invalidates reference context where existing
  rollback semantics require it

Implementation pass boundary pressure:

- natural pass with contextual user parsing and history-boundary updates

### 6. History Boundary And Rollback Trimming

Owner files/modules:

- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`
- `codex-rs/core/src/thread_rollout_truncation.rs`, if tests or callers expose
  the same boundary semantics

Current callsites and old shim behavior:

- `is_user_turn_boundary(...)` excludes contextual user messages, including
  user-role Goal marker text
- `trim_pre_turn_context_updates(...)` trims contextual developer/user
  messages before rollback cuts
- mixed developer bundles clear `reference_context_item` because they contain
  persistent developer text

Replacement classifier/projection behavior:

- pure current Goal internal-context items are not user-turn boundaries
- pure legacy `<goal_context>` artifacts are not user-turn boundaries
- mixed marker-like user messages remain user-turn boundaries
- rollback trimming may remove pure contextual Goal/internal-context items in
  trimmable positions
- history code must not infer active Goal facts, cadence, pending intent, or
  Continuation suppression

What must wait:

- WA03 owns `model_visible_history_key` projection; history boundary cleanup
  may support it but must not redefine the key
- WA05 owns classifier integration only

Tests:

- pure current/legacy Goal items are not user-turn boundaries
- mixed marker-like user text remains a boundary
- rollback trims pure artifacts only
- mixed developer text retains the existing reference-context invalidation
  behavior

Implementation pass boundary pressure:

- couples tightly to contextual parsing and event mapping

### 7. Local And Remote Compaction Cleanup

Owner files/modules:

- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/compact_tests.rs`
- focused compact integration tests only if unit surfaces cannot prove the
  behavior

Current callsites and old shim behavior:

- `collect_user_messages(...)` filters `is_goal_context_response_item(...)`
  after `parse_turn_item(...)`
- local mid-turn compaction extends initial context with
  `sess.current_turn_goal_steering_items()`
- remote compaction `process_compacted_history(...)` also reinjects concrete
  current-turn Goal items
- `should_keep_compacted_history_item(...)` drops legacy Goal context before
  role-based remote-output filtering
- remote v2 delegates to `should_keep_compacted_history_item(...)`

Replacement classifier/projection behavior:

- filter pure current Goal internal-context items and pure legacy artifacts
  from compaction user-message collection and compacted output
- preserve mixed marker-like user/developer prose
- remove concrete `ResponseInputItem` reinjection from local and remote
  mid-turn compaction
- use committed Goal carry metadata only as request-local repair context
  through `core/src/goal_cadence/`, when prior work provides that metadata
- do not synthesize Goal steering, pending intent, Continuation watermark, or
  `GoalRequestEvidence` from compaction cleanup

What must wait:

- WA02/WA03 must provide committed carry metadata before concrete carry can be
  removed without a gap.
- If committed carry metadata is missing, split planning should stop and fix
  dependency ordering rather than keep concrete carry as WA05 continuation
  state.
- WA06 owns final deletion of old carry APIs after all consumers are converted.

Tests:

- compact user-message collection filters pure current and legacy items
- compact user-message collection preserves mixed marker-like prose
- remote compact output filtering drops pure current and legacy artifacts
- remote compact output filtering preserves mixed prose
- mid-turn compaction does not reinsert pre-shaper concrete Goal input

Implementation pass boundary pressure:

- this is a distinct high-coupling pass because it depends on committed carry
  metadata and touches local, remote, and remote-v2 compaction

### 8. Rollout Reconstruction, Rollback, And Fork Cleanup

Owner files/modules:

- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
- rollback/fork integration tests only if request-shape coverage is needed

Current callsites and old shim behavior:

- `filter_goal_context_response_items(...)` removes pure legacy Goal context
  from replacement histories
- replay skips pure legacy Goal context response items before
  `history.record_items(...)`
- reverse replay marks segments as user turns with `is_user_turn_boundary(...)`
- rollback/fork derive surviving history from rollout suffix and compaction
  checkpoints

Replacement classifier/projection behavior:

- filter pure legacy `<goal_context>` artifacts and pure current Goal
  internal-context artifacts from replacement history and replay where they
  are cleanup artifacts
- preserve mixed ordinary messages
- do not reconstruct active Goal facts, current objective, pending intent, or
  Continuation watermark from rendered text
- if structured committed Goal request evidence exists and is in scope, pair it
  with the surviving item fingerprint before treating it as replay metadata
- ordinary rollout `ResponseItem`s, rollout trace payloads, raw notifications,
  classifier matches, and rendered Goal text are not structured evidence

What must wait:

- recorded-history repair from structured evidence waits for WA02/WA03
  evidence/carry availability or WA06 final acceptance if not yet exposed
- WA05 can still filter artifacts without implementing evidence repair

Tests:

- reconstruction filters pure current and legacy artifacts
- reconstruction preserves mixed marker-like messages
- reconstruction does not recover Goal state from legacy text
- evidence-substitute rejection tests if structured evidence is available to
  this path

Implementation pass boundary pressure:

- separate from compaction unless split planning finds reconstruction tests
  need the compaction filter in the same pass

### 9. App-Server Raw Response Overlay Deletion

Owner files/modules:

- `codex-rs/app-server/src/bespoke_event_handling.rs`

Current callsites and old shim behavior:

- `maybe_emit_raw_response_item_completed(...)` returns early when
  `is_goal_context_response_item(...)` matches
- local helper functions duplicate Goal marker parsing in app-server
- test `suppresses_goal_context_raw_response_item_notifications` expects pure
  Goal context raw items to be hidden

Replacement classifier/projection behavior:

- delete the app-server-only Goal raw overlay
- raw response item notifications emit actual `ResponseItem`s unchanged,
  including pure current Goal internal-context items, pure legacy
  `<goal_context>` artifacts, and mixed Goal-looking items
- typed/materialized projection hiding remains separate and does not affect raw
  streams
- do not add an app-server-only Goal classifier
- `GoalRequestEvidence` is not a raw response item and is not emitted as raw
  conversation content

What must wait:

- no WA02/WA03/WA04 dependency is needed to restore raw-stream behavior, but
  replacement tests may be easiest after current/legacy fixture helpers exist
- broader raw contract changes would require a separate authority update

Tests:

- replace the old raw-hiding test with raw-emits tests for legacy, current, and mixed
  Goal-looking items
- assert `RawResponseItemCompletedNotification.item` equality
- keep hook prompt raw behavior unchanged

Implementation pass boundary pressure:

- this can be a small standalone WA05 pass or paired with app-server
  materialized projection tests, but it must be framed as fork-overlay deletion
  and raw-stream restoration

### 10. App-Server Materialized Projection And Thread History

Owner files/modules:

- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`, for
  preview/materialized routes that call `codex_core::parse_turn_item(...)`
- `codex-rs/app-server/src/request_processors/thread_summary.rs`, for
  summary/materialized routes that call `codex_core::parse_turn_item(...)`
- app-server request processor tests that inspect materialized history, if any
  fail after core classifier changes

Current callsites and old shim behavior:

- `ThreadHistoryBuilder::handle_response_item(...)` reconstructs hook prompts
  from `RolloutItem::ResponseItem`
- plain user response items are ignored by materialized rollout replay
- preview and summary projection routes call `codex_core::parse_turn_item(...)`
  directly when deriving user-visible text from rollout response items
- local test `ignores_goal_context_response_items_in_rollout_replay` protects
  old marker behavior

Replacement classifier/projection behavior:

- pure current Goal internal-context items and pure legacy artifacts do not
  materialize as user-visible thread items
- plain or mixed non-hook user-role rollout `ResponseItem`s keep the existing
  `ThreadHistoryBuilder` replay baseline and do not become
  `ThreadItem::UserMessage`
- mixed user-role marker-like prose remains visible in app-server paths that
  actually materialize `codex_core::parse_turn_item(...)` output
- hook prompt replay remains unchanged
- structured `GoalRequestEvidence`, if later added, remains replay metadata and
  does not materialize as user-visible prose, hook prompt, or raw response item

What must wait:

- app-server should rely on core projection semantics or exact rollout replay
  rules, not an app-server duplicate classifier
- evidence enum/carrier work is not WA05 unless already available

Tests:

- replace local-only Goal-context replay test with pure current, pure legacy,
  non-hook mixed/plain response-item replay-baseline, and hook prompt coverage
- add preview or summary route coverage for mixed marker-like prose only if
  those app-server routes expose materialized `parse_turn_item(...)` output
- if structured evidence exists, test it is not materialized as conversation
  prose

Implementation pass boundary pressure:

- can pair with raw overlay deletion as the app-server-specific WA05 pass

### 11. Classifier/Projection Test Surface Separation

Owner files/modules:

- `codex-rs/core/src/goal_artifacts.rs` tests
- `codex-rs/core/src/event_mapping_tests.rs`
- `codex-rs/core/src/context/contextual_user_message_tests.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`
- `codex-rs/core/src/compact_tests.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs` tests
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs` tests
- old active-steering tests named by `goal-test-deletion-map.md`

Current callsites and old shim behavior:

- current local tests defend active `<goal_context>`, `GoalContextRole`,
  user-role steering compatibility, raw hiding, and concrete carry
- some tests have the right scenario but assert the old transport shape

Replacement classifier/projection behavior:

- classifier tests prove classification and purity only
- projection/history tests prove user-visible hiding/preservation only
- compaction/reconstruction tests prove cleanup and no rendered-text recovery
- raw tests prove raw streams emit actual items unchanged
- final request-input authority tests stay in WA02/WA04/WA06 and inspect
  captured `/responses` input or request-input shaper output

What must wait:

- WA00/WA02/WA04 may own deletion or rewrite of active-steering tests outside
  the cleanup/projection surface
- WA06 owns final global stale-symbol and acceptance audit

Tests:

- delete local-only fake-shim tests listed by `goal-test-deletion-map.md`
- do not turn every active steering test into a classifier test
- reject helper output, classifier matches, raw notifications, ordinary rollout
  response items, rollout trace payloads, and rendered Goal text as substitutes
  for final request-input authority or structured commit evidence

Implementation pass boundary pressure:

- final WA05 test pass should consolidate tests after consumer conversions,
  but each consumer pass should add focused tests for behavior it changes

## Coupling Summary

Use this dependency order during WA05 split planning:

1. Generic internal-context helper and shared classifier establish the
   vocabulary used by all consumers.
2. Request-input cleanup integration lets `core/src/goal_cadence/` consume the
   shared classifier without moving authority into classifier code.
3. Contextual parsing, event mapping, and history boundaries share the same
   contextual predicate changes and can likely be one pass.
4. Compaction should wait until committed carry metadata exists from WA02/WA03;
   it must not keep concrete current-turn Goal `ResponseInputItem` carry.
5. Rollout reconstruction can filter artifacts independently, but structured
   evidence-based recorded repair waits for the evidence/carry seam if that
   seam is in scope.
6. App-server raw overlay deletion and materialized projection tests are a
   bounded app-server/protocol pass.
7. WA05-focused tests should be layered with the consumer conversions, with a
   final test-surface pass only if split planning needs one.

## Proceed Criteria For WA05 Split Planning

WA05 can move to implementation pass split planning when the split planner can
use this map to name:

- which pass adds or reuses generic internal-context rendering/parsing
- which pass adds the shared strict Goal artifact classifier
- which pass integrates request-input cleanup with `core/src/goal_cadence/`
- which pass converts contextual parsing, event mapping, typed projection, and
  history boundaries
- which pass converts local/remote/remote-v2 compaction and removes concrete
  current-turn Goal carry from compaction replacement history
- which pass converts rollout reconstruction, rollback, and fork cleanup
- which pass deletes the app-server raw response overlay and restores raw
  notifications
- which pass updates app-server materialized projection/thread-history tests
- which tests are classifier/projection cleanup tests and which final-payload
  authority tests remain outside WA05
- which old active-shim tests are WA05 rewrite work versus WA06 final cleanup

Do not proceed to WA05 implementation pass docs if the split would make
classifier output, projection hiding, raw notifications, ordinary rollout
items, recorded request evidence, or rendered Goal text stand in for final
request-input authority.

## Validation

Docs-only validation:

```powershell
git diff --check -- local\goal_research local\goal_136_plan
```

Stale architecture scan:

```powershell
rg -n 'developer-role internal-context|internal-context ResponseItem|core/src/goal_cadence\.rs|\bfinalizer\b|structured proof|authority proof|GoalRequestEvidence.*authority|rendered Goal text.*evidence|classifier.*authority' local\goal_136_plan\work-areas\05*.md
```

Remaining hits are valid only when naming rejected terrain or explicitly
preserving the authority/evidence boundary.
