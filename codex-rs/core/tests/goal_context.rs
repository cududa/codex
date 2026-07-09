use codex_core::context::ContextualUserFragment;
use codex_core::context::GoalContext;
use codex_core::context::GoalContextRole;
use codex_protocol::models::ContentItem;
use codex_protocol::models::ResponseInputItem;
use pretty_assertions::assert_eq;

#[test]
fn goal_context_response_input_item_uses_explicit_steering_role() {
    for (steering_role, expected_role) in [
        (GoalContextRole::Developer, "developer"),
        (GoalContextRole::User, "user"),
    ] {
        let item = GoalContext::new("Continue working.").into_response_input_item(steering_role);
        let ResponseInputItem::Message { role, content, .. } = item else {
            panic!("expected goal context message item");
        };
        assert_eq!(expected_role, role);
        assert_eq!(
            vec![ContentItem::InputText {
                text: "<goal_context>\nContinue working.\n</goal_context>".to_string(),
            }],
            content
        );
    }
}

#[test]
fn goal_context_render_keeps_role_neutral_marker_shape() {
    assert_eq!(
        "<goal_context>\nContinue working.\n</goal_context>",
        GoalContext::new("Continue working.").render()
    );
}
