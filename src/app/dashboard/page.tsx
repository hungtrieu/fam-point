'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  ClipboardList,
  Gift,
  Users,
  Coins,
  Star,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Plus,
  ArrowUpCircle,
  ShoppingBag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getChildren } from '@/app/members/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Task {
  _id: string;
  title: string;
  status: string;
  assignedTo?: string;
  assignedToId?: {
    _id: string;
    name: string;
  };
  createdBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Reward {
  _id: string;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [spentPoints, setSpentPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    if (!user?.familyId) return;

    // Refresh user's points
    refreshUser();

    setIsLoading(true);
    try {
      const [tasksRes, rewardsRes, membersRes] = await Promise.all([
        fetch(`/api/tasks?familyId=${user.familyId}`),
        fetch(`/api/rewards?familyId=${user.familyId}`),
        getChildren(user.familyId)
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data);
      }
      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setRewards(data);
      }

      if (membersRes.success) {
        setMemberCount(membersRes.data.length);
      }

      // Fetch points spent for children
      if (user.role === 'child') {
        const historyRes = await fetch(`/api/history?userId=${user.id}`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          const totalSpent = historyData
            .filter((item: any) => item.type === 'spend')
            .reduce((sum: number, item: any) => sum + item.amount, 0);
          setSpentPoints(totalSpent);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickApprove = async (task: Task) => {
    try {
      const res = await fetch(`/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!res.ok) throw new Error('Failed to approve');

      toast({
        title: 'Thành công 🎉',
        description: `Đã duyệt công việc: ${task.title}`,
      });
      fetchDashboardData();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể duyệt công việc này',
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold text-red-500">Vui lòng đăng nhập để tiếp tục.</h2>
        <Button asChild className="mt-4">
          <Link href="/auth/login">Đăng nhập ngay</Link>
        </Button>
      </div>
    );
  }

  const isParent = user.role === 'parent';
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const approvedTasks = tasks.filter(t => t.status === 'approved').length;

  return (
    <div className="container mx-auto py-10 space-y-8 px-4 md:px-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Chào mừng trở lại, {user.name}! 👋</h1>
          <p className="text-blue-100 mt-2 text-lg">
            {isParent
              ? 'Chúc gia đình bạn một ngày tràn đầy niềm vui và gắn kết.'
              : 'Hôm nay bạn đã sẵn sàng rèn luyện và nhận quà chưa?'}
          </p>
        </div>
        <div className="relative z-10 flex gap-3">
          {isParent ? (
            <Button asChild variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50 border-none shadow-lg font-bold transition-all hover:scale-105">
              <Link href="/tasks">
                <Plus className="mr-2 h-4 w-4" /> Giao việc mới
              </Link>
            </Button>
          ) : (
            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-xl border border-white/30 flex items-center gap-3">
              <div className="bg-amber-400 p-2 rounded-full">
                <Coins className="h-5 w-5 text-amber-900" />
              </div>
              <div>
                <p className="text-xs text-blue-100 font-medium uppercase tracking-wider">Điểm của bạn</p>
                <p className="text-2xl font-extrabold">{user.points || 0}</p>
              </div>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/tasks" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className="h-full border-none shadow-md bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all border-b-4 border-b-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Công việc</CardTitle>
              <ClipboardList className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" /> {approvedTasks} đã hoàn thành
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/rewards" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className="h-full border-none shadow-md bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all border-b-4 border-b-amber-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Phần thưởng</CardTitle>
              <Gift className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{rewards.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Sẵn sàng trong cửa hàng</p>
            </CardContent>
          </Card>
        </Link>

        {isParent ? (
          <>
            <Link href="/tasks" className="block transition-transform hover:scale-105 active:scale-95">
              <Card className="h-full border-none shadow-md bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all border-b-4 border-b-indigo-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Cần phê duyệt</CardTitle>
                  <Star className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-indigo-600">{completedTasks}</div>
                  <p className="text-xs text-muted-foreground mt-1">Việc các con đã nộp</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/tasks" className="block transition-transform hover:scale-105 active:scale-95">
              <Card className="h-full border-none shadow-md bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all border-b-4 border-b-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Chưa xong</CardTitle>
                  <Clock className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{pendingTasks}</div>
                  <p className="text-xs text-muted-foreground mt-1">Đang chờ thực hiện</p>
                </CardContent>
              </Card>
            </Link>
          </>
        ) : (
          <>
            <Link href="/history" className="block transition-transform hover:scale-105 active:scale-95">
              <Card className="h-full border-none shadow-md bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all border-b-4 border-b-rose-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Điểm tích lũy</CardTitle>
                  <TrendingUp className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{user.points || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Tổng điểm hiện tại</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/history" className="block transition-transform hover:scale-105 active:scale-95">
              <Card className="h-full border-none shadow-md bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all border-b-4 border-b-purple-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Điểm đã đổi</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{spentPoints}</div>
                  <p className="text-xs text-muted-foreground mt-1">Tổng điểm quà ước nguyện</p>
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>

      {/* Main Activity Feed */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-indigo-500" /> Hoạt động gia đình sôi nổi
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tasks">Xem tất cả</Link>
          </Button>
        </div>

        <Card className="border-none shadow-lg overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
            <div className="grid grid-cols-12 gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <div className="col-span-1"></div>
              <div className="col-span-5 md:col-span-4">Nội dung công việc</div>
              <div className="col-span-3 md:col-span-2 text-center">Người thực hiện</div>
              <div className="hidden md:block md:col-span-2 text-center">Người giao</div>
              <div className="col-span-3 md:col-span-3 text-right">Trạng thái / Thao tác</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.slice(0, 10).map((task, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                  <div className="col-span-1 flex justify-center">
                    <div className={`h-3 w-3 rounded-full ${task.status === 'approved' ? 'bg-purple-500' :
                      task.status === 'completed' ? 'bg-green-500 animate-pulse' :
                        task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'
                      }`}></div>
                  </div>

                  <div className="col-span-5 md:col-span-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{task.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center">
                      <Clock className="h-3 w-3 mr-1" /> {new Date(task.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  <div className="col-span-3 md:col-span-2 text-center">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-2 py-0 h-6 text-[11px]">
                      {task.assignedToId?.name || task.assignedTo || 'Chưa nhận'}
                    </Badge>
                  </div>

                  <div className="hidden md:block md:col-span-2 text-center">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {task.createdBy?.name || '---'}
                    </span>
                  </div>

                  <div className="col-span-3 md:col-span-3 text-right">
                    {isParent && task.status === 'completed' ? (
                      <Button
                        size="sm"
                        className="h-8 bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-md transform group-hover:scale-105 transition-transform"
                        onClick={() => handleQuickApprove(task)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1 hidden sm:inline" /> Duyệt ngay
                      </Button>
                    ) : (
                      <Badge className={`font-bold text-[10px] uppercase tracking-tighter ${task.status === 'approved' ? 'bg-purple-100 text-purple-700' :
                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                        } border-none`}>
                        {task.status === 'approved' ? 'Hoàn tất' :
                          task.status === 'completed' ? 'Chờ duyệt' :
                            task.status === 'in_progress' ? 'Đang làm' : 'Chưa nhận'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <div className="bg-slate-50 dark:bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="text-sm font-medium italic">Gia đình chưa có hoạt động nào gần đây.</p>
                </div>
              )}
            </div>
          </CardContent>
          {tasks.length > 10 && (
            <div className="p-4 border-t text-center bg-slate-50/30 dark:bg-slate-800/30">
              <Button variant="ghost" size="sm" asChild className="text-indigo-600 font-bold">
                <Link href="/tasks">Xem tất cả {tasks.length} hoạt động</Link>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
