import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { resolveAnchor } from "./anchors.js";
import { listReviewFiles } from "./discovery.js";
import { createReviews, parseTargetSpec } from "./reviews.js";
import type { CommentStore } from "./store.js";
import type { Workspace } from "./workspace.js";

type Transport = StreamableHTTPServerTransport;
type ToolResult = {
  isError?: boolean;
  content: Array<{ type: "text"; text: string }>;
};

export class PromptReviewMcp {
  private readonly transports = new Map<string, Transport>();

  constructor(
    private readonly workspace: Workspace,
    private readonly store: CommentStore,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse, body: unknown): Promise<void> {
    const sessionId = getHeader(req, "mcp-session-id");
    let transport: Transport | undefined;

    if (sessionId !== undefined) {
      transport = this.transports.get(sessionId);
    } else if (req.method === "POST" && isInitializeRequest(body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: randomUUID,
        onsessioninitialized: (newSessionId) => {
          if (transport !== undefined) {
            this.transports.set(newSessionId, transport);
          }
        },
      });

      transport.onclose = () => {
        if (transport?.sessionId !== undefined) {
          this.transports.delete(transport.sessionId);
        }
      };

      await this.createServer().connect(transport);
    }

    if (transport === undefined) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: no valid MCP session. Initialize first.",
          },
          id: null,
        }),
      );
      return;
    }

    await transport.handleRequest(req, res, body);
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
      safeTool(async ({ commit, targets, targetSpecs }) => {
        const reviewTargets = targets ?? targetSpecs?.map(parseTargetSpec) ?? [];
        const result = await createReviews({
          workspace: this.workspace,
          artifactRoot: this.workspace.resolveFile("prompt_reviews").absolutePath,
          commit,
          targets: reviewTargets,
        });
        const payload = {
          ...result,
          nextAction: {
            tool: "add_review_comment",
            reviewPath: result.outputs[0]?.reviewPath,
            instructions:
              "Read the generated reviewPath, select exact text from that generated review, then call add_review_comment with selectedText and optional startLine if the text repeats.",
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
      "add_review_comment",
      {
        title: "Add anchored review comment",
        description:
          "Add a comment anchored to selectedText in a generated review file. Provide startLine when the text is not globally unique.",
        inputSchema: z.object({
          reviewPath: z.string().describe("Workspace-relative generated .prompt-review.md path."),
          selectedText: z.string().describe("Exact selected text from the generated review."),
          comment: z.string().describe("Comment body."),
          startLine: z.number().int().positive().optional(),
          author: z.string().optional(),
        }),
      },
      safeTool(async ({ reviewPath, selectedText, comment, startLine, author }) => {
        const file = await this.workspace.readTextFile(reviewPath);
        const anchor = resolveAnchor(file.text, selectedText, startLine);
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
        description: "List anchored comments, optionally scoped to one file.",
        inputSchema: z.object({
          filePath: z.string().optional(),
        }),
      },
      safeTool(async ({ filePath }) => {
        const relativePath =
          filePath === undefined ? undefined : this.workspace.resolveFile(filePath).relativePath;
        const comments = await this.store.list(relativePath);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ comments }, null, 2),
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
                  tools: ["create_review", "add_review_comment", "list_comments", "get_file"],
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

function getHeader(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
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
