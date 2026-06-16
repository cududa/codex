You’re right. I was drifting toward “inspect current prototype, then evolve it,” which is exactly the trap you’re warning about. The real requirement is to design the durable system from the work it needs to support, not copy the prototype’s markdown/file shape into SQLite.

Here’s my restatement.

You want `prompt_reviews` to become a real local review workbench for tracking OpenAI Codex upstream changes across versions, not a prompt-diff toy and not a markdown viewer.

The primary workflow is: when you bring in upstream `main`, the system should identify the next Codex version/review batch, populate that version, classify every commit in it, track review progress, classify files inside commits, let both MCP agents and the GUI work from the same structured state, and make it obvious what remains unresolved.

The prototype artifacts are legacy import material only. Existing files like `prompt_reviews\96836e15ed\*.prompt-review.md`, `prompt_reviews\data\comments.json`, and `local\commit_reviews\...md` should not determine the data model. They can be imported later by a tertiary/subagent task, probably with manual queries or small scripts, but the new schema must not be a filesystem-shaped database.

Markdown should stop being the authoritative review object. It may be exportable/renderable later, but the app should not depend on parsing generated markdown into UI, nor should agents be tempted to edit markdown directly and bypass the intended workflow. The “on rails” path should be the MCP/API/database path.

SQLite should become the durable source of truth. The schema should model the actual domain: versions, commits, files changed in commits, concerns/tags, statuses, comments, comment resolution, decisions, and possibly plans. It should not model “folders containing markdown files with comment blobs attached.”

The system needs version-level tracking: populate or discover the next version based on upstream changes, list open versions, and show version review progress in both MCP and GUI.

It needs commit-level tracking: every commit in a version should have classification, concern tags, and review status. MCP and GUI should both be able to answer “what commits remain?”

It needs file-level tracking inside each commit: every changed file should have its own classification/tags/status, because a commit may touch multiple surfaces with different review implications. MCP and GUI should both be able to answer “what files remain in this commit?”

It needs a durable concern taxonomy. The “Change Area” idea from the amplifier map is useful, but the specific old categories may be too narrow. The root `AGENTS.md` and local goal-related docs should inform a reusable taxonomy, possibly nested, for concerns like prompt wording, role authority, continuation, permissions, tool affordances, hidden context, goal behavior, etc.

Commenting should remain, but the model needs to grow up. Comments should likely have shared base fields and specialized shapes rather than a one-off JSON blob. They may need anchors, scope, authorship, lifecycle state, and resolution.

“Resolution” should probably be reserved for comments, while file/commit outcomes may be better modeled as “decisions” to avoid overloading terms. A decision should have its own status, and when accepted/complete it can drive the file or commit review status.

There may also need to be a plan entity: something that records the intended local treatment for a commit/file/version, tracks whether that plan is accepted or complete, and connects review findings to follow-up implementation.

The app must answer unresolved-work questions directly: which versions are open, which commits lack decisions, which files lack decisions, which comments remain unresolved, and which plans are not complete.

Frontend and backend should share TypeScript schemas/models. Zod probably belongs in a shared/backend schema layer rather than only frontend types. Those schemas should either define the SQLite tables or strongly shape them through an intentional migration/ORM approach.

Package choices are open. It is acceptable to add serious schema/migration libraries after researching current options. The bar is “this can stand up as a maintainable tool,” not “avoid dependencies.”

Most importantly: the design must be domain-first. The database should represent the review process and its state machine, not the prototype’s generated artifact layout.
