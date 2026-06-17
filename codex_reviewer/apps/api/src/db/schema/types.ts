export type ActorKind = "human" | "agent" | "system";
export type ReviewScopeType = "version" | "commit" | "file" | "diffBlock";
export type ChangeKind = "added" | "modified" | "deleted" | "renamed" | "copied" | "modeChanged";
export type ReviewVersionState = "open" | "readyForApproval" | "finalized";
export type ThreadedCommentState = "open" | "resolved";
export type ReviewEventKind =
  | "reviewMarkChanged"
  | "concernAreasChanged"
  | "agentReviewRecorded"
  | "humanApprovalRecorded"
  | "humanApprovalRevoked"
  | "localChangeLinked"
  | "commentResolved"
  | "planUpdated";
