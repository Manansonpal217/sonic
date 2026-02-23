'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productLeadsApi } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatDate } from '@/lib/utils/formatters';

export default function ProductLeadsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['product-leads', { page, page_size: pageSize }],
    queryFn: () => productLeadsApi.list({ page, page_size: pageSize }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Leads"
        description="Leads submitted from QR code scans by sales staff"
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Submitted by</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : data?.results?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No product leads found
                </TableCell>
              </TableRow>
            ) : (
              data?.results?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell className="max-w-[180px] truncate" title={item.product_name}>
                    {item.product_name || `#${item.product}`}
                  </TableCell>
                  <TableCell>{item.company_name}</TableCell>
                  <TableCell>{item.phone_number}</TableCell>
                  <TableCell>{item.quantity ?? 1}</TableCell>
                  <TableCell>
                    {item.user_name || item.email || '-'}
                  </TableCell>
                  <TableCell>{item.submitted_by_username || `User #${item.submitted_by}`}</TableCell>
                  <TableCell>{formatDate(item.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.count > pageSize && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.count)} of {data.count} leads
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!data.previous}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.next}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
