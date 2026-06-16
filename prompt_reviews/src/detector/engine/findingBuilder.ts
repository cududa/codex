import type {
  ConfidenceLevel,
  DetectorFindingEvidenceKind,
  ReviewEntityScopeType,
  RiskLevel,
} from "../../domain/enums.js";
import type { DetectorFindingInsert } from "../../repositories/detectorRepository.js";
import { mapSourceRangeToDiff, type CommitFileDiffMappingInput, type DiffLineMapping } from "../diff/diffMapping.js";
import type { ConcernGraphBuildNode } from "../graph/index.js";
import type { BuildDetectorFindingsInput, DetectorCommitFileInput, DetectorCommitInput } from "./types.js";

type SourceLineRange = {
  startLine: number;
  endLine: number;
};

type MatchedFile = {
  commit: DetectorCommitInput;
  file: DetectorCommitFileInput;
};

type FindingConfidence = Extract<ConfidenceLevel, "low" | "medium" | "high">;

export function buildDetectorFindings(input: BuildDetectorFindingsInput): DetectorFindingInsert[] {
  const findings = sortedGraphNodes(input.graph.nodes).flatMap((node) => findingsForNode(input.runId, node, input.commits));
  return sortFindingsByKey(findings);
}

function findingsForNode(
  runId: string,
  node: ConcernGraphBuildNode,
  commits: readonly DetectorCommitInput[],
): DetectorFindingInsert[] {
  if (node.path === undefined) {
    return [];
  }

  const matches = sortedMatchedFiles(node.path, commits);
  const range = lineRangeForNode(node);
  return matches.flatMap(({ commit, file }) => {
    if (range === null) {
      return [findingFromMapping(runId, node, commit, file, pathOnlyMapping(file), "low")];
    }

    return mapSourceRangeToDiff(diffMappingFile(file), {
      path: node.path ?? "",
      startLine: range.startLine,
      endLine: range.endLine,
    }).map((mapping) => findingFromMapping(runId, node, commit, file, mapping, confidenceForMapping(node, mapping)));
  });
}

function findingFromMapping(
  runId: string,
  node: ConcernGraphBuildNode,
  commit: DetectorCommitInput,
  file: DetectorCommitFileInput,
  mapping: DiffLineMapping,
  confidence: FindingConfidence,
): DetectorFindingInsert {
  const target = targetForMapping(mapping);
  const path = mapping.path ?? node.path ?? file.newPath ?? file.oldPath ?? null;
  const rationale = rationaleFor(node, mapping, confidence);
  return {
    runId,
    versionId: commit.versionId ?? null,
    commitId: commit.commitId,
    commitFileId: file.commitFileId,
    diffBlockId: mapping.diffBlockId,
    graphNodeKey: node.nodeKey,
    findingKey: findingKey(node, commit, file, mapping),
    concernSlug: node.concernSlug,
    targetType: target.targetType,
    targetId: target.targetId,
    path,
    side: mapping.side,
    startLine: mapping.startLine,
    endLine: mapping.endLine,
    symbol: node.symbol ?? null,
    marker: node.marker ?? null,
    evidenceKind: evidenceKindFor(node, mapping),
    title: titleFor(node),
    summary: summaryFor(node, mapping),
    rationale,
    riskLevel: riskLevelForConfidence(confidence),
    confidence,
    evidenceJson: JSON.stringify(evidenceFor(node, mapping, rationale)),
  };
}

function sortedMatchedFiles(path: string, commits: readonly DetectorCommitInput[]): MatchedFile[] {
  return [...commits]
    .sort((left, right) => left.commitId.localeCompare(right.commitId))
    .flatMap((commit) =>
      [...commit.files]
        .filter((file) => pathMatchesFile(file, path))
        .sort((left, right) => left.commitFileId.localeCompare(right.commitFileId))
        .map((file) => ({ commit, file })),
    );
}

function pathMatchesFile(file: DetectorCommitFileInput, path: string): boolean {
  return file.oldPath === path || file.newPath === path;
}

function diffMappingFile(file: DetectorCommitFileInput): CommitFileDiffMappingInput {
  return {
    id: file.commitFileId,
    oldPath: file.oldPath,
    newPath: file.newPath,
    diffBlocks: file.diffBlocks,
  };
}

function pathOnlyMapping(file: DetectorCommitFileInput): DiffLineMapping {
  return {
    mappingKey: `${file.commitFileId}:file:path_only:path:path`,
    mappingKind: "path_only",
    commitFileId: file.commitFileId,
    diffBlockId: null,
    diffBlockOrdinal: null,
    path: file.newPath ?? file.oldPath ?? null,
    side: null,
    startLine: null,
    endLine: null,
    oldStartLine: null,
    oldEndLine: null,
    newStartLine: null,
    newEndLine: null,
    reason: "graph_node_path_matches_changed_file_without_line_range",
  };
}

