import { z } from "zod";
import { decisionScopeTypes, diffSides, reviewEntityScopeTypes, sourceAnchorKinds } from "../enums.js";

const IdSchema = z.string().min(1);
const NonEmptyTextSchema = z.string().trim().min(1);
const [versionScopeType, commitScopeType, commitFileScopeType, diffBlockScopeType] = reviewEntityScopeTypes;
const [scopeAnchorKind, blockAnchorKind, rangeAnchorKind] = sourceAnchorKinds;

export const ReviewEntityScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal(versionScopeType), versionId: IdSchema }).strict(),
  z.object({ type: z.literal(commitScopeType), commitId: IdSchema }).strict(),
  z.object({ type: z.literal(commitFileScopeType), commitFileId: IdSchema }).strict(),
  z.object({ type: z.literal(diffBlockScopeType), diffBlockId: IdSchema }).strict(),
]);

export const DecisionScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal(decisionScopeTypes[0]), versionId: IdSchema }).strict(),
  z.object({ type: z.literal(decisionScopeTypes[1]), commitId: IdSchema }).strict(),
  z.object({ type: z.literal(decisionScopeTypes[2]), commitFileId: IdSchema }).strict(),
]);

const RangeAnchorSchema = z
  .object({
    kind: z.literal(rangeAnchorKind),
    commitFileId: IdSchema,
    side: z.enum(diffSides),
    startLine: z.number().int().positive(),
    endLine: z.number().int().positive(),
    startColumn: z.number().int().positive().optional(),
    endColumn: z.number().int().positive().optional(),
    selectedText: NonEmptyTextSchema.optional(),
  })
  .strict()
  .refine((anchor) => anchor.startLine <= anchor.endLine, {
    message: "startLine must be less than or equal to endLine",
    path: ["endLine"],
  })
  .refine(
    (anchor) =>
      anchor.startColumn === undefined ||
      anchor.endColumn === undefined ||
      anchor.startLine !== anchor.endLine ||
      anchor.startColumn <= anchor.endColumn,
    {
      message: "startColumn must be less than or equal to endColumn on a single-line range",
      path: ["endColumn"],
    },
  );

export const SourceAnchorSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal(scopeAnchorKind) }).strict(),
  z.object({ kind: z.literal(blockAnchorKind), diffBlockId: IdSchema }).strict(),
  RangeAnchorSchema,
]);

export type ReviewEntityScope = z.infer<typeof ReviewEntityScopeSchema>;
export type DecisionScope = z.infer<typeof DecisionScopeSchema>;
export type SourceAnchor = z.infer<typeof SourceAnchorSchema>;
