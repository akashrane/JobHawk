import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addNote, getApplication, getApplications, updateStage } from "@/lib/api";

export function useApplications(stage?: string) {
  return useQuery({
    queryKey: ["applications", stage],
    queryFn: () => getApplications(stage).then((r) => r.applications),
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplication(id),
    enabled: !!id,
  });
}

export function useUpdateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      updateStage(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => addNote(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });
}
