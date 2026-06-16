import "./styles.css";

type ReviewComment = {
  id: string;
  filePath: string;
  body: string;
  author: string;
  createdAt: string;
  anchor: {
    selectedText: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
};

const filePathInput = mustGet<HTMLInputElement>("filePath");
const loadFileButton = mustGet<HTMLButtonElement>("loadFile");
const fileTextArea = mustGet<HTMLTextAreaElement>("fileText");
const commentBody = mustGet<HTMLTextAreaElement>("commentBody");
const addCommentButton = mustGet<HTMLButtonElement>("addComment");
const statusBox = mustGet<HTMLDivElement>("status");
const commentsBox = mustGet<HTMLDivElement>("comments");

loadFileButton.addEventListener("click", () => {
  void loadFile();
});

addCommentButton.addEventListener("click", () => {
  void addComment();
});

async function loadFile(): Promise<void> {
  const filePath = filePathInput.value.trim();
  if (filePath.length === 0) {
    setStatus("Choose a file path first.", true);
    return;
  }

  const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
  if (!response.ok) {
    setStatus(await response.text(), true);
    return;
  }

  const file = (await response.json()) as { relativePath: string; text: string };
  filePathInput.value = file.relativePath;
  fileTextArea.value = file.text;
  setStatus(`Loaded ${file.relativePath}.`);
  await loadComments();
}

async function addComment(): Promise<void> {
  const selectedText = fileTextArea.value.slice(
    fileTextArea.selectionStart,
    fileTextArea.selectionEnd,
  );
  const body = commentBody.value.trim();

  if (selectedText.length === 0) {
    setStatus("Select text before adding a comment.", true);
    return;
  }

  if (body.length === 0) {
    setStatus("Write a comment first.", true);
    return;
  }

  const response = await fetch("/api/comments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      filePath: filePathInput.value.trim(),
      selectedText,
      comment: body,
      startLine: lineAt(fileTextArea.value, fileTextArea.selectionStart),
      author: "user",
    }),
  });

  if (!response.ok) {
    setStatus(await response.text(), true);
    return;
  }

  commentBody.value = "";
  setStatus("Comment added.");
  await loadComments();
}

async function loadComments(): Promise<void> {
  const filePath = filePathInput.value.trim();
  const response = await fetch(`/api/comments?filePath=${encodeURIComponent(filePath)}`);
  if (!response.ok) {
    setStatus(await response.text(), true);
    return;
  }

  const payload = (await response.json()) as { comments: ReviewComment[] };
  commentsBox.replaceChildren(
    ...payload.comments.map((comment) => renderComment(comment)),
  );
}

function renderComment(comment: ReviewComment): HTMLElement {
  const article = document.createElement("article");
  const meta = document.createElement("div");
  const body = document.createElement("p");
  const quote = document.createElement("pre");

  meta.className = "commentMeta";
  meta.textContent = `${comment.author} at ${comment.anchor.startLine}:${comment.anchor.startColumn}`;
  body.textContent = comment.body;
  quote.textContent = comment.anchor.selectedText;
  article.append(meta, body, quote);
  return article;
}

function lineAt(text: string, index: number): number {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (text[cursor] === "\n") {
      line += 1;
    }
  }
  return line;
}

function setStatus(message: string, isError = false): void {
  statusBox.textContent = message;
  statusBox.className = isError ? "error" : "";
}

function mustGet<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing #${id}`);
  }
  return element as T;
}
