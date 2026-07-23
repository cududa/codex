# Source Corpus Map

This map inventories source terrain for skill/plugin/app invocation research.
It is not behavior authority.

## Status Values

- `candidate`: known terrain, not yet read deeply.
- `sampled`: read lightly and understood enough for routing.
- `mapped`: source category and consequences recorded.
- `conflict`: terrain raises a decision that must be resolved.
- `rejected`: not part of invocation authority research except as related
  terrain.

## Core Question

Which source categories can carry an operative invocation, and which merely
produce model-visible text?

## Initial Source Categories

| Category | Current known carrier | First instinct | Status | Notes |
| --- | --- | --- | --- | --- |
| Direct user turn | `Op::UserInput` -> `TurnInput::UserInput` -> `UserInput` | Invocation-bearing. | sampled | Current working path for structured skills and `$skill` text. |
| Structured skill selection | `UserInput::Skill` | Invocation-bearing when enabled and path-valid. | sampled | Current collector prioritizes structured selections by path. |
| Structured mention selection | `UserInput::Mention` | Invocation-bearing for app/plugin paths according to mention kind. | sampled | Needs split between app, plugin, mcp, skill path handling. |
| Plain text skill mention | `UserInput::Text` with `$name` | Invocation-bearing only for accepted sources. | sampled | Current bug is whether non-`UserInput` sources can ever be accepted. |
| Linked text mention | Markdown link to `skill://`, `plugin://`, `app://`, or related paths | Candidate invocation-bearing only for accepted sources. | candidate | Needs exact syntax and sigil treatment. |
| Additional context | Additional context converted into `ResponseItem` before/alongside user input | Unknown. | candidate | May be context, not a fresh operative instruction. |
| Active-turn injected response items | `Session::inject_if_running`, `InputQueue` pending input | Unknown. | candidate | Must separate tool/runtime injection from user steering. |
| Mailbox/inter-agent communication | `InterAgentCommunication` -> `ResponseItem` | Open. | candidate | It can be model-visible and task-like; policy is not obvious. |
| Goal continuation or cadence text | Goal-related pending input and response-shaped carry | Likely not owned here, but related terrain. | candidate | Goal authority docs reject pre-request item authority for Goal steering. |
| Hook output | Hook-provided context or continuation text | Likely not invocation-bearing by default. | candidate | Needs hook terrain read before deciding. |
| Guardian/review evidence | Guardian prompts, review task inputs, quoted evidence | Non-operative by default. | candidate | Must not become a way to invoke tools from quoted text. |
| Tool outputs | `ResponseInputItem::*Output`, `ResponseItem::*Output` | Non-operative. | candidate | Tool output can contain arbitrary text. |
| Assistant output | `ResponseItem::Message` role assistant | Non-operative. | candidate | Should not invoke new skills from model-generated text. |
| Developer/system context | `ResponseItem::Message` role developer/system | Open. | candidate | Some developer context is instruction; some is ambient context. |
| Compaction output | `ResponseItem::Compaction`, compacted messages | Non-operative unless explicitly rehydrated by a trusted source. | candidate | Replay/summary text can quote prior invocations. |
| Rollout reconstruction/fork history | `RolloutItem::ResponseItem` -> history/request input | Non-operative by default. | candidate | Replaying a transcript should not reinvoke skills merely from old text. |
| Session start/plugin capability sections | injected developer guidance | Not invocation source. | candidate | It is the result of selection/exposure, not the cause. |
| Skill body injection | user-role `<skill>` item | Not invocation source. | candidate | Skill bodies can mention other tools; app extraction from skill bodies is separate terrain. |

## Initial Terrain Anchors

| Terrain | Why it matters | Status |
| --- | --- | --- |
| `local/skill_invocation_bug.md` | Bug statement and initial anchors. | sampled |
| `codex-rs/core/src/session/input_queue.rs` | `TurnInput` carriers and pending input flow. | sampled |
| `codex-rs/core/src/session/turn.rs` | `build_skills_and_plugins`, request loop, prompt construction. | sampled |
| `codex-rs/core-skills/src/injection.rs` | Skill mention extraction and selection semantics. | sampled |
| `codex-rs/core/src/plugins/mentions.rs` | Plugin/app mention collection from `UserInput`. | sampled |
| `codex-rs/core/src/session/handlers.rs` | User input plus additional context route into tasks. | candidate |
| `codex-rs/core/src/session/inject.rs` | Response-item injection into active work. | candidate |
| `codex-rs/core/src/session/mod.rs` | Submission, pending input, and active-turn routing. | candidate |
| `codex-rs/core/src/tasks/review.rs` | Task-specific filtering of `TurnInput`. | candidate |
| `codex-rs/core/src/agent/control.rs` | Subagent communication and user input formatting terrain. | candidate |
| `codex-rs/core/src/tools/handlers/multi_agents_v2/` | Mailbox and follow-up task behavior. | candidate |
| `codex-rs/core/src/hook_runtime.rs` | Hook inspection and additional context terrain. | candidate |
| `codex-rs/core/src/guardian/` | Guardian prompt/evidence handling terrain. | candidate |
| `codex-rs/core/src/compact*.rs` | Compaction/replay text terrain. | candidate |
| `codex-rs/core/tests/suite/skills.rs` | Existing user-turn proof for skill injection. | sampled |
| `codex-rs/core/tests/suite/plugins.rs` | Existing plugin capability and exposure proof. | sampled |

## Research Notes

- `build_skills_and_plugins` currently derives a `Vec<UserInput>` by dropping
  response-shaped turn input. That is a confirmed terrain fact, not a complete
  diagnosis.
- The first durable design question is whether invocation authority attaches to
  source provenance, structured selection, message role, turn timing, or some
  combination.
- Final outbound model input is a proof surface for injection effects, but not
  necessarily the owner of invocation selection policy.

