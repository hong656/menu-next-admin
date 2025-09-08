'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions: string[];
}

export default function ProtectedRoute({ children, requiredPermissions }: ProtectedRouteProps) {
  const { isAuthenticated, permissions, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait until authentication status is determined
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const hasPermission = requiredPermissions.every(permission => permissions.includes(permission));

    if (!hasPermission) {
      toast.error('Access Denied', {
        description: "You don't have permission to access this page.",
      });
      router.push('/dashboard');
    }
  }, [isAuthenticated, permissions, loading, requiredPermissions, router]);

  const hasRequiredPermissions = requiredPermissions.every(p => permissions.includes(p));

  if (loading || !isAuthenticated || !hasRequiredPermissions) {
    // Render nothing or a loading spinner while checking permissions
    return null;
  }

  return <>{children}</>;
}