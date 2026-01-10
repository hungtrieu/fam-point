'use client';
import type { Task, User, Reward } from '@/lib/data';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Button } from '@/components/ui/button';
import { TaskActions } from './task-actions';
import { Star, Gift, ClipboardCheck } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useDoc, useFirebase, useUser, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, Timestamp, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const statusMap: { [key in Task['status']]: { text: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } } = {
  todo: { text: 'Cần làm', variant: 'default' },
  completed: { text: 'Chờ duyệt', variant: 'secondary' },
  approved: { text: 'Đã hoàn thành', variant: 'outline' },
};

export default function ChildDashboard() {
  const { firestore } = useFirebase();
  const { user: authUser, isUserLoading } = useUser();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const childTasksQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, 'tasks'), where('assigneeId', '==', authUser.uid));
  }, [firestore, authUser]);

  const rewardsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'rewards');
  }, [firestore]);
  
  const { data: user, isLoading: userLoading } = useDoc<User>(userDocRef);
  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(childTasksQuery);
  const { data: rewards, isLoading: rewardsLoading } = useCollection<Reward>(rewardsQuery);

  const getRewardImage = (imageId: string) => {
    return PlaceHolderImages.find(p => p.id === imageId)?.imageUrl || "https://picsum.photos/seed/placeholder/600/400";
  }

  const handleRedeem = (reward: Reward) => {
    if (!firestore || !user || !authUser) return;

    if (user.points! < reward.costInPoints) {
        toast({ title: "Không đủ điểm", description: "Con chưa đủ điểm để đổi phần thưởng này.", variant: "destructive" });
        return;
    }

    const userRef = doc(firestore, 'users', authUser.uid);
    const redemptionRef = doc(collection(firestore, `users/${authUser.uid}/redemptions`));

    // Deduct points
    setDocumentNonBlocking(userRef, { points: increment(-reward.costInPoints) }, { merge: true });

    // Create redemption record
    setDocumentNonBlocking(redemptionRef, {
        userId: authUser.uid,
        rewardId: reward.id,
        description: `Đổi phần thưởng: ${reward.name}`,
        pointsRedeemed: -reward.costInPoints,
        redemptionDate: Timestamp.now(),
    }, {});

    toast({ title: "Đổi quà thành công!", description: `Con đã đổi "${reward.name}".` });
  }

  const isLoading = isUserLoading || userLoading || tasksLoading || rewardsLoading;

  if (isLoading) {
      return <div>Đang tải...</div>
  }
  
  if (!user) {
      return <div>Không tìm thấy thông tin người dùng.</div>
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:grid-cols-2">
      <div className="grid gap-4 auto-rows-max">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-2xl">
                  Chào buổi sáng, {user.name}!
                </CardTitle>
                <CardDescription>
                  Hãy xem hôm nay có việc gì cần làm nhé.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-2 text-lg font-bold text-primary">
                <Star className="h-6 w-6" />
                <span>{user.points || 0}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Can add a summary or chart here */}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck /> Việc của con
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Công việc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tasks || []).map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-muted-foreground">
                        +{task.points} điểm
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[task.status].variant}>
                        {statusMap[task.status].text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <TaskActions task={task} role="child" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift /> Cửa hàng phần thưởng
          </CardTitle>
          <CardDescription>
            Dùng điểm của con để đổi những phần quà hấp dẫn!
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {(rewards || []).map((reward) => (
            <Card key={reward.id}>
              <div className="relative aspect-video w-full">
                <Image
                  src={getRewardImage(reward.imageUrl)}
                  alt={reward.name}
                  fill
                  className="rounded-t-lg object-cover"
                  data-ai-hint="reward gift"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-base">{reward.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{reward.description}</p>
              </CardContent>
              <CardFooter>
                 <Button className="w-full" disabled={(user.points || 0) < reward.costInPoints} onClick={() => handleRedeem(reward)}>
                    <Star className="mr-2 h-4 w-4" />
                    Đổi {reward.costInPoints} điểm
                </Button>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
