import { Navigate, Outlet } from 'react-router';
import { useMe } from '@/features/me/api/use-me';

export function RequireSeller() {
  const { data: me, isLoading } = useMe();
  if (isLoading) return <div className="p-6">로딩 중...</div>;
  if (!me?.seller) return <Navigate to="/seller/login" replace />;
  return <Outlet />;
}
