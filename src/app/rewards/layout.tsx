'use client';
import { MainLayout } from '@/components/main-layout';

export default function RewardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
