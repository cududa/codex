use std::sync::Arc;

use async_trait::async_trait;
use codex_extension_api::FunctionCallError;
use codex_extension_api::JsonToolOutput;
use codex_extension_api::ToolCall;
use codex_extension_api::ToolExecutor;
use codex_extension_api::ToolName;
use codex_extension_api::ToolOutput;
use codex_extension_api::ToolSpec;
use codex_protocol::ThreadId;
use codex_protocol::protocol::ThreadGoal;
use codex_protocol::protocol::ThreadGoalStatus;
use codex_protocol::protocol::validate_thread_goal_objective;
use serde::Deserialize;
use serde::Serialize;

use crate::accounting::BudgetLimitedGoalDisposition;
use crate::accounting::GoalAccountingState;
use crate::events::GoalEventEmitter;
use crate::spec::CREATE_GOAL_TOOL_NAME;
use crate::spec::GET_GOAL_TOOL_NAME;
use crate::spec::UPDATE_GOAL_TOOL_NAME;
use crate::spec::create_create_goal_tool;
use crate::spec::create_get_goal_tool;
use crate::spec::create_update_goal_tool;

#[derive(Clone)]
pub(crate) struct GoalToolExecutor {
    kind: GoalToolKind,
    thread_id: ThreadId,
    state_db: Arc<codex_state::StateRuntime>,
    accounting_state: Arc<GoalAccountingState>,
    event_emitter: GoalEventEmitter,
}

#[derive(Clone, Copy)]
enum GoalToolKind {
    Get,
    Create,
    Update,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct CreateGoalRequest {
    pub objective: String,
    pub token_budget: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
struct UpdateGoalArgs {
    status: ThreadGoalStatus,
}

#[derive(Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct GoalToolResponse {
    goal: Option<ThreadGoal>,
    remaining_tokens: Option<i64>,
    completion_budget_report: Option<String>,
}

#[derive(Clone, Copy)]
enum CompletionBudgetReport {
    Include,
    Omit,
}

impl GoalToolExecutor {
    pub(crate) fn get(
        thread_id: ThreadId,
        state_db: Arc<codex_state::StateRuntime>,
        accounting_state: Arc<GoalAccountingState>,
        event_emitter: GoalEventEmitter,
    ) -> Self {
        Self {
            kind: GoalToolKind::Get,
            thread_id,
            state_db,
            accounting_state,
            event_emitter,
        }
    }

    pub(crate) fn create(
        thread_id: ThreadId,
        state_db: Arc<codex_state::StateRuntime>,
        accounting_state: Arc<GoalAccountingState>,
        event_emitter: GoalEventEmitter,
    ) -> Self {
        Self {
            kind: GoalToolKind::Create,
            thread_id,
            state_db,
            accounting_state,
            event_emitter,
        }
    }

    pub(crate) fn update(
        thread_id: ThreadId,
        state_db: Arc<codex_state::StateRuntime>,
        accounting_state: Arc<GoalAccountingState>,
        event_emitter: GoalEventEmitter,
    ) -> Self {
        Self {
            kind: GoalToolKind::Update,
            thread_id,
            state_db,
            accounting_state,
            event_emitter,
        }
    }
}

#[async_trait]
impl ToolExecutor<ToolCall> for GoalToolExecutor {
    fn tool_name(&self) -> ToolName {
        ToolName::plain(match self.kind {
            GoalToolKind::Get => GET_GOAL_TOOL_NAME,
            GoalToolKind::Create => CREATE_GOAL_TOOL_NAME,
            GoalToolKind::Update => UPDATE_GOAL_TOOL_NAME,
        })
    }

    fn spec(&self) -> Option<ToolSpec> {
        Some(match self.kind {
            GoalToolKind::Get => create_get_goal_tool(),
            GoalToolKind::Create => create_create_goal_tool(),
            GoalToolKind::Update => create_update_goal_tool(),
        })
    }

