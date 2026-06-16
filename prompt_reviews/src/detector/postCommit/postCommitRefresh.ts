import { concernMapVersion } from "../../domain/concernMap.js";
import type { PromptReviewsDatabase } from "../../db/client.js";
import type { GitChangedFile } from "../../git/changeFiles.js";
import type { GitClient } from "../../git/gitClient.js";
import {
  createDetectorRun,
  replaceDetectorFindingsForRun,
  updateDetectorRun,
  withRepositoryTransaction,
  type RepositoryDatabase,
} from "../../repositories/index.js";
import { unixSecondsNow } from "../../db/timestamps.js";
import { extractRustSources } from "../extraction/rustExtractor.js";
import { isTextScannablePath, scanTextFiles } from "../extraction/textScanner.js";
import type { ExtractionOutput, SourceFileInput } from "../extraction/types.js";
import { buildConcernGraph } from "../graph/index.js";
import { persistConcernGraphExpansion } from "../graph/persistExpansion.js";

export type RunPostCommitRefreshInput = {
  db: PromptReviewsDatabase;
  gitClient: GitClient;
  repositoryId: string;
  commitRef?: string;
};

export type PostCommitRefreshSummary = {
  runId: string;
  commitSha: string;
  changedFileCount: number;
  sourceFileCount: number;
  graphNodeCount: number;
  graphEdgeCount: number;
  findingCount: 0;
};

export async function runPostCommitRefresh(
  input: RunPostCommitRefreshInput,
): Promise<PostCommitRefreshSummary> {
  const commitSha = await input.gitClient.resolveRef(input.commitRef ?? "HEAD");
  const runId = postCommitRefreshRunId(input.repositoryId, commitSha);
  const changedFiles = await input.gitClient.listChangedFiles(commitSha);
  const sourceFiles = await changedSourceFiles(input.gitClient, commitSha, changedFiles);
  const extraction = extractChangedSources(sourceFiles);
  const graph = buildConcernGraph({
    detectorVersion: concernMapVersion,
    sourceRef: commitSha,
    sourceRunId: runId,
    extraction,
  });

  return withRepositoryTransaction(input.db, (tx) => {
    const startedAt = unixSecondsNow();
    createOrUpdateRunningRun(tx, {
      runId,
      repositoryId: input.repositoryId,
      commitSha,
      startedAt,
    });
    const persisted = persistConcernGraphExpansion(tx, graph, {
      sourceKinds: ["ast_extractor", "text_scanner", "graph_builder"],
    });
    const findings = replaceDetectorFindingsForRun(tx, runId, []);
    const completedAt = unixSecondsNow();
    updateDetectorRun(tx, runId, {
      status: "succeeded",
      completedAt,
      error: null,
      summaryJson: JSON.stringify({
        changedFiles: changedFiles.length,
        sourceFiles: sourceFiles.length,
        graphNodes: persisted.graphNodes.length,
        graphEdges: persisted.graphEdges.length,
        findings: findings.length,
      }),
      updatedAt: completedAt,
    });

    return {
      runId,
      commitSha,
      changedFileCount: changedFiles.length,
      sourceFileCount: sourceFiles.length,
      graphNodeCount: persisted.graphNodes.length,
      graphEdgeCount: persisted.graphEdges.length,
      findingCount: 0,
    };
  });
}

export function postCommitRefreshRunId(repositoryId: string, commitSha: string): string {
  return `drun_post_commit_${slugSegment(repositoryId)}_${commitSha.slice(0, 40)}`;
}

async function changedSourceFiles(
  gitClient: GitClient,
  commitSha: string,
  files: readonly GitChangedFile[],
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

function extractChangedSources(sources: readonly SourceFileInput[]): ExtractionOutput {
  const rustExtraction = extractRustSources(sources.filter((source) => source.path.endsWith(".rs")));
  return {
    nodes: rustExtraction.nodes,
    edges: rustExtraction.edges,
    scanHits: scanTextFiles(sources.filter((source) => isTextScannablePath(source.path))),
  };
}

function createOrUpdateRunningRun(
  db: RepositoryDatabase,
  params: { runId: string; repositoryId: string; commitSha: string; startedAt: number },
): void {
  const values = {
    versionId: null,
    repositoryId: params.repositoryId,
    runKind: "post_commit_refresh" as const,
    status: "running" as const,
    concernMapVersion,
    baseSha: null,
    targetSha: params.commitSha,
    sourceRef: params.commitSha,
    startedAt: params.startedAt,
    completedAt: null,
    error: null,
    summaryJson: "{}",
    updatedAt: params.startedAt,
  };
  const updated = updateDetectorRun(db, params.runId, values);
  if (updated === undefined) {
    createDetectorRun(db, { id: params.runId, createdAt: params.startedAt, ...values });
  }
}

function slugSegment(value: string): string {
  const normalized = value.replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  return normalized.length > 0 ? normalized.slice(0, 40) : "repo";
}
