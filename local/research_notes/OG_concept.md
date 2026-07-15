InternalModelContextFragment {
    source: InternalContextSource::from_static("goal"),
    body: rendered_goal_prompt,
}
.into_response_item(ModelContextRole::Developer)

or equivalent.

So instead of a fake Goal-only wrapper builder, extend/generalize the real internal-context abstraction so it
can produce role-bearing model items:

pub enum InternalModelContextRole {
    User,
    Developer,
}

impl InternalModelContextFragment {
    pub fn into_response_item(self, role: InternalModelContextRole) -> ResponseItem {
        ResponseItem::Message {
            role: role.as_response_role().to_string(),
            content: vec![ContentItem::InputText {
                text: self.render(),
            }],
            id: None,
            phase: None,
        }
    }
}

Then Goal uses:

InternalModelContextFragment::new(
    InternalContextSource::from_static("goal"),
    prompt,
)
.into_response_item(InternalModelContextRole::Developer)

That is not fake wrapper logic. It uses the upstream v136 internal-context type as the content/provenance
renderer and gives it a real role-bearing serialization path.

Important distinction:

- InternalModelContextFragment owns rendering/provenance text.
- InternalModelContextRole / role-bearing conversion owns outer model role.
- Goal owns deciding when and what body to render.

That seems more future-compatible than goal_internal_context_response_item(...) as a bespoke helper, because
later Goal, memory, policy, or extension internal contexts may also need developer-role model items.

So I would correct the plan to prefer extending InternalModelContextFragment with an explicit role-bearing
conversion, rather than building a separate Goal-only fake renderer.

Here are the things I think are probably wrong or at least suspect in the plan shape I was steering toward.

1. The “Goal-specific builder” is probably the wrong abstraction.

goal_internal_context_response_item(...) sounded practical, but it bypasses the real v136 abstraction. Better:

InternalModelContextFragment::into_response_item(role)

or equivalent. Goal should not own internal-context serialization.

2. “Request ensurance” became too dominant.

A final request check is still useful, but I overstated it as the architecture. The real architecture should
be:

Goal lifecycle/cadence decides what steering is due.
InternalModelContextFragment renders/fragments it.
Role-bearing conversion gives developer authority.
Final request validation/dedupe proves it.

Not:

final boundary magically fixes Goal every time

3. I blurred “present each request” with “freshly inject every request.”

The model request must contain the active Goal when needed. But implementation should not blindly add a full
continuation reminder every sample. v130/v131 had meaningful cadence: initial, continuation after idle/batch,
objective update, budget limit.

4. I treated old rendered frames too aggressively as “stale.”

They are not durable authority, but in v130/v131 they were part of actual model-visible history. The clean rule
should be:

Do not trust old rendered frames as authority across reconstruction.
Do not necessarily panic if a current rendered frame is present in live history.

The important thing is dedupe/currentness, not deleting every Goal-looking item everywhere.

5. The “exactly one” invariant may need scope.

Exactly one active current Goal authority frame per request is right. But if a historical prior Goal frame
exists in old history and is not the current authority, the implementation decision needs care. Overbroad
filtering could alter conversation evidence. The safer narrow rule:

Only pure Goal steering artifacts are filtered/deduped.
Never mixed user content.
Current authority frame wins.

6. The role override is unresolved.

We kept saying “developer by default, user if explicitly configured.” But if your actual goal is “do not let
OpenAI nerf Goal,” maybe keeping goals.steering_role = "user" is not worth it. It may be legacy flexibility
that undermines the feature. This deserves an explicit decision, not inertia.

7. Fork semantics are unresolved.

I wrote “user-visible fork inherits Goal state” too confidently. Maybe some forks should inherit, maybe
subagents should not, maybe app-server thread fork should ask or follow source-thread semantics. That needs
policy, not assumption.

8. Extension ownership may change the right v136 slice.

If v138-v140 moves Goal ownership properly into ext/goal, v136 should avoid building a large core-only
mechanism that will immediately be torn out. The plan should define a small role-bearing internal-context API
and lifecycle intent interface that can move to extension ownership later.

9. I overused “wrapper.”

That word hid the actual shape and caused confusion. The plan should talk about:

ResponseItem::Message.role
ContentItem::InputText.text
InternalModelContextFragment::render()
final /responses input

10. The plan still needs a true shape decision: recorded history vs request-local.

v130/v131 recorded steering frames into history via pending input. My request-local language changed that
without enough proof. That is a big behavioral decision. We need to decide intentionally:

- record current Goal frames as conversation items, then dedupe/filter on reconstruction;
- or inject request-local frames only and never persist them;
- or hybrid: lifecycle frames recorded, final repair frame request-local.

I do not think we’ve actually settled this.

The shortest honest reset is:

The invariant is right.
The current plan architecture is not yet trustworthy.
Rewrite around exact ResponseItem shape, role-bearing InternalModelContextFragment,
v130/v131 cadence, and an explicit decision on persistence/request-local behavior.

---

pub(crate) fn shape_request_input(
    base_input: Vec<ResponseItem>,
    context: GoalRequestContext,
) -> GoalRequestInputOutcome;

Where GoalRequestInputOutcome can be:

Submit {
    input: Vec<ResponseItem>,
    commit: Option<GoalRequestCommit>,
    repair_report: GoalRepairReport,
}

AbortGoalOwnedTurn {
    reason: GoalRequestAbortReason,
    repair_report: GoalRepairReport,
}


- Replace the wording “developer-role internal-context ResponseItem.” That leaks the bad abstraction back in. The
authority object is simply a final model-input ResponseItem::Message { role: "developer", ... }. Source
tagging/classification can exist, but it must not be presented as the authority shape.

- Prefer naming the function shape_request_input(...) or keep finalize_request_input(...) only as a narrow verb.
Do not name the module or concept “the finalizer” as a broad service.

- GoalRequestContext should not receive a precomputed committed model_visible_history_key for Continuation. The
cadence module should compute that key from base_input before inserting Continuation. It may receive stored
watermark/snapshot facts.

- GoalFinalizationOutcome needs an abort/no-submit outcome for stale Goal-owned synthetic turns. Idle candidates
can become stale; the shaper must be able to say “do not submit a model request.”

- SameTurnCadenceRecheck(GoalPendingCadenceDelivery) may be too selected. Same-turn metadata should probably mean
“recheck durable pending cadence now,” while the shaper selects from the fresh state snapshot. Carrying an
exact pending key is okay as evidence, but not as the sole authority.

- The proposal’s ext/goal/src/steering.rs path should be codex-rs/ext/goal/src/steering.rs.