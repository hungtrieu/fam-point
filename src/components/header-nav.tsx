'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type HeaderNavProps = {
  role: 'parent' | 'child';
};

export function HeaderNav({ role }: HeaderNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const parentNavItems = [
    {
      href: `/dashboard?role=parent`,
      label: 'Bảng điều khiển',
    },
    {
      href: `/dashboard/tasks?role=parent`,
      label: 'Quản lý công việc',
    },
    {
      href: `/dashboard/rewards?role=parent`,
      label: 'Quản lý quà',
    },
    {
      href: `/dashboard/children?role=parent`,
      label: 'Quản lý con',
    },
  ];

  const childNavItems = [
    {
      href: `/dashboard?role=child`,
      label: 'Bảng điều khiển',
    },
    {
      href: `/dashboard/rewards?role=child`,
      label: 'Cửa hàng quà',
    },
    {
      href: `/dashboard/history?role=child`,
      label: 'Lịch sử điểm',
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
    <>
      {navItems.map((item) => {
        const url = createUrl(item.href);
        const [pathOnly] = item.href.split('?');
        const isActive = pathname === pathOnly;
        
        return (
          <Link
            key={item.label}
            href={url}
            className={cn(
              "transition-colors hover:text-foreground",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
          >
           {item.label}
          </Link>
        );
      })}
    </>
  );
}
