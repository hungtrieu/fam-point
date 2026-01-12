import type { Metadata } from 'next';
import * as React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/context/auth-context';
import './globals.css';


export const metadata: Metadata = {
  title: 'Gia Đình Gắn Kết',
  description: 'Ứng dụng tương tác và giao việc trong gia đình.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthProvider>
          <React.Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            {children}
          </React.Suspense>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
