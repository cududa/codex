import { z } from "zod";
import { tagKinds } from "../enums.js";
import { ActorRefSchema, IdSchema, NonEmptyTextSchema, OptionalTextSchema, SlugSchema, UnixSecondsSchema } from "./actors.js";
import { ReviewEntityScopeSchema } from "./scopes.js";

export const TagKindSchema = z.enum(tagKinds);

export const ClassificationFieldsSchema = z
  .object({
    primaryTagSlug: SlugSchema,
    secondaryTagSlugs: z.array(SlugSchema).optional(),
    rationale: OptionalTextSchema,
  })
  .strict();

export const ConcernTagViewSchema = z
  .object({
    slug: SlugSchema,
    label: NonEmptyTextSchema,
    parentSlug: SlugSchema.nullable(),
    description: NonEmptyTextSchema,
    examples: z.array(NonEmptyTextSchema),
    pitfalls: z.array(NonEmptyTextSchema),
    sortOrder: z.number().int(),
  })
  .strict();

export const TaggingViewSchema = z
  .object({
    id: IdSchema,
    scope: ReviewEntityScopeSchema,
    tag: ConcernTagViewSchema,
    kind: TagKindSchema,
    rationale: OptionalTextSchema,
    createdBy: ActorRefSchema,
    createdAt: UnixSecondsSchema,
  })
  .strict();

export const CreateTaggingParamsSchema = z
  .object({
    scope: ReviewEntityScopeSchema,
    tagSlug: SlugSchema,
    kind: TagKindSchema,
    rationale: OptionalTextSchema,
    actor: ActorRefSchema,
  })
  .strict();

export const DeleteTaggingParamsSchema = z
  .object({
    taggingId: IdSchema,
    actor: ActorRefSchema,
    reason: OptionalTextSchema,
  })
  .strict();

export type ConcernTagView = z.infer<typeof ConcernTagViewSchema>;
export type TaggingView = z.infer<typeof TaggingViewSchema>;
export type ClassificationFields = z.infer<typeof ClassificationFieldsSchema>;
export type CreateTaggingParams = z.infer<typeof CreateTaggingParamsSchema>;
export type DeleteTaggingParams = z.infer<typeof DeleteTaggingParamsSchema>;
