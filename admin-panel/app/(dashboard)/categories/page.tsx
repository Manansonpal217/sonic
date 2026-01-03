'use client';

import { useState } from 'react';
import { useCategories, useDeleteCategory, useCreateCategory, useUpdateCategory } from '@/lib/hooks/useCategories';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Settings } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, getMediaUrl } from '@/lib/utils/formatters';
import Image from 'next/image';
import type { Category, CategoryCreate, CategoryUpdate } from '@/lib/api/categories';

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCategories({ search, page, page_size: 20 });
  const deleteCategory = useDeleteCategory();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState<CategoryCreate>({
    category_name: '',
    category_description: '',
    category_status: true,
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await deleteCategory.mutateAsync(id);
    }
  };
  
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: CategoryCreate = {
      ...formData,
      category_image: imageFile,
    };
    await createCategory.mutateAsync(data);
    setIsCreateDialogOpen(false);
    resetForm();
  };
  
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    const data: CategoryUpdate = {
      category_name: formData.category_name,
      category_description: formData.category_description,
      category_status: formData.category_status,
      display_order: formData.display_order,
      category_image: imageFile,
    };
    
    await updateCategory.mutateAsync({ id: editingCategory.id, data });
    setIsEditDialogOpen(false);
    setEditingCategory(null);
    resetForm();
  };
  
  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      category_description: category.category_description || '',
      category_status: category.category_status,
      display_order: category.display_order,
    });
    setImageFile(null);
    setIsEditDialogOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      category_name: '',
      category_description: '',
      category_status: true,
    });
    setImageFile(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage jewelry categories</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#842B25] hover:bg-[#6b231f]">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Category</DialogTitle>
                <DialogDescription>Add a new jewelry category</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category_name">Category Name *</Label>
                  <Input
                    id="category_name"
                    value={formData.category_name}
                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_description">Description</Label>
                  <Textarea
                    id="category_description"
                    value={formData.category_description}
                    onChange={(e) => setFormData({ ...formData, category_description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_image">Image (Optional)</Label>
                  <Input
                    id="category_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-[#842B25] hover:bg-[#6b231f]">
                  Create Category
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-12 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.results?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              data?.results?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    {category.category_image ? (
                      <Image
                        src={getMediaUrl(category.category_image) || ''}
                        alt={category.category_name}
                        width={48}
                        height={48}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{category.category_name}</TableCell>
                  <TableCell className="max-w-xs truncate">{category.category_description || '-'}</TableCell>
                  <TableCell>{category.products_count}</TableCell>
                  <TableCell>
                    <Badge variant={category.category_status ? 'default' : 'secondary'}>
                      {category.category_status ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{category.display_order}</TableCell>
                  <TableCell>{formatDate(category.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/categories/${category.id}/fields`}>
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
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
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Update category information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_category_name">Category Name *</Label>
                <Input
                  id="edit_category_name"
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_category_description">Description</Label>
                <Textarea
                  id="edit_category_description"
                  value={formData.category_description}
                  onChange={(e) => setFormData({ ...formData, category_description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_category_image">Image</Label>
                <Input
                  id="edit_category_image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                {editingCategory?.category_image && !imageFile && (
                  <p className="text-sm text-muted-foreground">Current image will be kept if no new image is selected</p>
                )}
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
            <DialogFooter>
              <Button type="submit" className="bg-[#842B25] hover:bg-[#6b231f]">
                Update Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


