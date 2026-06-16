export type ReviewSummary = {
  reviewPath: string;
  commit: string;
  bundle?: string;
  bytes: number;
  persisted: boolean;
  commentCount: number;
  noteCount: number;
};

export type ReviewFile = {
  relativePath: string;
  text: string;
};

export type ReviewComment = {
  id: string;
  filePath: string;
  body: string;
  author: string;
  createdAt: string;
  blockId?: string;
  anchor: TextAnchor;
};

export type ReviewNote =
  | {
      id: string;
      scope: { type: "review"; filePath: string };
      body: string;
      author: string;
      createdAt: string;
    }
  | {
      id: string;
      scope: { type: "bundle"; bundle: string };
      body: string;
      author: string;
      createdAt: string;
    };

export type TextAnchor = {
  selectedText: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
};

export type TextSelection = {
  text: string;
  startLine: number;
};
