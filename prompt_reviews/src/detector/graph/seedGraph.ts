import { concernMap, concernMapVersion } from "../../domain/concernMap.js";
import type { ConcernGraphEdgeKind, ConcernGraphNodeKind } from "../../domain/enums.js";
import type {
  ConcernAreaSlug,
  ConcernMapEntry,
} from "../../domain/schemas/concernDetector/index.js";
import type { ExtractedEdge, ExtractedNode, ExtractionOutput, TextScanHit } from "../extraction/types.js";
import { concernEdgeKey, concernNodeKey, extractionGraphNodeKey, scanHitGraphNodeKey } from "./keys.js";
import { mappedExpansionEdges } from "./edgeMapping.js";
import { sortGraphEdges, sortGraphNodes } from "./sorting.js";
import type {
  BuildConcernGraphInput,
  ConcernGraphBuildEdge,
  ConcernGraphBuildNode,
  ConcernGraphBuildResult,
  GraphSourceContext,
} from "./types.js";

type GraphState = {
  nodes: Map<string, ConcernGraphBuildNode>;
  edges: Map<string, ConcernGraphBuildEdge>;
  extractionNodesByKey: Map<string, ExtractedNode>;
  graphNodeByExtractionKeyByConcern: Map<ConcernAreaSlug, Map<string, string>>;
  seedNodeKeyByConcern: Map<ConcernAreaSlug, Map<string, string>>;
  options: Required<GraphSourceContext> & { maxExpansionDepth: number };
};

type MatchReason = {
  matchedBy: "path" | "symbol" | "marker" | "template_marker" | "scan_hit";
  seedNodeKey?: string;
};

const defaultSourceRef = "concern-map";

export function buildConcernGraph(input: BuildConcernGraphInput = {}): ConcernGraphBuildResult {
  const state: GraphState = {
    nodes: new Map(),
    edges: new Map(),
    extractionNodesByKey: new Map(input.extraction?.nodes.map((node) => [node.nodeKey, node]) ?? []),
    graphNodeByExtractionKeyByConcern: new Map(),
    seedNodeKeyByConcern: new Map(),
    options: {
      detectorVersion: input.detectorVersion ?? concernMapVersion,
      sourceRef: input.sourceRef ?? defaultSourceRef,
      sourceRunId: input.sourceRunId ?? "",
      maxExpansionDepth: input.maxExpansionDepth ?? 1,
    },
  };

  for (const entry of concernMap) {
    addConcernMapSeeds(state, entry);
  }
  addDirectExtractionMatches(state, input.extraction);
  addTextScanHits(state, input.extraction?.scanHits ?? []);
  expandGraph(state, input.extraction);

  return {
    nodes: sortGraphNodes([...state.nodes.values()]),
    edges: sortGraphEdges([...state.edges.values()]),
  };
}

function addConcernMapSeeds(state: GraphState, entry: ConcernMapEntry): void {
  const seedKeys = seedMapFor(state, entry.slug);

  for (const seedPath of entry.seedPaths) {
    const node = addNode(state, {
      concernSlug: entry.slug,
      nodeKey: concernNodeKey(entry.slug, "file", seedPath.path),
      nodeKind: "file",
      path: seedPath.path,
      displayName: seedPath.path,
      sourceKind: "concern_map",
      isSeed: true,
      isKnownMissing: seedPath.status !== "present",
      metadata: metadata(state, {
        discovery: "concern_map_seed",
        seedType: "path",
        pathStatus: seedPath.status,
        note: seedPath.note,
      }),
    });
    seedKeys.set(`path:${seedPath.path}`, node.nodeKey);
  }

  for (const pattern of entry.seedGlobPatterns) {
    const node = addNode(state, {
      concernSlug: entry.slug,
      nodeKey: concernNodeKey(entry.slug, "glob", pattern),
      nodeKind: "glob",
      path: pattern,
      displayName: pattern,
      sourceKind: "concern_map",
      isSeed: true,
      isKnownMissing: false,
      metadata: metadata(state, { discovery: "concern_map_seed", seedType: "glob" }),
    });
    seedKeys.set(`glob:${pattern}`, node.nodeKey);
  }

  for (const symbol of entry.seedSymbols) {
    const nodeKind = seedSymbolKind(symbol, entry.slug);
    const node = addNode(state, {
      concernSlug: entry.slug,
      nodeKey: concernNodeKey(entry.slug, nodeKind, symbol),
      nodeKind,
      symbol,
      displayName: symbol,
      sourceKind: "concern_map",
      isSeed: true,
      isKnownMissing: false,
      metadata: metadata(state, { discovery: "concern_map_seed", seedType: "symbol" }),
    });
    seedKeys.set(`symbol:${symbol}`, node.nodeKey);
  }

  addMarkerSeeds(state, entry, "string_marker", entry.seedStringMarkers, "marker");
  addMarkerSeeds(state, entry, "template_marker", entry.seedTemplateMarkers, "template_marker");
}

