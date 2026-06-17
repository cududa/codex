import { concernAreaSlugs, concernMapVersion } from "../../domain/concernMap.js";
import type { ConcernGraphSourceKind } from "../../domain/enums.js";
import type { ConcernAreaSlug } from "../../domain/schemas/concernDetector/index.js";
import type { GitClient } from "../../git/gitClient.js";
import {
  listCommitFilesByCommit,
  listCommitsByVersion,
  listDiffBlocksByCommitFile,
  type CommitFileRow,
  type CommitRow,
  type DetectorFindingInsert,
  type DiffBlockRow,
  type RepositoryDatabase,
  type VersionRow,
  findVersionById,
} from "../../repositories/index.js";
import { extractRustSources } from "../extraction/rustExtractor.js";
import { isTextScannablePath, scanTextFiles } from "../extraction/textScanner.js";
import type { ExtractedEdge, ExtractedNode, ExtractionOutput, SourceFileInput, TextScanHit } from "../extraction/types.js";
import { buildDetectorFindings } from "../engine/findingBuilder.js";
import { runDetector, type GraphReplacementScope, type RunDetectorResult } from "../engine/runDetector.js";
import type { DetectorCommitFileInput, DetectorCommitInput } from "../engine/types.js";
import { buildConcernGraph } from "../graph/index.js";

export type RunVersionIngestionDetectorInput = {
  db: RepositoryDatabase;
  gitClient: GitClient;
  version: VersionRow;
};

export type RerunVersionIngestionDetectorInput = {
  db: RepositoryDatabase;
  gitClient: GitClient;
  versionId: string;
  repositoryId?: string;
};

export class VersionIngestionDetectorError extends Error {
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "VersionIngestionDetectorError";
    this.code = code;
    this.details = details;
  }
}

export async function rerunVersionIngestionDetector(
  input: RerunVersionIngestionDetectorInput,
): Promise<RunDetectorResult> {
  const version = findVersionById(input.db, input.versionId);
  if (version === undefined) {
    throw new VersionIngestionDetectorError("version_not_found", "Version was not found.", {
      versionId: input.versionId,
    });
  }
  if (input.repositoryId !== undefined && version.repositoryId !== input.repositoryId) {
    throw new VersionIngestionDetectorError("version_repository_mismatch", "Version belongs to a different repository.", {
      versionId: input.versionId,
      repositoryId: input.repositoryId,
      versionRepositoryId: version.repositoryId,
    });
  }

  return runVersionIngestionDetector({ db: input.db, gitClient: input.gitClient, version });
}

export async function runVersionIngestionDetector(
  input: RunVersionIngestionDetectorInput,
): Promise<RunDetectorResult> {
  const runId = versionIngestionRunId(input.version.id);
  const accumulatedExtraction = emptyExtraction();
  const findings: DetectorFindingInsert[] = [];
  const commits = listCommitsByVersion(input.db, input.version.id);

  for (const commit of commits) {
    const files = listCommitFilesByCommit(input.db, commit.id);
    const graphBeforeCommit = buildConcernGraph({
      detectorVersion: concernMapVersion,
      sourceRef: input.version.id,
      sourceRunId: runId,
      extraction: accumulatedExtraction,
    });
    findings.push(
      ...buildDetectorFindings({
        runId,
        graph: graphBeforeCommit,
        commits: [detectorCommitInput(input.db, commit, files)],
      }),
    );
    appendExtraction(accumulatedExtraction, await extractChangedFiles(input.gitClient, commit.sha, files));
  }

  const finalGraph = buildConcernGraph({
    detectorVersion: concernMapVersion,
    sourceRef: input.version.id,
    sourceRunId: runId,
    extraction: accumulatedExtraction,
  });

  return runDetector({
    db: input.db,
    run: {
      id: runId,
      versionId: input.version.id,
      repositoryId: input.version.repositoryId,
      runKind: "version_ingestion",
      concernMapVersion,
      baseSha: input.version.baseSha,
      targetSha: input.version.targetSha,
      sourceRef: input.version.id,
    },
    graph: finalGraph,
    commits: [],
    findings,
    graphReplacementScopes: allDetectorReplacementScopes(),
  });
}

