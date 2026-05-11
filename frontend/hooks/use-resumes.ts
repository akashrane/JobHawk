import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteResume, getResumes, setPrimaryResume, uploadResume } from "@/lib/api";

export function useResumes() {
  return useQuery({
    queryKey: ["resumes"],
    queryFn: () => getResumes().then((r) => r.resumes),
  });
}

export function useUploadResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, label }: { file: File; label: string }) =>
      uploadResume(file, label),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resumes"] }),
  });
}

export function useSetPrimary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setPrimaryResume(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resumes"] }),
  });
}

export function useDeleteResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteResume(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resumes"] }),
  });
}
