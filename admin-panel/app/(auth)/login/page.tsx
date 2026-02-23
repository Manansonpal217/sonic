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
import { Mail, Lock, ArrowRight } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding & gradient */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden bg-primary">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse 80% 80% at 20% 20%, rgba(255,255,255,0.2), transparent 50%), radial-gradient(ellipse 60% 60% at 80% 80%, rgba(255,255,255,0.15), transparent 40%)',
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.08)_0%,transparent_50%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-primary-foreground">
              Inara Admin
            </h1>
            <p className="mt-2 text-primary-foreground/85 text-lg max-w-sm">
              Manage your business, products, and orders in one place.
            </p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-sm font-medium">Streamlined dashboard analytics</p>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-sm font-medium">Secure admin access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">Inara Admin</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2>
              <p className="text-muted-foreground text-sm">
                Enter your credentials to access the admin panel
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="user_email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user_email"
                    type="email"
                    placeholder="admin@example.com"
                    className="h-11 pl-10 rounded-xl border-input bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/20"
                    {...register('user_email')}
                    disabled={isLoading}
                  />
                </div>
                {errors.user_email && (
                  <p className="text-sm text-destructive">{errors.user_email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="user_password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user_password"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 pl-10 rounded-xl border-input bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/20"
                    {...register('user_password')}
                    disabled={isLoading}
                  />
                </div>
                {errors.user_password && (
                  <p className="text-sm text-destructive">{errors.user_password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Protected by secure authentication
          </p>
        </div>
      </div>
    </div>
  );
}
