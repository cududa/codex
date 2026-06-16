import { parsePatch } from "diff";
import type { DiffBlockView } from "@domain/schemas";

export type MonacoDiffSide = "old" | "new";

export type MonacoDiffBlockModel = {
  blockId: string;
  originalText: string;
  modifiedText: string;
  oldLineNumbers: Map<number, number>;
  newLineNumbers: Map<number, number>;
  oldTextByLine: Map<number, string>;
  newTextByLine: Map<number, string>;
  height: number;
};

export function buildMonacoDiffBlockModel(block: DiffBlockView): MonacoDiffBlockModel {
  const hunks = parseDiffHunks(block);
  const originalLines: string[] = [];
  const modifiedLines: string[] = [];
  const oldLineNumbers = new Map<number, number>();
  const newLineNumbers = new Map<number, number>();
  const oldTextByLine = new Map<number, string>();
  const newTextByLine = new Map<number, string>();

  for (const hunk of hunks) {
    let oldLine = hunk.oldStart;
    let newLine = hunk.newStart;

    for (const rawLine of hunk.lines) {
      const marker = rawLine[0] ?? " ";
      const text = rawLine.slice(1);
      if (marker === "-") {
        appendLine(originalLines, oldLineNumbers, oldTextByLine, oldLine, text);
        oldLine += 1;
        continue;
      }
      if (marker === "+") {
        appendLine(modifiedLines, newLineNumbers, newTextByLine, newLine, text);
        newLine += 1;
        continue;
      }
      if (marker === "\\") {
        continue;
      }
      if (marker === " ") {
        appendLine(originalLines, oldLineNumbers, oldTextByLine, oldLine, text);
        appendLine(modifiedLines, newLineNumbers, newTextByLine, newLine, text);
        oldLine += 1;
        newLine += 1;
      }
    }
  }

  if (originalLines.length === 0) {
    originalLines.push("");
  }
  if (modifiedLines.length === 0) {
    modifiedLines.push("");
  }

  return {
    blockId: block.id,
    originalText: originalLines.join("\n"),
    modifiedText: modifiedLines.join("\n"),
    oldLineNumbers,
    newLineNumbers,
    oldTextByLine,
    newTextByLine,
    height: Math.max(160, Math.min(520, Math.max(originalLines.length, modifiedLines.length) * 20 + 72)),
  };
}

function parseDiffHunks(block: DiffBlockView): Array<{
  oldStart: number;
  newStart: number;
  lines: string[];
}> {
  try {
    return parsePatch(block.patch).flatMap((file) => file.hunks);
  } catch {
    return [
      {
        oldStart: block.oldStartLine ?? 1,
        newStart: block.newStartLine ?? 1,
        lines: block.patch.split("\n").filter((line) => !line.startsWith("@@")),
      },
    ];
  }
}

export function lineNumberForModelLine(
  model: MonacoDiffBlockModel,
  side: MonacoDiffSide,
  modelLineNumber: number,
): number | undefined {
  return side === "old" ? model.oldLineNumbers.get(modelLineNumber) : model.newLineNumbers.get(modelLineNumber);
}

export function textForAbsoluteLine(model: MonacoDiffBlockModel, side: MonacoDiffSide, line: number): string {
  return (side === "old" ? model.oldTextByLine : model.newTextByLine).get(line) ?? "";
}

function appendLine(
  lines: string[],
  lineNumbers: Map<number, number>,
  textByLine: Map<number, string>,
  absoluteLine: number,
  text: string,
): void {
  lines.push(text);
  lineNumbers.set(lines.length, absoluteLine);
  textByLine.set(absoluteLine, text);
}
