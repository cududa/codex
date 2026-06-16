---
schema: prompt-review/v2
commit: abcdef1234567890
parent: 0000000000000000
shortCommit: abcdef1234
subject: "Fixture commit"
target: "continuation"
source:
  before: 0000000000000000:codex-rs/core/templates/goals/continuation.md
  after: abcdef1234567890:codex-rs/core/templates/goals/continuation.md
---

# continuation

## Changed `change-001`

<!--
id: change-001
kind: change
beforeLines: 1
afterLines: 1
-->

```diff id=change-001
- old objective wrapper
+ new objective wrapper
```

## Changed `change-002`

<!--
id: change-002
kind: change
beforeLines: 2
afterLines: 2
-->

```diff id=change-002
- duplicate phrase
+ duplicate phrase
```

## Changed `change-003`

<!--
id: change-003
kind: change
beforeLines: 3
afterLines: 3
-->

```diff id=change-003
- duplicate phrase
+ duplicate phrase
```

## Comments

<!-- Legacy comments are imported from comments.json for this fixture. -->
