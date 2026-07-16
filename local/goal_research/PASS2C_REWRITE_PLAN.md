# Pass 2C Rewrite Plan

Status: planning scaffold closed. This is an index, not a successor authority
document, source-slice record, trace closure artifact, or cutover artifact.

Execution status: do not add another planning layer by default. Begin Pass 2C
execution from `pass2c_rewrite_plan/PASSFORWARD.md`, using Packet 08 as the
ordered source-slice queue and Packets 09-13 as the route, record, compression,
audit, and cutover rules around that queue.

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

Splitting is a closeability tool, not a deferral tool. An active unblocked
packet should make the concrete decision named by its title and scope. Split
only when that named decision cannot be grounded and closed honestly by one
fresh agent, or when the packet has started answering a different decision
family.

Use the packet README as the working index:

- `local/goal_research/pass2c_rewrite_plan/README.md`

## Packet Groups

The clean scaffold uses small packets in this order:

1. Packet rules and artifact boundaries.
2. Successor draft workspace and target-key decisions.
3. Source-slice unit, split, and order decisions.
4. Route-verification, workflow, repeated-authority, audit, and cutover
   decisions.

Packets 00-13 are closed. Later Pass 2C work should begin from the execution
workspace and ordered source-slice queue defined by the closed packets, not by
adding another planning layer.

## Verification

For docs-only updates in this area, run:

```powershell
git diff --check -- local/goal_research
rg -n "[ \t]$" local/goal_research
```

No Rust tests are needed for docs-only Pass 2C planning changes.
