# v133 Goal Remediation Plan

## Implementation Plan

This plan replaces the previous v133 remediation plan because that plan overcorrected into a false premise. Clean `rust-v0.133.0` does not remove core Goal tools, does not install `codex-goal-extension` into the main app-server runtime, and does not move hidden Goal steering construction into `ext/goal`.

The corrected premise is:

- v133 as shipped is the architecture baseline for this version.
- Local behavior must be carried through every live v133 Goal path.
- Do not preserve old local/core behavior as a parallel Goal theory.
- Do not invent a full extension-owner cutover that v133 itself does not provide.
- Clean v133 keeps production model Goal tools and runtime steering in core; adapt that core path.
- Clean v133 adds dedicated Goal storage and app-server lifecycle APIs; integrate those as the production state/client lifecycle substrate.
- Clean v133 also includes `codex-rs/ext/goal` as an extension crate/harness surface wired to Goal storage, but app-server does not install it as the production Goal model-tool owner.

The checked v133 evidence is:

- `rust-v0.133.0` registers production model Goal tools in `codex-rs/core/src/tools/spec_plan.rs` with `GetGoalHandler`, `CreateGoalHandler`, and `UpdateGoalHandler`.
- `rust-v0.133.0` constructs runtime Goal steering in `codex-rs/core/src/goals.rs` through `goal_context_input_item`.
- In clean v133, `codex-rs/app-server/src/extensions.rs` installs guardian and memories extensions, not `codex-goal-extension`.
- `b555dd5d1d6d` wires `codex-rs/ext/goal` to `StateRuntime`, but its installed surface is exercised by `ext/goal` tests via `install_with_backend`; it is not wired into the main app-server/core runtime as the production Goal model-tool owner.
- `0e9d22217897` adds/stabilizes app-server `thread/goal/set|get|clear` protocol surface and makes Goals default-on; it does not move production model Goal tools out of core.

The behavioral invariant is the center of the work:

```text
ResponseInputItem::Message {
  role: "developer",
  content: "<goal_context> ... <untrusted_objective>escaped objective</untrusted_objective> ... </goal_context>"
}
```

The frame is runtime-owned hidden Goal steering. The raw objective is escaped user-provided task data inside the frame. The objective does not become trusted developer-authored prose.

## Objective

Integrate the actual v133 Goal system while preserving the maintained local Goal behavior:

- developer-role hidden Goal steering by default;
- role-neutral `<goal_context>` markers;
- escaped `<untrusted_objective>` payload;
- source-authority prompt wording;
- `Initial`, `Continuation`, `BudgetLimit`, and `ObjectiveUpdated` steering kinds;
- strict model `update_goal complete|blocked` authority;
- app-server/TUI lifecycle control for pause/resume/clear/budget/status;
- correct accounting, event ordering, continuation suppression, and hidden-context hygiene.

## Non-Goals

Do not remove core Goal tool registration merely because a later upstream direction might do that. Clean v133 still registers `GetGoalHandler`, `CreateGoalHandler`, and `UpdateGoalHandler` in `codex-rs/core/src/tools/spec_plan.rs`.

Do not install `codex-goal-extension` as the main production Goal owner. Clean v133 does not do that.

Do not leave local v132/core behavior as a second Goal authority beside v133. The live v133 core paths should be adapted to the maintained contract, not treated as a separate local implementation.

Do not let the extension Goal code drift into a conflicting tool/accounting contract. Even if extension tools are not the main installed owner in clean v133, their schemas, status semantics, events, and accounting must match the maintained contract when present or tested.

Do not use later-version architecture references as plan requirements for v133.

## Decision

For v133, the production integration rule is:

```text
actual upstream v133 ownership + maintained local Goal behavior
```

This means:

