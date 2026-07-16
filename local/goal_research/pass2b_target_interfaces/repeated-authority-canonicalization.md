# Pass 2B.5 Repeated Authority Canonicalization

This is a Pass 2B.5 prep artifact. It is not authority, does not supersede any source contract in `local/goal_research`, and does not close any Pass 2A row.

This file is the stable index for the repeated-authority canonicalization workspace. The detailed rules and batch entries live under `repeated_authority_canonicalization/`.

Read:

1. [repeated_authority_canonicalization/README.md](repeated_authority_canonicalization/README.md)
   - Purpose, canonicalization rules, concept template, batch order, and Pass 2C usage.
2. [repeated_authority_canonicalization/batch-1-authority-and-cadence-proof.md](repeated_authority_canonicalization/batch-1-authority-and-cadence-proof.md)
   - Final-input proof, pending intent, exact-key consumption, durable state non-authority, and ordinary user turns.
3. [repeated_authority_canonicalization/batch-2-lifecycle-and-attempt-semantics.md](repeated_authority_canonicalization/batch-2-lifecycle-and-attempt-semantics.md)
   - Automatic Continuation/watermarking, resume hydration, retry/follow-up/same-turn metadata, and current-turn carry.
4. [repeated_authority_canonicalization/batch-3-cleanup-evidence-reconstruction.md](repeated_authority_canonicalization/batch-3-cleanup-evidence-reconstruction.md)
   - Request-local repair, classifier/provenance non-authority, structured recorded request evidence, raw notifications, and reconstruction.
5. [repeated_authority_canonicalization/batch-4-support-tests-and-operations.md](repeated_authority_canonicalization/batch-4-support-tests-and-operations.md)
   - Extension reachability, fake-shim removal, replacement test profile, and navigation/operations surfaces.

Source authority docs still control. If this workspace and a source contract differ, follow the source contract and fix the prep artifact.

## Current Status

- Repeated authority canonicalization has been split into a workspace README plus four batch files.
- The split is organizational only; it does not rewrite source authority content or start Pass 2C.
- Use this workspace before Pass 2C source-bounded rewrite slices to decide which repeated clauses become canonical text, local reminders, pointer-only references, or operational/test reminders.

## Verification

For docs-only edits in this directory, run:

```text
git diff --check -- local/goal_research
rg -n "[ \t]$" local/goal_research
```

No Rust tests are needed for Pass 2B.5 docs-only prep.
