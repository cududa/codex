# Prompt Reviews Concern Detector Requirements

## Purpose

Build a deterministic concern-surface detector for `prompt_reviews` that can keep
pace with upstream Codex development and with local self-maintenance work.

The detector exists to answer this question for each reviewed version, commit,
file, and diff block:

> Did this change touch code or prompt text that can materially alter Cullen's
> Codex working cadence?

The detector must be grounded in the actual Codex source tree. It must not be a
generic classifier, a loose keyword search, or an agent-memory convention. The
mapped concern areas must be concrete source graph surfaces: files, symbols,
templates, markers, enums, call edges, registration edges, config fields, wire
types, tests, and snapshots.

The detector is review evidence. It does not make human decisions.

## Non-Negotiable Requirements

1. The detector must attach findings to existing `prompt_reviews` review
   entities:
   - `version`
   - `commit`
   - `commit_file`
   - `diff_block`

2. Findings must be deterministic and reproducible from repository state, git
   commits, the tracked concern map, and detector code.

3. The default detector behavior is `flag only`.
   - It records findings.
   - It surfaces findings in queues and review views.
   - It does not automatically accept, reject, classify, finalize, or create
     human decisions.
   - It may optionally create derived queue pressure, but those derived states
     must remain distinguishable from human/agent review decisions.

4. The concern graph must grow automatically.
   - During upstream version ingestion, commits are processed in order.
   - A commit is evaluated against the concern graph as it exists before that
     commit is applied.
   - After the commit is processed, newly connected graph nodes from the commit
     are added to the graph for later commits.
   - This allows commit A to add a new connected surface and commit B to be
     flagged when it touches that new surface.

5. Local self-maintained changes must not depend on an agent remembering a
   manual command.
   - Add a local post-commit graph refresh path.
   - The post-commit path expands or refreshes graph nodes for local commits.
   - The post-commit path does not need to create review findings by default,
     because local graph expansion is not the same thing as upstream review.

6. The detector must use AST or syntax-aware extraction where semantics matter.
   - Rust concern surfaces must not be modeled only by path glob or keyword.
   - Template and Markdown prompt files can be scanned as structured text.
   - SQL, JSON schema, and TypeScript protocol/API surfaces can use lighter
     parsing in the first implementation, but must still be anchored to paths,
     symbols, fields, or markers.

7. The implementation must be integrated into the applet's real workflow.
   - `populate_next_version` must run detection automatically.
   - Review read APIs must expose finding summaries.
   - MCP tools must expose finding data where agents need it.
   - The web UI must have enough finding visibility for human review.

8. The implementation must preserve the existing review model.
   - Existing comments, decisions, plans, classifications, and concern tags are
     not replaced.
   - Detector evidence should support those workflows.
   - Human-finalized decisions remain authoritative.

## Concern Surface Map

Each concern area is represented as:

- a stable concern slug;
- a human definition;
- seed paths;
- seed symbols and string markers;
- graph expansion rules;
- false-positive exclusions;
- test fixtures that prove representative hits.

The source map is tracked code or data in the repository. Expanded graph state
may be stored in SQLite as generated detector data.

### Harness Prompts

Definition:

Model-facing instruction sources and the code path that selects, templates,
overrides, and sends those instructions to the model as Responses
`instructions` or prompt input.

Primary seed paths:

- `codex-rs/models-manager/src/model_info.rs`
- `codex-rs/protocol/src/openai_models.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/client_common.rs`
- `codex-rs/core/src/client.rs`
- `codex-rs/models-manager/prompt.md`
- `codex-rs/core/templates/model_instructions/*.md`
- `codex-rs/collaboration-mode-templates/templates/*.md`
- `codex-rs/core/templates/agents/orchestrator.md`
- `codex-rs/core/templates/compact/prompt.md`
- `codex-rs/core/templates/realtime/backend_prompt.md`

Seed symbols and markers:

- `BASE_INSTRUCTIONS`
- `DEFAULT_PERSONALITY_HEADER`
- `LOCAL_FRIENDLY_TEMPLATE`
- `LOCAL_PRAGMATIC_TEMPLATE`
- `PERSONALITY_PLACEHOLDER`
- `ModelInfo`
- `ModelMessages`
- `ModelInstructionsVariables`
- `ModelInfo::get_model_instructions`
- `with_config_overrides`
- `model_info_from_slug`
- `local_personality_messages_for_slug`
- `BaseInstructions`
- `Prompt`
- `Prompt::get_formatted_input`
- `SessionConfiguration::base_instructions`
- `Codex::get_base_instructions`
- `build_prompt`
- `build_responses_request`
- `base_instructions`
- `model_messages`
- `instructions_template`
- `{{ personality }}`
- `model_instructions_file`
- `developer_instructions`
- `compact_prompt`
- `include_str!`

