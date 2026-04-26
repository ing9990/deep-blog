import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('이메일 형식이 올바르지 않습니다.').max(255),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.').max(72),
});
export type LoginForm = z.infer<typeof LoginSchema>;

export const MemberSignupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  name: z.string().min(2).max(50),
  phoneNumber: z.string().regex(/^\d{10,11}$/, '전화번호는 숫자 10~11자리여야 합니다.'),
  nickname: z.string().min(2).max(30).optional().or(z.literal('')),
});
export type MemberSignupForm = z.infer<typeof MemberSignupSchema>;

export const SellerSignupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  businessName: z.string().min(2).max(100),
  businessRegistrationNumber: z.string().regex(/^\d{10}$/, '사업자등록번호는 숫자 10자리여야 합니다.'),
  representativeName: z.string().min(2).max(50),
  phoneNumber: z.string().regex(/^\d{10,11}$/),
});
export type SellerSignupForm = z.infer<typeof SellerSignupSchema>;
