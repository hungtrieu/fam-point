'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function NotificationBell() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const pathname = usePathname();

    const fetchUnreadCount = async () => {
        if (!user?.familyId || !user?.id) return;
        try {
            const res = await fetch(`/api/reminders?familyId=${user.familyId}&userId=${user.id}&unreadOnly=true`);
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.length);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();

        // Listen for manual mark-as-read events from the reminders page
        window.addEventListener('reminderMarkedRead', fetchUnreadCount);

        // Poll every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('reminderMarkedRead', fetchUnreadCount);
        };
    }, [user?.familyId, user?.id, pathname]);

    if (!user) return null;

    return (
        <Link
            href="/reminders?filter=unread"
            className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
        >
            <Bell className={cn(
                "h-5 w-5 transition-colors",
                unreadCount > 0 ? "text-orange-500 fill-orange-50" : "text-slate-600 dark:text-slate-400"
            )} />
            {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background animate-in zoom-in duration-300">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
            <span className="sr-only">Thông báo ({unreadCount} chưa đọc)</span>
        </Link>
    );
}
