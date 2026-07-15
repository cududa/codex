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
skill fragments are registered as contextual user fragments.

- /c:/Users/cullendudas/Documents/GitHub/codex-pinned/codex-rs/core/src/compact_remote.rs:315: compacted
history filtering.

- /c:/Users/cullendudas/Documents/GitHub/codex-pinned/codex-rs/core/src/compact_remote.rs:321: drops developer
messages.

- /c:/Users/cullendudas/Documents/GitHub/codex-pinned/codex-rs/core/src/compact_remote.rs:322: user messages
only survive if they parse as real user/hook items, which <skill> does not.

One-line summary to send:

> Bug: skills are only injected from TurnInput::UserInput; ResponseInputItem/queued/goal/mailbox text can
> mention $skill and be model-visible but won’t trigger <skill> injection. Separately, injected <skill> bodies
> are contextual user fragments and get filtered during compaction, so workflow skills lose their full body
> unless explicitly reinvoked or shell-read again.



---


Storage Found

- JSONL sessions: C:\Users\cullendudas\.codex\sessions\YYYY\MM\DD\rollout-*.jsonl
- Prompt history: C:\Users\cullendudas\.codex\history.jsonl
- SQLite state: C:\Users\cullendudas\.codex\state_5.sqlite
- relevant tables: threads, stage1_outputs
- SQLite logs: C:\Users\cullendudas\.codex\logs_2.sqlite
- relevant table: logs
- SQLite goals: C:\Users\cullendudas\.codex\goals_1.sqlite
- relevant table: thread_goals
- I avoided reading/reporting auth.json and config.toml contents.

Core Evidence
task-alignment is presented three ways in stored sessions:

1. Developer skill catalog, under role:"developer" inside <skills_instructions>.
Example: C:/Users/cullendudas/.codex/sessions/2026/07/01/rollout-2026-07-01T18-05-57-019f1fb7-a553-70a0-
b2f2-c09a265b4fdb.jsonl:3

- task-alignment: Use when working in an existing repository ... Requires a visible Direction Lock
checkpoint before execution.
(file: C:/Users/cullendudas/Documents/GitHub/review-dedeluger/.codex/skills/task-alignment/SKILL.md)

2. Full skill body injected as a role:"user" message.
Example same session:
- line 6: user says Doing this as a docs first implementation with $task-alignment...
- line 8: separate user message begins:

<skill>
<name>task-alignment</name>
<path>C:\Users\cullendudas\Documents\GitHub\review-dedeluger\.codex\skills\task-alignment\SKILL.md</path>
---
name: task-alignment
description: ...
...
# Task Alignment
...
</skill>

3. Agent then often reads the file itself via shell.
Example same session:
- line 11 assistant: I’ll use task-alignment...
- line 12 function call: Get-Content ...\.codex\skills\task-alignment\SKILL.md
- line 18 function output contains the same skill body.

Reinvocation Pattern
Across review-dedeluger sessions I found:

- 356 sessions with task-alignment-related markers.
- 72 sessions where the full <skill><name>task-alignment</name>... body appears as a user message.
- 36 sessions where the full skill body appears more than once.
- 120 sessions with Direction Lock messages but no full skill body.

So later turns do both:

- If the user explicitly mentions $task-alignment, the stored transcript often gets another full <skill> user
message.
- In many later/resumed turns, the transcript only shows Direction Lock behavior and/or assistant wording,
without the full skill body.

Concrete repeated example:
C:/Users/cullendudas/.codex/sessions/2026/07/04/rollout-2026-07-04T22-00-36-019f3001-8e2b-73d1-919d-
0a3343009998.jsonl:113

line 113 user: $task-alignment ...
line 115 user: <skill><name>task-alignment</name>...
line 160 assistant: ## Direction Lock ...

That same session had 14 full skill-body user injections and 24 Direction Lock messages.

Compaction / Summary Signals
JSONL turn_context.summary frequently becomes:

"summary": "auto"

This marks compaction/resume state, but does not include the actual summary text.

state_5.sqlite.stage1_outputs stores memory summaries. Relevant findings:

- stage1_outputs contains summaries mentioning task-alignment and Direction Lock.
- It does not contain the raw <skill> body:
- query count for <name>task-alignment</name> in stage1_outputs: 0
- Example summary wording:

Read the task-alignment authority docs...
used a visible Direction Lock checkpoint...

I did not find evidence that compaction reinjects the full skill body. The evidence points to:

- summaries preserve references to task-alignment/Direction Lock,
- resumed/new rollouts re-add the developer skill catalog,
- explicit later $task-alignment mentions cause fresh full skill-body user injections.

SQLite Notes
logs_2.sqlite mostly mirrors low-level runtime/log stream data. Searches for skill_invocation did not reveal
clean historical structured skill-invocation records for review-dedeluger; the hits were current search text,
source-code snippets, or low-level traces. goals_1.sqlite had one relevant goal objective mentioning $task-
alignment, but it was not the primary evidence source.

Supplemental investigation notes / useful queries

Scope:
- Search only under C:\Users\cullendudas\.codex unless explicitly expanding.
- Avoid printing auth/config secrets. Do not inspect auth.json/config.toml content unless needed, and redact.
- Primary repo of interest: C:\Users\cullendudas\Documents\GitHub\review-dedeluger.
- Primary skill of interest: task-alignment.

Important files:
- C:\Users\cullendudas\.codex\sessions\YYYY\MM\DD\rollout-*.jsonl
- C:\Users\cullendudas\.codex\history.jsonl
- C:\Users\cullendudas\.codex\state_5.sqlite
- C:\Users\cullendudas\.codex\logs_2.sqlite
- C:\Users\cullendudas\.codex\goals_1.sqlite