function lineRangeForNode(node: ConcernGraphBuildNode): SourceLineRange | null {
  const metadataRange = rangeFromUnknown(recordValue(node.metadata, "range"));
  if (metadataRange !== null) {
    return metadataRange;
  }
  return rangeFromUnknown(node);
}

function rangeFromUnknown(value: unknown): SourceLineRange | null {
  if (!isRecord(value)) {
    return null;
  }
  const startLine = value.startLine;
  const endLine = value.endLine;
  if (typeof startLine !== "number" || typeof endLine !== "number" || startLine < 1 || endLine < startLine) {
    return null;
  }
  return { startLine, endLine };
}

function confidenceForMapping(node: ConcernGraphBuildNode, mapping: DiffLineMapping): FindingConfidence {
  if (mapping.mappingKind === "path_only") {
    return "low";
  }
  return node.isSeed ? "high" : "medium";
}

function targetForMapping(mapping: DiffLineMapping): { targetType: ReviewEntityScopeType; targetId: string } {
  if (mapping.diffBlockId !== null) {
    return { targetType: "diff_block", targetId: mapping.diffBlockId };
  }
  return { targetType: "commit_file", targetId: mapping.commitFileId };
}

function evidenceKindFor(node: ConcernGraphBuildNode, mapping: DiffLineMapping): DetectorFindingEvidenceKind {
  if (mapping.diffBlockId !== null && mapping.mappingKind === "changed_lines") {
    return "diff_block";
  }
  if (node.nodeKind === "template_marker") {
    return "template_marker";
  }
  if (node.marker !== undefined) {
    return "marker";
  }
  if (node.symbol !== undefined) {
    return "symbol";
  }
  if (node.path !== undefined) {
    return "path";
  }
  return "graph_node";
}

function riskLevelForConfidence(confidence: FindingConfidence): RiskLevel {
  if (confidence === "high") {
    return "high";
  }
  if (confidence === "medium") {
    return "medium";
  }
  return "low";
}

function titleFor(node: ConcernGraphBuildNode): string {
  return `${node.concernSlug} source graph node touched`;
}

function summaryFor(node: ConcernGraphBuildNode, mapping: DiffLineMapping): string {
  const descriptor = node.symbol ?? node.marker ?? node.path ?? node.nodeKey;
  if (mapping.mappingKind === "changed_lines") {
    return `Changed lines overlap ${descriptor}.`;
  }
  return `Changed file path matches ${descriptor}.`;
}

function rationaleFor(node: ConcernGraphBuildNode, mapping: DiffLineMapping, confidence: FindingConfidence): string {
  if (mapping.mappingKind === "changed_lines") {
    return `${confidence} confidence because changed lines overlap a ${node.isSeed ? "seeded" : "expanded"} ${node.concernSlug} graph node.`;
  }
  return "low confidence because the changed file matches the graph node path without line-level overlap.";
}

function evidenceFor(node: ConcernGraphBuildNode, mapping: DiffLineMapping, rationale: string): unknown[] {
  return [
    withoutUndefined({
      nodeKey: node.nodeKey,
      path: mapping.path ?? node.path,
      symbol: node.symbol,
      marker: node.marker,
      reason: rationale,
      mappingKey: mapping.mappingKey,
      mappingKind: mapping.mappingKind,
      mappingReason: mapping.reason,
      side: mapping.side ?? undefined,
      startLine: mapping.startLine ?? undefined,
      endLine: mapping.endLine ?? undefined,
    }),
  ];
}

function findingKey(
  node: ConcernGraphBuildNode,
  commit: DetectorCommitInput,
  file: DetectorCommitFileInput,
  mapping: DiffLineMapping,
): string {
  return stableKey([
    "detector_finding",
    node.concernSlug,
    commit.commitId,
    file.commitFileId,
    mapping.diffBlockId ?? "commit_file",
    node.nodeKey,
    mapping.side ?? "path",
    mapping.startLine ?? "path",
    mapping.endLine ?? "path",
  ]);
}

function sortedGraphNodes(nodes: readonly ConcernGraphBuildNode[]): ConcernGraphBuildNode[] {
  return [...nodes].sort(
    (left, right) =>
      left.concernSlug.localeCompare(right.concernSlug) ||
      nullableString(left.path).localeCompare(nullableString(right.path)) ||
      left.nodeKey.localeCompare(right.nodeKey),
  );
}

function sortFindingsByKey(findings: readonly DetectorFindingInsert[]): DetectorFindingInsert[] {
  return [...findings].sort((left, right) => left.findingKey.localeCompare(right.findingKey));
}

function stableKey(parts: readonly (number | string)[]): string {
  return parts.map((part) => encodeURIComponent(String(part))).join(":");
}

function recordValue(record: Record<string, unknown>, key: string): unknown {
  return record[key];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: string | undefined): string {
  return value ?? "";
}

function withoutUndefined(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}
