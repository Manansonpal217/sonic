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
import { toast } from 'sonner';

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

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const { data: categoriesData } = useCategories({ category_status: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>({});

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
    setDynamicFieldValues({}); // Reset dynamic field values
  };

  const handleDynamicFieldChange = (fieldId: number, value: string) => {
    setDynamicFieldValues(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const validateDynamicFields = () => {
    const requiredFields = categoryFieldsData?.results?.filter(f => f.is_required) || [];
    for (const field of requiredFields) {
      if (!dynamicFieldValues[field.id] || dynamicFieldValues[field.id].trim() === '') {
        toast.error(`${field.field_label} is required`);
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Validate dynamic fields
      if (selectedCategory && !validateDynamicFields()) {
        return;
      }

      // Create product
      const product = await createProduct.mutateAsync({
        product_name: data.product_name,
        product_description: data.product_description,
        product_price: data.product_price,
        product_image: imageFile,
        product_category: data.product_category ? parseInt(data.product_category) : null,
        product_is_parent: false,
        product_parent_id: null,
        product_status: data.product_status,
      });

      // Save dynamic field values
      if (selectedCategory && categoryFieldsData?.results && categoryFieldsData.results.length > 0) {
        const fieldValues = categoryFieldsData.results.map(field => ({
          category_field: field.id,
          field_value: dynamicFieldValues[field.id] || '',
        })).filter(fv => fv.field_value !== '');

        if (fieldValues.length > 0) {
          await apiClient.post(getFullUrl(API_ENDPOINTS.productFieldValuesBulkCreate), {
            product_id: product.id,
            field_values: fieldValues,
          });
        }
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
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Fields */}
              {selectedCategory && categoryFieldsData?.results && categoryFieldsData.results.length > 0 && (
                <>
                  <div className="md:col-span-2 border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Additional Fields</h3>
                  </div>
                  {categoryFieldsData.results.map(field => renderDynamicField(field))}
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
              <Button type="submit" className="bg-[#842B25] hover:bg-[#6b231f]" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
