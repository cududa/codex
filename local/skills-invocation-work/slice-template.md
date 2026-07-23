# Slice Template

Copy this file into `slices/NN-name.md` when adding a new bounded pass.

## Goal

Describe the specific research artifact to fill. Name the seam and the reader
job.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/skills-invocation-work/README.md`.
- The current target work-packet files.

## Target Files

- `local/skills-invocation-work/<file>.md`

## Terrain

- `path/to/source.rs`

## Decomposition Checkpoint

Before drafting broad prose, decide whether this slice is still executable as
written. Decompose only after sampling the target docs and terrain enough to
name a concrete reason.

If decomposition is needed:

1. Create `slices/NN-name/`.
2. Add slim subslice briefs named by ownership seam, reader job, or blocking
   decision.
3. Add a final `NNz-consolidation.md` subslice.
4. Record the reason for decomposition in the parent slice.
5. Keep the parent definition of done unchanged unless the user approves a
   scope change.

Do not decompose by source-file list.

## Work Steps

1. Read the target work-packet files.
2. Read only the terrain needed for this slice.
3. Use `task-alignment` to emit a Direction Lock.
4. Extract facts into `concept-ledger.md`.
5. Sort each fact as owned-here, pointer-only, conflict/open, or rejected.
6. Draft or update the target files.
7. Add short pointers only where they prevent local mistakes.
8. Move unresolved decisions to `open-decisions.md`.
9. Run ownership, terminology, and whitespace checks.
10. Update `tasks.md`.

## Definition Of Done

- A fresh reader can answer the slice's core reader question.
- Each durable rule has one future owning doc or an open decision.
- Temporary extraction facts are moved, rejected, or recorded as open.
- Proof-only material is routed to `proof-and-readiness.md`.
- If decomposed, the consolidation subslice confirms this parent definition of
  done.

## Verification

```text
rg -n "TODO|TBD" local/skills-invocation-work
rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/skills-invocation-work
git diff --check -- local/skills-invocation-work
```