- core remains a live v133 owner for model Goal tools and model-input steering where clean v133 still uses it;
- app-server `thread/goal/set|get|clear` remains the broad client lifecycle API;
- dedicated Goal storage is accepted as durable state/accounting substrate;
- `codex-rs/ext/goal` tool/accounting/lifecycle code is accepted and repaired as a real extension crate/test surface, but not promoted into production ownership;
- the local developer-role steering boundary must be present wherever v133 turns Goal state into model input.

## Patch 1: Reconstruct Clean v133 Goal Ownership In The Merge

Use clean `rust-v0.133.0` as the baseline for each live path before resolving local merge artifacts.

Record the owner and integration choice for:

- model tools: clean v133 core `GetGoalHandler`, `CreateGoalHandler`, `UpdateGoalHandler`;
- runtime steering: clean v133 core `GoalContext` / `goal_context_input_item` path;
- durable state: dedicated Goal store / `goals_1.sqlite` path;
- app-server lifecycle: `thread/goal/set`, `thread/goal/get`, `thread/goal/clear`, notifications, and running-thread hooks;
- TUI lifecycle: `/goal` create/edit/pause/resume/clear and Ctrl+C turn control;
- extension crate surfaces: `ext/goal` tool specs/executor, state runtime usage, lifecycle contributors, accounting, and tests, without production registration;
- hidden context/history: response item parsing, app-server raw surfaces, compaction/replay/replacement history.

Do this before deleting or promoting code. The purpose is to avoid both prior failure modes: keeping a stale local theory, or forcing a non-v133 extension-owner theory.

## Patch 2: Resolve Core Steering Around The Maintained Boundary

Resolve `codex-rs/core/src/goals.rs` conflicts by keeping the local typed steering boundary and adapting the clean v133 `GoalContext` shape into it.

Required behavior:

- preserve `GoalSteeringRole` config/runtime policy with local default `developer`;
- preserve `GoalSteeringMessage` or equivalent typed boundary carrying `Initial`, `Continuation`, `BudgetLimit`, and `ObjectiveUpdated`;
- render role-neutral `<goal_context>` markers;
- XML-escape objective text inside `<untrusted_objective>`;
- keep source-authority wording;
- emit `ResponseInputItem::Message` with the configured role, defaulting to `developer`;
- ensure running external goal mutations can schedule `Initial` or `ObjectiveUpdated` steering through that same boundary.

Reject or adapt clean v133 code that hardcodes active Goal steering role through `GoalContext::role() -> "user"`. The repair is not to discard `GoalContext`; it is to make role selection happen at the model-input boundary.

## Patch 3: Make `GoalContext` Marker/Hidden Infrastructure Role-Neutral

Resolve `codex-rs/core/src/context/goal_context.rs` by keeping the useful marker/render/detection infrastructure while removing authority-role hardcoding from active Goal steering.

Required behavior:

- `<goal_context>` remains the marker for hidden runtime Goal context;
- user-role and developer-role Goal context are both classified as contextual/hidden;
- `GoalContext` may provide marker rendering and parsing helpers;
- active steering role is supplied by `GoalSteeringRole` at the response-input boundary;
- tests in `codex-rs/core/src/context/contextual_user_message_tests.rs` resolve without reintroducing a user-role-only assumption.

Add or update tests that prove developer-role `<goal_context>` is hidden from normal transcript/history treatment and does not become ordinary user input.

## Patch 4: Preserve v133 Core Model Tools With Maintained Authority

Keep clean v133 core Goal tool registration. The checked v133 branch does not provide a production replacement path that installs `codex-goal-extension` as the app-server/core Goal model-tool owner.

Adapt core tool behavior to the maintained contract:

- `get_goal` reads durable Goal state;
- `create_goal` fails when a goal already exists;
- `update_goal` accepts only `complete` and strict `blocked` from the model;
- model tools cannot set `active`, `paused`, `budgetLimited`, or `usageLimited`;
- blocked wording includes the repeated same-condition, fresh-audit-after-resume, not-hard/slow/uncertain/incomplete, and missing-evidence-not-blocked rules;
- completion and blocked mutations flush/record accounting before terminal or stopped-state mutation where the live v133 path supports it;
- model-visible tool schema, descriptions, errors, and output follow the actual v133 production owner: core.

