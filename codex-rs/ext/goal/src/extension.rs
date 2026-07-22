use std::sync::Arc;
use std::sync::Weak;

use async_trait::async_trait;
use codex_core::ThreadManager;
use codex_core::context::GoalContextRole;
use codex_extension_api::ConfigContributor;
use codex_extension_api::ExtensionData;
use codex_extension_api::ExtensionEventSink;
use codex_extension_api::ExtensionRegistryBuilder;
use codex_extension_api::ThreadLifecycleContributor;
use codex_extension_api::ThreadResumeInput;
use codex_extension_api::ThreadStartInput;
use codex_extension_api::TokenUsageContributor;
use codex_extension_api::ToolCallOutcome;
use codex_extension_api::ToolContributor;
use codex_extension_api::ToolFinishInput;
use codex_extension_api::ToolLifecycleContributor;
use codex_extension_api::ToolLifecycleFuture;
use codex_extension_api::TurnAbortInput;
use codex_extension_api::TurnErrorInput;
use codex_extension_api::TurnLifecycleContributor;
use codex_extension_api::TurnStartInput;
use codex_extension_api::TurnStopInput;
use codex_otel::MetricsClient;
use codex_protocol::ThreadId;
use codex_protocol::protocol::CodexErrorInfo;
use codex_protocol::protocol::SessionSource;
use codex_protocol::protocol::SubAgentSource;
use codex_protocol::protocol::ThreadGoalStatus;
use codex_protocol::protocol::TokenUsageInfo;
use codex_protocol::protocol::TurnAbortReason;

use crate::accounting::BudgetLimitedGoalDisposition;
use crate::accounting::GoalAccountingState;
use crate::events::GoalEventEmitter;
use crate::metrics::GoalMetrics;
use crate::runtime::GoalRuntimeConfig;
use crate::runtime::GoalRuntimeHandle;
use crate::spec::UPDATE_GOAL_TOOL_NAME;
use crate::steering::GoalSteeringKind;
use crate::tool::GoalToolExecutor;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct GoalExtensionConfig {
    pub enabled: bool,
    pub steering_role: GoalContextRole,
}

impl GoalExtensionConfig {
    fn from_parts(enabled: bool, steering_role: GoalContextRole) -> Self {
        Self {
            enabled,
            steering_role,
        }
    }
}

#[derive(Clone)]
pub struct GoalExtension<C> {
    state_dbs: Arc<codex_state::StateRuntime>,
    event_emitter: GoalEventEmitter,
    metrics: GoalMetrics,
    thread_manager: Weak<ThreadManager>,
    goals_enabled: Arc<dyn Fn(&C) -> bool + Send + Sync>,
    goal_steering_role: Arc<dyn Fn(&C) -> GoalContextRole + Send + Sync>,
}

impl<C> std::fmt::Debug for GoalExtension<C> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("GoalExtension").finish_non_exhaustive()
    }
}

impl<C> GoalExtension<C> {
    pub(crate) fn new_with_host_capabilities(
        state_dbs: Arc<codex_state::StateRuntime>,
        event_sink: Arc<dyn ExtensionEventSink>,
        metrics_client: Option<MetricsClient>,
        thread_manager: Weak<ThreadManager>,
        goals_enabled: impl Fn(&C) -> bool + Send + Sync + 'static,
        goal_steering_role: impl Fn(&C) -> GoalContextRole + Send + Sync + 'static,
    ) -> Self {
        Self {
            state_dbs,
            event_emitter: GoalEventEmitter::new(event_sink),
            metrics: GoalMetrics::new(metrics_client),
            thread_manager,
            goals_enabled: Arc::new(goals_enabled),
            goal_steering_role: Arc::new(goal_steering_role),
        }
    }
}

