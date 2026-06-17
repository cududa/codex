import { z } from "zod";
import { concernAreaSlugs } from "../../concernMap.js";
import {
  concernGraphEdgeKinds,
  concernGraphNodeKinds,
  concernGraphSourceKinds,
  detectorFindingEvidenceKinds,
  detectorRunKinds,
  detectorRunStatuses,
  diffSides,
  riskLevels,
  confidenceLevels,
  reviewEntityScopeTypes,
} from "../../enums.js";
import {
  CountSchema,
  IdSchema,
  NonEmptyTextSchema,
  OptionalTextSchema,
  PositiveLineNumberSchema,
  UnixSecondsSchema,
} from "../actors.js";
import { ReviewEntityScopeSchema } from "../scopes.js";

export const ConcernAreaSlugSchema = z.enum(concernAreaSlugs);
export const ConcernGraphNodeKindSchema = z.enum(concernGraphNodeKinds);
export const ConcernGraphEdgeKindSchema = z.enum(concernGraphEdgeKinds);
export const ConcernGraphSourceKindSchema = z.enum(concernGraphSourceKinds);
export const DetectorRunKindSchema = z.enum(detectorRunKinds);
export const DetectorRunStatusSchema = z.enum(detectorRunStatuses);
export const DetectorFindingEvidenceKindSchema = z.enum(detectorFindingEvidenceKinds);
export const DetectorFindingTargetTypeSchema = z.enum(reviewEntityScopeTypes);
export const DetectorRiskLevelSchema = z.enum(riskLevels);
export const DetectorConfidenceSchema = z.enum(confidenceLevels);
export const DetectorFindingSideSchema = z.enum(diffSides);
const ExactNonEmptyTextSchema = z.string().min(1);

export const ConcernSeedPathSchema = z
  .object({
    path: NonEmptyTextSchema,
    status: z.enum(["present", "known_missing", "future"]),
    note: OptionalTextSchema,
  })
  .strict()
  .refine((seed) => seed.status === "present" || seed.note !== undefined, {
    message: "known-missing and future seed paths must explain why they are tracked",
    path: ["note"],
  });

export const ConcernFixtureExpectationSchema = z
  .object({
    name: NonEmptyTextSchema,
    description: NonEmptyTextSchema,
    required: z.boolean().default(true),
  })
  .strict();

export const ConcernMapEntrySchema = z
  .object({
    slug: ConcernAreaSlugSchema,
    label: NonEmptyTextSchema,
    behaviorDefinition: NonEmptyTextSchema,
    seedPaths: z.array(ConcernSeedPathSchema).min(1),
    seedGlobPatterns: z.array(NonEmptyTextSchema),
    seedSymbols: z.array(ExactNonEmptyTextSchema),
    seedStringMarkers: z.array(ExactNonEmptyTextSchema),
    seedTemplateMarkers: z.array(ExactNonEmptyTextSchema),
    expansionEdgeTypes: z.array(ConcernGraphEdgeKindSchema).min(1),
    falsePositiveExclusions: z.array(NonEmptyTextSchema).min(1),
    fixtureExpectations: z.array(ConcernFixtureExpectationSchema).min(1),
  })
  .strict()
  .refine(
    (entry) =>
      entry.seedSymbols.length + entry.seedStringMarkers.length + entry.seedTemplateMarkers.length > 0,
    {
      message: "each concern needs at least one seed symbol, string marker, or template marker",
      path: ["seedSymbols"],
    },
  );

export const ConcernMapSchema = z.array(ConcernMapEntrySchema).length(concernAreaSlugs.length);

const JsonRecordSchema = z.record(z.string(), z.unknown());

export const ConcernGraphNodeSchema = z
  .object({
    id: IdSchema.optional(),
    concernSlug: ConcernAreaSlugSchema,
    nodeKey: NonEmptyTextSchema,
    nodeKind: ConcernGraphNodeKindSchema,
    path: OptionalTextSchema,
    symbol: OptionalTextSchema,
    marker: OptionalTextSchema,
    displayName: OptionalTextSchema,
    description: OptionalTextSchema,
    sourceKind: ConcernGraphSourceKindSchema,
    sourceRef: OptionalTextSchema,
    isSeed: z.boolean(),
    isKnownMissing: z.boolean(),
    metadata: JsonRecordSchema,
    createdAt: UnixSecondsSchema.optional(),
    updatedAt: UnixSecondsSchema.optional().nullable(),
  })
  .strict()
  .refine((node) => node.path !== undefined || node.symbol !== undefined || node.marker !== undefined, {
    message: "graph nodes must carry a path, symbol, or marker",
    path: ["path"],
  });

