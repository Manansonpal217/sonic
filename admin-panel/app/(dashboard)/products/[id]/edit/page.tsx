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
import { useCategoryFields } from '@/lib/hooks/useCategoryFields';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { getMediaUrl } from '@/lib/utils/formatters';
import Image from 'next/image';
import { productVariantsApi } from '@/lib/api/products';
import { toast } from 'sonner';

const productSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  product_description: z.string().optional(),
  product_weight: z.string().min(1, 'Weight is required'),
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
  const categoryId = product?.product_category ? Number(product.product_category) : undefined;
  const { data: categoryFieldsData } = useCategoryFields({ category_id: categoryId });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedDim1Options, setSelectedDim1Options] = useState<string[]>([]);
  const [selectedDim2Options, setSelectedDim2Options] = useState<string[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<{ id?: number; variant_value_1: string; variant_value_2: string | null }[]>([]);
  const [initialVariantIds, setInitialVariantIds] = useState<Set<number>>(new Set());

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

  const variantDimensionFields = (categoryFieldsData?.results || [])
    .filter((f: { is_variant_dimension?: boolean; field_type?: string }) => f.is_variant_dimension && f.field_type === 'select')
    .sort((a: { variant_order?: number | null }, b: { variant_order?: number | null }) =>
      (a.variant_order ?? 99) - (b.variant_order ?? 99)
    );
  const hasVariantDimensions = variantDimensionFields.length >= 1;
  const dim1Options: string[] = (() => {
    if (!variantDimensionFields[0]?.field_options) return [];
    try {
      const arr = typeof variantDimensionFields[0].field_options === 'string'
        ? JSON.parse(variantDimensionFields[0].field_options) : variantDimensionFields[0].field_options;
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch { return []; }
  })();
  const dim2Options: string[] = (() => {
    if (variantDimensionFields.length < 2 || !variantDimensionFields[1]?.field_options) return [];
    try {
      const arr = typeof variantDimensionFields[1].field_options === 'string'
        ? JSON.parse(variantDimensionFields[1].field_options) : variantDimensionFields[1].field_options;
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch { return []; }
  })();

  useEffect(() => {
    if (product) {
      reset({
        product_name: product.product_name,
        product_description: product.product_description || '',
        product_weight: product.product_weight ?? '',
        product_category: product.product_category ? String(product.product_category) : '',
        product_status: product.product_status,
      });
      if (product.product_image) {
        setImagePreview(getMediaUrl(product.product_image) || null);
      }
      const variants = (product as { variants?: { id: number; variant_value_1: string; variant_value_2?: string | null }[] }).variants;
      if (variants?.length) {
        setGeneratedVariants(variants.map(v => ({
          id: v.id,
          variant_value_1: v.variant_value_1,
          variant_value_2: v.variant_value_2 ?? null,
        })));
        setInitialVariantIds(new Set(variants.map(v => v.id)));
        const v1 = [...new Set(variants.map(v => v.variant_value_1))];
        const v2 = [...new Set(variants.map(v => v.variant_value_2).filter(Boolean) as string[])];
        setSelectedDim1Options(v1);
        setSelectedDim2Options(v2);
      }
    }
  }, [product, reset]);

  const toggleDim1 = (opt: string) => {
    setSelectedDim1Options(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };
  const toggleDim2 = (opt: string) => {
    setSelectedDim2Options(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };
  const handleGenerateAllVariants = () => {
    const existing = new Set(
      generatedVariants.map(v => `${v.variant_value_1}\t${v.variant_value_2 ?? ''}`)
    );
    if (variantDimensionFields.length === 1) {
      const toAdd = selectedDim1Options.filter(v => !existing.has(`${v}\t`)).map(v => ({ variant_value_1: v, variant_value_2: null }));
      setGeneratedVariants(prev => [...prev, ...toAdd]);
      return;
    }
    const toAdd: { variant_value_1: string; variant_value_2: string | null }[] = [];
    for (const v1 of selectedDim1Options) {
      for (const v2 of selectedDim2Options) {
        if (!existing.has(`${v1}\t${v2}`)) toAdd.push({ variant_value_1: v1, variant_value_2: v2 });
      }
    }
    setGeneratedVariants(prev => [...prev, ...toAdd]);
  };
  const removeGeneratedVariant = (index: number) => {
    setGeneratedVariants(prev => prev.filter((_, i) => i !== index));
  };

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
          product_weight: data.product_weight?.trim() ?? '',
          product_image: imageFile || undefined,
          product_category: data.product_category ? parseInt(data.product_category) : null,
          product_is_parent: false,
          product_parent_id: null,
          product_status: data.product_status,
        },
      });
      const currentIds = new Set(generatedVariants.filter(v => v.id).map(v => v.id!));
      for (const id of initialVariantIds) {
        if (!currentIds.has(id)) await productVariantsApi.delete(id);
      }
      const toCreate = generatedVariants.filter(v => !v.id).map(({ variant_value_1, variant_value_2 }) => ({ variant_value_1, variant_value_2 }));
      if (toCreate.length > 0) await productVariantsApi.bulkCreate(productId, toCreate);
      toast.success('Product updated successfully');
      router.push(`/products/${productId}`);
    } catch (error) {
      toast.error('Failed to update product');
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
                <Label htmlFor="product_weight">Weight *</Label>
                <Input
                  id="product_weight"
                  type="number"
                  step="0.001"
                  {...register('product_weight')}
                  disabled={isSubmitting}
                  placeholder="e.g. 10.5"
                />
                {errors.product_weight && (
                  <p className="text-sm text-red-500">{errors.product_weight.message}</p>
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

              {hasVariantDimensions && (
                <div className="md:col-span-2 border-t pt-4 space-y-4">
                  <h3 className="text-lg font-semibold">Variants</h3>
                  <p className="text-sm text-muted-foreground">Add or remove variant combinations (e.g. Size × Karat).</p>
                  <div>
                    <Label className="mb-2 block">{variantDimensionFields[0]?.field_label ?? 'Dimension 1'}</Label>
                    <div className="flex flex-wrap gap-2">
                      {dim1Options.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedDim1Options.includes(opt)}
                            onCheckedChange={() => toggleDim1(opt)}
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {variantDimensionFields.length >= 2 && (
                    <div>
                      <Label className="mb-2 block">{variantDimensionFields[1]?.field_label ?? 'Dimension 2'}</Label>
                      <div className="flex flex-wrap gap-2">
                        {dim2Options.map((opt) => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={selectedDim2Options.includes(opt)}
                              onCheckedChange={() => toggleDim2(opt)}
                            />
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateAllVariants}
                    disabled={
                      selectedDim1Options.length === 0 ||
                      (variantDimensionFields.length >= 2 && selectedDim2Options.length === 0)
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate all variant combinations
                  </Button>
                  {generatedVariants.length > 0 && (
                    <div>
                      <Label className="mb-2 block">Variants ({generatedVariants.length})</Label>
                      <div className="border rounded-md max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left p-2">{variantDimensionFields[0]?.field_label ?? 'Dim 1'}</th>
                              {variantDimensionFields.length >= 2 && (
                                <th className="text-left p-2">{variantDimensionFields[1]?.field_label ?? 'Dim 2'}</th>
                              )}
                              <th className="w-10 p-2" />
                            </tr>
                          </thead>
                          <tbody>
                            {generatedVariants.map((v, index) => (
                              <tr key={v.id ?? index} className="border-b last:border-0">
                                <td className="p-2">{v.variant_value_1}</td>
                                {variantDimensionFields.length >= 2 && (
                                  <td className="p-2">{v.variant_value_2 ?? '-'}</td>
                                )}
                                <td className="p-2">
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeGeneratedVariant(index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

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


