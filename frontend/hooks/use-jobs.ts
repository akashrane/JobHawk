import { useQuery } from "@tanstack/react-query";
import { getJob, getJobs } from "@/lib/api";

export function useJobs(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: () => getJobs(params),
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => getJob(id),
    enabled: !!id,
  });
}
