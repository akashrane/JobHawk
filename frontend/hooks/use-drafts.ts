import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approveDraft, editDraft, generateDraft, getDraft, getDrafts, rejectDraft } from "@/lib/api";

export function useDrafts(status?: string) {
  return useQuery({
    queryKey: ["drafts", status],
    queryFn: () => getDrafts(status).then((r) => r.drafts),
  });
}

export function useDraft(id: string) {
  return useQuery({
    queryKey: ["draft", id],
    queryFn: () => getDraft(id),
    enabled: !!id,
  });
}

export function useGenerateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => generateDraft(jobId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

export function useApproveDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveDraft(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drafts"] });
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useRejectDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: string }) =>
      rejectDraft(id, feedback),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drafts"] }),
  });
}
