import {
  type ActorType,
  type CommentStatus,
  type DecisionOutcome,
  type DecisionStatus,
  type PlanItemStatus,
  type PlanStatus,
  type ReviewStatus,
  type VersionStatus,
} from "../enums.js";

export type StatusActor = {
  type: ActorType;
};

export type StatusDecision = {
  status: DecisionStatus;
  outcome: DecisionOutcome;
  finalizedBy: StatusActor | null;
};

export type StatusComment = {
  status: CommentStatus;
};

export type StatusPlanItem = {
  status: PlanItemStatus;
};

export type StatusPlan = {
  status: PlanStatus;
  items: readonly StatusPlanItem[];
};

export type CommitFileStatusInput = {
  primaryTagSlugs?: readonly string[];
  secondaryTagSlugs?: readonly string[];
  decisions?: readonly StatusDecision[];
  comments?: readonly StatusComment[];
  plans?: readonly StatusPlan[];
};

export type CommitStatusInput = {
  files: readonly CommitFileStatusInput[];
};

export type VersionReadinessInput = {
  commits: readonly CommitStatusInput[];
};

export type VersionReadiness = {
  status: Extract<VersionStatus, "ready" | "reviewing">;
  commitStatuses: readonly ReviewStatus[];
  blockingCommitStatuses: readonly ReviewStatus[];
};

export type CloseVersionInput = {
  actor: StatusActor;
  version: VersionReadinessInput;
};

export const statusPrecedence = [
  "patch_required",
  "blocked",
  "needs_decision",
  "needs_classification",
  "reviewing",
  "accepted_with_watch",
  "accepted",
] as const satisfies readonly ReviewStatus[];

const terminalCommitStatuses = ["accepted", "accepted_with_watch", "rejected"] as const satisfies readonly ReviewStatus[];

export function deriveCommitFileStatus(file: CommitFileStatusInput): ReviewStatus {
  if (!hasAnyClassificationTag(file)) {
    return "needs_classification";
  }

  const acceptedDecisions = (file.decisions ?? []).filter(isAcceptedHumanFinalDecision);

  if (acceptedDecisions.length === 0) {
    return "needs_decision";
  }

  if (acceptedDecisions.some((decision) => decision.outcome === "patch_required")) {
    return "patch_required";
  }

  if (acceptedDecisions.some((decision) => decision.outcome === "blocked_on_context")) {
    return "blocked";
  }

  if (acceptedDecisions.some((decision) => decision.outcome === "reject_for_local_build")) {
    return "rejected";
  }

  if (!canMarkAccepted(file)) {
    return "blocked";
  }

  if (acceptedDecisions.some((decision) => decision.outcome === "accept_with_watch")) {
    return "accepted_with_watch";
  }

  if (acceptedDecisions.some((decision) => decision.outcome === "accept")) {
    return "accepted";
  }

  return "reviewing";
}

export function deriveCommitStatus(commit: CommitStatusInput): ReviewStatus {
  const fileStatuses = commit.files.map(deriveCommitFileStatus);

  if (fileStatuses.length === 0) {
    return "unreviewed";
  }

  for (const status of statusPrecedence) {
    if (fileStatuses.includes(status)) {
      return status;
    }
  }

  if (fileStatuses.includes("rejected")) {
    return "rejected";
  }

  return "unreviewed";
}

export function deriveVersionReadiness(version: VersionReadinessInput): VersionReadiness {
  const commitStatuses = version.commits.map(deriveCommitStatus);
  const blockingCommitStatuses = commitStatuses.filter(
    (status) => !terminalCommitStatuses.includes(status as (typeof terminalCommitStatuses)[number]),
  );

  return {
    status: commitStatuses.length > 0 && blockingCommitStatuses.length === 0 ? "ready" : "reviewing",
    commitStatuses,
    blockingCommitStatuses,
  };
}

export function canMarkAccepted(work: Pick<CommitFileStatusInput, "comments" | "plans">): boolean {
  return !hasUnresolvedComments(work.comments ?? []) && !hasIncompleteAcceptedPlanItems(work.plans ?? []);
}

export function canCloseVersion(input: CloseVersionInput): boolean {
  return input.actor.type === "human" && deriveVersionReadiness(input.version).status === "ready";
}

function hasAnyClassificationTag(file: Pick<CommitFileStatusInput, "primaryTagSlugs" | "secondaryTagSlugs">): boolean {
  return (file.primaryTagSlugs?.length ?? 0) > 0 || (file.secondaryTagSlugs?.length ?? 0) > 0;
}

function isAcceptedHumanFinalDecision(decision: StatusDecision): boolean {
  return decision.status === "accepted" && decision.finalizedBy?.type === "human";
}

function hasUnresolvedComments(comments: readonly StatusComment[]): boolean {
  return comments.some((comment) => comment.status === "open");
}

function hasIncompleteAcceptedPlanItems(plans: readonly StatusPlan[]): boolean {
  return plans.some(
    (plan) =>
      plan.status === "accepted" &&
      plan.items.some((item) => item.status === "todo" || item.status === "in_progress" || item.status === "blocked"),
  );
}