Expansion rules:

- Include every `include_str!` target referenced by seeded Rust files.
- Include callers and callees of `get_model_instructions`, `build_prompt`,
  `Prompt::get_formatted_input`, and `build_responses_request`.
- Include config fields that can override, suppress, or move model-facing
  instruction text.
- Include tests and snapshots that assert Responses `instructions`, prompt
  ordering, or model-visible layout.

False positives:

- Do not flag ordinary TUI copy unless it is injected into model input.
- Do not flag model metadata changes unless they affect instruction selection,
  prompt templates, or model-visible behavior.
- Tool schema descriptions belong to tool affordances unless the change also
  moves prompt authority.

### Message Roles

Definition:

How Codex assigns authority and visibility through message roles such as
`system`, `developer`, `user`, and `assistant`, including role-like phases.

Primary seed paths:

- `codex-rs/protocol/src/models.rs`
- `codex-rs/core/src/context/fragment.rs`
- `codex-rs/core/src/context_manager/updates.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/config/src/config_toml.rs`
- `codex-rs/core/src/codex_thread.rs`

Seed symbols and markers:

- `ResponseInputItem::Message`
- `ResponseItem::Message`
- `ContentItem::InputText`
- `ContentItem::OutputText`
- `MessagePhase`
- `ContextualUserFragment::ROLE`
- `ContextualUserFragment::into`
- `build_developer_update_item`
- `build_contextual_user_message`
- `build_text_message`
- `GoalSteeringRole`
- `GoalSteeringRole::as_response_role`
- `parse_user_message`
- `parse_turn_item`
- `handle_assistant_item_done_in_plan_mode`
- `maybe_complete_plan_item_from_message`
- role literals: `system`, `developer`, `user`, `assistant`

Expansion rules:

- Include every `impl ContextualUserFragment` and its `ROLE`.
- Include constructors and mutators of `ResponseItem::Message` and
  `ResponseInputItem::Message`.
- Include match arms and guards over role literals.
- Include config enums and TOML fields that map to response roles.
- Include transcript/event mappers that hide, surface, or reinterpret messages.

False positives:

- Ignore unrelated uses of the word `role` for user identity, auth, CSS, or
  general UI semantics.
- Ignore generic `user` strings unless they appear in role-bearing AST context.
- Assistant rendering is only in scope when it changes parsing, filtering,
  replay, phase, or authority semantics.

### Hidden Context

Definition:

Harness-injected model-visible context that should not behave like ordinary user
text in transcript parsing, replay, rollback, compaction, or UI mapping.

Primary seed paths:

- `codex-rs/core/src/context/fragment.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/context/user_instructions.rs`
- `codex-rs/core/src/context/skill_instructions.rs`
- `codex-rs/core/src/context/user_shell_command.rs`
- `codex-rs/core/src/context/turn_aborted.rs`
- `codex-rs/core/src/context/subagent_notification.rs`
- `codex-rs/core/src/context/permissions_instructions.rs`
- `codex-rs/core/src/context/model_switch_instructions.rs`
- `codex-rs/core/src/context/collaboration_mode_instructions.rs`
- `codex-rs/core/src/context/personality_spec_instructions.rs`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/core/src/agents_md.rs`
- `codex-rs/core/src/context_manager/updates.rs`

Seed symbols and markers:

- `ContextualUserFragment`
- `FragmentRegistration`
- `FragmentRegistrationProxy`
- `CONTEXTUAL_USER_FRAGMENTS`
- `CONTEXTUAL_DEVELOPER_PREFIXES`
- `is_standard_contextual_user_text`
- `is_contextual_user_fragment`
- `parse_visible_hook_prompt_message`
- `is_contextual_user_message_content`
- `is_contextual_dev_message_content`
- `has_non_contextual_dev_message_content`
- `is_contextual_dev_fragment`
- `trim_pre_turn_context_updates`
- `is_user_turn_boundary`
- `# AGENTS.md instructions for `
- `</INSTRUCTIONS>`
- `<skill>`
- `<user_shell_command>`
- `<turn_aborted>`
- `<subagent_notification>`
- `<permissions instructions>`
- `<model_switch>`
- `<collaboration_mode>`
- `<realtime_conversation>`
- `<personality_spec>`
- `<apps_instructions>`
- `<skills_instructions>`
- `<plugins_instructions>`

Expansion rules:

- Include every new `impl ContextualUserFragment`.
- Include additions to `CONTEXTUAL_USER_FRAGMENTS`.
- Include additions to `CONTEXTUAL_DEVELOPER_PREFIXES`.
- Include protocol marker constants and render/parse/compare call sites.
- Include functions that decide whether a message is a real user turn,
  contextual update, rollback-trimmable item, or transcript-visible item.
- Include hook prompt builders and parsers that feed contextual message parsing.

