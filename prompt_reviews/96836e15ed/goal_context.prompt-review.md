---
schema: prompt-review/v2
commit: 96836e15ed0db0123302debd064c857af0fe8c8b
parent: c03eb20d8dacf7bdf237a0688d969d95c67048fe
shortCommit: 96836e15ed
subject: "Improve goal continuation based on feedback (#22045)"
target: "goal_context"
source:
  before: c03eb20d8dacf7bdf237a0688d969d95c67048fe:codex-rs/core/src/context/goal_context.rs
  after: 96836e15ed0db0123302debd064c857af0fe8c8b:codex-rs/core/src/context/goal_context.rs
---

# goal_context

## Changed `change-001`

<!--
id: change-001
kind: change
beforeLines: none
afterLines: 1-18
-->

```diff id=change-001
+ //! Hidden user-context fragment for runtime-owned goal steering prompts.
+ 
+ use super::ContextualUserFragment;
+ 
+ #[derive(Debug, Clone, PartialEq)]
+ pub(crate) struct GoalContext {
+     pub(crate) prompt: String,
+ }
+ 
+ impl ContextualUserFragment for GoalContext {
+     const ROLE: &'static str = "user";
+     const START_MARKER: &'static str = "<goal_context>";
+     const END_MARKER: &'static str = "</goal_context>";
+ 
+     fn body(&self) -> String {
+         format!("\n{}\n", self.prompt)
+     }
+ }
```

## Comments

<!-- Comments are stored by the prompt_reviews app. Select exact text in this generated review and add a comment. -->
