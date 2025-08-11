'use client';

import { ChevronRight, Book, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from './button';
import Link from 'next/link';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <nav className="flex items-center text-sm font-medium text-gray-500">
        <Book className="mx-2 h-4 w-4" />
        <Link href="/" className="hover:text-gray-700">
          Home
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-gray-800">Dashboard</span>
      </nav>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>{user?.username || 'User'}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;