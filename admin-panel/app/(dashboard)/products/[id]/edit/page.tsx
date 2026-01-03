'use client';

import { use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useProduct, useUpdateProduct } from '@/lib/hooks/useProducts';
import { useCategories } from '@/lib/hooks/useCategories';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { getMediaUrl } from '@/lib/utils/formatters';
import Image from 'next/image';

const productSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  product_description: z.string().optional(),
  product_price: z.string().min(1, 'Price is required'),
  product_category: z.string().optional(),
  product_is_parent: z.boolean().optional(),
  product_parent_id: z.string().optional(),
  product_status: z.boolean().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const productId = parseInt(id);
  const router = useRouter();
  const { data: product, isLoading } = useProduct(productId);
  const updateProduct = useUpdateProduct();
  const { data: categoriesData } = useCategories({ category_status: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (product) {
      reset({
        product_name: product.product_name,
        product_description: product.product_description || '',
        product_price: product.product_price,
        product_category: product.product_category ? String(product.product_category) : '',
        product_status: product.product_status,
      });
      if (product.product_image) {
        setImagePreview(getMediaUrl(product.product_image) || null);
      }
    }
  }, [product, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      await updateProduct.mutateAsync({
        id: productId,
        data: {
          product_name: data.product_name,
          product_description: data.product_description,
          product_price: data.product_price,
          product_image: imageFile || undefined,
          product_category: data.product_category ? parseInt(data.product_category) : null,
          product_is_parent: false,
          product_parent_id: null,
          product_status: data.product_status,
        },
      });
      router.push(`/products/${productId}`);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Product Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/products/${productId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">Update product information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Update the product details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  {...register('product_name')}
                  disabled={isSubmitting}
                />
                {errors.product_name && (
                  <p className="text-sm text-red-500">{errors.product_name.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="product_description">Description</Label>
                <Textarea
                  id="product_description"
                  {...register('product_description')}
                  disabled={isSubmitting}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_category">Category</Label>
                <Select
                  value={watch('product_category') || undefined}
                  onValueChange={(value) => setValue('product_category', value || '')}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesData?.results?.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_price">Price *</Label>
                <Input
                  id="product_price"
                  type="number"
                  step="0.01"
                  {...register('product_price')}
                  disabled={isSubmitting}
                />
                {errors.product_price && (
                  <p className="text-sm text-red-500">{errors.product_price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_image">Product Image</Label>
                <Input
                  id="product_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={128}
                      height={128}
                      className="h-32 w-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="product_status"
                    checked={watch('product_status')}
                    onCheckedChange={(checked) => setValue('product_status', checked as boolean)}
                  />
                  <Label htmlFor="product_status">Active</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-[#842B25] hover:bg-[#6b231f]" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


