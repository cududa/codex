import {
  DetectorFindingEvidenceSchema,
  DetectorFindingSchema,
  DetectorFindingSummarySchema,
  type DetectorFinding,
  type DetectorFindingEvidence,
  type DetectorFindingSummary,
  type ReviewEntityScope,
} from "../../domain/schemas/index.js";
import {
  listDetectorFindingsByCommitFileIds,
  listDetectorFindingsByCommitIds,
  listDetectorFindingsByDiffBlockIds,
  listDetectorFindingsByTarget,
  type DetectorFindingRow,
} from "../../repositories/index.js";
import { invariantFailed } from "../errors.js";
import type { ServiceContext } from "../serviceContext.js";

const evidenceSummaryLimit = 5;

export function detectorFindingsByCommitId(
  context: ServiceContext,
  commitIds: readonly string[],
): Map<string, DetectorFindingRow[]> {
  return groupRows(listDetectorFindingsByCommitIds(context.db, commitIds), (row) => row.commitId);
}

export function detectorFindingsByCommitFileId(
  context: ServiceContext,
  commitFileIds: readonly string[],
): Map<string, DetectorFindingRow[]> {
  return groupRows(listDetectorFindingsByCommitFileIds(context.db, commitFileIds), (row) => row.commitFileId);
}

export function detectorFindingsByDiffBlockId(
  context: ServiceContext,
  diffBlockIds: readonly string[],
): Map<string, DetectorFindingRow[]> {
  return groupRows(listDetectorFindingsByDiffBlockIds(context.db, diffBlockIds), (row) => row.diffBlockId);
}

export function detectorFindingsForTarget(
  context: ServiceContext,
  target: { targetType: DetectorFindingRow["targetType"]; targetId: string },
): DetectorFinding[] {
  return listDetectorFindingsByTarget(context.db, target).map(toDetectorFindingView);
}

export function summarizeDetectorFindings(
  rows: readonly DetectorFindingRow[],
  target: { targetType: DetectorFindingSummary["targetType"]; targetId: string },
): DetectorFindingSummary[] {
  const byConcern = new Map<string, DetectorFindingSummary>();

  for (const row of rows) {
    const existing = byConcern.get(row.concernSlug);
    if (existing === undefined) {
      byConcern.set(
        row.concernSlug,
        DetectorFindingSummarySchema.parse({
          concernSlug: row.concernSlug,
          targetType: target.targetType,
          targetId: target.targetId,
          count: 1,
          highestRiskLevel: row.riskLevel,
          highestConfidence: row.confidence,
          evidenceSummaries: [row.summary],
        }),
      );
      continue;
    }

    existing.count += 1;
    existing.highestRiskLevel = higherRisk(existing.highestRiskLevel, row.riskLevel);
    existing.highestConfidence = higherConfidence(existing.highestConfidence, row.confidence);
    addEvidenceSummary(existing.evidenceSummaries, row.summary);
  }

  return [...byConcern.values()].sort((left, right) => left.concernSlug.localeCompare(right.concernSlug));
}

export function toDetectorFindingView(row: DetectorFindingRow): DetectorFinding {
  return DetectorFindingSchema.parse({
    id: row.id,
    runId: row.runId,
    versionId: row.versionId,
    commitId: row.commitId,
    commitFileId: row.commitFileId,
    diffBlockId: row.diffBlockId,
    graphNodeId: row.graphNodeId,
    graphNodeKey: row.graphNodeKey,
    findingKey: row.findingKey,
    concernSlug: row.concernSlug,
    target: detectorTarget(row),
    path: row.path,
    side: row.side,
    startLine: row.startLine,
    endLine: row.endLine,
    symbol: row.symbol,
    marker: row.marker,
    evidenceKind: row.evidenceKind,
    title: row.title,
    summary: row.summary,
    rationale: row.rationale,
    riskLevel: row.riskLevel,
    confidence: row.confidence,
    evidence: parseEvidence(row),
    createdAt: row.createdAt,
  });
}

function groupRows(
  rows: readonly DetectorFindingRow[],
  keyForRow: (row: DetectorFindingRow) => string | null,
): Map<string, DetectorFindingRow[]> {
  const groups = new Map<string, DetectorFindingRow[]>();
  for (const row of rows) {
    const key = keyForRow(row);
    if (key === null) {
      continue;
    }
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, [row]);
    } else {
      group.push(row);
    }
  }
  return groups;
}

function detectorTarget(row: DetectorFindingRow): ReviewEntityScope {
  if (row.targetType === "version" && row.versionId !== null) {
    return { type: "version", versionId: row.versionId };
  }
  if (row.targetType === "commit" && row.commitId !== null) {
    return { type: "commit", commitId: row.commitId };
  }
  if (row.targetType === "commit_file" && row.commitFileId !== null) {
    return { type: "commit_file", commitFileId: row.commitFileId };
  }
  if (row.targetType === "diff_block" && row.diffBlockId !== null) {
    return { type: "diff_block", diffBlockId: row.diffBlockId };
  }
  throw invariantFailed("Detector finding scope is missing its target id.", {
    findingId: row.id,
    targetType: row.targetType,
    targetId: row.targetId,
  });
}

function parseEvidence(row: DetectorFindingRow): DetectorFindingEvidence[] {
  const parsed = JSON.parse(row.evidenceJson) as unknown;
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.map((evidence) => {
    const item = evidence as Record<string, unknown>;
    return DetectorFindingEvidenceSchema.parse({
      nodeKey: optionalString(item.nodeKey),
      path: optionalString(item.path),
      symbol: optionalString(item.symbol),
      marker: optionalString(item.marker),
      edgeKind: optionalString(item.edgeKind),
      reason: typeof item.reason === "string" && item.reason.trim().length > 0 ? item.reason : row.summary,
    });
  });
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function addEvidenceSummary(summaries: string[], summary: string): void {
  if (!summaries.includes(summary) && summaries.length < evidenceSummaryLimit) {
    summaries.push(summary);
  }
}

function higherRisk(
  left: DetectorFindingSummary["highestRiskLevel"],
  right: DetectorFindingSummary["highestRiskLevel"],
): DetectorFindingSummary["highestRiskLevel"] {
  const order = { low: 0, medium: 1, high: 2, critical: 3 } as const;
  return order[right] > order[left] ? right : left;
}

function higherConfidence(
  left: DetectorFindingSummary["highestConfidence"],
  right: DetectorFindingSummary["highestConfidence"],
): DetectorFindingSummary["highestConfidence"] {
  const order = { low: 0, medium: 1, high: 2 } as const;
  return order[right] > order[left] ? right : left;
}
