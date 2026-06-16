import type { ReviewStatus, VersionStatus } from "../domain/enums.js";
import {
  deriveCommitFileStatus,
  deriveCommitStatus,
  deriveVersionReadiness,
  type CommitFileStatusInput,
  type StatusDecision,
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
  updateCommitReviewFields,
  updateVersionStatus,
  type CommitFileRow,
  type CommitRow,
  type VersionRow,
} from "../repositories/index.js";
import { invariantFailed, notFound } from "./errors.js";
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
};

export function createStatusService(context: ServiceContext): StatusService {
  return {
    recomputeFileStatus: (commitFileId) => recomputeFileStatus(context, commitFileId),
    recomputeCommitStatus: (commitId) => recomputeCommitStatus(context, commitId),
    recomputeVersionStatus: (versionId) => recomputeVersionStatus(context, versionId),
  };
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
    const status = deriveCommitStatus({ files });
    updateCommitReviewFields(context.db, commit.id, { reviewStatus: status, updatedAt: context.now() });
    return { files };
  });
  const readiness = deriveVersionReadiness({ commits: commitInputs });
  const status = hasUnresolvedVersionWork(context, version.id) ? "reviewing" : readiness.status;

  updateVersionStatus(context.db, version.id, { status, updatedAt: context.now() });
  return { id: version.id, status };
}

function recomputeCommitStatusOnly(context: ServiceContext, commit: CommitRow): ReviewStatus {
  const files = listCommitFilesByCommit(context.db, commit.id).map((file) => hydrateFileStatusInput(context, file));
  const status = deriveCommitStatus({ files });
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
  };
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
