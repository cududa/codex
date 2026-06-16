import { z } from "zod";
import type { ReviewStatus, VersionStatus } from "../domain/enums.js";
import {
  OverrideCommitStatusParamsSchema,
  OverrideFileStatusParamsSchema,
  type OverrideCommitStatusParams,
  type OverrideFileStatusParams,
} from "../domain/schemas/index.js";
import {
  deriveCommitFileStatus,
  deriveCommitStatus,
  deriveVersionReadiness,
  type CommitFileStatusInput,
  type StatusDecision,
  type StatusOverride,
  type StatusPlan,
} from "../domain/rules/status.js";
import {
  findCommitById,
  findCommitFileById,
  findVersionById,
  listCommentsByScopeStatus,
  listCommitFilesByCommit,
  listCommitFilesByVersion,
  listCommitsByVersion,
  listDecisionsByTarget,
  listDiffBlocksByCommitFile,
  listPlanItems,
  listPlansByTarget,
  listTaggingsByTarget,
  updateCommitFileReviewFields,
  updateCommitFileStatusOverride,
  updateCommitReviewFields,
  updateCommitStatusOverride,
  updateVersionStatus,
  type CommitFileRow,
  type CommitRow,
  type VersionRow,
} from "../repositories/index.js";
import { invariantFailed, notFound, validationFailed } from "./errors.js";
import type { ServiceContext } from "./serviceContext.js";

export type ReviewStatusResult = {
  id: string;
  status: ReviewStatus;
};

export type VersionStatusResult = {
  id: string;
  status: VersionStatus;
};

export type StatusService = {
  recomputeFileStatus: (commitFileId: string) => ReviewStatusResult;
  recomputeCommitStatus: (commitId: string) => ReviewStatusResult;
  recomputeVersionStatus: (versionId: string) => VersionStatusResult;
  overrideFileStatus: (params: unknown) => ReviewStatusResult;
  overrideCommitStatus: (params: unknown) => ReviewStatusResult;
};

export function createStatusService(context: ServiceContext): StatusService {
  return {
    recomputeFileStatus: (commitFileId) => recomputeFileStatus(context, commitFileId),
    recomputeCommitStatus: (commitId) => recomputeCommitStatus(context, commitId),
    recomputeVersionStatus: (versionId) => recomputeVersionStatus(context, versionId),
    overrideFileStatus: (params) => overrideFileStatus(context, params),
    overrideCommitStatus: (params) => overrideCommitStatus(context, params),
  };
}

export function overrideFileStatus(context: ServiceContext, params: unknown): ReviewStatusResult {
  const command = parseParams(OverrideFileStatusParamsSchema, params, "Invalid file status override params.");
  const file = findRequiredCommitFile(context, command.commitFileId);
  updateCommitFileStatusOverride(context.db, file.id, toFileOverrideUpdate(command, context.now()));
  return recomputeFileStatus(context, file.id);
}

export function overrideCommitStatus(context: ServiceContext, params: unknown): ReviewStatusResult {
  const command = parseParams(OverrideCommitStatusParamsSchema, params, "Invalid commit status override params.");
  const commit = findRequiredCommit(context, command.commitId);
  updateCommitStatusOverride(context.db, commit.id, toCommitOverrideUpdate(command, context.now()));
  return recomputeCommitStatus(context, commit.id);
}

export function recomputeFileStatus(context: ServiceContext, commitFileId: string): ReviewStatusResult {
  const file = findRequiredCommitFile(context, commitFileId);
  const status = deriveCommitFileStatus(hydrateFileStatusInput(context, file));
  updateCommitFileReviewFields(context.db, file.id, { reviewStatus: status, updatedAt: context.now() });
  recomputeCommitStatus(context, file.commitId);
  return { id: file.id, status };
}

export function recomputeCommitStatus(context: ServiceContext, commitId: string): ReviewStatusResult {
  const commit = findRequiredCommit(context, commitId);
  const status = recomputeCommitStatusOnly(context, commit);
  recomputeVersionStatus(context, commit.versionId);
  return { id: commit.id, status };
}

export function recomputeVersionStatus(context: ServiceContext, versionId: string): VersionStatusResult {
  const version = findRequiredVersion(context, versionId);
  if (version.status === "closed") {
    return { id: version.id, status: version.status };
  }

  const commits = listCommitsByVersion(context.db, version.id);
  const commitInputs = commits.map((commit) => {
    const files = listCommitFilesByCommit(context.db, commit.id).map((file) => hydrateFileStatusInput(context, file));
    const status = deriveCommitStatus({ files, override: statusOverrideFromCommit(commit) });
    updateCommitReviewFields(context.db, commit.id, { reviewStatus: status, updatedAt: context.now() });
    return { files, override: statusOverrideFromCommit(commit) };
  });
  const readiness = deriveVersionReadiness({ commits: commitInputs });
  const status = hasUnresolvedVersionWork(context, version.id) ? "reviewing" : readiness.status;

  updateVersionStatus(context.db, version.id, { status, updatedAt: context.now() });
  return { id: version.id, status };
}

function recomputeCommitStatusOnly(context: ServiceContext, commit: CommitRow): ReviewStatus {
  const files = listCommitFilesByCommit(context.db, commit.id).map((file) => hydrateFileStatusInput(context, file));
  const status = deriveCommitStatus({ files, override: statusOverrideFromCommit(commit) });
  updateCommitReviewFields(context.db, commit.id, { reviewStatus: status, updatedAt: context.now() });
  return status;
}

