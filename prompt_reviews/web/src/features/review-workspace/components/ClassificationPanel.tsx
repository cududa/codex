import { Tags } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CommitDetail, CommitFileDetail, ConcernTagView } from "@/entities/review/types";
import { Button } from "@/shared/ui/Button";

type ClassificationPanelProps = {
  tags: ConcernTagView[];
  commit: CommitDetail | undefined;
  file: CommitFileDetail | undefined;
  isSubmitting: boolean;
  error?: string;
  onClassifyCommit: (input: ClassificationInput) => Promise<unknown>;
  onClassifyFile: (input: ClassificationInput) => Promise<unknown>;
};

type ClassificationInput = {
  primaryTagSlug: string;
  secondaryTagSlugs?: string[];
};

export function ClassificationPanel({
  tags,
  commit,
  file,
  isSubmitting,
  error,
  onClassifyCommit,
  onClassifyFile,
}: ClassificationPanelProps) {
  const target = file ?? commit;
  const taggings = file?.review.taggings ?? commit?.taggings ?? [];
  const currentPrimary = taggings.find((tagging) => tagging.kind === "primary")?.tag.slug ?? "";
  const currentSecondarySlugs = useMemo(
    () => taggings.filter((tagging) => tagging.kind === "secondary").map((tagging) => tagging.tag.slug).sort(),
    [taggings],
  );
  const currentSecondaryKey = currentSecondarySlugs.join("\0");

  const [primaryTagSlug, setPrimaryTagSlug] = useState("");
  const [secondaryTagSlugs, setSecondaryTagSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPrimaryTagSlug(currentPrimary);
    setSecondaryTagSlugs(new Set(currentSecondarySlugs));
  }, [currentPrimary, currentSecondaryKey]);

  const canSubmit = target !== undefined && primaryTagSlug.length > 0 && !isSubmitting;

  return (
    <section className="grid gap-3 border-b border-slate-200 p-4">
      <div className="flex items-center gap-2">
        <Tags className="size-4 text-slate-500" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-950">Classification</h2>
      </div>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) {
            return;
          }
          const input: ClassificationInput = {
            primaryTagSlug,
            secondaryTagSlugs: [...secondaryTagSlugs].filter((slug) => slug !== primaryTagSlug),
          };
          void (file === undefined ? onClassifyCommit(input) : onClassifyFile(input));
        }}
      >
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Primary tag
          <select
            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-950"
            disabled={target === undefined}
            onChange={(event) => setPrimaryTagSlug(event.target.value)}
            value={primaryTagSlug}
          >
            <option value="">Select tag</option>
            {tags.map((tag) => (
              <option key={tag.slug} value={tag.slug}>
                {tag.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid max-h-32 gap-1 overflow-y-auto rounded-md border border-slate-200 p-2">
          {tags.map((tag) => (
            <label className="flex items-start gap-2 text-xs text-slate-700" key={tag.slug}>
              <input
                checked={secondaryTagSlugs.has(tag.slug)}
                className="mt-0.5"
                disabled={target === undefined || tag.slug === primaryTagSlug}
                onChange={(event) => {
                  const next = new Set(secondaryTagSlugs);
                  if (event.target.checked) {
                    next.add(tag.slug);
                  } else {
                    next.delete(tag.slug);
                  }
                  setSecondaryTagSlugs(next);
                }}
                type="checkbox"
              />
              <span>{tag.label}</span>
            </label>
          ))}
        </div>
        {error === undefined ? null : <div className="text-sm text-red-700">{error}</div>}
        <Button disabled={!canSubmit} type="submit">
          Save tags
        </Button>
      </form>
    </section>
  );
}
