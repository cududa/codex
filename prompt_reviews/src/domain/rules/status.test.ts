import { describe, expect, it } from "vitest";
import {
  canCloseVersion,
  canMarkAccepted,
  deriveCommitFileStatus,
  deriveCommitStatus,
  deriveVersionReadiness,
  statusPrecedence,
  type CommitFileStatusInput,
  type StatusDecision,
} from "./status.js";

const classified = {
  primaryTagSlugs: ["goal.initial-steering"],
} as const satisfies Pick<CommitFileStatusInput, "primaryTagSlugs">;

const humanAcceptDecision = {
  status: "accepted",
  outcome: "accept",
  finalizedBy: { type: "human" },
} as const satisfies StatusDecision;

function fileWithDecision(decision: StatusDecision): CommitFileStatusInput {
  return {
    ...classified,
    decisions: [decision],
  };
}

describe("status derivation rules", () => {
  it("derives commit file status from classification and accepted human-final decisions", () => {
    expect({
      noTags: deriveCommitFileStatus({ decisions: [humanAcceptDecision] }),
      noHumanFinalDecision: deriveCommitFileStatus({ ...classified }),
      accepted: deriveCommitFileStatus(fileWithDecision(humanAcceptDecision)),
      patchRequired: deriveCommitFileStatus(
        fileWithDecision({
          status: "accepted",
          outcome: "patch_required",
          finalizedBy: { type: "human" },
        }),
      ),
      acceptedWithWatch: deriveCommitFileStatus(
        fileWithDecision({
          status: "accepted",
          outcome: "accept_with_watch",
          finalizedBy: { type: "human" },
        }),
      ),
      rejected: deriveCommitFileStatus(
        fileWithDecision({
          status: "accepted",
          outcome: "reject_for_local_build",
          finalizedBy: { type: "human" },
        }),
      ),
      blockedOnContext: deriveCommitFileStatus(
        fileWithDecision({
          status: "accepted",
          outcome: "blocked_on_context",
          finalizedBy: { type: "human" },
        }),
      ),
    }).toEqual({
      noTags: "needs_classification",
      noHumanFinalDecision: "needs_decision",
      accepted: "accepted",
      patchRequired: "patch_required",
      acceptedWithWatch: "accepted_with_watch",
      rejected: "rejected",
      blockedOnContext: "blocked",
    });
  });

  it("blocks accepted status on unresolved comments and incomplete accepted plan items", () => {
    expect({
      openCommentCanMark: canMarkAccepted({ comments: [{ status: "open" }] }),
      openCommentStatus: deriveCommitFileStatus({
        ...fileWithDecision(humanAcceptDecision),
        comments: [{ status: "open" }],
      }),
      resolvedCommentCanMark: canMarkAccepted({ comments: [{ status: "resolved" }] }),
      incompleteAcceptedPlanCanMark: canMarkAccepted({
        plans: [{ status: "accepted", items: [{ status: "in_progress" }] }],
      }),
      incompleteAcceptedPlanStatus: deriveCommitFileStatus({
        ...fileWithDecision(humanAcceptDecision),
        plans: [{ status: "accepted", items: [{ status: "blocked" }] }],
      }),
      completeAcceptedPlanCanMark: canMarkAccepted({
        plans: [{ status: "accepted", items: [{ status: "complete" }] }],
      }),
    }).toEqual({
      openCommentCanMark: false,
      openCommentStatus: "blocked",
      resolvedCommentCanMark: true,
      incompleteAcceptedPlanCanMark: false,
      incompleteAcceptedPlanStatus: "blocked",
      completeAcceptedPlanCanMark: true,
    });
  });

  it("uses actor type for finalization instead of an isHuman passthrough", () => {
    const agentFinalizedDecision = {
      status: "accepted",
      outcome: "accept",
      finalizedBy: { type: "agent" },
      isHuman: true,
    } as const;
    const systemFinalizedDecision = {
      status: "accepted",
      outcome: "accept",
      finalizedBy: { type: "system" },
      isHuman: true,
    } as const;

    expect({
      agent: deriveCommitFileStatus(fileWithDecision(agentFinalizedDecision)),
      system: deriveCommitFileStatus(fileWithDecision(systemFinalizedDecision)),
    }).toEqual({
      agent: "needs_decision",
      system: "needs_decision",
    });
  });

  it("does not pass through a manual status label", () => {
    const manuallyLabeledFile = {
      status: "accepted",
      primaryTagSlugs: [],
    };

    expect(deriveCommitFileStatus(manuallyLabeledFile)).toBe("needs_classification");
  });

  it("derives commit status from the strictest child status", () => {
    const accepted = fileWithDecision(humanAcceptDecision);
    const acceptedWithWatch = fileWithDecision({
      status: "accepted",
      outcome: "accept_with_watch",
      finalizedBy: { type: "human" },
    });
    const reviewing = fileWithDecision({
      status: "accepted",
      outcome: "needs_tests",
      finalizedBy: { type: "human" },
    });
    const needsClassification = { decisions: [humanAcceptDecision] };
    const needsDecision = { ...classified };
    const blocked = fileWithDecision({
      status: "accepted",
      outcome: "blocked_on_context",
      finalizedBy: { type: "human" },
    });
    const patchRequired = fileWithDecision({
      status: "accepted",
      outcome: "patch_required",
      finalizedBy: { type: "human" },
    });

    expect({
      precedence: statusPrecedence,
      empty: deriveCommitStatus({ files: [] }),
      accepted: deriveCommitStatus({ files: [accepted] }),
      acceptedWithWatch: deriveCommitStatus({ files: [accepted, acceptedWithWatch] }),
      reviewing: deriveCommitStatus({ files: [acceptedWithWatch, reviewing] }),
      needsClassification: deriveCommitStatus({ files: [reviewing, needsClassification] }),
      needsDecision: deriveCommitStatus({ files: [needsClassification, needsDecision] }),
      blocked: deriveCommitStatus({ files: [needsDecision, blocked] }),
      patchRequired: deriveCommitStatus({ files: [blocked, patchRequired] }),
    }).toEqual({
      precedence: [
        "patch_required",
        "blocked",
        "needs_decision",
        "needs_classification",
        "reviewing",
        "accepted_with_watch",
        "accepted",
      ],
      empty: "unreviewed",
      accepted: "accepted",
      acceptedWithWatch: "accepted_with_watch",
      reviewing: "reviewing",
      needsClassification: "needs_classification",
      needsDecision: "needs_decision",
      blocked: "blocked",
      patchRequired: "patch_required",
    });
  });

  it("derives version readiness but never derives closed status", () => {
    const readyVersion = {
      commits: [{ files: [fileWithDecision(humanAcceptDecision)] }],
    };
    const blockedVersion = {
      commits: [{ files: [{ ...classified }] }],
    };

    expect({
      ready: deriveVersionReadiness(readyVersion),
      blocked: deriveVersionReadiness(blockedVersion),
      humanCanCloseReady: canCloseVersion({ actor: { type: "human" }, version: readyVersion }),
      agentCanCloseReady: canCloseVersion({ actor: { type: "agent" }, version: readyVersion }),
      systemCanCloseReady: canCloseVersion({ actor: { type: "system" }, version: readyVersion }),
      humanCanCloseBlocked: canCloseVersion({ actor: { type: "human" }, version: blockedVersion }),
    }).toEqual({
      ready: {
        status: "ready",
        commitStatuses: ["accepted"],
        blockingCommitStatuses: [],
      },
      blocked: {
        status: "reviewing",
        commitStatuses: ["needs_decision"],
        blockingCommitStatuses: ["needs_decision"],
      },
      humanCanCloseReady: true,
      agentCanCloseReady: false,
      systemCanCloseReady: false,
      humanCanCloseBlocked: false,
    });
  });
});
