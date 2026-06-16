import type { PromptReviewsDatabase } from "../db/client.js";
import type { ReviewEntityScope, SourceAnchor } from "../domain/schemas/index.js";
import {
  listCommitFilesByCommit,
  listCommitsByVersion,
  listDiffBlocksByCommitFile,
  listVersions,
  type CommitFileRow,
  type CommitRow,
  type DiffBlockRow,
  type VersionRow,
} from "../repositories/index.js";
import {
  type LegacyAnchorInput,
  type LegacyImportWarning,
  type LegacyMarkdownBlock,
  type LegacyMarkdownReview,
  type LegacyResolvedTarget,
  warning,
} from "./types.js";

type LocatedMarkdownTarget = {
  review: LegacyMarkdownReview;
  version: VersionRow;
  commit: CommitRow;
  file: CommitFileRow;
  diffBlocks: DiffBlockRow[];
  warnings: LegacyImportWarning[];
};

export function parseLegacyMarkdownReview(path: string, content: string): LegacyMarkdownReview {
  const lines = content.split(/\r?\n/);
  const frontmatter = parseFrontmatter(lines);

  return {
    path,
    commit: frontmatter.get("commit"),
    parent: frontmatter.get("parent"),
    shortCommit: frontmatter.get("shortCommit"),
    subject: stripQuotes(frontmatter.get("subject")),
    target: stripQuotes(frontmatter.get("target")),
    sourceBefore: frontmatter.get("source.before"),
    sourceAfter: frontmatter.get("source.after"),
    blocks: parseBlocks(lines),
  };
}

export function resolveLegacyMarkdownTarget(
  db: PromptReviewsDatabase,
  review: LegacyMarkdownReview,
): LocatedMarkdownTarget | { review: LegacyMarkdownReview; warnings: LegacyImportWarning[] } {
  const warnings: LegacyImportWarning[] = [];
  const commitSha = review.commit ?? review.shortCommit;
  if (commitSha === undefined) {
    return {
      review,
      warnings: [
        warning("legacy_markdown_missing_commit", "Legacy markdown review does not declare a commit.", {
          sourcePath: review.path,
        }),
      ],
    };
  }

  const commitMatches = findCommits(db, commitSha);
  if (commitMatches.length === 0) {
    return {
      review,
      warnings: [
        warning("legacy_markdown_missing_commit", "No imported commit matched the legacy markdown commit.", {
          sourcePath: review.path,
          details: { commitSha },
        }),
      ],
    };
  }
  if (commitMatches.length > 1) {
    return {
      review,
      warnings: [
        warning("legacy_markdown_ambiguous_commit", "More than one imported commit matched the legacy markdown commit.", {
          sourcePath: review.path,
          details: { commitSha, commitIds: commitMatches.map((match) => match.commit.id) },
        }),
      ],
    };
  }

  const [{ version, commit }] = commitMatches;
  const sourcePath = sourcePathFromReview(review);
  if (sourcePath === undefined) {
    return {
      review,
      warnings: [
        warning("legacy_markdown_missing_target", "Legacy markdown review does not declare a source file target.", {
          sourcePath: review.path,
        }),
      ],
    };
  }

  const files = listCommitFilesByCommit(db, commit.id).filter((file) => file.oldPath === sourcePath || file.newPath === sourcePath);
  if (files.length === 0) {
    return {
      review,
      warnings: [
        warning("legacy_markdown_missing_file", "No imported commit file matched the legacy markdown source path.", {
          sourcePath: review.path,
          details: { commitId: commit.id, sourcePath },
        }),
      ],
    };
  }
  if (files.length > 1) {
    return {
      review,
      warnings: [
        warning("legacy_markdown_ambiguous_file", "More than one imported commit file matched the legacy markdown source path.", {
          sourcePath: review.path,
          details: { commitId: commit.id, sourcePath, fileIds: files.map((file) => file.id) },
        }),
      ],
    };
  }

  const file = files[0];
  return {
    review,
    version,
    commit,
    file,
    diffBlocks: listDiffBlocksByCommitFile(db, file.id),
    warnings,
  };
}

