import { DiffEditor, type Monaco } from "@monaco-editor/react";
import { FileDiff, MessageSquarePlus, MousePointer2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { editor } from "monaco-editor";
import type { CommitFileDetail, ReviewEntityScope, SourceAnchor } from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { TextArea } from "@/shared/ui/TextArea";
import type { ReviewCommentTarget } from "../model/commentTargets";
import { targetLabel, targetToCommentInput } from "../model/commentTargets";
import {
  buildMonacoDiffBlockModel,
  lineNumberForModelLine,
  textForAbsoluteLine,
  type MonacoDiffBlockModel,
  type MonacoDiffSide,
} from "../model/diffBlockModels";

type DiffBlockViewerProps = {
  file: CommitFileDetail;
  commentTarget: ReviewCommentTarget | null;
  isSubmitting: boolean;
  actionError?: string;
  onAddComment: (input: { scope: ReviewEntityScope; anchor: SourceAnchor; body: string }) => Promise<unknown>;
  onCommentTargetChange: (target: ReviewCommentTarget | null) => void;
};

export function DiffBlockViewer({
  file,
  commentTarget,
  isSubmitting,
  actionError,
  onAddComment,
  onCommentTargetChange,
}: DiffBlockViewerProps) {
  const modelsByBlockId = useMemo(
    () => new Map(file.diffBlocks.map((block) => [block.id, buildMonacoDiffBlockModel(block)])),
    [file.diffBlocks],
  );

  if (file.diffBlocks.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500">
        This file has no structured diff blocks.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {file.diffBlocks.map((block, index) => (
        <DiffBlockCard
          actionError={actionError}
          blockIndex={index}
          commentTarget={commentTarget}
          file={file}
          isSubmitting={isSubmitting}
          key={block.id}
          onAddComment={onAddComment}
          onCommentTargetChange={onCommentTargetChange}
          model={modelsByBlockId.get(block.id) ?? buildMonacoDiffBlockModel(block)}
          title={block.heading ?? `Block ${index + 1}`}
          oldRange={lineRange(block.oldStartLine, block.oldEndLine, "-")}
          newRange={lineRange(block.newStartLine, block.newEndLine, "+")}
        />
      ))}
    </div>
  );
}

type DiffBlockCardProps = {
  actionError?: string;
  blockIndex: number;
  commentTarget: ReviewCommentTarget | null;
  file: CommitFileDetail;
  isSubmitting: boolean;
  model: MonacoDiffBlockModel;
  newRange: string;
  oldRange: string;
  title: string;
  onAddComment: (input: { scope: ReviewEntityScope; anchor: SourceAnchor; body: string }) => Promise<unknown>;
  onCommentTargetChange: (target: ReviewCommentTarget | null) => void;
};

function DiffBlockCard({
  actionError,
  blockIndex,
  commentTarget,
  file,
  isSubmitting,
  model,
  newRange,
  oldRange,
  title,
  onAddComment,
  onCommentTargetChange,
}: DiffBlockCardProps) {
  const [body, setBody] = useState("");
  const originalRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const modifiedRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<{ old: editor.IEditorDecorationsCollection | null; new: editor.IEditorDecorationsCollection | null }>({
    old: null,
    new: null,
  });
  const isTargetInBlock = targetBelongsToBlock(commentTarget, model);
  const canSubmit = isTargetInBlock && body.trim().length > 0 && !isSubmitting;

  useEffect(() => {
    renderTargetDecorations(model, commentTarget, originalRef.current, modifiedRef.current, monacoRef.current, decorationsRef.current);
  }, [commentTarget, model]);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-md border bg-white",
        isTargetInBlock ? "border-slate-700 shadow-[0_0_0_2px_rgba(51,65,85,0.18)]" : "border-slate-200",
      )}
    >
      <div className="flex w-full items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileDiff className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
          <span className="truncate text-sm font-semibold text-slate-900">{title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-slate-500">
            {oldRange} / {newRange}
          </span>
          <Button
            className="h-8"
            onClick={() => onCommentTargetChange({ kind: "block", diffBlockId: model.blockId })}
            title="Comment on diff block"
            type="button"
            variant="secondary"
          >
            <MessageSquarePlus className="size-4" aria-hidden="true" />
            Block
          </Button>
        </div>
      </div>
      <div className="border-b border-slate-200" style={{ height: model.height }}>
        <DiffEditor
          height="100%"
          language={languageForPath(file.path)}
          modified={model.modifiedText}
          onMount={(diffEditor, monaco) => {
            monacoRef.current = monaco;
            const original = diffEditor.getOriginalEditor();
            const modified = diffEditor.getModifiedEditor();
            originalRef.current = original;
            modifiedRef.current = modified;
            configureEditor(original, model, "old", monaco, file.id, onCommentTargetChange);
            configureEditor(modified, model, "new", monaco, file.id, onCommentTargetChange);
            decorationsRef.current.old = original.createDecorationsCollection();
            decorationsRef.current.new = modified.createDecorationsCollection();
            renderTargetDecorations(model, commentTarget, original, modified, monaco, decorationsRef.current);
          }}
          options={{
            automaticLayout: true,
            codeLens: false,
            contextmenu: false,
            folding: false,
            glyphMargin: true,
            lineDecorationsWidth: 12,
            lineNumbersMinChars: 4,
            minimap: { enabled: false },
            readOnly: true,
            renderOverviewRuler: false,
            renderSideBySide: true,
            scrollBeyondLastLine: false,
            scrollbar: { alwaysConsumeMouseWheel: false },
          }}
          original={model.originalText}
          theme="vs"
        />
      </div>
      {isTargetInBlock ? (
        <form
          className="grid gap-2 bg-slate-50 px-3 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit || commentTarget === null) {
              return;
            }
            void onAddComment({ ...targetToCommentInput(commentTarget), body: body.trim() }).then(() => {
              setBody("");
              onCommentTargetChange(null);
            });
          }}
        >
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <MousePointer2 className="size-3.5" aria-hidden="true" />
            {targetLabel(commentTarget)}
          </div>
          <TextArea
            autoFocus
            className="min-h-16"
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add a comment"
            value={body}
          />
          {actionError === undefined ? null : <div className="text-sm text-red-700">{actionError}</div>}
          <div className="flex justify-end gap-2">
            <Button onClick={() => onCommentTargetChange(null)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={!canSubmit} type="submit">
              <MessageSquarePlus className="size-4" aria-hidden="true" />
              Comment
            </Button>
          </div>
        </form>
      ) : null}
    </article>
  );
}

