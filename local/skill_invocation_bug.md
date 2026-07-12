# Skill Invocation Bug: Response Items Are Visible But Non-Operative

## Summary

Skills are injected only when the turn input is represented as `TurnInput::UserInput`.
Some runtime paths feed already-shaped model input as `TurnInput::ResponseInputItem`
instead. Those items can contain text such as `$task-alignment` and be visible to
the model, but they do not trigger the skill invocation machinery that reads
`SKILL.md` and injects the full `<skill>` body.

In user terms: the transcript can look like the skill was invoked, but the runtime
did not actually invoke it.

## Confirmed Behavior

Normal user input works:

1. User submits `Use $task-alignment while reviewing this change.`
2. The turn contains `TurnInput::UserInput`.
3. `build_skills_and_plugins` scans the `UserInput`.
4. `collect_explicit_skill_mentions` detects `$task-alignment`.
5. Codex reads `SKILL.md`.
6. Codex injects a user-role `<skill>` item containing the full skill body.

Response-shaped/internal input does not work:

1. A queued task, goal continuation, mailbox item, or other internal path supplies
   text like `Continue using $task-alignment.`
2. The turn contains `TurnInput::ResponseInputItem`.
3. The text may be recorded into model-visible input.
4. `build_skills_and_plugins` skips that item for skill/plugin mention detection.
5. No full `<skill>` body is injected.

The model may still recover if it chooses to read `SKILL.md` with `shell_command`,
but that is model-choice-dependent progressive disclosure, not guaranteed runtime
skill invocation.

## Code Path

Primary v134 anchors:

- `codex-rs/core/src/session/input_queue.rs`: `TurnInput` has both
  `UserInput` and `ResponseInputItem`.
- `codex-rs/core/src/session/turn.rs`: `build_skills_and_plugins` builds
  `user_input` by accepting `TurnInput::UserInput`.
- `codex-rs/core/src/session/turn.rs`: the same filter drops
  `TurnInput::ResponseInputItem(_) => None`.
- `codex-rs/core/src/session/turn.rs`: skill mentions are collected only from
  the filtered `user_input`.
- `codex-rs/core-skills/src/injection.rs`: `collect_explicit_skill_mentions`
  only accepts `&[UserInput]`.

Commit anchor for the regression:

- `fbd4efa9ed6b9fe13dacd56247cc714903df72b7`
  `[codex] Use TurnInput for session task input (#24151)`

Related but not sufficient by itself:

- `f0663fd4fd531296bf34684e63e3ea029676c924`
  `[codex] Preserve steer input as user input (#23405)`

## Upstream Status

OpenAI upstream/main had not fixed this in the last investigation.

The newer upstream shape renames/evolves the skipped variants, but the behavior
is equivalent: `build_skills_and_plugins` still derives mention input only from
`TurnInput::UserInput { content, .. }` and skips response-shaped/inter-agent
items.

Observed upstream anchors:

- `upstream/main:codex-rs/core/src/session/turn.rs`: skips
  `TurnInput::ResponseItem(_) | TurnInput::InterAgentCommunication(_)`.
- `upstream/main:codex-rs/core-skills/src/injection.rs`: skill mention
  collection still scans `UserInput`.
- `upstream/main:codex-rs/core/src/plugins/mentions.rs`: plugin mention
  collection also scans `UserInput`.

## User-Visible Symptom

A user, goal, task, or agent workflow can contain text that looks like a skill
invocation. The model can see that text and may even say it is using the skill.
But the expected full skill body is absent from the model input.

Expected prompt/debug signature:

- `$task-alignment` or another skill mention appears in queued/generated input.
- No following user-role `<skill>...</skill>` injection appears.
- The agent may only get full instructions if it independently calls
  `shell_command` to read the skill file.

## Proposed Bug Fix Shape

Keep the fix narrow:

- Detect explicit skill/plugin mentions in appropriate response-shaped turn
  inputs before sampling.
- Avoid treating untrusted embedded transcripts, guardian prompts, or quoted
  evidence as fresh skill invocations.
- Add a regression test where a response-shaped turn input mentions a skill and
  the outbound model request includes the expected `<skill>` injection.
- Add parallel plugin/app mention coverage if the same extraction path is shared.

Do not solve durable skill carry in this bug fix. That is related, but separate.

## Research TODO: Post-Compaction Skill Presentation

Open question: if a skill was actively steering before compaction, should Codex
present a compact skill steering frame after compaction or resume?

Known current behavior:

- Explicit `$skill` injection records a full user-role `<skill>` item.
- That item is contextual user content, not durable runtime skill state.
- Compaction can remove the full body from history.
- The skill catalog may be rebuilt later, but that is only metadata and does not
  necessarily restore the active workflow body.

Research before designing:

- Trace exactly which compaction paths filter contextual user fragments and which
  paths rebuild canonical initial context.
- Compare this to `GoalSteeringFrame`: authority should come from typed runtime
  policy and model-input role, not accidental transcript residue.
- Decide whether active skill carry should be opt-in through skill YAML metadata.
- Decide whether post-compaction presentation should include a compact
  `SkillSteeringFrame`, a reference to reopen `SKILL.md` with `shell_command`, or
  both.
- Keep normal skills unchanged unless they explicitly opt into carry behavior.
- Do not assume the whole `SKILL.md` body must be preserved verbatim after
  compaction.

