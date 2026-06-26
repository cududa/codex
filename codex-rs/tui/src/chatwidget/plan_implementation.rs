use codex_protocol::config_types::CollaborationModeMask;

use crate::app_event::AppEvent;
use crate::bottom_pane::SelectionAction;
use crate::bottom_pane::SelectionItem;
use crate::bottom_pane::SelectionViewParams;
use crate::bottom_pane::popup_consts::standard_popup_hint_line;

pub(super) const PLAN_IMPLEMENTATION_TITLE: &str = "Implement this plan?";
const PLAN_IMPLEMENTATION_YES: &str = "Yes, implement this plan";
const PLAN_IMPLEMENTATION_CLEAR_CONTEXT: &str = "Yes, clear context and implement";
const PLAN_IMPLEMENTATION_NO: &str = "No, stay in Plan mode";
pub(super) const PLAN_IMPLEMENTATION_PROMPT_PREFIX: &str = concat!(
    "Implement the approved plan below. Treat it as the active user request and source of truth ",
    "for scope.\n\n",
    "Plan Mode behavior instructions are no longer active, but the approved plan remains active ",
    "user intent. Re-read files to understand the terrain, validate assumptions, and execute the ",
    "plan faithfully. Preserve explicit contracts and user-stated compatibility requirements. Do ",
    "not infer broad hidden compatibility obligations from polished, abstract, or platform-shaped ",
    "code.\n\n",
    "Let repo evidence guide implementation details. If the plan is documentary, document. If it ",
    "is investigative, follow the evidence. If it is a rewrite or refactor, existing code is ",
    "terrain rather than the mission: understand it deeply, but do not let the current shape ",
    "silently narrow the approved scope. If concrete correctness, feasibility, security, ",
    "data-loss, or explicit-compatibility issues conflict with the plan, adapt deliberately and ",
    "explain why."
);
pub(super) const PLAN_IMPLEMENTATION_DEFAULT_UNAVAILABLE: &str = "Default mode unavailable";
pub(super) const PLAN_IMPLEMENTATION_NO_APPROVED_PLAN: &str = "No approved plan available";

pub(super) fn plan_implementation_prompt(plan_markdown: &str) -> Option<String> {
    (!plan_markdown.trim().is_empty())
        .then(|| format!("{PLAN_IMPLEMENTATION_PROMPT_PREFIX}\n\n{plan_markdown}"))
}

/// Builds the confirmation prompt shown after a plan is approved in Plan mode.
///
/// The optional usage label is already phrased for display, such as `89% used`
/// or `123K used`. This module only decides where that label belongs in the
/// decision copy so action wiring stays separate from token accounting.
pub(super) fn selection_view_params(
    default_mask: Option<CollaborationModeMask>,
    plan_markdown: Option<&str>,
    clear_context_usage_label: Option<&str>,
) -> SelectionViewParams {
    let approved_plan_message = plan_markdown.and_then(plan_implementation_prompt);

    let (implement_actions, implement_disabled_reason) =
        match (default_mask.clone(), approved_plan_message.clone()) {
            (None, _) => (
                Vec::new(),
                Some(PLAN_IMPLEMENTATION_DEFAULT_UNAVAILABLE.to_string()),
            ),
            (Some(_), None) => (
                Vec::new(),
                Some(PLAN_IMPLEMENTATION_NO_APPROVED_PLAN.to_string()),
            ),
            (Some(mask), Some(user_text)) => {
                let actions: Vec<SelectionAction> = vec![Box::new(move |tx| {
                    tx.send(AppEvent::SubmitUserMessageWithMode {
                        text: user_text.clone(),
                        collaboration_mode: mask.clone(),
                    });
                })];
                (actions, None)
            }
        };

    let (clear_context_actions, clear_context_disabled_reason) =
        match (default_mask, approved_plan_message) {
            (None, _) => (
                Vec::new(),
                Some(PLAN_IMPLEMENTATION_DEFAULT_UNAVAILABLE.to_string()),
            ),
            (Some(_), None) => (
                Vec::new(),
                Some(PLAN_IMPLEMENTATION_NO_APPROVED_PLAN.to_string()),
            ),
            (Some(_), Some(user_text)) => {
                let actions: Vec<SelectionAction> = vec![Box::new(move |tx| {
                    tx.send(AppEvent::ClearUiAndSubmitUserMessage {
                        text: user_text.clone(),
                    });
                })];
                (actions, None)
            }
        };

    let clear_context_description = clear_context_usage_label.map_or_else(
        || "Fresh thread with this plan.".to_string(),
        |label| format!("Fresh thread. Context: {label}."),
    );

    SelectionViewParams {
        title: Some(PLAN_IMPLEMENTATION_TITLE.to_string()),
        subtitle: None,
        footer_hint: Some(standard_popup_hint_line()),
        items: vec![
            SelectionItem {
                name: PLAN_IMPLEMENTATION_YES.to_string(),
                description: Some("Switch to Default and start coding.".to_string()),
                selected_description: None,
                is_current: false,
                actions: implement_actions,
                disabled_reason: implement_disabled_reason,
                dismiss_on_select: true,
                ..Default::default()
            },
            SelectionItem {
                name: PLAN_IMPLEMENTATION_CLEAR_CONTEXT.to_string(),
                description: Some(clear_context_description),
                selected_description: None,
                is_current: false,
                actions: clear_context_actions,
                disabled_reason: clear_context_disabled_reason,
                dismiss_on_select: true,
                ..Default::default()
            },
            SelectionItem {
                name: PLAN_IMPLEMENTATION_NO.to_string(),
                description: Some("Continue planning with the model.".to_string()),
                selected_description: None,
                is_current: false,
                actions: Vec::new(),
                dismiss_on_select: true,
                ..Default::default()
            },
        ],
        ..Default::default()
    }
}