export function resolveLegacyCommentTarget(
  db: PromptReviewsDatabase,
  review: LegacyMarkdownReview,
  anchor: LegacyAnchorInput | undefined,
  options: { legacyId?: string } = {},
): LegacyResolvedTarget {
  const located = resolveLegacyMarkdownTarget(db, review);
  const warnings = [...located.warnings];
  if (!("file" in located)) {
    return {
      scope: fallbackVersionScope(db),
      anchor: { kind: "scope" },
      warnings,
    };
  }

  const block = resolveBlock(located, anchor, options.legacyId);
  warnings.push(...block.warnings);
  if (block.row !== undefined) {
    return {
      scope: { type: "diff_block", diffBlockId: block.row.id },
      anchor: { kind: "block", diffBlockId: block.row.id },
      warnings,
      matchedVersionId: located.version.id,
      matchedCommitId: located.commit.id,
      matchedCommitFileId: located.file.id,
      matchedDiffBlockId: block.row.id,
    };
  }

  return {
    scope: { type: "commit_file", commitFileId: located.file.id },
    anchor: { kind: "scope" },
    warnings,
    matchedVersionId: located.version.id,
    matchedCommitId: located.commit.id,
    matchedCommitFileId: located.file.id,
  };
}

export function summarizeLegacyMarkdownReview(
  db: PromptReviewsDatabase,
  review: LegacyMarkdownReview,
): Pick<LegacyResolvedTarget, "warnings" | "matchedVersionId" | "matchedCommitId" | "matchedCommitFileId"> & {
  matchedDiffBlockIds: string[];
} {
  const located = resolveLegacyMarkdownTarget(db, review);
  if (!("file" in located)) {
    return { warnings: located.warnings, matchedDiffBlockIds: [] };
  }
  return {
    warnings: located.warnings,
    matchedVersionId: located.version.id,
    matchedCommitId: located.commit.id,
    matchedCommitFileId: located.file.id,
    matchedDiffBlockIds: located.diffBlocks.map((block) => block.id),
  };
}

function parseFrontmatter(lines: string[]): Map<string, string> {
  const values = new Map<string, string>();
  if (lines[0] !== "---") {
    return values;
  }

  let section: string | undefined;
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === "---") {
      break;
    }
    const sectionMatch = line.match(/^([A-Za-z0-9_-]+):\s*$/);
    if (sectionMatch !== null) {
      section = sectionMatch[1];
      continue;
    }
    const pair = line.match(/^(\s*)([A-Za-z0-9_-]+):\s*(.*)$/);
    if (pair === null) {
      continue;
    }
    const [, indent, key, value] = pair;
    values.set(indent.length > 0 && section !== undefined ? `${section}.${key}` : key, value.trim());
  }
  return values;
}

function parseBlocks(lines: string[]): LegacyMarkdownBlock[] {
  const blocks: LegacyMarkdownBlock[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim() !== "<!--") {
      continue;
    }

    const metadata = new Map<string, string>();
    let cursor = index + 1;
    for (; cursor < lines.length && lines[cursor].trim() !== "-->"; cursor += 1) {
      const pair = lines[cursor].match(/^\s*([A-Za-z0-9_-]+):\s*(.*)$/);
      if (pair !== null) {
        metadata.set(pair[1], pair[2].trim());
      }
    }
    if (cursor >= lines.length || !metadata.has("id")) {
      continue;
    }

    const fenceStart = findNextFence(lines, cursor + 1);
    if (fenceStart === undefined) {
      continue;
    }
    const fenceInfo = lines[fenceStart].match(/^```(\S*)/);
    const fenceEnd = findClosingFence(lines, fenceStart + 1);
    if (fenceEnd === undefined) {
      continue;
    }

    blocks.push({
      id: metadata.get("id") ?? "",
      kind: metadata.get("kind") ?? "unknown",
      beforeLines: metadata.get("beforeLines") ?? "none",
      afterLines: metadata.get("afterLines") ?? "none",
      fenceLanguage: fenceInfo?.[1]?.split(/\s+/)[0] ?? "",
      fenceStartLine: fenceStart + 1,
      fenceEndLine: fenceEnd + 1,
      content: lines.slice(fenceStart + 1, fenceEnd).join("\n"),
    });
    index = fenceEnd;
  }
  return blocks;
}

function findNextFence(lines: string[], start: number): number | undefined {
  for (let index = start; index < lines.length; index += 1) {
    if (lines[index].startsWith("```")) {
      return index;
    }
  }
  return undefined;
}

function findClosingFence(lines: string[], start: number): number | undefined {
  for (let index = start; index < lines.length; index += 1) {
    if (lines[index].startsWith("```")) {
      return index;
    }
  }
  return undefined;
}

