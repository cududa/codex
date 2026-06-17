import { RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Panel } from "@/shared/ui/Panel";
import { StatusPanel } from "./components/StatusPanel";
import { useWorkbenchData } from "./hooks/appData";

export function WorkbenchPage() {
  const { health, metadata } = useWorkbenchData();
  const error = health.error?.message ?? metadata.error?.message;

  return (
    <main className="grid min-h-screen grid-rows-[auto_minmax(0,1fr)] bg-slate-100 text-slate-950">
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div>
          <h1 className="text-base font-semibold text-slate-950">Codex Reviewer</h1>
          <p className="text-xs text-slate-500">Contracts-first workspace foundation</p>
        </div>
        <Button
          onClick={() => {
            void health.refetch();
            void metadata.refetch();
          }}
          type="button"
          variant="secondary"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </header>
      <section className="min-h-0 overflow-auto p-4">
        {error === undefined ? null : (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <div className="mx-auto max-w-5xl space-y-4">
          <StatusPanel health={health.data} metadata={metadata.data} />
          <Panel className="p-4">
            <h2 className="text-sm font-semibold text-slate-950">{metadata.data?.appName ?? "Codex Reviewer"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {metadata.data?.summary ?? "Waiting for the Hono API and shared contracts to respond."}
            </p>
          </Panel>
        </div>
      </section>
    </main>
  );
}
