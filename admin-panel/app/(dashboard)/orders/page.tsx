'use client';

import React, { useMemo, useState } from 'react';
import { useOrders, useDeleteOrder } from '@/lib/hooks/useOrders';
import { useQuery } from '@tanstack/react-query';
import { productLeadsApi } from '@/lib/api';
import type { ProductLead } from '@/lib/api/product-leads';
import type { Order } from '@/types/order';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Trash2,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Building2,
  Package,
  QrCode,
  ShoppingCart,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency, getMediaUrl } from '@/lib/utils/formatters';
import Link from 'next/link';
import { MediaImage } from '@/components/ui/media-image';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import apiClient from '@/lib/api/client';
import { getFullUrl, API_ENDPOINTS } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';

type OrderRow = { type: 'order'; data: Order };
type LeadRow = { type: 'lead'; data: ProductLead };
type UnifiedRow = OrderRow | LeadRow;

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const ROW_ID = (row: UnifiedRow) =>
  row.type === 'order' ? `order-${row.data.id}` : `lead-${row.data.id}`;

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    page: 1,
    page_size: 100,
  });
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['product-leads', { page: 1, page_size: 100 }],
    queryFn: () => productLeadsApi.list({ page: 1, page_size: 100 }),
  });

  const mergedRows = useMemo((): UnifiedRow[] => {
    const orders: OrderRow[] = (ordersData?.results ?? []).map((data) => ({
      type: 'order',
      data,
    }));
    const leads: LeadRow[] = (leadsData?.results ?? []).map((data) => ({
      type: 'lead',
      data,
    }));
    const all: UnifiedRow[] = [...orders, ...leads];
    all.sort((a, b) => {
      const dateA =
        a.type === 'order'
          ? a.data.order_date || a.data.created_at
          : a.data.created_at;
      const dateB =
        b.type === 'order'
          ? b.data.order_date || b.data.created_at
          : b.data.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    return all;
  }, [ordersData?.results, leadsData?.results]);

  const totalCount = (ordersData?.count ?? 0) + (leadsData?.count ?? 0);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return mergedRows.slice(start, start + pageSize);
  }, [mergedRows, page, pageSize]);

  const deleteOrder = useDeleteOrder();
  const queryClient = useQueryClient();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedLead, setSelectedLead] = useState<ProductLead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsType, setDetailsType] = useState<'order' | 'lead'>('order');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

  const isLoading = ordersLoading || leadsLoading;

  const handleDeleteClick = (id: number) => {
    setOrderToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (orderToDelete) {
      await deleteOrder.mutateAsync(orderToDelete);
      setOrderToDelete(null);
    }
  };

  const handleViewDetails = (row: UnifiedRow) => {
    if (row.type === 'order') {
      setSelectedOrder(row.data);
      setSelectedLead(null);
      setDetailsType('order');
    } else {
      setSelectedLead(row.data);
      setSelectedOrder(null);
      setDetailsType('lead');
    }
    setIsDetailsOpen(true);
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await apiClient.patch(getFullUrl(API_ENDPOINTS.order(orderId)), {
        order_status: newStatus,
      });
      toast.success('Order status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsDetailsOpen(false);
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const UserDetailsRow = ({
    userId,
    rowId,
  }: {
    userId: number;
    rowId: string;
  }) => {
    const { data: userData, isLoading: userLoading } = useQuery({
      queryKey: ['user', userId],
      queryFn: () => usersApi.get(userId),
      enabled: expandedRows.has(rowId),
    });

    if (userLoading) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/50">
            <div className="p-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (!userData) return null;

    return (
      <TableRow>
        <TableCell colSpan={8} className="bg-muted/50 p-0">
          <div className="p-4 border-t">
            <h4 className="font-semibold mb-3 text-sm">
              Customer Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">
                    {userData.email || '-'}
                  </p>
                </div>
              </div>
              {userData.phone_number && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">
                      {userData.phone_number}
                    </p>
                  </div>
                </div>
              )}
              {(userData.first_name || userData.last_name) && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">
                      {`${userData.first_name || ''} ${userData.last_name || ''}`.trim() ||
                        '-'}
                    </p>
                  </div>
                </div>
              )}
              {userData.company_name && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm font-medium">
                      {userData.company_name}
                    </p>
                  </div>
                </div>
              )}
              {userData.address && (
                <div className="flex items-start gap-2 md:col-span-2 lg:col-span-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">{userData.address}</p>
                  </div>
                </div>
              )}
              {userData.gst && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">GST</p>
                    <p className="text-sm font-medium">{userData.gst}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t">
              <Link
                href={`/users/${userData.id}`}
                className="text-sm text-primary hover:underline"
              >
                View full user profile →
              </Link>
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const LeadDetailsRow = ({ lead, rowId }: { lead: ProductLead; rowId: string }) => {
    if (!expandedRows.has(rowId)) return null;
    return (
      <TableRow>
        <TableCell colSpan={8} className="bg-muted/50 p-0">
          <div className="p-4 border-t">
            <h4 className="font-semibold mb-3 text-sm">
              QR Lead – Full details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="text-sm font-medium">{lead.company_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{lead.phone_number}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Product</p>
                  <p className="text-sm font-medium">
                    {lead.product_name ?? `#${lead.product}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <p className="text-xs text-muted-foreground">Quantity</p>
                <p className="text-sm font-medium">{lead.quantity ?? 1}</p>
              </div>
              {lead.user_name && (
                <div className="flex items-start gap-2">
                  <p className="text-xs text-muted-foreground">Contact name</p>
                  <p className="text-sm font-medium">{lead.user_name}</p>
                </div>
              )}
              {lead.email && (
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{lead.email}</p>
                  </div>
                </div>
              )}
              {lead.gst && (
                <div className="flex items-start gap-2">
                  <p className="text-xs text-muted-foreground">GST</p>
                  <p className="text-sm font-medium">{lead.gst}</p>
                </div>
              )}
              {lead.address && (
                <div className="flex items-start gap-2 md:col-span-2 lg:col-span-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">{lead.address}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <p className="text-xs text-muted-foreground">Submitted by</p>
                <p className="text-sm font-medium">
                  {lead.submitted_by_username ?? `User #${lead.submitted_by}`}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {formatDate(lead.created_at)}
                </p>
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="All orders and leads in one place: app orders and QR code scan leads"
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Type</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Customer / Company</TableHead>
              <TableHead>Product / Items</TableHead>
              <TableHead>Price / Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-6" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  No orders or leads found
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => {
                const rowId = ROW_ID(row);
                const isExpanded = expandedRows.has(rowId);
                if (row.type === 'order') {
                  const order = row.data;
                  return (
                    <React.Fragment key={rowId}>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleRowExpansion(rowId)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <ShoppingCart className="h-3 w-3" />
                            App order
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          {order.order_user_username ??
                            `User #${order.order_user}`}
                        </TableCell>
                        <TableCell>
                          {order.items_count ?? 0} items
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(
                            order.order_total_price || order.order_price
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusColors[order.order_status] ?? ''
                            }
                          >
                            {order.order_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(
                            order.order_date || order.created_at
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(row)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(order.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <UserDetailsRow
                          userId={order.order_user}
                          rowId={rowId}
                        />
                      )}
                    </React.Fragment>
                  );
                }
                const lead = row.data;
                return (
                  <React.Fragment key={rowId}>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleRowExpansion(rowId)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <QrCode className="h-3 w-3" />
                          QR lead
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">#{lead.id}</TableCell>
                      <TableCell>{lead.company_name}</TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {lead.product_name ?? `#${lead.product}`}
                      </TableCell>
                      <TableCell>Qty {lead.quantity ?? 1}</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>
                        {formatDate(lead.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(row)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <LeadDetailsRow lead={lead} rowId={rowId} />
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalCount > pageSize && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, mergedRows.length)} of {mergedRows.length}{' '}
            total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= mergedRows.length}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailsType === 'order'
                ? `Order #${selectedOrder?.id} Details`
                : `QR Lead #${selectedLead?.id} Details`}
            </DialogTitle>
            <DialogDescription>
              {detailsType === 'order'
                ? 'View and manage order information'
                : 'Lead submitted from QR code scan'}
            </DialogDescription>
          </DialogHeader>

          {detailsType === 'order' && selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {selectedOrder.order_user_username}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">
                    {formatDate(
                      selectedOrder.order_date || selectedOrder.created_at
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Price</p>
                  <p className="font-medium text-lg">
                    {formatCurrency(
                      selectedOrder.order_total_price ||
                        selectedOrder.order_price
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Select
                    value={selectedOrder.order_status}
                    onValueChange={(value) =>
                      handleStatusUpdate(selectedOrder.id, value)
                    }
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedOrder.order_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted p-3 rounded">
                    {selectedOrder.order_notes}
                  </p>
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                {selectedOrder.order_items &&
                selectedOrder.order_items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.order_items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 border rounded"
                      >
                        {item.product_image && (
                          <MediaImage
                            src={getMediaUrl(item.product_image)}
                            alt={item.product_name}
                            width={60}
                            height={60}
                            className="h-[60px] w-[60px]"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} ×{' '}
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(
                              Number(item.price) * item.quantity
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No items in this order
                  </p>
                )}
              </div>
            </div>
          )}

          {detailsType === 'lead' && selectedLead && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{selectedLead.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedLead.phone_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">
                    {selectedLead.product_name ?? `#${selectedLead.product}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{selectedLead.quantity ?? 1}</p>
                </div>
                {selectedLead.user_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Contact name
                    </p>
                    <p className="font-medium">{selectedLead.user_name}</p>
                  </div>
                )}
                {selectedLead.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedLead.email}</p>
                  </div>
                )}
                {selectedLead.gst && (
                  <div>
                    <p className="text-sm text-muted-foreground">GST</p>
                    <p className="font-medium">{selectedLead.gst}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Submitted by</p>
                  <p className="font-medium">
                    {selectedLead.submitted_by_username ??
                      `User #${selectedLead.submitted_by}`}
                  </p>
                </div>
                {selectedLead.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedLead.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {formatDate(selectedLead.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Updated</p>
                  <p className="font-medium">
                    {formatDate(selectedLead.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Order"
        description="Are you sure you want to delete this order? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        isLoading={deleteOrder.isPending}
      />
    </div>
  );
}