False positives:

- Do not flag arbitrary XML-like tags.
- Do not flag AGENTS discovery alone unless wrapping, injection, scope, ordering,
  or source inclusion changes.
- Hidden UI state is not hidden model context unless it becomes model-visible
  input, `TurnContext`, or persisted/replayed context.

### Continuation Behavior Around `/goal`

Definition:

Runtime behavior that turns a persisted active goal into model work without a
fresh ordinary user message.

Primary seed paths:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/tasks/mod.rs`
- `codex-rs/core/src/tools/registry.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_lifecycle.rs`
- `codex-rs/core/templates/goals/continuation.md`
- `codex-rs/core/templates/goals/budget_limit.md`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/app-server/src/thread_state.rs`
- `codex-rs/config/src/config_toml.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context_manager/history.rs`

Seed symbols and markers:

- `GoalRuntimeEvent`
- `GoalRuntimeState`
- `GoalContinuationCandidate`
- `GoalSteeringKind`
- `GoalSteeringMessage`
- `GoalSteeringRole`
- `goal_runtime_apply`
- `maybe_continue_goal_if_idle_runtime`
- `maybe_start_goal_continuation_turn`
- `goal_continuation_candidate_if_active`
- `mark_initial_goal_steering_pending`
- `goal_steering_kind_for`
- `take_initial_goal_steering`
- `mark_thread_goal_turn_started`
- `finish_thread_goal_turn`
- `handle_thread_goal_task_abort`
- `pause_active_thread_goal_for_interrupt`
- `restore_thread_goal_runtime_after_resume`
- `account_thread_goal_progress`
- `account_thread_goal_before_external_mutation`
- `account_thread_goal_wall_clock_usage`
- `continue_active_goal_if_idle`
- `apply_goal_resume_runtime_effects`
- `prepare_external_goal_mutation`
- `apply_external_goal_set`
- `ThreadGoalStatus::Active`
- `ThreadGoalStatus::Paused`
- `ThreadGoalStatus::BudgetLimited`
- `ThreadGoalStatus::Complete`
- `Begin working toward the active thread goal.`
- `Continue working toward the active thread goal.`
- `When the objective is complete, call update_goal with status "complete".`
- `budget_limited`
- `<untrusted_objective>`
- `has_queued_response_items_for_next_turn`
- `has_trigger_turn_mailbox_items`

Expansion rules:

- Include callers and callees of `goal_runtime_apply`,
  `continue_active_goal_if_idle`, `maybe_start_goal_continuation_turn`, and
  `goal_continuation_candidate_if_active`.
- Include construction, mutation, or matching of goal runtime events, steering
  kinds, steering messages, goal statuses, and accounting modes.
- Include goal-related calls to `start_task`, `push_pending_input`,
  `inject_response_items`, queued-response checks, and mailbox-trigger checks.
- Include goal steering templates and inline prompt text.
- Include app-server resume/listener ordering around goal snapshots, updates,
  and resume responses.
- Include hidden-context filtering for the role selected by goal steering.

False positives:

- Ignore generic English use of `goal`.
- TUI-only display is supporting unless it sends set, resume, pause, clear, or
  continuation actions.
- Tool calls are only in this concern when they affect goal accounting,
  `update_goal`, or continuation gating.
- Compaction/resume is only in this concern when it affects active-goal
  continuation ordering or injected steering.

### `/goal` Behavior Generally

Definition:

The complete user/model/API surface for creating, inspecting, updating, pausing,
resuming, replacing, clearing, validating, storing, and displaying thread goals.

Primary seed paths:

- `codex-rs/core/src/tools/handlers/goal_spec.rs`
- `codex-rs/core/src/tools/handlers/goal.rs`
- `codex-rs/core/src/tools/handlers/goal/create_goal.rs`
- `codex-rs/core/src/tools/handlers/goal/get_goal.rs`
- `codex-rs/core/src/tools/handlers/goal/update_goal.rs`
- `codex-rs/core/src/tools/spec_plan.rs`
- `codex-rs/tools/src/tool_config.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/migrations/0029_thread_goals.sql`
- `codex-rs/tui/src/chatwidget/slash_dispatch.rs`
- `codex-rs/tui/src/app/thread_goal_actions.rs`
- `codex-rs/tui/src/app_server_session.rs`
- `codex-rs/app-server-protocol/src/protocol/v2/thread.rs`
- `codex-rs/app-server-protocol/src/protocol/common.rs`
- `codex-rs/app-server/src/message_processor.rs`
- goal validation, menu, status, and display TUI modules

Seed symbols and markers:

