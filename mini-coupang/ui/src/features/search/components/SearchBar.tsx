import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export function SearchBar({ initial = '' }: { initial?: string }) {
  const nav = useNavigate();
  const [q, setQ] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className="flex gap-2"
    >
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="상품 검색" />
      <Button type="submit" size="icon" aria-label="검색"><Search className="h-4 w-4" /></Button>
    </form>
  );
}
