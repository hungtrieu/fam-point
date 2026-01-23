'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Copy, RefreshCw, User as UserIcon, Key, History, MoreVertical } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getChildren, createChild, updateChild, deleteChild, resetChildPassword } from './actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Child {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    points: number;
    role: 'parent' | 'child';
}

interface ChildrenClientProps {
    initialData: Child[];
}

export default function ChildrenClient({ initialData }: ChildrenClientProps) {
    const [children, setChildren] = useState<Child[]>(initialData);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // New child credentials state
    const [newCredentials, setNewCredentials] = useState<{ email: string, password: string } | null>(null);
    const [role, setRole] = useState('child');

    const { toast } = useToast();
    const router = useRouter();

    const { user } = useAuth();

    const refreshChildren = useCallback(() => {
        if (user?.familyId) {
            getChildren(user.familyId).then(result => {
                if (result.success) {
                    setChildren(result.data);
                }
                setIsFetching(false);
            });
        } else {
            setIsFetching(false);
        }
    }, [user?.familyId]);

    useEffect(() => {
        refreshChildren();
    }, [refreshChildren]);

    const handleCreate = async (formData: FormData) => {
        if (!user?.familyId) {
            toast({ title: 'Lỗi', description: 'Không tìm thấy thông tin gia đình', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        const result = await createChild(user.familyId, null, formData);
        setIsLoading(false);

        if (result.success && result.generatedPassword) {
            toast({
                title: 'Thành công',
                description: 'Đã tạo tài khoản cho con thành công',
            });
            setIsAddOpen(false);
            setNewCredentials({
                email: formData.get('email') as string,
                password: result.generatedPassword
            });
            refreshChildren();
        } else {
            toast({
                title: 'Lỗi',
                description: result.error || 'Có lỗi xảy ra',
                variant: 'destructive',
            });
        }
    };

    const handleUpdate = async (formData: FormData) => {
        if (!selectedChild) return;
        setIsLoading(true);
        const result = await updateChild(selectedChild._id, formData);
        setIsLoading(false);

        if (result.success) {
            toast({ title: 'Đã cập nhật', description: 'Thông tin con đã được cập nhật' });
            setIsEditOpen(false);
            setSelectedChild(null);
            refreshChildren();
        } else {
            toast({ title: 'Lỗi', description: result.error, variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa tài khoản này không?')) return;

        const result = await deleteChild(id);
        if (result.success) {
            toast({ title: 'Đã xóa', description: 'Đã xóa tài khoản con' });
            refreshChildren();
        } else {
            toast({ title: 'Lỗi', description: result.error, variant: 'destructive' });
        }
    };

    const copyPassword = () => {
        if (newCredentials) {
            navigator.clipboard.writeText(newCredentials.password);
            toast({ title: 'Đã sao chép', description: 'Mật khẩu đã được sao chép vào clipboard' });
        }
    };

    // Password reset state
    const [isResetPassOpen, setIsResetPassOpen] = useState(false);

    const handleResetPassword = async (formData: FormData) => {
        if (!selectedChild) return;
        setIsLoading(true);
        // If password field is empty, it will generate random
        const newPass = formData.get('password') as string;

        const result = await resetChildPassword(selectedChild._id, newPass);
        setIsLoading(false);

        if (result.success) {
            toast({ title: 'Thành công', description: 'Đã đổi mật khẩu thành công' });
            setIsResetPassOpen(false);

            // If generated or set, show it to user
            if (result.generatedPassword) {
                setNewCredentials({
                    email: selectedChild.email,
                    password: result.generatedPassword
                });
            }

            setSelectedChild(null);
        } else {
            toast({ title: 'Lỗi', description: result.error, variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Quản lý thành viên</h1>
                    <p className="text-muted-foreground mt-2">Quản lý danh sách và thông tin đăng nhập của các thành viên.</p>
                </div>
                {user?.role === 'parent' && (
                    <Button onClick={() => setIsAddOpen(true)} className="shadow-lg transition-all hover:scale-105 shrink-0">
                        <Plus className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Thêm thành viên</span>
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isFetching ? (
                    <div className="col-span-full flex justify-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {children.map((child) => (
                            <Card key={child._id} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group bg-card/50 backdrop-blur-sm">
                                <CardHeader className="flex flex-row items-center gap-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6">
                                    <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                                        <AvatarImage src={child.avatar} alt={child.name} />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-bold">
                                            {child.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 transition-colors">{child.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            <UserIcon className="w-3 h-3" /> {child.email}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Điểm hiện tại</span>
                                            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{child.points}</span>
                                        </div>
                                        <Badge variant={child.role === 'parent' ? "default" : "outline"} className={`px-3 py-1 ${child.role === 'parent' ? '' : 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'}`}>
                                            {child.role === 'parent' ? 'Cha mẹ' : 'Con cái'}
                                        </Badge>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/30 p-4 flex justify-between items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push(`/history?userId=${child._id}`)}
                                        className="flex-1 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                                    >
                                        <History className="h-4 w-4 mr-2" /> Lịch sử
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => { setSelectedChild(child); setIsResetPassOpen(true); }}>
                                                <Key className="h-4 w-4 mr-2" />
                                                Đổi mật khẩu
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { setSelectedChild(child); setIsEditOpen(true); }}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Chỉnh sửa
                                            </DropdownMenuItem>
                                            {user?.role === 'parent' && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(child._id)}
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Xóa thành viên
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardFooter>
                            </Card>
                        ))}

                        {children.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border-2 border-dashed border-muted">
                                <div className="bg-muted/50 p-4 rounded-full mb-4">
                                    <UserIcon className="h-10 w-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold">Chưa có thành viên nào</h3>
                                <p className="text-muted-foreground max-w-sm mt-2 mb-6">Hãy tạo tài khoản cho thành viên để bắt đầu.</p>
                                {user?.role === 'parent' && (
                                    <Button onClick={() => setIsAddOpen(true)} variant="outline">Tạo tài khoản đầu tiên</Button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Thêm thành viên mới</DialogTitle>
                        <DialogDescription>
                            Tạo tài khoản mới. Mật khẩu sẽ được tạo ngẫu nhiên.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleCreate} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên hiển thị</Label>
                            <Input id="name" name="name" placeholder="Ví dụ: Bé Bi" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email đăng nhập</Label>
                            <Input id="email" name="email" type="email" placeholder="example@family.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Phân loại thành viên</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn vai trò" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="parent">Cha mẹ</SelectItem>
                                    <SelectItem value="child">Con cái</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="role" value={role} />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Hủy</Button>
                            <Button type="submit" disabled={isLoading}>{isLoading ? 'Đang tạo...' : 'Tạo tài khoản'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa thông tin</DialogTitle>
                        <DialogDescription>
                            Cập nhật thông tin thành viên trong gia đình.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleUpdate} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Tên hiển thị</Label>
                            <Input id="edit-name" name="name" defaultValue={selectedChild?.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input id="edit-email" name="email" defaultValue={selectedChild?.email} required type="email" />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Hủy</Button>
                            <Button type="submit" disabled={isLoading}>{isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={isResetPassOpen} onOpenChange={setIsResetPassOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Đổi mật khẩu</DialogTitle>
                        <DialogDescription>
                            Đổi mật khẩu cho thành viên <strong>{selectedChild?.name}</strong>. Để trống để tạo mật khẩu ngẫu nhiên.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleResetPassword} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Mật khẩu mới (Tùy chọn)</Label>
                            <Input id="new-password" name="password" placeholder="Để trống để tự động tạo" />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsResetPassOpen(false)}>Hủy</Button>
                            <Button type="submit" disabled={isLoading}>{isLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Success/Password Dialog */}
            <Dialog open={!!newCredentials} onOpenChange={(open) => !open && setNewCredentials(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-green-600 flex items-center gap-2">
                            <div className="bg-green-100 p-1 rounded-full"><RefreshCw className="w-5 h-5" /></div>
                            Tài khoản đã được tạo!
                        </DialogTitle>
                        <DialogDescription>
                            Vui lòng sao chép thông tin đăng nhập bên dưới và gửi cho con của bạn. Mật khẩu này sẽ <strong>không hiển thị lại</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted p-4 rounded-md space-y-3 border">
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase">Email</Label>
                            <div className="font-mono font-medium text-sm">{newCredentials?.email}</div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase">Mật khẩu</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <code className="flex-1 bg-background p-2 rounded border font-mono text-lg font-bold text-center tracking-widest text-primary">
                                    {newCredentials?.password}
                                </code>
                                <Button type="button" size="icon" variant="outline" onClick={copyPassword}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setNewCredentials(null)} className="w-full">Đã lưu thông tin</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
