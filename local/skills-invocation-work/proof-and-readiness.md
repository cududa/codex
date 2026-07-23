# Proof And Readiness

This document defines the proof and readiness posture for the skills invocation
research packet. It is not behavior authority.

## Core Rule

Proof validates the owning authority docs. It does not define invocation
behavior.

For this bug family, proof should show both sides:

- accepted invocation-bearing sources produce the expected skill/plugin/app
  guidance before sampling;
- model-visible-only, quoted/evidence, replay, tool-output, and rejected
  sources do not produce injection or tool exposure merely because they contain
  mention-looking text.

## Candidate Proof Clusters

| Future owner | Proof cluster | Initial terrain anchors |
| --- | --- | --- |
| `invocation-authority.md` | End-to-end accepted versus rejected source behavior for skills, plugins, and apps. | `codex-rs/core/tests/suite/skills.rs`; `codex-rs/core/tests/suite/plugins.rs` |
| `source-provenance.md` | Source classification tests or integration cases for direct user input, additional context, active injected input, mailbox communication, hook output, guardian/review evidence, compaction/replay, and assistant/tool output. | `session/input_queue.rs`; `session/handlers.rs`; `session/inject.rs`; `hook_runtime.rs`; `compact*.rs`; `guardian/` |
| `mention-resolution.md` | Parser and resolver tests for structured skills, `$name`, linked skill paths, plugin `@` links, app paths, ambiguity, disabled skills, and connector conflicts. | `core-skills/src/injection_tests.rs`; `core/src/plugins/mentions_tests.rs` |
| `injection-placement.md` | Captured outbound `/responses` request contains expected user-role `<skill>` items or developer plugin/app guidance in the correct turn, and not on replay/follow-up unless newly requested by an accepted source. | `core/tests/suite/skills.rs`; `core/tests/suite/plugins.rs`; `core/tests/common/responses.rs` |
| `proof-and-readiness.md` | Cold-reader review can identify authority docs, source policy, open decisions, proof clusters, and stop conditions without reading old work-packet notes. | future live docs |

## Negative Proof Requirements

At minimum, the eventual proof matrix should include rejected-source cases for:

- assistant message containing `$skill`
- tool output containing `$skill`
- compaction summary quoting `$skill`
- replayed or forked history containing `$skill`
- guardian or review evidence quoting `$skill`
- skill body text mentioning another skill
- additional context containing `$skill`, if source policy rejects it
- mailbox/inter-agent communication containing `$skill`, if source policy
  rejects or limits it

## Readiness Gate

Implementation planning may start only when:

- `source-corpus-map.md` classifies every relevant source category as mapped,
  rejected, or explicitly open with a blocker decision.
- `concept-ledger.md` has no unresolved `candidate` rows for core terms.
- `open-decisions.md` marks implementation-blocking questions as resolved or
  explicitly defaulted.
- `authority-map.md` names the future owning doc for every durable rule.
- The proof matrix includes at least one positive and one negative proof
  cluster for the chosen source policy.

Readiness does not mean code has been written, tests exist, or the branch is
green. It means the design inputs are mature enough to translate into ordered,
file-specific implementation slices.

## Cold-Reader Review Prompt

Use this prompt before calling the future live doc set ready:

```text
Read only the live skills invocation docs.

Produce a concise cold-reader review with these sections:

1. Authority map: list the live authority docs and what each owns.
2. Source policy: explain which sources can carry operative invocations and
   which are model-visible-only or rejected.
3. Mention semantics: explain how structured skill selections, plain text
   skill mentions, linked mentions, plugin mentions, and app mentions differ.
4. Injection placement: explain where runtime injection or tool exposure
   enters the turn before sampling.
5. Proof check: map each owning doc to the proof cluster that would apply if
   that seam changed.
6. Stop conditions: name what should stop implementation or planning.
7. Findings: list ambiguity, duplicated authority, missing owners, or any place
   where current source terrain appears to define behavior.
```

If the reviewer needs this work packet to answer normal behavior questions, the
future live docs are not ready.