export function versionIngestionRunId(versionId: string): string {
  return `drun_version_ingestion_${versionId}`;
}

function detectorCommitInput(
  db: RepositoryDatabase,
  commit: CommitRow,
  files: readonly CommitFileRow[],
): DetectorCommitInput {
  return {
    commitId: commit.id,
    versionId: commit.versionId,
    files: files.map((file) => detectorCommitFileInput(db, file)),
  };
}

function detectorCommitFileInput(db: RepositoryDatabase, file: CommitFileRow): DetectorCommitFileInput {
  return {
    commitFileId: file.id,
    oldPath: file.oldPath,
    newPath: file.newPath,
    diffBlocks: listDiffBlocksByCommitFile(db, file.id).map(toDiffBlockMappingInput),
  };
}

function toDiffBlockMappingInput(block: DiffBlockRow) {
  return {
    id: block.id,
    commitFileId: block.commitFileId,
    ordinal: block.ordinal,
    oldStartLine: block.oldStartLine,
    oldEndLine: block.oldEndLine,
    newStartLine: block.newStartLine,
    newEndLine: block.newEndLine,
    patch: block.patch,
  };
}

async function extractChangedFiles(
  gitClient: GitClient,
  commitSha: string,
  files: readonly CommitFileRow[],
): Promise<ExtractionOutput> {
  const sources = await changedSourceFiles(gitClient, commitSha, files);
  const rustExtraction = extractRustSources(sources.filter((source) => source.path.endsWith(".rs")));
  return sortedExtraction({
    nodes: rustExtraction.nodes,
    edges: rustExtraction.edges,
    scanHits: scanTextFiles(sources.filter((source) => isTextScannablePath(source.path))),
  });
}

async function changedSourceFiles(
  gitClient: GitClient,
  commitSha: string,
  files: readonly CommitFileRow[],
): Promise<SourceFileInput[]> {
  const sources: SourceFileInput[] = [];
  for (const file of files) {
    if (file.newPath === null) {
      continue;
    }
    const content = await gitClient.getFileAtCommit(commitSha, file.newPath);
    if (content === null || content.includes("\0")) {
      continue;
    }
    sources.push({ path: file.newPath, content });
  }
  return sources.sort((left, right) => left.path.localeCompare(right.path));
}

function appendExtraction(target: ExtractionOutput, source: ExtractionOutput): void {
  target.nodes = sortNodes([...target.nodes, ...source.nodes]);
  target.edges = sortEdges([...target.edges, ...source.edges]);
  target.scanHits = sortScanHits([...target.scanHits, ...source.scanHits]);
}

function emptyExtraction(): ExtractionOutput {
  return { nodes: [], edges: [], scanHits: [] };
}

function sortedExtraction(output: ExtractionOutput): ExtractionOutput {
  return {
    nodes: sortNodes(output.nodes),
    edges: sortEdges(output.edges),
    scanHits: sortScanHits(output.scanHits),
  };
}

function allDetectorReplacementScopes(): GraphReplacementScope[] {
  const sourceKinds = ["concern_map", "ast_extractor", "text_scanner", "graph_builder"] as const satisfies readonly ConcernGraphSourceKind[];
  return concernAreaSlugs.flatMap((concernSlug) =>
    sourceKinds.map((sourceKind) => ({
      concernSlug: concernSlug as ConcernAreaSlug,
      sourceKind,
    })),
  );
}

function sortNodes(nodes: readonly ExtractedNode[]): ExtractedNode[] {
  return [...nodes].sort((left, right) => left.nodeKey.localeCompare(right.nodeKey));
}

function sortEdges(edges: readonly ExtractedEdge[]): ExtractedEdge[] {
  return [...edges].sort((left, right) => left.edgeKey.localeCompare(right.edgeKey));
}

function sortScanHits(hits: readonly TextScanHit[]): TextScanHit[] {
  return [...hits].sort((left, right) => left.hitKey.localeCompare(right.hitKey));
}
