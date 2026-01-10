'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/data';
import { useFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, increment, writeBatch, collection, Timestamp } from 'firebase/firestore';

interface TaskActionsProps {
  task: Task;
  role: 'parent' | 'child';
}

export function TaskActions({ task, role }: TaskActionsProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const handleApprove = () => {
    if (!firestore) return;
    
    const batch = writeBatch(firestore);

    // Path to the specific task in the user's subcollection
    const taskRef = doc(firestore, `users/${task.assigneeId}/tasks`, task.id);
    batch.update(taskRef, { status: 'approved' });

    // Award points to the child
    const userRef = doc(firestore, 'users', task.assigneeId);
    batch.update(userRef, { points: increment(task.points) });
    
    // Add to point history (redemptions subcollection)
    const redemptionRef = doc(collection(firestore, `users/${task.assigneeId}/redemptions`));
    batch.set(redemptionRef, {
        id: redemptionRef.id,
        userId: task.assigneeId,
        description: `Hoàn thành: ${task.title}`,
        pointsRedeemed: task.points, // Positive value for earning
        redemptionDate: Timestamp.now(),
    });


    batch.commit().then(() => {
        toast({ title: 'Đã duyệt!', description: `Bạn đã cộng ${task.points} điểm cho công việc "${task.title}".` });
    }).catch(e => {
        console.error(e);
        toast({ title: 'Lỗi!', description: 'Không thể duyệt công việc.', variant: 'destructive'});
    });
  };

  const handleReject = () => {
    if (!firestore) return;
    const taskRef = doc(firestore, `users/${task.assigneeId}/tasks`, task.id);
    setDocumentNonBlocking(taskRef, { status: 'todo' }, { merge: true });
    toast({
      variant: 'destructive',
      title: 'Đã từ chối!',
      description: `Công việc "${task.title}" cần được làm lại.`,
    });
  };

  const handleComplete = () => {
    if (!firestore) return;
    const taskRef = doc(firestore, `users/${task.assigneeId}/tasks`, task.id);
    setDocumentNonBlocking(taskRef, { status: 'completed' }, { merge: true });
    toast({
      title: 'Hoàn thành!',
      description: `Công việc "${task.title}" đang chờ bố mẹ duyệt.`,
    });
  };

  if (role === 'parent' && task.status === 'completed') {
    return (
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={handleApprove}
        >
          Duyệt
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleReject}
        >
          Từ chối
        </Button>
      </div>
    );
  }

  if (role === 'child' && task.status === 'todo') {
    return (
      <Button
        size="sm"
        onClick={handleComplete}
      >
        Hoàn thành
      </Button>
    );
  }

  return null;
}

    