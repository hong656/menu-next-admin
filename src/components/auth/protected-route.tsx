'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions: string[];
}

function AuthLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}

export default function ProtectedRoute({ children, requiredPermissions }: ProtectedRouteProps) {
  const { isAuthenticated, permissions, loading } = useAuth();
  const router = useRouter();

  const hasRequiredPermissions = requiredPermissions.every(permission => permissions.has(permission));

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!hasRequiredPermissions) {
      toast.error('Access Denied', {
        description: "You don't have permission to access this page.",
      });
      router.push('/dashboard');
    }
  }, [isAuthenticated, hasRequiredPermissions, loading, router]);
  if (loading || !isAuthenticated || !hasRequiredPermissions) {
    return <AuthLoading />;
  }

  return <>{children}</>;
}