import { describe, expect, it } from "vitest";
import {
  concernTagSeeds,
  concernTagSeedsBySlug,
  concernTaggingGuidance,
  requiredNestedConcernTagSlugs,
  requiredTopLevelConcernTagSlugs,
} from "./taxonomy.js";

describe("concern taxonomy", () => {
  it("contains the required top-level and nested slugs", () => {
    expect(requiredTopLevelConcernTagSlugs).toEqual([
      "goal-steering-contract",
      "message-role-authority",
      "prompt-source-authority",
      "hidden-context-transcript",
      "continuation-lifecycle",
      "goal-state-accounting",
      "tool-execution-surface",
      "permissions-workspace-environment",
      "storage-boundary-movement",
      "repo-context-durability",
    ]);
    expect(requiredNestedConcernTagSlugs).toEqual([
      "goal.initial-steering",
      "goal.continuation",
      "goal.objective-update",
      "goal.completion-audit",
      "role.runtime-owned-frame",
      "role.configurable-steering",
      "role.policy-boundary-drift",
      "prompt.artifact-proving-risk",
      "prompt.proximity-authority",
      "prompt.get-goal-regrounding",
      "prompt.fidelity",
      "hidden.goal-context-marker",
      "hidden.visible-leak",
      "lifecycle.interrupt-pause",
      "lifecycle.thread-resume",
      "lifecycle.suppression",
      "state.blocked",
      "state.usage-limited",
      "accounting.progress-lifecycle",
      "tools.discovery-amplifier",
      "tools.mcp-contract",
      "permissions.workspace-root",
      "permissions.runtime-refresh",
      "boundary.core-to-extension",
      "boundary.goal-store",
      "boundary.app-server-api",
      "context.agents-md",
      "context.compaction-history",
    ]);
  });

  it("keeps parent references resolvable and sort orders stable", () => {
    const slugs = concernTagSeeds.map((seed) => seed.slug);
    const sortOrders = concernTagSeeds.map((seed) => seed.sortOrder);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(sortOrders).toEqual([...sortOrders].sort((left, right) => left - right));
    expect(concernTagSeeds.filter((seed) => seed.parentSlug === null).map((seed) => seed.slug)).toEqual(
      requiredTopLevelConcernTagSlugs,
    );

    for (const seed of concernTagSeeds) {
      if (seed.parentSlug !== null) {
        expect(concernTagSeedsBySlug.has(seed.parentSlug)).toBe(true);
      }
      expect(seed.description.length).toBeGreaterThan(0);
      expect(seed.examples.length).toBeGreaterThan(0);
      expect(seed.pitfalls.length).toBeGreaterThan(0);
    }
  });

  it("exports tagging guidance constants", () => {
    expect(concernTaggingGuidance).toEqual({
      primaryTagRule: "Exactly one primary tag per commit/file/block.",
      secondaryTagRule: "Secondary tags are amplifiers.",
      toolTagRule: "Tool tags are usually secondary unless the tool contract itself changed.",
      storageAccountingRule:
        "Storage/accounting tags are not prompt behavior unless model-input construction or authority moved there.",
    });
  });
});
