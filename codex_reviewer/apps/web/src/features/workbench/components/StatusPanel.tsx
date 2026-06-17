import { Activity, Box, FileCode2 } from "lucide-react";
import type { ReactNode } from "react";
import type { AppMetadataResponse, HealthResponse } from "@/entities/app/types";
import { Panel } from "@/shared/ui/Panel";

type StatusPanelProps = {
  health: HealthResponse | undefined;
  metadata: AppMetadataResponse | undefined;
};

export function StatusPanel({ health, metadata }: StatusPanelProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Metric icon={<Activity className="size-4" />} label="API" value={health?.ok === true ? "healthy" : "pending"} />
      <Metric icon={<Box className="size-4" />} label="Contracts" value={metadata?.contractsPackage ?? "pending"} />
      <Metric icon={<FileCode2 className="size-4" />} label="Status" value={metadata?.status ?? "pending"} />
    </div>
  );
}

type MetricProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function Metric({ icon, label, value }: MetricProps) {
  return (
    <Panel className="p-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-2 truncate text-xl font-semibold text-slate-950">{value}</div>
    </Panel>
  );
}
