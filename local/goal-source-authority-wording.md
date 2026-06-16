# Goal Source-Authority Wording

This note captures the local prompt wording intended to reduce artifact-proving failure modes in
goal continuation. It is not a broad instruction to avoid tools, docs, examples, tests, demos, or
repository evidence. Those sources remain valuable. The goal is to keep their authority tied to the
user's active objective instead of their proximity, concreteness, or recency in the context window.

## Candidate Wording

```text
Work from the sources that are authoritative for the current objective. Nearby repository artifacts, examples, demos, tests, and existing callers are valuable context for current integration patterns and historical behavior, but their authority depends on their relevance to the active objective. Use them to inform the work without letting proximity, concreteness, or recency narrow the requested outcome. When sources point in different directions, or after a long investigation through local artifacts, call get_goal to re-ground on the active objective before choosing the next implementation direction.
```

## Intent

- Keep evidence-oriented goal behavior, but stop local artifacts from silently becoming the task.
- Encourage the agent to classify source authority by task type.
- Treat existing demos, tests, callers, and docs as historical/contextual unless the active objective
  makes them authoritative.
- Re-ground with `get_goal` after long local investigation, when context-window drift is most likely.
- Preserve useful tool calls, including domain/API documentation tools, instead of treating tools as
  part of the failure mode.

## Failure Mode Addressed

A common failure shape:

1. The user sets a goal with a detailed implementation plan.
2. The agent researches enough to implement the intended capability.
3. Before execution, the agent searches local demos, tests, or existing callers for a concrete
   "lighthouse."
4. Nearby examples become overweighted because they are local, concrete, and fresh in context.
5. The implementation narrows, bends, or redefines itself around existing artifacts rather than the
   active objective.

The wording above tries to keep local examples useful for integration style without letting them
become accidental requirements.

## Notes For Forward-Porting

- In the 0.131 goal prompt, this wording should replace or soften the strongest parts of the
  "Work from evidence" and completion-audit source-authority language.
- In 0.132 and later, keep the same policy aligned with blocked-audit wording so "missing local
  artifact proof" does not become a repeated blocker by itself.
- In 0.133 and later, apply the policy at the goal-extension steering boundary as well as any legacy
  core prompt boundary.
