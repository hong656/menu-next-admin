'use-client';

import {
  LogOut,
  User2,
  Settings,
  Paintbrush,
  CircleUser,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal, // 1. Import the Portal component
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { ConfirmationDialog } from './confirmation-dialog';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function UserProfile() {
  const t = useTranslations('UserProfile');
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const fallbackInitial = user?.username?.charAt(0).toUpperCase() || 'A';

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-auto w-full items-center justify-between p-2 text-left"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage alt={user?.username} />
                <AvatarFallback>{fallbackInitial}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {user?.username || 'Admin'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.email || '@tele_med_admin'}
                </span>
              </div>
            </div>
            {isDropdownOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
          <DropdownMenuContent
            className="w-60"
            side="right" // Position it to the right of the trigger
            align="start" // Align its top edge with the trigger's top edge
            sideOffset={20} // Add a small gap between the sidebar and the menu
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.username || 'Admin'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'admin@example.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User2 className="mr-2 h-4 w-4" />
                <span>{t('profile')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CircleUser className="mr-2 h-4 w-4" />
              <span>{t('account')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t('settings')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Paintbrush className="mr-2 h-4 w-4" />
              <span>{t('theme')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsLogoutConfirmOpen(true)}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>

      <ConfirmationDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={logout}
        title="Are you sure you want to logout?"
        description="You will be returned to the login page."
        confirmText="Logout"
        cancelText="Cancel"
      />
    </>
  );
}