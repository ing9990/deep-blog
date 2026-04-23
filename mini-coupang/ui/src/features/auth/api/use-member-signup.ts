import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface SignupBody {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  nickname?: string;
}
interface SignupResponse { accountId: number; memberId: number; email: string; }

export function useMemberSignup() {
  const qc = useQueryClient();
  return useMutation<SignupResponse, Error, SignupBody>({
    mutationFn: (body) => apiClient.post<SignupResponse>('/auth/signup/member', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}
