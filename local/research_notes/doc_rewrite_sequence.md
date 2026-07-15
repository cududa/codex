Pass 2A: Coverage And Concept Ledgers

Create two inventories before rewriting anything:

1. PASS2_SECTION_TRACEABILITY.md
   Maps every source heading/subheading to its proposed home, authority role, key clauses, edge cases, code/test
   anchors, action, and status.

2. PASS2_CONCEPT_LEDGER.md
   Tracks cross-cutting concepts across repeated authority: final-input proof, pending intent, exact-key
   consumption, retry, resume, raw notifications, compaction, extension reachability, current-turn carry,
   replacement tests, and similar.

No content moves in 2A. Repetition is recorded as repeated authority, not mechanically duplicated prose.

Pass 2B: Target Doc Interfaces

Design the successor docs as deep modules:

- each doc gets a clear owns / does not own interface
- behavioral contracts own authority
- seam docs own implementation-facing details
- support docs cannot quietly become authority mechanisms
- README/CONTEXT/AGENTS roles stay distinct

This is the structure review before synthesis starts.

Pass 2C: Source-Bounded Rewrite Slices

Rewrite one source doc, or one large heading range, at a time.

The cadence is source-first:

source slice -> traceability rows -> concept ledger updates -> target draft

Do not start from a target doc and synthesize from memory.

Pass 2D: Per-Slice Fidelity Audit

After each slice, compare old source against new target for:

- lost implementation specifics
- weakened non-negotiables
- missing exceptions or precedence rules
- “covered generally” handwaving
- stale terrain framing
- support helpers accidentally becoming authority
- current broken code becoming desired architecture

Anything unresolved becomes explicit fidelity debt, not an implicit TODO.

Pass 2E: Integration Readthrough

After all slices are drafted and audited, read the new doc set as an agent would:

- can an agent understand the full concept without reconstructing it from old docs?
- are doc responsibilities clean?
- do ledgers show complete coverage?
- do repeated clauses resolve into canonical text plus pointers without loss?

Pass 2F: Final Cutover

Only after every source slice is closed:

- update authority order
- rename/rehome/delete old docs as mechanical cutover
- keep traceability available
- make README the reader map
- keep CONTEXT glossary-only
- keep AGENTS operational

Cutover is last; it is not the rewrite strategy.

Pass 2G: Verification And Passforward

Run docs checks, report changed files, unresolved fidelity debt if any, and prepare a passforward note before any
compact.