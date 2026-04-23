import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface MyProductItem {
  productId: number;
  categoryId: number;
  name: string;
  basePrice: number;
  status: string;
  optionCount: number;
  imageCount: number;
  createdAt: string;
}

interface MyProductsResponse {
  items: MyProductItem[];
  page: number;
  size: number;
  total: number;
}

export function useMyProducts(page = 0, size = 20) {
  return useQuery<MyProductsResponse>({
    queryKey: ['seller', 'products', { page, size }],
    queryFn: () => apiClient.get<MyProductsResponse>('/api/seller/products', { page, size }),
  });
}