function hydrateFileStatusInput(context: ServiceContext, file: CommitFileRow): CommitFileStatusInput {
  const taggings = listTaggingsByTarget(context.db, { targetType: "commit_file", targetId: file.id });
  const decisions = listDecisionsByTarget(context.db, { scope: "commit_file", targetId: file.id }).map(toStatusDecision);
  const comments = [
    ...listCommentsByScopeStatus(context.db, { scope: "commit_file", targetId: file.id }),
    ...listDiffBlocksByCommitFile(context.db, file.id).flatMap((block) =>
      listCommentsByScopeStatus(context.db, { scope: "diff_block", targetId: block.id }),
    ),
  ];
  const plans = listPlansByTarget(context.db, { scope: "commit_file", targetId: file.id }).map<StatusPlan>((plan) => ({
    status: plan.status,
    items: listPlanItems(context.db, plan.id).map((item) => ({ status: item.status })),
  }));

  return {
    primaryTagSlugs: taggings.filter((tagging) => tagging.kind === "primary").map((tagging) => tagging.tagId),
    secondaryTagSlugs: taggings.filter((tagging) => tagging.kind === "secondary").map((tagging) => tagging.tagId),
    decisions,
    comments: comments.map((comment) => ({ status: comment.status })),
    plans,
    override: statusOverrideFromFile(file),
  };
}

function statusOverrideFromFile(file: CommitFileRow): StatusOverride | null {
  if (file.statusOverride === null) {
    return null;
  }
  return { status: file.statusOverride, reason: file.statusOverrideReason };
}

function statusOverrideFromCommit(commit: CommitRow): StatusOverride | null {
  if (commit.statusOverride === null) {
    return null;
  }
  return { status: commit.statusOverride, reason: commit.statusOverrideReason };
}

function toStatusDecision(row: ReturnType<typeof listDecisionsByTarget>[number]): StatusDecision {
  return {
    status: row.status,
    outcome: row.outcome,
    finalizedBy:
      row.finalizedByActorType === null
        ? null
        : {
            type: row.finalizedByActorType,
          },
  };
}

function hasUnresolvedVersionWork(context: ServiceContext, versionId: string): boolean {
  if (listCommentsByScopeStatus(context.db, { scope: "version", status: "open", targetId: versionId }).length > 0) {
    return true;
  }

  const commits = listCommitsByVersion(context.db, versionId);
  for (const commit of commits) {
    if (listCommentsByScopeStatus(context.db, { scope: "commit", status: "open", targetId: commit.id }).length > 0) {
      return true;
    }
    if (hasIncompleteAcceptedPlans(context, { scope: "commit", targetId: commit.id })) {
      return true;
    }
  }

  for (const file of listCommitFilesByVersion(context.db, versionId)) {
    if (fileHasUnresolvedWork(context, file)) {
      return true;
    }
  }

  return hasIncompleteAcceptedPlans(context, { scope: "version", targetId: versionId });
}

function fileHasUnresolvedWork(context: ServiceContext, file: CommitFileRow): boolean {
  if (listCommentsByScopeStatus(context.db, { scope: "commit_file", status: "open", targetId: file.id }).length > 0) {
    return true;
  }
  for (const block of listDiffBlocksByCommitFile(context.db, file.id)) {
    if (listCommentsByScopeStatus(context.db, { scope: "diff_block", status: "open", targetId: block.id }).length > 0) {
      return true;
    }
  }
  return hasIncompleteAcceptedPlans(context, { scope: "commit_file", targetId: file.id });
}

function hasIncompleteAcceptedPlans(
  context: ServiceContext,
  target: { scope: "version" | "commit" | "commit_file"; targetId: string },
): boolean {
  return listPlansByTarget(context.db, target, { status: "accepted" }).some((plan) =>
    listPlanItems(context.db, plan.id).some((item) =>
      item.status === "todo" || item.status === "in_progress" || item.status === "blocked",
    ),
  );
}

function findRequiredVersion(context: ServiceContext, versionId: string): VersionRow {
  const version = findVersionById(context.db, versionId);
  if (version === undefined) {
    throw notFound("version", versionId);
  }
  return version;
}

function findRequiredCommit(context: ServiceContext, commitId: string): CommitRow {
  const commit = findCommitById(context.db, commitId);
  if (commit === undefined) {
    throw notFound("commit", commitId);
  }
  return commit;
}

function findRequiredCommitFile(context: ServiceContext, commitFileId: string): CommitFileRow {
  const file = findCommitFileById(context.db, commitFileId);
  if (file === undefined) {
    throw notFound("commit_file", commitFileId);
  }
  if (file.oldPath === null && file.newPath === null) {
    throw invariantFailed("Commit file must have at least one path.", { commitFileId });
  }
  return file;
}

function toFileOverrideUpdate(command: OverrideFileStatusParams, now: number) {
  return {
    statusOverride: command.status,
    statusOverrideReason: command.reason,
    statusOverrideActorType: command.actor.type,
    statusOverrideActorId: command.actor.id ?? null,
    statusOverrideDisplayName: command.actor.displayName ?? null,
    statusOverrideAt: now,
    updatedAt: now,
  };
}

function toCommitOverrideUpdate(command: OverrideCommitStatusParams, now: number) {
  return {
    statusOverride: command.status,
    statusOverrideReason: command.reason,
    statusOverrideActorType: command.actor.type,
    statusOverrideActorId: command.actor.id ?? null,
    statusOverrideDisplayName: command.actor.displayName ?? null,
    statusOverrideAt: now,
    updatedAt: now,
  };
}

function parseParams<T>(schema: z.ZodType<T>, params: unknown, message: string): T {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw validationFailed(message, { issues: parsed.error.issues });
  }
  return parsed.data;
}
