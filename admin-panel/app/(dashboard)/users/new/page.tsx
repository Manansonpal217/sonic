'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCreateUser } from '@/lib/hooks/useUsers';
import { PageHeader } from '@/components/layout/PageHeader';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const userSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string().min(1, 'Please confirm your password'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
});

type UserFormData = z.infer<typeof userSchema>;

export default function NewUserPage() {
  const router = useRouter();
  const createUser = useCreateUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      await createUser.mutateAsync(data);
      router.push('/users');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New User"
        description="Add a new user to the system"
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/users" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Enter the details for the new user</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  {...register('username')}
                  disabled={isSubmitting}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirm">Confirm Password *</Label>
                <Input
                  id="password_confirm"
                  type="password"
                  {...register('password_confirm')}
                  disabled={isSubmitting}
                />
                {errors.password_confirm && (
                  <p className="text-sm text-red-500">{errors.password_confirm.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  {...register('first_name')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  {...register('last_name')}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-lg" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


