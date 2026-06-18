import { useQuery } from "@tanstack/react-query";
import { getAppMetadata, getHealth } from "@/entities/app/api";
import { getReviewBootstrap, getReviewVersions } from "@/entities/review/api";

export function useWorkbenchData() {
  const health = useQuery({
    queryKey: ["app", "health"],
    queryFn: getHealth,
  });
  const metadata = useQuery({
    queryKey: ["app", "metadata"],
    queryFn: getAppMetadata,
  });
  const reviewBootstrap = useQuery({
    queryKey: ["review", "bootstrap"],
    queryFn: getReviewBootstrap,
  });
  const reviewVersions = useQuery({
    queryKey: ["review", "versions"],
    queryFn: getReviewVersions,
  });

  return { health, metadata, reviewBootstrap, reviewVersions };
}
