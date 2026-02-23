'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatDate } from '@/lib/utils/formatters';

export default function CartPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cart', { page, page_size: 20 }],
    queryFn: () => cartApi.list({ page, page_size: 20 }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Cart Items" description="View shopping cart items" />

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : data?.results?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No cart items found
                </TableCell>
              </TableRow>
            ) : (
              data?.results?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.cart_user_username || `User #${item.cart_user}`}</TableCell>
                  <TableCell>{item.cart_product}</TableCell>
                  <TableCell>{item.cart_quantity}</TableCell>
                  <TableCell>{item.cart_status ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>{formatDate(item.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.count > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.count)} of {data.count} items
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!data.previous}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!data.next}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


