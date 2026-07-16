# Packet 03: Target Owner Boundaries

Status: closed.

## Purpose

Decide which successor target owns each major repeated rule family and where
short local reminders are allowed because a local seam can violate the rule.

## Scope

This packet owns owner, local-reminder, and pointer-only routing for repeated
rule families. It uses Packet 02's target set and Pass 2B.5's repeated-rule
families, but it does not write successor prose or decide source feeds.

## Required Grounding

- `local/goal_research/pass2c_rewrite_plan/packet-02-successor-target-inventory.md`
- `local/goal_research/PASS2_CONCEPT_LEDGER.md`
- `local/goal_research/pass2b_target_interfaces/README.md`
- completed Pass 2B target-interface packets 1-5
- `local/goal_research/pass2b_target_interfaces/repeated-authority-canonicalization.md`
- completed Pass 2B.5 repeated-authority batch files
- relevant source docs for any contested owner boundary

No source-backed owner dispute remained after checking the Pass 2B and Pass
2B.5 routing inputs. If a later source-slice read finds a contradiction, it
must reopen this packet or record an explicit user-review question before
rewriting that source slice.

## Decisions

Pointer-only default: for each row, any target not listed as an owner, local
seam reminder, or operational/test/vocabulary reminder is pointer-only.
Pointer-only targets may link to the owner but must not restate behavior as if
they own it.

The third column may include two reminder kinds:

- local seam reminders, where the target's seam can directly violate the rule
- short operational, test, navigation, or vocabulary reminders, which must stay
  non-authoritative

