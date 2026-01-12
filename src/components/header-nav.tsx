'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import {
  LayoutDashboard,
  ClipboardList,
  Gift,
  History,
  Users,
} from 'lucide-react';


type HeaderNavProps = {
  mobile?: boolean;
};

export function HeaderNav({ mobile = false }: HeaderNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || 'child';

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

  const linkClasses = (isActive: boolean) =>
    cn(
      'transition-colors hover:text-foreground',
      isActive ? 'text-foreground' : 'text-muted-foreground',
      mobile && 'flex items-center gap-4 px-2.5'
    );

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link key={item.label} href={item.href} className={linkClasses(isActive)}>
            {mobile && <item.icon className="h-5 w-5" />}
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
