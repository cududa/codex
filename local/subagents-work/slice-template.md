# Slice Template

Copy this file into `slices/NN-name.md` when adding a new bounded pass.

## Goal

Describe the specific live doc or docs to fill. Name the seam and the reader
job.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- The target live doc skeletons in `local/subagents/`.

## Target Live Docs

- `local/subagents/<doc>.md`

## Terrain

- `path/to/source.rs`

## Decomposition Checkpoint

Before drafting broad live prose, decide whether this slice is still executable
as written. Decompose only after sampling the target docs and terrain enough to
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

1. Read the target live docs and their navigation headers.
2. Read only the terrain needed for this slice.
3. Extract facts into `concept-ledger.md`.
4. Sort each fact as owned-here, pointer-only, conflict/open, or rejected.
5. Draft or update the owning live docs.
6. Add short cross-doc pointers only where they prevent local mistakes.
7. Move unresolved decisions to `open-decisions.md`.
8. Run ownership, terminology, and whitespace checks.
9. Update `tasks.md`.

## Definition Of Done

- A fresh reader can answer the slice's core reader question.
- Each durable rule has one owning doc.
- Temporary extraction facts are moved, rejected, or recorded as open.
- The README remains routing-only.
- Proof-only material is routed to `proof-and-readiness.md` or left for the
  proof slice.
- If decomposed, the consolidation subslice confirms this parent definition of
  done.

## Verification

- `rg -n "TODO|TBD" local/subagents/<doc>.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