Do not introduce a production configuration where core and extension both register model-visible `get_goal`, `create_goal`, or `update_goal` tools. Extension-only harnesses that exercise `codex-rs/ext/goal` should keep it aligned with the same contract, but they are not evidence that v133 production has two Goal tool owners.

## Patch 5: Integrate v133 App-Server Lifecycle Without Widening Model Authority

Accept and repair app-server `thread/goal/set|get|clear` as the broad client lifecycle API.

Required behavior:

- app-server/user/client routes may create, edit, pause, resume, clear, and update budget/status according to lifecycle rules;
- model `update_goal` remains narrower: only `complete` or strict `blocked`;
- running-thread app-server mutations route through core/runtime hooks that can account, mutate durable state, emit ordered events, and schedule hidden steering when needed;
- offline/materialized-thread mutations persist and notify, but do not synthesize live-turn steering or continuation without an active runtime owner;
- `ThreadGoalUpdated` and `ThreadGoalCleared` ordering remains deterministic and follows durable mutation;
- app-server payloads and state rows do not define steering role.

Preserve the local TUI distinction:

- `/goal pause` is explicit lifecycle pause and may interrupt a running turn after setting paused;
- `/goal resume` resumes eligible stopped states;
- Ctrl+C is turn control and must not implicitly pause an active goal;
- queued user input and mailbox-trigger work still gate idle continuation.

## Patch 6: Repair Extension Goal Surfaces As v133 Surfaces, Not As Imaginary Main Owner

Clean v133 includes `codex-rs/ext/goal`, but does not install it as the main app-server/core Goal owner. Treat extension code as real extension crate/test surface area that must compile, test, and speak the same contract when exercised, without making it a production model-tool path.

Required behavior:

- remove stale backend/code-comment drift that prevents `ext/goal` from compiling cleanly;
- align `GoalToolExecutor` with the v133 `StateRuntime`/GoalStore-backed direction present in the branch;
- make extension `get_goal`, `create_goal`, and `update_goal` schema/validation/output equivalent to the maintained model tool contract;
- make extension `update_goal` support `complete` and strict `blocked`, not complete-only;
- flush active Goal progress before terminal/stopped mutation where extension accounting owns that information;
- clear current-turn Goal accounting after terminal/stopped mutation;
- emit ordered goal update events with correct turn attribution where the extension runtime has that context;
- exclude `update_goal` itself from ordinary progress accounting;
- keep generic abort from becoming implicit pause.

If extension lifecycle/accounting needs host callbacks to request `Initial`, `Continuation`, `BudgetLimit`, or `ObjectiveUpdated` steering, define those callbacks as typed steering requests into the existing host model-input boundary. Do not have extension code build untyped user-role reminders or invent a second prompt path.

## Patch 7: Accounting, Budget, Usage, And Continuation Semantics

Unify live v133 accounting behavior around the maintained contract.

Required behavior:

- active-turn accounting is flushed before `complete`, `blocked`, budget-limit, usage-limit, pause, clear, or other stopped/terminal transitions when progress exists;
- failed accounting flushes remain durable or retryable rather than silently dropped;
- budget exhaustion can move active/budget-limited state according to v133 rules and should request `BudgetLimit` steering through the same hidden steering boundary;
- usage-limit is system/API/account exhaustion, not a model-settable status;
- `UsageLimitReached` remains represented in runtime event/status handling where current code uses it;
- stopped states suppress continuation until explicit resume or valid lifecycle transition;
- continuation only fires when there is no pending user input, queued response item, mailbox-trigger work, or replay/compaction ordering requirement that should run first.

## Patch 8: Hidden Context, History, Raw App-Server Surfaces, And Compaction

Make hidden Goal context treatment explicit across the v133 surfaces.

Required behavior:

