import * as React from 'react';
import { Home } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';
import { HeaderNav } from '@/components/header-nav';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export default function RewardsLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const role = searchParams?.role || 'child';

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href={`/dashboard?role=${role}`}
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Home className="h-6 w-6 text-primary" />
            <span className="">Gia Đình Gắn Kết</span>
          </Link>
          <HeaderNav role={role as 'parent' | 'child'} />
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href={`/dashboard?role=${role}`}
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Home className="h-6 w-6 text-primary" />
                <span className="sr-only">Gia Đình Gắn Kết</span>
              </Link>
              <HeaderNav role={role as 'parent' | 'child'} mobile />
            </nav>
          </SheetContent>
        </Sheet>
        <div className="ml-auto flex items-center gap-4">
          <UserNav role={role as 'parent' | 'child'} />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
