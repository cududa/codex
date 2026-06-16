import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PromptReviewsDatabase } from "../db/client.js";
import type { CommentStatus } from "../domain/enums.js";
import type { ActorRef, SourceAnchor } from "../domain/schemas/index.js";
import {
  listCommentsByScopeStatus,
  findDiffBlockById,
  updateCommentLifecycleFields,
  type CommentRow,
} from "../repositories/index.js";
import { addComment } from "../services/commentService.js";
import { recomputeCommitStatus, recomputeFileStatus, recomputeVersionStatus } from "../services/statusService.js";
import type { RootServiceContext } from "../services/serviceContext.js";
import { parseLegacyMarkdownReview, resolveLegacyCommentTarget } from "./markdownImport.js";
import {
  emptyLegacyImportCounts,
  type LegacyCommentCommand,
  type LegacyCommentImportResult,
  type LegacyCommentInput,
  type LegacyImportReport,
  type LegacyImportWarning,
  warning,
} from "./types.js";

export type ImportLegacyCommentsJsonOptions = {
  projectRoot: string;
  commentsJsonPath: string;
  dryRun?: boolean;
};

export async function importLegacyCommentsJson(
  context: RootServiceContext,
  options: ImportLegacyCommentsJsonOptions,
): Promise<LegacyImportReport> {
  const warnings: LegacyImportWarning[] = [];
  const counts = emptyLegacyImportCounts();
  const dryRun = options.dryRun ?? true;
  const raw = await readFile(options.commentsJsonPath, "utf8");
  const comments = parseLegacyCommentsJson(raw, options.commentsJsonPath, warnings);
  const markdownCache = new Map<string, string>();

  for (const comment of comments) {
    const command = await buildLegacyCommentCommand(context.db, comment, {
      projectRoot: options.projectRoot,
      markdownCache,
      warnings,
    });
    if (command === undefined) {
      continue;
    }

    const result = importLegacyCommentCommand(context, command, { dryRun });
    warnings.push(...result.warnings);
    if (result.duplicate) {
      counts.skippedDuplicates += 1;
    } else if (result.created) {
      counts.comments += 1;
    }
    if (command.target.matchedVersionId !== undefined) {
      counts.versions += 1;
    }
    if (command.target.matchedCommitId !== undefined) {
      counts.commits += 1;
    }
    if (command.target.matchedCommitFileId !== undefined) {
      counts.files += 1;
    }
    if (command.target.matchedDiffBlockId !== undefined) {
      counts.diffBlocks += 1;
    }
  }

  return { dryRun, counts: { ...counts, warnings: warnings.length }, warnings };
}

export function parseLegacyCommentsJson(
  content: string,
  sourcePath: string,
  warnings: LegacyImportWarning[] = [],
): LegacyCommentInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    warnings.push(
      warning("legacy_comments_json_invalid", "Legacy comments JSON could not be parsed.", {
        sourcePath,
        details: { error: error instanceof Error ? error.message : String(error) },
      }),
    );
    return [];
  }

  const values = Array.isArray(parsed) ? parsed : readObjectArray(parsed, "comments");
  if (values === undefined) {
    warnings.push(
      warning("legacy_comments_json_invalid", "Legacy comments JSON must be an array or an object with a comments array.", {
        sourcePath,
      }),
    );
    return [];
  }

  return values.flatMap((value, index) => parseLegacyComment(value, sourcePath, index, warnings));
}

export function importLegacyCommentCommand(
  context: RootServiceContext,
  command: LegacyCommentCommand,
  options: { dryRun?: boolean } = {},
): LegacyCommentImportResult {
  const warnings = [...command.target.warnings];
  const existing = findDuplicateComment(context.db, command);
  if (existing !== undefined) {
    warnings.push(
      warning("legacy_comment_duplicate", "Legacy comment matched an existing structured comment and was skipped.", {
        sourcePath: command.sourcePath,
        legacyId: command.legacyId,
        details: { commentId: existing.id },
      }),
    );
    return { command, created: false, duplicate: true, comment: existing, warnings };
  }

  if (options.dryRun === true) {
    return { command, created: true, duplicate: false, warnings };
  }

  try {
    const added = addComment(context, {
      scope: command.target.scope,
      anchor: command.target.anchor,
      body: command.body,
      author: command.author,
    });
    const row = listCommentsByScopeStatus(context.db, {
      scope: added.scope.type,
      targetId: targetIdFromScope(added.scope),
    }).find((candidate) => candidate.id === added.id);

    if (row !== undefined && command.status !== "open") {
      updateCommentLifecycleFields(context.db, row.id, {
        status: command.status,
        resolution: command.resolution ?? "Imported resolved legacy comment.",
        resolvedByActorType: "human",
        resolvedByActorId: null,
        resolvedByDisplayName: "Legacy import",
        resolvedAt: command.createdAt ?? context.now(),
        updatedAt: command.createdAt ?? context.now(),
      });
      refreshImportedCommentStatus(context, row);
    }

    return { command, created: true, duplicate: false, comment: row, warnings };
  } catch (error) {
    warnings.push(
      warning("legacy_comment_import_failed", "Legacy comment could not be imported through the comment service.", {
        sourcePath: command.sourcePath,
        legacyId: command.legacyId,
        details: { error: error instanceof Error ? error.message : String(error) },
      }),
    );
    return { command, created: false, duplicate: false, warnings };
  }
}

