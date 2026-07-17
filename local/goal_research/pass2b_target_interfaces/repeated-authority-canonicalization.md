# Pass 2B.5 Repeated Authority Canonicalization

This is a Pass 2B.5 prep artifact. It is not future implementation authority
and does not close any Pass 2A row.

This file is the stable index for the repeated-authority canonicalization workspace. The detailed rules and batch entries live under `repeated_authority_canonicalization/`.

Read:

1. [repeated_authority_canonicalization/README.md](repeated_authority_canonicalization/README.md)
   - Purpose, canonicalization rules, concept template, batch order, and future rewrite planning use.
2. [repeated_authority_canonicalization/batch-1-authority-and-cadence-proof.md](repeated_authority_canonicalization/batch-1-authority-and-cadence-proof.md)
   - Final-input proof, pending intent, exact-key consumption, durable state non-authority, and ordinary user turns.
3. [repeated_authority_canonicalization/batch-2-lifecycle-and-attempt-semantics.md](repeated_authority_canonicalization/batch-2-lifecycle-and-attempt-semantics.md)
   - Automatic Continuation/watermarking, resume hydration, retry/follow-up/same-turn metadata, and current-turn carry.
4. [repeated_authority_canonicalization/batch-3-cleanup-evidence-reconstruction.md](repeated_authority_canonicalization/batch-3-cleanup-evidence-reconstruction.md)
   - Request-local repair, classifier/provenance non-authority, structured recorded request evidence, raw notifications, and reconstruction.
5. [repeated_authority_canonicalization/batch-4-support-tests-and-operations.md](repeated_authority_canonicalization/batch-4-support-tests-and-operations.md)
   - Extension reachability, fake-shim removal, replacement test profile, and navigation/operations surfaces.

For direct implementation work before future successor docs replace the current
source docs, source authority docs still control. For future successor-doc
architecture design or concept-preserving rewrite planning, current source docs
are the source corpus and this workspace is the compression guide. If future
rewrite planning finds that older source-doc wording and a relevant
`local/goal_136_plan/work-areas` decision differ, use the work-area route when
it preserves the underlying concept and latest researched v136 design, then
record the reconciliation as rewrite-planning input.

## Current Status

- Repeated authority canonicalization has been split into a workspace README plus four batch files.
- The split is organizational only; it does not rewrite source-doc content or
  start successor-doc authority writing.
- Batches 1-4 are complete enough to feed future rewrite planning.
- Use this workspace during future successor-doc architecture design or
  concept-preserving rewrite planning to decide which repeated clauses become
  canonical text, local reminders, pointer-only references, or
  operational/test reminders.

## Verification

For docs-only edits in this directory, run:

```text
git diff --check -- local/goal_research
rg -n "[ \t]$" local/goal_research
```

No Rust tests are needed for Pass 2B.5 docs-only prep.