- `GET_GOAL_TOOL_NAME`
- `CREATE_GOAL_TOOL_NAME`
- `UPDATE_GOAL_TOOL_NAME`
- `create_get_goal_tool`
- `create_create_goal_tool`
- `create_update_goal_tool`
- `GetGoalHandler`
- `CreateGoalHandler`
- `UpdateGoalHandler`
- `CreateGoalArgs`
- `UpdateGoalArgs`
- `GoalToolResponse`
- `CompletionBudgetReport`
- `SetGoalRequest`
- `CreateGoalRequest`
- `set_thread_goal`
- `create_thread_goal`
- `get_thread_goal`
- `validate_goal_budget`
- `validate_goal_objective`
- `ThreadGoal`
- `ThreadGoalStatus`
- `ThreadGoalUpdate`
- `ThreadGoalAccountingOutcome`
- `ThreadGoalSetParams`
- `ThreadGoalGetParams`
- `ThreadGoalClearParams`
- `ThreadGoalUpdatedNotification`
- `ThreadGoalClearedNotification`
- `SlashCommand::Goal`
- `ThreadGoalSetMode`
- `/goal`
- `/goal pause`
- `/goal resume`
- `/goal clear`
- `create_goal`
- `get_goal`
- `update_goal`
- `thread/goal/set`
- `thread/goal/get`
- `thread/goal/clear`
- `thread/goal/updated`
- `thread/goal/cleared`
- `active`
- `paused`
- `budget_limited`
- `budgetLimited`
- `complete`

Expansion rules:

- Include goal tool registration, gating, renaming, or wrapping through
  `ToolsConfig`, registry builders, or `ToolHandler`.
- Include app-server RPC methods and protocol types touching `ThreadGoal*`.
- Include conversions between state, protocol, app-server, and TUI goal shapes.
- Include reads and writes to `thread_goals` and related migrations.
- Include goal events, notifications, slash parsing, and menu/action events.
- Include `Feature::Goals`, `goal_tools`, `GoalsConfig`, `GoalsToml`,
  `objective_max_chars`, and `steering_role`.

False positives:

- Generated schema-only diffs are supporting unless they reveal a wire shape
  change without matching source.
- Visual formatting of goal status is low confidence unless it changes commands,
  user actions, or available states.
- Generic tool registry changes are out of scope unless they affect goal tools.

### Context Management And Compaction

Definition:

The code that decides what transcript and history items Codex keeps, normalizes,
drops, summarizes, replaces, re-injects, persists, and reconstructs as
model-visible context across turns.

Primary seed paths:

- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/context_manager/normalize.rs`
- `codex-rs/core/src/context_manager/updates.rs`
- `codex-rs/core/src/context_manager/mod.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/tasks/compact.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/handlers.rs`
- `codex-rs/core/templates/compact/prompt.md`
- `codex-rs/core/templates/compact/summary_prefix.md`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/rollout/src/policy.rs`
- `codex-rs/thread-store/src/types.rs`
- app-server thread read/resume/fork/rollback processors and protocol types

Seed symbols and markers:

- `ContextManager`
- `TotalTokenUsageBreakdown`
- `ContextManager.items`
- `history_version`
- `token_info`
- `reference_context_item`
- `InitialContextInjection`
- `RolloutReconstruction`
- `ActiveReplaySegment`
- `TurnReferenceContextItem`
- `InitialHistory`
- `ResumedHistory`
- `RolloutItem`
- `CompactedItem`
- `TurnContextItem`
- `PreviousTurnSettings`
- `ThreadRolledBackEvent`
- `ResponseItem::Compaction`
- `ResponseItem::ContextCompaction`
- `ContextManager::record_items`
- `ContextManager::for_prompt`
- `ContextManager::normalize_history`
- `ContextManager::replace`
- `ContextManager::drop_last_n_user_turns`
- `ContextManager::trim_pre_turn_context_updates`
- `ContextManager::set_reference_context_item`
- `normalize::ensure_call_outputs_present`
- `build_initial_context`
- `build_settings_update_items`
- `record_context_updates_and_set_reference_context_item`
- `replace_compacted_history`
- `record_initial_history`
- `apply_rollout_reconstruction`
- `reconstruct_history_from_rollout`
- `run_compact_task`
- `run_remote_compact_task`
- `process_compacted_history`
- `should_keep_compacted_history_item`
- `insert_initial_context_before_last_real_user_or_summary`
- `SUMMARIZATION_PROMPT`
- `SUMMARY_PREFIX`
- `replacement_history`
- `ContextCompaction`
- `ThreadRolledBack`
- `TurnContext`

Expansion rules:

- Include callers and callees of `ContextManager` methods that mutate,
  normalize, estimate, or expose prompt history.
- Include functions that call `build_initial_context`,
  `build_settings_update_items`,
  `record_context_updates_and_set_reference_context_item`, or
  `replace_compacted_history`.
- Include compaction trigger paths, phase/reason/trigger selection, and
  `InitialContextInjection` selection.
