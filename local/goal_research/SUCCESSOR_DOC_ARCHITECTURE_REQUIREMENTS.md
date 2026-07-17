# Successor-Doc Architecture Requirements

This file records the Session 1 requirements for future Goal successor-doc
architecture design. It is a requirements artifact, not a topology blueprint,
successor authority draft, or implementation plan.

Use it as input when designing the successor document set. Do not use it as a
source-heading writing order or as a one-to-one map from Pass 2B target keys to
successor files.

## Reader Jobs

Implementation agents need to find the controlling behavioral contract, the
seam owner for the code they are touching, the negative rules that seam can
violate, and the work-area route decisions that refine implementation-shaped
details.

Planning agents need to see which concepts are settled, which surfaces own
them, which surfaces only remind or point, and where source coverage and
concept coverage must be checked before prose is rewritten.

Reviewers need fast access to high-risk tripwires: weakened authority,
duplicated or drifting authority, support mechanisms becoming authority, lost
edge cases, and route/source mismatches.

Maintenance agents need a durable reader path: authority order, document
roles, concept ownership, source coverage inventory, repeated-authority
compression guidance, and clear instructions for where future updates belong.

## Required Authority Surfaces

The successor architecture needs distinct surfaces for:

- Behavioral authority: what counts as Goal authority, active developer-role
  steering, and forbidden authority shapes.
- Cadence: Initial, ObjectiveUpdated, BudgetLimit, automatic Continuation,
  supersedence, ordinary user-turn limits, and repair-not-cadence boundaries.
- Durable state: Goal facts, facts version, pending intent, atomic mutation,
  and exact-key consumption.
- Final request input: per-attempt shaping, selected item identity, cleanup in
  shaping, commit point, retry/follow-up, current-turn carry, and final payload
  proof.
- Idle and history: idle ordering, pending-work precedence, synthetic turn
  metadata, Continuation selection, watermarking, resume hydration, and
  eligible progress projection.
- Evidence: structured recorded request evidence as replay/audit support, not
  authority or cadence selection.
- Cleanup/classifier/projection: request-local repair, legacy artifact
  handling, purity rules, compaction, reconstruction, rollback/fork, typed
  projection, and raw notification boundaries.
- Extension/reachability: lifecycle, mutation/accounting, adapter routing,
  config compatibility, and no independent active model-input construction.
- Test/readiness: upstream baseline, local overlay deletion, replacement proof
  matrix, snapshots, and readiness as handoff gate only.
- Navigation/operations/glossary: reader routing, operational authority order,
  conflict rules, vocabulary, and concise pointers.

## Required Navigation Properties

Each successor surface should make `owns`, `does not own`, local reminders,
pointer-only dependencies, source inputs, fidelity tripwires, and work-area
reconciliation needs visible.

Navigation must route by reader question and seam ownership, not by old
source-doc order. A reader asking "who decides this?" should land on the
canonical owner, while non-owner docs should either keep a local seam reminder
or point away.

The concept ledger remains the concept inventory. The traceability file remains
the source coverage inventory. Neither should become the writing sequence.

## Required Compression Behavior

Repeated authority should compress by meaning and seam risk:

- Canonical owner carries the full source-backed contract.
- Local reminders stay where that seam can directly violate the rule.
- Pointer-only references go where another surface owns the rule.
- Operational/test reminders stay short and non-authoritative.

Compression must not flatten negative rules, erase exceptions, or move
behavior into README, AGENTS, glossary, readiness, evidence, or test-prep
surfaces because those are easier to read.

## Required Reconciliation Behavior

Work-area route decisions must be reconciled where they clarify
implementation-shaped details: durable state/pending intent, final shaping and
commit, history key/idle lifecycle, extension mutation routing,
cleanup/projection/raw behavior, and final proof/testing.

If route material is more precise than older source wording and preserves the
underlying Goal concept, successor docs should absorb the route decision. If it
drops, inverts, or weakens a source concept, stop and name the conflict.

## Explicit Non-Goals

- Do not draft successor authority docs from this artifact.
- Do not choose final filenames from this artifact alone.
- Do not make one target key equal one successor doc by default.
- Do not write from source-heading rows.
- Do not execute implementation planning from this artifact.
- Do not preserve every repeated sentence.
- Do not let traceability, concept ledgers, Pass 2B interfaces, or work-area
  route docs become authority prose by themselves.

