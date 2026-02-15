'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useCategory } from '@/lib/hooks/useCategories';
import { useCategoryField, useUpdateCategoryField } from '@/lib/hooks/useCategoryFields';
import { CategoryFieldForm } from '../../CategoryFieldForm';
import { Skeleton } from '@/components/ui/skeleton';
import type { CategoryFieldUpdate } from '@/lib/api/categoryFields';

export default function EditCategoryFieldPage({
  params,
}: {
  params: Promise<{ id: string; fieldId: string }>;
}) {
  const { id, fieldId } = use(params);
  const categoryId = parseInt(id);
  const fieldIdNum = parseInt(fieldId);
  const router = useRouter();
  const { data: category, isLoading: categoryLoading } = useCategory(categoryId);
  const { data: field, isLoading: fieldLoading } = useCategoryField(fieldIdNum);
  const updateField = useUpdateCategoryField();

  const handleSubmit = async (data: CategoryFieldUpdate) => {
    await updateField.mutateAsync({ id: fieldIdNum, data });
    router.push(`/categories/${id}/fields`);
  };

  if (categoryLoading || fieldLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  if (!category || !field) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Not Found</h1>
        <Button variant="outline" asChild>
          <Link href={`/categories/${id}/fields`}>Back to Fields</Link>
        </Button>
      </div>
    );
  }

  if (field.category !== categoryId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Field does not belong to this category</h1>
        <Button variant="outline" asChild>
          <Link href={`/categories/${id}/fields`}>Back to Fields</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/categories/${id}/fields`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Field</h1>
          <p className="text-muted-foreground">
            Update {field.field_label} in {category.category_name}
          </p>
        </div>
      </div>

      <CategoryFieldForm
        categoryId={categoryId}
        initialField={field}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/categories/${id}/fields`)}
        submitLabel="Update Field"
      />
    </div>
  );
}
