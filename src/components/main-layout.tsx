'use client';
import * as React from 'react';
import { Home, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';
import { HeaderNav } from '@/components/header-nav';
import { SidebarNav } from '@/components/sidebar-nav';
import { NotificationBell } from '@/components/notification-bell';
import Link from 'next/link';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from '@/components/ui/sheet';
import { AuthGuard } from '@/components/auth-guard';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

export function MainLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    return (
        <AuthGuard>
            <div className="flex min-h-screen w-full flex-col bg-background">
                <header className="sticky top-0 flex h-16 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6 z-40">
                    <div className="flex items-center gap-4 md:gap-8 w-full">
                        {/* Mobile Menu Trigger */}
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0"
                                    >
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Mở menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-72 p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                                    <SheetHeader className="sr-only">
                                        <SheetTitle>Menu điều hướng</SheetTitle>
                                        <SheetDescription>
                                            Truy cập các tính năng của {APP_NAME} trên điện thoại.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="flex h-16 items-center px-6 border-b">
                                        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-primary">
                                            <Home className="h-6 w-6" />
                                            <span className="font-bold text-xl tracking-tight">{APP_NAME}</span>
                                        </Link>
                                    </div>
                                    <div className="p-4">
                                        <SidebarNav role={user?.role || 'child'} />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-primary shrink-0">
                            <div className="bg-primary/10 p-1.5 rounded-lg">
                                <Home className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">{APP_NAME}</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium flex-1">
                            <HeaderNav />
                        </nav>

                        {/* User Profile */}
                        <div className="ml-auto flex items-center gap-2">
                            <NotificationBell />
                            <UserNav />
                        </div>
                    </div>
                </header>

                <main className="flex-1 md:p-8 p-4 bg-muted/20">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
