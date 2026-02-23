'use client';

import { use } from 'react';
import { useCategory } from '@/lib/hooks/useCategories';
import { useCategoryFields, useDeleteCategoryField } from '@/lib/hooks/useCategoryFields';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'select', label: 'Select (Dropdown)' },
  { value: 'boolean', label: 'Boolean (Checkbox)' },
] as const;

export default function CategoryFieldsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const categoryId = parseInt(id);
  const { data: category, isLoading: categoryLoading } = useCategory(categoryId);
  const { data: fieldsData, isLoading: fieldsLoading } = useCategoryFields({ category_id: categoryId });
  const deleteField = useDeleteCategoryField();

  const handleDelete = async (fieldId: number) => {
    if (confirm('Are you sure you want to delete this field?')) {
      await deleteField.mutateAsync(fieldId);
    }
  };

  if (categoryLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Category Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/categories">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Category Fields</h1>
            <p className="text-muted-foreground">Manage dynamic fields for {category.category_name}</p>
          </div>
        </div>

        <Button  asChild>
          <Link href={`/categories/${id}/fields/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fieldsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : fieldsData?.results?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No fields defined for this category. Add fields to enable custom attributes for products in this category.
                </TableCell>
              </TableRow>
            ) : (
              fieldsData?.results?.map((field) => (
                <TableRow key={field.id}>
                  <TableCell className="font-medium">{field.field_label}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{field.field_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={field.is_required ? 'default' : 'secondary'}>
                      {field.is_required ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {field.is_variant_dimension ? (
                      <Badge variant="outline">Variant #{field.variant_order ?? '-'}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/categories/${id}/fields/${field.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(field.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
