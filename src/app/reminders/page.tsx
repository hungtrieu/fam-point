'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Bell, User, Clock, CheckCircle2, Megaphone, CalendarDays, Image as ImageIcon, X, Loader2, Camera } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { getChildren } from '@/app/members/actions';
import { Checkbox } from '@/components/ui/checkbox';

interface Reminder {
    _id: string;
    title: string;
    content: string;
    familyId: string;
    targetUserIds: string[] | { _id: string; name: string }[];
    createdBy: string | { _id: string; name: string };
    isRead: boolean;
    reminderDate?: string;
    imageUrl?: string;
    createdAt: string;
}

interface Member {
    _id: string;
    name: string;
    role: string;
}

const getVietnameseDay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[date.getDay()];
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

export default function RemindersPage() {
    const { user } = useAuth();
    const isParent = user?.role === 'parent';
    const { toast } = useToast();

    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [childrenMembers, setChildrenMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentReminder, setCurrentReminder] = useState<Partial<Reminder>>({
        title: '',
        content: '',
        targetUserIds: [],
        reminderDate: new Date().toISOString().split('T')[0],
        imageUrl: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => {
            setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);

        if (user?.familyId) {
            fetchReminders();
            fetchMembers();
        }
        return () => window.removeEventListener('resize', checkMobile);
    }, [user?.familyId, user?.role]);

    const fetchReminders = async () => {
        if (!user?.familyId || !user?.id) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/reminders?familyId=${user.familyId}&userId=${user.id}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setReminders(data);
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể tải lời nhắc',
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
            // Filter out current user from the list (you don't usually remind yourself)
            const familyMembers = result.data.filter((m: Member) => m._id !== user.id);
            setChildrenMembers(familyMembers);
        }
    };

    const openCreateDialog = () => {
        setCurrentReminder({
            title: '',
            content: '',
            targetUserIds: [],
            reminderDate: new Date().toISOString().split('T')[0],
            imageUrl: '',
        });
        setIsEditing(false);
        setIsDialogOpen(true);
    };

    const openEditDialog = (reminder: Reminder) => {
        setCurrentReminder({
            ...reminder,
            targetUserIds: (reminder.targetUserIds as any[]).map(u => typeof u === 'string' ? u : u._id)
        });
        setIsEditing(true);
        setIsViewing(false);
        setIsDialogOpen(true);
    };

    const openViewDialog = (reminder: Reminder) => {
        setCurrentReminder(reminder);
        setIsEditing(false);
        setIsViewing(true);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentReminder.title || (currentReminder.targetUserIds?.length === 0)) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng điền đầy đủ thông tin và chọn ít nhất một người nhận',
                variant: 'destructive',
            });
            return;
        }

        try {
            const url = isEditing ? `/api/reminders/${currentReminder._id}` : '/api/reminders';
            const method = isEditing ? 'PATCH' : 'POST';

            const payload = {
                ...currentReminder,
                familyId: user?.familyId,
                createdBy: typeof currentReminder.createdBy === 'object' ? (currentReminder.createdBy as any)._id : (currentReminder.createdBy || user?.id),
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Operation failed');

            toast({
                title: 'Thành công',
                description: isEditing ? 'Đã cập nhật lời nhắc' : 'Đã gửi lời nhắc',
            });
            setIsDialogOpen(false);
            fetchReminders();
            setCurrentReminder({ title: '', content: '', targetUserIds: [], reminderDate: new Date().toISOString().split('T')[0], imageUrl: '' });
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể lưu lời nhắc',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa lời nhắc này?')) return;
        try {
            const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            toast({ title: 'Thành công', description: 'Đã xóa lời nhắc' });
            fetchReminders();
        } catch (error: any) {
            toast({ title: 'Lỗi', description: 'Không thể xóa lời nhắc', variant: 'destructive' });
        }
    };

    const toggleTargetUser = (userId: string) => {
        const currentIds = [...(currentReminder.targetUserIds as string[])];
        const index = currentIds.indexOf(userId);
        if (index > -1) {
            currentIds.splice(index, 1);
        } else {
            currentIds.push(userId);
        }
        setCurrentReminder({ ...currentReminder, targetUserIds: currentIds });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng chọn tệp hình ảnh',
                variant: 'destructive',
            });
            return;
        }

        setIsUploading(true);
        try {
            // 1. Resize image
            const resizedImage = await resizeImage(file, 1920);

            // 2. Prepare upload
            const formData = new FormData();
            formData.append('file', resizedImage);

            let uploadUrl = '';
            let responseData: any;

            // Check if we are in development environment
            const isDev = process.env.NODE_ENV === 'development';

            if (isDev) {
                // Use local upload API in development
                uploadUrl = '/api/upload';
                const res = await fetch(uploadUrl, {
                    method: 'POST',
                    body: formData,
                });
                if (!res.ok) throw new Error('Local upload failed');
                responseData = await res.json();
            } else {
                // Use Cloudinary in production
                formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                if (!cloudName) {
                    throw new Error('Cloudinary cloud name not configured');
                }
                uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

                const res = await fetch(uploadUrl, {
                    method: 'POST',
                    body: formData,
                });
                if (!res.ok) throw new Error('Cloudinary upload failed');
                responseData = await res.json();
            }

            setCurrentReminder({ ...currentReminder, imageUrl: responseData.secure_url });

            toast({
                title: 'Thành công',
                description: isDev ? 'Đã lưu ảnh vào máy cục bộ' : 'Đã tải ảnh lên Cloudinary',
            });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                title: 'Lỗi',
                description: `Không thể tải ảnh lên: ${error.message}`,
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const resizeImage = (file: File, maxWidth: number): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Canvas to Blob failed'));
                    }, 'image/jpeg', 0.8);
                };
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const renderReminderCard = (reminder: Reminder) => (
        <Card key={reminder._id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm border-l-4 border-l-orange-400">
            <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="px-2 py-0.5 bg-orange-50 text-orange-600 border-orange-200 text-[10px] uppercase font-bold">
                        Lời nhắc
                    </Badge>
                    {reminder.reminderDate && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold text-[10px]">
                            {getVietnameseDay(reminder.reminderDate)}, {formatDate(reminder.reminderDate)}
                        </Badge>
                    )}
                </div>
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 cursor-pointer hover:text-orange-600 transition-colors" onClick={() => openViewDialog(reminder)}>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-orange-500" />
                            {reminder.title}
                        </div>
                        <div className="text-[10px] font-normal text-muted-foreground ml-7">
                            Gửi từ: <span className="font-semibold">{(reminder.createdBy as any)._id === user?.id ? 'Bạn' : (reminder.createdBy as any).name}</span>
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
                {reminder.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 aspect-video relative group">
                        <img
                            src={reminder.imageUrl}
                            alt={reminder.title}
                            className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
                            onClick={() => openViewDialog(reminder)}
                        />
                    </div>
                )}
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{reminder.content}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs font-semibold text-muted-foreground mr-1">Gửi cho:</span>
                    {(reminder.targetUserIds as any[]).map((u: any) => (
                        <Badge key={u._id} variant="secondary" className="bg-blue-50 text-blue-600 border-none font-medium">
                            <User className="h-3 w-3 mr-1" />
                            {u._id === user?.id ? 'Bạn' : u.name}
                        </Badge>
                    ))}
                </div>
            </CardContent>
            {((reminder.createdBy as any)._id === user?.id || isParent) && (
                <CardFooter className="bg-muted/30 p-4 pt-2 flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-blue-100 text-blue-600"
                        onClick={() => openEditDialog(reminder)}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Sửa
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-red-100 text-red-600"
                        onClick={() => handleDelete(reminder._id)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" /> Xóa
                    </Button>
                </CardFooter>
            )}
        </Card>
    );

    if (!mounted) return null;

    return (
        <div className="container mx-auto py-10 space-y-6 px-4 md:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent flex items-center gap-2">
                        <Megaphone className="h-8 w-8 text-orange-500" />
                        Ghi chú nhắc nhở
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Trao đổi, nhắc nhở và nhắn nhủ giữa các thành viên trong gia đình.
                    </p>
                </div>
                <Button onClick={openCreateDialog} className="shadow-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-none">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm nhắc nhở
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : reminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                    <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold">Chưa có lời nhắc nào</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        Hãy gửi lời nhắc đầu tiên cho mọi người nhé!
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reminders.map(renderReminderCard)}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {isViewing ? 'Chi tiết lời nhắc' : isEditing ? 'Sửa lời nhắc' : 'Tạo lời nhắc mới'}
                        </DialogTitle>
                        <DialogDescription>
                            {isViewing ? 'Thông tin chi tiết về lời nhắc này.' : isEditing ? 'Cập nhật lại nội dung lời nhắc.' : 'Nhập nội dung lời nhắc và chọn người nhận.'}
                        </DialogDescription>
                    </DialogHeader>
                    {isViewing ? (
                        <div className="space-y-4 py-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase">Tiêu đề</Label>
                                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{currentReminder.title}</div>
                            </div>
                            {currentReminder.reminderDate && (
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase">Ngày nhắc nhở</Label>
                                    <div className="flex items-center gap-2 text-blue-600 font-semibold">
                                        <CalendarDays className="h-4 w-4" />
                                        {getVietnameseDay(currentReminder.reminderDate)}, {formatDate(currentReminder.reminderDate)}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase">Nội dung</Label>
                                <div className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    {currentReminder.content || <span className="italic text-muted-foreground font-normal">Không có nội dung chi tiết.</span>}
                                </div>
                            </div>
                            {currentReminder.imageUrl && (
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase">Hình ảnh</Label>
                                    <div className="rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                                        <img src={currentReminder.imageUrl} alt={currentReminder.title} className="w-full h-auto" />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase">Gửi cho</Label>
                                <div className="flex flex-wrap gap-2">
                                    {(currentReminder.targetUserIds as any[]).map((u: any) => (
                                        <Badge key={u._id} variant="secondary" className="bg-blue-50 text-blue-600 border-none">
                                            <User className="h-3 w-3 mr-1" />
                                            {u._id === user?.id ? 'Bạn' : u.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button className="w-full" onClick={() => setIsDialogOpen(false)}>Đóng</Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Tiêu đề</Label>
                                <Input
                                    id="title"
                                    value={currentReminder.title}
                                    onChange={(e) => setCurrentReminder({ ...currentReminder, title: e.target.value })}
                                    placeholder="Ví dụ: Mặc đồng phục lớp"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reminderDate">Ngày nhắc nhở</Label>
                                <Input
                                    id="reminderDate"
                                    type="date"
                                    value={currentReminder.reminderDate}
                                    onChange={(e) => setCurrentReminder({ ...currentReminder, reminderDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Nội dung</Label>
                                <Textarea
                                    id="content"
                                    value={currentReminder.content}
                                    onChange={(e) => setCurrentReminder({ ...currentReminder, content: e.target.value })}
                                    placeholder="Ví dụ: Ngày mai các con mặc đồng phục lớp để thi kéo co nhé!"
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Hình ảnh</Label>
                                {currentReminder.imageUrl ? (
                                    <div className="relative rounded-lg overflow-hidden border">
                                        <img src={currentReminder.imageUrl} alt="Preview" className="w-full h-40 object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                            onClick={() => setCurrentReminder({ ...currentReminder, imageUrl: '' })}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {isMobile && process.env.NODE_ENV !== 'development' && (
                                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-orange-200 rounded-lg p-6 bg-orange-50/50 hover:bg-orange-50 transition-colors cursor-pointer relative group">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={handleImageUpload}
                                                    disabled={isUploading}
                                                />
                                                <Camera className="h-8 w-8 text-orange-500 mb-2 group-active:scale-95 transition-transform" />
                                                <p className="text-sm text-orange-600 font-bold">Chụp ảnh ngay</p>
                                                <p className="text-[10px] text-orange-400">Sử dụng camera điện thoại</p>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleImageUpload}
                                                disabled={isUploading}
                                            />
                                            {isUploading ? (
                                                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                                            ) : (
                                                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                            )}
                                            <p className="text-sm text-muted-foreground">
                                                {isUploading ? 'Đang tải lên...' : 'Bấm để chọn ảnh từ máy'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <Label>Gửi cho</Label>
                                <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-muted/20">
                                    {childrenMembers.map((member) => (
                                        <div key={member._id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`user-${member._id}`}
                                                checked={(currentReminder.targetUserIds as string[]).includes(member._id)}
                                                onCheckedChange={() => toggleTargetUser(member._id)}
                                            />
                                            <label
                                                htmlFor={`user-${member._id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {member.name} {member.role === 'parent' ? '(Ba mẹ)' : ''}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                                    {isEditing ? 'Lưu thay đổi' : 'Gửi lời nhắc'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
