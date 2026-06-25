//! Hidden role-neutral runtime goal context for goal steering prompts.

pub(crate) const GOAL_CONTEXT_START_MARKER: &str = "<goal_context>";
pub(crate) const GOAL_CONTEXT_END_MARKER: &str = "</goal_context>";

pub(crate) fn render_goal_context(prompt: &str) -> String {
    format!("{GOAL_CONTEXT_START_MARKER}\n{prompt}\n{GOAL_CONTEXT_END_MARKER}")
}

pub(crate) fn is_goal_context_text(text: &str) -> bool {
    let trimmed = text.trim_start();
    let starts_with_marker = trimmed
        .get(..GOAL_CONTEXT_START_MARKER.len())
        .is_some_and(|candidate| candidate.eq_ignore_ascii_case(GOAL_CONTEXT_START_MARKER));
    let trimmed = trimmed.trim_end();
    let ends_with_marker = trimmed
        .get(trimmed.len().saturating_sub(GOAL_CONTEXT_END_MARKER.len())..)
        .is_some_and(|candidate| candidate.eq_ignore_ascii_case(GOAL_CONTEXT_END_MARKER));
    starts_with_marker && ends_with_marker
}
