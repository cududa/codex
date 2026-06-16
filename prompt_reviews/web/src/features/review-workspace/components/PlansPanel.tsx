import { ListChecks, Plus, ShieldAlert } from "lucide-react";
import { useState } from "react";
import type { CommitDetail, CommitFileDetail, DecisionScope, PlanDetail, PlanItemDetail, RemainingWork } from "@/entities/review/types";
import { Button } from "@/shared/ui/Button";
import { TextArea } from "@/shared/ui/TextArea";

type PlansPanelProps = {
  commit: CommitDetail | undefined;
  file: CommitFileDetail | undefined;
  scope: DecisionScope | null;
  remainingWork: RemainingWork[];
  isSubmitting: boolean;
  error?: string;
  onCreatePlan: (input: {
    scope: DecisionScope;
    title: string;
    summary?: string;
    decisionIds?: string[];
    diffBlockIds?: string[];
  }) => Promise<PlanDetail>;
  onUpdatePlan: (input: { planId: string; status: PlanDetail["status"]; title?: string; summary?: string }) => Promise<PlanDetail>;
  onCreateItem: (input: { planId: string; title: string; description?: string; commitFileId?: string }) => Promise<PlanItemDetail>;
  onUpdateItem: (input: { planItemId: string; status: PlanItemDetail["status"]; title?: string }) => Promise<PlanItemDetail>;
  onCompletePlan: (input: { planId: string; completionNote?: string }) => Promise<PlanDetail>;
};

export function PlansPanel({
  commit,
  file,
  scope,
  remainingWork,
  isSubmitting,
  error,
  onCreatePlan,
  onUpdatePlan,
  onCreateItem,
  onUpdateItem,
  onCompletePlan,
}: PlansPanelProps) {
  const plans = file?.review.plans ?? commit?.plans ?? [];
  const blockers = remainingWork.flatMap((work) => work.incompletePlans).filter((plan) => plan.status === "accepted");
  const [activePlan, setActivePlan] = useState<PlanDetail | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");

  return (
    <section className="grid gap-3 p-4">
      <div className="flex items-center gap-2">
        <ListChecks className="size-4 text-slate-500" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-950">Plans</h2>
      </div>
      {blockers.length === 0 ? null : (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <ShieldAlert className="size-4" aria-hidden="true" />
            Incomplete accepted plans block completion
          </div>
          {blockers.map((plan) => (
            <div className="truncate text-xs" key={plan.id}>
              {plan.title}
            </div>
          ))}
        </div>
      )}
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (scope === null || title.trim().length === 0) {
            return;
          }
          void onCreatePlan({
            scope,
            title: title.trim(),
            summary: optionalText(summary),
          }).then((plan) => {
            setActivePlan(plan);
            setTitle("");
            setSummary("");
          });
        }}
      >
        <input
          className="h-9 rounded-md border border-slate-300 px-2 text-sm"
          disabled={scope === null}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Plan title"
          value={title}
        />
        <TextArea
          className="min-h-16"
          disabled={scope === null}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Plan summary"
          value={summary}
        />
        <Button disabled={scope === null || title.trim().length === 0 || isSubmitting} type="submit">
          <Plus className="size-4" aria-hidden="true" />
          Create plan
        </Button>
      </form>
      {error === undefined ? null : <div className="text-sm text-red-700">{error}</div>}
      <div className="grid gap-2">
        {plans.map((plan) => (
          <article className="rounded-md border border-slate-200 p-3" key={plan.id}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-950">{plan.title}</div>
                <div className="text-xs text-slate-500">{plan.status.replaceAll("_", " ")}</div>
              </div>
              <Button
                className="h-8"
                onClick={() =>
                  onUpdatePlan({ planId: plan.id, title: plan.title, summary: plan.summary, status: "accepted" }).then(
                    setActivePlan,
                  )
                }
                type="button"
                variant="secondary"
              >
                Accept plan
              </Button>
            </div>
          </article>
        ))}
      </div>
      {activePlan === null ? null : (
        <article className="grid gap-2 rounded-md border border-slate-300 bg-slate-50 p-3">
          <div>
            <div className="text-sm font-semibold text-slate-950">{activePlan.title}</div>
            <div className="text-xs text-slate-500">Confirmed plan detail: {activePlan.status}</div>
          </div>
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (itemTitle.trim().length === 0) {
                return;
              }
              void onCreateItem({
                planId: activePlan.id,
                title: itemTitle.trim(),
                description: optionalText(itemDescription),
                commitFileId: file?.id,
              }).then((item) => {
                setActivePlan({ ...activePlan, items: [...activePlan.items, item] });
                setItemTitle("");
                setItemDescription("");
              });
            }}
          >
            <input
              className="h-9 rounded-md border border-slate-300 px-2 text-sm"
              onChange={(event) => setItemTitle(event.target.value)}
              placeholder="Plan item"
              value={itemTitle}
            />
            <input
              className="h-9 rounded-md border border-slate-300 px-2 text-sm"
              onChange={(event) => setItemDescription(event.target.value)}
              placeholder="Item details"
              value={itemDescription}
            />
            <Button disabled={itemTitle.trim().length === 0 || isSubmitting} type="submit" variant="secondary">
              Add item
            </Button>
          </form>
          {activePlan.items.map((item) => (
            <div className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-white p-2" key={item.id}>
              <div className="min-w-0">
                <div className="truncate text-sm text-slate-950">{item.title}</div>
                <div className="text-xs text-slate-500">{item.status}</div>
              </div>
              <Button
                className="h-8"
                disabled={item.status === "complete"}
                onClick={() =>
                  onUpdateItem({ planItemId: item.id, title: item.title, status: "complete" }).then((updated) => {
                    setActivePlan({
                      ...activePlan,
                      items: activePlan.items.map((existing) => (existing.id === updated.id ? updated : existing)),
                    });
                  })
                }
                type="button"
                variant="secondary"
              >
                Complete item
              </Button>
            </div>
          ))}
          <Button
            disabled={activePlan.items.some((item) => item.status !== "complete") || isSubmitting}
            onClick={() => onCompletePlan({ planId: activePlan.id, completionNote: "Completed by human reviewer." }).then(setActivePlan)}
            type="button"
          >
            Complete plan
          </Button>
        </article>
      )}
    </section>
  );
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}