| Rule family | Owner target(s) | Local or operational reminders allowed |
| --- | --- | --- |
| Final request-input developer-role proof | `T-FINAL` owns concrete proof, shaping, commit, fingerprints; `T-BEHAVIOR` owns the behavior-level authority definition. | `T-CADENCE`, `T-CLEANUP`, `T-EXT`, `T-TEST-PREP`; `NAV-README`, `GLOSSARY`, and `OP-AGENTS` may keep routing or vocabulary only. |
| Pending Initial, ObjectiveUpdated, and BudgetLimit until commit | `T-DURABLE` owns pending-intent shape and durable facts version; `T-FINAL` owns commit timing and consumption call timing. | `T-CADENCE`, `T-IDLE`, `T-EXT`, `T-TEST-PREP`; `OP-AGENTS` may keep a short invariant. |
| Exact-key consumption | `T-DURABLE` owns exact-key store semantics; `T-FINAL` owns when commit may call consumption. | `T-CADENCE`, `T-IDLE`, `T-TEST-PREP`. |
| Active durable state alone is not steering or cadence authority | `T-BEHAVIOR` owns the negative authority rule; `T-CADENCE` owns the cadence-required predicate; `T-DURABLE` owns state non-ownership. | `T-FINAL`, `T-CLEANUP`, `T-IDLE`, `T-EXT`; `OP-AGENTS` may keep a short invariant. |
| Ordinary user turns are not cadence events | `T-CADENCE` owns ordinary-turn cadence limits; `T-IDLE` owns pending-work precedence and idle ordering. | `T-FINAL`, `T-TEST-PREP`; `OP-AGENTS` may keep a short invariant. |
| Automatic Continuation and watermarking | `T-IDLE` owns selection and lifecycle; `T-HISTORY` owns key and watermark comparison; `T-FINAL` owns commit-time advancement. | `T-CADENCE`, `T-DURABLE`, `T-EVIDENCE`, `T-TEST-PREP`; `OP-AGENTS` may keep a short pointer. |
| Resume hydration | `T-IDLE` owns hydration ordering; `T-DURABLE` owns reloaded facts and pending intent; `T-HISTORY` owns suppression basis. | `T-CADENCE`, `T-EVIDENCE`, `T-TEST-PREP`; `OP-AGENTS` may keep a short invariant. |
| Retry, follow-up, and same-turn cadence recheck metadata | `T-FINAL` owns retry/follow-up shaping and commit timing; `T-IDLE` owns synthetic metadata lifecycle and same-turn wake routing. | `T-CADENCE`, `T-DURABLE`, `T-HISTORY`, `T-EVIDENCE`, `T-EXT`, `T-TEST-PREP`. |
| Current-turn carry | `T-FINAL` owns committed carry metadata. | `T-CLEANUP`, `T-IDLE`, `T-HISTORY`, `T-TEST-PREP`; `OP-AGENTS` may keep a pre-finalizer carry warning. |
| Request repair is request-local, not cadence | `T-CLEANUP` owns classifier and repair semantics; `T-FINAL` owns repair inside final input; `T-CADENCE` owns the negative cadence rule. | `T-IDLE`, `T-TEST-PREP`; `OP-AGENTS` may keep a short invariant. |
| Classifier, provenance, helper output, and projection are not authority | `T-CLEANUP` owns classifier/projection details; `T-BEHAVIOR` owns the negative authority rule; `T-FINAL` owns the only authority seam. | `T-EXT`, `T-SHIM`, `T-TEST-PREP`; `GLOSSARY` may define terms only. |
| Structured recorded request evidence | `T-EVIDENCE` owns carrier, shape, persistence timing, replay, and audit semantics; `T-FINAL` owns finalized-input identity supplied to evidence. | `T-DURABLE`, `T-HISTORY`, `T-CLEANUP`, `T-TEST-PREP`, `T-READINESS`. |
| Raw response item notifications remain raw | `T-CLEANUP` owns raw/projection distinction. | `T-EVIDENCE`, `T-TEST-PREP`; `OP-AGENTS` may keep a short invariant. |
| Compaction, reconstruction, rollback, and fork | `T-CLEANUP` owns cleanup/reconstruction behavior; `T-HISTORY` owns key effects; `T-EVIDENCE` owns structured committed metadata; `T-FINAL` owns carry/repair at final input. | `T-BEHAVIOR`, `T-DURABLE`, `T-TEST-PREP`; `OP-AGENTS` may keep runtime-archaeology warning. |
| Extension reachability and steering-role config compatibility | `T-EXT` owns lifecycle, configuration, reachability, mutation routing, and producer-facing metadata. | `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-SHIM`, `T-TEST-PREP`. |
| Fake-shim removal | `T-SHIM` owns demolition terrain and work-area routing; `T-CLEANUP` owns replacement classifiers/projection; `T-FINAL` owns replacement final-input shaping. | `T-BEHAVIOR`, `T-EXT`, `T-TEST-PREP`; `OP-AGENTS` may keep an active-shim removal invariant. |
| Replacement testing and upstream baseline | `T-TEST-PREP` owns prep sequence, upstream baseline restoration, replacement matrix, local overlay deletion, and snapshot handling. | `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-EXT`, and `T-SHIM` keep proof obligations for the behavior or seam they own; `OP-AGENTS` may keep a pointer. |
| Navigation, glossary, agents, and readiness surfaces | `NAV-README` owns reader navigation; `GLOSSARY` owns vocabulary; `OP-AGENTS` owns operational instruction; `T-READINESS` owns readiness and handoff criteria. | These surfaces may keep short warnings and pointers only. All behavior and seam details point to the owning target docs. |

Coverage note: this table follows the Pass 2B.5 repeated-family list. It does
not add separate rows for narrower concepts already covered by those families,
such as supersedence, feature/collaboration eligibility, purity rules, legacy
artifact handling, snapshot handling, or design-readiness wording. Later
source-slice packets must still consult the concept ledger and source docs
when those clauses appear in a source slice.

## Output Expected

A compact owner-boundary routing table that later source-feed, slice-order, and
repeated-authority packets can reference without recreating Pass 2B entries.

## Closure Criteria

- Each listed rule family has one owner or an explicit split owner.
- Local seam reminders are justified by a seam that can directly violate the
  rule.
- Operational, test, navigation, and vocabulary reminders stay
  non-authoritative.
- Pointer-only targets do not silently own behavior.
- Support, test, readiness, navigation, glossary, and operations targets do
  not become behavior engines.
- No source-feed map, source-slice order, successor draft, or source-slice
  record is created.

## Non-Goals

- Mapping source docs to targets.
- Choosing source slice units or source slice order.
- Writing successor authority prose.
- Defining repeated-authority compression gates.
- Defining audit checklists or cutover gates.
