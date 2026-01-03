'use client';

import { use } from 'react';
import { useState } from 'react';
import { useCategory } from '@/lib/hooks/useCategories';
import { useCategoryFields, useCreateCategoryField, useUpdateCategoryField, useDeleteCategoryField } from '@/lib/hooks/useCategoryFields';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { CategoryFieldCreate, CategoryFieldUpdate } from '@/lib/api/categoryFields';

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
  const createField = useCreateCategoryField();
  const updateField = useUpdateCategoryField();
  const deleteField = useDeleteCategoryField();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);

  const [formData, setFormData] = useState<CategoryFieldCreate>({
    category: categoryId,
    field_name: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    display_order: 0,
    placeholder: '',
    help_text: '',
  });

  const [selectOptions, setSelectOptions] = useState<string>('');

  const resetForm = () => {
    setFormData({
      category: categoryId,
      field_name: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      display_order: 0,
      placeholder: '',
      help_text: '',
    });
    setSelectOptions('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: CategoryFieldCreate = {
      ...formData,
      field_options: formData.field_type === 'select' ? selectOptions : undefined,
    };
    await createField.mutateAsync(data);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;

    const data: CategoryFieldUpdate = {
      field_name: formData.field_name,
      field_label: formData.field_label,
      field_type: formData.field_type,
      is_required: formData.is_required,
      display_order: formData.display_order,
      placeholder: formData.placeholder,
      help_text: formData.help_text,
      field_options: formData.field_type === 'select' ? selectOptions : undefined,
    };

    await updateField.mutateAsync({ id: editingField.id, data });
    setIsEditDialogOpen(false);
    setEditingField(null);
    resetForm();
  };

  const openEditDialog = (field: any) => {
    setEditingField(field);
    setFormData({
      category: categoryId,
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      is_required: field.is_required,
      display_order: field.display_order,
      placeholder: field.placeholder || '',
      help_text: field.help_text || '',
    });
    setSelectOptions(field.field_options || '');
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this field?')) {
      await deleteField.mutateAsync(id);
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

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#842B25] hover:bg-[#6b231f]" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Field</DialogTitle>
                <DialogDescription>Add a new dynamic field to this category</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="field_name">Field Name *</Label>
                    <Input
                      id="field_name"
                      value={formData.field_name}
                      onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                      placeholder="e.g., material_type"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Internal name (snake_case)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field_label">Field Label *</Label>
                    <Input
                      id="field_label"
                      value={formData.field_label}
                      onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                      placeholder="e.g., Material Type"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Display label for users</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field_type">Field Type *</Label>
                    <Select
                      value={formData.field_type}
                      onValueChange={(value: any) => setFormData({ ...formData, field_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {formData.field_type === 'select' && (
                  <div className="space-y-2">
                    <Label htmlFor="field_options">Options (JSON Array) *</Label>
                    <Textarea
                      id="field_options"
                      value={selectOptions}
                      onChange={(e) => setSelectOptions(e.target.value)}
                      placeholder='["Option 1", "Option 2", "Option 3"]'
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">Enter options as JSON array, e.g., ["Gold", "Silver", "Platinum"]</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="placeholder">Placeholder Text</Label>
                  <Input
                    id="placeholder"
                    value={formData.placeholder}
                    onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                    placeholder="Enter placeholder text..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="help_text">Help Text</Label>
                  <Input
                    id="help_text"
                    value={formData.help_text}
                    onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                    placeholder="Additional help text for users"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked as boolean })}
                  />
                  <Label htmlFor="is_required">Required Field</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#842B25] hover:bg-[#6b231f]">
                  Create Field
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Placeholder</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : fieldsData?.results?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                  <TableCell>{field.display_order}</TableCell>
                  <TableCell className="max-w-xs truncate">{field.placeholder || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(field)}
                      >
                        <Edit className="h-4 w-4" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Field</DialogTitle>
              <DialogDescription>Update field information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_field_name">Field Name *</Label>
                  <Input
                    id="edit_field_name"
                    value={formData.field_name}
                    onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_field_label">Field Label *</Label>
                  <Input
                    id="edit_field_label"
                    value={formData.field_label}
                    onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_field_type">Field Type *</Label>
                  <Select
                    value={formData.field_type}
                    onValueChange={(value: any) => setFormData({ ...formData, field_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_display_order">Display Order</Label>
                  <Input
                    id="edit_display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {formData.field_type === 'select' && (
                <div className="space-y-2">
                  <Label htmlFor="edit_field_options">Options (JSON Array) *</Label>
                  <Textarea
                    id="edit_field_options"
                    value={selectOptions}
                    onChange={(e) => setSelectOptions(e.target.value)}
                    placeholder='["Option 1", "Option 2", "Option 3"]'
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit_placeholder">Placeholder Text</Label>
                <Input
                  id="edit_placeholder"
                  value={formData.placeholder}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_help_text">Help Text</Label>
                <Input
                  id="edit_help_text"
                  value={formData.help_text}
                  onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_is_required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked as boolean })}
                />
                <Label htmlFor="edit_is_required">Required Field</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#842B25] hover:bg-[#6b231f]">
                Update Field
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

