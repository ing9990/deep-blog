import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SearchFilters {
  q: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchResult {
  size: number;
  items: Array<{
    productId: number;
    sellerId: number;
    categoryId: number;
    name: string;
    description: string;
    basePrice: number;
    status: string;
    score: number;
  }>;
}

export function useSearchProducts(filters: SearchFilters) {
  return useQuery<SearchResult>({
    queryKey: ['products', 'search', filters],
    queryFn: () =>
      apiClient.get<SearchResult>('/api/products/search', {
        q: filters.q,
        category_id: filters.categoryId,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        limit: 20,
      }),
    enabled: filters.q.trim().length > 0,
  });
}
