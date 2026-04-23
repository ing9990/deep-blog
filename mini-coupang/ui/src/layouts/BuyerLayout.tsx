import { Link, Outlet } from 'react-router';

export function BuyerLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-6 border-b px-6 py-4">
        <Link to="/" className="text-lg font-semibold">mini-coupang</Link>
        <nav className="ml-auto flex gap-4 text-sm">
          <Link to="/search">검색</Link>
          <Link to="/me">내 정보</Link>
          <Link to="/login">로그인</Link>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