function configureEditor(
  instance: editor.IStandaloneCodeEditor,
  model: MonacoDiffBlockModel,
  side: MonacoDiffSide,
  monaco: Monaco,
  commitFileId: string,
  onCommentTargetChange: (target: ReviewCommentTarget | null) => void,
): void {
  instance.updateOptions({
    lineNumbers: (modelLineNumber) => lineNumberForModelLine(model, side, modelLineNumber)?.toString() ?? "",
  });
  instance.onMouseDown((event) => {
    const position = event.target.position;
    if (position === null) {
      return;
    }
    const line = lineNumberForModelLine(model, side, position.lineNumber);
    if (line === undefined) {
      return;
    }
    onCommentTargetChange({
      kind: "line",
      commitFileId,
      side,
      line,
      text: textForAbsoluteLine(model, side, line),
    });
  });
  instance.onDidChangeCursorSelection((event) => {
    const selection = event.selection;
    if (selection.isEmpty()) {
      return;
    }
    const startLine = lineNumberForModelLine(model, side, selection.startLineNumber);
    const endLine = lineNumberForModelLine(model, side, selection.endLineNumber);
    const selectedText = instance.getModel()?.getValueInRange(selection) ?? "";
    if (startLine === undefined || endLine === undefined || selectedText.trim().length === 0) {
      return;
    }
    onCommentTargetChange({
      kind: "range",
      commitFileId,
      side,
      startLine,
      endLine,
      startColumn: selection.startColumn,
      endColumn: selection.endColumn,
      selectedText,
    });
  });
  instance.addAction({
    id: `comment-${side}-${model.blockId}`,
    label: "Comment on selection",
    run: () => undefined,
  });
  instance.updateOptions({ cursorStyle: "line" });
  monaco.editor.setTheme("vs");
}

