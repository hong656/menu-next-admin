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
    group: 'Overview',
    subItems: [
      { href: '/', label: 'Home' },
      { href: '/dashboard', label: 'Dashboard' },
    ],
  },
  {
    label: 'Store Management',
    icon: ShoppingBasket,
    group: 'Product',
    subItems: [
      { href: '/menu-items', label: 'Menu Items' },
      { href: '/tables', label: 'Tables' },
      { href: '/orders', label: 'Orders' },
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
    label: 'Settings',
    icon: Settings,
    group: 'Core Administration',
    subItems: [
      { href: '#', label: 'General Settings' },
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
    <aside className="fixed z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-colors duration-500">
      <nav className="flex-1 space-y-2 p-4 text-sm font-medium">
        <ul>
          {sidebarNavItems.map((item, index) => {
            const prevGroup = index > 0 ? sidebarNavItems[index - 1]?.group : undefined;
            const hasActiveSubItem = item.subItems?.some((sub) =>
              pathname === sub.href || pathname.startsWith(`${sub.href}/`)
            ) ?? false;

            const isTopLevelActive = !!item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`));
            const isOpen = openItems.includes(item.label); // allow closing even if a subpath is active
            const sectionId = `sidebar-section-${item.label.toLowerCase().replace(/\s+/g, '-')}`;

            return (
              <li key={item.label} className="py-1">
                {item.group && item.group !== prevGroup && (
                  <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.group}
                  </div>
                )}
                {item.subItems ? (
                  <>
                    <button
                      id={`${sectionId}-button`}
                      aria-expanded={isOpen}
                      aria-controls={sectionId}
                      onClick={() => toggleItem(item.label)}
                      className={cn(
                        'cursor-pointer flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors duration-500 hover:bg-accent hover:text-accent-foreground',
                        hasActiveSubItem && 'bg-primary/10'
                      )}
                    >
                      <div className="flex items-center">
                        <item.icon className={cn('mr-3 h-5 w-5', hasActiveSubItem ? 'text-primary' : 'text-muted-foreground')} />
                        <span className={cn(hasActiveSubItem && 'text-primary font-semibold')}>{item.label}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transform duration-300 text-muted-foreground',
                          isOpen ? 'rotate-0' : '-rotate-90'
                        )}
                      />
                    </button>
                    <div
                      id={sectionId}
                      role="region"
                      aria-labelledby={`${sectionId}-button`}
                      className={cn(
                        'grid transition-[grid-template-rows] duration-300 ease-in-out',
                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      )}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <ul className="pl-6 pt-2 space-y-1">
                          {item.subItems.map((subItem) => {
                            const isSubActive = pathname === subItem.href || pathname.startsWith(`${subItem.href}/`);
                            return (
                              <li key={subItem.label}>
                                <Link
                                  href={subItem.href}
                                  className={cn(
                                    'block rounded-md px-3 py-2 transition-colors duration-500',
                                    isSubActive
                                      ? 'bg-primary/10 text-primary font-semibold'
                                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                  )}
                                >
                                  {subItem.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href || '#'}
                    className={cn(
                      'flex items-center justify-between rounded-md px-3 py-2 transition-colors duration-500',
                      isTopLevelActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className={cn('mr-3 h-5 w-5', isTopLevelActive ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn(isTopLevelActive && 'font-semibold')}>{item.label}</span>
                    </div>
                    <ChevronRight className={cn('h-4 w-4', isTopLevelActive ? 'text-primary' : 'text-muted-foreground')} />
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