'use client';
import React from 'react';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isLoading && !user && mounted) {
            // Redirect to login if not authenticated
            router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
        }
    }, [user, isLoading, router, pathname, mounted]);

    // Show nothing while loading or if not authenticated or not mounted
    if (!mounted || isLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <>{children}</>;
}
