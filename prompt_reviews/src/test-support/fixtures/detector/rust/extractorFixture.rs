const GOAL_TEMPLATE: &str = include_str!("../../../../codex-rs/core/templates/goals/continue.md");

pub enum MessageRole {
    User,
    Assistant,
    Developer,
}

pub trait HarnessRenderer {
    fn render_prompt(&self, role: MessageRole) -> String;
}

pub struct PromptHarness {
    role: MessageRole,
}

impl HarnessRenderer for PromptHarness {
    fn render_prompt(&self, role: MessageRole) -> String {
        let rendered = build_context_message("user", "<goal_context>");
        match role {
            MessageRole::User => rendered,
            MessageRole::Assistant => String::from("assistant"),
            MessageRole::Developer => String::from("developer"),
        }
    }
}

impl PromptHarness {
    pub fn new() -> Self {
        Self {
            role: MessageRole::User,
        }
    }

    pub fn register_tools(&self) -> Vec<&'static str> {
        REGISTERED_TOOLS.to_vec()
    }
}

const REGISTERED_TOOLS: &[&str] = &[
    "shell",
    "apply_patch",
    "update_goal",
];

const MESSAGE_REGISTRY: &[MessageRole] = &[
    MessageRole::User,
    MessageRole::Assistant,
];

fn build_context_message(role: &str, marker: &str) -> String {
    format!("{role}:{marker}")
}
