import type { MyProductItem } from '../api/use-my-products';

export function ProductList({ items }: { items: MyProductItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-[hsl(var(--muted-foreground))]">
        등록된 상품이 없습니다. 첫 상품을 등록해 보세요.
      </p>
    );
  }
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="py-2">상품명</th>
          <th>가격</th>
          <th>상태</th>
          <th>옵션</th>
          <th>이미지</th>
          <th>등록일</th>
        </tr>
      </thead>
      <tbody>
        {items.map((p) => (
          <tr key={p.productId} className="border-b">
            <td className="py-2">{p.name}</td>
            <td>{p.basePrice.toLocaleString('ko-KR')}원</td>
            <td>{p.status}</td>
            <td>{p.optionCount}</td>
            <td>{p.imageCount}</td>
            <td>{new Date(p.createdAt).toLocaleDateString('ko-KR')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
