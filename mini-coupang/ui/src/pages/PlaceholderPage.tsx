import { Button } from '@/components/ui/button';

interface Props {
  title: string;
}

export function PlaceholderPage({ title }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Button variant="outline">버튼 샘플</Button>
    </div>
  );
}
