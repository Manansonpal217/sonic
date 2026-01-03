'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, ShoppingCart, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usersApi, productsApi, ordersApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/formatters';
import { useMemo } from 'react';

export default function DashboardPage() {
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => usersApi.list({ page_size: 1 }),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'stats'],
    queryFn: () => productsApi.list({ page_size: 1 }),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: () => ordersApi.list({ page_size: 1 }),
  });

  // Fetch all orders to calculate revenue
  const { data: allOrdersData, isLoading: allOrdersLoading } = useQuery({
    queryKey: ['orders', 'revenue'],
    queryFn: async () => {
      // Fetch all orders with a large page size
      const response = await ordersApi.list({ page_size: 10000 });
      return response;
    },
  });

  // Calculate total revenue from all orders
  const totalRevenue = useMemo(() => {
    if (!allOrdersData?.results) return 0;
    
    return allOrdersData.results.reduce((sum, order) => {
      const price = parseFloat(
        (order as any).order_total_price || order.order_price || '0'
      );
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  }, [allOrdersData]);

  const stats = [
    {
      title: 'Total Users',
      value: usersData?.count ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Products',
      value: productsData?.count ?? 0,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Orders',
      value: ordersData?.count ?? 0,
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      isLoading: allOrdersLoading,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the Sonic Admin Panel</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isLoading = 
            (stat.isLoading !== undefined ? stat.isLoading : false) ||
            usersLoading || 
            productsLoading || 
            ordersLoading;

          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Recent activity will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}