- developer-role and user-role `<goal_context>` are hidden/contextual;
- hidden Goal context is not ordinary user transcript, not visible history, and not slash-command objective authority;
- compaction/replacement history strips or suppresses old `<goal_context>` frames and regenerates active steering from durable Goal state when needed;
- raw `ResponseItem`/app-server diagnostic surfaces either suppress hidden Goal context by default or clearly classify it as diagnostic/runtime-only;
- rollback/history trimming handles both role variants;
- summaries never turn escaped `<untrusted_objective>` text into trusted instruction prose.

Update tests around response item parsing, remote compaction replacement, app-server history/read surfaces, and contextual developer/user message classification as needed.

## Per-Commit Handling

Treat the v133 Goal commits according to actual v133 ownership, not later-version assumptions.

- `ba57aab13a`: accept dedicated Goal DB/store as durable state and accounting substrate. Storage does not own steering authority.
- `0e9d22217897`: accept Goals becoming stable/default-on only after live v133 paths carry the maintained steering/tool/hidden-context contract.
- `ccbf0137db`: adapt contextual fragment infrastructure; reject hardcoded user-role active Goal steering.
- `b555dd5d1d6d`: accept extension Goal tools as real v133 surface; adapt schema/status/validation/accounting to the maintained contract without claiming extension already replaces core in v133.
- `c69cde3547c8`: accept lifecycle contributor infrastructure for extension accounting/tool progress; integrate without treating generic abort as pause or tool metadata as steering authority.
- `59507b8491` and `c5bd131567`: accept turn/tool metadata for correlation and accounting; metadata must not define steering authority.
- `d4f842f3b3`: adapt extension active-goal accounting and blocked support to strict blocked semantics, final accounting flush, ordered events, and continuation suppression.
- `d84b824d53`: accept preservation of failed accounting flushes.
- `afa0101ae2` and `f0663fd4fd`: accept input queue/UserInput distinctions; runtime Goal steering remains host-injected `ResponseInputItem`, not user input.
- Thread settings/collaboration-mode-adjacent commits: evaluate for side effects only; they must not become a container for active Goal content or bypass the typed Goal steering boundary.

## Verification

At minimum, add or update targeted tests for:

- developer-role `GoalSteeringRole` default and configured role serialization;
- `Initial`, `Continuation`, `BudgetLimit`, and `ObjectiveUpdated` rendering through the same boundary;
- `<goal_context>` role-neutral rendering with escaped `<untrusted_objective>`;
- developer-role Goal context hidden from normal history/transcript/compaction paths;
- clean v133 core Goal tool registration remains coherent and exposes strict `complete|blocked` update authority;
- app-server `thread/goal/set|get|clear` lifecycle mutations preserve model-tool authority boundaries;
- `/goal pause` versus Ctrl+C semantics;
- extension Goal tool schema/validation/output parity where the extension crate is compiled or tested;
- extension accounting/tool lifecycle flush, failed-flush preservation, and no generic abort pause;
- no implementation installs both core and extension Goal tools as competing model-visible production owners;
- remote compaction/replacement history strips or regenerates Goal context instead of summarizing stale frames.

Run the narrowest relevant Rust tests for changed crates/files. Do not run broad workspace suites unless explicitly requested.

## Done Criteria

The finding is done when:

- conflict markers and parked `REVIEW-DEDELUGER-INCOMING-DIFF` Goal blocks are resolved into real code or deliberately removed as superseded by equivalent implemented behavior;
- clean v133 ownership is accurately represented in code and tests;
- core live v133 Goal paths preserve developer-role hidden steering by default;
- v133 app-server and TUI lifecycle paths preserve the same behavioral contract;
- extension Goal surfaces compile and match the same tool/accounting semantics where present, without being promoted into a second production path;
- hidden Goal context is consistently hidden/regenerated across history and compaction;
- no plan text claims that v133 already completed a full extension-owner cutover, and no implementation keeps any second Goal path as a separate production authority.
