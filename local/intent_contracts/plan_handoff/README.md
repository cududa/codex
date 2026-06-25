# Plan Handoff Intent Contract

## Contract

When a user approves a Plan Mode plan and chooses the normal same-thread implementation path, the approved plan must be promoted into the next implementation turn as active user intent.

The implementation agent should receive the approved plan text in the new user message, not merely a short reference such as `Implement the plan.` The handoff should make clear that Plan Mode behavior has ended, while the approved plan itself remains the source of truth for the requested work.

## Why This Exists

The current same-thread Plan Mode handoff is too weak. It switches to Default mode and submits a synthetic user message:

```text
Implement the plan.
```

That relies on the prior assistant-authored `<proposed_plan>` still being visible, salient, untrimmed, and interpreted as user-approved intent. In practice, the implementation agent may re-read the codebase, treat the plan as a prior suggestion, and narrow the work to fit the existing implementation shape.

This is especially harmful for approved rewrite/refactor plans. Default-mode conservatism is useful for implementation details, but it should not silently reduce the scope the user already approved.

## Required Behavior

The normal "implement this plan" path should behave like the clear-context handoff in its treatment of the approved plan:

- Include the approved plan markdown in the implementation user message.
- Present the approved plan as the active user request and source of truth for scope.
- Distinguish mode behavior from plan intent: Plan Mode instructions are inactive, but the approved plan remains active.
- Re-read files to understand the terrain, validate assumptions, and execute the plan faithfully.
- Preserve explicit contracts and user-stated compatibility requirements without inventing broad hidden obligations from polished, abstract, or platform-shaped code.
- Preserve the plan's own type of work. For documentation plans, document. For investigation or bug-finding plans, investigate and follow the evidence. For rewrite/refactor plans, treat the existing code as terrain, not the mission: it should guide execution details without silently replacing the approved scope with a smaller local change.
- Adapt deliberately when concrete repo evidence conflicts with the plan. Existing implementation shape alone should not be treated as a scope boundary unless the approved plan or explicit contracts make it one.
- Treat a missing or empty approved plan artifact as a UI/state invariant break. Do not fall back to a weak same-thread prompt such as `Implement the plan.` because that recreates the behavior this contract exists to remove.

## Scope Authority

The approved plan defines the intended scope. The codebase informs how to execute that scope.

Explicit contracts, user-stated compatibility requirements, and concrete repo evidence can constrain or modify execution. Undocumented assumptions should not. The normal same-thread path and the clear-context path may differ in how much prior conversation remains visible, but they should not differ in the authority of the approved plan.

An implementation handoff requires an actual approved plan artifact. If the artifact is missing, the implementation action should be disabled or the popup should not be shown. The correct fix is to repair plan capture or popup gating, not to ask the model to infer the plan from prior assistant history.

## Prompt Shape

The exact wording can evolve, but the structure should remain:

```text
Implement the approved plan below. Treat it as the active user request and source of truth for scope.

Plan Mode behavior instructions are no longer active, but the approved plan remains active user intent. Re-read files to understand the terrain, validate assumptions, and execute the plan faithfully. Preserve explicit contracts and user-stated compatibility requirements. Do not infer broad hidden compatibility obligations from polished, abstract, or platform-shaped code.

Let repo evidence guide implementation details. If the plan is documentary, document. If it is investigative, follow the evidence. If it is a rewrite or refactor, existing code is terrain rather than the mission: understand it deeply, but do not let the current shape silently narrow the approved scope. If concrete correctness, feasibility, security, data-loss, or explicit-compatibility issues conflict with the plan, adapt deliberately and explain why.

{plan_markdown}
```

Future wording should be calm and confidence-building rather than harsh. The goal is to make following the plan feel natural to the agent, not to create anxiety or brittle overconstraint.

## Preserve During Upstream Merges

When rebasing or forward-porting upstream Codex changes, preserve this behavioral invariant even if file names or mode plumbing move:

> Approving a Plan Mode plan for normal implementation must inject the approved plan as current user intent.

Review these areas carefully:

- The Plan Mode implementation popup/action wiring.
- Any constants replacing or equivalent to `PLAN_IMPLEMENTATION_CODING_MESSAGE`.
- Code that stores or extracts the latest `<proposed_plan>` markdown.
- Collaboration mode transition prompts, especially Default-mode text that says prior Plan instructions are inactive.
- Context compaction or history-trimming paths that could weaken access to the approved plan.

## Non-Goals

This contract does not require preserving Plan Mode behavior after the switch to Default mode. The agent should be free to edit files, run implementation tools, and carry out the work normally.

This contract also does not require blindly executing an impossible, destructive, or concretely incompatible plan. If repo reality reveals a concrete blocker, the agent should adapt deliberately or report the issue. The important constraint is that existing code shape alone should inform the work, not silently redefine the user's approved intent.
