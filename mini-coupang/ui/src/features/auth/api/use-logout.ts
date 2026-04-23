import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { apiClient } from '@/lib/api-client';

interface LogoutVars {
  toSellerPortal?: boolean;
}

export function useLogout() {
  const qc = useQueryClient();
  const nav = useNavigate();
  return useMutation<void, Error, LogoutVars | void>({
    mutationFn: () => apiClient.post<void>('/auth/logout'),
    onSuccess: (_data, variables) => {
      qc.setQueryData(['me'], null);
      qc.invalidateQueries();
      const vars = variables ?? {};
      nav(vars.toSellerPortal ? '/seller/login' : '/login');
    },
  });
}
