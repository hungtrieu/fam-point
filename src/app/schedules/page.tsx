'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, CalendarDays, Coins, User as UserIcon, Check, X, Info } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { getChildren } from '@/app/members/actions';

interface Assignment {
    dayOfWeek: number;
    assignedToId?: string;
    assignedToName?: string;
}

interface Schedule {
    _id: string;
    title: string;
    description?: string;
    points: number;
    assignments: Assignment[];
    isActive: boolean;
    familyId: string;
}

interface Member {
    _id: string;
    name: string;
    role: string;
}

const DAYS_OF_WEEK = [
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' },
    { value: 6, label: 'Thứ 7' },
    { value: 0, label: 'Chủ Nhật' },
];

export default function SchedulesPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [childrenMembers, setChildrenMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentSchedule, setCurrentSchedule] = useState<Partial<Schedule>>({
        title: '',
        description: '',
        points: 10,
        assignments: [],
        isActive: true,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (user?.familyId) {
            fetchSchedules();
            fetchMembers();
        }
    }, [user?.familyId]);

    const fetchSchedules = async () => {
        if (!user?.familyId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/schedules?familyId=${user?.familyId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setSchedules(data);
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể tải lịch trình',
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
            const filterChildren = result.data.filter((m: Member) => m.role === 'child');
            setChildrenMembers(filterChildren);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditing && currentSchedule._id ? `/api/schedules/${currentSchedule._id}` : '/api/schedules';
            const method = isEditing ? 'PUT' : 'POST';

            const payload = {
                ...currentSchedule,
                familyId: user?.familyId,
                createdBy: user?.id
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Operation failed');

            toast({
                title: 'Thành công',
                description: `Lịch trình đã được ${isEditing ? 'cập nhật' : 'tạo'}`,
            });
            setIsDialogOpen(false);
            fetchSchedules();
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể lưu lịch trình',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa lịch trình này?')) return;
        try {
            const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            toast({ title: 'Thành công', description: 'Đã xóa lịch trình' });
            fetchSchedules();
        } catch (error) {
            toast({ title: 'Lỗi', description: 'Không thể xóa lịch trình', variant: 'destructive' });
        }
    };

    const openCreateDialog = () => {
        setCurrentSchedule({
            title: '',
            description: '',
            points: 10,
            assignments: [],
            isActive: true,
        });
        setIsEditing(false);
        setIsDialogOpen(true);
    };

    const openEditDialog = (schedule: Schedule) => {
        setCurrentSchedule(schedule);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const toggleDayAssignment = (dayValue: number, member?: Member) => {
        const assignments = [...(currentSchedule.assignments || [])];
        const index = assignments.findIndex(a => a.dayOfWeek === dayValue);

        if (member) {
            if (index > -1) {
                assignments[index] = { dayOfWeek: dayValue, assignedToId: member._id, assignedToName: member.name };
            } else {
                assignments.push({ dayOfWeek: dayValue, assignedToId: member._id, assignedToName: member.name });
            }
        } else {
            // Remove assignment
            if (index > -1) {
                assignments.splice(index, 1);
            }
        }
        setCurrentSchedule({ ...currentSchedule, assignments });
    };

    if (!mounted) return null;

    return (
        <div className="container mx-auto py-10 space-y-6 px-4 md:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Lịch trình công việc</h1>
                    <p className="text-muted-foreground mt-2">
                        Thiết lập các công việc lặp lại định kỳ cho các con.
                    </p>
                </div>
                <Button onClick={openCreateDialog} className="shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none shrink-0">
                    <Plus className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Thêm lịch trình</span>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {schedules.map((schedule) => (
                    <Card key={schedule._id} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-t-4 border-t-indigo-400">
                        <CardHeader className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant={schedule.isActive ? 'default' : 'secondary'} className={schedule.isActive ? 'bg-green-100 text-green-700' : ''}>
                                    {schedule.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                                </Badge>
                                <div className="flex items-center text-amber-600 font-extrabold bg-white/80 dark:bg-black/20 px-3 py-1 rounded-full text-sm shadow-sm">
                                    <Coins className="h-4 w-4 mr-1" />
                                    {schedule.points}
                                </div>
                            </div>
                            <CardTitle className="text-xl font-bold uppercase tracking-tight">{schedule.title}</CardTitle>
                            {schedule.description && (
                                <CardDescription className="line-clamp-2 italic mt-1 font-medium">{schedule.description}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" />
                                    Lịch phân công:
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {DAYS_OF_WEEK.map((day) => {
                                        const assignment = schedule.assignments.find(a => a.dayOfWeek === day.value);
                                        return (
                                            <div key={day.value} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                                <span className="font-medium text-slate-600 dark:text-slate-400">{day.label}</span>
                                                {assignment ? (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        <UserIcon className="h-3 w-3 mr-1" />
                                                        {assignment.assignedToName}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-slate-400 italic text-xs">Nghỉ</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 p-4 flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400" onClick={() => openEditDialog(schedule)}>
                                <Pencil className="h-4 w-4 mr-2" /> Sửa
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400" onClick={() => handleDelete(schedule._id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Xóa
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {schedules.length === 0 && !isLoading && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border-2 border-dashed border-muted">
                        <CalendarDays className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold">Chưa có lịch trình nào</h3>
                        <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                            Tạo lịch trình để tự động giao việc cho các con hàng ngày.
                        </p>
                        <Button onClick={openCreateDialog} variant="outline">Tạo lịch trình ngay</Button>
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Sửa lịch trình' : 'Thêm lịch trình mới'}</DialogTitle>
                        <DialogDescription>
                            Thiết lập công việc và phân công theo từng ngày trong tuần.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Tên công việc</Label>
                                <Input
                                    id="title"
                                    value={currentSchedule.title}
                                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, title: e.target.value })}
                                    required
                                    placeholder="Ví dụ: Quét nhà"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="points">Điểm thưởng (mỗi lần)</Label>
                                <Input
                                    id="points"
                                    type="number"
                                    value={currentSchedule.points}
                                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, points: Number(e.target.value) })}
                                    required
                                    min={0}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <Textarea
                                id="description"
                                value={currentSchedule.description}
                                onChange={(e) => setCurrentSchedule({ ...currentSchedule, description: e.target.value })}
                                placeholder="Ghi chú thêm về công việc này..."
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-bold text-indigo-600">Phân công hàng tuần</Label>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    Ngày không chọn sẽ mặc định là không giao việc.
                                </div>
                            </div>

                            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                {DAYS_OF_WEEK.map((day) => {
                                    const assignment = currentSchedule.assignments?.find(a => a.dayOfWeek === day.value);
                                    return (
                                        <div key={day.value} className="flex items-center gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                            <div className="w-20 font-bold text-sm">{day.label}</div>
                                            <div className="flex-1">
                                                <Select
                                                    value={assignment?.assignedToId || 'none'}
                                                    onValueChange={(val) => {
                                                        if (val === 'none') {
                                                            toggleDayAssignment(day.value);
                                                        } else {
                                                            const member = childrenMembers.find(m => m._id === val);
                                                            toggleDayAssignment(day.value, member);
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className={`h-9 ${assignment ? 'border-indigo-200 bg-indigo-50/30' : ''}`}>
                                                        <SelectValue placeholder="Không giao việc" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">Nghỉ / Không làm</SelectItem>
                                                        {childrenMembers.map((member) => (
                                                            <SelectItem key={member._id} value={member._id}>
                                                                {member.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {assignment && (
                                                <div className="flex items-center text-green-600 bg-green-50 dark:bg-green-900/20 p-1.5 rounded-full">
                                                    <Check className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={currentSchedule.isActive}
                                onChange={(e) => setCurrentSchedule({ ...currentSchedule, isActive: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            />
                            <Label htmlFor="isActive">Kích hoạt lịch trình này</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                                {isEditing ? 'Lưu thay đổi' : 'Tạo lịch trình'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
