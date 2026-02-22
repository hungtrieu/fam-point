'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Clock, Coins, Hand, Play, Check, Sparkles, Droplets, Utensils, Shirt, Heart, Leaf, Repeat, Brush, LayoutGrid, Kanban as KanbanIcon, GripVertical, Bath } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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
    createdBy?: string | { _id: string; name: string };
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
    const [globalTasksDisplayMode, setGlobalTasksDisplayMode] = useState<'kanban' | 'card'>('kanban');
    const [mounted, setMounted] = useState(false);

    const generateScheduledTasks = useCallback(async () => {
        if (!user?.familyId) return;
        try {
            await fetch('/api/tasks/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ familyId: user.familyId }),
            });
        } catch (error) {
            console.error('Failed to generate scheduled tasks:', error);
        }
    }, [user?.familyId]);

    const fetchTasks = useCallback(async () => {
        if (!user?.familyId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/tasks?familyId=${user?.familyId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            const sanitizedTasks = data.map((t: any) => ({
                ...t,
                assignedTo: t.assignedTo || 'unassigned',
                assignedToId: typeof t.assignedToId === 'object' ? t.assignedToId?._id : t.assignedToId,
                createdBy: typeof t.createdBy === 'object' ? t.createdBy?._id : t.createdBy
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
    }, [user?.familyId, toast]);

    const fetchMembers = useCallback(async () => {
        if (!user?.familyId) return;
        const result = await getChildren(user.familyId);
        if (result.success) {
            const filterChildren = result.data.filter((m: Member) => m.role === 'child');
            setChildrenMembers(filterChildren);
        }
    }, [user?.familyId]);

    useEffect(() => {
        setMounted(true);
        if (user?.familyId) {
            generateScheduledTasks().then(() => {
                fetchTasks();
                fetchMembers();
            });
        }
    }, [user?.familyId, generateScheduledTasks, fetchTasks, fetchMembers]);

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
                createdBy: isEditing ? (typeof currentTask.createdBy === 'object' ? (currentTask.createdBy as any)?._id : currentTask.createdBy) : user?.id,
                userId: user?.id // Add userId for role verification in API
            };

            console.log('Task Submission Payload:', payload);

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Operation failed');

            const savedTask = await res.json();

            toast({
                title: 'Thành công',
                description: `Công việc đã được ${isEditing ? 'cập nhật' : 'tạo'}`,
            });
            setIsDialogOpen(false);

            // Update local state without fetchTasks()
            if (isEditing) {
                setTasks(prev => prev.map(t => t._id === savedTask._id ? savedTask : t));
            } else {
                setTasks(prev => [savedTask, ...prev]);
            }
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể lưu công việc',
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
                    assignedToId: user.id,
                    userId: user.id
                }),
            });

            if (!res.ok) throw new Error('Failed to claim task');
            const updatedTask = await res.json();

            toast({
                title: 'Thành công',
                description: 'Bạn đã nhận công việc này',
            });

            // Update local state
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể nhận công việc',
                variant: 'destructive',
            });
        }
    };

    const onDragStart = useCallback((start: any) => {
        // console.log('DRAG START EVENT:', start);
    }, []);

    const onDragUpdate = useCallback((update: any) => {
        // console.log('DRAG UPDATE EVENT:', update);
    }, []);

    const onDragEnd = useCallback(async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination || (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        )) {
            return;
        }

        const newStatus = destination.droppableId as Task['status'];

        // Optimistic update using functional state
        setTasks(prevTasks => {
            return prevTasks.map(t =>
                t._id === draggableId ? { ...t, status: newStatus } : t
            );
        });

        try {
            const res = await fetch(`/api/tasks/${draggableId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    userId: user?.id
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update status');
            }
        } catch (error: any) {
            // Revert on error
            fetchTasks();
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể cập nhật trạng thái',
                variant: 'destructive',
            });
        }
    }, [user?.id, toast, fetchTasks]);

    const handleUpdateStatus = async (task: Task, newStatus: string) => {
        // Optimistic update
        setTasks(prevTasks => prevTasks.map(t =>
            t._id === task._id ? { ...t, status: newStatus as Task['status'] } : t
        ));

        try {
            const res = await fetch(`/api/tasks/${task._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    userId: user?.id
                }),
            });

            if (!res.ok) throw new Error('Failed to update status');

            toast({
                title: 'Thành công',
                description: 'Đã cập nhật trạng thái công việc',
            });
        } catch (error) {
            // Revert on error
            fetchTasks();
            toast({
                title: 'Lỗi',
                description: 'Không thể cập nhật trạng thái',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        // Optimistic delete
        const taskToDelete = tasks.find(t => t._id === id);
        setTasks(prevTasks => prevTasks.filter(t => t._id !== id));

        try {
            const res = await fetch(`/api/tasks/${id}?userId=${user?.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Delete failed');
            }
            toast({ title: 'Thành công', description: 'Đã xóa công việc' });
        } catch (error: any) {
            // Revert on error
            fetchTasks(); // Easier to refetch than to piece it back in correctly if order matters
            toast({ title: 'Lỗi', description: error.message || 'Không thể xóa công việc', variant: 'destructive' });
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

    const renderTaskCard = (task: Task, isKanban = false) => {
        const theme = {
            pending: { shadow: 'shadow-amber-200/50', border: 'border-amber-400', sideBorder: 'border-l-amber-600', bg: 'bg-white dark:bg-slate-900', text: 'text-amber-900 dark:text-amber-100', icon: 'text-amber-600' },
            in_progress: { shadow: 'shadow-blue-200/50', border: 'border-blue-400', sideBorder: 'border-l-blue-700', bg: 'bg-white dark:bg-slate-900', text: 'text-blue-900 dark:text-blue-100', icon: 'text-blue-600' },
            completed: { shadow: 'shadow-indigo-200/50', border: 'border-indigo-400', sideBorder: 'border-l-indigo-700', bg: 'bg-white dark:bg-slate-900', text: 'text-indigo-900 dark:text-indigo-100', icon: 'text-indigo-600' },
            approved: { shadow: 'shadow-emerald-200/50', border: 'border-emerald-400', sideBorder: 'border-l-emerald-700', bg: 'bg-white dark:bg-slate-900', text: 'text-emerald-900 dark:text-emerald-100', icon: 'text-emerald-600' }
        }[task.status] || { shadow: 'shadow-slate-200/50', border: 'border-slate-300', sideBorder: 'border-l-slate-600', bg: 'bg-white dark:bg-slate-900', text: 'text-slate-900 dark:text-slate-100', icon: 'text-slate-600' };

        if (isKanban) {
            return (
                <Card
                    key={task._id}
                    className={`overflow-hidden border shadow-md hover:shadow-xl transition-all duration-200 ${theme.bg} ${theme.border} border-l-8 ${theme.sideBorder} group`}
                >
                    <div className="p-2.5 flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100 line-clamp-2 uppercase tracking-tight flex-grow leading-tight">
                                {task.title}
                            </h4>
                            <div className="flex items-center text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/40 px-2 py-1 rounded-md text-xs shrink-0 h-fit shadow-sm border border-amber-100 dark:border-amber-800/50">
                                <Coins className="h-3 w-3 mr-1" />
                                {task.points}
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-0.5">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <Badge variant="secondary" className={`text-xs px-2 py-1 h-6 border-none truncate font-black shadow-md ${(task.assignedTo === 'unassigned' || !task.assignedTo) ? 'bg-amber-100 text-amber-700' : 'bg-white text-blue-800 border-2 border-blue-200'}`}>
                                    {(task.assignedTo === 'unassigned' || !task.assignedTo) ? 'Chờ nhận' : task.assignedTo}
                                </Badge>
                                {task.repeatFrequency && task.repeatFrequency !== 'none' && (
                                    <Repeat className={`h-2.5 w-2.5 ${theme.icon} shrink-0`} />
                                )}
                                <div className="flex items-center gap-1 text-[9px] text-muted-foreground shrink-0 ml-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    {new Date(task.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                </div>
                            </div>

                            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                {(isParent || task.createdBy === user?.id) && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0 text-blue-600 hover:bg-white/50"
                                            onClick={(e) => { e.stopPropagation(); openEditDialog(task); }}
                                        >
                                            <Pencil className="h-2.5 w-2.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0 text-red-600 hover:bg-white/50"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(task._id); }}
                                        >
                                            <Trash2 className="h-2.5 w-2.5" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            );
        }

        return (
            <Card key={task._id} className={`overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group bg-card/50 backdrop-blur-sm border-t-4 ${task.status === 'approved' ? 'border-t-purple-400' : 'border-t-blue-400'}`}>
                <CardHeader className={`${task.status === 'approved' ? 'bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20' : 'bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20'} p-6`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`px-2 py-0.5 bg-white/80 dark:bg-black/20 border-none font-bold text-[10px] ${statusColors[task.status as keyof typeof statusColors] || ''}`}>
                                {getStatusLabel(task.status)}
                            </Badge>
                        </div>
                        <div className="flex items-center text-amber-600 font-black bg-white dark:bg-black/40 px-3 py-1.5 rounded-full text-base shadow-md border-2 border-amber-100">
                            <Coins className="h-5 w-5 mr-1.5 text-amber-500" />
                            {task.points}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 mb-1">
                        <CardTitle className={`font-bold text-gray-800 dark:text-gray-100 ${task.status === 'approved' ? 'group-hover:text-purple-600' : 'group-hover:text-blue-600'} transition-colors uppercase tracking-tight text-xl`}>{task.title}</CardTitle>
                        {task.repeatFrequency && task.repeatFrequency !== 'none' && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[8px] px-1 py-0 border-none w-fit">
                                <Repeat className="h-2 w-2 mr-0.5" />
                                {task.repeatFrequency === 'daily' ? 'Hàng ngày' : task.repeatFrequency === 'weekly' ? 'Hàng tuần' : 'Một lần'}
                            </Badge>
                        )}
                    </div>
                    {task.description && (
                        <CardDescription className="line-clamp-2 text-sm mt-2 text-gray-600 dark:text-gray-400 italic">"{task.description}"</CardDescription>
                    )}
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                    <div className="flex flex-col gap-2">
                        <span className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Người thực hiện:</span>
                        <div className={`inline-flex items-center px-4 py-2 rounded-xl text-xl font-black shadow-lg border-2 ${(task.assignedTo === 'unassigned' || !task.assignedTo) ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200'} w-fit`}>
                            {(task.assignedTo === 'unassigned' || !task.assignedTo) ? 'ĐANG CHỜ CON NHẬN VIỆC' : task.assignedTo.toUpperCase()}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 p-4 flex justify-between items-center mt-auto">
                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(task.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                    {!isParent && (task.assignedTo === 'unassigned' || !task.assignedTo) && (
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
                            <Play className="mr-2 h-4 w-4" /> Bắt đầu
                        </Button>
                    )}
                    {!isParent && task.assignedToId === user?.id && task.status === 'in_progress' && (
                        <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                            onClick={() => handleUpdateStatus(task, 'completed')}
                        >
                            <Check className="mr-2 h-4 w-4" /> Xong
                        </Button>
                    )}
                    {!isParent && task.assignedToId === user?.id && task.status === 'completed' && (
                        <Badge className="bg-green-100 text-green-700 border-none text-[10px] px-1.5 py-0">Đang chờ duyệt</Badge>
                    )}
                    {!isParent && task.assignedToId === user?.id && task.status === 'approved' && (
                        <Badge className="bg-purple-100 text-purple-700 border-none text-[10px] px-1.5 py-0">Đã xong</Badge>
                    )}
                    {(isParent || task.createdBy === user?.id) && (
                        <div className="flex gap-1">
                            {task.status === 'completed' && isParent && (
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold h-7 text-[10px] px-2"
                                    onClick={() => handleUpdateStatus(task, 'approved')}
                                >
                                    <CheckCircle2 className="h-3 w-3" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 h-7 w-7 p-0 flex items-center justify-center"
                                onClick={() => openEditDialog(task)}
                                disabled={!isParent && task.status === 'approved'}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 h-7 w-7 p-0 flex items-center justify-center"
                                onClick={() => handleDelete(task._id)}
                                disabled={!isParent && task.status === 'approved'}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        );
    };

    const renderKanbanView = () => {
        const statuses: ('pending' | 'in_progress' | 'completed' | 'approved')[] = ['pending', 'in_progress', 'completed', 'approved'];

        const columnThemes = {
            pending: { bg: 'bg-amber-100/40 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800/40', dot: 'bg-amber-600', text: 'text-amber-900 dark:text-amber-300', badge: 'bg-amber-600 text-white' },
            in_progress: { bg: 'bg-blue-100/40 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800/40', dot: 'bg-blue-600', text: 'text-blue-900 dark:text-blue-300', badge: 'bg-blue-600 text-white' },
            completed: { bg: 'bg-indigo-100/40 dark:bg-indigo-900/10', border: 'border-indigo-200 dark:border-indigo-800/40', dot: 'bg-indigo-600', text: 'text-indigo-900 dark:text-indigo-300', badge: 'bg-indigo-600 text-white' },
            approved: { bg: 'bg-emerald-100/40 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800/40', dot: 'bg-emerald-600', text: 'text-emerald-900 dark:text-emerald-300', badge: 'bg-emerald-600 text-white' }
        };

        return (
            <DragDropContext
                onDragStart={onDragStart}
                onDragUpdate={onDragUpdate}
                onDragEnd={onDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0">
                    {statuses.map(status => {
                        const statusTasks = tasks.filter(t => t.status === status).slice(0, 20);
                        const theme = columnThemes[status];
                        return (
                            <div key={status} className="flex flex-col gap-3 min-w-[280px]">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className={`font-bold ${theme.text} flex items-center gap-2 text-sm uppercase tracking-wider`}>
                                        <div className={`w-2.5 h-2.5 rounded-full ${theme.dot} shadow-sm`} />
                                        {getStatusLabel(status)}
                                        <Badge variant="secondary" className={`ml-1 ${theme.badge} border-none text-[10px] h-4.5 min-w-4.5 px-1.5 flex items-center justify-center font-bold`}>
                                            {tasks.filter(t => t.status === status).length}
                                        </Badge>
                                    </h3>
                                </div>
                                <Droppable droppableId={status}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`${theme.bg} rounded-2xl p-3 flex flex-col gap-3 min-h-[500px] border ${theme.border} transition-all duration-300 ${snapshot.isDraggingOver ? 'ring-2 ring-inset ring-current/20 scale-[1.01]' : ''}`}
                                        >
                                            {statusTasks.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/30 italic text-xs border-2 border-dashed border-current/10 rounded-xl">
                                                    Trống
                                                </div>
                                            ) : (
                                                statusTasks.map((task, index) => (
                                                    <Draggable key={task._id} draggableId={task._id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    cursor: 'grab',
                                                                }}
                                                                className={snapshot.isDragging ? 'z-50' : ''}
                                                            >
                                                                <div style={{
                                                                    opacity: snapshot.isDragging ? 0.9 : 1,
                                                                    transform: snapshot.isDragging ? 'rotate(1deg) scale(1.02)' : 'none',
                                                                    transition: 'transform 0.1s ease',
                                                                }}>
                                                                    {renderTaskCard(task, true)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))
                                            )}
                                            {provided.placeholder}
                                            {tasks.filter(t => t.status === status).length > 20 && (
                                                <p className="text-[10px] text-center text-muted-foreground font-medium bg-white/50 dark:bg-black/20 py-1 rounded-lg">Còn {tasks.filter(t => t.status === status).length - 20} việc khác...</p>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        );
    };

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
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                        <Button
                            variant={globalTasksDisplayMode === 'kanban' ? 'secondary' : 'ghost'}
                            size="sm"
                            className={`h-8 w-8 p-0 ${globalTasksDisplayMode === 'kanban' ? 'bg-white dark:bg-slate-950 shadow-sm' : ''}`}
                            onClick={() => setGlobalTasksDisplayMode('kanban')}
                        >
                            <KanbanIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={globalTasksDisplayMode === 'card' ? 'secondary' : 'ghost'}
                            size="sm"
                            className={`h-8 w-8 p-0 ${globalTasksDisplayMode === 'card' ? 'bg-white dark:bg-slate-950 shadow-sm' : ''}`}
                            onClick={() => setGlobalTasksDisplayMode('card')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button onClick={openCreateDialog} className="shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none shrink-0">
                        <Plus className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Thêm công việc</span>
                    </Button>
                </div>
            </div>

            {isParent && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                    <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Tạo nhanh nhiệm vụ
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { title: 'Quét nhà', icon: <Brush className="h-4 w-4" />, points: 6, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
                            { title: 'Lau nhà', icon: <Droplets className="h-4 w-4" />, points: 6, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                            { title: 'Rửa bát', icon: <Utensils className="h-4 w-4" />, points: 5, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                            { title: 'Giặt phơi quần áo', icon: <Shirt className="h-4 w-4" />, points: 6, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                            { title: 'Gấp quần áo', icon: <Shirt className="h-4 w-4" />, points: 6, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                            { title: 'Đấm lưng cho mẹ', icon: <Heart className="h-4 w-4" />, points: 10, color: 'bg-red-100 text-red-700 hover:bg-red-200' },
                            { title: 'Tưới cây', icon: <Leaf className="h-4 w-4" />, points: 3, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                            { title: 'Cọ nhà vệ sinh', icon: <Bath className="h-4 w-4" />, points: 10, color: 'bg-pink-100 text-pink-700 hover:bg-pink-200' },
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
                                            repeatFrequency: 'one_time' // Auto-set to daily for quick tasks
                                        };
                                        const res = await fetch('/api/tasks', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(payload),
                                        });
                                        if (res.ok) {
                                            const newTask = await res.json();
                                            toast({ title: 'Đã tạo nhanh', description: `Nhiệm vụ "${q.title}" đã được tạo.` });
                                            // Update local state immediately
                                            setTasks(prev => [newTask, ...prev]);
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
            ) : globalTasksDisplayMode === 'kanban' ? (
                renderKanbanView()
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
                                        {isParent && <SelectItem value="approved">Đã duyệt</SelectItem>}
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
