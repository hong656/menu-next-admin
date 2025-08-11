'use client';

import { useState } from 'react';
import {
  Lock,
  Settings,
  AppWindow,
  ChevronDown,
  ChevronRight,
  LucideIcon,
  ShoppingBasket,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link'; // Use Next.js Link component for client-side navigation
import { usePathname } from 'next/navigation';

type SubNavItem = {
  href: string;
  label: string;
  active?: boolean;
};

type NavItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  subItems?: SubNavItem[];
  group?: string; // Optional small header shown above contiguous items in the same group
};

const sidebarNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/',
    group: 'Overview',
  },
  {
    label: 'Menu Management',
    icon: ShoppingBasket,
    group: 'Product',
    subItems: [
      { href: '/menu-items', label: 'Menu Items' },
      { href: '#', label: 'Categories' },
      { href: '#', label: 'Pricing' },
    ],
  },
  {
    label: 'Authentication',
    icon: Lock,
    group: 'Core Administration',
    subItems: [
      { href: '#', label: 'Role & Permission' },
      { href: '/system-users', label: 'System Users'},
    ],
  },
  {
    label: 'Platform Settings',
    icon: Settings,
    group: 'Core Administration',
    subItems: [
      { href: '#', label: 'Web Colors Theme' },
      { href: '#', label: 'General Settings' },
    ],
  },
  {
    label: 'App Management',
    icon: AppWindow,
    group: 'Core Administration',
    subItems: [
      { href: '#', label: 'App Banner' },
      { href: '#', label: 'App Configuration' },
      { href: '#', label: 'Push Notifications Log' },
      { href: '#', label: 'App Download Links' },
    ],
  },
];

const Sidebar = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleItem = (label: string) => {
    setOpenItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      <nav className="flex-1 space-y-2 p-4 text-sm font-medium">
        <ul>
          {sidebarNavItems.map((item, index) => {
            const prevGroup = index > 0 ? sidebarNavItems[index - 1]?.group : undefined;
            const hasActiveSubItem = item.subItems?.some((sub) =>
              pathname === sub.href || pathname.startsWith(`${sub.href}/`)
            ) ?? false;

            const isOpen = openItems.includes(item.label) || hasActiveSubItem;
            const isTopLevelActive = !!item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`));

            return (
              <li key={item.label} className="py-1">
                {item.group && item.group !== prevGroup && (
                  <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase text-gray-400 tracking-wide">
                    {item.group}
                  </div>
                )}
                {item.subItems ? (
                  <>
                    <button
                      onClick={() => toggleItem(item.label)}
                      className={cn(
                        'cursor-pointer flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-gray-100 transition-colors',
                        hasActiveSubItem && 'bg-blue-50'
                      )}
                    >
                      <div className="flex items-center">
                        <item.icon className={cn('mr-3 h-5 w-5', hasActiveSubItem ? 'text-blue-600' : 'text-gray-500')} />
                        <span className={cn('text-gray-700', hasActiveSubItem && 'text-blue-700 font-semibold')}>{item.label}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transform transition-transform duration-500 text-gray-500',
                          isOpen && 'rotate-0',
                          !isOpen && '-rotate-90'
                        )}
                      />
                    </button>
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-500 ease-in-out',
                        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      )}
                    >
                      <ul className="pl-6 pt-2 space-y-1">
                        {item.subItems.map((subItem) => {
                          const isSubActive = pathname === subItem.href || pathname.startsWith(`${subItem.href}/`);
                          return (
                            <li key={subItem.label}>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  'block rounded-md px-3 py-2 transition-colors',
                                  isSubActive
                                    ? 'bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200'
                                    : 'text-gray-600 hover:bg-gray-100'
                                )}
                              >
                                {subItem.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href || '#'}
                    className={cn(
                      'flex items-center justify-between rounded-md px-3 py-2 transition-colors',
                      isTopLevelActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className={cn('mr-3 h-5 w-5', isTopLevelActive ? 'text-blue-600' : 'text-gray-500')} />
                      <span className={cn(isTopLevelActive && 'font-semibold')}>{item.label}</span>
                    </div>
                    <ChevronRight className={cn('h-4 w-4', isTopLevelActive ? 'text-blue-600' : 'text-gray-500')} />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;