# Passforward: Pass 2C Planning Scaffold

## Intent Snapshot

Continue Pass 2C planning from the clean packet scaffold. The next work is to
close the earliest open packet, not to write successor docs or source-slice
tables.

Expected artifact shape:

- `PASS2C_REWRITE_PLAN.md` stays a compact top-level index.
- `pass2c_rewrite_plan/` holds bounded planning packets.
- Each packet owns one closeable planning decision.
- Ordered source-slice tables wait until their prerequisite packets close.

Explicit exclusions:

- Do not start Pass 2C source-bounded rewrite slices.
- Do not create successor authority docs or draft files.
- Do not create per-slice execution records.
- Do not close traceability rows.
- Do not rename, rehome, archive, or delete current source docs.
- Do not treat Pass 2B or Pass 2B.5 as a replacement for source reading.
- Do not drift into Rust implementation.

## Authority Grounding

Start with:

- `local/goal_research/PASS2C_PLANNING_HANDOFF.md`
- `local/goal_research/AGENTS.md`
- `local/goal_research/PASS2C_REWRITE_PLAN.md`
- `local/goal_research/pass2c_rewrite_plan/README.md`

Then read the packet being worked and only the source/prep/route inputs needed
to close that packet honestly.

Core constraints:

- Pass 2C is source-bounded translation, not target-topic drafting from memory.
- Current source docs are the source corpus and concept record until cutover.
- Pass 2A, Pass 2B, and Pass 2B.5 are prep, interface, and compression inputs.
- Later implementation-route material verifies implementation-shaped decisions
  where needed, but durable successor docs should integrate decisions directly.
- A packet closes only when one fresh agent could reasonably defend that single
  decision from direct reading.

## Terrain Inspection

Current Pass 2C planning terrain:

- `PASS2C_REWRITE_PLAN.md` is the compact index.
- `pass2c_rewrite_plan/README.md` is the packet index and closeability gate.
- Current packet files are small stubs. They are intentionally not source
  tables, target maps, or execution records yet.

Use the packet status table in the README to choose the next packet. Start with
`packet-00-planning-boundary-and-packet-rules.md` unless a newer user message
selects a different packet.

## Direction Lock

- Request: Continue Pass 2C planning from the clean packet scaffold.
- Authority: Planning handoff, AGENTS, top-level rewrite plan, packet README,
  and the selected packet define the current boundary.
- Terrain: The packet set is intentionally small and prerequisite-ordered.
- Code-shape temptation: Fill later packets early, recreate broad target maps,
  or produce ordered source-slice tables before unit and split decisions close.
- Locked direction: Work one selected packet to closure from direct grounding.
- Exclusions: No source rewrite execution, no cutover, no source doc moves, no
  successor draft files, no per-slice records, no Rust/code implementation.

## Recommended Next Pocket

Close Packet 00 first. It should confirm:

- planning scaffold output boundaries,
- packet size and split rules,
- required packet sections,
- closeability gate,
- the rule that blocked packets stay blocked until prerequisites close, and
- verification for docs-only planning edits.

Do not import decisions from later packet stubs into Packet 00. If Packet 00
needs target, source-slice, route, workflow, compression, audit, or cutover
detail, leave that to the packet that owns it.

## Verification State

For docs-only edits in this area, run:

```powershell
git diff --check -- local/goal_research
rg -n "[ \t]$" local/goal_research
```

`rg` exits with code 1 when it finds no trailing-whitespace matches; that is
expected. No Rust tests are needed for docs-only planning edits.
