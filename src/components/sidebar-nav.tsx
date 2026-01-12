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
      href: `/tasks`,
      label: 'Quản lý công việc',
      icon: ClipboardList,
    },
    {
      href: `/rewards`,
      label: 'Quản lý quà',
      icon: Gift,
    },
    {
      href: `/members`,
      label: 'Quản lý thành viên',
      icon: Users,
    },
  ];

  const childNavItems = [
    {
      href: `/tasks`,
      label: 'Danh sách công việc',
      icon: ClipboardList,
    },
    {
      href: `/rewards`,
      label: 'Cửa hàng quà',
      icon: Gift,
    },
    {
      href: `/history`,
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
