import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';
import { ProductCard } from '../components/ProductCard';
import { useSearchProducts } from '../api/use-search-products';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const [filters, setFilters] = useState<{ categoryId?: number; minPrice?: number; maxPrice?: number }>({});
  const { data, isLoading, error } = useSearchProducts({ q, ...filters });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4"><SearchBar initial={q} /></div>
      <FilterBar
        categoryId={filters.categoryId}
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        onChange={(p) => setFilters((s) => ({ ...s, ...p }))}
      />
      {q.trim().length === 0 && (
        <p className="py-8 text-center text-[hsl(var(--muted-foreground))]">검색어를 입력해 주세요.</p>
      )}
      {isLoading && q.trim().length > 0 && (
        <p className="py-8 text-center">검색 중...</p>
      )}
      {error && (
        <p className="py-8 text-center text-red-600">검색 실패</p>
      )}
      {data && data.items.length === 0 && q.trim().length > 0 && (
        <p className="py-8 text-center text-[hsl(var(--muted-foreground))]">검색 결과 없음.</p>
      )}
      {data && data.items.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p) => (
            <ProductCard
              key={p.productId}
              productId={p.productId}
              name={p.name}
              description={p.description}
              basePrice={p.basePrice}
              score={p.score}
            />
          ))}
        </div>
      )}
    </div>
  );
}
