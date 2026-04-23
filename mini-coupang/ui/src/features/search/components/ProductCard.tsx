interface Props {
  productId: number;
  name: string;
  description: string;
  basePrice: number;
}

export function ProductCard({ name, description, basePrice }: Props) {
  return (
    <article className="rounded-lg border p-4">
      <h3 className="font-medium">{name}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
      <p className="mt-3 text-lg font-semibold">{basePrice.toLocaleString('ko-KR')}원</p>
    </article>
  );
}
