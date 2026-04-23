import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';
import { SellerSignupSchema, type SellerSignupForm } from '../schema';
import { useSellerSignup } from '../api/use-seller-signup';

export function SellerSignupPage() {
  const nav = useNavigate();
  const signup = useSellerSignup();
  const form = useForm<SellerSignupForm>({ resolver: zodResolver(SellerSignupSchema) });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signup.mutateAsync(values);
      toast.success('판매자 가입 완료. 로그인해 주세요.');
      nav('/seller/login');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('가입 실패');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-lg border p-6">
        <h1 className="text-xl font-semibold">판매자 가입</h1>
        <Field label="이메일" id="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        </Field>
        <Field label="비밀번호" id="password" error={form.formState.errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
        </Field>
        <Field label="상호명" id="businessName" error={form.formState.errors.businessName?.message}>
          <Input id="businessName" {...form.register('businessName')} />
        </Field>
        <Field label="사업자등록번호" id="businessRegistrationNumber" error={form.formState.errors.businessRegistrationNumber?.message}>
          <Input id="businessRegistrationNumber" inputMode="numeric" placeholder="1234567890" {...form.register('businessRegistrationNumber')} />
        </Field>
        <Field label="대표자명" id="representativeName" error={form.formState.errors.representativeName?.message}>
          <Input id="representativeName" {...form.register('representativeName')} />
        </Field>
        <Field label="전화번호" id="phoneNumber" error={form.formState.errors.phoneNumber?.message}>
          <Input id="phoneNumber" inputMode="numeric" placeholder="01012345678" {...form.register('phoneNumber')} />
        </Field>
        <Button type="submit" disabled={signup.isPending} className="w-full">
          {signup.isPending ? '가입 중...' : '가입'}
        </Button>
        <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
          이미 판매자 계정이 있으신가요? <Link to="/seller/login" className="underline">로그인</Link>
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
