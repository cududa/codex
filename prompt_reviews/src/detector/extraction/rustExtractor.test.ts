import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extractRustSource, extractRustSources } from "./rustExtractor.js";
import type { ExtractedEdge, ExtractedNode } from "./types.js";

const fixturePath = "codex-rs/core/src/prompt_review_fixture.rs";
const fixtureContent = readFileSync(
  new URL("../../test-support/fixtures/detector/rust/extractorFixture.rs", import.meta.url),
  "utf8",
);

describe("rust concern extractor", () => {
  it("extracts Rust item, function, impl, trait impl, enum, call, marker, include, and registration surfaces", () => {
    const output = extractRustSource({ path: fixturePath, content: fixtureContent });

    expect(symbols(output.nodes, "rust_function")).toEqual([
      "build_context_message",
      "new",
      "register_tools",
      "render_prompt",
    ]);
    expect(symbols(output.nodes, "rust_impl")).toEqual(["PromptHarness"]);
    expect(symbols(output.nodes, "rust_trait_impl")).toEqual(["HarnessRenderer for PromptHarness"]);
    expect(symbols(output.nodes, "rust_enum_variant")).toEqual([
      "MessageRole::Assistant",
      "MessageRole::Developer",
      "MessageRole::User",
    ]);
    expect(symbols(output.nodes, "rust_call_path")).toEqual([
      "REGISTERED_TOOLS.to_vec",
      "String::from",
      "build_context_message",
      "format!",
    ]);
    expect(markers(output.nodes, "rust_string_marker")).toEqual([
      "../../../../codex-rs/core/templates/goals/continue.md",
      "<goal_context>",
      "apply_patch",
      "assistant",
      "developer",
      "shell",
      "update_goal",
      "user",
      "{role}:{marker}",
    ]);
    expect(markers(output.nodes, "rust_include_target")).toEqual([
      "../../../../codex-rs/core/templates/goals/continue.md",
    ]);
    expect(symbols(output.nodes, "rust_registration_array")).toEqual(["MESSAGE_REGISTRY", "REGISTERED_TOOLS"]);
    expect(symbols(output.nodes, "rust_registration_item")).toEqual([
      "MessageRole::Assistant",
      "MessageRole::User",
      "apply_patch",
      "shell",
      "update_goal",
    ]);

    expect(edgeSymbols(output.edges, "implements")).toEqual(["HarnessRenderer"]);
    expect(edgeSymbols(output.edges, "calls")).toEqual([
      "REGISTERED_TOOLS.to_vec",
      "String::from",
      "build_context_message",
      "format!",
    ]);
    expect(edgeSymbols(output.edges, "matches_variant")).toEqual([
      "MessageRole::Assistant",
      "MessageRole::Developer",
      "MessageRole::User",
    ]);
    expect(edgeSymbols(output.edges, "constructs_variant")).toEqual(["MessageRole::Assistant", "MessageRole::User"]);
    expect(edgeMarkers(output.edges, "include")).toEqual(["../../../../codex-rs/core/templates/goals/continue.md"]);
    expect(edgeMarkers(output.edges, "role_marker")).toEqual(["assistant", "developer", "user"]);
    expect(edgeSymbols(output.edges, "registration")).toEqual([
      "MessageRole::Assistant",
      "MessageRole::User",
      "apply_patch",
      "shell",
      "update_goal",
    ]);
  });

  it("uses deterministic sorting and stable JSON-ready ranges", () => {
    const output = extractRustSources([{ path: fixturePath, content: fixtureContent }]);
    expect(output).toEqual(JSON.parse(JSON.stringify(output)));
    expect(output.nodes).toEqual([...output.nodes].sort(compareNodes));
    expect(output.edges).toEqual([...output.edges].sort(compareEdges));

    const renderPrompt = output.nodes.find((node) => node.nodeKind === "rust_function" && node.symbol === "render_prompt" && node.startLine === 18);
    expect(renderPrompt).toMatchObject({
      path: fixturePath,
      nodeKind: "rust_function",
      symbol: "render_prompt",
      startLine: 18,
      endLine: 25,
    });
    expect(renderPrompt?.startByte).toBeLessThan(renderPrompt?.endByte ?? 0);

    const goalMarker = output.nodes.find((node) => node.marker === "<goal_context>");
    expect(goalMarker).toMatchObject({
      path: fixturePath,
      nodeKind: "rust_string_marker",
      startLine: 19,
      endLine: 19,
    });
  });
});

function symbols(nodes: readonly ExtractedNode[], kind: ExtractedNode["nodeKind"]): string[] {
  return [...new Set(nodes
    .filter((node) => node.nodeKind === kind)
    .map((node) => node.symbol)
    .filter((symbol): symbol is string => symbol !== undefined))]
    .sort();
}

function markers(nodes: readonly ExtractedNode[], kind: ExtractedNode["nodeKind"]): string[] {
  return [...new Set(nodes
    .filter((node) => node.nodeKind === kind)
    .map((node) => node.marker)
    .filter((marker): marker is string => marker !== undefined))]
    .sort();
}

function edgeSymbols(edges: readonly ExtractedEdge[], kind: ExtractedEdge["edgeKind"]): string[] {
  return [...new Set(edges
    .filter((edge) => edge.edgeKind === kind)
    .map((edge) => edge.symbol)
    .filter((symbol): symbol is string => symbol !== undefined))]
    .sort();
}

function edgeMarkers(edges: readonly ExtractedEdge[], kind: ExtractedEdge["edgeKind"]): string[] {
  return [...new Set(edges
    .filter((edge) => edge.edgeKind === kind)
    .map((edge) => edge.marker)
    .filter((marker): marker is string => marker !== undefined))]
    .sort();
}

function compareNodes(left: ExtractedNode, right: ExtractedNode): number {
  return left.path.localeCompare(right.path) || left.nodeKind.localeCompare(right.nodeKind) || left.nodeKey.localeCompare(right.nodeKey);
}

function compareEdges(left: ExtractedEdge, right: ExtractedEdge): number {
  return left.path.localeCompare(right.path) || left.edgeKind.localeCompare(right.edgeKind) || left.edgeKey.localeCompare(right.edgeKey);
}
