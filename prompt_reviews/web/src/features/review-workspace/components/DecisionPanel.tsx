import { CheckCircle2, Gavel, UserCheck } from "lucide-react";
import { useState } from "react";
import type { CommitDetail, CommitFileDetail, DecisionScope } from "@/entities/review/types";
import { Button } from "@/shared/ui/Button";

type DecisionPanelProps = {
  commit: CommitDetail | undefined;
  file: CommitFileDetail | undefined;
  scope: DecisionScope | null;
  isSubmitting: boolean;
  error?: string;
  onPropose: (input: {
    scope: DecisionScope;
    outcome:
      | "accept"
      | "accept_with_watch"
      | "patch_required"
      | "reject_for_local_build"
      | "needs_tests"
      | "needs_policy_decision"
      | "blocked_on_context";
  }) => Promise<unknown>;
  onFinalize: (input: {
    decisionId: string;
    status: "accepted" | "rejected" | "superseded";
  }) => Promise<unknown>;
};

export function DecisionPanel({
  commit,
  file,
  scope,
  isSubmitting,
  error,
  onPropose,
  onFinalize,
}: DecisionPanelProps) {
  const decisions = file?.review.decisions ?? commit?.decisions ?? [];
  const proposed = decisions.filter((decision) => decision.status === "proposed");
  const finalized = decisions.filter((decision) => decision.status !== "proposed");
  const [outcome, setOutcome] = useState("accept");

  return (
    <section className="grid gap-3 border-b border-slate-200 p-4">
      <div className="flex items-center gap-2">
        <Gavel className="size-4 text-slate-500" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-950">Decisions</h2>
      </div>
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (scope === null) {
            return;
          }
          void onPropose({
            scope,
            outcome: outcome as Parameters<DecisionPanelProps["onPropose"]>[0]["outcome"],
          });
        }}
      >
        <select
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
          disabled={scope === null}
          onChange={(event) => setOutcome(event.target.value)}
          value={outcome}
          aria-label="Decision outcome"
        >
          <option value="accept">Accept</option>
          <option value="accept_with_watch">Accept with watch</option>
          <option value="patch_required">Patch required</option>
          <option value="reject_for_local_build">Reject for local build</option>
          <option value="needs_tests">Needs tests</option>
          <option value="needs_policy_decision">Needs policy decision</option>
          <option value="blocked_on_context">Blocked on context</option>
        </select>
        <Button disabled={scope === null || isSubmitting} type="submit">
          Propose decision
        </Button>
      </form>
      {error === undefined ? null : <div className="text-sm text-red-700">{error}</div>}
      <DecisionList
        decisions={proposed}
        emptyLabel="No proposed decisions."
        onFinalize={(decisionId, status) => onFinalize({ decisionId, status })}
      />
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Finalized
        </div>
        <DecisionList decisions={finalized} emptyLabel="No finalized human decisions." />
      </div>
    </section>
  );
}

function DecisionList({
  decisions,
  emptyLabel,
  onFinalize,
}: {
  decisions: Array<CommitDetail["decisions"][number]>;
  emptyLabel: string;
  onFinalize?: (decisionId: string, status: "accepted" | "rejected" | "superseded") => Promise<unknown>;
}) {
  if (decisions.length === 0) {
    return <div className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500">{emptyLabel}</div>;
  }
  return (
    <div className="grid gap-2">
      {decisions.map((decision) => (
        <article className="rounded-md border border-slate-200 p-3" key={decision.id}>
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded bg-slate-100 px-1.5 py-0.5">{decision.status}</span>
            <span>{decision.outcome.replaceAll("_", " ")}</span>
            <span className="inline-flex items-center gap-1">
              <UserCheck className="size-3" aria-hidden="true" />
              {actorLabel(decision.proposedBy)}
            </span>
          </div>
          {decision.finalizedBy === undefined ? null : (
            <div className="mb-2 text-xs font-medium text-slate-600">
              Human finalizer: {actorLabel(decision.finalizedBy)}
            </div>
          )}
          {onFinalize === undefined ? null : (
            <div className="flex flex-wrap gap-2">
              <Button className="h-8" onClick={() => onFinalize(decision.id, "accepted")} type="button" variant="secondary">
                Accept
              </Button>
              <Button className="h-8" onClick={() => onFinalize(decision.id, "rejected")} type="button" variant="secondary">
                Reject
              </Button>
              <Button
                className="h-8"
                onClick={() => onFinalize(decision.id, "superseded")}
                type="button"
                variant="secondary"
              >
                Supersede
              </Button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function actorLabel(actor: CommitDetail["decisions"][number]["proposedBy"]): string {
  return `${actor.type}: ${actor.displayName ?? actor.id ?? "unknown"}`;
}
