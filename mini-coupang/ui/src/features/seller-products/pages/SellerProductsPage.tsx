import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMyProducts } from '../api/use-my-products';
import { ProductList } from '../components/ProductList';

export function SellerProductsPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useMyProducts(page, 20);

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">내 상품</h1>
        <Button disabled>상품 등록</Button>
      </header>
      {isLoading && <p>로딩 중...</p>}
      {data && <ProductList items={data.items} />}
      {data && data.total > data.size && (
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            이전
          </Button>
          <span className="self-center text-sm">
            {page + 1} / {Math.ceil(data.total / data.size)}
          </span>
          <Button
            variant="outline"
            disabled={(page + 1) * data.size >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
