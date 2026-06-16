import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Anchor } from "./anchors.js";

const CommentSchema = z.object({
  id: z.string(),
  filePath: z.string(),
  body: z.string(),
  author: z.string(),
  createdAt: z.string(),
  blockId: z.string().optional(),
  anchor: z.object({
    selectedText: z.string(),
    startLine: z.number(),
    startColumn: z.number(),
    endLine: z.number(),
    endColumn: z.number(),
  }),
});

const ReviewNoteSchema = z.object({
  id: z.string(),
  scope: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("review"),
      filePath: z.string(),
    }),
    z.object({
      type: z.literal("bundle"),
      bundle: z.string(),
    }),
  ]),
  body: z.string(),
  author: z.string(),
  createdAt: z.string(),
});

const StoreSchema = z.object({
  comments: z.array(CommentSchema),
  notes: z.array(ReviewNoteSchema).default([]),
});

export type ReviewComment = z.infer<typeof CommentSchema>;
export type ReviewNote = z.infer<typeof ReviewNoteSchema>;

export class CommentStore {
  constructor(private readonly storePath: string) {}

  async list(filePath?: string): Promise<ReviewComment[]> {
    const data = await this.read();
    return filePath === undefined
      ? data.comments
      : data.comments.filter((comment) => comment.filePath === filePath);
  }

  async add(input: {
    filePath: string;
    body: string;
    author?: string;
    anchor: Anchor;
    blockId?: string;
  }): Promise<ReviewComment> {
    const data = await this.read();
    const comment: ReviewComment = {
      id: crypto.randomUUID(),
      filePath: input.filePath,
      body: input.body,
      author: input.author ?? "agent",
      createdAt: new Date().toISOString(),
      ...(input.blockId === undefined ? {} : { blockId: input.blockId }),
      anchor: input.anchor,
    };
    data.comments.push(comment);
    await this.write(data);
    return comment;
  }

  async listNotes(scope?: ReviewNote["scope"]): Promise<ReviewNote[]> {
    const data = await this.read();
    if (scope === undefined) {
      return data.notes;
    }

    return data.notes.filter((note) => sameScope(note.scope, scope));
  }

  async addNote(input: {
    scope: ReviewNote["scope"];
    body: string;
    author?: string;
  }): Promise<ReviewNote> {
    const data = await this.read();
    const note: ReviewNote = {
      id: crypto.randomUUID(),
      scope: input.scope,
      body: input.body,
      author: input.author ?? "agent",
      createdAt: new Date().toISOString(),
    };
    data.notes.push(note);
    await this.write(data);
    return note;
  }

  private async read(): Promise<z.infer<typeof StoreSchema>> {
    try {
      const raw = await readFile(this.storePath, "utf8");
      return StoreSchema.parse(JSON.parse(raw));
    } catch (error) {
      if (isMissingFileError(error)) {
        return { comments: [], notes: [] };
      }
      throw error;
    }
  }

  private async write(data: z.infer<typeof StoreSchema>): Promise<void> {
    await mkdir(path.dirname(this.storePath), { recursive: true });
    await writeFile(this.storePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
}

function sameScope(left: ReviewNote["scope"], right: ReviewNote["scope"]): boolean {
  if (left.type !== right.type) {
    return false;
  }
  if (left.type === "review" && right.type === "review") {
    return left.filePath === right.filePath;
  }
  if (left.type === "bundle" && right.type === "bundle") {
    return left.bundle === right.bundle;
  }
  return false;
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
