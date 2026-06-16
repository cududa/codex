import { findMatchingDelimiter } from "./sourceText.js";
import type { ExtractedEdge, ExtractedNode, ExtractedNodeKind, ExtractionOutput } from "./types.js";

export type RustStringLiteral = {
  value: string;
  startByte: number;
  endByte: number;
};

export type Segment = {
  startByte: number;
  endByte: number;
  text: string;
};

export function parseImplHeader(header: string): { traitName?: string; typeName: string } | undefined {
  let body = header.replace(/^impl\s*/, "").trim();
  if (body.startsWith("<")) {
    const genericEnd = findMatchingDelimiter(body, 0, "<", ">");
    body = body.slice(genericEnd).trim();
  }
  body = body.split(/\s+where\s+/)[0].trim();
  const traitSplit = body.match(/^(.+)\s+for\s+(.+)$/);
  if (traitSplit === null) {
    return body.length === 0 ? undefined : { typeName: body };
  }
  return { traitName: traitSplit[1].trim(), typeName: traitSplit[2].trim() };
}

export function splitTopLevelSegments(
  content: string,
  code: string,
  startByte: number,
  endByte: number,
  separator: string,
): Segment[] {
  const segments: Segment[] = [];
  let depth = 0;
  let segmentStart = startByte;
  for (let index = startByte; index < endByte; index += 1) {
    const char = code[index];
    if (char === "{" || char === "(" || char === "[") {
      depth += 1;
    } else if (char === "}" || char === ")" || char === "]") {
      depth -= 1;
    } else if (char === separator && depth === 0) {
      segments.push({ startByte: segmentStart, endByte: index, text: content.slice(segmentStart, index) });
      segmentStart = index + 1;
    }
  }
  segments.push({ startByte: segmentStart, endByte, text: content.slice(segmentStart, endByte) });
  return segments.filter((segment) => segment.text.trim().length > 0);
}

export function collectStringLiterals(content: string): RustStringLiteral[] {
  const literals: RustStringLiteral[] = [];
  for (let index = 0; index < content.length; index += 1) {
    const raw = rawStringAt(content, index);
    if (raw !== undefined) {
      literals.push(raw);
      index = raw.endByte - 1;
      continue;
    }
    if (content[index] === "\"") {
      const literal = quotedStringAt(content, index);
      literals.push(literal);
      index = literal.endByte - 1;
    }
  }
  return literals;
}

export function maskRustNonCode(content: string): string {
  let output = "";
  for (let index = 0; index < content.length; index += 1) {
    const raw = rawStringAt(content, index);
    if (raw !== undefined) {
      output += maskSpan(content.slice(index, raw.endByte));
      index = raw.endByte - 1;
      continue;
    }
    if (content[index] === "/" && content[index + 1] === "/") {
      const end = content.indexOf("\n", index + 2);
      const close = end === -1 ? content.length : end;
      output += maskSpan(content.slice(index, close));
      index = close - 1;
    } else if (content[index] === "/" && content[index + 1] === "*") {
      const end = content.indexOf("*/", index + 2);
      const close = end === -1 ? content.length : end + 2;
      output += maskSpan(content.slice(index, close));
      index = close - 1;
    } else if (content[index] === "\"") {
      const literal = quotedStringAt(content, index);
      output += maskSpan(content.slice(index, literal.endByte));
      index = literal.endByte - 1;
    } else {
      output += content[index];
    }
  }
  return output;
}

export function hasMessageRoleContext(content: string, startByte: number): boolean {
  const context = content.slice(Math.max(0, startByte - 160), Math.min(content.length, startByte + 160)).toLowerCase();
  return /\b(role|message|input_item|responseitem|chatcompletion|conversation)\b/.test(context);
}

export function innermostContainingNode(nodes: readonly ExtractedNode[], startByte: number): ExtractedNode | undefined {
  return nodes
    .filter((node) => node.startByte <= startByte && startByte <= node.endByte)
    .sort((left, right) => left.endByte - left.startByte - (right.endByte - right.startByte))[0];
}

export function isFunctionDeclaration(code: string, start: number): boolean {
  return /\bfn\s+$/.test(code.slice(Math.max(0, start - 12), start));
}

export function qualifyCallPath(code: string, symbol: string, start: number): { symbol: string; startByte: number } {
  const prefix = code.slice(Math.max(0, start - 96), start);
  const receiver = prefix.match(/([A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*)\.$/);
  return receiver === null
    ? { symbol, startByte: start }
    : { symbol: `${receiver[1]}.${symbol}`, startByte: start - receiver[1].length - 1 };
}

export function sortExtraction(output: ExtractionOutput): ExtractionOutput {
  return {
    nodes: [...output.nodes].sort(compareNodes),
    edges: [...output.edges].sort(compareEdges),
    scanHits: [...output.scanHits].sort((left, right) => left.hitKey.localeCompare(right.hitKey)),
  };
}

export function nodeKey(kind: ExtractedNodeKind, path: string, symbol: string | undefined, startByte: number): string {
  const suffix = symbol === undefined ? "" : `:${stablePart(symbol)}`;
  return `${kind}:${normalizePath(path)}${suffix}:${startByte}`;
}

export function normalizePath(value: string): string {
  return value.replaceAll("\\", "/");
}

function rawStringAt(content: string, start: number): RustStringLiteral | undefined {
  const prefix = content.slice(start).match(/^(?:b|c)?r(#+)?"/);
  if (prefix === null) {
    return undefined;
  }
  const hashes = prefix[1] ?? "";
  const valueStart = start + prefix[0].length;
  const close = `"${hashes}`;
  const closeStart = content.indexOf(close, valueStart);
  const valueEnd = closeStart === -1 ? content.length : closeStart;
  return { value: content.slice(valueStart, valueEnd), startByte: start, endByte: valueEnd + close.length };
}

function quotedStringAt(content: string, start: number): RustStringLiteral {
  let value = "";
  let escaped = false;
  for (let index = start + 1; index < content.length; index += 1) {
    const char = content[index];
    if (escaped) {
      value += char;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "\"") {
      return { value, startByte: start, endByte: index + 1 };
    } else {
      value += char;
    }
  }
  return { value, startByte: start, endByte: content.length };
}

function maskSpan(value: string): string {
  return value.replace(/[^\n]/g, " ");
}

function compareNodes(left: ExtractedNode, right: ExtractedNode): number {
  return left.path.localeCompare(right.path) || left.nodeKind.localeCompare(right.nodeKind) || left.nodeKey.localeCompare(right.nodeKey);
}

function compareEdges(left: ExtractedEdge, right: ExtractedEdge): number {
  return left.path.localeCompare(right.path) || left.edgeKind.localeCompare(right.edgeKind) || left.edgeKey.localeCompare(right.edgeKey);
}

function stablePart(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
