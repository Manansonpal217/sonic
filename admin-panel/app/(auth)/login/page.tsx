'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from 'sonner';

const loginSchema = z.object({
  user_email: z.string().email('Invalid email address'),
  user_password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember_me: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      setUser(response.user || { email: data.user_email });
      setAuthenticated(true);
      toast.success('Login successful');
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const accentColor = '#7c2d28';
  const accentDark = '#6b2621';

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .login-submit-btn { background-color: ${accentColor} !important; box-shadow: 0 4px 14px rgba(124,45,40,0.35) !important; }
          .login-submit-btn:hover:not(:disabled) { background-color: ${accentDark} !important; box-shadow: 0 6px 20px rgba(124,45,40,0.4) !important; }
        `,
      }} />
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 sm:p-6">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'linear-gradient(to bottom right, rgba(161,161,170,0.35), transparent 50%, rgba(168,162,158,0.25))',
        }}
        aria-hidden
      />
      <div className="relative w-full max-w-[420px]">
        <div
          className="overflow-hidden rounded-2xl border-0 bg-white"
          style={{
            boxShadow: '0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div
            className="h-1 w-full"
            style={{
              background: `linear-gradient(to right, ${accentColor}, #8b3b30, ${accentDark})`,
            }}
          />
          <div className="flex flex-col gap-6 px-8 pt-8 pb-2 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                Sonic Admin Panel
              </h1>
              <p className="text-sm text-gray-500 sm:text-base">
                Enter your credentials to access the admin panel
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-5 px-8 pb-6 pt-2">
              <div className="space-y-2">
                <Label
                  htmlFor="user_email"
                  className="text-xs font-medium uppercase tracking-wider text-gray-600"
                >
                  Email
                </Label>
                <Input
                  id="user_email"
                  type="email"
                  placeholder="admin@example.com"
                  className="h-11 rounded-lg border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400"
                  {...register('user_email')}
                  disabled={isLoading}
                />
                {errors.user_email && (
                  <p className="text-sm text-red-600">{errors.user_email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="user_password"
                  className="text-xs font-medium uppercase tracking-wider text-gray-600"
                >
                  Password
                </Label>
                <Input
                  id="user_password"
                  type="password"
                  placeholder="••••••••"
                  className="h-11 rounded-lg border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400"
                  {...register('user_password')}
                  disabled={isLoading}
                />
                {errors.user_password && (
                  <p className="text-sm text-red-600">{errors.user_password.message}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col px-8 pb-8 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="login-submit-btn h-11 w-full rounded-lg font-medium text-white transition-all disabled:opacity-70"
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}


