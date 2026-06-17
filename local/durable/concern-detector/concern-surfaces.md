# Concern Surfaces

The concern detector watches source graph surfaces that can materially alter
Cullen's Codex working cadence. A surface can be a path, symbol, marker,
template, enum, config field, wire type, registration edge, call edge, test, or
snapshot.

## Harness Prompts

Model-facing instruction sources and the code path that selects, templates,
overrides, and sends those instructions to the model as Responses
`instructions` or prompt input.

Seed paths:

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

Expansion cues:

- `include_str!` targets referenced by seeded Rust files
- callers and callees of `get_model_instructions`, `build_prompt`,
  `Prompt::get_formatted_input`, and `build_responses_request`
- config fields that can override, suppress, or move model-facing instruction
  text
- tests and snapshots that assert Responses `instructions`, prompt ordering, or
  model-visible layout

False-positive exclusions:

- ordinary TUI copy unless injected into model input
- model metadata changes unless they affect instruction selection, prompt
  templates, or model-visible behavior
- tool schema descriptions unless the change also moves prompt authority

## Message Roles

How Codex assigns authority and visibility through roles such as `system`,
`developer`, `user`, and `assistant`, including role-like phases.

Seed paths:

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

Expansion cues:

- every `impl ContextualUserFragment` and its `ROLE`
- constructors and mutators of `ResponseItem::Message` and
  `ResponseInputItem::Message`
- match arms and guards over role literals
- config enums and TOML fields that map to response roles
- transcript/event mappers that hide, surface, or reinterpret messages

False-positive exclusions:

- unrelated uses of `role` for user identity, auth, CSS, or general UI
  semantics
- generic `user` strings outside role-bearing AST context
- assistant rendering unless it changes parsing, filtering, replay, phase, or
  authority semantics

## Hidden Context

Harness-injected model-visible context that should not behave like ordinary user
text in transcript parsing, replay, rollback, compaction, or UI mapping.

Seed paths:

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

Expansion cues:

- every new `impl ContextualUserFragment`
- additions to `CONTEXTUAL_USER_FRAGMENTS`
- additions to `CONTEXTUAL_DEVELOPER_PREFIXES`
- protocol marker constants and render/parse/compare call sites
- functions that decide whether a message is a real user turn, contextual
  update, rollback-trimmable item, or transcript-visible item
- hook prompt builders and parsers that feed contextual message parsing

False-positive exclusions:

- arbitrary XML-like tags
- AGENTS discovery alone unless wrapping, injection, scope, ordering, or source
  inclusion changes
- hidden UI state unless it becomes model-visible input, `TurnContext`, or
  persisted/replayed context

## Goal Continuation

Runtime behavior that turns a persisted active goal into model work without a
fresh ordinary user message.

Seed paths:

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

Expansion cues:

- callers and callees of `goal_runtime_apply`,
  `continue_active_goal_if_idle`, `maybe_start_goal_continuation_turn`, and
  `goal_continuation_candidate_if_active`
- construction, mutation, or matching of goal runtime events, steering kinds,
  steering messages, goal statuses, and accounting modes
- goal-related calls to `start_task`, `push_pending_input`,
  `inject_response_items`, queued-response checks, and mailbox-trigger checks
- goal steering templates and inline prompt text
- app-server resume/listener ordering around goal snapshots, updates, and
  resume responses
- hidden-context filtering for the role selected by goal steering

False-positive exclusions:

- generic English use of `goal`
- TUI-only display unless it sends set, resume, pause, clear, or continuation
  actions
- tool calls unless they affect goal accounting, `update_goal`, or continuation
  gating
- compaction/resume unless it affects active-goal continuation ordering or
  injected steering

## Goal Behavior

The complete user, model, and API surface for creating, inspecting, updating,
pausing, resuming, replacing, clearing, validating, storing, and displaying
thread goals.

Seed paths:

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

Expansion cues:

- goal tool registration, gating, renaming, or wrapping through `ToolsConfig`,
  registry builders, or `ToolHandler`
- app-server RPC methods and protocol types touching `ThreadGoal*`
- conversions between state, protocol, app-server, and TUI goal shapes
- reads and writes to `thread_goals` and related migrations
- goal events, notifications, slash parsing, and menu/action events
- `Feature::Goals`, `goal_tools`, `GoalsConfig`, `GoalsToml`,
  `objective_max_chars`, and `steering_role`

False-positive exclusions:

- generated schema-only diffs unless they reveal a wire shape change without
  matching source
- visual formatting of goal status unless it changes commands, user actions, or
  available states
- generic tool registry changes unless they affect goal tools

## Context Management And Compaction

Code that decides what transcript and history items Codex keeps, normalizes,
drops, summarizes, replaces, re-injects, persists, and reconstructs as
model-visible context across turns.

Seed paths:

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

Expansion cues:

- callers and callees of `ContextManager` methods that mutate, normalize,
  estimate, or expose prompt history
- functions that call `build_initial_context`, `build_settings_update_items`,
  `record_context_updates_and_set_reference_context_item`, or
  `replace_compacted_history`
- compaction trigger paths, phase/reason/trigger selection, and
  `InitialContextInjection` selection
- construction, filtering, or matching of compaction, rollout, replacement
  history, or turn context item types
- replay paths that consume initial history, rollout items, rollback events,
  turn boundaries, or user messages
- persistence policy that affects rollout/history data needed for context
  reconstruction

False-positive exclusions:

- pure UI rendering of resume pickers, transcript cells, or labels unless it
  changes persisted history or model-visible context
- generic thread list, name, archive, or status code unless it loads, mutates,
  or reconstructs history
- goal lifecycle unless the diff also changes replay, compaction, or persisted
  turn context

## Tool Affordances

Code that determines what tools the model can see, how those tools are named,
described, schema-shaped, searched, deferred, routed, hooked, and serialized
back to the model.

Seed paths:

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

Expansion cues:

- every new `impl ToolHandler`
- functions returning tool specs, Responses API tools, loadable specs, dynamic
  specs, or tool definitions
- new handlers imported into `core/src/tools/spec_plan.rs`
- callees of registry construction, deferred tool building, dispatch, MCP call
  handling, and tool normalization
- modules that create, filter, defer, search, or serialize model-visible tools
- hook payload builders and parsers that change tool name, aliases,
  input/output shape, blocking, or additional context

False-positive exclusions:

- generic business logic inside a tool unless it changes schema, output
  serialization, approval behavior, mutability, hooks, or model-visible errors
- telemetry-only changes unless they change dispatch, filtering, MCP metadata,
  or model-facing result shape
- generated schema-only changes unless wire names or shapes changed

## Permission Defaults

Code that determines Codex's starting approval policy, sandbox/permission
profile, network/filesystem posture, escalation path, and model-visible
permission instructions before a tool call happens.

Seed paths:

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

Expansion cues:

- fields on config, TOML, app-server permission payloads, and protocol
  permission structs
- code that reads, writes, constrains, serializes, deserializes, or derives
  approval policy, sandbox mode, default permissions, or permission profile
- conversions between legacy sandbox policy and canonical permission profile
- callers and callees of permission profile derivation, builtin profile lookup,
  default exec approval, orchestrator run, and sandbox manager initial selection
- grant merging/intersection semantics and request-permissions flows
- permission prompt templates and prompt-generation code
- platform sandbox backend changes reachable from sandbox transforms

False-positive exclusions:

- generic command execution internals unless they alter approval, sandbox
  selection, permissions, or model-visible permission instructions
- pure display/status changes unless they alter defaults, user choices, or
  persisted permission state
- network proxy internals unless they change how permission profiles enable or
  restrict network access
