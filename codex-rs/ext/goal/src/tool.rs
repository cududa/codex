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

use crate::events::GoalEventEmitter;
use crate::extension::GoalToolBackend;
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
    backend: Arc<dyn GoalToolBackend>,
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
        backend: Arc<dyn GoalToolBackend>,
        event_emitter: GoalEventEmitter,
    ) -> Self {
        Self {
            kind: GoalToolKind::Get,
            thread_id,
            backend,
            event_emitter,
        }
    }

    pub(crate) fn create(
        thread_id: ThreadId,
        backend: Arc<dyn GoalToolBackend>,
        event_emitter: GoalEventEmitter,
    ) -> Self {
        Self {
            kind: GoalToolKind::Create,
            thread_id,
            backend,
            event_emitter,
        }
    }

    pub(crate) fn update(
        thread_id: ThreadId,
        backend: Arc<dyn GoalToolBackend>,
        event_emitter: GoalEventEmitter,
    ) -> Self {
        Self {
            kind: GoalToolKind::Update,
            thread_id,
            backend,
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
            .backend
            .get_goal(self.thread_id)
            .await
            .map_err(FunctionCallError::RespondToModel)?;
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
            .backend
            .create_goal(self.thread_id, request)
            .await
            .map_err(FunctionCallError::RespondToModel)?;
        self.emit_goal_updated_from_tool_call(&invocation, goal.clone());
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

    fn emit_goal_updated_from_tool_call(&self, invocation: &ToolCall, goal: ThreadGoal) {
        // TODO: ToolCall should expose the current turn submission id so goal
        // tool events can set ThreadGoalUpdatedEvent.turn_id exactly as core
        // does today. Until then, correlate the event with the tool call id.
        self.event_emitter.thread_goal_updated(
            invocation.call_id.clone(),
            /*turn_id*/ None,
            goal,
        );
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
