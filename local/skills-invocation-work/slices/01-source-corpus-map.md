# 01 Source Corpus Map

## Goal

Fill `source-corpus-map.md` with a code-grounded inventory of every source that
can become turn input, pending input, history, or final model request input.

The reader job is to distinguish source categories before deciding which ones
can carry operative invocations.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/skills-invocation-work/README.md`.
- `local/skills-invocation-work/source-corpus-map.md`.

## Target Files

- `local/skills-invocation-work/source-corpus-map.md`
- `local/skills-invocation-work/concept-ledger.md`
- `local/skills-invocation-work/open-decisions.md`

## Terrain

- `local/skill_invocation_bug.md`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/handlers.rs`
- `codex-rs/core/src/session/inject.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/tasks/review.rs`
- `codex-rs/core/src/agent/control.rs`
- `codex-rs/core/src/hook_runtime.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/guardian/`

## Decomposition Checkpoint

Do not decompose before reading the request-loop and pending-input spine.
Decompose only if source categories split into separate real seams, such as
user/direct input, runtime/pending input, replay/history, and review/guardian
evidence.

If decomposed, add `01z-consolidation.md` to verify every source category is
classified exactly once.

## Work Steps

1. Read the bug report and current source map.
2. Walk direct user submission into `TurnInput::UserInput`.
3. Walk response-shaped additional context and pending input producers.
4. Walk mailbox/inter-agent delivery into model-visible input.
5. Walk hook, guardian, review, compaction, replay, fork, and resume terrain
   enough to classify whether they can carry mention-looking text.
6. Update the source category table with status and notes.
7. Add any new source terms to `concept-ledger.md`.
8. Add source-policy questions to `open-decisions.md`.

## Definition Of Done

- The map names all known producers that can put mention-looking text into a
  turn or request.
- Each source has an initial classification: invocation-bearing candidate,
  model-visible-only candidate, quoted/evidence, replay/history, tool output,
  or open.
- The map separates observed code facts from design inference.
- Any source that cannot be classified without deciding behavior has an open
  decision.

## Verification

```text
rg -n "candidate" local/skills-invocation-work/source-corpus-map.md
git diff --check -- local/skills-invocation-work
```

