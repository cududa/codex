import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import type {
  ClassificationService,
  CommentService,
  DecisionService,
  PlanService,
  ReviewQueueService,
  ReviewReadService,
  VersionService,
} from "../services/index.js";
import { errorToolResult } from "./format.js";
import { registerPromptReviewResources } from "./resources.js";
import { classifyCommitTool } from "./tools/classifyCommit.js";
import { classifyFileTool } from "./tools/classifyFile.js";
import { commentsTools } from "./tools/comments.js";
import { listConcernTagsTool } from "./tools/concernTags.js";
import { decisionsTools } from "./tools/decisions.js";
import { getFileReviewTool } from "./tools/getFileReview.js";
import { listCommitFilesTool } from "./tools/listCommitFiles.js";
import { listRemainingCommitsTool } from "./tools/listRemainingCommits.js";
import { listVersionsTool } from "./tools/listVersions.js";
import { plansTools } from "./tools/plans.js";
import { populateNextVersionTool } from "./tools/populateNextVersion.js";

export type PromptReviewMcpContext = {
  versions: VersionService;
  classification: ClassificationService;
  queue: ReviewQueueService;
  comments: CommentService;
  decisions: DecisionService;
  plans: PlanService;
  read: ReviewReadService;
};

export type PromptReviewMcpTool<Input, Output> = {
  name: string;
  title: string;
  description: string;
  inputSchema: z.ZodType<Input>;
  outputSchema: z.ZodType<Output>;
  handler: (context: PromptReviewMcpContext, input: Input) => Output | Promise<Output>;
};

export type AnyPromptReviewMcpTool = PromptReviewMcpTool<any, any>;

export const promptReviewMcpTools: AnyPromptReviewMcpTool[] = [
  populateNextVersionTool,
  listVersionsTool,
  listRemainingCommitsTool,
  listCommitFilesTool,
  getFileReviewTool,
  classifyCommitTool,
  classifyFileTool,
  listConcernTagsTool,
  ...commentsTools,
  ...decisionsTools,
  ...plansTools,
];

export class PromptReviewMcp {
  constructor(private readonly context: PromptReviewMcpContext) {}

  async handle(req: IncomingMessage, res: ServerResponse, body: unknown): Promise<void> {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await createPromptReviewMcpServer(this.context).connect(transport);
    await transport.handleRequest(req, res, body);
    await transport.close();
  }
}

export function createPromptReviewMcpServer(context: PromptReviewMcpContext): McpServer {
  const server = new McpServer({
    name: "prompt-reviews",
    version: "0.2.0",
  });

  for (const tool of promptReviewMcpTools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
      },
      async (input: unknown) => executePromptReviewMcpTool(context, tool, input),
    );
  }

  registerPromptReviewResources(server, context);
  return server;
}

export async function executePromptReviewMcpTool(
  context: PromptReviewMcpContext,
  tool: AnyPromptReviewMcpTool,
  input: unknown,
): Promise<CallToolResult> {
  try {
    const parsedInput = tool.inputSchema.parse(input);
    const payload = await tool.handler(context, parsedInput);
    const parsedOutput = tool.outputSchema.parse(payload);
    return {
      structuredContent: parsedOutput as Record<string, unknown>,
      content: [{ type: "text", text: JSON.stringify(parsedOutput, null, 2) }],
    };
  } catch (error) {
    return errorToolResult(error);
  }
}