export const ConcernGraphEdgeSchema = z
  .object({
    id: IdSchema.optional(),
    concernSlug: ConcernAreaSlugSchema,
    edgeKey: NonEmptyTextSchema,
    edgeKind: ConcernGraphEdgeKindSchema,
    fromNodeId: IdSchema,
    toNodeId: IdSchema,
    sourceKind: ConcernGraphSourceKindSchema,
    sourceRef: OptionalTextSchema,
    metadata: JsonRecordSchema,
    createdAt: UnixSecondsSchema.optional(),
    updatedAt: UnixSecondsSchema.optional().nullable(),
  })
  .strict();

export const DetectorRunSchema = z
  .object({
    id: IdSchema,
    versionId: IdSchema.nullable(),
    repositoryId: NonEmptyTextSchema,
    runKind: DetectorRunKindSchema,
    status: DetectorRunStatusSchema,
    concernMapVersion: CountSchema,
    baseSha: OptionalTextSchema.nullable(),
    targetSha: OptionalTextSchema.nullable(),
    sourceRef: OptionalTextSchema.nullable(),
    startedAt: UnixSecondsSchema,
    completedAt: UnixSecondsSchema.nullable(),
    error: OptionalTextSchema.nullable(),
    summary: JsonRecordSchema,
    createdAt: UnixSecondsSchema,
    updatedAt: UnixSecondsSchema.nullable(),
  })
  .strict();

export const DetectorFindingEvidenceSchema = z
  .object({
    nodeKey: OptionalTextSchema,
    path: OptionalTextSchema,
    symbol: OptionalTextSchema,
    marker: OptionalTextSchema,
    edgeKind: ConcernGraphEdgeKindSchema.optional(),
    reason: NonEmptyTextSchema,
  })
  .strict();

export const DetectorFindingSchema = z
  .object({
    id: IdSchema.optional(),
    runId: IdSchema,
    versionId: IdSchema.nullable(),
    commitId: IdSchema.nullable(),
    commitFileId: IdSchema.nullable(),
    diffBlockId: IdSchema.nullable(),
    graphNodeId: IdSchema.nullable(),
    graphNodeKey: OptionalTextSchema.nullable(),
    findingKey: NonEmptyTextSchema,
    concernSlug: ConcernAreaSlugSchema,
    target: ReviewEntityScopeSchema,
    path: OptionalTextSchema.nullable(),
    side: DetectorFindingSideSchema.nullable(),
    startLine: PositiveLineNumberSchema.nullable(),
    endLine: PositiveLineNumberSchema.nullable(),
    symbol: OptionalTextSchema.nullable(),
    marker: OptionalTextSchema.nullable(),
    evidenceKind: DetectorFindingEvidenceKindSchema,
    title: NonEmptyTextSchema,
    summary: NonEmptyTextSchema,
    rationale: NonEmptyTextSchema,
    riskLevel: DetectorRiskLevelSchema,
    confidence: DetectorConfidenceSchema,
    evidence: z.array(DetectorFindingEvidenceSchema),
    createdAt: UnixSecondsSchema.optional(),
  })
  .strict()
  .refine((finding) => finding.startLine === null || finding.endLine === null || finding.startLine <= finding.endLine, {
    message: "startLine must be less than or equal to endLine",
    path: ["endLine"],
  });

export const DetectorFindingSummarySchema = z
  .object({
    concernSlug: ConcernAreaSlugSchema,
    targetType: DetectorFindingTargetTypeSchema,
    targetId: IdSchema,
    count: CountSchema,
    highestRiskLevel: DetectorRiskLevelSchema,
    highestConfidence: DetectorConfidenceSchema,
    evidenceSummaries: z.array(NonEmptyTextSchema),
  })
  .strict();

export type ConcernAreaSlug = z.infer<typeof ConcernAreaSlugSchema>;
export type ConcernSeedPath = z.infer<typeof ConcernSeedPathSchema>;
export type ConcernFixtureExpectation = z.infer<typeof ConcernFixtureExpectationSchema>;
export type ConcernMapEntry = z.infer<typeof ConcernMapEntrySchema>;
export type ConcernGraphNode = z.infer<typeof ConcernGraphNodeSchema>;
export type ConcernGraphEdge = z.infer<typeof ConcernGraphEdgeSchema>;
export type DetectorRun = z.infer<typeof DetectorRunSchema>;
export type DetectorFindingEvidence = z.infer<typeof DetectorFindingEvidenceSchema>;
export type DetectorFinding = z.infer<typeof DetectorFindingSchema>;
export type DetectorFindingSummary = z.infer<typeof DetectorFindingSummarySchema>;
