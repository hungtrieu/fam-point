'use client';
import type { Task, User } from '@/lib/data';
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
import { Button } from '@/components/ui/button';
import { TaskActions } from './task-actions';
import {
  CircleAlert,
  ClipboardList,
  PlusCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useCollection, useFirebase, useUser, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, Timestamp, doc, collectionGroup } from 'firebase/firestore';
import { useState } from 'react';
import { Skeleton } from '../ui/skeleton';

const statusMap: { [key in Task['status']]: { text: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } } = {
  todo: { text: 'Cần làm', variant: 'default' },
  completed: { text: 'Chờ duyệt', variant: 'secondary' },
  approved: { text: 'Đã duyệt', variant: 'outline' },
};

export default function ParentDashboard() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPoints, setTaskPoints] = useState(0);
  const [taskAssignee, setTaskAssignee] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  const allTasksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Use a collection group query to get all tasks assigned by this parent
    return query(collectionGroup(firestore, 'tasks'), where('assignerId', '==', user.uid));
  }, [firestore, user]);

  const childrenQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), where('role', '==', 'child'));
  }, [firestore, user]);

  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(allTasksQuery);
  const { data: children, isLoading: usersLoading } = useCollection<User>(childrenQuery);

  const tasksToReview = tasks?.filter((task) => task.status === 'completed') || [];
  
  const getChildName = (userId: string) => {
    return children?.find((u) => u.id === userId)?.name || 'Không rõ';
  };
  
  const handleCreateTask = () => {
    if (!firestore || !user || !taskAssignee || !taskTitle || taskPoints <= 0) return;
    setIsCreating(true);

    // Path to the subcollection of the specific child
    const tasksCollection = collection(firestore, `users/${taskAssignee}/tasks`);
    
    addDocumentNonBlocking(tasksCollection, {
      title: taskTitle,
      description: taskDesc,
      points: taskPoints,
      assigneeId: taskAssignee,
      assignerId: user.uid,
      status: 'todo',
      createdAt: Timestamp.now(),
      dueDate: Timestamp.now(), // Placeholder, you might want a date picker
    }).then((newDocRef) => {
        // In a non-blocking update, the ref is inside the promise
        if (newDocRef) {
          const taskRef = doc(firestore, `users/${taskAssignee}/tasks`, newDocRef.id);
          // set the ID on the document
        }
    }).finally(() => {
        setIsCreating(false);
        setIsDialogOpen(false);
        setTaskTitle('');
        setTaskDesc('');
        setTaskPoints(0);
        setTaskAssignee('');
    });
  }

  const isLoading = tasksLoading || usersLoading || isUserLoading;

  if (isLoading) {
    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:grid-cols-2">
            <div className="grid gap-4">
                <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            </div>
             <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
        </div>
    );
  }


  return (
    <div className="container mx-auto p-0">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:grid-cols-2">
        <div className="grid gap-4">
          {tasksToReview.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                 <CircleAlert className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Việc cần duyệt</CardTitle>
                  <CardDescription>
                    Có {tasksToReview.length} công việc đã được các con hoàn thành và đang chờ bạn duyệt.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Công việc</TableHead>
                      <TableHead>Con</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasksToReview.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground">+{task.points} điểm</div>
                        </TableCell>
                         <TableCell>{getChildName(task.assigneeId)}</TableCell>
                        <TableCell className="text-right">
                          <TaskActions task={task} role="parent" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <ClipboardList className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Tất cả công việc</CardTitle>
                  <CardDescription>
                    Xem và quản lý tất cả công việc đã giao.
                  </CardDescription>
                </div>
              </div>
               <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Thêm việc mới
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tạo công việc mới</DialogTitle>
                    <DialogDescription>
                      Điền thông tin dưới đây để giao việc cho con.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="task-title">Tên công việc</Label>
                      <Input id="task-title" placeholder="Ví dụ: Dọn dẹp phòng" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="task-desc">Mô tả</Label>
                      <Textarea id="task-desc" placeholder="Mô tả chi tiết công việc..." value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                      <Label htmlFor="task-points">Điểm thưởng</Label>
                      <Input id="task-points" type="number" placeholder="Ví dụ: 10" value={taskPoints} onChange={(e) => setTaskPoints(Number(e.target.value))} />
                    </div>
                     <div className="grid gap-2">
                      <Label htmlFor="task-assignee">Giao cho</Label>
                       <Select onValueChange={setTaskAssignee} value={taskAssignee}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn một bé" />
                        </SelectTrigger>
                        <SelectContent>
                          {(children || []).map(child => (
                             <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogClose asChild>
                    <Button type="submit" className="w-full" onClick={handleCreateTask} disabled={isCreating}>{isCreating ? 'Đang tạo...' : 'Tạo công việc'}</Button>
                  </DialogClose>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Công việc</TableHead>
                    <TableHead>Con</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Điểm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tasks || []).map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{getChildName(task.assigneeId)}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[task.status] ? statusMap[task.status].variant : 'default'}>
                          {statusMap[task.status] ? statusMap[task.status].text : 'Không rõ'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{task.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

         <div className="grid gap-4">
            <Card>
              <CardHeader>
                  <CardTitle>Thống kê</CardTitle>
                  <CardDescription>Xem nhanh tiến độ của các con.</CardDescription>
              </CardHeader>
               <CardContent>
                  {(children || []).map(child => {
                      const childTasks = tasks?.filter(t => t.assigneeId === child.id) || [];
                      const completedTasks = childTasks.filter(t => t.status === 'approved').length;
                      const progress = childTasks.length > 0 ? (completedTasks / childTasks.length) * 100 : 0;
                      return (
                          <div key={child.id} className="mb-4">
                              <div className="flex justify-between items-center">
                                  <span className="font-medium">{child.name}</span>
                                  <span className="text-muted-foreground text-sm">{completedTasks} / {childTasks.length} việc</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2.5 mt-1">
                                  <div className="bg-primary h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
                              </div>
                          </div>
                      )
                  })}
              </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    