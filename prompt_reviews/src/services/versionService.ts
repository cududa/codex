import { z } from "zod";
import {
  CloseVersionParamsSchema,
  PopulateNextVersionParamsSchema,
  VersionDetailSchema,
  VersionSummarySchema,
  type CloseVersionParams,
  type PopulateNextVersionResponse,
  type RemainingWork,
  type VersionDetail,
  type VersionProgress,
  type VersionSummary,
} from "../domain/schemas/index.js";
import type { GitClient } from "../git/gitClient.js";
import {
  findVersionById,
  listCommitFilesByVersion,
  listCommitsByVersion,
  listVersions as listVersionRows,
  updateVersionStatus,
  type CommitRow,
  type VersionRow,
} from "../repositories/index.js";
import { createIngestionService } from "./ingestionService.js";
import { invariantFailed, notFound, validationFailed } from "./errors.js";
import { toCommitQueueItems } from "./reviewRead/commitViews.js";
import { createReviewQueueService } from "./reviewQueueService.js";
import { type RootServiceContext } from "./serviceContext.js";
import { recomputeVersionStatus } from "./statusService.js";

export type ListVersionsParams = {
  repositoryId?: string;
  status?: VersionRow["status"];
};

export type GetVersionDetailParams = {
  versionId: string;
};

export type VersionServiceDependencies = {
  gitClient: GitClient;
};

export type VersionService = {
  populateNextVersion: (params: unknown) => Promise<PopulateNextVersionResponse>;
  listVersions: (params?: ListVersionsParams) => VersionSummary[];
  getVersionDetail: (params: unknown) => VersionDetail;
  closeVersion: (params: unknown) => VersionSummary;
};

const GetVersionDetailParamsSchema = z
  .object({
    versionId: z.string().trim().min(1),
  })
  .strict();

export function createVersionService(
  context: RootServiceContext,
  dependencies: VersionServiceDependencies,
): VersionService {
  return {
    populateNextVersion: (params) => populateNextVersion(context, dependencies, params),
    listVersions: (params = {}) => listVersions(context, params),
    getVersionDetail: (params) => getVersionDetail(context, params),
    closeVersion: (params) => closeVersion(context, params),
  };
}

export async function populateNextVersion(
  context: RootServiceContext,
  dependencies: VersionServiceDependencies,
  params: unknown,
): Promise<PopulateNextVersionResponse> {
  const command = parseParams(PopulateNextVersionParamsSchema, params, "Invalid populate next version params.");
  return createIngestionService({ db: context.db, gitClient: dependencies.gitClient }).populateNextVersion(command);
}

export function listVersions(context: RootServiceContext, params: ListVersionsParams = {}): VersionSummary[] {
  return listVersionRows(context.db, params).map((version) => toVersionSummary(context, version));
}

export function getVersionDetail(context: RootServiceContext, params: unknown): VersionDetail {
  const command = parseParams(GetVersionDetailParamsSchema, params, "Invalid get version detail params.");
  const version = findRequiredVersion(context, command.versionId);
  const remainingWork = createReviewQueueService(context).getRemainingWork({ versionId: version.id });
  const commits = listCommitsByVersion(context.db, version.id);

  return VersionDetailSchema.parse({
    ...toVersionSummary(context, version, remainingWork),
    description: version.description ?? undefined,
    commits: toCommitQueueItems(context, commits),
    selectedCommit: undefined,
    remainingWork,
  });
}

export function closeVersion(context: RootServiceContext, params: unknown): VersionSummary {
  assertRawHumanActor(params, "finalizer", "Only human actors may close versions.");
  const command = parseParams(CloseVersionParamsSchema, params, "Invalid close version params.");
  if (command.finalizer.type !== "human") {
    throw invariantFailed("Only human actors may close versions.", { versionId: command.versionId });
  }
  return closeVersionWithHuman(context, command);
}

function closeVersionWithHuman(context: RootServiceContext, command: CloseVersionParams): VersionSummary {
  const version = findRequiredVersion(context, command.versionId);
  if (version.status === "closed") {
    return toVersionSummary(context, version);
  }

  const recomputed = recomputeVersionStatus(context, version.id);
  if (recomputed.status !== "ready") {
    throw invariantFailed("Version cannot close until review status is ready.", {
      versionId: version.id,
      status: recomputed.status,
    });
  }

  const blockers = createReviewQueueService(context)
    .getRemainingWork({ versionId: version.id })
    .filter((work) => work.kind !== "version_closure");
  if (blockers.length > 0) {
    throw invariantFailed("Version cannot close while remaining work exists.", {
      versionId: version.id,
      remainingWorkKinds: blockers.map((work) => work.kind),
    });
  }

  const now = context.now();
  const closed = updateVersionStatus(context.db, version.id, {
    status: "closed",
    closedAt: now,
    closedByActorType: command.finalizer.type,
    closedByActorId: command.finalizer.id ?? null,
    closedByDisplayName: command.finalizer.displayName ?? null,
    closureSummary: command.summary ?? null,
    updatedAt: now,
  });
  if (closed === undefined) {
    throw notFound("version", version.id);
  }
  return toVersionSummary(context, closed);
}

function toVersionSummary(context: RootServiceContext, row: VersionRow, remainingWork?: RemainingWork[]): VersionSummary {
  return VersionSummarySchema.parse({
    id: row.id,
    label: row.label,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? undefined,
    closedAt: row.closedAt ?? undefined,
    progress: versionProgress(context, row.id, remainingWork),
  });
}

function versionProgress(context: RootServiceContext, versionId: string, remainingWorkInput?: RemainingWork[]): VersionProgress {
  const commits = listCommitsByVersion(context.db, versionId);
  const files = listCommitFilesByVersion(context.db, versionId);
  const remainingWork = (remainingWorkInput ?? createReviewQueueService(context).getRemainingWork({ versionId })).filter(
    (work) => work.kind !== "version_closure",
  );

  return {
    totalCommits: commits.length,
    reviewedCommits: commits.filter((commit) => isReviewedStatus(commit.reviewStatus)).length,
    totalFiles: files.length,
    reviewedFiles: files.filter((file) => isReviewedStatus(file.reviewStatus)).length,
    unresolvedComments: remainingWork.find((work) => work.kind === "comment")?.count ?? 0,
    pendingDecisions: remainingWork.find((work) => work.kind === "decision")?.count ?? 0,
    incompletePlans: remainingWork.find((work) => work.kind === "plan")?.count ?? 0,
    remainingWorkCount: remainingWork.reduce((total, work) => total + work.count, 0),
  };
}

function findRequiredVersion(context: RootServiceContext, versionId: string): VersionRow {
  const version = findVersionById(context.db, versionId);
  if (version === undefined) {
    throw notFound("version", versionId);
  }
  return version;
}

function isReviewedStatus(status: CommitRow["reviewStatus"]): boolean {
  return status === "accepted" || status === "accepted_with_watch" || status === "rejected";
}

function assertRawHumanActor(params: unknown, actorKey: string, message: string): void {
  if (params === null || typeof params !== "object" || !(actorKey in params)) {
    return;
  }
  const actor = (params as Record<string, unknown>)[actorKey];
  if (actor === null || typeof actor !== "object" || !("type" in actor)) {
    return;
  }
  if ((actor as Record<string, unknown>).type !== "human") {
    throw invariantFailed(message, { actorType: (actor as Record<string, unknown>).type });
  }
}

function parseParams<T>(schema: z.ZodType<T>, params: unknown, message: string): T {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw validationFailed(message, { issues: parsed.error.issues });
  }
  return parsed.data;
}
