import { Activity, Box, FileCode2 } from "lucide-react";
import type { ReactNode } from "react";
import type { AppMetadataResponse, HealthResponse } from "@/entities/app/types";

type StatusPanelProps = {
  health: HealthResponse | undefined;
  metadata: AppMetadataResponse | undefined;
};

export function StatusPanel({ health, metadata }: StatusPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <Metric icon={<Activity className="size-4" />} label="API" value={health?.ok === true ? "healthy" : "pending"} />
      <Metric icon={<Box className="size-4" />} label="Contracts" value={metadata?.contractsPackage ?? "pending"} />
      <Metric icon={<FileCode2 className="size-4" />} label="State" value={metadata?.status ?? "pending"} />
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
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <span className="shrink-0 text-slate-500">{icon}</span>
      <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
      <span className="min-w-0 truncate font-medium text-slate-950">{value}</span>
    </div>
  );
}
