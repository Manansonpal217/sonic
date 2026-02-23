'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { bannersApi } from '@/lib/api';
import { useProducts } from '@/lib/hooks/useProducts';
import { getMediaUrl } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

const NONE_VALUE = '__none__';

const bannerSchema = z.object({
  banner_title: z.string().min(1, 'Title is required'),
  banner_product_id: z.string().optional(),
  banner_status: z.boolean().optional(),
  banner_order: z.coerce.number().optional(),
});

type BannerFormData = z.infer<typeof bannerSchema>;

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: banner, isLoading } = useQuery({
    queryKey: ['banner', id],
    queryFn: () => bannersApi.get(id),
    enabled: !!id,
  });

  const { data: productsData } = useProducts({ product_status: true });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      banner_status: true,
      banner_order: 0,
    },
  });

  useEffect(() => {
    if (banner) {
      reset({
        banner_title: banner.banner_title,
        banner_product_id: banner.banner_product_id ? String(banner.banner_product_id) : undefined,
        banner_status: banner.banner_status,
        banner_order: banner.banner_order ?? 0,
      });
      if (banner.banner_image) {
        setImagePreview(getMediaUrl(banner.banner_image) || null);
      }
    }
  }, [banner, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: BannerFormData) => {
    try {
      const productId = data.banner_product_id && data.banner_product_id !== NONE_VALUE
        ? parseInt(data.banner_product_id)
        : null;
      await bannersApi.update(id, {
        banner_title: data.banner_title,
        banner_image: imageFile || undefined,
        banner_product_id: productId,
        banner_status: data.banner_status,
        banner_order: data.banner_order ?? 0,
      });
      toast.success('Banner updated successfully');
      router.push('/banners');
    } catch {
      toast.error('Failed to update banner');
    }
  };

  if (isLoading || !banner) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/banners">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Banner</h1>
          <p className="text-muted-foreground">Update banner image and settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Banner Details</CardTitle>
          <CardDescription>Changes will appear in the app carousel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="banner_title">Title *</Label>
                <Input
                  id="banner_title"
                  {...register('banner_title')}
                  placeholder="e.g. Summer Sale"
                  disabled={isSubmitting}
                />
                {errors.banner_title && (
                  <p className="text-sm text-red-500">{errors.banner_title.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="banner_image">Banner Image</Label>
                <Input
                  id="banner_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  {imageFile ? 'New image will replace current' : 'Leave empty to keep current image'}
                </p>
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-40 w-full max-w-md object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Link to Product (optional)</Label>
                <Select
                  value={watch('banner_product_id') || NONE_VALUE}
                  onValueChange={(v) => setValue('banner_product_id', v === NONE_VALUE ? undefined : v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {productsData?.results?.map((p: { id: number; product_name: string }) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.product_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner_order">Display Order</Label>
                <Input
                  id="banner_order"
                  type="number"
                  {...register('banner_order')}
                  disabled={isSubmitting}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2 md:col-span-2 flex items-center gap-2">
                <Checkbox
                  id="banner_status"
                  checked={watch('banner_status')}
                  onCheckedChange={(c) => setValue('banner_status', c as boolean)}
                />
                <Label htmlFor="banner_status">Active (visible on app)</Label>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#842B25] hover:bg-[#6b231f]" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Banner'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
