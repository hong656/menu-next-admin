'use client';

import { useAuth } from '@/lib/auth-context';
import { ReactNode } from 'react';

interface CanProps {
  children: ReactNode;
  requiredPermissions: string[];
}

export function Can({ children, requiredPermissions }: CanProps) {
  const { permissions } = useAuth();

  const hasPermission = requiredPermissions.every(permission => permissions.includes(permission));

  if (!hasPermission) {
    return null;
  }

  return <>{children}</>;
}
