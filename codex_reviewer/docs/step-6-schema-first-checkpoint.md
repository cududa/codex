# Step 6 Schema-First Checkpoint

This note exists to keep the Step 6 implementation from drifting toward nearby prototype code. It is an operating checklist, not an implementation plan.

## Fixed Center

The database, API, contracts, MCP surface, and frontend state are shaped by the canonical review application schema:

- ReviewVersion
- ReviewCommit
- ReviewFile
- DiffBlock
- ReviewMark
- ordered commit ConcernArea rows
- detector evidence
- AgentReview
- HumanApproval
- threaded comments
- decision notes
- review plans
- ledger events

Ingest and detector code are producers of this schema. They are not architecture.

## Buckets

Every field or concept encountered during Step 6 must land in one bucket:

- Canonical app state: belongs in shared contracts, persistence, API, MCP, and UI.
- Producer input detail: useful inside GitHub/git/detector normalization, but does not shape persistence.
- Prototype residue: deleted rather than renamed or wrapped.

No field is accepted because "git gives it to us" or "the old service had it." A field exists only when the app, API, MCP surface, or user journey needs it.

## Order Of Operations

1. Re-check the canonical contracts and Drizzle tables against the target review journey.
2. Repair contracts and persistence first if they do not directly model the canonical schema.
3. Keep parser/git/source-normalization types private to the producer boundary.
4. Write ingest output into canonical rows only.
5. Write detector output as canonical evidence and canonical review state only.
6. Add tests that make hand-turned JSON, old vocabulary, prompt_reviews imports, and producer-shaped persistence fail.

## Drift Alarms

Stop and re-center if an implementation move starts from:

- matching prompt_reviews storage
- preserving an old route shape
- storing parser convenience fields without a product-schema reason
- hiding legacy vocabulary behind new names
- adding JSON blobs where typed schema-owned data belongs
- making the importer easier at the expense of canonical persistence

Step 6 succeeds when ingest and detector are boring producers of the shared schema, and the app can serve what it stores without projection machinery.