#[async_trait]
impl<C> ThreadLifecycleContributor<C> for GoalExtension<C>
where
    C: Send + Sync + 'static,
{
    async fn on_thread_start(&self, input: ThreadStartInput<'_, C>) {
        let enabled = (self.goals_enabled)(input.config);
// REVIEW-DEDELUGER: preserved maintained content; incoming upstream difference follows.
// REVIEW-DEDELUGER-INCOMING-DIFF path=codex-rs/ext/goal/src/extension.rs block=2
// @@ -1,1 +1,5 @@
// -        let steering_role = (self.goal_steering_role)(input.config);
// +        let tools_available_for_thread = input.persistent_thread_state_available
// +            && !matches!(
// +                input.session_source,
// +                SessionSource::SubAgent(SubAgentSource::Review)
// +            );
// REVIEW-DEDELUGER-END-INCOMING-DIFF

        let steering_role = (self.goal_steering_role)(input.config);
        input
            .thread_store
            .insert(GoalExtensionConfig::from_parts(enabled, steering_role));
        let accounting_state = input
            .thread_store
            .get_or_init::<GoalAccountingState>(GoalAccountingState::default);
        let Ok(thread_id) = ThreadId::from_string(input.thread_store.level_id()) else {
            return;
        };
        let runtime = input.thread_store.get_or_init::<GoalRuntimeHandle>(|| {
            GoalRuntimeHandle::new(
                thread_id,
                Arc::clone(&self.state_dbs),
                self.event_emitter.clone(),
                self.metrics.clone(),
                self.thread_manager.clone(),
                accounting_state,
                GoalRuntimeConfig {
                    enabled,
                    tools_available_for_thread,
                },
            )
        });
        runtime.set_enabled(enabled);
    }

    async fn on_thread_resume(&self, input: ThreadResumeInput<'_>) {
        let Some(runtime) = goal_runtime_handle(input.thread_store) else {
            return;
        };

        if let Err(err) = runtime.restore_after_resume().await {
            tracing::warn!(
                "failed to restore goal runtime after thread resume for {}: {err}",
                runtime.thread_id()
            );
        }
    }
}

impl<C> ConfigContributor<C> for GoalExtension<C>
where
    C: Send + Sync + 'static,
{
    fn on_config_changed(
        &self,
        _session_store: &ExtensionData,
        thread_store: &ExtensionData,
        _previous_config: &C,
        new_config: &C,
    ) {
        let enabled = (self.goals_enabled)(new_config);
        let steering_role = (self.goal_steering_role)(new_config);
        thread_store.insert(GoalExtensionConfig::from_parts(enabled, steering_role));
        if let Some(runtime) = goal_runtime_handle(thread_store) {
            runtime.set_enabled(enabled);
        }
    }
}

#[async_trait]
impl<C> TurnLifecycleContributor for GoalExtension<C>
where
    C: Send + Sync + 'static,
{
    async fn on_turn_start(&self, input: TurnStartInput<'_>) {
        let Some(runtime) = goal_runtime_handle(input.thread_store) else {
            return;
        };
        if !runtime.is_enabled() {
            return;
        }

        let accounting = runtime.accounting_state();
        accounting.start_turn(
            input.turn_id,
            input.collaboration_mode.mode,
            input.token_usage_at_turn_start,
        );
        if matches!(
            input.collaboration_mode.mode,
            codex_protocol::config_types::ModeKind::Plan
        ) {
            accounting.clear_current_turn_goal();
            return;
        }
        let Ok(goal) = self
            .state_dbs
            .thread_goals()
            .get_thread_goal(runtime.thread_id())
            .await
        else {
            return;
        };
        if let Some(goal) = goal
            && matches!(
                goal.status,
                codex_state::ThreadGoalStatus::Active
                    | codex_state::ThreadGoalStatus::BudgetLimited
            )
        {
            accounting.mark_turn_goal_active(input.turn_id, goal.goal_id);
        }
    }

    async fn on_turn_stop(&self, input: TurnStopInput<'_>) {
        let Some(runtime) = goal_runtime_handle(input.thread_store) else {
            return;
        };
        if !runtime.is_enabled() {
            return;
        }

        let turn_id = input.turn_store.level_id();
        if let Err(err) = runtime
            .account_active_goal_progress(
                turn_id,
                &format!("{turn_id}:turn-stop"),
                codex_state::GoalAccountingMode::ActiveOnly,
                BudgetLimitedGoalDisposition::ClearActive,
            )
            .await
        {
            tracing::warn!(
                "failed to account active goal progress at turn stop for {turn_id}: {err}"
            );
            return;
        }
        runtime.accounting_state().finish_turn(turn_id);
    }

    async fn on_turn_abort(&self, input: TurnAbortInput<'_>) {
        let Some(runtime) = goal_runtime_handle(input.thread_store) else {
            return;
        };
        if !runtime.is_enabled() {
            return;
        }

        let turn_id = input.turn_store.level_id();
        if let Err(err) = runtime
            .account_active_goal_progress(
                turn_id,
                &format!("{turn_id}:turn-abort"),
                codex_state::GoalAccountingMode::ActiveOnly,
                BudgetLimitedGoalDisposition::ClearActive,
            )
            .await
        {
            tracing::warn!(
                "failed to account active goal progress after turn abort for {turn_id}: {err}"
            );
            return;
        }
        // REVIEW-DEDELUGER: incoming upstream would replace this preserved local shape; preserved maintained local block below.
        // REVIEW-DEDELUGER-INCOMING-DIFF path=codex-rs/ext/goal/src/extension.rs block=2 basis=maintained-to-incoming
        // @@ -1,12 +1,1 @@
        // -        match input.reason {
        // -            TurnAbortReason::Interrupted => {
        // -                // Generic interrupts are turn control, not goal lifecycle
        // -                // control. A host-backed extension should account and clear
        // -                // runtime turn state here without mutating goal status; explicit
        // -                // user/client pause actions own Paused transitions.
        // -            }
        // -            TurnAbortReason::Replaced
        // -            | TurnAbortReason::ReviewEnded
        // -            | TurnAbortReason::BudgetLimited => {}
        // -        }
        // -        accounting_state(input.thread_store).finish_turn(turn_id);
        // +        runtime.accounting_state().finish_turn(turn_id);
        // REVIEW-DEDELUGER-END-INCOMING-DIFF

        match input.reason {
            TurnAbortReason::Interrupted => {
                // Generic interrupts are turn control, not goal lifecycle
                // control. A host-backed extension should account and clear
                // runtime turn state here without mutating goal status; explicit
                // user/client pause actions own Paused transitions.
            }
            TurnAbortReason::Replaced
            | TurnAbortReason::ReviewEnded
            | TurnAbortReason::BudgetLimited => {}
        }
        runtime.accounting_state().finish_turn(turn_id);
    }

    async fn on_turn_error(&self, input: TurnErrorInput<'_>) {
        if input.error != CodexErrorInfo::UsageLimitExceeded {
            return;
        }
        let Some(runtime) = goal_runtime_handle(input.thread_store) else {
            return;
        };

        if let Err(err) = runtime
            .usage_limit_active_goal_for_turn(input.turn_id)
            .await
        {
            tracing::warn!("failed to usage-limit active goal after usage-limit error: {err}");
        }
    }
}

