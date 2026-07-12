Primary Bug: Skill Mentions In ResponseInputItem Are Visible But Non-Operative

Codex can queue/model-feed input as TurnInput::ResponseInputItem, but skill/plugin mention detection only scans
TurnInput::UserInput. So text like $task-alignment can be visible to the model while failing to trigger full
<skill> injection.

Fast code path:

- /c:/Users/cullendudas/Documents/GitHub/codex-pinned/codex-rs/core/src/session/input_queue.rs:14: TurnInput
has both UserInput and ResponseInputItem.

- /c:/Users/cullendudas/Documents/GitHub/codex-pinned/codex-rs/core/src/session/turn.rs:445:
build_skills_and_plugins builds user_input.

- /c:/Users/cullendudas/Documents/GitHub/codex-pinned/codex-rs/core/src/session/turn.rs:448: accepts
TurnInput::UserInput.

- /c:/Users/cullendudas/Documents/GitHub/codex-pinned/codex-rs/core/src/session/turn.rs:449: drops
TurnInput::ResponseInputItem(_) => None.

- /c:/Users/cullendudas/Documents/GitHub/codex-pinned/codex-rs/core/src/session/turn.rs:504: skill mentions are
collected only from that filtered user_input.

- /c:/Users/cullendudas/Documents/GitHub/codex-pinned/codex-rs/core-skills/src/injection.rs:115:
collect_explicit_skill_mentions only accepts &[UserInput].

Secondary Baseline Bug: Full Skill Bodies Are Not Durable Across Compaction

Explicit $skill injects full SKILL.md as user-role <skill>, but that item is treated as contextual user content
and filtered from compacted history. After compaction/resume, the skill catalog may reappear, but the full
workflow body does not unless reinvoked or re-read via shell_command.

Fast code path:

- /c:/Users/cullendudas/Documents/GitHub/codex-pinned/codex-rs/core/src/context/skill_instructions.rs:23:
SkillInstructions role is user.

- /c:/Users/cullendudas/Documents/GitHub/codex-pinned/codex-rs/core/src/context/skill_instructions.rs:31:
markers are <skill>...</skill>.

- /c:/Users/cullendudas/Documents/GitHub/codex-pinned/codex-rs/core/src/context/contextual_user_message.rs:25:
- /c:/Users/cullendudas/Documents/GitHub/codex-pinned/codex-rs/core/src/compact_remote.rs:321: drops developer
messages.
only survive if they parse as real user/hook items, which <skill> does not.

One-line summary to send:

> Bug: skills are only injected from TurnInput::UserInput; ResponseInputItem/queued/goal/mailbox text can
> mention $skill and be model-visible but won’t trigger <skill> injection. Separately, injected <skill> bodies
> are contextual user fragments and get filtered during compaction, so workflow skills lose their full body
> unless explicitly reinvoked or shell-read again.

─────────────────────────────────────────────────────────────────────────────────────────────────────────────────

Thank you for this! And can you give me a bit more of a sense of what ResponseInputItem is / a sort of user
perspective scenario of how a user might think they're invoking a skill/ what they'd see etc


• ResponseInputItem is basically “already-shaped model input,” not raw user input.

UserInput is the higher-level thing Codex gets from a normal chat submission: typed text, structured skill
mention, image, app mention, etc. That path goes through skill detection.

ResponseInputItem is lower-level transcript/input material Codex queues or generates internally for the model:
goal continuations, mailbox/inter-agent messages, queued next-turn response items, task-generated prompts, and
similar “this should be fed to the model next” items.

The bug is that these can contain text that looks exactly like a skill invocation, but the skill scanner
ignores them.

Example user-perspective scenario:

1. You type a normal message:

Use $task-alignment while reviewing this change.

This becomes TurnInput::UserInput, so Codex detects $task-alignment, reads SKILL.md, and injects:

<skill>
<name>task-alignment</name>
...
full skill body
</skill>

2. Later, a runtime path continues work for you, for example a goal continuation, queued task, mailbox item, or
generated follow-up that says something like:

Continue the review using $task-alignment.

The model may visibly receive that text. You may see the agent say “I’ll use task-alignment.” But because
that input arrived as ResponseInputItem, build_skills_and_plugins skips it for skill detection, so no full
<skill> body is injected.

So from the user’s view, it feels like: “I invoked the skill; the transcript even says the skill name; why is
the agent not following it?” Internally, the answer is: the mention was present as model text, but it did not
go through the skill invocation machinery.

The symptom in logs/prompt debug would be:

- You see $task-alignment or “task-alignment” in a queued/generated input.
- You do not see a following user-role <skill>...</skill> injection.
- The agent may only recover if it chooses to read SKILL.md via shell_command, which is model-choice-dependent
rather than guaranteed.

fbd4efa9ed6b9fe13dacd56247cc714903df72b7
2026-05-22
[codex] Use TurnInput for session task input (#24151)

That commit changed build_skills_and_plugins from taking &[UserInput] to taking &[TurnInput], then added this
filter:

TurnInput::UserInput(content) => Some(content.as_slice()),
TurnInput::ResponseInputItem(_) => None,

So from that commit onward, skill/plugin detection only sees normal UserInput, not response-shaped queued/task/
goal/mailbox input.

Tag-wise: it is not in rust-v0.133.0, and first shows up in the rust-v0.134.0 line, including rust-v0.134.0-
alpha.3 and final rust-v0.134.0.

There is an earlier related commit:

f0663fd4fd531296bf34684e63e3ea029676c924
2026-05-19
[codex] Preserve steer input as user input (#23405)

That introduced/used the TurnInput split earlier in the v133 line, but I would not call it the bug by itself.
The actual regression is fbd4efa9ed, where session task input moved to Vec<TurnInput> and skill detection
started explicitly dropping ResponseInputItem.

For compaction: that is a separate issue. Full <skill> bodies being contextual user fragments and not durable
through compaction appears more like existing baseline behavior, with v134 making the pain more visible when
fewer paths reliably reinject the skill.