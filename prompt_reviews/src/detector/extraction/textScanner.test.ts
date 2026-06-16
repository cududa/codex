import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isTextScannablePath, scanTextFile, scanTextFiles } from "./textScanner.js";
import type { SourceFileInput, TextScanHitKind } from "./types.js";

const fixtureRoot = path.resolve(import.meta.dirname, "../../test-support/fixtures/detector/text");

describe("text concern scanner", () => {
  it("detects prompt markers and hidden-context tags from markdown templates", async () => {
    const hits = await scanFixture("prompt-template.md");

    expect(pick(hits, "prompt_marker", "{{ personality }}")).toMatchObject({
      concernSlugs: ["harness-prompts"],
      startLine: 3,
      endLine: 3,
    });
    expect(pick(hits, "prompt_marker", "Continue working toward the active thread goal.")).toMatchObject({
      concernSlugs: ["goal-continuation"],
      startLine: 5,
      endLine: 5,
    });
    expect(pick(hits, "hidden_context_tag", "<permissions instructions>")).toMatchObject({
      concernSlugs: ["hidden-context"],
      startLine: 7,
      endLine: 7,
    });
    expect(pick(hits, "hidden_context_tag", "<skills_instructions>")).toMatchObject({
      concernSlugs: ["hidden-context"],
      startLine: 9,
      endLine: 9,
    });
  });

  it("detects tool names, RPC method names, and config keys in TypeScript and JSON", async () => {
    const hits = scanTextFiles([await fixture("wire-surface.ts"), await fixture("config-surface.json")]);

    expect(pick(hits, "tool_name", "exec_command")).toMatchObject({
      path: "wire-surface.ts",
      concernSlugs: ["tool-affordances"],
    });
    expect(pick(hits, "tool_name", "create_goal")).toMatchObject({
      concernSlugs: ["goal-behavior"],
    });
    expect(pick(hits, "rpc_method", "thread/goal/set")).toMatchObject({
      concernSlugs: ["goal-behavior"],
    });
    expect(pick(hits, "config_key", "approval_policy")).toMatchObject({
      path: "config-surface.json",
      concernSlugs: ["permission-defaults"],
    });
    expect(pick(hits, "config_key", "model_instructions_file")).toMatchObject({
      path: "config-surface.json",
      concernSlugs: ["harness-prompts"],
    });
  });

  it("detects SQL migration table names and maps them to concern areas", async () => {
    const hits = await scanFixture("migration.sql");

    expect(pick(hits, "migration_table", "thread_goals")).toMatchObject({
      concernSlugs: ["goal-behavior"],
      startLine: 1,
    });
    expect(pick(hits, "migration_table", "turn_context_items")).toMatchObject({
      concernSlugs: ["context-compaction"],
      startLine: 6,
    });
  });

  it("returns deterministic JSON-ready hits with stable sorting and offsets", async () => {
    const sources = [
      await fixture("wire-surface.ts"),
      await fixture("prompt-template.md"),
      await fixture("config-surface.json"),
      await fixture("migration.sql"),
    ];
    const first = scanTextFiles([...sources].reverse());
    const second = scanTextFiles([...sources].reverse());

    expect(first).toEqual(second);
    expect(first).toEqual([...first].sort((left, right) => left.hitKey.localeCompare(right.hitKey)).sort((left, right) => {
      return left.path.localeCompare(right.path) || left.startByte - right.startByte || left.endByte - right.endByte;
    }));
    expect(first[0]).toEqual({
      path: expect.any(String),
      hitKind: expect.any(String),
      hitKey: expect.any(String),
      marker: expect.any(String),
      concernSlugs: expect.any(Array),
      startByte: expect.any(Number),
      endByte: expect.any(Number),
      startLine: expect.any(Number),
      endLine: expect.any(Number),
    });
  });

  it("recognizes the intended text file extensions", () => {
    expect(isTextScannablePath("codex-rs/core/templates/goals/continuation.md")).toBe(true);
    expect(isTextScannablePath("codex-rs/state/migrations/0029_thread_goals.sql")).toBe(true);
    expect(isTextScannablePath("codex-rs/app-server-protocol/src/protocol/v2/thread.ts")).toBe(true);
    expect(isTextScannablePath("codex-rs/core/src/goals.rs")).toBe(false);
  });
});

async function scanFixture(fileName: string) {
  return scanTextFile(await fixture(fileName));
}

async function fixture(fileName: string): Promise<SourceFileInput> {
  return {
    path: fileName,
    content: await readFile(path.join(fixtureRoot, fileName), "utf8"),
  };
}

function pick(hits: readonly ReturnType<typeof scanTextFile>[number][], hitKind: TextScanHitKind, marker: string) {
  const hit = hits.find((candidate) => candidate.hitKind === hitKind && candidate.marker === marker);
  expect(hit, `${hitKind}:${marker}`).toBeDefined();
  return hit;
}
