import { useQuery } from "@tanstack/react-query";
import { getAppMetadata, getHealth } from "@/entities/app/api";

export function useWorkbenchData() {
  const health = useQuery({
    queryKey: ["app", "health"],
    queryFn: getHealth,
  });
  const metadata = useQuery({
    queryKey: ["app", "metadata"],
    queryFn: getAppMetadata,
  });

  return { health, metadata };
}
