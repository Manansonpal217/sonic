'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationTypesApi, type NotificationTypeCreate, type NotificationTypeUpdate } from '@/lib/api/notification-types';
import type { NotificationType } from '@/types';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils/formatters';
import { toast } from 'sonner';

export default function NotificationTypesPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<NotificationType | null>(null);
  
  const [formData, setFormData] = useState<NotificationTypeCreate>({
    notif_name: '',
    notif_status: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['notification-types', { page, page_size: 20 }],
    queryFn: () => notificationTypesApi.list({ page, page_size: 20 }),
  });

  const createType = useMutation({
    mutationFn: (data: NotificationTypeCreate) => notificationTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-types'] });
      toast.success('Notification type created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create notification type');
    },
  });

  const updateType = useMutation({
    mutationFn: ({ id, data }: { id: number; data: NotificationTypeUpdate }) =>
      notificationTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-types'] });
      toast.success('Notification type updated successfully');
      setIsEditDialogOpen(false);
      setEditingType(null);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update notification type');
    },
  });

  const deleteType = useMutation({
    mutationFn: (id: number) => notificationTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-types'] });
      toast.success('Notification type deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete notification type');
    },
  });

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this notification type?')) {
      await deleteType.mutateAsync(id);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createType.mutateAsync(formData);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    await updateType.mutateAsync({ id: editingType.notif_id, data: formData });
  };

  const openEditDialog = (type: NotificationType) => {
    setEditingType(type);
    setFormData({
      notif_name: type.notif_name,
      notif_status: type.notif_status,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      notif_name: '',
      notif_status: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Types</h1>
          <p className="text-muted-foreground">Manage notification type definitions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#842B25] hover:bg-[#6b231f]" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Notification Type</DialogTitle>
                <DialogDescription>Add a new notification type</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="notif_name">Name *</Label>
                  <Input
                    id="notif_name"
                    value={formData.notif_name}
                    onChange={(e) => setFormData({ ...formData, notif_name: e.target.value })}
                    placeholder="e.g., Order Update"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notif_status"
                    checked={formData.notif_status}
                    onCheckedChange={(checked) => setFormData({ ...formData, notif_status: checked as boolean })}
                  />
                  <Label htmlFor="notif_status">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#842B25] hover:bg-[#6b231f]">
                  Create Type
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
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.results?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No notification types found
                </TableCell>
              </TableRow>
            ) : (
              data?.results?.map((type) => (
                <TableRow key={type.notif_id}>
                  <TableCell>{type.notif_id}</TableCell>
                  <TableCell className="font-medium">{type.notif_name}</TableCell>
                  <TableCell>
                    <Badge variant={type.notif_status ? 'default' : 'secondary'}>
                      {type.notif_status ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{type.created_at ? formatDate(type.created_at) : '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(type)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(type.notif_id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.count > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.count)} of {data.count} types
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!data.previous}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!data.next}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Notification Type</DialogTitle>
              <DialogDescription>Update notification type information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_notif_name">Name *</Label>
                <Input
                  id="edit_notif_name"
                  value={formData.notif_name}
                  onChange={(e) => setFormData({ ...formData, notif_name: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_notif_status"
                  checked={formData.notif_status}
                  onCheckedChange={(checked) => setFormData({ ...formData, notif_status: checked as boolean })}
                />
                <Label htmlFor="edit_notif_status">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#842B25] hover:bg-[#6b231f]">
                Update Type
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


