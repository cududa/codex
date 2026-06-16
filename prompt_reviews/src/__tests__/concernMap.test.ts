import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { concernAreaSlugs, concernMap, concernMapBySlug } from "../domain/concernMap.js";
import { ConcernMapSchema, ConcernSeedPathSchema } from "../domain/schemas/index.js";

const repoRoot = path.resolve(import.meta.dirname, "../../..");

describe("concern detector map", () => {
  it("is a complete, schema-valid map for the eight required concern areas", () => {
    expect(ConcernMapSchema.parse(concernMap)).toEqual(concernMap);
    expect(concernMap.map((entry) => entry.slug)).toEqual([...concernAreaSlugs]);
    expect(new Set(concernMap.map((entry) => entry.slug)).size).toBe(concernMap.length);
    expect(concernMapBySlug.size).toBe(concernMap.length);
  });

  it("has seed paths and seed symbols or markers for every concern", () => {
    for (const entry of concernMap) {
      expect(entry.seedPaths.length, `${entry.slug} seed paths`).toBeGreaterThan(0);
      expect(
        entry.seedSymbols.length + entry.seedStringMarkers.length + entry.seedTemplateMarkers.length,
        `${entry.slug} seed symbols or markers`,
      ).toBeGreaterThan(0);
      expect(entry.expansionEdgeTypes.length, `${entry.slug} expansion edges`).toBeGreaterThan(0);
      expect(entry.falsePositiveExclusions.length, `${entry.slug} false positives`).toBeGreaterThan(0);
      expect(entry.fixtureExpectations.length, `${entry.slug} fixture expectations`).toBeGreaterThan(0);
    }
  });

  it("keeps literal seed paths honest, with explicit handling for future or known-missing paths", () => {
    const absentButDeclared: string[] = [];

    for (const entry of concernMap) {
      for (const seedPath of entry.seedPaths) {
        const exists = existsSync(path.join(repoRoot, seedPath.path));
        if (seedPath.status === "present") {
          expect(exists, `${entry.slug} seed path must exist: ${seedPath.path}`).toBe(true);
          continue;
        }
        expect(seedPath.note, `${entry.slug} non-present seed path must include a note`).toBeDefined();
        absentButDeclared.push(seedPath.path);
      }
    }

    expect(absentButDeclared).toEqual([]);
    expect(
      ConcernSeedPathSchema.safeParse({
        path: "codex-rs/app-server/src/request_processors/thread_teleport.rs",
        status: "known_missing",
        note: "Used by fixtures to prove known-missing seed handling.",
      }).success,
    ).toBe(true);
    expect(
      ConcernSeedPathSchema.safeParse({
        path: "codex-rs/app-server/src/request_processors/thread_teleport.rs",
        status: "known_missing",
      }).success,
    ).toBe(false);
  });

  it("contains the concern-specific anchors needed by later AST and text extraction batches", () => {
    expect(concernMapBySlug.get("harness-prompts")?.seedSymbols).toEqual(
      expect.arrayContaining(["ModelInfo::get_model_instructions", "build_responses_request", "include_str!"]),
    );
    expect(concernMapBySlug.get("message-roles")?.seedStringMarkers).toEqual(
      expect.arrayContaining(["system", "developer", "user", "assistant"]),
    );
    expect(concernMapBySlug.get("hidden-context")?.seedStringMarkers).toEqual(
      expect.arrayContaining(["<permissions instructions>", "<skills_instructions>", "# AGENTS.md instructions for "]),
    );
    expect(concernMapBySlug.get("goal-continuation")?.seedSymbols).toEqual(
      expect.arrayContaining(["maybe_start_goal_continuation_turn", "continue_active_goal_if_idle"]),
    );
    expect(concernMapBySlug.get("goal-behavior")?.seedStringMarkers).toEqual(
      expect.arrayContaining(["/goal", "create_goal", "thread/goal/set"]),
    );
    expect(concernMapBySlug.get("context-compaction")?.seedSymbols).toEqual(
      expect.arrayContaining(["ContextManager::replace", "reconstruct_history_from_rollout"]),
    );
    expect(concernMapBySlug.get("tool-affordances")?.seedSymbols).toEqual(
      expect.arrayContaining(["ToolRegistryBuilder", "tool_definition_to_responses_api_tool"]),
    );
    expect(concernMapBySlug.get("permission-defaults")?.seedStringMarkers).toEqual(
      expect.arrayContaining(["approval_policy", "sandbox_mode", "danger-full-access"]),
    );
  });
});
