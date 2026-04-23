import { useCategories } from '../api/use-categories';

interface Props {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  onChange: (patch: { categoryId?: number; minPrice?: number; maxPrice?: number }) => void;
}

export function FilterBar({ categoryId, minPrice, maxPrice, onChange }: Props) {
  const { data: cats = [] } = useCategories();
  return (
    <div className="flex flex-wrap gap-2 border-b py-3">
      <select
        className="rounded border px-2 py-1 text-sm"
        value={categoryId ?? ''}
        onChange={(e) => onChange({ categoryId: e.target.value ? Number(e.target.value) : undefined })}
      >
        <option value="">전체 카테고리</option>
        {cats.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input
        type="number"
        placeholder="최저가"
        className="w-24 rounded border px-2 py-1 text-sm"
        value={minPrice ?? ''}
        onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
      />
      <input
        type="number"
        placeholder="최고가"
        className="w-24 rounded border px-2 py-1 text-sm"
        value={maxPrice ?? ''}
        onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
      />
    </div>
  );
}
