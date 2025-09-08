'use client';

import { Dispatch, SetStateAction, useState } from 'react';
import {
  Lock,
  Settings,
  ChevronDown,
  LucideIcon,
  ShoppingBasket,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { UserProfile } from '@/components/ui/user-profile';
import { Can } from '@/components/auth/can';
import { useAuth } from '@/lib/auth-context';

type SubNavItem = {
  href: string;
  label: string;
  active?: boolean;
  permission?: string;
};

type NavItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  subItems?: SubNavItem[];
  group?: string;
};

const Sidebar = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  const t = useTranslations('Sidebar');
  const [openItems, setOpenItems] = useState<string[]>([]);
  const pathname = usePathname();
  const { permissions } = useAuth();

  const sidebarNavItems: NavItem[] = [
    {
      label: t('Dashboard'),
      icon: Home,
      group: 'Overview',
      subItems: [
        { href: '/', label: t('home') },
        { href: '/dashboard', label: t('Dashboard') },
      ],
    },
    {
      label: t('Store Management'),
      icon: ShoppingBasket,
      group: 'Product',
      subItems: [
        { href: '/menu-items', label: t('menu_items'), permission: 'menu:read' },
        { href: '/menu-types', label: t('menu_types'), permission: 'menu-type:read' },
        { href: '/tables', label: t('tables'), permission: 'table:read' },
        { href: '/orders', label: t('orders'), permission: 'order:read' },
      ],
    },
    {
      label: t('Authentication'),
      icon: Lock,
      group: 'Core Administration',
      subItems: [
        { href: '/system-users', label: t('system_users'), permission: 'user:read' },
        { href: '/role', label: t('role'), permission: 'role:read' },
        { href: '/permissions', label: t('role_permission'), permission: 'permission:read' },
      ],
    },
    {
      label: t('Interface Settings'),
      icon: Settings,
      group: 'Core Administration',
      subItems: [
        { href: '/banners', label: t('banner'), permission: 'banner:read' },
        { href: '/general-settings', label: t('setting'), permission: 'general-setting:read' }
      ],
    },
  ];

  const toggleItem = (label: string) => {
    setOpenItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const canViewParent = (subItems: SubNavItem[] | undefined) => {
    if (!subItems) return false;
    return subItems.some(subItem => 
      !subItem.permission || permissions.has(subItem.permission)
    );
  };

  // --- THE FIX: A SMARTER FUNCTION TO CHECK FOR ACTIVE LINKS ---
  const isLinkActive = (href: string) => {
    // Special case for the home/root link: it should only be active if the pathname is EXACTLY "/"
    if (href === '/') {
      return pathname === href;
    }
    // For all other links, the original logic is fine.
    return pathname.startsWith(href);
  };
  // --- END OF FIX ---

  return (
    <aside
      className={cn(
        'fixed z-50 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 ease-in-out',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <nav className="flex-1 space-y-2 p-4 text-sm font-medium overflow-y-auto">
        <UserProfile/>
        <ul>
          {sidebarNavItems.map((item, index) => {
            if (item.subItems && !canViewParent(item.subItems)) {
              return null;
            }

            const prevGroup = index > 0 ? sidebarNavItems[index - 1]?.group : undefined;
            // Use the new, smarter active check function
            const hasActiveSubItem = item.subItems?.some(sub => isLinkActive(sub.href)) ?? false;
            const isOpen = openItems.includes(item.label);
            const sectionId = `sidebar-section-${item.label.toLowerCase().replace(/\s+/g, '-')}`;

            return (
              <li key={item.label} className="py-1">
                {item.group && item.group !== prevGroup && (
                  <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.group}
                  </div>
                )}
                <>
                  <button
                    id={`${sectionId}-button`}
                    aria-expanded={isOpen}
                    aria-controls={sectionId}
                    onClick={() => toggleItem(item.label)}
                    className={cn(
                      'cursor-pointer flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors duration-200 hover:bg-accent hover:text-accent-foreground',
                      hasActiveSubItem && 'bg-primary/10'
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className={cn('mr-3 h-5 w-5', hasActiveSubItem ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn(hasActiveSubItem && 'text-primary font-semibold')}>{item.label}</span>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 transform duration-300', isOpen ? 'rotate-0' : '-rotate-90')} />
                  </button>
                  <div
                    id={sectionId}
                    role="region"
                    aria-labelledby={`${sectionId}-button`}
                    className={cn('grid transition-[grid-template-rows] duration-300 ease-in-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <ul className="pl-6 pt-2 space-y-1">
                        {item.subItems?.map((subItem) => (
                          <Can key={subItem.href} requiredPermissions={subItem.permission ? [subItem.permission] : []}>
                            <li>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  'block rounded-md px-3 py-2 transition-colors duration-200',
                                  // Use the new, smarter active check function here as well
                                  isLinkActive(subItem.href)
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                              >
                                {subItem.label}
                              </Link>
                            </li>
                          </Can>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;