import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("border border-slate-200 bg-white shadow-sm", className)}
      {...props}
    />
  );
}
