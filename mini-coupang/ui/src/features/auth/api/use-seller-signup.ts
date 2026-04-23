import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Body {
  email: string;
  password: string;
  businessName: string;
  businessRegistrationNumber: string;
  representativeName: string;
  phoneNumber: string;
}
interface Response { accountId: number; sellerId: number; email: string; }

export function useSellerSignup() {
  const qc = useQueryClient();
  return useMutation<Response, Error, Body>({
    mutationFn: (b) => apiClient.post<Response>('/auth/signup/seller', b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}