function renderTargetDecorations(
  model: MonacoDiffBlockModel,
  target: ReviewCommentTarget | null,
  original: editor.IStandaloneCodeEditor | null,
  modified: editor.IStandaloneCodeEditor | null,
  monaco: Monaco | null,
  collections: { old: editor.IEditorDecorationsCollection | null; new: editor.IEditorDecorationsCollection | null },
): void {
  if (original === null || modified === null || monaco === null) {
    return;
  }
  collections.old?.clear();
  collections.new?.clear();
  if (
    !targetBelongsToBlock(target, model) ||
    target === null ||
    target.kind === "block" ||
    (target.kind !== "line" && target.kind !== "range")
  ) {
    return;
  }
  const side = target.side;
  const editorInstance = side === "old" ? original : modified;
  const collection = side === "old" ? collections.old : collections.new;
  const range = targetRangeInEditor(model, target);
  if (range === null || collection === null) {
    return;
  }
  collection.set([
    {
      range: new monaco.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn),
      options: {
        className: "prompt-review-selection-highlight",
        isWholeLine: target.kind === "line",
        linesDecorationsClassName: "prompt-review-selection-gutter",
      },
    },
  ]);
  editorInstance.revealLineInCenter(range.startLineNumber);
}

function targetRangeInEditor(
  model: MonacoDiffBlockModel,
  target: Extract<ReviewCommentTarget, { kind: "line" | "range" }>,
): { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } | null {
  const lineNumbers = target.side === "old" ? model.oldLineNumbers : model.newLineNumbers;
  const startLine = target.kind === "line" ? target.line : target.startLine;
  const endLine = target.kind === "line" ? target.line : target.endLine;
  const startModelLine = findModelLine(lineNumbers, startLine);
  const endModelLine = findModelLine(lineNumbers, endLine);
  if (startModelLine === undefined || endModelLine === undefined) {
    return null;
  }
  if (target.kind === "line") {
    return {
      startLineNumber: startModelLine,
      startColumn: 1,
      endLineNumber: endModelLine,
      endColumn: Math.max(target.text.length + 1, 1),
    };
  }
  return {
    startLineNumber: startModelLine,
    startColumn: target.startColumn,
    endLineNumber: endModelLine,
    endColumn: target.endColumn,
  };
}

function targetBelongsToBlock(target: ReviewCommentTarget | null, model: MonacoDiffBlockModel): boolean {
  if (target === null) {
    return false;
  }
  if (target.kind === "block") {
    return target.diffBlockId === model.blockId;
  }
  if (target.kind !== "line" && target.kind !== "range") {
    return false;
  }
  const line = target.kind === "line" ? target.line : target.startLine;
  const lineNumbers = target.side === "old" ? model.oldLineNumbers : model.newLineNumbers;
  return findModelLine(lineNumbers, line) !== undefined;
}

function findModelLine(lineNumbers: Map<number, number>, absoluteLine: number): number | undefined {
  for (const [modelLine, mappedAbsoluteLine] of lineNumbers.entries()) {
    if (mappedAbsoluteLine === absoluteLine) {
      return modelLine;
    }
  }
  return undefined;
}

function lineRange(start: number | undefined, end: number | undefined, prefix: string): string {
  if (start === undefined || end === undefined) {
    return `${prefix}?`;
  }
  return start === end ? `${prefix}${start}` : `${prefix}${start}-${end}`;
}

function languageForPath(path: string): string {
  if (path.endsWith(".rs")) {
    return "rust";
  }
  if (path.endsWith(".ts") || path.endsWith(".tsx")) {
    return "typescript";
  }
  if (path.endsWith(".json")) {
    return "json";
  }
  if (path.endsWith(".md")) {
    return "markdown";
  }
  return "plaintext";
}