- Include construction, filtering, or matching of compaction, rollout,
  replacement history, or turn context item types.
- Include replay paths that consume initial history, rollout items, rollback
  events, turn boundaries, or user messages.
- Include persistence policy that affects rollout/history data needed for
  context reconstruction.

False positives:

- Pure UI rendering of resume pickers, transcript cells, or labels is not
  primary unless it changes persisted history or model-visible context.
- Generic thread list/name/archive/status code is out of scope unless it loads,
  mutates, or reconstructs history.
- Goal lifecycle is separate unless the diff also changes replay, compaction, or
  persisted turn context.

### Tool Affordances

Definition:

The code that determines what tools the model can see, how those tools are
named, described, schema-shaped, searched, deferred, routed, hooked, and
serialized back to the model.

Primary seed paths:

- `codex-rs/tools/src/tool_config.rs`
- `codex-rs/tools/src/tool_spec.rs`
- `codex-rs/tools/src/responses_api.rs`
- `codex-rs/tools/src/tool_definition.rs`
- `codex-rs/tools/src/tool_discovery.rs`
- `codex-rs/tools/src/mcp_tool.rs`
- `codex-rs/tools/src/dynamic_tool.rs`
- `codex-rs/core/src/tools/spec.rs`
- `codex-rs/core/src/tools/spec_plan.rs`
- `codex-rs/core/src/tools/registry.rs`
- `codex-rs/core/src/tools/context.rs`
- `codex-rs/core/src/tools/orchestrator.rs`
- `codex-rs/core/src/tools/handlers/**`
- `codex-rs/core/src/mcp_tool_exposure.rs`
- `codex-rs/core/src/mcp_tool_call.rs`
- `codex-rs/codex-mcp/src/connection_manager.rs`
- `codex-rs/codex-mcp/src/tools.rs`
- `codex-rs/protocol/src/dynamic_tools.rs`
- app-server dynamic tool and MCP processors
- pre/post tool hook schemas

Seed symbols and markers:

- `ToolsConfig`
- `ToolsConfigParams`
- `ToolEnvironmentMode`
- `ToolSpec`
- `ConfiguredToolSpec`
- `ResponsesApiTool`
- `ResponsesApiNamespace`
- `LoadableToolSpec`
- `FreeformTool`
- `create_tools_json_for_responses_api`
- `tool_definition_to_responses_api_tool`
- `mcp_tool_to_responses_api_tool`
- `dynamic_tool_to_responses_api_tool`
- `coalesce_loadable_tool_specs`
- `build_tool_registry_builder`
- `ToolRegistryBuilder`
- `register_handler`
- `push_spec`
- `ToolRegistry::dispatch_any`
- `ToolHandler`
- `ToolKind`
- `supports_parallel_tool_calls`
- `is_mutating`
- `pre_tool_use_payload`
- `post_tool_use_payload`
- `ToolInvocation`
- `ToolPayload`
- `ToolOutput`
- `ToolSearchHandler`
- `TOOL_SEARCH_TOOL_NAME`
- `McpHandler`
- `handle_mcp_tool_call`
- `normalize_tools_for_model`
- `DynamicToolSpec`
- `DynamicToolHandler`
- tool names including `exec_command`, `write_stdin`, `shell`, `tool_search`,
  `request_permissions`, `web_search`, `image_generation`, `apply_patch`
- schema fields including `defer_loading`, `parameters`, `output_schema`,
  `strict`, `additionalProperties`

Expansion rules:

- Include every new `impl ToolHandler`.
- Include functions returning tool specs, Responses API tools, loadable specs,
  dynamic specs, or tool definitions.
- Include new handlers imported into `core/src/tools/spec_plan.rs`.
- Include callees of registry construction, deferred tool building, dispatch,
  MCP call handling, and tool normalization.
- Include modules that create, filter, defer, search, or serialize model-visible
  tools.
- Include hook payload builders and parsers that change tool name, aliases,
  input/output shape, blocking, or additional context.

False positives:

- Generic business logic inside a tool is out of scope unless it changes schema,
  output serialization, approval behavior, mutability, hooks, or model-visible
  errors.
- Telemetry-only changes are out of scope unless they change dispatch,
  filtering, MCP metadata, or model-facing result shape.
- Generated schema-only changes are supporting unless wire names or shapes
  changed.

### Permission Defaults

Definition:

The code that determines Codex's starting approval policy, sandbox/permission
profile, network/filesystem posture, escalation path, and model-visible
permission instructions before a tool call happens.

Primary seed paths:

- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/protocol/src/models.rs`
- `codex-rs/protocol/src/permissions.rs`
- `codex-rs/protocol/src/request_permissions.rs`
- `codex-rs/protocol/src/config_types.rs`
- `codex-rs/config/src/config_toml.rs`
- `codex-rs/config/src/permissions_toml.rs`
- `codex-rs/core/src/config/permissions.rs`
- `codex-rs/core/src/config/mod.rs`
- `codex-rs/core/src/context/permissions_instructions.rs`
- `codex-rs/core/src/tools/sandboxing.rs`
- `codex-rs/core/src/tools/orchestrator.rs`
- `codex-rs/sandboxing/src/manager.rs`
- `codex-rs/sandboxing/src/policy_transforms.rs`
- `codex-rs/core/src/context/prompts/permissions/**`
- permission-related CLI and app-server protocol files
- request-permissions tool handlers and tests

Seed symbols and markers:

- `AskForApproval`
- `GranularApprovalConfig`
- `allows_sandbox_approval`
- `allows_request_permissions`
- `allows_mcp_elicitations`
- `SandboxMode`
- `SandboxPolicy`
- `PermissionProfile`
- `ActivePermissionProfile`
- `ActivePermissionProfileModification`
- `SandboxEnforcement`
- `SandboxPermissions`
- `FileSystemSandboxPolicy`
- `NetworkSandboxPolicy`
- `NetworkAccess`
- `BUILT_IN_READ_ONLY_PROFILE`
- `BUILT_IN_WORKSPACE_PROFILE`
- `BUILT_IN_DANGER_NO_SANDBOX_PROFILE`
- `default_builtin_permission_profile_name`
- `builtin_permission_profile`
- `derive_permission_profile`
- `ConfigToml`
- `PermissionsToml`
- `PermissionProfileToml`
- `compile_permission_profile_selection`
- `compile_permission_profile`
- `PermissionsInstructions`
- `PermissionsInstructions::from_permission_profile`
- `sandbox_prompt_from_profile`
- `approval_text`
- `sandbox_text`
- `default_exec_approval_requirement`
- `ExecApprovalRequirement`
- `ToolOrchestrator::run`
- `ToolOrchestrator::request_approval`
- `SandboxOverride`
- `RequestPermissionsArgs`
- `AdditionalPermissionProfile`
- `normalize_additional_permissions`
- `merge_permission_profiles`
- `intersect_permission_profiles`
- `SandboxManager::select_initial`
- `SandboxManager::transform`
- config keys including `approval_policy`, `sandbox_mode`,
  `default_permissions`, `include_permissions_instructions`
- values including `on-request`, `on-failure`, `never`, `read-only`,
  `workspace-write`, `danger-full-access`

Expansion rules:

- Include fields on config, TOML, app-server permission payloads, and protocol
  permission structs.
- Include code that reads, writes, constrains, serializes, deserializes, or
  derives approval policy, sandbox mode, default permissions, or permission
  profile.
- Include conversions between legacy sandbox policy and canonical permission
  profile.
- Include callers and callees of permission profile derivation, builtin profile
  lookup, default exec approval, orchestrator run, and sandbox manager initial
  selection.
- Include grant merging/intersection semantics and request-permissions flows.
- Include permission prompt templates and prompt-generation code.
- Include platform sandbox backend changes reachable from sandbox transforms.

False positives:

- Generic command execution internals are out of scope unless they alter
  approval, sandbox selection, permissions, or model-visible permission
  instructions.
- Pure display/status changes are out of scope unless they alter defaults, user
  choices, or persisted permission state.
- Network proxy internals are out of scope unless they change how permission
  profiles enable or restrict network access.

## Detector Architecture Requirements

### Tracked Concern Map

Add a tracked concern map module or data file under `prompt_reviews`.

The map must define:

- concern slug;
- label;
- behavior definition;
- seed paths;
- seed glob patterns;
- seed symbols;
- seed string markers;
- seed template markers;
- expansion edge types;
- false-positive exclusions;
- fixture expectations.

The map must be human-reviewable. Avoid hiding the real policy in opaque code.

The map must be stable enough that upstream changes can be reviewed as source
diffs. If a future agent changes the map, that change itself is reviewable.

### Rust Extractor

Add a small Rust-aware extractor that emits JSON. It should live outside
`codex-core`.

The extractor must not depend on local `rust-analyzer` installation. It may use
a lighter AST parser first, as long as the output can identify Rust files,
items, impls, enum variants, function names, call-like paths, trait impls,
literal markers, and `include_str!` dependencies.

Extractor output must include:

- source file path;
- node kind;
- stable node key;
- symbol/name when available;
- start/end byte offsets;
- start/end line numbers;
- textual marker when the node is marker-based;
- extracted edges:
  - item contains symbol;
  - function calls path;
  - impl implements trait;
  - registration array contains item;
  - enum variant matched or constructed;
  - macro include targets file;
  - role/string marker appears in relevant AST context.

The extractor should produce deterministic JSON with sorted nodes and edges.

### TypeScript Detector Orchestrator

Add orchestration inside `prompt_reviews`.

Responsibilities:

- call the Rust extractor for Rust source files;
- scan Markdown/templates/SQL/JSON/TS files for seed markers and wire names;
- load tracked concern map;
- build current concern graph from seeds;
- expand graph by configured edge rules;
- compare commit file diffs against graph nodes;
- map changed ranges to `diff_blocks`;
- write detector runs and findings;
- expose debug output for local diagnosis.

### Graph Expansion

Graph expansion must be bounded and explainable.

Every expanded node must record:

- the concern slug;
- the seed or parent node that pulled it in;
- the edge type;
- the detector version;
- the source commit or graph refresh run that discovered it.

Expansion must avoid uncontrolled whole-repo closure. The first implementation
should use explicit allowed edge types per concern area, not all possible call
edges.

### Finding Semantics

A finding means:

> This commit/file/diff block touched a source graph node belonging to a
> monitored concern area.

A finding must record:

- concern slug;
- target scope;
- target id;
- commit id when available;
- commit file id when available;
- diff block id when available;
- file path;
- old/new side when relevant;
- line range;
- symbol or marker;
- matched graph node key;
- evidence kind;
- rationale;
- confidence;
- detector run id;
- timestamps.

Confidence should be deterministic and rule-based:

- high: changed lines overlap a seeded node or directly seeded marker;
- medium: changed lines overlap an expanded graph node;
- low: path-level or generated-schema/supporting evidence without range-level
  overlap.

### Storage

Add SQLite tables for detector state.

Required tables:

- `concern_graph_nodes`
- `concern_graph_edges`
- `detector_runs`
- `detector_findings`

Required behavior:

- findings are tied to detector runs;
- findings can be regenerated for a version;
- graph nodes can be updated by ingestion and post-commit refresh;
- stale generated graph data can be replaced deterministically;
- existing comments, decisions, plans, and classifications are preserved.

Do not overload current `taggings` or `classification_metadata` as detector
storage. Those are review workflow concepts, not the graph itself.

### Version Ingestion Integration

Modify `populate_next_version` so detection runs automatically.

Required sequence:

1. Resolve version range.
2. List commits in order.
3. Insert version, commits, files, and diff blocks.
4. For each commit in order:
   - analyze changed files against graph state before the commit;
   - write findings for touched monitored surfaces;
   - update graph with newly discovered connected nodes from that commit.
5. Return version response with detector summary counts.

The ingestion process must not require a separate remembered command.

### Post-Commit Graph Refresh

Add a local post-commit hook path.

Required behavior:

- after a local commit, update/refresh graph nodes and edges affected by the
  committed files;
- do not create upstream review findings by default;
- avoid rewriting unrelated review data;
- be efficient enough to run routinely;
- provide a documented escape hatch for disabling hook execution if needed.

The hook should be installed or checked by a project script, not by manually
editing `.git/hooks` in an undocumented way.

### Review Surfacing

Expose findings in read models:

- commit queue item summary;
- commit detail;
- file queue item summary;
- file detail;
- diff block view.

Minimum displayed fields:

- concern slugs;
- finding count;
- highest confidence;
- short evidence summaries.

The web UI must make detector findings visible where review happens. It does not
need a full graph explorer in the first implementation, but the reviewer must
see why a file or diff block was flagged.

### MCP Surfacing

Expose detector findings through existing MCP review tools.

At minimum:

- `list_remaining_commits` should expose finding summary per commit when
  present.
- `list_commit_files` should expose finding summary per file when present.
- `get_file_review` should expose full file and diff-block findings.
- A new read-only tool may list findings for a version or commit if that keeps
  existing tool outputs compact.

MCP outputs must make it easy for an agent to review flagged files without
inventing its own search process.

### Relationship To Concern Tags

Concern tags remain human/agent classification concepts.

Detector findings may be used to suggest or pre-populate tag candidates later,
but this implementation must keep detector evidence distinct from taggings.

If any automatic queue pressure is added, it must be traceable to detector
findings and reversible without deleting human review artifacts.

## Required Tests

### Concern Map Tests

- All seed paths either exist or are explicitly marked as future/known-missing.
- All concern slugs are unique.
- Every concern has at least one seed path and one seed symbol or marker.
- False-positive rules are present for every concern.

### Extractor Tests

Use fixture Rust files to prove extraction of:

- functions;
- impls;
- trait impls;
- enum variants;
- calls;
- match arms;
- string markers;
- role literals in message-construction contexts;
- `include_str!` targets;
- registration arrays.

### Text/Template Scan Tests

Use fixture Markdown/templates/SQL/TS files to prove detection of:

- prompt markers;
- tool names;
- RPC method names;
- config keys;
- migration/table names;
- hidden-context tags.

### Diff Mapping Tests

Prove mapping from changed lines to:

- commit file;
- diff block;
- old/new line ranges;
- path-only fallback when no hunk range exists.

### Sequential Ingestion Tests

Create a fixture commit sequence:

- commit A adds a new graph-connected helper or template;
- commit B changes that helper or template;
- detector flags B because A expanded the graph.

### Post-Commit Refresh Tests

Prove that post-commit refresh:

- expands graph nodes for local changes;
- does not create review findings by default;
- is idempotent for the same HEAD;
- leaves unrelated review data untouched.

### Service/API Tests

Prove that:

- `populate_next_version` writes detector runs and findings;
- findings appear in commit/file/diff-block read views;
- existing status, comments, decisions, and plans still behave;
- detector findings do not count as human decisions.

### MCP Tests

Prove that:

- flagged commits and files expose finding summaries;
- `get_file_review` exposes full findings;
- schemas remain stable and contract tests pass.

## Acceptance Criteria

The work is complete only when all of the following are true:

1. A fresh upstream version can be populated and detector findings are created
   automatically without a separate command.
2. Findings identify at least commit, file, concern slug, evidence kind, and
   diff block when hunk mapping is possible.
3. A local post-commit refresh path updates graph state without manual agent
   registration.
4. The concern map includes all eight required areas:
   - harness prompts;
   - message roles;
   - hidden context;
   - continuation behavior around `/goal`;
   - `/goal` behavior generally;
   - context management and compaction;
   - tool affordances;
   - permission defaults.
5. Review APIs and MCP tools surface findings where human/agent review happens.
6. Detector output is distinguishable from comments, classifications, and human
   decisions.
7. The implementation has tests for map validity, extraction, detection,
   diff-block mapping, ingestion integration, post-commit refresh, and read
   surface exposure.
8. The detector can be rerun deterministically for a version.
9. The graph can grow with upstream and local commits without relying on agent
   memory.

## Implementation Batches

The work can be split across agents, but the integrating agent remains
responsible for quality and consistency.

### Batch 1: Concern Map And Schemas

Deliver:

- tracked concern map;
- domain schemas for detector findings and summaries;
- DB tables and migrations;
- repositories for detector runs, graph nodes, graph edges, and findings;
- tests for map validity and schema boundaries.

Quality bar:

- no detector evidence is stored in existing tagging/classification tables;
- migrations are reversible by normal DB recreation;
- all new public shapes have zod schemas.

### Batch 2: Extractor And Scanners

Deliver:

- Rust-aware extractor command or module;
- TypeScript text/template scanners;
- deterministic JSON output;
- fixtures and tests.

Quality bar:

- no dependency on installed rust-analyzer;
- output is sorted and stable;
- extracted line ranges are good enough for diff-block mapping.

### Batch 3: Graph Builder And Detector Engine

Deliver:

- seed graph builder;
- bounded expansion engine;
- commit/file/diff detector;
- diff-block mapping;
- run/finding persistence;
- deterministic rerun behavior.

Quality bar:

- expansion records parent and edge reason;
- commit order matters during version ingestion;
- no uncontrolled whole-repo closure.

### Batch 4: Ingestion And Post-Commit Automation

Deliver:

- `populate_next_version` integration;
- post-commit graph refresh script/hook installation/check path;
- debug rerun command;
- ingestion tests and post-commit refresh tests.

Quality bar:

- no remembered manual command is needed in normal workflows;
- post-commit refresh expands graph only by default;
- upstream ingest creates review findings.

### Batch 5: Review And MCP Surfacing

Deliver:

- read model extensions;
- MCP output extensions or new read-only finding tool;
- web UI finding summaries in commit/file/diff-block review surfaces;
- service/API/MCP tests.

Quality bar:

- findings are visible where review decisions are made;
- output stays compact enough for agents;
- full finding detail is reachable when needed.

## Known Constraints

- Current repo instructions prohibit reading files with `env` in the name unless
  explicitly requested and redacted. The detector implementation must either
  avoid such files by default or add a carefully documented allowlist/redaction
  path.
- `rust-analyzer` is not a dependable installed tool in this checkout. The first
  extractor must not require it.
- `codex-core` should not absorb this functionality. Keep detector-specific code
  in `prompt_reviews`, a dedicated tool, or another appropriately scoped crate.
- Generated TypeScript/JSON schema diffs should be treated as supporting
  evidence unless source wire shape changes are also present.

## Out Of Scope For The First Complete Implementation

These are not required for the first complete implementation:

- machine-learning classification;
- agent-authored explanations as the primary detector mechanism;
- automatic human decision finalization;
- full interactive graph explorer UI;
- perfect Rust semantic resolution across the entire workspace;
- remote service integration.

These exclusions do not shrink the core requirement. The core requirement is
still automatic graph-backed detection and surfacing for the full concern map.
