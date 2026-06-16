export type Anchor = {
  selectedText: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
};

export type AnchorResolution =
  | { ok: true; anchor: Anchor }
  | { ok: false; reason: string; matches?: Array<{ startLine: number; startColumn: number }> };

type Occurrence = {
  index: number;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
};

export function resolveAnchor(
  fileText: string,
  selectedText: string,
  startLine?: number,
): AnchorResolution {
  if (selectedText.length === 0) {
    return { ok: false, reason: "selectedText must not be empty." };
  }

  const occurrences = findOccurrences(fileText, selectedText);
  if (occurrences.length === 0) {
    return { ok: false, reason: "selectedText was not found in the file." };
  }

  const candidates =
    startLine === undefined
      ? occurrences
      : occurrences.filter((occurrence) => occurrence.startLine === startLine);

  if (startLine !== undefined && candidates.length === 0) {
    return {
      ok: false,
      reason: `selectedText was not found starting on line ${startLine}.`,
      matches: toMatchList(occurrences),
    };
  }

  if (candidates.length > 1) {
    const sameLine = startLine !== undefined || allSameLine(candidates);
    return {
      ok: false,
      reason: sameLine
        ? "selectedText appears more than once on the same line. Make a wider selection."
        : "selectedText appears more than once. Provide startLine.",
      matches: toMatchList(candidates),
    };
  }

  const [match] = candidates;
  return {
    ok: true,
    anchor: {
      selectedText,
      startLine: match.startLine,
      startColumn: match.startColumn,
      endLine: match.endLine,
      endColumn: match.endColumn,
    },
  };
}

export function resolveBlockAnchor(
  fileText: string,
  blockId: string,
  lineOffset = 0,
): AnchorResolution {
  if (blockId.trim().length === 0) {
    return { ok: false, reason: "blockId must not be empty." };
  }
  if (!Number.isInteger(lineOffset) || lineOffset < 0) {
    return { ok: false, reason: "lineOffset must be a non-negative integer." };
  }

  const lines = fileText.split(/\r?\n/);
  const headingPattern = new RegExp(`^## (?:Same|Changed) \`${escapeRegExp(blockId)}\`$`);
  const headingIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => headingPattern.test(line))
    .map(({ index }) => index);

  if (headingIndexes.length === 0) {
    return { ok: false, reason: `blockId was not found in the review: ${blockId}` };
  }
  if (headingIndexes.length > 1) {
    return { ok: false, reason: `blockId appears more than once in the review: ${blockId}` };
  }

  const [headingIndex] = headingIndexes;
  const nextHeadingIndex = lines.findIndex((line, index) => index > headingIndex && /^## /.test(line));
  const blockEndExclusive = nextHeadingIndex === -1 ? lines.length : nextHeadingIndex;
  const targetIndex = headingIndex + lineOffset;

  if (targetIndex >= blockEndExclusive) {
    return {
      ok: false,
      reason: `lineOffset ${lineOffset} is outside ${blockId}. Use a smaller offset or omit lineOffset to anchor the whole block.`,
    };
  }

  if (lineOffset > 0) {
    const selectedText = lines[targetIndex];
    return {
      ok: true,
      anchor: {
        selectedText,
        startLine: targetIndex + 1,
        startColumn: 1,
        endLine: targetIndex + 1,
        endColumn: selectedText.length + 1,
      },
    };
  }

  const selectedLines = lines.slice(headingIndex, blockEndExclusive);
  const selectedText = selectedLines.join("\n");
  return {
    ok: true,
    anchor: {
      selectedText,
      startLine: headingIndex + 1,
      startColumn: 1,
      endLine: blockEndExclusive,
      endColumn: (lines[blockEndExclusive - 1]?.length ?? 0) + 1,
    },
  };
}

function findOccurrences(fileText: string, selectedText: string): Occurrence[] {
  const lineStarts = getLineStarts(fileText);
  const occurrences: Occurrence[] = [];
  let fromIndex = 0;

  while (fromIndex <= fileText.length) {
    const index = fileText.indexOf(selectedText, fromIndex);
    if (index === -1) {
      break;
    }

    const start = positionAt(lineStarts, index);
    const end = positionAt(lineStarts, index + selectedText.length);
    occurrences.push({
      index,
      startLine: start.line,
      startColumn: start.column,
      endLine: end.line,
      endColumn: end.column,
    });
    fromIndex = index + 1;
  }

  return occurrences;
}

function getLineStarts(text: string): number[] {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") {
      starts.push(index + 1);
    }
  }
  return starts;
}

function positionAt(lineStarts: number[], index: number): { line: number; column: number } {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lineStarts[mid] <= index) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const lineIndex = Math.max(0, high);
  return {
    line: lineIndex + 1,
    column: index - lineStarts[lineIndex] + 1,
  };
}

function allSameLine(occurrences: Occurrence[]): boolean {
  const [first] = occurrences;
  return occurrences.every((occurrence) => occurrence.startLine === first.startLine);
}

function toMatchList(occurrences: Occurrence[]): Array<{ startLine: number; startColumn: number }> {
  return occurrences.map(({ startLine, startColumn }) => ({ startLine, startColumn }));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
