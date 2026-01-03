import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryFieldsApi, type CategoryField, type CategoryFieldCreate, type CategoryFieldUpdate } from '../api/categoryFields';
import { toast } from 'sonner';

export const useCategoryFields = (params?: {
  category?: number;
  category_id?: number;
  field_type?: string;
  is_required?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ['categoryFields', params],
    queryFn: () => categoryFieldsApi.list(params),
  });
};

export const useCategoryField = (id: number) => {
  return useQuery({
    queryKey: ['categoryField', id],
    queryFn: () => categoryFieldsApi.get(id),
    enabled: !!id,
  });
};

export const useCreateCategoryField = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CategoryFieldCreate) => categoryFieldsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoryFields'] });
      toast.success('Field created successfully');
    },
    onError: () => {
      toast.error('Failed to create field');
    },
  });
};

export const useUpdateCategoryField = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryFieldUpdate }) =>
      categoryFieldsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoryFields'] });
      toast.success('Field updated successfully');
    },
    onError: () => {
      toast.error('Failed to update field');
    },
  });
};

export const useDeleteCategoryField = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => categoryFieldsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoryFields'] });
      toast.success('Field deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete field');
    },
  });
};


