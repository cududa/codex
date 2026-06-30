use std::sync::Arc;

use async_trait::async_trait;
use codex_extension_api::ConfigContributor;
use codex_extension_api::ExtensionData;
use codex_extension_api::ExtensionEventSink;
use codex_extension_api::ExtensionRegistryBuilder;
use codex_extension_api::NoopExtensionEventSink;
use codex_extension_api::ThreadLifecycleContributor;
use codex_extension_api::ThreadStartInput;
use codex_extension_api::TokenUsageContributor;
use codex_extension_api::ToolContributor;
use codex_extension_api::TurnAbortInput;
use codex_extension_api::TurnLifecycleContributor;
use codex_extension_api::TurnStartInput;
use codex_extension_api::TurnStopInput;
use codex_protocol::ThreadId;
use codex_protocol::protocol::ThreadGoal;
use codex_protocol::protocol::ThreadGoalStatus;
use codex_protocol::protocol::TokenUsageInfo;
use codex_protocol::protocol::TurnAbortReason;

use crate::accounting::GoalAccountingState;
use crate::events::GoalEventEmitter;
use crate::tool::CreateGoalRequest;
use crate::tool::GoalToolExecutor;

#[derive(Clone, Debug)]
pub struct GoalExtensionConfig {
    pub enabled: bool,
}

impl GoalExtensionConfig {
    fn from_enabled(enabled: bool) -> Self {
        Self { enabled }
    }
}

#[derive(Clone)]
pub struct GoalExtension<C> {
    backend: Arc<dyn GoalToolBackend>,
    event_emitter: GoalEventEmitter,
    goals_enabled: Arc<dyn Fn(&C) -> bool + Send + Sync>,
}

impl<C> std::fmt::Debug for GoalExtension<C> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("GoalExtension").finish_non_exhaustive()
    }
}

impl<C> GoalExtension<C> {
    pub fn new(
        backend: Arc<dyn GoalToolBackend>,
        goals_enabled: impl Fn(&C) -> bool + Send + Sync + 'static,
    ) -> Self {
        Self::new_with_event_sink(backend, Arc::new(NoopExtensionEventSink), goals_enabled)
    }

    pub fn new_with_event_sink(
        backend: Arc<dyn GoalToolBackend>,
        event_sink: Arc<dyn ExtensionEventSink>,
        goals_enabled: impl Fn(&C) -> bool + Send + Sync + 'static,
    ) -> Self {
        Self {
            backend,
            event_emitter: GoalEventEmitter::new(event_sink),
            goals_enabled: Arc::new(goals_enabled),
        }
    }

    pub fn without_backend(goals_enabled: impl Fn(&C) -> bool + Send + Sync + 'static) -> Self {
        Self::new(Arc::new(NoGoalToolBackend), goals_enabled)
    }
}

/// Host service used by extension goal tools.
///
/// Implementations are expected to mutate the same durable goal state and emit
/// the same runtime side effects as the live core goal tools. Until this API can
/// express the full accepted status/accounting/steering contract, extension
/// tools must not become a divergent model-visible goal authority.
#[async_trait]
pub trait GoalToolBackend: Send + Sync {
    async fn get_goal(&self, thread_id: ThreadId) -> Result<Option<ThreadGoal>, String>;

    async fn create_goal(
        &self,
        thread_id: ThreadId,
        request: CreateGoalRequest,
    ) -> Result<ThreadGoal, String>;

    async fn set_goal_status(
        &self,
        thread_id: ThreadId,
        status: ThreadGoalStatus,
    ) -> Result<ThreadGoal, String>;
}

#[derive(Clone, Copy, Debug, Default)]
pub struct NoGoalToolBackend;

#[async_trait]
impl GoalToolBackend for NoGoalToolBackend {
    async fn get_goal(&self, _thread_id: ThreadId) -> Result<Option<ThreadGoal>, String> {
        Err(missing_backend_message())
    }

    async fn create_goal(
        &self,
        _thread_id: ThreadId,
        _request: CreateGoalRequest,
    ) -> Result<ThreadGoal, String> {
        Err(missing_backend_message())
    }

    async fn set_goal_status(
        &self,
        _thread_id: ThreadId,
        _status: ThreadGoalStatus,
    ) -> Result<ThreadGoal, String> {
        Err(missing_backend_message())
    }
}

fn missing_backend_message() -> String {
    // TODO: replace this fallback with a host-provided goal backend once the
    // backend can delegate to the host goal service for durable GoalStore
    // persistence, final active-turn accounting, terminal metrics, ordered
    // ThreadGoalUpdated events, and typed steering requests.
    "goal tools are not connected to host goal persistence yet".to_string()
}

