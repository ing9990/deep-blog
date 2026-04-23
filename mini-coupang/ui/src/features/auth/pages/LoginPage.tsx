import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';
import { LoginSchema, type LoginForm } from '../schema';
import { useLogin } from '../api/use-login';

export function LoginPage() {
  const nav = useNavigate();
  const login = useLogin();
  const form = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      nav('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NOT_A_MEMBER') {
        toast.error('판매자 계정입니다. 판매자 포털을 이용해 주세요.');
        return;
      }
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('로그인 실패');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-lg border p-6">
        <h1 className="text-xl font-semibold">구매자 로그인</h1>
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
          {form.formState.errors.password && (
            <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
          )}
        </div>
        <Button type="submit" disabled={login.isPending} className="w-full">
          {login.isPending ? '로그인 중...' : '로그인'}
        </Button>
        <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
          계정이 없으신가요? <Link to="/signup" className="underline">가입하기</Link>
        </p>
      </form>
    </div>
  );
}
