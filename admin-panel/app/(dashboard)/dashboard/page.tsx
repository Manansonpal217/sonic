'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, ShoppingCart, DollarSign, UserCheck } from 'lucide-react';
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

  const { data: pendingUsersData, isLoading: pendingLoading } = useQuery({
    queryKey: ['users', 'pending'],
    queryFn: () => usersApi.list({ page_size: 1, is_approved: false }),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'stats'],
    queryFn: () => productsApi.list({ page_size: 1 }),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: () => ordersApi.list({ page_size: 1 }),
  });

  const { data: allOrdersData, isLoading: allOrdersLoading } = useQuery({
    queryKey: ['orders', 'revenue'],
    queryFn: async () => {
      const response = await ordersApi.list({ page_size: 10000 });
      return response;
    },
  });

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
    { title: 'Total Users', value: usersData?.count ?? 0, icon: Users, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Total Products', value: productsData?.count ?? 0, icon: Package, color: 'text-chart-2', bgColor: 'bg-chart-2/10' },
    { title: 'Total Orders', value: ordersData?.count ?? 0, icon: ShoppingCart, color: 'text-chart-4', bgColor: 'bg-chart-4/10' },
    { title: 'Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-chart-5', bgColor: 'bg-chart-5/10', isLoading: allOrdersLoading },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome to the Inara Admin Panel. Here&apos;s an overview of your business.</p>
      </div>

      {pendingUsersData && pendingUsersData.count > 0 && (
        <Link href="/users?pending=1">
          <Card className="group cursor-pointer border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-50/50 hover:from-amber-100/80 hover:to-amber-50/80 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">Pending user approvals</CardTitle>
              <UserCheck className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-amber-800">{pendingUsersData?.count ?? 0}</div>
                  <p className="text-xs text-amber-700 mt-1">New signups waiting for approval →</p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isLoading =
            (stat.isLoading !== undefined ? stat.isLoading : false) ||
            usersLoading ||
            productsLoading ||
            ordersLoading;

          return (
            <Card key={stat.title} className="border-border/80 transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <p className="text-sm text-muted-foreground">Track your latest admin actions and updates</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-4 text-muted-foreground">Recent activity will be displayed here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
