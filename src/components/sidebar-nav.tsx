'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  ClipboardList,
  Gift,
  History,
  Users,
  CalendarDays,
  BookOpen,
  Bell,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

type SidebarNavProps = {
  role: 'parent' | 'child';
};

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sections = role === 'parent' ? [
    {
      label: 'Việc nhà',
      items: [
        { href: `/tasks`, label: 'Danh sách công việc', icon: ClipboardList },
        { href: `/rewards`, label: 'Quà tặng', icon: Gift },
        { href: `/schedules`, label: 'Lịch trình', icon: CalendarDays },
      ]
    },
    {
      label: 'Học tập',
      items: [
        { href: `/study-schedules`, label: 'Thời khóa biểu', icon: BookOpen },
        { href: `/reminders`, label: 'Nhắc nhở', icon: Bell },
      ]
    },
    {
      label: 'Thành viên',
      items: [
        { href: `/members`, label: 'Quản lý thành viên', icon: Users },
      ]
    }
  ] : [
    {
      label: 'Việc nhà',
      items: [
        { href: `/tasks`, label: 'Danh sách công việc', icon: ClipboardList },
        { href: `/rewards`, label: 'Cửa hàng quà', icon: Gift },
        { href: `/schedules`, label: 'Lịch trình việc', icon: CalendarDays },
        { href: `/history`, label: 'Lịch sử điểm', icon: History },
      ]
    },
    {
      label: 'Học tập',
      items: [
        { href: `/study-schedules`, label: 'Thời khóa biểu', icon: BookOpen },
        { href: `/reminders`, label: 'Lời nhắn của bố mẹ', icon: Bell },
      ]
    }
  ];

  const createUrl = (baseHref: string) => {
    const params = new URLSearchParams(searchParams);
    const [path, query] = baseHref.split('?');
    if (query) {
      new URLSearchParams(query).forEach((value, key) => {
        params.set(key, value);
      });
    }
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  };

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <Collapsible defaultOpen key={section.label} className="group/collapsible">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between px-4 py-1.5 cursor-pointer hover:bg-sidebar-accent/50 rounded-lg group transition-all duration-200">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 group-data-[state=open]/collapsible:text-primary group-data-[state=open]/collapsible:opacity-100 transition-all">
                {section.label}
              </span>
              <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenu className="mt-1">
              {section.items.map((item) => {
                const url = createUrl(item.href);
                const [pathOnly] = item.href.split('?');
                const isActive = pathname === pathOnly;

                return (
                  <SidebarMenuItem key={item.label}>
                    <Link href={url}>
                      <SidebarMenuButton isActive={isActive} tooltip={item.label}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
