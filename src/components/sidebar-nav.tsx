'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ClipboardList,
  Gift,
  History,
  Users,
} from 'lucide-react';
import Link from 'next/link';

type SidebarNavProps = {
  role: 'parent' | 'child';
};

export function SidebarNav({ role }: SidebarNavProps) {
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
      href: `/members?role=parent`,
      label: 'Quản lý thành viên',
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
    return `${path}?${params.toString()}`;
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const url = createUrl(item.href);
        const [pathOnly] = item.href.split('?');
        const isActive = pathname === pathOnly;

        return (
          <SidebarMenuItem key={item.label}>
            <Link href={url}>
              <SidebarMenuButton isActive={isActive} tooltip={item.label}>
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
