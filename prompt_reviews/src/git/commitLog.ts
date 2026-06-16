export type GitCommit = {
  sha: string;
  parentSha: string | null;
  subject: string;
  body: string | null;
  authorName: string | null;
  authorEmail: string | null;
  committedAt: number | null;
};

const recordSeparator = "\x1e";
const fieldSeparator = "\x00";

export const gitLogFormat = `%H%x00%P%x00%an%x00%ae%x00%ct%x00%B%x1e`;

export function parseGitCommitLog(output: string): GitCommit[] {
  return output
    .split(recordSeparator)
    .map((record) => record.trim())
    .filter((record) => record.length > 0)
    .map(parseRecord);
}

function parseRecord(record: string): GitCommit {
  const [sha, parents, authorName, authorEmail, committedAtText, message = ""] = record.split(fieldSeparator);
  if (sha === undefined || parents === undefined || committedAtText === undefined) {
    throw new Error("Invalid git log record.");
  }

  const normalizedMessage = message.trim();
  const [subject = "", ...bodyLines] = normalizedMessage.split(/\r?\n/);
  const body = bodyLines.join("\n").trim();

  return {
    sha,
    parentSha: parents.trim().split(/\s+/).filter(Boolean)[0] ?? null,
    subject: subject.trim() || sha,
    body: body.length > 0 ? body : null,
    authorName: emptyToNull(authorName),
    authorEmail: emptyToNull(authorEmail),
    committedAt: parseUnixSeconds(committedAtText),
  };
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function parseUnixSeconds(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
