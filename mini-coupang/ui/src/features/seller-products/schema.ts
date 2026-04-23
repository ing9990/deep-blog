import { z } from 'zod';

export const RegisterProductSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  basePrice: z.number().int().nonnegative(),
  options: z
    .array(
      z.object({
        optionName: z.string().min(2).max(100),
        sku: z.string().min(2).max(50),
        additionalPrice: z.number().int().nonnegative(),
      }),
    )
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string().url().max(500),
        primary: z.boolean(),
      }),
    )
    .optional(),
});

export type RegisterProductForm = z.infer<typeof RegisterProductSchema>;
