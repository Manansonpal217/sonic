'use client';

import React, { useState } from 'react';
import { useOrders, useDeleteOrder } from '@/lib/hooks/useOrders';
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
import { Eye, Trash2, ChevronDown, ChevronRight, Mail, Phone, MapPin, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency, getMediaUrl } from '@/lib/utils/formatters';
import Link from 'next/link';
import Image from 'next/image';
import apiClient from '@/lib/api/client';
import { getFullUrl, API_ENDPOINTS } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders({ page, page_size: 20 });
  const deleteOrder = useDeleteOrder();
  const queryClient = useQueryClient();
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this order?')) {
      await deleteOrder.mutateAsync(id);
    }
  };
  
  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
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

  const toggleRowExpansion = (orderId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Component to fetch and display user details
  const UserDetailsRow = ({ userId, orderId }: { userId: number; orderId: number }) => {
    const { data: userData, isLoading: userLoading } = useQuery({
      queryKey: ['user', userId],
      queryFn: () => usersApi.get(userId),
      enabled: expandedRows.has(orderId),
    });

    if (userLoading) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/50">
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
        <TableCell colSpan={7} className="bg-muted/50 p-0">
          <div className="p-4 border-t">
            <h4 className="font-semibold mb-3 text-sm">Customer Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{userData.email || '-'}</p>
                </div>
              </div>
              {userData.phone_number && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{userData.phone_number}</p>
                  </div>
                </div>
              )}
              {userData.first_name || userData.last_name ? (
                <div className="flex items-start gap-2">
                  <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">
                      {`${userData.first_name || ''} ${userData.last_name || ''}`.trim() || '-'}
                    </p>
                  </div>
                </div>
              ) : null}
              {userData.company_name && (
                <div className="flex items-start gap-2">
                  <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm font-medium">{userData.company_name}</p>
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
                  <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.results?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              data?.results?.map((order) => {
                const isExpanded = expandedRows.has(order.id);
                return (
                  <React.Fragment key={order.id}>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleRowExpansion(order.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          #{order.id}
                        </div>
                      </TableCell>
                      <TableCell>{order.order_user_username || `User #${order.order_user}`}</TableCell>
                      <TableCell>{order.items_count || 0} items</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(order.order_total_price || order.order_price)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.order_status] || ''}>
                          {order.order_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.order_date || order.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(order.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <UserDetailsRow userId={order.order_user} orderId={order.id} />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id} Details</DialogTitle>
            <DialogDescription>
              View and manage order information
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.order_user_username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{formatDate(selectedOrder.order_date || selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Price</p>
                  <p className="font-medium text-lg">
                    {formatCurrency(selectedOrder.order_total_price || selectedOrder.order_price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Select
                    value={selectedOrder.order_status}
                    onValueChange={(value) => handleStatusUpdate(selectedOrder.id, value)}
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
              
              {/* Order Notes */}
              {selectedOrder.order_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted p-3 rounded">{selectedOrder.order_notes}</p>
                </div>
              )}
              
              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.order_items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 border rounded">
                        {item.product_image && (
                          <Image
                            src={getMediaUrl(item.product_image) || ''}
                            alt={item.product_name}
                            width={60}
                            height={60}
                            className="rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No items in this order</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