#[async_trait]
impl<C> TokenUsageContributor for GoalExtension<C>
where
    C: Send + Sync + 'static,
{
    async fn on_token_usage(
        &self,
        _session_store: &ExtensionData,
        thread_store: &ExtensionData,
        turn_store: &ExtensionData,
        token_usage: &TokenUsageInfo,
    ) {
        let Some(runtime) = goal_runtime_handle(thread_store) else {
            return;
        };
        if !runtime.is_enabled() {
            return;
        }

        let Some(_recorded) = runtime
            .accounting_state()
            .record_token_usage(turn_store.level_id(), &token_usage.total_token_usage)
        else {
            return;
        };
    }
}

impl<C> ToolLifecycleContributor for GoalExtension<C>
where
    C: Send + Sync + 'static,
{
    fn on_tool_finish<'a>(&'a self, input: ToolFinishInput<'a>) -> ToolLifecycleFuture<'a> {
        Box::pin(async move {
            let Some(config) = input.thread_store.get::<GoalExtensionConfig>() else {
                return;
            };
            let Some(runtime) = goal_runtime_handle(input.thread_store) else {
                return;
            };
            let should_count_for_goal_progress = config.enabled
                && runtime.is_enabled()
                && tool_attempt_counts_for_goal_progress(input.outcome)
                && !(input.tool_name.namespace.is_none()
                    && input.tool_name.name == UPDATE_GOAL_TOOL_NAME);
            if !should_count_for_goal_progress {
                return;
            }
            let turn_id = input.turn_id;
            let progress = match runtime
                .account_active_goal_progress(
                    turn_id,
                    input.call_id,
                    codex_state::GoalAccountingMode::ActiveOnly,
                    BudgetLimitedGoalDisposition::KeepActive,
                )
                .await
            {
                Ok(Some(progress)) => progress,
                Ok(None) => return,
                Err(err) => {
                    tracing::warn!(
                        "failed to account active goal progress after tool finish for {turn_id}: {err}"
                    );
                    return;
                }
            };
            let goal = progress.goal;
            if goal.status != ThreadGoalStatus::BudgetLimited {
                return;
            }
            if !runtime
                .accounting_state()
                .mark_budget_limit_reported_if_new(progress.goal_id.as_str())
            {
                return;
            }
            let _ = runtime
                .inject_active_turn_goal_steering(
                    GoalSteeringKind::BudgetLimit,
                    &goal,
                    config.steering_role,
                )
                .await;
        })
    }
}

