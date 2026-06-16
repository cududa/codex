import { createHash } from "node:crypto";
import type { GitChangedFile } from "../git/changeFiles.js";
import type { ParsedDiffFile } from "../git/diffParser.js";

export type BuiltDiffBlock = {
  blockKey: string;
  ordinal: number;
  contentHash: string;
  heading: string | null;
  oldStartLine: number | null;
  oldEndLine: number | null;
  newStartLine: number | null;
  newEndLine: number | null;
  patch: string;
};

export function buildDiffBlocksForFile(
  changedFile: Pick<GitChangedFile, "oldPath" | "newPath" | "changeType">,
  parsedFiles: readonly ParsedDiffFile[],
): BuiltDiffBlock[] {
  const parsedFile = parsedFiles.find((file) => sameFile(file, changedFile));
  if (parsedFile?.hunks.length) {
    return parsedFile.hunks.map((hunk, index) => {
      const ordinal = index + 1;
      return {
        blockKey: blockKey(ordinal),
        ordinal,
        contentHash: hashPatch(hunk.patch),
        heading: hunk.heading,
        oldStartLine: hunk.oldStartLine,
        oldEndLine: hunk.oldEndLine,
        newStartLine: hunk.newStartLine,
        newEndLine: hunk.newEndLine,
        patch: hunk.patch,
      };
    });
  }

  const patch = parsedFile?.patch ?? fallbackPatch(changedFile);
  return [
    {
      blockKey: blockKey(1),
      ordinal: 1,
      contentHash: hashPatch(patch),
      heading: null,
      oldStartLine: null,
      oldEndLine: null,
      newStartLine: null,
      newEndLine: null,
      patch,
    },
  ];
}

function sameFile(left: Pick<ParsedDiffFile, "oldPath" | "newPath">, right: Pick<GitChangedFile, "oldPath" | "newPath">) {
  return left.oldPath === right.oldPath && left.newPath === right.newPath;
}

function blockKey(ordinal: number): string {
  return `hunk-${ordinal.toString().padStart(4, "0")}`;
}

function hashPatch(patch: string): string {
  return createHash("sha256").update(patch).digest("hex");
}

function fallbackPatch(changedFile: Pick<GitChangedFile, "oldPath" | "newPath" | "changeType">): string {
  return [
    `file change ${changedFile.changeType}`,
    `old path ${changedFile.oldPath ?? "/dev/null"}`,
    `new path ${changedFile.newPath ?? "/dev/null"}`,
  ].join("\n");
}
