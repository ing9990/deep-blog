import { SearchBar } from '../components/SearchBar';

export function LandingPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 p-16">
      <h1 className="text-3xl font-semibold">mini-coupang</h1>
      <p className="text-[hsl(var(--muted-foreground))]">찾고 싶은 상품을 검색해 보세요.</p>
      <div className="w-full"><SearchBar /></div>
    </div>
  );
}