    async fn handle(&self, invocation: ToolCall) -> Result<Box<dyn ToolOutput>, FunctionCallError> {
        match self.kind {
            GoalToolKind::Get => self.handle_get(invocation).await,
            GoalToolKind::Create => self.handle_create(invocation).await,
            GoalToolKind::Update => self.handle_update(invocation).await,
        }
    }
}

impl GoalToolExecutor {
    async fn handle_get(
        &self,
        invocation: ToolCall,
    ) -> Result<Box<dyn ToolOutput>, FunctionCallError> {
        let _ = invocation.function_arguments()?;
        let goal = self
            .state_db
            .thread_goals()
            .get_thread_goal(self.thread_id)
            .await
            .map(|goal| goal.map(protocol_goal_from_state))
            .map_err(|err| {
                FunctionCallError::RespondToModel(format!("failed to read goal: {err}"))
            })?;
        goal_response(goal, CompletionBudgetReport::Omit)
    }

    async fn handle_create(
        &self,
        invocation: ToolCall,
    ) -> Result<Box<dyn ToolOutput>, FunctionCallError> {
        let mut request: CreateGoalRequest = parse_arguments(invocation.function_arguments()?)?;
        request.objective = request.objective.trim().to_string();
        validate_thread_goal_objective(&request.objective)
            .map_err(FunctionCallError::RespondToModel)?;
        validate_goal_budget(request.token_budget).map_err(FunctionCallError::RespondToModel)?;

        let goal = self
            .state_db
            .thread_goals()
            .insert_thread_goal(
                self.thread_id,
                request.objective.as_str(),
                codex_state::ThreadGoalStatus::Active,
                request.token_budget,
            )
            .await
            .map_err(|err| FunctionCallError::RespondToModel(format!("failed to create goal: {err}")))?
            .ok_or_else(|| {
                FunctionCallError::RespondToModel(
                    "cannot create a new goal because this thread already has a goal; use update_goal only when the existing goal is complete"
                        .to_string(),
                )
            })?;
        fill_empty_thread_preview_if_possible(self.state_db.as_ref(), self.thread_id, &goal).await;
        let turn_id = self
            .accounting_state
            .mark_current_turn_goal_active(goal.goal_id.clone());
        let goal = protocol_goal_from_state(goal);
        self.emit_goal_updated_from_tool_call(&invocation, turn_id, goal.clone());
        goal_response(Some(goal), CompletionBudgetReport::Omit)
    }

