# Pass 2B Target Interfaces

This is a Pass 2B prep artifact. It is not authority, does not supersede any source contract in this directory, and does not close any Pass 2A row.

The active Pass 2B target-interface workspace lives in `pass2b_target_interfaces/`.

Read:

1. [pass2b_target_interfaces/README.md](pass2b_target_interfaces/README.md)
   - Shared Pass 2B rules, template, packet plan, cross-target matrix, and Pass 2C readiness checklist.
2. [pass2b_target_interfaces/packet-1-core-authority.md](pass2b_target_interfaces/packet-1-core-authority.md)
   - Completed and bottom-up reviewed Core Authority entries for `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, and `T-FINAL`.
3. [pass2b_target_interfaces/packet-2-lifecycle-and-seams.md](pass2b_target_interfaces/packet-2-lifecycle-and-seams.md)
   - Complete and bottom-up reviewed.
4. [pass2b_target_interfaces/packet-3-support-and-execution.md](pass2b_target_interfaces/packet-3-support-and-execution.md)
   - Complete and bottom-up reviewed.
5. [pass2b_target_interfaces/packet-4-navigation-and-operations.md](pass2b_target_interfaces/packet-4-navigation-and-operations.md)
   - Complete and bottom-up reviewed.
6. [pass2b_target_interfaces/packet-5-consistency.md](pass2b_target_interfaces/packet-5-consistency.md)
   - Complete.
7. [pass2b_target_interfaces/repeated-authority-canonicalization.md](pass2b_target_interfaces/repeated-authority-canonicalization.md)
   - Stable index for the Pass 2B.5 repeated-authority canonicalization workspace.

Source authority docs in this directory still control. The files above design successor document interfaces only; they do not rewrite authority content, rename or rehome source docs, or start Pass 2C source-bounded rewrite slices.

## Current Status

- Setup rules moved to `pass2b_target_interfaces/README.md`.
- Packet 1 Core Authority is complete and bottom-up reviewed.
- Packet 2 Lifecycle And Seams is complete and bottom-up reviewed.
- Packet 3 Support And Execution is complete and bottom-up reviewed.
- Packet 4 Navigation And Operations is complete and bottom-up reviewed.
- Packet 5 2B Consistency is complete.
- Pass 2B.5 Repeated Authority Canonicalization is split into a stable index plus batch files.

## Verification

For docs-only edits in this directory, run:

```text
git diff --check -- local/goal_research
rg -n "[ \t]$" local/goal_research
```

No Rust tests are needed for Pass 2B docs-only interface-design prep.
