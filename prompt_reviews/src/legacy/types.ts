import type { CommentStatus } from "../domain/enums.js";
import type { ActorRef, ReviewEntityScope, SourceAnchor } from "../domain/schemas/index.js";
import type { CommentRow } from "../repositories/index.js";

export type LegacyImportWarningCode =
  | "legacy_comments_json_invalid"
  | "legacy_comment_invalid"
  | "legacy_markdown_invalid"
  | "legacy_markdown_missing_target"
  | "legacy_markdown_ambiguous_commit"
  | "legacy_markdown_missing_commit"
  | "legacy_markdown_ambiguous_file"
  | "legacy_markdown_missing_file"
  | "legacy_anchor_ambiguous"
  | "legacy_anchor_unmatched"
  | "legacy_comment_duplicate"
  | "legacy_comment_import_failed";

export type LegacyImportWarning = {
  code: LegacyImportWarningCode;
  message: string;
  sourcePath?: string;
  legacyId?: string;
  details?: Record<string, unknown>;
};

export type LegacyImportCounts = {
  versions: number;
  commits: number;
  files: number;
  diffBlocks: number;
  comments: number;
  decisions: number;
  plans: number;
  warnings: number;
  skippedDuplicates: number;
};

export type LegacyImportReport = {
  dryRun: boolean;
  counts: LegacyImportCounts;
  warnings: LegacyImportWarning[];
};

export type LegacyActorInput = {
  author?: string;
};

export type LegacyAnchorInput = {
  selectedText?: string;
  startLine?: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
};

export type LegacyCommentInput = LegacyActorInput & {
  id?: string;
  filePath: string;
  body: string;
  createdAt?: string;
  status?: CommentStatus;
  anchor?: LegacyAnchorInput;
};

export type LegacyResolvedTarget = {
  scope: ReviewEntityScope;
  anchor: SourceAnchor;
  warnings: LegacyImportWarning[];
  matchedVersionId?: string;
  matchedCommitId?: string;
  matchedCommitFileId?: string;
  matchedDiffBlockId?: string;
};

export type LegacyCommentCommand = {
  legacyId?: string;
  sourcePath: string;
  body: string;
  createdAt?: number;
  status: CommentStatus;
  author: ActorRef;
  target: LegacyResolvedTarget;
};

export type LegacyCommentImportResult = {
  command: LegacyCommentCommand;
  created: boolean;
  duplicate: boolean;
  comment?: CommentRow;
  warnings: LegacyImportWarning[];
};

export type LegacyMarkdownBlock = {
  id: string;
  kind: string;
  beforeLines: string;
  afterLines: string;
  fenceLanguage: string;
  fenceStartLine: number;
  fenceEndLine: number;
  content: string;
};

export type LegacyMarkdownReview = {
  path: string;
  commit?: string;
  parent?: string;
  shortCommit?: string;
  subject?: string;
  target?: string;
  sourceBefore?: string;
  sourceAfter?: string;
  blocks: LegacyMarkdownBlock[];
};

export function emptyLegacyImportCounts(): LegacyImportCounts {
  return {
    versions: 0,
    commits: 0,
    files: 0,
    diffBlocks: 0,
    comments: 0,
    decisions: 0,
    plans: 0,
    warnings: 0,
    skippedDuplicates: 0,
  };
}

export function warning(
  code: LegacyImportWarningCode,
  message: string,
  extras: Omit<LegacyImportWarning, "code" | "message"> = {},
): LegacyImportWarning {
  return { code, message, ...extras };
}