function addMarkerSeeds(
  state: GraphState,
  entry: ConcernMapEntry,
  nodeKind: "string_marker" | "template_marker",
  markers: readonly string[],
  seedType: "marker" | "template_marker",
): void {
  const seedKeys = seedMapFor(state, entry.slug);
  for (const marker of markers) {
    const node = addNode(state, {
      concernSlug: entry.slug,
      nodeKey: concernNodeKey(entry.slug, nodeKind, marker),
      nodeKind,
      marker,
      displayName: marker,
      sourceKind: "concern_map",
      isSeed: true,
      isKnownMissing: false,
      metadata: metadata(state, { discovery: "concern_map_seed", seedType }),
    });
    seedKeys.set(`${seedType}:${marker}`, node.nodeKey);
  }
}

function addDirectExtractionMatches(state: GraphState, extraction: ExtractionOutput | undefined): void {
  if (extraction === undefined) {
    return;
  }

  for (const extracted of extraction.nodes) {
    for (const entry of concernMap) {
      const reason = directExtractionMatch(state, entry, extracted);
      if (reason === undefined) {
        continue;
      }
      const node = addExtractionNode(state, entry.slug, extracted, {
        discovery: "direct_extraction_match",
        ...reason,
      });
      graphNodesForConcern(state, entry.slug).set(extracted.nodeKey, node.nodeKey);
    }
  }
}

function addTextScanHits(state: GraphState, hits: readonly TextScanHit[]): void {
  for (const hit of hits) {
    for (const concernSlug of hit.concernSlugs) {
      const entry = concernMap.find((candidate) => candidate.slug === concernSlug);
      if (entry === undefined) {
        continue;
      }
      const nodeKind = hit.hitKind === "prompt_marker" ? "template_marker" : scanHitNodeKind(hit);
      const nodeKey = scanHitGraphNodeKey(concernSlug, hit.hitKey);
      const node = addNode(state, {
        concernSlug,
        nodeKey,
        nodeKind,
        path: hit.path,
        marker: hit.marker,
        displayName: hit.marker,
        sourceKind: "text_scanner",
        sourceRef: state.options.sourceRef,
        isSeed: true,
        isKnownMissing: false,
        metadata: metadata(state, {
          discovery: "direct_text_scan_match",
          matchedBy: "scan_hit",
          hitKey: hit.hitKey,
          hitKind: hit.hitKind,
          range: sourceRangeMetadata(hit),
          seedNodeKey: seedMapFor(state, concernSlug).get(`marker:${hit.marker}`) ?? seedMapFor(state, concernSlug).get(`template_marker:${hit.marker}`),
        }),
      });
      graphNodesForConcern(state, concernSlug).set(hit.hitKey, node.nodeKey);
    }
  }
}

function expandGraph(state: GraphState, extraction: ExtractionOutput | undefined): void {
  if (extraction === undefined || state.options.maxExpansionDepth < 1) {
    return;
  }

  const edges = sortExtractedEdges(extraction.edges);
  for (const entry of concernMap) {
    const allowed = new Set<ConcernGraphEdgeKind>(entry.expansionEdgeTypes);
    let frontier = new Set(graphNodesForConcern(state, entry.slug).keys());
    const visited = graphNodesForConcern(state, entry.slug);

    for (let depth = 1; depth <= state.options.maxExpansionDepth && frontier.size > 0; depth += 1) {
      const nextFrontier = new Set<string>();
      for (const edge of edges) {
        for (const mapped of mappedExpansionEdges(edge.edgeKind)) {
          if (!allowed.has(mapped.edgeKind)) {
            continue;
          }
          const parentExtractionKey = mapped.direction === "forward" ? edge.fromNodeKey : edge.toNodeKey;
          const childExtractionKey = mapped.direction === "forward" ? edge.toNodeKey : edge.fromNodeKey;
          const parentGraphNodeKey = visited.get(parentExtractionKey);
          if (parentGraphNodeKey === undefined || !frontier.has(parentExtractionKey)) {
            continue;
          }
          const child = state.extractionNodesByKey.get(childExtractionKey);
          if (child === undefined) {
            continue;
          }
          const childGraphNode = addExtractionNode(state, entry.slug, child, {
            discovery: "bounded_expansion",
            matchedBy: "symbol",
            parentNodeKey: parentGraphNodeKey,
            seedNodeKey: seedNodeKeyForParent(state, entry.slug, parentGraphNodeKey),
            expansionDepth: depth,
            edgeKind: mapped.edgeKind,
            edgeReason: mapped.reason,
            extractionEdgeKey: edge.edgeKey,
          });
          addExpansionEdge(state, entry.slug, mapped.edgeKind, parentGraphNodeKey, childGraphNode.nodeKey, edge, {
            parentNodeKey: parentGraphNodeKey,
            seedNodeKey: seedNodeKeyForParent(state, entry.slug, parentGraphNodeKey),
            expansionDepth: depth,
            edgeReason: mapped.reason,
          });
          if (!visited.has(childExtractionKey)) {
            nextFrontier.add(childExtractionKey);
          }
          visited.set(childExtractionKey, childGraphNode.nodeKey);
        }
      }
      frontier = nextFrontier;
    }
  }
}