// REVIEW-DEDELUGER: incoming upstream would delete this preserved local shape; preserved maintained local block below.
// REVIEW-DEDELUGER-INCOMING-DIFF path=codex-rs/ext/goal/src/extension.rs block=4 basis=maintained-to-incoming
// @@ -1,13 +0,0 @@
// -// TODO: app-server initiated goal set/clear operations need a contributor or
// -// backend callback here. They currently happen outside thread/turn/token
// -// lifecycle, but the goal extension must observe them to account before
// -// mutation, refresh active-goal accounting, request ObjectiveUpdated steering
// -// through the typed host steering path, emit ordered events, and clear runtime
// -// state when a goal is removed.
// -//
// -// TODO: when goal ownership moves here, add a typed steering request API for
// -// Initial, Continuation, BudgetLimit, and ObjectiveUpdated. The host/runtime
// -// should remain the boundary that applies configured GoalSteeringRole,
// -// role-neutral <goal_context> wrapping, <untrusted_objective> escaping,
// -// injection timing, and hidden-context classification.
// -
// REVIEW-DEDELUGER-END-INCOMING-DIFF

// TODO: app-server initiated goal set/clear operations need a contributor or
// backend callback here. They currently happen outside thread/turn/token
// lifecycle, but the goal extension must observe them to account before
// mutation, refresh active-goal accounting, request ObjectiveUpdated steering
// through the typed host steering path, emit ordered events, and clear runtime
// state when a goal is removed.
//
// TODO: when goal ownership moves here, add a typed steering request API for
// Initial, Continuation, BudgetLimit, and ObjectiveUpdated. The host/runtime
// should remain the boundary that applies configured GoalSteeringRole,
// role-neutral <goal_context> wrapping, <untrusted_objective> escaping,
// injection timing, and hidden-context classification.

impl<C> ToolContributor for GoalExtension<C>
where
    C: Send + Sync + 'static,
{
    fn tools(
        &self,
        _session_store: &ExtensionData,
        thread_store: &ExtensionData,
    ) -> Vec<Arc<dyn codex_extension_api::ToolExecutor<codex_extension_api::ToolCall>>> {
        let Some(runtime) = goal_runtime_handle(thread_store) else {
            return Vec::new();
        };
        if !runtime.tools_visible() {
            return Vec::new();
        }

        vec![
            Arc::new(GoalToolExecutor::get(
                runtime.thread_id(),
                Arc::clone(&self.state_dbs),
                runtime.accounting_state(),
                self.event_emitter.clone(),
                self.metrics.clone(),
            )),
            Arc::new(GoalToolExecutor::create(
                runtime.thread_id(),
                Arc::clone(&self.state_dbs),
                runtime.accounting_state(),
                self.event_emitter.clone(),
                self.metrics.clone(),
            )),
            Arc::new(GoalToolExecutor::update(
                runtime.thread_id(),
                Arc::clone(&self.state_dbs),
                runtime.accounting_state(),
                self.event_emitter.clone(),
                self.metrics.clone(),
            )),
        ]
    }
}

pub fn install_with_backend<C>(
    registry: &mut ExtensionRegistryBuilder<C>,
    state_dbs: Arc<codex_state::StateRuntime>,
    metrics_client: Option<MetricsClient>,
    thread_manager: Weak<ThreadManager>,
    goals_enabled: impl Fn(&C) -> bool + Send + Sync + 'static,
    goal_steering_role: impl Fn(&C) -> GoalContextRole + Send + Sync + 'static,
) where
    C: Send + Sync + 'static,
{
    let extension = Arc::new(GoalExtension::new_with_host_capabilities(
        state_dbs,
        registry.event_sink(),
        metrics_client,
        thread_manager,
        goals_enabled,
        goal_steering_role,
    ));
    registry.thread_lifecycle_contributor(extension.clone());
    registry.config_contributor(extension.clone());
    registry.turn_lifecycle_contributor(extension.clone());
    registry.token_usage_contributor(extension.clone());
    registry.tool_lifecycle_contributor(extension.clone());
    registry.tool_contributor(extension);
}

fn goal_runtime_handle(thread_store: &ExtensionData) -> Option<Arc<GoalRuntimeHandle>> {
    thread_store.get::<GoalRuntimeHandle>()
}

fn tool_attempt_counts_for_goal_progress(outcome: ToolCallOutcome) -> bool {
    match outcome {
        ToolCallOutcome::Completed { .. } => true,
        ToolCallOutcome::Failed {
            handler_executed: true,
        } => true,
        ToolCallOutcome::Blocked
        | ToolCallOutcome::Failed {
            handler_executed: false,
        }
        | ToolCallOutcome::Aborted => false,
    }
}
