'use client';
import ParentDashboard from '@/components/dashboard/parent-dashboard';
import ChildDashboard from '@/components/dashboard/child-dashboard';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'child';
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
       <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:grid-cols-2">
          <div className="grid gap-4 auto-rows-max">
             <Skeleton className="h-40" />
             <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
       </div>
    )
  }

  if (!user) return <div>Vui lòng đăng nhập để tiếp tục.</div>;
  
  if (role === 'parent') {
    return <ParentDashboard />;
  }

  return <ChildDashboard />;
}
