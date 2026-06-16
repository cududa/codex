import { findMatchingBrace, findMatchingDelimiter, lineStartsFor, rangeForOffsets } from "./sourceText.js";
import {
  collectStringLiterals,
  hasMessageRoleContext,
  innermostContainingNode,
  isFunctionDeclaration,
  maskRustNonCode,
  nodeKey,
  normalizePath,
  parseImplHeader,
  qualifyCallPath,
  sortExtraction,
  splitTopLevelSegments,
  type RustStringLiteral,
  type Segment,
} from "./rustSyntax.js";
import type { ExtractedEdge, ExtractedEdgeKind, ExtractedNode, ExtractedNodeKind, ExtractionOutput, SourceFileInput } from "./types.js";

type MutableExtraction = {
  path: string;
  content: string;
  code: string;
  lineStarts: number[];
  nodes: Map<string, ExtractedNode>;
  edges: Map<string, ExtractedEdge>;
  fileNodeKey: string;
};

const roleMarkers = new Set(["assistant", "developer", "system", "tool", "user"]);
const callExclusions = new Set(["if", "for", "loop", "match", "return", "while"]);
const registrationNamePattern = /(register|registry|tool|tools|permission|permissions|command|commands|model|models|provider|providers)/i;

export function extractRustSources(files: readonly SourceFileInput[]): ExtractionOutput {
  return sortExtraction(
    files.reduce<ExtractionOutput>(
      (output, file) => {
        const extracted = extractRustSource(file);
        output.nodes.push(...extracted.nodes);
        output.edges.push(...extracted.edges);
        return output;
      },
      { nodes: [], edges: [], scanHits: [] },
    ),
  );
}

export function extractRustSource(input: SourceFileInput): ExtractionOutput {
  const lineStarts = lineStartsFor(input.content);
  const extraction: MutableExtraction = {
    path: normalizePath(input.path),
    content: input.content,
    code: maskRustNonCode(input.content),
    lineStarts,
    nodes: new Map(),
    edges: new Map(),
    fileNodeKey: nodeKey("file", input.path, undefined, 0),
  };
  addNode(extraction, "file", extraction.fileNodeKey, 0, input.content.length, { symbol: extraction.path });

  const itemNodes = extractItems(extraction);
  const implNodes = extractImpls(extraction);
  const functionNodes = extractFunctions(extraction);
  extractCalls(extraction, [...functionNodes, ...implNodes]);
  extractVariantReferences(extraction, functionNodes);
  extractStringMarkers(extraction, collectStringLiterals(input.content), functionNodes);
  extractIncludeTargets(extraction, collectStringLiterals(input.content));
  extractRegistrationArrays(extraction, itemNodes);

  return sortExtraction({
    nodes: [...extraction.nodes.values()],
    edges: [...extraction.edges.values()],
    scanHits: [],
  });
}

function extractItems(extraction: MutableExtraction): ExtractedNode[] {
  const nodes: ExtractedNode[] = [];
  const pattern = /\b(?:pub(?:\s*\([^)]*\))?\s+)?(struct|enum|trait|mod|const|static)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
  for (const match of extraction.code.matchAll(pattern)) {
    const start = match.index;
    const kind = match[1];
    const symbol = match[2];
    const openBrace = extraction.code.indexOf("{", start + match[0].length);
    const semicolon = extraction.code.indexOf(";", start + match[0].length);
    const hasBody = openBrace !== -1 && (semicolon === -1 || openBrace < semicolon);
    const end = hasBody ? findMatchingBrace(extraction.content, openBrace) : semicolon === -1 ? start + match[0].length : semicolon + 1;
    const item = addNode(extraction, "rust_item", nodeKey("rust_item", extraction.path, `${kind}:${symbol}`, start), start, end, { symbol });
    addEdge(extraction, "contains", extraction.fileNodeKey, item.nodeKey, start, end, { symbol });
    nodes.push(item);
    if (kind === "enum" && hasBody) {
      extractEnumVariants(extraction, item, symbol, openBrace + 1, end - 1);
    }
  }
  return nodes;
}

