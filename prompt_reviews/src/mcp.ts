import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { resolveAnchor } from "./anchors.js";
import { createReviews, parseTargetSpec } from "./reviews.js";
import type { CommentStore } from "./store.js";
import type { Workspace } from "./workspace.js";

type Transport = StreamableHTTPServerTransport;

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

    server.registerTool(
      "get_file",
      {
        title: "Get file text",
        description: "Read a text file from the workspace so an agent can choose an exact selection.",
        inputSchema: z.object({
          filePath: z.string().describe("Workspace-relative path to read."),
        }),
      },
      async ({ filePath }) => {
        const file = await this.workspace.readTextFile(filePath);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(file, null, 2),
            },
          ],
        };
      },
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
      async ({ commit, targets, targetSpecs }) => {
        const reviewTargets = targets ?? targetSpecs?.map(parseTargetSpec) ?? [];
        const result = await createReviews({
          workspace: this.workspace,
          artifactRoot: this.workspace.resolveFile("prompt_reviews").absolutePath,
          commit,
          targets: reviewTargets,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      },
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
      async ({ reviewPath, selectedText, comment, startLine, author }) => {
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
      },
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
      async ({ filePath }) => {
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
      },
    );

    return server;
  }
}

function getHeader(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
