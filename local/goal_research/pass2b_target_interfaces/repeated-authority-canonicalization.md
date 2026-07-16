# Pass 2B.5 Repeated Authority Canonicalization

This is a Pass 2B.5 prep artifact. It is not future implementation authority
and does not close any Pass 2A row.

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

For direct implementation work before cutover, source authority docs still
control. For Pass 2C doc-worker tasks, current source docs are the source
corpus and this workspace is the compression guide. If a Pass 2C slice finds
that older source-doc wording and a relevant `local/goal_136_plan/work-areas`
decision differ, use the work-area route when it preserves the underlying
concept and latest researched v136 design, then record the reconciliation in
the slice closure.

## Current Status

- Repeated authority canonicalization has been split into a workspace README plus four batch files.
- The split is organizational only; it does not rewrite source-doc content or
  start Pass 2C.
- Batches 1-4 are complete enough to feed Pass 2C planning.
- Use this workspace before Pass 2C source-bounded rewrite slices to decide which repeated clauses become canonical text, local reminders, pointer-only references, or operational/test reminders.

## Verification

For docs-only edits in this directory, run:

```text
git diff --check -- local/goal_research
rg -n "[ \t]$" local/goal_research
```

No Rust tests are needed for Pass 2B.5 docs-only prep.
