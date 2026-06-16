import { AlertTriangle } from "lucide-react";
import type { RemainingWork } from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";

type RemainingWorkDashboardProps = {
  remainingWork: RemainingWork[];
};

export function RemainingWorkDashboard({ remainingWork }: RemainingWorkDashboardProps) {
  const total = remainingWork.reduce((sum, work) => sum + work.count, 0);

  return (
    <section className="border-t border-slate-200 bg-slate-50 px-4 py-3" aria-label="Remaining work">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Dashboard</h2>
        <span className="text-xs text-slate-500">{total} open</span>
      </div>
      {remainingWork.length === 0 ? (
        <div className="text-sm text-slate-500">No unresolved work for this version.</div>
      ) : (
        <div className="grid max-h-52 gap-2 overflow-y-auto pr-1">
          {remainingWork.map((work) => {
            const blocking =
              work.blockingComments.length > 0 ||
              work.pendingDecisions.length > 0 ||
              work.incompletePlans.length > 0;
            return (
              <article className="rounded-md border border-slate-200 bg-white p-2" key={`${work.kind}-${work.label}`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={cn("size-4 shrink-0", blocking ? "text-amber-600" : "text-slate-400")}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{work.label}</div>
                    <div className="text-xs text-slate-500">
                      {work.count} {work.kind.replace("_", " ")}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
