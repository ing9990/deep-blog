import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
}

interface CategoriesResponse {
  items: Category[];
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await apiClient.get<CategoriesResponse>('/api/categories')).items,
    staleTime: 60 * 60_000,
  });
}
