import {
  PopulateNextVersionParamsSchema,
  PopulateNextVersionResponseSchema,
  type PopulateNextVersionParams,
  type PopulateNextVersionResponse,
  type VersionProgress,
  type VersionSummary,
} from "../domain/schemas/index.js";
import { createCommandGitClient, type GitClient } from "../git/gitClient.js";
import type { GitChangedFile } from "../git/changeFiles.js";
import type { GitCommit } from "../git/commitLog.js";
import { parseGitDiff, type ParsedDiffFile } from "../git/diffParser.js";
import {
  bulkInsertCommitFiles,
  bulkInsertCommits,
  bulkInsertDiffBlocks,
  createVersion,
  findLastClosedTarget,
  findVersionById,
  findVersionByRange,
  listCommitFilesByCommit,
  listCommitsByVersion,
  listDiffBlocksByCommitFile,
  withRepositoryTransaction,
  type CommitFileRow,
  type CommitRow,
  type VersionRow,
} from "../repositories/index.js";
import type { PromptReviewsDatabase } from "../db/client.js";
import { buildDiffBlocksForFile } from "./diffBlockBuilder.js";

const defaultTargetRef = "upstream/main";
const reviewedStatuses = new Set(["accepted", "accepted_with_watch", "rejected"]);

type CommitIngestionPayload = {
  commit: GitCommit;
  files: GitChangedFile[];
  diffFiles: ParsedDiffFile[];
};

export type PopulateNextVersionOptions = {
  gitClient?: GitClient;
  repositoryPath?: string;
};

export class PopulateNextVersionError extends Error {
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "PopulateNextVersionError";
    this.code = code;
    this.details = details;
  }
}

export async function populateNextVersion(
  db: PromptReviewsDatabase,
  rawParams: PopulateNextVersionParams,
  options: PopulateNextVersionOptions = {},
): Promise<PopulateNextVersionResponse> {
  const params = PopulateNextVersionParamsSchema.parse(rawParams);
  const gitClient = options.gitClient ?? createCommandGitClient(options.repositoryPath ?? process.cwd());
  const targetRef = params.targetRef ?? defaultTargetRef;
  const targetSha = await gitClient.resolveRef(targetRef);
  const baseSha = await resolveBaseSha(db, gitClient, params);

  const existing = findVersionByRange(db, { baseSha, targetSha });
  if (existing !== undefined) {
    return PopulateNextVersionResponseSchema.parse({
      ...buildResponse(db, existing),
      baseSha,
      targetSha,
      created: false,
    });
  }

  const commits = await gitClient.listCommits(baseSha, targetSha);
  const commitPayloads: CommitIngestionPayload[] = [];
  for (const commit of commits) {
    commitPayloads.push({
      commit,
      files: await gitClient.listChangedFiles(commit.sha),
      diffFiles: parseGitDiff(await gitClient.getCommitDiff(commit.sha)),
    });
  }

  const version = withRepositoryTransaction(db, (tx) => {
    const insertedVersion = createVersion(tx, {
      repositoryId: params.repositoryId,
      label: params.label ?? defaultLabel(baseSha, targetSha),
      baseSha,
      targetSha,
    });

    const insertedCommits = bulkInsertCommits(
      tx,
      commitPayloads.map(({ commit }, index) => ({
        versionId: insertedVersion.id,
        sha: commit.sha,
        parentSha: commit.parentSha,
        ordinal: index + 1,
        title: commit.subject,
        message: commit.body,
        authorName: commit.authorName,
        authorEmail: commit.authorEmail,
        committedAt: commit.committedAt,
      })),
    );

    for (const [commitIndex, insertedCommit] of insertedCommits.entries()) {
      const payload = commitPayloads[commitIndex];
      if (payload === undefined) {
        throw new PopulateNextVersionError("ingestion_payload_mismatch", "Commit ingestion payload was incomplete.");
      }

      const insertedFiles = bulkInsertCommitFiles(
        tx,
        payload.files.map((file) => ({
          commitId: insertedCommit.id,
          oldPath: file.oldPath,
          newPath: file.newPath,
          changeType: file.changeType,
          additions: file.additions,
          deletions: file.deletions,
        })),
      );

      for (const [fileIndex, insertedFile] of insertedFiles.entries()) {
        const changedFile = payload.files[fileIndex];
        if (changedFile === undefined) {
          throw new PopulateNextVersionError("ingestion_payload_mismatch", "File ingestion payload was incomplete.");
        }

        bulkInsertDiffBlocks(
          tx,
          buildDiffBlocksForFile(changedFile, payload.diffFiles).map((block) => ({
            commitFileId: insertedFile.id,
            ...block,
          })),
        );
      }
    }

    return insertedVersion;
  });

  return PopulateNextVersionResponseSchema.parse({
    ...buildResponse(db, version),
    baseSha,
    targetSha,
    created: true,
  });
}

async function resolveBaseSha(
  db: PromptReviewsDatabase,
  gitClient: GitClient,
  params: PopulateNextVersionParams,
): Promise<string> {
  if (params.baseRefOrSha !== undefined) {
    return gitClient.resolveRef(params.baseRefOrSha);
  }

  if (params.baseVersionId !== undefined) {
    const version = findVersionById(db, params.baseVersionId);
    if (version === undefined || version.repositoryId !== params.repositoryId) {
      throw new PopulateNextVersionError("base_version_not_found", "Base version was not found for this repository.", {
        baseVersionId: params.baseVersionId,
        repositoryId: params.repositoryId,
      });
    }
    return gitClient.resolveRef(version.targetSha);
  }

  const lastClosed = findLastClosedTarget(db, { repositoryId: params.repositoryId });
  if (lastClosed === undefined) {
    throw new PopulateNextVersionError("base_required", "No closed version exists; pass baseRefOrSha explicitly.", {
      repositoryId: params.repositoryId,
    });
  }
  return gitClient.resolveRef(lastClosed.targetSha);
}

function buildResponse(db: PromptReviewsDatabase, version: VersionRow): Omit<PopulateNextVersionResponse, "created"> {
  const commits = listCommitsByVersion(db, version.id);
  const files = commits.flatMap((commit) => listCommitFilesByCommit(db, commit.id));
  const diffBlockCount = files.reduce(
    (count, file) => count + listDiffBlocksByCommitFile(db, file.id).length,
    0,
  );

  return {
    version: toVersionSummary(version, commits, files),
    baseSha: version.baseSha,
    targetSha: version.targetSha,
    commitCount: commits.length,
    fileCount: files.length,
    diffBlockCount,
  };
}

function toVersionSummary(version: VersionRow, commits: readonly CommitRow[], files: readonly CommitFileRow[]): VersionSummary {
  const progress: VersionProgress = {
    totalCommits: commits.length,
    reviewedCommits: commits.filter((commit) => reviewedStatuses.has(commit.reviewStatus)).length,
    totalFiles: files.length,
    reviewedFiles: files.filter((file) => reviewedStatuses.has(file.reviewStatus)).length,
    unresolvedComments: 0,
    pendingDecisions: 0,
    incompletePlans: 0,
    remainingWorkCount: commits.length + files.length,
  };

  return {
    id: version.id,
    label: version.label,
    status: version.status,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt ?? undefined,
    closedAt: version.closedAt ?? undefined,
    progress,
  };
}

function defaultLabel(baseSha: string, targetSha: string): string {
  return `${baseSha.slice(0, 12)}..${targetSha.slice(0, 12)}`;
}
