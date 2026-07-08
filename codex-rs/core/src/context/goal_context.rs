//! Hidden role-neutral runtime goal context for goal steering prompts.

use super::ContextualUserFragment;
use codex_protocol::models::ContentItem;
use codex_protocol::models::ResponseInputItem;

// REVIEW-DEDELUGER: incoming upstream would replace this preserved local shape; preserved maintained local block below.
// REVIEW-DEDELUGER-INCOMING-DIFF path=codex-rs/core/src/context/goal_context.rs block=2 basis=maintained-to-incoming
// @@ -1,5 +1,4 @@
// -pub(crate) const GOAL_CONTEXT_START_MARKER: &str = "<goal_context>";
// -pub(crate) const GOAL_CONTEXT_END_MARKER: &str = "</goal_context>";
// -
// -pub(crate) struct GoalContext {
// -    pub(crate) prompt: String,
// +/// Hidden runtime-owned goal steering context injected into model input.
// +#[derive(Debug, Clone, PartialEq)]
// +pub struct GoalContext {
// +    prompt: String,
// REVIEW-DEDELUGER-END-INCOMING-DIFF

pub(crate) const GOAL_CONTEXT_START_MARKER: &str = "<goal_context>";
pub(crate) const GOAL_CONTEXT_END_MARKER: &str = "</goal_context>";

pub(crate) struct GoalContext {
    pub(crate) prompt: String,
}

impl GoalContext {
    /// Creates goal context around an already-rendered steering prompt.
    pub fn new(prompt: impl Into<String>) -> Self {
        Self {
            prompt: prompt.into(),
        }
    }

    /// Converts the registered fragment into an active-turn injectable item.
    pub fn into_response_input_item(self) -> ResponseInputItem {
        ResponseInputItem::Message {
            role: <Self as ContextualUserFragment>::role().to_string(),
            content: vec![ContentItem::InputText {
                text: self.render(),
            }],
            phase: None,
        }
    }
}

pub(crate) fn render_goal_context(prompt: &str) -> String {
    GoalContext {
        prompt: prompt.to_string(),
    }
    .render()
}

impl ContextualUserFragment for GoalContext {
    fn role() -> &'static str {
        "user"
    }

    fn markers(&self) -> (&'static str, &'static str) {
        Self::type_markers()
    }

    fn type_markers() -> (&'static str, &'static str) {
        (GOAL_CONTEXT_START_MARKER, GOAL_CONTEXT_END_MARKER)
    }

    fn body(&self) -> String {
        format!("\n{}\n", self.prompt)
    }
}

pub(crate) fn is_goal_context_text(text: &str) -> bool {
    GoalContext::matches_text(text)
}
