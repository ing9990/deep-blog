import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Body { email: string; password: string; }
interface Response { accountId: number; sellerId: number; }

export function useSellerLogin() {
  const qc = useQueryClient();
  return useMutation<Response, Error, Body>({
    mutationFn: (b) => apiClient.post<Response>('/auth/login/seller', b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}
