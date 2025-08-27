'use client';

import { ChevronRight, Book, LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from './button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ModeToggle } from '../mode-toggle';
import { cn } from '@/lib/utils';
import {useTranslations} from 'next-intl';
import LocaleSwitcher from '../button-lan';

interface HeaderProps {
  isSidebarOpen: boolean;
  // Using a simpler function type for the setter
  setIsSidebarOpen: (open: boolean) => void;
}

const Header = ({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) => {
  const t = useTranslations('Header');
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const segments = pathname?.split('/').filter(Boolean) ?? [];
  const formatLabel = (value: string) =>
    value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    return {
      href,
      label: formatLabel(segment),
      isLast: index === segments.length - 1,
    };
  });

  return (
    <header
      className={cn(
        'fixed z-40 top-0 right-0 flex h-16 items-center justify-between border-b border-border bg-background px-6 transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'left-64' : 'left-0'
      )}
    >
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="mr-1 cursor-pointer"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <nav className="flex items-center text-sm font-medium text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          {crumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center">
              <ChevronRight className="mx-2 h-4 w-4" />
              {crumb.isLast ? (
                <span className="text-foreground">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        <ModeToggle />
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{user?.username || 'User'}</span>
        </div>
        <LocaleSwitcher />
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('logout')}</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;