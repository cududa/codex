import type {
  ActorRef,
  AddCommentParams,
  ClassifyCommitParams,
  ClassifyFileParams,
  CommentDetail,
  CommentLocation,
  CommentSummary,
  CommitDetail,
  CommitFileDetail,
  CommitFileQueueItem,
  CommitQueueItem,
  ConcernTagView,
  DecisionDetail,
  DecisionScope,
  FinalizeDecisionParams,
  PlanDetail,
  PlanItemDetail,
  PaginatedResult,
  RemainingWork,
  ReviewEntityScope,
  SourceAnchor,
  VersionDetail,
  VersionSummary,
} from "@domain/schemas";

export type {
  ActorRef,
  AddCommentParams,
  ClassifyCommitParams,
  ClassifyFileParams,
  CommentDetail,
  CommentLocation,
  CommentSummary,
  CommitDetail,
  CommitFileDetail,
  CommitFileQueueItem,
  CommitQueueItem,
  ConcernTagView,
  DecisionDetail,
  DecisionScope,
  FinalizeDecisionParams,
  PlanDetail,
  PlanItemDetail,
  PaginatedResult,
  RemainingWork,
  ReviewEntityScope,
  SourceAnchor,
  VersionDetail,
  VersionSummary,
};

export type MissingDecisionTarget = "commit" | "file";

export type MissingDecisionsResponse =
  | {
      target: "commit";
      data: CommitQueueItem[];
    }
  | {
      target: "file";
      data: CommitFileQueueItem[];
    };

export type StructuredCommentTarget =
  | { type: "version"; versionId: string }
  | { type: "commit"; commitId: string }
  | { type: "commit_file"; commitFileId: string }
  | { type: "diff_block"; diffBlockId: string };

export type SourceRangeDraft = {
  side: "old" | "new";
  startLine: number;
  endLine: number;
  selectedText: string;
};