function extractEnumVariants(
  extraction: MutableExtraction,
  enumNode: ExtractedNode,
  enumName: string,
  bodyStart: number,
  bodyEnd: number,
): void {
  for (const segment of splitTopLevelSegments(extraction.content, extraction.code, bodyStart, bodyEnd, ",")) {
    const variantMatch = segment.text.match(/^\s*(?:#\[[\s\S]*?\]\s*)*([A-Z][A-Za-z0-9_]*)\b/);
    if (variantMatch === null) {
      continue;
    }
    const variantStart = segment.startByte + (variantMatch.index ?? 0) + variantMatch[0].lastIndexOf(variantMatch[1]);
    const symbol = `${enumName}::${variantMatch[1]}`;
    const variant = addNode(extraction, "rust_enum_variant", nodeKey("rust_enum_variant", extraction.path, symbol, variantStart), variantStart, segment.endByte, { symbol });
    addEdge(extraction, "contains", enumNode.nodeKey, variant.nodeKey, variantStart, segment.endByte, { symbol });
  }
}

function extractImpls(extraction: MutableExtraction): ExtractedNode[] {
  const nodes: ExtractedNode[] = [];
  for (const match of extraction.code.matchAll(/\bimpl\b/g)) {
    const start = match.index;
    const openBrace = extraction.code.indexOf("{", start);
    if (openBrace === -1) {
      continue;
    }
    const header = extraction.content.slice(start, openBrace).replace(/\s+/g, " ").trim();
    const parsed = parseImplHeader(header);
    if (parsed === undefined) {
      continue;
    }
    const end = findMatchingBrace(extraction.content, openBrace);
    const symbol = parsed.traitName === undefined ? parsed.typeName : `${parsed.traitName} for ${parsed.typeName}`;
    const kind: ExtractedNodeKind = parsed.traitName === undefined ? "rust_impl" : "rust_trait_impl";
    const implNode = addNode(extraction, kind, nodeKey(kind, extraction.path, symbol, start), start, end, { symbol });
    addEdge(extraction, "contains", extraction.fileNodeKey, implNode.nodeKey, start, end, { symbol });
    nodes.push(implNode);
    if (parsed.traitName !== undefined) {
      const traitNode = addNode(extraction, "rust_item", nodeKey("rust_item", extraction.path, `trait-ref:${parsed.traitName}`, start), start, openBrace, { symbol: parsed.traitName });
      addEdge(extraction, "implements", implNode.nodeKey, traitNode.nodeKey, start, openBrace, { symbol: parsed.traitName });
    }
  }
  return nodes;
}

function extractFunctions(extraction: MutableExtraction): ExtractedNode[] {
  const nodes: ExtractedNode[] = [];
  const pattern = /\b(?:pub(?:\s*\([^)]*\))?\s+)?(?:async\s+)?(?:unsafe\s+)?fn\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:<[^>{;]*>)?\s*\(/g;
  for (const match of extraction.code.matchAll(pattern)) {
    const start = match.index;
    const symbol = match[1];
    const bodyStart = extraction.code.indexOf("{", start + match[0].length);
    const semicolon = extraction.code.indexOf(";", start + match[0].length);
    const hasBody = bodyStart !== -1 && (semicolon === -1 || bodyStart < semicolon);
    const end = hasBody ? findMatchingBrace(extraction.content, bodyStart) : semicolon === -1 ? start + match[0].length : semicolon + 1;
    const functionNode = addNode(extraction, "rust_function", nodeKey("rust_function", extraction.path, symbol, start), start, end, { symbol });
    addEdge(extraction, "contains", containingItem(extraction, functionNode, start)?.nodeKey ?? extraction.fileNodeKey, functionNode.nodeKey, start, end, { symbol });
    nodes.push(functionNode);
  }
  return nodes;
}

function extractCalls(extraction: MutableExtraction, containers: ExtractedNode[]): void {
  const pattern = /\b([A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*!?)\s*(?=\()/g;
  for (const match of extraction.code.matchAll(pattern)) {
    const start = match.index;
    const call = qualifyCallPath(extraction.code, match[1], start);
    const symbol = call.symbol;
    if (callExclusions.has(symbol) || symbol === "include_str!" || isFunctionDeclaration(extraction.code, start)) {
      continue;
    }
    const callNode = addNode(extraction, "rust_call_path", nodeKey("rust_call_path", extraction.path, symbol, call.startByte), call.startByte, start + match[1].length, { symbol });
    const container = innermostContainingNode(containers, start);
    addEdge(extraction, "calls", container?.nodeKey ?? extraction.fileNodeKey, callNode.nodeKey, call.startByte, start + match[1].length, { symbol });
  }
}

function extractVariantReferences(extraction: MutableExtraction, containers: ExtractedNode[]): void {
  const constructPattern = /\b([A-Z][A-Za-z0-9_]*(?:::[A-Z][A-Za-z0-9_]*)+)\s*(?=[({,}\]])/g;
  for (const match of extraction.code.matchAll(constructPattern)) {
    addVariantReference(extraction, containers, "constructs_variant", match[1], match.index, match.index + match[1].length);
  }
  for (const match of extraction.code.matchAll(/\bmatch\b/g)) {
    const openBrace = extraction.code.indexOf("{", match.index);
    if (openBrace === -1) {
      continue;
    }
    const closeBrace = findMatchingBrace(extraction.content, openBrace);
    for (const segment of splitTopLevelSegments(extraction.content, extraction.code, openBrace + 1, closeBrace - 1, ",")) {
      const arrow = segment.text.indexOf("=>");
      if (arrow === -1) {
        continue;
      }
      const patternText = segment.text.slice(0, arrow);
      for (const variant of patternText.matchAll(/\b([A-Z][A-Za-z0-9_]*(?:::[A-Z][A-Za-z0-9_]*)+)\b/g)) {
        const start = segment.startByte + (variant.index ?? 0);
        addVariantReference(extraction, containers, "matches_variant", variant[1], start, start + variant[1].length);
      }
    }
  }
}

function extractStringMarkers(
  extraction: MutableExtraction,
  literals: readonly RustStringLiteral[],
  containers: readonly ExtractedNode[],
): void {
  for (const literal of literals) {
    if (literal.value.length === 0 || literal.value.length > 240) {
      continue;
    }
    const markerNode = addNode(
      extraction,
      "rust_string_marker",
      nodeKey("rust_string_marker", extraction.path, literal.value, literal.startByte),
      literal.startByte,
      literal.endByte,
      { marker: literal.value },
    );
    const container = innermostContainingNode(containers, literal.startByte);
    addEdge(extraction, "matches_marker", container?.nodeKey ?? extraction.fileNodeKey, markerNode.nodeKey, literal.startByte, literal.endByte, { marker: literal.value });
    if (roleMarkers.has(literal.value) && hasMessageRoleContext(extraction.content, literal.startByte)) {
      addEdge(extraction, "role_marker", container?.nodeKey ?? extraction.fileNodeKey, markerNode.nodeKey, literal.startByte, literal.endByte, { marker: literal.value });
    }
  }
}

function extractIncludeTargets(extraction: MutableExtraction, literals: readonly RustStringLiteral[]): void {
  for (const match of extraction.code.matchAll(/\binclude_str!\s*\(/g)) {
    const openParen = extraction.code.indexOf("(", match.index);
    const closeParen = findMatchingDelimiter(extraction.content, openParen, "(", ")");
    const target = literals.find((literal) => literal.startByte > openParen && literal.endByte < closeParen);
    if (target === undefined) {
      continue;
    }
    const includeNode = addNode(extraction, "rust_include_target", nodeKey("rust_include_target", extraction.path, target.value, target.startByte), target.startByte, target.endByte, {
      marker: target.value,
      symbol: target.value,
    });
    addEdge(extraction, "include", extraction.fileNodeKey, includeNode.nodeKey, match.index, closeParen, { marker: target.value, symbol: target.value });
  }
}

function extractRegistrationArrays(extraction: MutableExtraction, itemNodes: readonly ExtractedNode[]): void {
  const pattern = /\b(?:const|static|let)\s+([A-Za-z_][A-Za-z0-9_]*)\b/g;
  for (const match of extraction.code.matchAll(pattern)) {
    const name = match[1];
    const equals = extraction.code.indexOf("=", match.index + match[0].length);
    const openBracket = equals === -1 ? -1 : extraction.code.indexOf("[", equals);
    if (openBracket === -1 || openBracket - equals > 4) {
      continue;
    }
    const closeBracket = findMatchingDelimiter(extraction.content, openBracket, "[", "]");
    const body = extraction.content.slice(openBracket, closeBracket);
    if (!registrationNamePattern.test(name) && !registrationNamePattern.test(body)) {
      continue;
    }
    const arrayNode = addNode(extraction, "rust_registration_array", nodeKey("rust_registration_array", extraction.path, name, match.index), match.index, closeBracket, { symbol: name });
    addEdge(extraction, "contains", containingItem(extraction, arrayNode, match.index, itemNodes)?.nodeKey ?? extraction.fileNodeKey, arrayNode.nodeKey, match.index, closeBracket, { symbol: name });
    for (const segment of splitTopLevelSegments(extraction.content, extraction.code, openBracket + 1, closeBracket - 1, ",")) {
      addRegistrationItem(extraction, arrayNode, segment);
    }
  }
}

function addRegistrationItem(extraction: MutableExtraction, arrayNode: ExtractedNode, segment: Segment): void {
  const literals = collectStringLiterals(segment.text).filter((literal) => literal.value.length > 0);
  if (literals.length > 0) {
    for (const literal of literals) {
      const start = segment.startByte + literal.startByte;
      const item = addNode(extraction, "rust_registration_item", nodeKey("rust_registration_item", extraction.path, literal.value, start), start, start + literal.endByte - literal.startByte, { marker: literal.value, symbol: literal.value });
      addEdge(extraction, "registration", arrayNode.nodeKey, item.nodeKey, segment.startByte, segment.endByte, { marker: literal.value, symbol: literal.value });
    }
    return;
  }
  const pathMatch = segment.text.match(/\b([A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)+|[A-Z][A-Za-z0-9_]+)\b/);
  if (pathMatch === null) {
    return;
  }
  const symbol = pathMatch[1];
  const start = segment.startByte + (pathMatch.index ?? 0);
  const item = addNode(extraction, "rust_registration_item", nodeKey("rust_registration_item", extraction.path, symbol, start), start, start + symbol.length, { symbol });
  addEdge(extraction, "registration", arrayNode.nodeKey, item.nodeKey, segment.startByte, segment.endByte, { symbol });
}

function addVariantReference(
  extraction: MutableExtraction,
  containers: readonly ExtractedNode[],
  edgeKind: ExtractedEdgeKind,
  symbol: string,
  start: number,
  end: number,
): void {
  const variantNode = addNode(extraction, "rust_variant_reference", nodeKey("rust_variant_reference", extraction.path, symbol, start), start, end, { symbol });
  const container = innermostContainingNode(containers, start);
  addEdge(extraction, edgeKind, container?.nodeKey ?? extraction.fileNodeKey, variantNode.nodeKey, start, end, { symbol });
}

function addNode(
  extraction: MutableExtraction,
  nodeKind: ExtractedNodeKind,
  key: string,
  startByte: number,
  endByte: number,
  values: Pick<ExtractedNode, "marker" | "symbol">,
): ExtractedNode {
  const existing = extraction.nodes.get(key);
  if (existing !== undefined) {
    return existing;
  }
  const node = { path: extraction.path, nodeKind, nodeKey: key, ...rangeForOffsets(extraction.lineStarts, startByte, endByte), ...values };
  extraction.nodes.set(key, node);
  return node;
}

function addEdge(
  extraction: MutableExtraction,
  edgeKind: ExtractedEdgeKind,
  fromNodeKey: string,
  toNodeKey: string,
  startByte: number,
  endByte: number,
  values: Pick<ExtractedEdge, "marker" | "symbol">,
): void {
  const edgeKey = `${edgeKind}:${fromNodeKey}->${toNodeKey}:${startByte}:${endByte}`;
  if (extraction.edges.has(edgeKey)) {
    return;
  }
  extraction.edges.set(edgeKey, {
    path: extraction.path,
    edgeKind,
    edgeKey,
    fromNodeKey,
    toNodeKey,
    ...rangeForOffsets(extraction.lineStarts, startByte, endByte),
    ...values,
  });
}

function containingItem(
  extraction: MutableExtraction,
  node: ExtractedNode,
  startByte: number,
  candidates: readonly ExtractedNode[] = [...extraction.nodes.values()],
): ExtractedNode | undefined {
  return innermostContainingNode(candidates.filter((candidate) => candidate.nodeKey !== node.nodeKey), startByte);
}
