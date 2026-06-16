import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { resolveAnchor, resolveBlockAnchor } from "./anchors.js";
import { listReviewFiles, listReviews } from "./discovery.js";
import { createReviews, normalizeBundleName, parseTargetSpec } from "./reviews.js";
import type { CommentStore, ReviewComment } from "./store.js";
import type { Workspace } from "./workspace.js";

type ToolResult = {
  isError?: boolean;
  content: Array<{ type: "text"; text: string }>;
};

export class PromptReviewMcp {
  constructor(
    private readonly workspace: Workspace,
    private readonly store: CommentStore,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse, body: unknown): Promise<void> {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await this.createServer().connect(transport);
    await transport.handleRequest(req, res, body);
    await transport.close();
  }

  private createServer(): McpServer {
    const server = new McpServer({
      name: "prompt-reviews",
      version: "0.1.0",
    });

    this.registerResources(server);
    server.registerTool(
      "get_file",
      {
        title: "Get file text",
        description: "Read a text file from the workspace so an agent can choose an exact selection.",
        inputSchema: z.object({
          filePath: z.string().describe("Workspace-relative path to read."),
        }),
      },
      safeTool(async ({ filePath }) => {
        const file = await this.workspace.readTextFile(filePath);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(file, null, 2),
            },
          ],
        };
      }),
    );

    server.registerTool(
      "create_review",
      {
        title: "Create prompt review",
        description:
          "Generate prompt review markdown files from a commit/ref and explicit named targets. The generated review text is what comments should anchor to.",
        inputSchema: z.object({
          commit: z.string().describe("Commit, tag, branch, or ref to compare with its first parent."),
          bundle: z
            .string()
            .optional()
            .describe("Optional bundle name. When provided, reviews are written under prompt_reviews/<bundle>/<commit>/."),
          targets: z
            .array(
              z.object({
                name: z.string().describe("Stable local name for the review artifact."),
                path: z.string().describe("Repo-relative target path."),
                startLine: z.number().int().positive().optional(),
                endLine: z.number().int().positive().optional(),
              }),
            )
            .optional(),
          targetSpecs: z
            .array(z.string())
            .optional()
            .describe("Alternative compact target specs like name=path or name=path:start-end."),
        }),
      },
      safeTool(async ({ commit, bundle, targets, targetSpecs }) => {
        const reviewTargets = targets ?? targetSpecs?.map(parseTargetSpec) ?? [];
        const result = await createReviews({
          workspace: this.workspace,
          artifactRoot: this.workspace.resolveFile("prompt_reviews").absolutePath,
          commit,
          bundle,
          targets: reviewTargets,
        });
        const payload = {
          ...result,
          supportedModes: ["added-only", "deleted-only", "changed"],
          nextAction: {
            tool: "add_review_comment",
            reviewPath: result.outputs[0]?.reviewPath,
            instructions:
              "Prefer add_review_comment with reviewPath, blockId, and comment when commenting on an emitted block like change-005. Use selectedText plus optional startLine for narrower exact selections.",
          },
        };
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(payload, null, 2),
            },
          ],
        };
      }),
    );

    server.registerTool(
      "list_reviews",
      {
        title: "List generated reviews",
        description:
          "List generated prompt review artifacts without regenerating them. Optionally filter by commit prefix or bundle.",
        inputSchema: z.object({
          commit: z.string().optional().describe("Optional commit prefix, for example 96836e15ed."),
          bundle: z.string().optional().describe("Optional bundle name."),
        }),
      },
      safeTool(async ({ commit, bundle }) => {
        const reviews = await listReviews(this.workspace.resolveFile("prompt_reviews").absolutePath, {
          commit,
          bundle,
        });
        const comments = await this.store.list();
        const notes = await this.store.listNotes();
        const payload = {
          reviews: reviews.map((review) => ({
            ...review,
            commentCount: countComments(comments, review.reviewPath),
            noteCount: notes.filter(
              (note) => note.scope.type === "review" && note.scope.filePath === review.reviewPath,
            ).length,
          })),
        };
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(payload, null, 2),
            },
          ],
        };
      }),
    );

    server.registerTool(
      "add_review_comment",
      {
        title: "Add anchored review comment",
        description:
          "Add a comment anchored to a generated review file. Prefer blockId for emitted review blocks; use selectedText for exact selections.",
        inputSchema: z.object({
          reviewPath: z.string().describe("Workspace-relative generated .prompt-review.md path."),
          selectedText: z
            .string()
            .optional()
            .describe("Exact selected text from the generated review. Required when blockId is omitted."),
          blockId: z
            .string()
            .optional()
            .describe("Generated block id such as change-005 or same-002. Required when selectedText is omitted."),
          lineOffset: z
            .number()
            .int()
            .nonnegative()
            .optional()
            .describe("Optional zero-based line offset inside blockId for finer anchoring."),
          comment: z.string().describe("Comment body."),
          startLine: z.number().int().positive().optional(),
          author: z.string().optional(),
        }),
      },
      safeTool(async ({ reviewPath, selectedText, blockId, lineOffset, comment, startLine, author }) => {
        const file = await this.workspace.readTextFile(reviewPath);
        const anchor =
          blockId === undefined
            ? selectedText === undefined
              ? { ok: false as const, reason: "selectedText or blockId is required." }
              : resolveAnchor(file.text, selectedText, startLine)
            : resolveBlockAnchor(file.text, blockId, lineOffset);
        if (!anchor.ok) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: JSON.stringify(anchor, null, 2),
              },
            ],
          };
        }

        const saved = await this.store.add({
          filePath: file.relativePath,
          body: comment,
          author,
          anchor: anchor.anchor,
          blockId,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(saved, null, 2),
            },
          ],
        };
      }),
    );

    server.registerTool(
      "list_comments",
      {
        title: "List prompt review comments",
        description: "List anchored comments, optionally scoped to one file. Use format=compact for review-ready summaries.",
        inputSchema: z.object({
          filePath: z.string().optional(),
          format: z.enum(["full", "compact"]).optional(),
        }),
      },
      safeTool(async ({ filePath, format }) => {
        const relativePath =
          filePath === undefined ? undefined : this.workspace.resolveFile(filePath).relativePath;
        const comments = await this.store.list(relativePath);
        const notes =
          relativePath === undefined
            ? await this.store.listNotes()
            : await this.store.listNotes({ type: "review", filePath: relativePath });
        const payload =
          format === "compact"
            ? { comments: compactComments(comments), notes }
            : { comments, notes };
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(payload, null, 2),
            },
          ],
        };
      }),
    );

    server.registerTool(
      "add_review_note",
      {
        title: "Add review-level note",
        description:
          "Add a patch-level note scoped to a review file or bundle. Use this for relationships between hunks or files.",
        inputSchema: z.object({
          reviewPath: z.string().optional().describe("Review artifact path for a review-level note."),
          bundle: z.string().optional().describe("Bundle name for a bundle-level note."),
          comment: z.string().describe("Note body."),
          author: z.string().optional(),
        }),
      },
      safeTool(async ({ reviewPath, bundle, comment, author }) => {
        if ((reviewPath === undefined) === (bundle === undefined)) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { ok: false, error: "Provide exactly one of reviewPath or bundle." },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        const scope =
          reviewPath === undefined
            ? { type: "bundle" as const, bundle: normalizeBundleName(bundle ?? "") }
            : { type: "review" as const, filePath: this.workspace.resolveFile(reviewPath).relativePath };
        const note = await this.store.addNote({ scope, body: comment, author });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(note, null, 2),
            },
          ],
        };
      }),
    );

    return server;
  }

  private registerResources(server: McpServer): void {
    server.registerResource(
      "prompt-review-index",
      "prompt-reviews://index",
      {
        title: "Prompt review index",
        description: "Lists generated prompt review artifacts and available MCP tools.",
        mimeType: "application/json",
      },
      async (uri) => {
        const reviews = await listReviewFiles(this.workspace.resolveFile("prompt_reviews").absolutePath);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  reviews,
                  tools: [
                    "create_review",
                    "list_reviews",
                    "add_review_comment",
                    "add_review_note",
                    "list_comments",
                    "get_file",
                  ],
                  reviewTemplate: "prompt-reviews://review/{path}",
                  commentsTemplate: "prompt-reviews://comments/{path}",
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.registerResource(
      "prompt-review-comments",
      "prompt-reviews://comments",
      {
        title: "All prompt review comments",
        description: "Lists every anchored prompt review comment currently stored by the app.",
        mimeType: "application/json",
      },
      async (uri) => {
        const comments = await this.store.list();
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify({ comments }, null, 2),
            },
          ],
        };
      },
    );

    server.registerResource(
      "prompt-review-file",
      new ResourceTemplate("prompt-reviews://review/{path}", {
        list: async () => {
          const reviews = await listReviewFiles(this.workspace.resolveFile("prompt_reviews").absolutePath);
          return {
            resources: reviews.map((reviewPath) => ({
              uri: `prompt-reviews://review/${encodePath(reviewPath)}`,
              name: reviewPath,
              title: reviewPath,
              mimeType: "text/markdown",
            })),
          };
        },
      }),
      {
        title: "Generated prompt review",
        description: "Read a generated .prompt-review.md artifact by workspace-relative path.",
        mimeType: "text/markdown",
      },
      async (uri, variables) => {
        const reviewPath = decodeTemplatePath(variables.path);
        const file = await this.workspace.readTextFile(reviewPath);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: file.text,
            },
          ],
        };
      },
    );

    server.registerResource(
      "prompt-review-file-comments",
      new ResourceTemplate("prompt-reviews://comments/{path}", {
        list: async () => {
          const reviews = await listReviewFiles(this.workspace.resolveFile("prompt_reviews").absolutePath);
          return {
            resources: reviews.map((reviewPath) => ({
              uri: `prompt-reviews://comments/${encodePath(reviewPath)}`,
              name: `${reviewPath} comments`,
              title: `${reviewPath} comments`,
              mimeType: "application/json",
            })),
          };
        },
      }),
      {
        title: "Generated prompt review comments",
        description: "Read comments for a generated review artifact by workspace-relative path.",
        mimeType: "application/json",
      },
      async (uri, variables) => {
        const reviewPath = decodeTemplatePath(variables.path);
        const relativePath = this.workspace.resolveFile(reviewPath).relativePath;
        const comments = await this.store.list(relativePath);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify({ comments }, null, 2),
            },
          ],
        };
      },
    );
  }
}

function countComments(comments: ReviewComment[], filePath: string): number {
  return comments.filter((comment) => comment.filePath === filePath).length;
}

function compactComments(comments: ReviewComment[]): Array<{
  filePath: string;
  blockId?: string;
  line: number;
  selectedText: string;
  body: string;
}> {
  return comments.map((comment) => ({
    filePath: comment.filePath,
    ...(comment.blockId === undefined ? {} : { blockId: comment.blockId }),
    line: comment.anchor.startLine,
    selectedText: compactText(comment.anchor.selectedText),
    body: comment.body,
  }));
}

function compactText(value: string): string {
  const normalized = value.replaceAll(/\s+/g, " ").trim();
  return normalized.length <= 160 ? normalized : `${normalized.slice(0, 157)}...`;
}

function encodePath(value: string): string {
  return value.split("/").map(encodeURIComponent).join("/");
}

function decodeTemplatePath(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.join("/");
  }
  if (value === undefined) {
    throw new Error("Missing path variable.");
  }
  return decodeURIComponent(value);
}

function safeTool<Args>(
  handler: (args: Args) => Promise<ToolResult>,
): (args: Args) => Promise<ToolResult> {
  return async (args) => {
    try {
      return await handler(args);
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: false,
                error: errorMessage(error),
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