function directExtractionMatch(
  state: GraphState,
  entry: ConcernMapEntry,
  extracted: ExtractedNode,
): MatchReason | undefined {
  if (extracted.nodeKind === "file" && entry.seedPaths.some((seed) => seed.path === extracted.path)) {
    return { matchedBy: "path", seedNodeKey: seedMapFor(state, entry.slug).get(`path:${extracted.path}`) };
  }
  if (extracted.symbol !== undefined && entry.seedSymbols.includes(extracted.symbol)) {
    return { matchedBy: "symbol", seedNodeKey: seedMapFor(state, entry.slug).get(`symbol:${extracted.symbol}`) };
  }
  if (extracted.marker !== undefined && entry.seedStringMarkers.includes(extracted.marker)) {
    return { matchedBy: "marker", seedNodeKey: seedMapFor(state, entry.slug).get(`marker:${extracted.marker}`) };
  }
  if (extracted.marker !== undefined && entry.seedTemplateMarkers.includes(extracted.marker)) {
    return {
      matchedBy: "template_marker",
      seedNodeKey: seedMapFor(state, entry.slug).get(`template_marker:${extracted.marker}`),
    };
  }
  return undefined;
}

function addExpansionEdge(
  state: GraphState,
  concernSlug: ConcernAreaSlug,
  edgeKind: ConcernGraphEdgeKind,
  fromNodeKey: string,
  toNodeKey: string,
  extracted: ExtractedEdge,
  details: Record<string, unknown>,
): void {
  addEdge(state, {
    concernSlug,
    edgeKey: concernEdgeKey(concernSlug, edgeKind, fromNodeKey, toNodeKey),
    edgeKind,
    fromNodeKey,
    toNodeKey,
    sourceKind: "graph_builder",
    sourceRef: state.options.sourceRef,
    metadata: metadata(state, {
      discovery: "bounded_expansion_edge",
      extractionEdgeKey: extracted.edgeKey,
      extractionEdgeKind: extracted.edgeKind,
      range: sourceRangeMetadata(extracted),
      ...details,
    }),
  });
}

function addExtractionNode(
  state: GraphState,
  concernSlug: ConcernAreaSlug,
  extracted: ExtractedNode,
  details: Record<string, unknown>,
): ConcernGraphBuildNode {
  return addNode(state, {
    concernSlug,
    nodeKey: extractionGraphNodeKey(concernSlug, extracted.nodeKey),
    nodeKind: extractionNodeKind(extracted),
    path: extracted.path,
    symbol: extracted.symbol,
    marker: extracted.marker,
    displayName: extracted.symbol ?? extracted.marker ?? extracted.path,
    sourceKind: extracted.nodeKind.startsWith("rust_") ? "ast_extractor" : "text_scanner",
    sourceRef: state.options.sourceRef,
    isSeed: details.discovery === "direct_extraction_match",
    isKnownMissing: false,
    metadata: metadata(state, {
      extractionNodeKey: extracted.nodeKey,
      extractionNodeKind: extracted.nodeKind,
      range: sourceRangeMetadata(extracted),
      ...details,
    }),
  });
}