function resolveBlock(
  located: LocatedMarkdownTarget,
  anchor: LegacyAnchorInput | undefined,
  legacyId: string | undefined,
): { row?: DiffBlockRow; warnings: LegacyImportWarning[] } {
  const warnings: LegacyImportWarning[] = [];
  const legacyBlockMatches = findLegacyBlockMatches(located.review.blocks, anchor);
  if (legacyBlockMatches.length > 1) {
    warnings.push(
      warning("legacy_anchor_ambiguous", "Legacy comment anchor matched more than one markdown block.", {
        sourcePath: located.review.path,
        legacyId,
        details: { blockIds: legacyBlockMatches.map((block) => block.id) },
      }),
    );
    return { warnings };
  }

  const legacyBlock = legacyBlockMatches[0];
  if (legacyBlock !== undefined) {
    const diffMatches = located.diffBlocks.filter((block) => block.blockKey === legacyBlock.id);
    if (diffMatches.length === 1) {
      return { row: diffMatches[0], warnings };
    }
    if (diffMatches.length > 1) {
      warnings.push(
        warning("legacy_anchor_ambiguous", "Legacy comment anchor matched more than one imported diff block.", {
          sourcePath: located.review.path,
          legacyId,
          details: { blockKey: legacyBlock.id, diffBlockIds: diffMatches.map((block) => block.id) },
        }),
      );
      return { warnings };
    }
  }

  const selectedText = anchor?.selectedText?.trim();
  if (selectedText !== undefined && selectedText.length > 0) {
    const selectedTextCandidates = legacySelectedTextCandidates(selectedText);
    const diffMatches = located.diffBlocks.filter((block) =>
      selectedTextCandidates.some((candidate) => block.patch.includes(candidate)),
    );
    if (diffMatches.length === 1) {
      return { row: diffMatches[0], warnings };
    }
    if (diffMatches.length > 1) {
      warnings.push(
        warning("legacy_anchor_ambiguous", "Legacy selected text matched more than one imported diff block.", {
          sourcePath: located.review.path,
          legacyId,
          details: { selectedText, diffBlockIds: diffMatches.map((block) => block.id) },
        }),
      );
      return { warnings };
    }
  }

  warnings.push(
    warning("legacy_anchor_unmatched", "Legacy comment anchor did not match an imported diff block; imported at file scope.", {
      sourcePath: located.review.path,
      legacyId,
      details: { selectedText, startLine: anchor?.startLine, endLine: anchor?.endLine },
    }),
  );
  return { warnings };
}

function legacySelectedTextCandidates(selectedText: string): string[] {
  const candidates = [selectedText];
  if (/^[+-] /.test(selectedText)) {
    candidates.push(selectedText.replace(/^([+-]) /, "$1"));
  }
  return Array.from(new Set(candidates));
}

function findLegacyBlockMatches(blocks: LegacyMarkdownBlock[], anchor: LegacyAnchorInput | undefined): LegacyMarkdownBlock[] {
  if (anchor?.startLine !== undefined && anchor.endLine !== undefined) {
    const lineMatches = blocks.filter(
      (block) => anchor.startLine !== undefined && anchor.endLine !== undefined && block.fenceStartLine <= anchor.endLine && block.fenceEndLine >= anchor.startLine,
    );
    if (lineMatches.length > 0) {
      return lineMatches;
    }
  }

  const selectedText = anchor?.selectedText?.trim();
  if (selectedText === undefined || selectedText.length === 0) {
    return [];
  }
  return blocks.filter((block) => block.content.includes(selectedText));
}

function sourcePathFromReview(review: LegacyMarkdownReview): string | undefined {
  return sourcePathFromRef(review.sourceAfter) ?? sourcePathFromRef(review.sourceBefore);
}

function sourcePathFromRef(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const separator = value.indexOf(":");
  if (separator === -1) {
    return value;
  }
  return value.slice(separator + 1);
}

function findCommits(db: PromptReviewsDatabase, commitSha: string): { version: VersionRow; commit: CommitRow }[] {
  return listVersions(db, { status: undefined }).flatMap((version) =>
    listCommitsByVersion(db, version.id)
      .filter((commit) => commit.sha === commitSha || commit.sha.startsWith(commitSha) || commitSha.startsWith(commit.sha))
      .map((commit) => ({ version, commit })),
  );
}

function fallbackVersionScope(db: PromptReviewsDatabase): ReviewEntityScope {
  const version = listVersions(db, { status: undefined })[0];
  if (version !== undefined) {
    return { type: "version", versionId: version.id };
  }
  return { type: "version", versionId: "legacy-unmatched-version" };
}

function stripQuotes(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value.replace(/^"(.*)"$/, "$1");
}