    async fn handle_update(
        &self,
        invocation: ToolCall,
    ) -> Result<Box<dyn ToolOutput>, FunctionCallError> {
        let args: UpdateGoalArgs = parse_arguments(invocation.function_arguments()?)?;
        if !matches!(
            args.status,
            ThreadGoalStatus::Complete | ThreadGoalStatus::Blocked
        ) {
            return Err(FunctionCallError::RespondToModel(
                "update_goal can only mark the existing goal complete or blocked; pause, resume, budget-limited, and usage-limited status changes are controlled by the user or system"
                    .to_string(),
            ));
        }

// REVIEW-DEDELUGER: incoming upstream would replace this preserved local shape; preserved maintained local block below.
// REVIEW-DEDELUGER-INCOMING-DIFF path=codex-rs/ext/goal/src/tool.rs block=2 basis=maintained-to-incoming
// @@ -1,15 +1,45 @@
// -        // TODO: update_goal needs a host callback before terminal status
// -        // mutation to flush final active-turn accounting with budget steering
// -        // suppressed.
// +        self.account_active_goal_progress(
// +            match args.status {
// +                ThreadGoalStatus::Complete => codex_state::GoalAccountingMode::ActiveOrComplete,
// +                ThreadGoalStatus::Blocked => codex_state::GoalAccountingMode::ActiveOrStopped,
// +                ThreadGoalStatus::Active
// +                | ThreadGoalStatus::Paused
// +                | ThreadGoalStatus::UsageLimited
// +                | ThreadGoalStatus::BudgetLimited => unreachable!("status validated above"),
// +            },
// +            invocation.call_id.as_str(),
// +            BudgetLimitedGoalDisposition::ClearActive,
// +        )
// +        .await?;
//          let goal = self
// -            .backend
// -            .set_goal_status(self.thread_id, args.status)
// +            .state_db
// +            .thread_goals()
// +            .update_thread_goal(
// +                self.thread_id,
// +                codex_state::GoalUpdate {
// +                    objective: None,
// +                    status: Some(state_status_from_protocol(args.status)),
// +                    token_budget: None,
// +                    expected_goal_id: None,
// +                },
// +            )
//              .await
// -            .map_err(FunctionCallError::RespondToModel)?;
// -        self.emit_goal_updated_from_tool_call(&invocation, goal.clone());
// -        let completion_budget_report = if args.status == ThreadGoalStatus::Complete {
// -            CompletionBudgetReport::Include
// -        } else {
// -            CompletionBudgetReport::Omit
// -        };
// -        goal_response(Some(goal), completion_budget_report)
// +            .map_err(|err| {
// +                FunctionCallError::RespondToModel(format!("failed to update goal: {err}"))
// +            })?
// +            .map(protocol_goal_from_state)
// +            .ok_or_else(|| {
// +                FunctionCallError::RespondToModel(
// +                    "cannot update goal because this thread has no goal".to_string(),
// +                )
// +            })?;
// +        let turn_id = self.accounting_state.clear_current_turn_goal();
// +        self.emit_goal_updated_from_tool_call(&invocation, turn_id, goal.clone());
// +        goal_response(
// +            Some(goal),
// +            if args.status == ThreadGoalStatus::Complete {
// +                CompletionBudgetReport::Include
// +            } else {
// +                CompletionBudgetReport::Omit
// +            },
// +        )
// REVIEW-DEDELUGER-END-INCOMING-DIFF

        // TODO: update_goal needs a host callback before terminal status
        // mutation to flush final active-turn accounting with budget steering
        // suppressed.
        let goal = self
            .backend
            .set_goal_status(self.thread_id, args.status)
            .await
            .map_err(FunctionCallError::RespondToModel)?;
        self.emit_goal_updated_from_tool_call(&invocation, goal.clone());
        let completion_budget_report = if args.status == ThreadGoalStatus::Complete {
            CompletionBudgetReport::Include
        } else {
            CompletionBudgetReport::Omit
        };
        goal_response(Some(goal), completion_budget_report)
    }

    fn emit_goal_updated_from_tool_call(
        &self,
        invocation: &ToolCall,
        turn_id: Option<String>,
        goal: ThreadGoal,
    ) {
        self.event_emitter
            .thread_goal_updated(invocation.call_id.clone(), turn_id, goal);
    }

