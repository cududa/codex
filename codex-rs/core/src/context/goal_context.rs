//! Hidden role-neutral runtime goal context for goal steering prompts.

use super::ContextualUserFragment;

pub(crate) const GOAL_CONTEXT_START_MARKER: &str = "<goal_context>";
pub(crate) const GOAL_CONTEXT_END_MARKER: &str = "</goal_context>";

pub(crate) struct GoalContext {
    pub(crate) prompt: String,
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
