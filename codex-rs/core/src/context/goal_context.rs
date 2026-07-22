// REVIEW-DEDELUGER: preserved maintained content; incoming upstream difference follows.
// REVIEW-DEDELUGER-INCOMING-DIFF path=codex-rs/core/src/context/goal_context.rs block=1
// @@ -1,3 +0,0 @@
// -//! Hidden runtime goal context for goal steering prompts.
// -
// -use super::ContextualUserFragment;
// REVIEW-DEDELUGER-END-INCOMING-DIFF

//! Hidden runtime goal context for goal steering prompts.

use super::ContextualUserFragment;
use codex_config::config_toml::GoalSteeringRole;
// REVIEW-DEDELUGER: incoming upstream would delete this preserved local shape; preserved maintained local block below.
// REVIEW-DEDELUGER-INCOMING-DIFF path=codex-rs/core/src/context/goal_context.rs block=2 basis=maintained-to-incoming
// @@ -1,2 +0,0 @@
// -use codex_protocol::models::ContentItem;
// -use codex_protocol::models::ResponseInputItem;
// REVIEW-DEDELUGER-END-INCOMING-DIFF

// REVIEW-DEDELUGER: preserved maintained content; incoming upstream difference follows.
// REVIEW-DEDELUGER-INCOMING-DIFF path=codex-rs/core/src/context/goal_context.rs block=4
// @@ -1,2 +0,0 @@
// -use codex_protocol::models::ContentItem;
// -use codex_protocol::models::ResponseInputItem;
// REVIEW-DEDELUGER-END-INCOMING-DIFF

use codex_protocol::models::ContentItem;
use codex_protocol::models::ResponseInputItem;
use codex_protocol::models::ResponseItem;
// REVIEW-DEDELUGER: preserved maintained content; incoming upstream difference follows.
// REVIEW-DEDELUGER-INCOMING-DIFF path=codex-rs/core/src/context/goal_context.rs block=6
// @@ -1,42 +0,0 @@
// -
// -pub(crate) const GOAL_CONTEXT_START_MARKER: &str = "<goal_context>";
// -pub(crate) const GOAL_CONTEXT_END_MARKER: &str = "</goal_context>";
// -
// -/// Hidden runtime-owned goal steering context injected into model input.
// -#[derive(Debug, Clone, PartialEq)]
// -pub struct GoalContext {
// -    prompt: String,
// -}
// -
// -/// Role to use when serializing active goal context into model input.
// -#[derive(Debug, Clone, Copy, PartialEq, Eq)]
// -pub enum GoalContextRole {
// -    User,
// -    Developer,
// -}
// -
// -impl GoalContextRole {
// -    fn as_response_role(self) -> &'static str {
// -        match self {
// -            GoalContextRole::User => "user",
// -            GoalContextRole::Developer => "developer",
// -        }
// -    }
// -}
// -
// -impl From<GoalSteeringRole> for GoalContextRole {
// -    fn from(role: GoalSteeringRole) -> Self {
// -        match role {
// -            GoalSteeringRole::User => GoalContextRole::User,
// -            GoalSteeringRole::Developer => GoalContextRole::Developer,
// -        }
// -    }
// -}
// -
// -impl GoalContext {
// -    /// Creates goal context around an already-rendered steering prompt.
// -    pub fn new(prompt: impl Into<String>) -> Self {
// -        Self {
// -            prompt: prompt.into(),
// -        }
// -    }
// REVIEW-DEDELUGER-END-INCOMING-DIFF


pub(crate) const GOAL_CONTEXT_START_MARKER: &str = "<goal_context>";
pub(crate) const GOAL_CONTEXT_END_MARKER: &str = "</goal_context>";

/// Hidden runtime-owned goal steering context injected into model input.
#[derive(Debug, Clone, PartialEq)]
pub struct GoalContext {
    prompt: String,
}

/// Role to use when serializing active goal context into model input.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GoalContextRole {
    User,
    Developer,
}

impl GoalContextRole {
    fn as_response_role(self) -> &'static str {
        match self {
            GoalContextRole::User => "user",
            GoalContextRole::Developer => "developer",
        }
    }
}

impl From<GoalSteeringRole> for GoalContextRole {
    fn from(role: GoalSteeringRole) -> Self {
        match role {
            GoalSteeringRole::User => GoalContextRole::User,
            GoalSteeringRole::Developer => GoalContextRole::Developer,
        }
    }
}

impl GoalContext {
    /// Creates goal context around an already-rendered steering prompt.
    pub fn new(prompt: impl Into<String>) -> Self {
        Self {
            prompt: prompt.into(),
        }
    }
    // REVIEW-DEDELUGER: incoming upstream would delete this preserved local shape; preserved maintained local block below.
    // REVIEW-DEDELUGER-INCOMING-DIFF path=codex-rs/core/src/context/goal_context.rs block=4 basis=maintained-to-incoming
    // @@ -1,11 +0,0 @@
    // -
    // -    /// Converts the registered fragment into an active-turn injectable item.
    // -    pub fn into_response_input_item(self, role: GoalContextRole) -> ResponseInputItem {
    // -        ResponseInputItem::Message {
    // -            role: role.as_response_role().to_string(),
    // -            content: vec![ContentItem::InputText {
    // -                text: self.render(),
    // -            }],
    // -            phase: None,
    // -        }
    // -    }
    // REVIEW-DEDELUGER-END-INCOMING-DIFF
// REVIEW-DEDELUGER: preserved maintained content; incoming upstream difference follows.
// REVIEW-DEDELUGER-INCOMING-DIFF path=codex-rs/core/src/context/goal_context.rs block=8
// @@ -1,34 +0,0 @@
// -
// -    /// Converts the registered fragment into an active-turn injectable item.
// -    pub fn into_response_input_item(self, role: GoalContextRole) -> ResponseInputItem {
// -        ResponseInputItem::Message {
// -            role: role.as_response_role().to_string(),
// -            content: vec![ContentItem::InputText {
// -                text: self.render(),
// -            }],
// -            phase: None,
// -        }
// -    }
// -}
// -
// -impl ContextualUserFragment for GoalContext {
// -    fn role() -> &'static str {
// -        "user"
// -    }
// -
// -    fn markers(&self) -> (&'static str, &'static str) {
// -        Self::type_markers()
// -    }
// -
// -    fn type_markers() -> (&'static str, &'static str) {
// -        (GOAL_CONTEXT_START_MARKER, GOAL_CONTEXT_END_MARKER)
// -    }
// -
// -    fn body(&self) -> String {
// -        format!("\n{}\n", self.prompt)
// -    }
// -}
// -
// -pub(crate) fn is_goal_context_text(text: &str) -> bool {
// -    GoalContext::matches_text(text)
// -}
// REVIEW-DEDELUGER-END-INCOMING-DIFF


    /// Converts the registered fragment into an active-turn injectable item.
    pub fn into_response_input_item(self, role: GoalContextRole) -> ResponseInputItem {
        ResponseInputItem::Message {
            role: role.as_response_role().to_string(),
            content: vec![ContentItem::InputText {
                text: self.render(),
            }],
            phase: None,
        }
    }
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

pub(crate) fn is_goal_context_response_item(item: &ResponseItem) -> bool {
    let ResponseItem::Message { role, content, .. } = item else {
        return false;
    };
    if role != "user" && role != "developer" {
        return false;
    }
    let [ContentItem::InputText { text }] = content.as_slice() else {
        return false;
    };
    is_goal_context_text(text)
}