    async fn account_active_goal_progress(
        &self,
        mode: codex_state::GoalAccountingMode,
        event_id: &str,
        budget_limited_goal_disposition: BudgetLimitedGoalDisposition,
    ) -> Result<Option<ThreadGoal>, FunctionCallError> {
        let Some(turn_id) = self.accounting_state.current_turn_id() else {
            return Ok(None);
        };
        let Some(snapshot) = self.accounting_state.progress_snapshot(turn_id.as_str()) else {
            return Ok(None);
        };
        let outcome = self
            .state_db
            .thread_goals()
            .account_thread_goal_usage(
                self.thread_id,
                snapshot.time_delta_seconds,
                snapshot.token_delta,
                mode,
                Some(snapshot.expected_goal_id.as_str()),
            )
            .await
            .map_err(|err| {
                FunctionCallError::RespondToModel(format!("failed to account goal progress: {err}"))
            })?;
        Ok(match outcome {
            codex_state::GoalAccountingOutcome::Updated(goal) => {
                self.accounting_state.mark_progress_accounted_for_status(
                    turn_id.as_str(),
                    &snapshot,
                    goal.status,
                    budget_limited_goal_disposition,
                );
                let goal = protocol_goal_from_state(goal);
                self.event_emitter.thread_goal_updated(
                    event_id.to_string(),
                    Some(turn_id),
                    goal.clone(),
                );
                Some(goal)
            }
            codex_state::GoalAccountingOutcome::Unchanged(_) => None,
        })
    }
}

fn parse_arguments<T>(arguments: &str) -> Result<T, FunctionCallError>
where
    T: for<'de> Deserialize<'de>,
{
    serde_json::from_str(arguments)
        .map_err(|err| FunctionCallError::RespondToModel(err.to_string()))
}

fn validate_goal_budget(value: Option<i64>) -> Result<(), String> {
    if let Some(value) = value
        && value <= 0
    {
        return Err("goal budgets must be positive when provided".to_string());
    }
    Ok(())
}

fn goal_response(
    goal: Option<ThreadGoal>,
    completion_budget_report: CompletionBudgetReport,
) -> Result<Box<dyn ToolOutput>, FunctionCallError> {
    let value = serde_json::to_value(GoalToolResponse::new(goal, completion_budget_report))
        .map_err(|err| FunctionCallError::Fatal(err.to_string()))?;
    Ok(Box::new(JsonToolOutput::new(value)))
}

impl GoalToolResponse {
    fn new(goal: Option<ThreadGoal>, report_mode: CompletionBudgetReport) -> Self {
        let remaining_tokens = goal.as_ref().and_then(|goal| {
            goal.token_budget
                .map(|budget| (budget - goal.tokens_used).max(0))
        });
        let completion_budget_report = match report_mode {
            CompletionBudgetReport::Include => goal
                .as_ref()
                .filter(|goal| goal.status == ThreadGoalStatus::Complete)
                .and_then(completion_budget_report),
            CompletionBudgetReport::Omit => None,
        };
        Self {
            goal,
            remaining_tokens,
            completion_budget_report,
        }
    }
}

async fn fill_empty_thread_preview_if_possible(
    state_db: &codex_state::StateRuntime,
    thread_id: ThreadId,
    goal: &codex_state::ThreadGoal,
) {
    if let Err(err) = state_db
        .set_thread_preview_if_empty(thread_id, goal.objective.as_str())
        .await
    {
        tracing::warn!(
            "failed to set empty thread preview from goal objective for {thread_id}: {err}"
        );
    }
}

pub(crate) fn protocol_goal_from_state(goal: codex_state::ThreadGoal) -> ThreadGoal {
    ThreadGoal {
        thread_id: goal.thread_id,
        objective: goal.objective,
        status: protocol_status_from_state(goal.status),
        token_budget: goal.token_budget,
        tokens_used: goal.tokens_used,
        time_used_seconds: goal.time_used_seconds,
        created_at: goal.created_at.timestamp(),
        updated_at: goal.updated_at.timestamp(),
    }
}

fn protocol_status_from_state(status: codex_state::ThreadGoalStatus) -> ThreadGoalStatus {
    match status {
        codex_state::ThreadGoalStatus::Active => ThreadGoalStatus::Active,
        codex_state::ThreadGoalStatus::Paused => ThreadGoalStatus::Paused,
        codex_state::ThreadGoalStatus::Blocked => ThreadGoalStatus::Blocked,
        codex_state::ThreadGoalStatus::UsageLimited => ThreadGoalStatus::UsageLimited,
        codex_state::ThreadGoalStatus::BudgetLimited => ThreadGoalStatus::BudgetLimited,
        codex_state::ThreadGoalStatus::Complete => ThreadGoalStatus::Complete,
    }
}

fn state_status_from_protocol(status: ThreadGoalStatus) -> codex_state::ThreadGoalStatus {
    match status {
        ThreadGoalStatus::Active => codex_state::ThreadGoalStatus::Active,
        ThreadGoalStatus::Paused => codex_state::ThreadGoalStatus::Paused,
        ThreadGoalStatus::Blocked => codex_state::ThreadGoalStatus::Blocked,
        ThreadGoalStatus::UsageLimited => codex_state::ThreadGoalStatus::UsageLimited,
        ThreadGoalStatus::BudgetLimited => codex_state::ThreadGoalStatus::BudgetLimited,
        ThreadGoalStatus::Complete => codex_state::ThreadGoalStatus::Complete,
    }
}

fn completion_budget_report(goal: &ThreadGoal) -> Option<String> {
    if goal.token_budget.is_none() && goal.time_used_seconds <= 0 {
        None
    } else {
        Some(
            "Goal achieved. Report final usage from this tool result's structured goal fields. If `goal.tokenBudget` is present, include token usage from `goal.tokensUsed` and `goal.tokenBudget`. If `goal.timeUsedSeconds` is greater than 0, summarize elapsed time in a concise, human-friendly form appropriate to the response language."
                .to_string(),
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::events::GoalEventEmitter;
    use async_trait::async_trait;
    use codex_extension_api::ExtensionEventSink;
    use codex_protocol::protocol::Event;
    use codex_tools::ToolPayload;
    use std::future::Future;
    use std::pin::Pin;
    use std::sync::Mutex;
    use std::task::Context;
    use std::task::Poll;
    use std::task::RawWaker;
    use std::task::RawWakerVTable;
    use std::task::Waker;

    struct RecordingBackend {
        calls: Arc<Mutex<Vec<&'static str>>>,
    }

    #[async_trait]
    impl GoalToolBackend for RecordingBackend {
        async fn get_goal(&self, thread_id: ThreadId) -> Result<Option<ThreadGoal>, String> {
            Ok(Some(test_goal(thread_id, ThreadGoalStatus::Active)))
        }

        async fn create_goal(
            &self,
            thread_id: ThreadId,
            _request: CreateGoalRequest,
        ) -> Result<ThreadGoal, String> {
            Ok(test_goal(thread_id, ThreadGoalStatus::Active))
        }

        async fn set_goal_status(
            &self,
            thread_id: ThreadId,
            status: ThreadGoalStatus,
        ) -> Result<ThreadGoal, String> {
            self.calls.lock().unwrap().push("backend");
            Ok(test_goal(thread_id, status))
        }
    }

    struct RecordingSink {
        calls: Arc<Mutex<Vec<&'static str>>>,
    }

    impl ExtensionEventSink for RecordingSink {
        fn emit(&self, _event: Event) {
            self.calls.lock().unwrap().push("event");
        }
    }

    #[test]
    fn extension_update_goal_completion_emits_after_backend_mutation() {
        let calls = Arc::new(Mutex::new(Vec::new()));
        let backend = Arc::new(RecordingBackend {
            calls: Arc::clone(&calls),
        });
        let sink = Arc::new(RecordingSink {
            calls: Arc::clone(&calls),
        });
        let thread_id =
            ThreadId::from_string("00000000-0000-0000-0000-000000000123").expect("valid thread id");
        let executor = GoalToolExecutor::update(thread_id, backend, GoalEventEmitter::new(sink));

        block_on(executor.handle(ToolCall {
            call_id: "call-1".to_string(),
            tool_name: ToolName::plain(UPDATE_GOAL_TOOL_NAME),
            payload: ToolPayload::Function {
                arguments: r#"{"status":"complete"}"#.to_string(),
            },
        }))
        .expect("update_goal should succeed");

        assert_eq!(*calls.lock().unwrap(), vec!["backend", "event"]);
    }

    fn test_goal(thread_id: ThreadId, status: ThreadGoalStatus) -> ThreadGoal {
        ThreadGoal {
            thread_id,
            objective: "finish the work".to_string(),
            status,
            token_budget: Some(10),
            tokens_used: 5,
            time_used_seconds: 0,
            created_at: 1,
            updated_at: 2,
        }
    }

    fn block_on<F: Future>(future: F) -> F::Output {
        let waker = noop_waker();
        let mut context = Context::from_waker(&waker);
        let mut future = Box::pin(future);
        loop {
            match Pin::new(&mut future).poll(&mut context) {
                Poll::Ready(output) => return output,
                Poll::Pending => std::thread::yield_now(),
            }
        }
    }

    fn noop_waker() -> Waker {
        unsafe fn clone(_: *const ()) -> RawWaker {
            RawWaker::new(std::ptr::null(), &VTABLE)
        }
        unsafe fn wake(_: *const ()) {}
        unsafe fn wake_by_ref(_: *const ()) {}
        unsafe fn drop(_: *const ()) {}
        static VTABLE: RawWakerVTable = RawWakerVTable::new(clone, wake, wake_by_ref, drop);
        // SAFETY: the vtable functions ignore the null data pointer and perform
        // no dereferencing, so this no-op waker is valid for polling futures
        // that complete without scheduling external wakeups.
        unsafe { Waker::from_raw(RawWaker::new(std::ptr::null(), &VTABLE)) }
    }
}
