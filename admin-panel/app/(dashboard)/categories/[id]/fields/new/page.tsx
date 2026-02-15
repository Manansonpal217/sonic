'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useCategory } from '@/lib/hooks/useCategories';
import { useCreateCategoryField } from '@/lib/hooks/useCategoryFields';
import { CategoryFieldForm } from '../CategoryFieldForm';
import { Skeleton } from '@/components/ui/skeleton';
import type { CategoryFieldCreate, CategoryFieldUpdate } from '@/lib/api/categoryFields';

export default function NewCategoryFieldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const categoryId = parseInt(id);
  const router = useRouter();
  const { data: category, isLoading: categoryLoading } = useCategory(categoryId);
  const createField = useCreateCategoryField();

  const handleSubmit = async (data: CategoryFieldCreate | CategoryFieldUpdate) => {
    await createField.mutateAsync(data as CategoryFieldCreate);
    router.push(`/categories/${id}/fields`);
  };

  if (categoryLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Category Not Found</h1>
        <Button variant="outline" asChild>
          <Link href="/categories">Back to Categories</Link>
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
          <h1 className="text-3xl font-bold">Create Field</h1>
          <p className="text-muted-foreground">Add a new field to {category.category_name}</p>
        </div>
      </div>

      <CategoryFieldForm
        categoryId={categoryId}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/categories/${id}/fields`)}
        submitLabel="Create Field"
      />
    </div>
  );
}
