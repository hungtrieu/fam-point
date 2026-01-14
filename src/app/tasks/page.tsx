'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Clock, Coins, Hand, Play, Check, Sparkles, Droplets, Utensils, Shirt, Leaf, Repeat, Brush } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Task {
    _id: string;
    title: string;
    description?: string;
    points: number;
    assignedTo?: string;
    assignedToId?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'approved';
    repeatFrequency: 'none' | 'daily' | 'weekly';
    createdAt: string;
}

import { useAuth } from '@/context/auth-context';
import { getChildren } from '@/app/members/actions';

interface Member {
    _id: string;
    name: string;
    role: string;
}

export default function TasksPage() {
    const { user } = useAuth();
    const isParent = user?.role === 'parent';
    const { toast } = useToast();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [childrenMembers, setChildrenMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (user?.familyId) {
            fetchTasks();
            fetchMembers();
        }
    }, [user?.familyId]);

    const fetchTasks = async () => {
        if (!user?.familyId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/tasks?familyId=${user?.familyId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            const sanitizedTasks = data.map((t: any) => ({
                ...t,
                assignedTo: t.assignedTo || 'unassigned',
                assignedToId: typeof t.assignedToId === 'object' ? t.assignedToId?._id : t.assignedToId
            }));
            setTasks(sanitizedTasks);
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

    const fetchMembers = async () => {
        if (!user?.familyId) return;
        const result = await getChildren(user.familyId);
        if (result.success) {
            // Filter only children if needed, or show all. Usually "assignedTo" is for children.
            const filterChildren = result.data.filter((m: Member) => m.role === 'child');
            setChildrenMembers(filterChildren);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditing && currentTask._id ? `/api/tasks/${currentTask._id}` : '/api/tasks';
            const method = isEditing ? 'PUT' : 'POST';

            // Ensure points is a number and handle unassigned
            const selectedMember = childrenMembers.find(m => m.name === currentTask.assignedTo);
            const payload = {
                ...currentTask,
                points: Number(currentTask.points),
                assignedTo: currentTask.assignedTo === 'unassigned' ? '' : currentTask.assignedTo,
                assignedToId: currentTask.assignedTo === 'unassigned' ? null : selectedMember?._id,
                familyId: user?.familyId,
                createdBy: user?.id
            };

            console.log('Task Submission Payload:', payload);

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

    const handleClaimTask = async (task: Task) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/tasks/${task._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignedTo: user.name,
                    assignedToId: user.id
                }),
            });

            if (!res.ok) throw new Error('Failed to claim task');

            toast({
                title: 'Thành công 🎉',
                description: `Bạn đã nhận công việc: ${task.title}. Chăm chỉ nhé!`,
            });
            fetchTasks();
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể nhận công việc này',
                variant: 'destructive',
            });
        }
    };

    const handleUpdateStatus = async (task: Task, newStatus: string) => {
        try {
            const res = await fetch(`/api/tasks/${task._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error('Failed to update status');

            toast({
                title: 'Thành công',
                description: 'Đã cập nhật trạng thái công việc',
            });
            fetchTasks();
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể cập nhật trạng thái',
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
        setCurrentTask({ points: 10, status: 'pending', title: '', description: '', assignedTo: 'unassigned', repeatFrequency: 'none' });
        setIsEditing(false);
        setIsDialogOpen(true);
    };

    const openEditDialog = (task: Task) => {
        setCurrentTask({
            ...task,
            assignedTo: task.assignedTo || 'unassigned'
        });
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

    const renderTaskCard = (task: Task) => (
        <Card key={task._id} className={`overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group bg-card/50 backdrop-blur-sm border-t-4 ${task.status === 'approved' ? 'border-t-purple-400' : 'border-t-blue-400'}`}>
            <CardHeader className={`${task.status === 'approved' ? 'bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20' : 'bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20'} p-6`}>
                <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={`px-3 py-1 bg-white/80 dark:bg-black/20 border-none font-bold ${statusColors[task.status as keyof typeof statusColors] || ''}`}>
                        {getStatusLabel(task.status)}
                    </Badge>
                    <div className="flex items-center text-amber-600 font-extrabold bg-white/80 dark:bg-black/20 px-3 py-1 rounded-full text-sm shadow-sm">
                        <Coins className="h-4 w-4 mr-1" />
                        {task.points}
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <CardTitle className={`text-xl font-bold text-gray-800 dark:text-gray-100 ${task.status === 'approved' ? 'group-hover:text-purple-600' : 'group-hover:text-blue-600'} transition-colors uppercase tracking-tight`}>{task.title}</CardTitle>
                    {task.repeatFrequency && task.repeatFrequency !== 'none' && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 border-none">
                            <Repeat className="h-3 w-3 mr-0.5" />
                            {task.repeatFrequency === 'daily' ? 'Hàng ngày' : 'Hàng tuần'}
                        </Badge>
                    )}
                </div>
                {task.description && (
                    <CardDescription className="line-clamp-2 text-sm mt-2 text-gray-600 dark:text-gray-400 italic">"{task.description}"</CardDescription>
                )}
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Giao cho:</span>
                    <Badge variant="secondary" className={`border-none ${task.assignedTo === 'unassigned' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                        {task.assignedTo === 'unassigned' ? 'Đang chờ con nhận việc' : task.assignedTo}
                    </Badge>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/30 p-4 flex justify-between items-center">
                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(task.createdAt).toLocaleDateString('vi-VN')}
                </div>
                {!isParent && task.assignedTo === 'unassigned' && (
                    <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                        onClick={() => handleClaimTask(task)}
                    >
                        <Hand className="mr-2 h-4 w-4" /> Nhận việc
                    </Button>
                )}
                {!isParent && task.assignedToId === user?.id && task.status === 'pending' && (
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        onClick={() => handleUpdateStatus(task, 'in_progress')}
                    >
                        <Play className="mr-2 h-4 w-4" /> Bắt đầu làm
                    </Button>
                )}
                {!isParent && task.assignedToId === user?.id && task.status === 'in_progress' && (
                    <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                        onClick={() => handleUpdateStatus(task, 'completed')}
                    >
                        <Check className="mr-2 h-4 w-4" /> Hoàn thành
                    </Button>
                )}
                {!isParent && task.assignedToId === user?.id && task.status === 'completed' && (
                    <Badge className="bg-green-100 text-green-700 border-none">Đang chờ duyệt</Badge>
                )}
                {!isParent && task.assignedToId === user?.id && task.status === 'approved' && (
                    <Badge className="bg-purple-100 text-purple-700 border-none">Đã hoàn thành</Badge>
                )}
                {isParent && (
                    <div className="flex gap-2">
                        {task.status === 'completed' && (
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                onClick={() => handleUpdateStatus(task, 'approved')}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Duyệt
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400" onClick={() => openEditDialog(task)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400" onClick={() => handleDelete(task._id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );

    if (!mounted) {
        return (
            <div className="container mx-auto py-10 space-y-6 px-4 md:px-6">
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    const sortedActiveTasks = [...tasks]
        .filter(t => t.status !== 'approved')
        .sort((a, b) => {
            if (isParent) {
                // Parents: completed (waiting approval) first
                if (a.status === 'completed' && b.status !== 'completed') return -1;
                if (a.status !== 'completed' && b.status === 'completed') return 1;
                return 0;
            } else {
                // Children sorting
                // 1. Assigned to me
                const aIsMe = a.assignedToId === user?.id;
                const bIsMe = b.assignedToId === user?.id;
                if (aIsMe && !bIsMe) return -1;
                if (!aIsMe && bIsMe) return 1;

                // 2. Unassigned
                const aUnassigned = a.assignedTo === 'unassigned';
                const bUnassigned = b.assignedTo === 'unassigned';
                if (aUnassigned && !bUnassigned) return -1;
                if (!aUnassigned && bUnassigned) return 1;

                // 3. Status priority for others: in_progress > pending > completed
                const statusPriority = { in_progress: 1, pending: 2, completed: 3 };
                const aPrio = statusPriority[a.status as keyof typeof statusPriority] || 99;
                const bPrio = statusPriority[b.status as keyof typeof statusPriority] || 99;
                return aPrio - bPrio;
            }
        });

    return (
        <div className="container mx-auto py-10 space-y-6 px-4 md:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Quản lý công việc</h1>
                    <p className="text-muted-foreground mt-2">
                        {isParent ? 'Quản lý và giao việc cho con cái.' : 'Danh sách công việc của bạn.'}
                    </p>
                </div>
                {isParent && (
                    <Button onClick={openCreateDialog} className="shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none shrink-0">
                        <Plus className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Thêm công việc</span>
                    </Button>
                )}
            </div>

            {isParent && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                    <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Tạo nhanh nhiệm vụ hàng ngày
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { title: 'Quét nhà', icon: <Brush className="h-4 w-4" />, points: 10, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
                            { title: 'Lau nhà', icon: <Droplets className="h-4 w-4" />, points: 15, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                            { title: 'Rửa bát', icon: <Utensils className="h-4 w-4" />, points: 10, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                            { title: 'Gấp quần áo', icon: <Shirt className="h-4 w-4" />, points: 10, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                            { title: 'Tưới cây', icon: <Leaf className="h-4 w-4" />, points: 5, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                            { title: 'Dọn đồ chơi', icon: <Plus className="h-4 w-4" />, points: 5, color: 'bg-pink-100 text-pink-700 hover:bg-pink-200' },
                        ].map((q) => (
                            <Button
                                key={q.title}
                                variant="secondary"
                                size="sm"
                                className={`flex items-center gap-2 border-none transition-all hover:scale-105 ${q.color}`}
                                onClick={async () => {
                                    try {
                                        const payload = {
                                            title: q.title,
                                            points: q.points,
                                            status: 'pending',
                                            familyId: user?.familyId,
                                            createdBy: user?.id,
                                            assignedTo: 'unassigned',
                                            repeatFrequency: 'daily' // Auto-set to daily for quick tasks
                                        };
                                        const res = await fetch('/api/tasks', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(payload),
                                        });
                                        if (res.ok) {
                                            toast({ title: 'Đã tạo nhanh', description: `Nhiệm vụ "${q.title}" đã được tạo.` });
                                            fetchTasks();
                                        }
                                    } catch (e) {
                                        toast({ title: 'Lỗi', description: 'Không thể tạo nhanh nhiệm vụ', variant: 'destructive' });
                                    }
                                }}
                            >
                                {q.icon}
                                <span>{q.title}</span>
                                <Badge variant="outline" className="ml-1 bg-white/50 border-none px-1 text-[10px]">{q.points}</Badge>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border-2 border-dashed border-muted">
                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                        <Clock className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">Chưa có công việc nào</h3>
                    <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                        {isParent ? 'Hãy bắt đầu bằng cách tạo công việc đầu tiên cho bé!' : 'Hiện tại bạn không có công việc nào cần làm.'}
                    </p>
                    {isParent && (
                        <Button onClick={openCreateDialog} variant="outline">Tạo công việc ngay</Button>
                    )}
                </div>
            ) : (
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-1 mb-8 w-fit">
                        <TabsTrigger
                            value="active"
                            className="px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-300 gap-2"
                        >
                            <Clock className="h-4 w-4" />
                            <span>Đang thực hiện</span>
                            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 border-none px-1.5 py-0 text-[10px]">
                                {tasks.filter(t => t.status !== 'approved').length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="approved"
                            className="px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-purple-600 data-[state=active]:shadow-sm transition-all duration-300 gap-2"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Đã duyệt</span>
                            <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 border-none px-1.5 py-0 text-[10px]">
                                {tasks.filter(t => t.status === 'approved').length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="mt-0 focus-visible:outline-none">
                        {sortedActiveTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-2xl border-2 border-dashed border-muted/50">
                                <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-xl font-medium text-muted-foreground">Không có công việc nào đang chờ</h3>
                                <p className="text-sm text-muted-foreground mt-1 text-balance">Mọi thứ đã được giải quyết xong hoặc đang chờ được duyệt.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {sortedActiveTasks.map((task) => renderTaskCard(task))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="approved" className="mt-0 focus-visible:outline-none">
                        {tasks.filter(t => t.status === 'approved').length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-2xl border-2 border-dashed border-muted/50">
                                <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-xl font-medium text-muted-foreground">Chưa có công việc nào được duyệt</h3>
                                <p className="text-sm text-muted-foreground mt-1 text-balance">Hoàn thành công việc để nhận điểm thưởng nhé!</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {tasks.filter(t => t.status === 'approved').map((task) => renderTaskCard(task))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
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
                            <Label htmlFor="assignedTo">Giao cho</Label>
                            <Select
                                value={currentTask.assignedTo}
                                onValueChange={(value) => setCurrentTask({ ...currentTask, assignedTo: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn thành viên" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Chưa giao (Để con tự chọn)</SelectItem>
                                    {childrenMembers.map((member) => (
                                        <SelectItem key={member._id} value={member.name}>
                                            {member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="repeatFrequency">Lặp lại</Label>
                            <Select
                                value={currentTask.repeatFrequency || 'none'}
                                onValueChange={(value: any) => setCurrentTask({ ...currentTask, repeatFrequency: value })}
                            >
                                <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        <Repeat className="h-4 w-4" />
                                        <SelectValue placeholder="Chọn tần suất" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Không lặp lại</SelectItem>
                                    <SelectItem value="daily">Hàng ngày</SelectItem>
                                    <SelectItem value="weekly">Hàng tuần</SelectItem>
                                </SelectContent>
                            </Select>
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
