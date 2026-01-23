'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen, Clock, MapPin, User as UserIcon, Calendar, FileText, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StudySchedule {
    _id: string;
    subject: string;
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    studentId: string;
    studentName: string;
    familyId: string;
    location?: string;
    notes?: string;
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

export default function StudySchedulesPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [schedules, setSchedules] = useState<StudySchedule[]>([]);
    const [childrenMembers, setChildrenMembers] = useState<Member[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentSchedule, setCurrentSchedule] = useState<Partial<StudySchedule>>({
        subject: '',
        startTime: '08:00',
        endTime: '09:00',
        dayOfWeek: 1,
        location: '',
        notes: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('all');

    useEffect(() => {
        setMounted(true);
        if (user?.familyId) {
            fetchMembers();
        }
    }, [user?.familyId]);

    useEffect(() => {
        if (user) {
            if (user.role === 'child') {
                setSelectedStudentId(user.id);
            } else if (childrenMembers.length > 0 && !selectedStudentId) {
                setSelectedStudentId(childrenMembers[0]._id);
            }
        }
    }, [user, childrenMembers]);

    useEffect(() => {
        if (selectedStudentId) {
            fetchSchedules();
        }
    }, [selectedStudentId]);

    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/study-schedules?studentId=${selectedStudentId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setSchedules(data);
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể tải thời khóa biểu',
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

        if (currentSchedule.startTime && currentSchedule.endTime) {
            if (currentSchedule.startTime >= currentSchedule.endTime) {
                toast({
                    title: 'Lỗi thời gian',
                    description: 'Thời gian kết thúc phải sau thời gian bắt đầu',
                    variant: 'destructive',
                });
                return;
            }

            const minTime = "06:00";
            const maxTime = "23:00";
            if (currentSchedule.startTime < minTime || currentSchedule.startTime > maxTime ||
                currentSchedule.endTime < minTime || currentSchedule.endTime > maxTime) {
                toast({
                    title: 'Lỗi thời gian',
                    description: 'Giờ học chỉ được phép trong khoảng từ 06:00 đến 23:00',
                    variant: 'destructive',
                });
                return;
            }
        }

        try {
            const url = isEditing && currentSchedule._id ? `/api/study-schedules/${currentSchedule._id}` : '/api/study-schedules';
            const method = isEditing ? 'PUT' : 'POST';

            const student = childrenMembers.find(m => m._id === selectedStudentId);

            const payload = {
                ...currentSchedule,
                familyId: user?.familyId,
                studentId: selectedStudentId,
                studentName: student?.name,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Operation failed');

            toast({
                title: 'Thành công',
                description: `Thời khóa biểu đã được ${isEditing ? 'cập nhật' : 'tạo'}`,
            });
            setIsDialogOpen(false);
            fetchSchedules();
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể lưu thời khóa biểu',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa mục này?')) return;
        try {
            const res = await fetch(`/api/study-schedules/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            toast({ title: 'Thành công', description: 'Đã xóa' });
            fetchSchedules();
        } catch (error) {
            toast({ title: 'Lỗi', description: 'Không thể xóa', variant: 'destructive' });
        }
    };

    const openCreateDialog = (day?: number) => {
        setCurrentSchedule({
            subject: '',
            startTime: '08:00',
            endTime: '09:00',
            dayOfWeek: day !== undefined ? day : 1,
            location: '',
            notes: '',
        });
        setIsEditing(false);
        setIsDialogOpen(true);
    };

    const openEditDialog = (schedule: StudySchedule) => {
        setCurrentSchedule(schedule);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    if (!mounted) return null;

    const getSessionLabel = (startTime: string) => {
        const hour = parseInt(startTime.split(':')[0]);
        if (hour < 12) return { label: 'Buổi sáng', icon: '☀️', color: 'text-orange-500' };
        if (hour < 18) return { label: 'Buổi chiều', icon: '⛅', color: 'text-blue-500' };
        return { label: 'Buổi tối', icon: '🌙', color: 'text-indigo-500' };
    };

    const groupSchedulesBySession = (daySchedules: StudySchedule[]) => {
        const groups: { [key: string]: StudySchedule[] } = {
            'Buổi sáng': [],
            'Buổi chiều': [],
            'Buổi tối': []
        };

        daySchedules.forEach(s => {
            const session = getSessionLabel(s.startTime).label;
            groups[session].push(s);
        });

        return groups;
    };

    if (!mounted) return null;

    const schedulesByDay = (day: number) => schedules.filter(s => s.dayOfWeek === day);

    const DaySchedulesList = ({ daySchedules }: { daySchedules: StudySchedule[] }) => {
        const grouped = groupSchedulesBySession(daySchedules);
        const sessions = ['Buổi sáng', 'Buổi chiều', 'Buổi tối'];
        const [expandedSessions, setExpandedSessions] = useState<string[]>([]);

        const toggleSession = (session: string) => {
            setExpandedSessions(prev =>
                prev.includes(session)
                    ? prev.filter(s => s !== session)
                    : [...prev, session]
            );
        };

        return (
            <div className="space-y-4">
                {sessions.map(session => {
                    const sessionSchedules = grouped[session];
                    if (sessionSchedules.length === 0) return null;

                    const isExpanded = expandedSessions.includes(session);
                    const info = getSessionLabel(session === 'Buổi sáng' ? '08:00' : session === 'Buổi chiều' ? '14:00' : '19:00');

                    return (
                        <div key={session} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
                            <button
                                onClick={() => toggleSession(session)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{info.icon}</span>
                                    <h4 className={`text-sm font-black uppercase tracking-widest ${info.color}`}>
                                        {session}
                                    </h4>
                                    <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-500 font-bold border-none text-[10px]">
                                        {sessionSchedules.length} tiết
                                    </Badge>
                                </div>
                                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isExpanded && (
                                <div className="p-4 pt-0 grid gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {sessionSchedules.map(schedule => (
                                        <ScheduleCard key={schedule._id} schedule={schedule} onEdit={openEditDialog} onDelete={handleDelete} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {daySchedules.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-100 dark:border-emerald-900/20 bg-emerald-50/10 dark:bg-emerald-900/5 text-muted-foreground text-sm italic">
                        <BookOpen className="h-8 w-8 mb-2 opacity-20" />
                        Không có lịch học
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="container mx-auto py-10 space-y-8 px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Thời khóa biểu</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Quản lý lịch học tập của các con một cách khoa học.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {user?.role === 'parent' && (
                        <div className="min-w-[200px]">
                            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-2 border-emerald-100 dark:border-emerald-900/30 shadow-sm rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-emerald-500" />
                                        <SelectValue placeholder="Chọn con" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {childrenMembers.map((child) => (
                                        <SelectItem key={child._id} value={child._id}>
                                            {child.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <Button onClick={() => openCreateDialog()} className="rounded-xl shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-none px-6">
                        <Plus className="h-5 w-5 mr-2" />
                        Thêm lịch học
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start overflow-x-auto bg-emerald-50/50 dark:bg-emerald-900/10 p-1 mb-8 rounded-2xl border-none">
                    <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-800 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-50 data-[state=active]:shadow-md px-6 py-2.5">Tất cả các ngày</TabsTrigger>
                    {DAYS_OF_WEEK.map(day => (
                        <TabsTrigger key={day.value} value={day.value.toString()} className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-800 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-50 data-[state=active]:shadow-md px-6 py-2.5">
                            {day.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="all" className="mt-0">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {DAYS_OF_WEEK.map(day => {
                            const daySchedules = schedulesByDay(day.value);
                            return (
                                <div key={day.value} className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="font-bold text-lg text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                            <Calendar className="h-5 w-5" />
                                            {day.label}
                                        </h3>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" onClick={() => openCreateDialog(day.value)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <DaySchedulesList daySchedules={daySchedules} />
                                </div>
                            );
                        })}
                    </div>
                </TabsContent>

                {DAYS_OF_WEEK.map(day => (
                    <TabsContent key={day.value} value={day.value.toString()} className="mt-0">
                        <div className="max-w-4xl">
                            <DaySchedulesList daySchedules={schedulesByDay(day.value)} />
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">{isEditing ? 'Sửa lịch học' : 'Thêm lịch học mới'}</DialogTitle>
                            <DialogDescription className="text-emerald-50 opacity-90 text-base">
                                Điền thông tin buổi học bên dưới.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white dark:bg-slate-900">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Môn học / Hoạt động</Label>
                                <Input
                                    id="subject"
                                    value={currentSchedule.subject}
                                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, subject: e.target.value })}
                                    required
                                    placeholder="Ví dụ: Toán, Tiếng Anh, Piano..."
                                    className="rounded-xl border-emerald-100 h-11"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Giờ bắt đầu</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={currentSchedule.startTime?.split(':')[0] || '08'}
                                            onValueChange={(h) => {
                                                const m = currentSchedule.startTime?.split(':')[1] || '00';
                                                const newTime = `${h}:${m}`;
                                                setCurrentSchedule({
                                                    ...currentSchedule,
                                                    startTime: newTime,
                                                    endTime: newTime
                                                });
                                            }}
                                        >
                                            <SelectTrigger className="rounded-xl border-emerald-100 h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 18 }, (_, i) => i + 6).map(h => {
                                                    const val = h.toString().padStart(2, '0');
                                                    return <SelectItem key={val} value={val}>{val}h</SelectItem>
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={currentSchedule.startTime?.split(':')[1] || '00'}
                                            onValueChange={(m) => {
                                                const h = currentSchedule.startTime?.split(':')[0] || '08';
                                                const newTime = `${h}:${m}`;
                                                setCurrentSchedule({
                                                    ...currentSchedule,
                                                    startTime: newTime,
                                                    endTime: newTime
                                                });
                                            }}
                                        >
                                            <SelectTrigger className="rounded-xl border-emerald-100 h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 12 }, (_, i) => i * 5).map(m => {
                                                    const val = m.toString().padStart(2, '0');
                                                    return <SelectItem key={val} value={val}>{val}p</SelectItem>
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Giờ kết thúc</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={currentSchedule.endTime?.split(':')[0] || '09'}
                                            onValueChange={(h) => {
                                                const m = currentSchedule.endTime?.split(':')[1] || '00';
                                                setCurrentSchedule({ ...currentSchedule, endTime: `${h}:${m}` });
                                            }}
                                        >
                                            <SelectTrigger className="rounded-xl border-emerald-100 h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 18 }, (_, i) => i + 6).map(h => {
                                                    const val = h.toString().padStart(2, '0');
                                                    return <SelectItem key={val} value={val}>{val}h</SelectItem>
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={currentSchedule.endTime?.split(':')[1] || '00'}
                                            onValueChange={(m) => {
                                                const h = currentSchedule.endTime?.split(':')[0] || '09';
                                                setCurrentSchedule({ ...currentSchedule, endTime: `${h}:${m}` });
                                            }}
                                        >
                                            <SelectTrigger className="rounded-xl border-emerald-100 h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 12 }, (_, i) => i * 5).map(m => {
                                                    const val = m.toString().padStart(2, '0');
                                                    return <SelectItem key={val} value={val}>{val}p</SelectItem>
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dayOfWeek">Ngày trong tuần</Label>
                                <Select
                                    value={currentSchedule.dayOfWeek?.toString()}
                                    onValueChange={(val) => setCurrentSchedule({ ...currentSchedule, dayOfWeek: Number(val) })}
                                >
                                    <SelectTrigger className="rounded-xl border-emerald-100 h-11">
                                        <SelectValue placeholder="Chọn ngày" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DAYS_OF_WEEK.map(day => (
                                            <SelectItem key={day.value} value={day.value.toString()}>
                                                {day.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Địa điểm (Tùy chọn)</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="location"
                                        value={currentSchedule.location}
                                        onChange={(e) => setCurrentSchedule({ ...currentSchedule, location: e.target.value })}
                                        placeholder="Ví dụ: Trường học, Nhà, Trung tâm..."
                                        className="rounded-xl border-emerald-100 h-11 pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Ghi chú (Tùy chọn)</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Textarea
                                        id="notes"
                                        value={currentSchedule.notes}
                                        onChange={(e) => setCurrentSchedule({ ...currentSchedule, notes: e.target.value })}
                                        placeholder="Ghi chú thêm về buổi học..."
                                        className="rounded-xl border-emerald-100 min-h-[100px] pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-3 sm:gap-0">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Hủy</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8 shadow-lg shadow-emerald-200 dark:shadow-none">
                                {isEditing ? 'Lưu thay đổi' : 'Tạo lịch học'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ScheduleCard({ schedule, onEdit, onDelete }: { schedule: StudySchedule, onEdit: (s: StudySchedule) => void, onDelete: (id: string) => void }) {
    return (
        <Card className="group relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border-l-4 border-l-emerald-500">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-inner">
                        <Clock className="h-3 w-3" />
                        {schedule.startTime} - {schedule.endTime}
                    </div>
                </div>
                <CardTitle className="text-base font-bold mt-2 text-slate-800 dark:text-slate-100 leading-tight">
                    {schedule.subject}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2">
                {schedule.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{schedule.location}</span>
                    </div>
                )}
                {schedule.notes && (
                    <div className="text-[11px] bg-slate-50 dark:bg-black/20 p-2 rounded-xl text-slate-500 italic line-clamp-1">
                        {schedule.notes}
                    </div>
                )}
            </CardContent>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white/90 dark:bg-slate-800 shadow-sm text-blue-600 hover:bg-white" onClick={() => onEdit(schedule)}>
                    <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white/90 dark:bg-slate-800 shadow-sm text-red-600 hover:bg-white" onClick={() => onDelete(schedule._id)}>
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        </Card>
    );
}
