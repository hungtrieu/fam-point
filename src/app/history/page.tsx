'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  History,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Coins,
  Search,
  Filter
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface HistoryItem {
  _id: string;
  type: 'earn' | 'spend';
  amount: number;
  description: string;
  createdAt: string;
}

export default function HistoryPage() {
  const { user, refreshUser } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user?.id) {
      fetchHistory();
    }
  }, [user?.id]);

  const fetchHistory = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // Refresh current user points
      refreshUser();

      const res = await fetch(`/api/history?userId=${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = history.filter(item =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Lịch sử điểm</h1>
          <p className="text-muted-foreground mt-2">Theo dõi các hoạt động nhận điểm và đổi quà của bạn.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
            <Coins className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tổng điểm hiện có</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{user?.points || 0}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm hoạt động..."
            className="pl-10 bg-white dark:bg-slate-950"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Badge variant="outline" className="px-4 py-2 flex gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
          <Filter className="h-4 w-4" /> Lọc
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border-2 border-dashed border-muted">
          <div className="bg-muted/50 p-4 rounded-full mb-4">
            <History className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Chưa có lịch sử điểm</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            Hãy bắt đầu hoàn thành công việc để nhận những điểm số đầu tiên!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredHistory.map((item) => (
            <Card key={item._id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${item.type === 'earn'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                      {item.type === 'earn' ? <ArrowUpCircle className="h-6 w-6" /> : <ArrowDownCircle className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-indigo-600 transition-colors">{item.description}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString('vi-VN')} {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <Badge variant="secondary" className={`text-[10px] uppercase font-bold tracking-wider ${item.type === 'earn' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                          {item.type === 'earn' ? 'Nhận điểm' : 'Đổi quà'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className={`text-2xl font-extrabold flex items-center transition-transform group-hover:scale-110 ${item.type === 'earn' ? 'text-green-600' : 'text-rose-600'
                    }`}>
                    {item.type === 'earn' ? '+' : '-'}{item.amount}
                    <Coins className="ml-2 h-5 w-5 opacity-50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
