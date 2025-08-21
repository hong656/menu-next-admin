'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/ui/header';
import Sidebar from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-border"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div
        className={cn(
          'flex flex-1 flex-col pt-6 transition-[margin-left] duration-300 ease-in-out',
          isSidebarOpen ? 'ml-64' : 'ml-0'
        )}
      >
        <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 pt-12 p-6">{children}</main>
      </div>
    </div>
  );
}
