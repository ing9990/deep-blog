import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface LoginBody { email: string; password: string; }
interface LoginResponse { accountId: number; memberId: number; }

export function useLogin() {
  const qc = useQueryClient();
  return useMutation<LoginResponse, Error, LoginBody>({
    mutationFn: (body) => apiClient.post<LoginResponse>('/auth/login', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}
