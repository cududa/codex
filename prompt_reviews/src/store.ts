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
  anchor: z.object({
    selectedText: z.string(),
    startLine: z.number(),
    startColumn: z.number(),
    endLine: z.number(),
    endColumn: z.number(),
  }),
});

const StoreSchema = z.object({
  comments: z.array(CommentSchema),
});

export type ReviewComment = z.infer<typeof CommentSchema>;

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
  }): Promise<ReviewComment> {
    const data = await this.read();
    const comment: ReviewComment = {
      id: crypto.randomUUID(),
      filePath: input.filePath,
      body: input.body,
      author: input.author ?? "agent",
      createdAt: new Date().toISOString(),
      anchor: input.anchor,
    };
    data.comments.push(comment);
    await this.write(data);
    return comment;
  }

  private async read(): Promise<z.infer<typeof StoreSchema>> {
    try {
      const raw = await readFile(this.storePath, "utf8");
      return StoreSchema.parse(JSON.parse(raw));
    } catch (error) {
      if (isMissingFileError(error)) {
        return { comments: [] };
      }
      throw error;
    }
  }

  private async write(data: z.infer<typeof StoreSchema>): Promise<void> {
    await mkdir(path.dirname(this.storePath), { recursive: true });
    await writeFile(this.storePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
