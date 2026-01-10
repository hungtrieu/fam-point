'use client';

import { Redemption, User } from '@/lib/data';
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
import { History, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function HistoryPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const role = searchParams?.role || 'child';
  const { firestore } = useFirebase();
  const { user: authUser, isUserLoading } = useUser();

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    // Note: This query requires a composite index in Firestore.
    // The error message in the browser console will provide a link to create it.
    return query(
      collection(firestore, `users/${authUser.uid}/redemptions`),
      orderBy('redemptionDate', 'desc')
    );
  }, [firestore, authUser]);

  const { data: userHistory, isLoading: historyLoading } = useCollection<Redemption>(historyQuery);

  const isLoading = isUserLoading || historyLoading;

  if (isLoading) {
    return (
       <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-5 w-32" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1,2,3,4,5].map(i => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-32" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    )
  }
  
  if (role === 'parent') {
      return <div>Lịch sử cho phụ huynh đang được phát triển.</div>
  }

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
            {(userHistory || []).map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.pointsRedeemed > 0 ? (
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
                <TableCell className={`text-right font-medium ${item.pointsRedeemed > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.pointsRedeemed > 0 ? `+${item.pointsRedeemed}` : item.pointsRedeemed}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {format((item.redemptionDate as unknown as Timestamp).toDate(), "d 'tháng' M, yyyy", { locale: vi })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
