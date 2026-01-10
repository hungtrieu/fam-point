import { users, pointHistory } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function HistoryPage({
  searchParams,
}: {
  searchParams: { role?: 'parent' | 'child' };
}) {
  const role = searchParams.role || 'child';
  
  // For simplicity, we'll just show history for the first child
  const childUser = users.find((u) => u.role === 'child');
  if (!childUser) return <div>Không tìm thấy người dùng.</div>;

  const userHistory = pointHistory.filter(h => h.userId === childUser.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History /> Lịch sử điểm
        </CardTitle>
        <CardDescription>
          Theo dõi điểm con đã tích lũy và sử dụng.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hành động</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="text-right">Điểm</TableHead>
              <TableHead className="text-right">Ngày</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userHistory.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.type === 'earn' ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <ArrowUpCircle size={18} />
                      <span>Nhận điểm</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <ArrowDownCircle size={18} />
                      <span>Đổi quà</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell className={`text-right font-medium ${item.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.points > 0 ? `+${item.points}` : item.points}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {format(new Date(item.date), "d 'tháng' M, yyyy", { locale: vi })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
