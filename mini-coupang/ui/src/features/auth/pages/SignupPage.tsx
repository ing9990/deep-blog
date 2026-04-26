import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';
import { MemberSignupSchema, type MemberSignupForm } from '../schema';
import { useMemberSignup } from '../api/use-member-signup';

export function SignupPage() {
  const nav = useNavigate();
  const signup = useMemberSignup();
  const form = useForm<MemberSignupForm>({ resolver: zodResolver(MemberSignupSchema) });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const body = { ...values, nickname: values.nickname || undefined };
      await signup.mutateAsync(body);
      toast.success('가입 완료. 로그인해 주세요.');
      nav('/login');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('가입 실패');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-lg border p-6">
        <h1 className="text-xl font-semibold">구매자 가입</h1>
        <Field label="이메일" id="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        </Field>
        <Field label="비밀번호" id="password" error={form.formState.errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
        </Field>
        <Field label="이름" id="name" error={form.formState.errors.name?.message}>
          <Input id="name" {...form.register('name')} />
        </Field>
        <Field label="전화번호" id="phoneNumber" error={form.formState.errors.phoneNumber?.message}>
          <Input id="phoneNumber" inputMode="numeric" placeholder="01012345678" {...form.register('phoneNumber')} />
        </Field>
        <Field label="닉네임 (선택)" id="nickname" error={form.formState.errors.nickname?.message}>
          <Input id="nickname" {...form.register('nickname')} />
        </Field>
        <Button type="submit" disabled={signup.isPending} className="w-full">
          {signup.isPending ? '가입 중...' : '가입'}
        </Button>
        <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
          이미 계정이 있으신가요? <Link to="/login" className="underline">로그인</Link>
        </p>
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  id: string;
  error?: string;
  children: ReactNode;
}
function Field({ label, id, error, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
