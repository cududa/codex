# Pass 2C Rewrite Plan

Status: clean planning scaffold. This is an index, not a successor authority
document, source-slice record, trace closure artifact, or cutover artifact.

Pass 2C planning must stay smaller than the work it organizes. Each packet in
`pass2c_rewrite_plan/` owns one closeable planning decision and should be
tractable for one fresh agent to ground, edit, verify, and hand off in one
focused context window.

## Method

Pass 2C remains source-bounded translation. Future rewrite slices must start
from source docs or bounded source heading ranges, not from target-topic memory.

Use these as inputs:

- current source docs under `local/goal_research/`
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- Pass 2B target-interface packets
- Pass 2B.5 repeated-authority canonicalization packets
- relevant `local/goal_136_plan/work-areas/` route material when a concept
  depends on implementation-shaped sequencing

Those inputs guide planning. They do not close source rows or replace
top-to-bottom source reading during later source-slice execution.

## Packet Rule

No packet should contain a giant target map, source table, workflow template,
and audit policy at once. If a packet needs more than one decision family, split
it before adding content.

Use the packet README as the working index:

- `local/goal_research/pass2c_rewrite_plan/README.md`

## Packet Groups

The clean scaffold uses small packets in this order:

1. Packet rules and artifact boundaries.
2. Successor draft workspace and target-key decisions.
3. Source-slice unit, split, and order decisions.
4. Route-verification, workflow, repeated-authority, audit, and cutover
   decisions.

Later agents should close the earliest open packet whose prerequisites are
closed. Do not skip ahead to ordered source-slice tables until the unit,
source-doc split, and dependency-order packets are closed.

## Verification

For docs-only updates in this area, run:

```powershell
git diff --check -- local/goal_research
rg -n "[ \t]$" local/goal_research
```

No Rust tests are needed for docs-only Pass 2C planning changes.