Useful rg commands:
- Find sessions mentioning both repo and skill:
rg -l --glob '*.jsonl' "review-dedeluger.*task-alignment|task-alignment.*review-dedeluger" C:
\Users\cullendudas\.codex\sessions C:\Users\cullendudas\.codex\history.jsonl

- Find full skill injections:
rg -n --glob '*.jsonl' "<skill>|<name>task-alignment</name>|</skill>" C:\Users\cullendudas\.codex\sessions

- Find Direction Lock evidence:
rg -n --glob '*.jsonl' "Direction Lock|Code-shape temptation|Locked direction" C:
\Users\cullendudas\.codex\sessions

- Find developer skill catalog entries:
rg -n --glob '*.jsonl' "skills_instructions|review-dedeluger/.codex/skills/task-alignment|review-dedeluger\\\
\.codex\\\\skills\\\\task-alignment" C:\Users\cullendudas\.codex\sessions

- Find possible compaction/resume indicators:
rg -n --glob '*.jsonl' '"summary":"auto"|"summary": "auto"|compaction|compact|rollout_summary|raw_memory' C:
\Users\cullendudas\.codex\sessions C:\Users\cullendudas\.codex\history.jsonl

High-value example sessions already seen:
- C:\Users\cullendudas\.codex\sessions\2026\07\01\rollout-2026-07-01T18-05-57-019f1fb7-a553-70a0-b2f2-
c09a265b4fdb.jsonl
Shows order: developer skill catalog, user AGENTS/env, user mentions $task-alignment, then full <skill> user
message, then assistant reads SKILL.md and emits Direction Lock behavior.

- C:\Users\cullendudas\.codex\sessions\2026\07\04\rollout-2026-07-04T22-00-36-019f3001-8e2b-73d1-919d-
0a3343009998.jsonl
Good repeated-invocation case: many user_skill_body injections and many Direction Lock messages in one long
thread.

- C:\Users\cullendudas\.codex\sessions\2026\06\22\rollout-2026-06-22T18-51-56-019ef188-83a2-7012-bce8-
453561222e9e.jsonl
Early/relevant case: developer catalog + shell read of skill + later user asks docs-first using $task-
alignment and full skill body appears.

SQLite schema facts:
- state_5.sqlite:
- threads(id, rollout_path, cwd, title, git_sha, git_branch, git_origin_url, first_user_message,
preview, ...)
- stage1_outputs(thread_id, raw_memory, rollout_summary, source_updated_at, ...)
- logs_2.sqlite:
- logs(id, ts, level, target, feedback_log_body, thread_id, process_uuid, ...)
- goals_1.sqlite:
- thread_goals(thread_id, goal_id, objective, status, ...)

Useful SQLite read-only queries:
- Review Dedeluger thread inventory:
SELECT id, created_at, updated_at, cwd, git_branch, git_sha, git_origin_url, title, first_user_message,
preview
FROM threads
WHERE cwd LIKE '%review-dedeluger%' OR git_origin_url LIKE '%review-dedeluger%'
ORDER BY created_at DESC;

- Memory/summary references:
SELECT thread_id, source_updated_at, usage_count, raw_memory, rollout_summary
FROM stage1_outputs
WHERE raw_memory LIKE '%task-alignment%'
OR rollout_summary LIKE '%task-alignment%'
OR raw_memory LIKE '%Direction Lock%'
OR rollout_summary LIKE '%Direction Lock%'
ORDER BY source_updated_at DESC;

- Check if full skill body entered memory summaries:
SELECT count(*)
FROM stage1_outputs
WHERE raw_memory LIKE '%<name>task-alignment</name>%'
OR rollout_summary LIKE '%<name>task-alignment</name>%';

Previous result was 0, which supports: summaries preserve references to task-alignment/Direction Lock but not
raw full skill body.

- Logs search, filtering out current investigation noise:
SELECT id, ts, level, target, thread_id, process_uuid, substr(feedback_log_body, 1, 2000)
FROM logs
WHERE feedback_log_body LIKE '%task-alignment%'
OR feedback_log_body LIKE '%<name>task-alignment</name>%'
OR feedback_log_body LIKE '%skill_invocation%'
ORDER BY ts DESC
LIMIT 100;

Useful parser approach:
- Parse JSONL structurally, not with raw grep alone.
- Key record shapes:
- type=session_meta: payload.cwd, payload.git.repository_url, payload.id
- type=turn_context: payload.cwd, payload.summary
- type=response_item + payload.type=message:
- payload.role=developer with <skills_instructions>
- payload.role=user with full <skill> block
- payload.role=assistant with Direction Lock
- type=response_item + payload.type=function_call:
- shell_command reading .codex\skills\task-alignment\SKILL.md
- type=response_item + payload.type=function_call_output:
- output containing name: task-alignment and Direction Lock

Questions worth pulling next:
1. When did the system change from just listing skills in developer instructions to injecting the full <skill>
body as a user message?
2. Does a structured UserInput::Skill / skill selection record exist anywhere, or only rendered transcript
messages?
3. In repeated turns, is the full skill body injected only when the user writes $task-alignment, or also on
implicit triggers?
4. Are “summary:auto” rollouts true compactions, subagent/spawned sessions, or both?
5. Does logs_2.sqlite contain analytics events for skill injection, or only traces/source-code snippets
mentioning skill_invocation?
6. Does state_5.sqlite.stage1_outputs memory summarize Direction Lock content in a way that later agents can
use, even when the raw skill body is gone?

That should give a fresh agent enough handles to keep pulling without redoing the whole first pass.

---

