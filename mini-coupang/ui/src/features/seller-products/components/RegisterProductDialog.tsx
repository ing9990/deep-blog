import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';
import { useCategories } from '@/features/search/api/use-categories';
import { RegisterProductSchema, type RegisterProductForm } from '../schema';
import { useRegisterProduct } from '../api/use-register-product';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function RegisterProductDialog({ open, onOpenChange }: Props) {
  const { data: cats = [] } = useCategories();
  const register = useRegisterProduct();
  const form = useForm<RegisterProductForm>({
    resolver: zodResolver(RegisterProductSchema),
    defaultValues: {
      categoryId: cats[0]?.id ?? 1,
      name: '',
      description: '',
      basePrice: 0,
      options: [],
      images: [],
    },
  });
  const options = useFieldArray({ control: form.control, name: 'options' });
  const images = useFieldArray({ control: form.control, name: 'images' });

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await register.mutateAsync(v);
      toast.success('상품이 등록되었습니다.');
      onOpenChange(false);
      form.reset();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('상품 등록 실패');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>상품 등록</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>카테고리</Label>
            <select
              className="h-10 w-full rounded-md border bg-transparent px-3"
              {...form.register('categoryId', { valueAsNumber: true })}
            >
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>상품명</Label>
            <Input {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>설명</Label>
            <Input {...form.register('description')} />
          </div>
          <div className="space-y-2">
            <Label>기본 가격 (원)</Label>
            <Input type="number" {...form.register('basePrice', { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>옵션</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => options.append({ optionName: '', sku: '', additionalPrice: 0 })}
              >
                옵션 추가
              </Button>
            </div>
            {options.fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <Input placeholder="옵션명" {...form.register(`options.${i}.optionName`)} />
                <Input placeholder="SKU" {...form.register(`options.${i}.sku`)} />
                <Input
                  type="number"
                  placeholder="추가가"
                  {...form.register(`options.${i}.additionalPrice`, { valueAsNumber: true })}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => options.remove(i)}
                >
                  삭제
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>이미지 (URL)</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => images.append({ url: '', primary: false })}
              >
                이미지 추가
              </Button>
            </div>
            {images.fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-[1fr_auto_auto] gap-2">
                <Input placeholder="https://..." {...form.register(`images.${i}.url`)} />
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" {...form.register(`images.${i}.primary`)} /> 대표
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => images.remove(i)}
                >
                  삭제
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={register.isPending}>
              {register.isPending ? '등록 중...' : '등록'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
