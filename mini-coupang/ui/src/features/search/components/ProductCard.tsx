interface Props {
  productId: number;
  name: string;
  description: string;
  basePrice: number;
  score: number;
}

export function ProductCard({ name, description, basePrice, score }: Props) {
  return (
    <article className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{name}</h3>
        <span
          className="shrink-0 rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono text-xs text-[hsl(var(--muted-foreground))]"
          title="RRF score"
        >
          {score.toFixed(4)}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
      <p className="mt-3 text-lg font-semibold">{basePrice.toLocaleString('ko-KR')}원</p>
    </article>
  );
}
