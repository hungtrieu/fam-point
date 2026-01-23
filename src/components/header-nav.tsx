'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import {
  ClipboardList,
  Gift,
  History,
  Users,
  CalendarDays,
  BookOpen,
  Bell,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

type HeaderNavProps = {
  mobile?: boolean;
};

export function HeaderNav({ mobile = false }: HeaderNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || 'child';

  const menuGroups = [
    {
      label: 'Việc nhà',
      items: [
        { href: `/tasks`, label: 'Danh sách công việc', icon: ClipboardList },
        { href: `/rewards`, label: role === 'parent' ? 'Quà tặng' : 'Cửa hàng quà', icon: Gift },
        { href: `/schedules`, label: 'Lịch trình', icon: CalendarDays },
      ]
    },
    {
      label: 'Học tập',
      items: [
        { href: `/study-schedules`, label: 'Thời khóa biểu', icon: BookOpen },
        { href: `/reminders`, label: role === 'parent' ? 'Nhắc nhở' : 'Lời nhắn', icon: Bell },
      ]
    },
    {
      label: 'Thành viên',
      href: `/members`,
      icon: Users,
      show: role === 'parent'
    },
    {
      label: 'Lịch sử',
      href: `/history`,
      icon: History,
      show: role === 'child'
    }
  ];

  const linkClasses = (isActive: boolean) =>
    cn(
      'transition-colors hover:text-foreground shrink-0 flex items-center gap-1',
      isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
      mobile && 'flex items-center gap-4 px-2.5 py-4 border-b w-full'
    );

  if (mobile) {
    return (
      <>
        {menuGroups.map((group) => {
          if (group.show === false) return null;
          if (group.items) {
            return group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={linkClasses(isActive)}>
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            });
          }
          const isActive = pathname === group.href;
          return (
            <Link key={group.href} href={group.href!} className={linkClasses(isActive)}>
              {group.icon && <group.icon className="h-5 w-5" />}
              {group.label}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      {menuGroups.map((group) => {
        if (group.show === false) return null;

        if (group.items) {
          const isGroupActive = group.items.some(item => pathname === item.href);

          return (
            <DropdownMenu key={group.label}>
              <DropdownMenuTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1 cursor-pointer transition-colors hover:text-foreground outline-none",
                  isGroupActive ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {group.label}
                  <ChevronDown className="h-3 w-3" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <DropdownMenuItem className={cn(
                      "cursor-pointer font-sans whitespace-nowrap",
                      pathname === item.href && "bg-accent text-accent-foreground"
                    )}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        const isActive = pathname === group.href;
        return (
          <Link key={group.label} href={group.href!} className={linkClasses(isActive)}>
            {group.label}
          </Link>
        );
      })}
    </>
  );
}
