'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/data';

interface TaskActionsProps {
  task: Task;
  role: 'parent' | 'child';
}

export function TaskActions({ task, role }: TaskActionsProps) {
  const { toast } = useToast();

  if (role === 'parent' && task.status === 'completed') {
    return (
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            toast({ title: 'Đã duyệt!', description: `Bạn đã cộng ${task.points} điểm cho công việc "${task.title}".` })
          }
        >
          Duyệt
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() =>
            toast({
              variant: 'destructive',
              title: 'Đã từ chối!',
              description: `Công việc "${task.title}" cần được làm lại.`,
            })
          }
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
        onClick={() =>
          toast({
            title: 'Hoàn thành!',
            description: `Công việc "${task.title}" đang chờ bố mẹ duyệt.`,
          })
        }
      >
        Hoàn thành
      </Button>
    );
  }

  return null;
}
