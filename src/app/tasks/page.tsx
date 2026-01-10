'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Clock, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Task {
    _id: string;
    title: string;
    description?: string;
    points: number;
    assignedTo?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'approved';
    createdAt: string;
}

import { useAuth } from '@/context/auth-context';

export default function TasksPage() {
    const { user } = useAuth();
    const isParent = user?.role === 'parent';
    const { toast } = useToast();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/tasks');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setTasks(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load tasks',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditing && currentTask._id ? `/api/tasks/${currentTask._id}` : '/api/tasks';
            const method = isEditing ? 'PUT' : 'POST';

            // Ensure points is a number
            const payload = { ...currentTask, points: Number(currentTask.points) };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Operation failed');

            toast({
                title: 'Success',
                description: `Task ${isEditing ? 'updated' : 'created'} successfully`,
            });
            setIsDialogOpen(false);
            fetchTasks();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save task',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            toast({ title: 'Success', description: 'Task deleted' });
            fetchTasks();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
        }
    };

    const openCreateDialog = () => {
        setCurrentTask({ points: 10, status: 'pending', title: '', description: '', assignedTo: '' });
        setIsEditing(false);
        setIsDialogOpen(true);
    };

    const openEditDialog = (task: Task) => {
        setCurrentTask(task);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        in_progress: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        approved: 'bg-purple-100 text-purple-800',
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Chờ làm';
            case 'in_progress': return 'Đang làm';
            case 'completed': return 'Đã xong';
            case 'approved': return 'Đã duyệt';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý công việc</h1>
                    <p className="text-muted-foreground">
                        {isParent ? 'Quản lý và giao việc cho con cái.' : 'Danh sách công việc của bạn.'}
                    </p>
                </div>
                {isParent && (
                    <Button onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" /> Thêm công việc
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">Loading...</div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Chưa có công việc nào.</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tasks.map((task) => (
                        <Card key={task._id} className="relative transition-all hover:shadow-md">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="secondary" className={`${statusColors[task.status] || ''} font-normal`}>
                                        {getStatusLabel(task.status)}
                                    </Badge>
                                    <div className="flex items-center text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-full text-xs">
                                        <Coins className="h-3 w-3 mr-1" />
                                        {task.points} điểm
                                    </div>
                                </div>
                                <CardTitle className="text-lg">{task.title}</CardTitle>
                                {task.description && (
                                    <CardDescription className="line-clamp-2 text-sm mt-1">{task.description}</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="pb-3 text-xs text-muted-foreground">
                                <div>Giao cho: <span className="font-medium text-foreground">{task.assignedTo || 'Chưa giao'}</span></div>
                            </CardContent>
                            <CardFooter className="flex justify-between pt-0 pb-4 px-6 border-t bg-slate-50/50 mt-auto items-center h-12">
                                <div className="text-xs text-muted-foreground">
                                    {new Date(task.createdAt).toLocaleDateString('vi-VN')}
                                </div>
                                {isParent && (
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEditDialog(task)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(task._id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Sửa công việc' : 'Thêm công việc mới'}</DialogTitle>
                        <DialogDescription>
                            Điền thông tin chi tiết cho công việc.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Tên công việc</Label>
                            <Input
                                id="title"
                                value={currentTask.title}
                                onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
                                required
                                placeholder="Ví dụ: Rửa bát, Học bài..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <Textarea
                                id="description"
                                value={currentTask.description}
                                onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                                placeholder="Mô tả chi tiết công việc..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="points">Điểm thưởng</Label>
                                <Input
                                    id="points"
                                    type="number"
                                    value={currentTask.points}
                                    onChange={(e) => setCurrentTask({ ...currentTask, points: Number(e.target.value) })}
                                    required
                                    min={0}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Trạng thái</Label>
                                <Select
                                    value={currentTask.status}
                                    onValueChange={(value: any) => setCurrentTask({ ...currentTask, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Chờ làm</SelectItem>
                                        <SelectItem value="in_progress">Đang làm</SelectItem>
                                        <SelectItem value="completed">Đã xong</SelectItem>
                                        <SelectItem value="approved">Đã duyệt</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assignedTo">Giao cho (Tên bé)</Label>
                            <Input
                                id="assignedTo"
                                value={currentTask.assignedTo || ''}
                                onChange={(e) => setCurrentTask({ ...currentTask, assignedTo: e.target.value })}
                                placeholder="Nhập tên bé..."
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit">{isEditing ? 'Lưu thay đổi' : 'Tạo công việc'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
