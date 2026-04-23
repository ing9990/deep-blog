import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { RegisterProductForm } from '../schema';

interface RegisterProductResponse {
  productId: number;
  sellerId: number;
  categoryId: number;
  name: string;
  basePrice: number;
  status: string;
  optionCount: number;
  imageCount: number;
}

export function useRegisterProduct() {
  const qc = useQueryClient();
  return useMutation<RegisterProductResponse, Error, RegisterProductForm>({
    mutationFn: (body) => apiClient.post<RegisterProductResponse>('/api/seller/products', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller', 'products'] }),
  });
}