function addNode(state: GraphState, node: ConcernGraphBuildNode): ConcernGraphBuildNode {
  const existing = state.nodes.get(node.nodeKey);
  if (existing !== undefined) {
    state.nodes.set(node.nodeKey, mergeNode(existing, node));
    return state.nodes.get(node.nodeKey) ?? node;
  }
  state.nodes.set(node.nodeKey, node);
  return node;
}

function addEdge(state: GraphState, edge: ConcernGraphBuildEdge): void {
  const existing = state.edges.get(edge.edgeKey);
  if (existing === undefined) {
    state.edges.set(edge.edgeKey, edge);
  }
}

function mergeNode(left: ConcernGraphBuildNode, right: ConcernGraphBuildNode): ConcernGraphBuildNode {
  return {
    ...left,
    isSeed: left.isSeed || right.isSeed,
    isKnownMissing: left.isKnownMissing && right.isKnownMissing,
    metadata: { ...left.metadata, ...right.metadata },
  };
}

function metadata(state: GraphState, values: Record<string, unknown>): Record<string, unknown> {
  return {
    detectorVersion: state.options.detectorVersion,
    sourceRef: state.options.sourceRef,
    sourceRunId: state.options.sourceRunId || undefined,
    ...withoutUndefined(values),
  };
}

function sourceRangeMetadata(range: {
  startByte: number;
  endByte: number;
  startLine: number;
  endLine: number;
}): Record<string, number> {
  return {
    startByte: range.startByte,
    endByte: range.endByte,
    startLine: range.startLine,
    endLine: range.endLine,
  };
}

function withoutUndefined(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

function seedMapFor(state: GraphState, concernSlug: ConcernAreaSlug): Map<string, string> {
  const existing = state.seedNodeKeyByConcern.get(concernSlug);
  if (existing !== undefined) {
    return existing;
  }
  const created = new Map<string, string>();
  state.seedNodeKeyByConcern.set(concernSlug, created);
  return created;
}

function graphNodesForConcern(state: GraphState, concernSlug: ConcernAreaSlug): Map<string, string> {
  const existing = state.graphNodeByExtractionKeyByConcern.get(concernSlug);
  if (existing !== undefined) {
    return existing;
  }
  const created = new Map<string, string>();
  state.graphNodeByExtractionKeyByConcern.set(concernSlug, created);
  return created;
}

function seedNodeKeyForParent(state: GraphState, concernSlug: ConcernAreaSlug, parentNodeKey: string): string {
  const parent = state.nodes.get(parentNodeKey);
  if (parent?.isSeed === true) {
    return parent.nodeKey;
  }
  const seedNodeKey = parent?.metadata.seedNodeKey;
  return typeof seedNodeKey === "string" ? seedNodeKey : parentNodeKey;
}

function seedSymbolKind(symbol: string, concernSlug: ConcernAreaSlug): ConcernGraphNodeKind {
  if (concernSlug === "tool-affordances" && /^[a-z][a-z0-9_]*$/.test(symbol)) {
    return "tool";
  }
  if (concernSlug === "permission-defaults" && /^[a-z][a-z0-9_]*$/.test(symbol)) {
    return "config_key";
  }
  if (symbol.includes("/")) {
    return "protocol_shape";
  }
  return "rust_symbol";
}

function extractionNodeKind(extracted: ExtractedNode): ConcernGraphNodeKind {
  switch (extracted.nodeKind) {
    case "file":
      return "file";
    case "rust_string_marker":
      return "string_marker";
    case "rust_include_target":
      return "file";
    case "text_marker":
    case "hidden_context_tag":
      return "string_marker";
    case "tool_name":
      return "tool";
    case "rpc_method":
      return "protocol_shape";
    case "config_key":
      return "config_key";
    case "migration_table":
      return "protocol_shape";
    case "rust_item":
    case "rust_impl":
    case "rust_trait_impl":
    case "rust_function":
    case "rust_enum_variant":
    case "rust_call_path":
    case "rust_variant_reference":
    case "rust_registration_array":
    case "rust_registration_item":
      return "rust_symbol";
  }
}

function scanHitNodeKind(hit: TextScanHit): ConcernGraphNodeKind {
  switch (hit.hitKind) {
    case "tool_name":
      return "tool";
    case "rpc_method":
      return "protocol_shape";
    case "config_key":
      return "config_key";
    case "migration_table":
      return "protocol_shape";
    case "hidden_context_tag":
    case "prompt_marker":
      return "string_marker";
  }
}

function sortExtractedEdges(edges: readonly ExtractedEdge[]): ExtractedEdge[] {
  return [...edges].sort((left, right) => left.edgeKey.localeCompare(right.edgeKey));
}
