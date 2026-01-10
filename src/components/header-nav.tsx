'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ClipboardList,
  Gift,
  History,
  Users,
} from 'lucide-react';


type HeaderNavProps = {
  role: 'parent' | 'child';
  mobile?: boolean;
};

export function HeaderNav({ role, mobile = false }: HeaderNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const parentNavItems = [
    {
      href: `/dashboard?role=parent`,
      label: 'Bảng điều khiển',
      icon: LayoutDashboard,
    },
    {
      href: `/dashboard/tasks?role=parent`,
      label: 'Quản lý công việc',
      icon: ClipboardList,
    },
    {
      href: `/dashboard/rewards?role=parent`,
      label: 'Quản lý quà',
      icon: Gift,
    },
    {
      href: `/dashboard/children?role=parent`,
      label: 'Quản lý con',
      icon: Users,
    },
  ];

  const childNavItems = [
    {
      href: `/dashboard?role=child`,
      label: 'Bảng điều khiển',
      icon: LayoutDashboard,
    },
    {
      href: `/dashboard/rewards?role=child`,
      label: 'Cửa hàng quà',
      icon: Gift,
    },
    {
      href: `/dashboard/history?role=child`,
      label: 'Lịch sử điểm',
      icon: History,
    },
  ];

  const navItems = role === 'parent' ? parentNavItems : childNavItems;

  const createUrl = (baseHref: string) => {
    const params = new URLSearchParams(searchParams);
    const [path, query] = baseHref.split('?');
    if (query) {
      new URLSearchParams(query).forEach((value, key) => {
        params.set(key, value);
      });
    }
    // ensure role is preserved
    if (!params.has('role')) {
        params.set('role', role);
    }
    return `${path}?${params.toString()}`;
  };

  const linkClasses = (isActive: boolean) =>
    cn(
      'transition-colors hover:text-foreground',
      isActive ? 'text-foreground' : 'text-muted-foreground',
      mobile && 'flex items-center gap-4 px-2.5'
    );

  return (
    <>
      {navItems.map((item) => {
        const url = createUrl(item.href);
        const [pathOnly] = item.href.split('?');
        const isActive = pathname === pathOnly;

        return (
          <Link key={item.label} href={url} className={linkClasses(isActive)}>
            {mobile && <item.icon className="h-5 w-5" />}
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
