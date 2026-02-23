'use client';

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
import { useCreateProduct } from '@/lib/hooks/useProducts';
import { useCategories } from '@/lib/hooks/useCategories';
import { useCategoryFields } from '@/lib/hooks/useCategoryFields';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import apiClient from '@/lib/api/client';
import { getFullUrl, API_ENDPOINTS } from '@/lib/api/endpoints';
import { productVariantsApi } from '@/lib/api/products';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

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

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const { data: categoriesData } = useCategories({ category_status: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>({});
  const [selectedDim1Options, setSelectedDim1Options] = useState<string[]>([]);
  const [selectedDim2Options, setSelectedDim2Options] = useState<string[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<{ variant_value_1: string; variant_value_2: string | null }[]>([]);

  const { data: categoryFieldsData } = useCategoryFields({
    category_id: selectedCategory ? parseInt(selectedCategory) : undefined,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_weight: '',
      product_status: true,
      product_is_parent: false,
      product_parent_id: undefined,
    },
  });

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

  const handleCategoryChange = (value: string) => {
    const categoryValue = value || '';
    setSelectedCategory(categoryValue);
    setValue('product_category', categoryValue);
    setDynamicFieldValues({});
    setSelectedDim1Options([]);
    setSelectedDim2Options([]);
    setGeneratedVariants([]);
  };

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

  const toggleDim1 = (opt: string) => {
    setSelectedDim1Options(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };
  const toggleDim2 = (opt: string) => {
    setSelectedDim2Options(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };

  const handleGenerateAllVariants = () => {
    if (variantDimensionFields.length === 1) {
      setGeneratedVariants(selectedDim1Options.map(v => ({ variant_value_1: v, variant_value_2: null })));
      return;
    }
    const combos: { variant_value_1: string; variant_value_2: string | null }[] = [];
    for (const v1 of selectedDim1Options) {
      for (const v2 of selectedDim2Options) {
        combos.push({ variant_value_1: v1, variant_value_2: v2 });
      }
    }
    setGeneratedVariants(combos);
  };

  const removeGeneratedVariant = (index: number) => {
    setGeneratedVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleDynamicFieldChange = (fieldId: number, value: string) => {
    setDynamicFieldValues(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const validateDynamicFields = () => {
    const requiredFields = (categoryFieldsData?.results || []).filter(
      (f: { is_required?: boolean; is_variant_dimension?: boolean }) => f.is_required && !f.is_variant_dimension
    );
    for (const field of requiredFields) {
      if (!dynamicFieldValues[field.id] || dynamicFieldValues[field.id].trim() === '') {
        toast.error(`${field.field_label} is required`);
        return false;
      }
    }
    return true;
  };

  const validateVariants = () => {
    if (!hasVariantDimensions) return true;
    if (generatedVariants.length === 0) {
      toast.error('Select options and click "Generate all variant combinations" to create variants.');
      return false;
    }
    return true;
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (selectedCategory && !validateDynamicFields()) return;
      if (hasVariantDimensions && !validateVariants()) return;

      const product = await createProduct.mutateAsync({
        product_name: data.product_name,
        product_description: data.product_description,
        product_weight: data.product_weight?.trim() ?? '',
        product_image: imageFile,
        product_category: data.product_category ? parseInt(data.product_category) : null,
        product_is_parent: false,
        product_parent_id: null,
        product_status: data.product_status,
      });

      if (selectedCategory && categoryFieldsData?.results && categoryFieldsData.results.length > 0) {
        const fieldValues = categoryFieldsData.results.map((field: { id: number }) => ({
          category_field: field.id,
          field_value: dynamicFieldValues[field.id] || '',
        })).filter((fv: { field_value: string }) => fv.field_value !== '');

        if (fieldValues.length > 0) {
          await apiClient.post(getFullUrl(API_ENDPOINTS.productFieldValuesBulkCreate), {
            product_id: product.id,
            field_values: fieldValues,
          });
        }
      }

      if (hasVariantDimensions && generatedVariants.length > 0) {
        await productVariantsApi.bulkCreate(product.id, generatedVariants);
      }

      toast.success('Product created successfully');
      router.push('/products');
    } catch (error) {
      toast.error('Failed to create product');
    }
  };

  const renderDynamicField = (field: any) => {
    const value = dynamicFieldValues[field.id] || '';

    switch (field.field_type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`field_${field.id}`}>
              {field.field_label} {field.is_required && '*'}
            </Label>
            <Input
              id={`field_${field.id}`}
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder || ''}
              disabled={isSubmitting}
            />
            {field.help_text && (
              <p className="text-sm text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2 md:col-span-2">
            <Label htmlFor={`field_${field.id}`}>
              {field.field_label} {field.is_required && '*'}
            </Label>
            <Textarea
              id={`field_${field.id}`}
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder || ''}
              disabled={isSubmitting}
              rows={3}
            />
            {field.help_text && (
              <p className="text-sm text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      case 'number':
      case 'decimal':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`field_${field.id}`}>
              {field.field_label} {field.is_required && '*'}
            </Label>
            <Input
              id={`field_${field.id}`}
              type="number"
              step={field.field_type === 'decimal' ? '0.01' : '1'}
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder || ''}
              disabled={isSubmitting}
            />
            {field.help_text && (
              <p className="text-sm text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      case 'select':
        const options = field.field_options ? JSON.parse(field.field_options) : [];
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`field_${field.id}`}>
              {field.field_label} {field.is_required && '*'}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleDynamicFieldChange(field.id, val)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt: string, idx: number) => (
                  <SelectItem key={idx} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.help_text && (
              <p className="text-sm text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`field_${field.id}`}
                checked={value === 'true'}
                onCheckedChange={(checked) => handleDynamicFieldChange(field.id, String(checked))}
              />
              <Label htmlFor={`field_${field.id}`}>
                {field.field_label} {field.is_required && '*'}
              </Label>
            </div>
            {field.help_text && (
              <p className="text-sm text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Product</h1>
          <p className="text-muted-foreground">Add a new product to the catalog</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Enter the details for the new product</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product_category">Category</Label>
                <Select
                  value={selectedCategory || undefined}
                  onValueChange={handleCategoryChange}
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
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Fields (non-variant only in this section) */}
              {selectedCategory && categoryFieldsData?.results && categoryFieldsData.results.filter((f: { is_variant_dimension?: boolean }) => !f.is_variant_dimension).length > 0 && (
                <>
                  <div className="md:col-span-2 border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Additional Fields</h3>
                  </div>
                  {categoryFieldsData.results.filter((f: { is_variant_dimension?: boolean }) => !f.is_variant_dimension).map((field: { id: number }) => renderDynamicField(field))}
                </>
              )}

              {/* Variants: option-based, generate all combinations (e.g. Size x Karat) */}
              {selectedCategory && hasVariantDimensions && (
                <>
                  <div className="md:col-span-2 border-t pt-4">
                    <h3 className="text-lg font-semibold mb-2">Variants</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose options per dimension, then generate all combinations (e.g. Size × Karat).
                    </p>
                    <div className="space-y-4">
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
                          {dim1Options.length === 0 && (
                            <p className="text-sm text-muted-foreground">Add Options (JSON array) to the category field.</p>
                          )}
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
                            {dim2Options.length === 0 && (
                              <p className="text-sm text-muted-foreground">Add Options to the category field.</p>
                            )}
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
                          <Label className="mb-2 block">Generated ({generatedVariants.length} variant(s))</Label>
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
                                  <tr key={index} className="border-b last:border-0">
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
                  </div>
                </>
              )}

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="product_status"
                    defaultChecked={true}
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
              <Button type="submit"  disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
