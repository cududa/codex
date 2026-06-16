import type { SourceRange } from "./types.js";

export function lineStartsFor(content: string): number[] {
  const starts = [0];
  for (let index = 0; index < content.length; index += 1) {
    if (content[index] === "\n") {
      starts.push(index + 1);
    }
  }
  return starts;
}

export function lineForOffset(lineStarts: readonly number[], offset: number): number {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lineStarts[mid] <= offset) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return Math.max(1, high + 1);
}

export function rangeForOffsets(
  lineStarts: readonly number[],
  startByte: number,
  endByte: number,
): SourceRange {
  return {
    startByte,
    endByte,
    startLine: lineForOffset(lineStarts, startByte),
    endLine: lineForOffset(lineStarts, Math.max(startByte, endByte - 1)),
  };
}

export function findMatchingBrace(content: string, openBrace: number): number {
  return findMatchingDelimiter(content, openBrace, "{", "}");
}

export function findMatchingDelimiter(content: string, openIndex: number, open: string, close: string): number {
  let depth = 0;
  let stringQuote: string | undefined;
  let escaped = false;
  for (let index = openIndex; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];
    if (stringQuote !== undefined) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === stringQuote) {
        stringQuote = undefined;
      }
      continue;
    }
    if (char === "/" && next === "/") {
      index = skipLineComment(content, index);
      continue;
    }
    if (char === "/" && next === "*") {
      index = skipBlockComment(content, index);
      continue;
    }
    if (char === "\"" || char === "'") {
      stringQuote = char;
      continue;
    }
    if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
  }
  return content.length;
}

export function literalOccurrences(content: string, literal: string): Array<{ start: number; end: number }> {
  if (literal.length === 0) {
    return [];
  }
  const occurrences: Array<{ start: number; end: number }> = [];
  let start = content.indexOf(literal);
  while (start !== -1) {
    occurrences.push({ start, end: start + literal.length });
    start = content.indexOf(literal, start + literal.length);
  }
  return occurrences;
}

function skipLineComment(content: string, start: number): number {
  const newline = content.indexOf("\n", start + 2);
  return newline === -1 ? content.length - 1 : newline;
}

function skipBlockComment(content: string, start: number): number {
  const close = content.indexOf("*/", start + 2);
  return close === -1 ? content.length - 1 : close + 1;
}
