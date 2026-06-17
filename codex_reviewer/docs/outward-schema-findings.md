# Outward Schema Findings

This note captures the current outward schema surface from the frontend-facing review applet code. It intentionally records the contract shape as consumed by callers, not the persistence model or repository implementation.

## Entry Points Read

- `prompt_reviews/web/src/entities/review/types.ts`
- `prompt_reviews/web/src/entities/review/api.ts`
- `prompt_reviews/web/src/features/review-workspace/hooks/reviewData.ts`
- `prompt_reviews/src/domain/schemas/index.ts`
- `prompt_reviews/src/domain/jsonSchemas.ts`
- `prompt_reviews/src/domain/schemas/commits.ts`
- `prompt_reviews/src/domain/schemas/files.ts`
- `prompt_reviews/src/domain/schemas/tags.ts`
- `prompt_reviews/src/domain/schemas/remainingWork.ts`
- `prompt_reviews/src/domain/enums.ts`
- `prompt_reviews/src/domain/schemas/scopes.ts`
- `prompt_reviews/src/domain/schemas/decisions.ts`
- `prompt_reviews/src/domain/schemas/comments.ts`
- `prompt_reviews/src/domain/schemas/concernDetector/index.ts`
- `prompt_reviews/src/domain/schemas/diffBlocks.ts`
- `prompt_reviews/src/domain/schemas/versions.ts`
- `prompt_reviews/src/domain/schemas/plans.ts`

## Current Contract Shape

The frontend imports review types from `@domain/schemas` and parses API responses through Zod schemas at the API boundary. The outward model is already schema-shaped, but it still exposes the old review vocabulary.

The lived object ladder is:

- `Version`
- `Commit`
- `CommitFile`
- `DiffBlock`

Each of `Commit`, `CommitFile`, and `DiffBlock` can surface review material independently in the outward schema. This finding is about the caller-visible shape only; it does not imply how storage currently owns or projects that data.

## Review Material In The Outward Shape

`CommitDetail` extends `CommitQueueItem` and includes:

- `status`
- `primaryTagSlug`
- `secondaryTagSlugs`
- `detectorFindingSummaries`
- `files`
- `queuedFiles`
- `taggings`
- `comments`
- `decisions`
- `plans`

`CommitFileDetail` extends `CommitFileQueueItem` and includes:

- `status`
- `primaryTagSlug`
- `secondaryTagSlugs`
- `detectorFindingSummaries`
- `detectorFindings`
- `diffBlocks`
- nested `review` data containing `taggings`, `comments`, `decisions`, and `plans`

`DiffBlockView` includes:

- `taggings`
- `comments`
- optional singular `decision`
- `detectorFindings`

## Old Vocabulary Exposed At The Boundary - TO BE DELETED

The outward schema currently exposes these old concepts directly:

- `ConcernTagView`
- `TaggingView`
- `ClassificationView`
- `ClassificationFields`
- `ClassifyCommitParams`
- `ClassifyFileParams`
- `CreateTaggingParams`
- `DeleteTaggingParams`
- `primaryTagSlug`
- `secondaryTagSlugs`
- `tagSlug`
- `taggings`
- `classification`
- `classify`
- `needs_classification`

The frontend API mirrors that vocabulary through:

- `listConcernTags`
- `classifyCommit`
- `classifyFile`
- `useConcernTagsQuery`
- `useClassifyCommitMutation`
- `useClassifyFileMutation`
- query key `tags`

## Current Workflow Vocabulary

The outward schema has a broad `ReviewStatus` enum:

- `unreviewed`
- `needs_classification`
- `reviewing`
- `needs_decision`
- `patch_required`
- `accepted`
- `accepted_with_watch`
- `rejected`
- `blocked`

The outward schema also has decision outcomes:

- `accept`
- `accept_with_watch`
- `patch_required`
- `reject_for_local_build`
- `needs_tests`
- `needs_policy_decision`
- `blocked_on_context`

Remaining work and next actions currently expose review workflow through:

- `remainingWorkKinds`: `classification`, `comment`, `decision`, `plan`, `version_closure`
- `nextActionKinds`: `classify`, `comment`, `decide`, `plan`, `close_version`

## Detector Shape

Detector-facing schemas already contain a separate concern-area-ish concept:

- `ConcernAreaSlugSchema`
- `ConcernMapEntrySchema`
- `ConcernGraphNodeSchema`
- `ConcernGraphEdgeSchema`
- `DetectorRunSchema`
- `DetectorFindingSchema`
- `DetectorFindingSummarySchema`

Detector findings expose `concernSlug`, target scope, location fields, evidence kind, title, summary, and evidence records. This is distinct from the editable tag/classification surface in the outward review contract.

## Boundary Schema Registry

`boundarySchemas` gathers the Zod schemas used as outward contract definitions and JSON-schema generation inputs. It includes both product-facing review shapes and detector shapes. The registry is already central enough to become a useful replacement checkpoint, but its current contents still preserve the old tag/classification vocabulary.

## Immediate Architectural Reading

The current outward contract presents reviewable entities plus attached review material:

- reviewable ladder: `Version -> Commit -> CommitFile -> DiffBlock`
- review annotations/actions: comments, decisions, plans
- old editable concern surface: tags, taggings, classification
- detector evidence surface: concern map, graph, runs, findings
- workflow surface: review status, remaining work, next action hints

This is the first useful grounding artifact for remapping the app vocabulary without treating the current persistence model as source of truth.