async function buildLegacyCommentCommand(
  db: PromptReviewsDatabase,
  comment: LegacyCommentInput,
  options: { projectRoot: string; markdownCache: Map<string, string>; warnings: LegacyImportWarning[] },
): Promise<LegacyCommentCommand | undefined> {
  const markdownPath = path.resolve(options.projectRoot, comment.filePath);
  let markdown = options.markdownCache.get(markdownPath);
  if (markdown === undefined) {
    try {
      markdown = await readFile(markdownPath, "utf8");
      options.markdownCache.set(markdownPath, markdown);
    } catch (error) {
      options.warnings.push(
        warning("legacy_markdown_invalid", "Legacy markdown review referenced by a comment could not be read.", {
          sourcePath: comment.filePath,
          legacyId: comment.id,
          details: { error: error instanceof Error ? error.message : String(error) },
        }),
      );
      return undefined;
    }
  }

  const review = parseLegacyMarkdownReview(comment.filePath, markdown);
  return {
    legacyId: comment.id,
    sourcePath: comment.filePath,
    body: comment.body,
    createdAt: parseCreatedAt(comment.createdAt),
    status: comment.status ?? "open",
    resolution: comment.resolution,
    author: actorFromLegacyAuthor(comment.author),
    target: resolveLegacyCommentTarget(db, review, comment.anchor, { legacyId: comment.id }),
  };
}

function parseLegacyComment(
  value: unknown,
  sourcePath: string,
  index: number,
  warnings: LegacyImportWarning[],
): LegacyCommentInput[] {
  if (value === null || typeof value !== "object") {
    warnings.push(warning("legacy_comment_invalid", "Legacy comment entry must be an object.", { sourcePath, details: { index } }));
    return [];
  }

  const object = value as Record<string, unknown>;
  const filePath = readString(object.filePath);
  const body = readString(object.body);
  if (filePath === undefined || body === undefined) {
    warnings.push(
      warning("legacy_comment_invalid", "Legacy comment entry must include filePath and body.", {
        sourcePath,
        legacyId: readString(object.id),
        details: { index },
      }),
    );
    return [];
  }

  return [
    {
      id: readString(object.id),
      filePath,
      body,
      createdAt: readString(object.createdAt),
      author: readString(object.author),
      status: readCommentStatus(object.status),
      resolution: readString(object.resolution),
      anchor: parseAnchor(object.anchor),
    },
  ];
}

function parseAnchor(value: unknown) {
  if (value === null || typeof value !== "object") {
    return undefined;
  }
  const object = value as Record<string, unknown>;
  return {
    selectedText: readString(object.selectedText),
    startLine: readNumber(object.startLine),
    startColumn: readNumber(object.startColumn),
    endLine: readNumber(object.endLine),
    endColumn: readNumber(object.endColumn),
  };
}

function findDuplicateComment(db: PromptReviewsDatabase, command: LegacyCommentCommand): CommentRow | undefined {
  return listCommentsByScopeStatus(db, {
    scope: command.target.scope.type,
    targetId: targetIdFromScope(command.target.scope),
  }).find(
    (row) =>
      row.body === command.body &&
      row.authorActorType === command.author.type &&
      row.status === command.status &&
      sameAnchor(row, command.target.anchor),
  );
}

function sameAnchor(row: CommentRow, anchor: SourceAnchor): boolean {
  if (anchor.kind !== row.anchorKind) {
    return false;
  }
  if (anchor.kind === "scope") {
    return true;
  }
  if (anchor.kind === "block") {
    return row.anchorDiffBlockId === anchor.diffBlockId;
  }
  return (
    row.anchorCommitFileId === anchor.commitFileId &&
    row.anchorSide === anchor.side &&
    row.startLine === anchor.startLine &&
    row.endLine === anchor.endLine &&
    row.startColumn === (anchor.startColumn ?? null) &&
    row.endColumn === (anchor.endColumn ?? null) &&
    row.selectedText === (anchor.selectedText ?? null)
  );
}

function targetIdFromScope(scope: LegacyCommentCommand["target"]["scope"]): string {
  if (scope.type === "version") {
    return scope.versionId;
  }
  if (scope.type === "commit") {
    return scope.commitId;
  }
  if (scope.type === "commit_file") {
    return scope.commitFileId;
  }
  return scope.diffBlockId;
}

function actorFromLegacyAuthor(author: string | undefined): ActorRef {
  if (author === "human") {
    return { type: "human", displayName: "Legacy human" };
  }
  if (author === "system") {
    return { type: "system", displayName: "Legacy system" };
  }
  return { type: "agent", displayName: "Legacy agent" };
}

function refreshImportedCommentStatus(context: RootServiceContext, row: CommentRow): void {
  if (row.scope === "version" && row.versionId !== null) {
    recomputeVersionStatus(context, row.versionId);
  } else if (row.scope === "commit" && row.commitId !== null) {
    recomputeCommitStatus(context, row.commitId);
  } else if (row.scope === "commit_file" && row.commitFileId !== null) {
    recomputeFileStatus(context, row.commitFileId);
  } else if (row.diffBlockId !== null) {
    const block = findDiffBlockById(context.db, row.diffBlockId);
    if (block !== undefined) {
      recomputeFileStatus(context, block.commitFileId);
    }
  }
}

function readObjectArray(value: unknown, key: string): unknown[] | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }
  const child = (value as Record<string, unknown>)[key];
  return Array.isArray(child) ? child : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) ? value : undefined;
}

function readCommentStatus(value: unknown): CommentStatus | undefined {
  return value === "open" || value === "resolved" || value === "wont_fix" || value === "superseded" ? value : undefined;
}

function parseCreatedAt(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const millis = Date.parse(value);
  return Number.isFinite(millis) ? Math.floor(millis / 1000) : undefined;
}
