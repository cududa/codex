---
schema: prompt-review/v2
commit: 96836e15ed0db0123302debd064c857af0fe8c8b
parent: c03eb20d8dacf7bdf237a0688d969d95c67048fe
shortCommit: 96836e15ed
subject: "Improve goal continuation based on feedback (#22045)"
target: "contextual_user_message"
source:
  before: c03eb20d8dacf7bdf237a0688d969d95c67048fe:codex-rs/core/src/context/contextual_user_message.rs
  after: 96836e15ed0db0123302debd064c857af0fe8c8b:codex-rs/core/src/context/contextual_user_message.rs
---

# contextual_user_message

## Same `same-001`

<!--
id: same-001
kind: same
beforeLines: 1-7
afterLines: 1-7
-->

```text id=same-001 side=both
use codex_protocol::items::HookPromptItem;
use codex_protocol::items::parse_hook_prompt_fragment;
use codex_protocol::models::ContentItem;

use super::EnvironmentContext;
use super::FragmentRegistration;
use super::FragmentRegistrationProxy;
```

## Changed `change-001`

<!--
id: change-001
kind: change
beforeLines: none
afterLines: 8
-->

```diff id=change-001
+ use super::GoalContext;
```

## Same `same-002`

<!--
id: same-002
kind: same
beforeLines: 8-25
afterLines: 9-26
-->

```text id=same-002 side=both
use super::SkillInstructions;
use super::SubagentNotification;
use super::TurnAborted;
use super::UserInstructions;
use super::UserShellCommand;

static USER_INSTRUCTIONS_REGISTRATION: FragmentRegistrationProxy<UserInstructions> =
    FragmentRegistrationProxy::new();
static ENVIRONMENT_CONTEXT_REGISTRATION: FragmentRegistrationProxy<EnvironmentContext> =
    FragmentRegistrationProxy::new();
static SKILL_INSTRUCTIONS_REGISTRATION: FragmentRegistrationProxy<SkillInstructions> =
    FragmentRegistrationProxy::new();
static USER_SHELL_COMMAND_REGISTRATION: FragmentRegistrationProxy<UserShellCommand> =
    FragmentRegistrationProxy::new();
static TURN_ABORTED_REGISTRATION: FragmentRegistrationProxy<TurnAborted> =
    FragmentRegistrationProxy::new();
static SUBAGENT_NOTIFICATION_REGISTRATION: FragmentRegistrationProxy<SubagentNotification> =
    FragmentRegistrationProxy::new();
```

## Changed `change-002`

<!--
id: change-002
kind: change
beforeLines: none
afterLines: 27-28
-->

```diff id=change-002
+ static GOAL_CONTEXT_REGISTRATION: FragmentRegistrationProxy<GoalContext> =
+     FragmentRegistrationProxy::new();
```

## Same `same-003`

<!--
id: same-003
kind: same
beforeLines: 26-33
afterLines: 29-36
-->

```text id=same-003 side=both

static CONTEXTUAL_USER_FRAGMENTS: &[&dyn FragmentRegistration] = &[
    &USER_INSTRUCTIONS_REGISTRATION,
    &ENVIRONMENT_CONTEXT_REGISTRATION,
    &SKILL_INSTRUCTIONS_REGISTRATION,
    &USER_SHELL_COMMAND_REGISTRATION,
    &TURN_ABORTED_REGISTRATION,
    &SUBAGENT_NOTIFICATION_REGISTRATION,
```

## Changed `change-003`

<!--
id: change-003
kind: change
beforeLines: none
afterLines: 37
-->

```diff id=change-003
+     &GOAL_CONTEXT_REGISTRATION,
```

## Same `same-004`

<!--
id: same-004
kind: same
beforeLines: 34-78
afterLines: 38-82
-->

```text id=same-004 side=both
];

fn is_standard_contextual_user_text(text: &str) -> bool {
    CONTEXTUAL_USER_FRAGMENTS
        .iter()
        .any(|fragment| fragment.matches_text(text))
}

pub(crate) fn is_contextual_user_fragment(content_item: &ContentItem) -> bool {
    let ContentItem::InputText { text } = content_item else {
        return false;
    };
    parse_hook_prompt_fragment(text).is_some() || is_standard_contextual_user_text(text)
}

pub(crate) fn parse_visible_hook_prompt_message(
    id: Option<&String>,
    content: &[ContentItem],
) -> Option<HookPromptItem> {
    let mut fragments = Vec::new();

    for content_item in content {
        let ContentItem::InputText { text } = content_item else {
            return None;
        };
        if let Some(fragment) = parse_hook_prompt_fragment(text) {
            fragments.push(fragment);
            continue;
        }
        if is_standard_contextual_user_text(text) {
            continue;
        }
        return None;
    }

    if fragments.is_empty() {
        return None;
    }

    Some(HookPromptItem::from_fragments(id, fragments))
}

#[cfg(test)]
#[path = "contextual_user_message_tests.rs"]
mod tests;
```

## Comments

<!-- Comments are stored by the prompt_reviews app. Select exact text in this generated review and add a comment. -->
