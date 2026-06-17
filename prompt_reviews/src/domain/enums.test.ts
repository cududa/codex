import { describe, expect, it } from "vitest";
import {
  actorTypes,
  changeTypes,
  commentStatuses,
  decisionOutcomes,
  decisionScopeTypes,
  decisionStatuses,
  diffSides,
  planItemStatuses,
  planStatuses,
  reviewEntityScopeTypes,
  reviewStatuses,
  sourceAnchorKinds,
  versionStatuses,
} from "./enums.js";

describe("domain enum arrays", () => {
  it("exports the shared literal vocabulary", () => {
    expect({
      actorTypes,
      versionStatuses,
      reviewStatuses,
      changeTypes,
      diffSides,
      commentStatuses,
      decisionStatuses,
      decisionOutcomes,
      planStatuses,
      planItemStatuses,
      reviewEntityScopeTypes,
      decisionScopeTypes,
      sourceAnchorKinds,
    }).toEqual({
      actorTypes: ["human", "agent", "system"],
      versionStatuses: ["open", "reviewing", "ready", "closed", "archived"],
      reviewStatuses: [
        "unreviewed",
        "needs_classification",
        "reviewing",
        "needs_decision",
        "patch_required",
        "accepted",
        "accepted_with_watch",
        "rejected",
        "blocked",
      ],
      changeTypes: ["added", "modified", "deleted", "renamed", "copied", "mode_changed"],
      diffSides: ["old", "new"],
      commentStatuses: ["open", "resolved", "wont_fix", "superseded"],
      decisionStatuses: ["proposed", "accepted", "rejected", "superseded"],
      decisionOutcomes: [
        "accept",
        "accept_with_watch",
        "patch_required",
        "reject_for_local_build",
        "needs_tests",
        "needs_policy_decision",
        "blocked_on_context",
      ],
      planStatuses: ["draft", "proposed", "accepted", "in_progress", "complete", "abandoned", "superseded"],
      planItemStatuses: ["todo", "in_progress", "blocked", "complete", "abandoned"],
      reviewEntityScopeTypes: ["version", "commit", "commit_file", "diff_block"],
      decisionScopeTypes: ["version", "commit", "commit_file"],
      sourceAnchorKinds: ["scope", "block", "range"],
    });
  });
});
