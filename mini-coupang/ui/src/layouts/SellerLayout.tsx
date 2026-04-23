import { Link, Outlet } from 'react-router';

export function SellerLayout() {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <aside className="border-r bg-[hsl(var(--muted))] p-4">
        <Link to="/seller" className="mb-6 block text-lg font-semibold">mini-coupang · 판매자</Link>
        <nav className="flex flex-col gap-2 text-sm">
          <Link to="/seller/products">내 상품</Link>
          <Link to="/seller/me">내 정보</Link>
        </nav>
      </aside>
      <main className="overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