#[async_trait]
impl<C> ThreadLifecycleContributor<C> for GoalExtension<C>
where
    C: Send + Sync + 'static,
{
    async fn on_thread_start(&self, input: ThreadStartInput<'_, C>) {
        input
            .thread_store
            .insert(GoalExtensionConfig::from_enabled((self.goals_enabled)(
                input.config,
            )));
        input
            .thread_store
            .get_or_init::<GoalAccountingState>(GoalAccountingState::default);
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
        thread_store.insert(GoalExtensionConfig::from_enabled((self.goals_enabled)(
            new_config,
        )));
    }
}

#[async_trait]
impl<C> TurnLifecycleContributor for GoalExtension<C>
where
    C: Send + Sync + 'static,
{
    async fn on_turn_start(&self, input: TurnStartInput<'_>) {
        if !goal_enabled(input.thread_store) {
            return;
        }

        // TODO: TurnStartInput should expose collaboration mode and token usage
        // at turn start. Goals need mode to suppress plan-mode accounting and
        // the token baseline to account deltas exactly.
        accounting_state(input.thread_store).start_turn(input.turn_store.level_id());
    }

    async fn on_turn_stop(&self, input: TurnStopInput<'_>) {
        if !goal_enabled(input.thread_store) {
            return;
        }

        // TODO: this should flush wall-clock and any unflushed token usage to
        // persisted host GoalStore accounting, apply budget-limit status
        // transitions, emit ThreadGoalUpdated after mutation, and request
        // budget-limit steering through a typed host steering capability.
        // TODO: the host also needs an idle/next-turn wake capability so an
        // active goal can enqueue continuation context after the turn is fully
        // cleared, only when there is no pending user or mailbox work.
        accounting_state(input.thread_store).stop_turn(input.turn_store.level_id());
    }

    async fn on_turn_abort(&self, input: TurnAbortInput<'_>) {
        if !goal_enabled(input.thread_store) {
            return;
        }

        accounting_state(input.thread_store).stop_turn(input.turn_store.level_id());
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
        if !goal_enabled(thread_store) {
            return;
        }

        let Some(_recorded) = accounting_state(thread_store)
            .record_token_usage(turn_store.level_id(), &token_usage.last_token_usage)
        else {
            return;
        };

        // TODO: TokenUsageContributor needs a host goal storage capability so
        // this recorded delta can be committed to active persisted GoalStore
        // accounting. It also needs event and typed steering capabilities to
        // emit ThreadGoalUpdated and request budget-limit steering when
        // accounting changes goal status.
    }
}

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
        if !goal_enabled(thread_store) {
            return Vec::new();
        }

        let Ok(thread_id) = ThreadId::from_string(thread_store.level_id()) else {
            return Vec::new();
        };
        vec![
            Arc::new(GoalToolExecutor::get(
                thread_id,
                Arc::clone(&self.backend),
                self.event_emitter.clone(),
            )),
            Arc::new(GoalToolExecutor::create(
                thread_id,
                Arc::clone(&self.backend),
                self.event_emitter.clone(),
            )),
            Arc::new(GoalToolExecutor::update(
                thread_id,
                Arc::clone(&self.backend),
                self.event_emitter.clone(),
            )),
        ]
    }
}

pub fn install<C>(
    registry: &mut ExtensionRegistryBuilder<C>,
    goals_enabled: impl Fn(&C) -> bool + Send + Sync + 'static,
) where
    C: Send + Sync + 'static,
{
    install_with_backend(registry, Arc::new(NoGoalToolBackend), goals_enabled);
}

pub fn install_with_backend<C>(
    registry: &mut ExtensionRegistryBuilder<C>,
    backend: Arc<dyn GoalToolBackend>,
    goals_enabled: impl Fn(&C) -> bool + Send + Sync + 'static,
) where
    C: Send + Sync + 'static,
{
    let extension = Arc::new(GoalExtension::new_with_event_sink(
        backend,
        registry.event_sink(),
        goals_enabled,
    ));
    registry.thread_lifecycle_contributor(extension.clone());
    registry.config_contributor(extension.clone());
    registry.turn_lifecycle_contributor(extension.clone());
    registry.token_usage_contributor(extension.clone());
    registry.tool_contributor(extension);
}

fn goal_enabled(thread_store: &ExtensionData) -> bool {
    thread_store
        .get::<GoalExtensionConfig>()
        .is_some_and(|config| config.enabled)
}

fn accounting_state(thread_store: &ExtensionData) -> Arc<GoalAccountingState> {
    thread_store.get_or_init::<GoalAccountingState>(GoalAccountingState::default)
}
