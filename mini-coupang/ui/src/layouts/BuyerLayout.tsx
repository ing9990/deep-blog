import { Link, Outlet } from 'react-router';
import { useMe } from '@/features/me/api/use-me';
import { useLogout } from '@/features/auth/api/use-logout';

export function BuyerLayout() {
  const { data: me } = useMe();
  const logout = useLogout();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-6 border-b px-6 py-4">
        <Link to="/" className="text-lg font-semibold">mini-coupang</Link>
        <nav className="ml-auto flex gap-4 text-sm">
          <Link to="/search">검색</Link>
          {me?.member ? (
            <>
              <Link to="/me">내 정보</Link>
              <button type="button" onClick={() => logout.mutate()} className="text-sm">
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/login">로그인</Link>
          )}
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
