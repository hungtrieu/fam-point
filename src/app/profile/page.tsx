'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { User, Mail, Lock, ShieldCheck, Save, ArrowLeft, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, login } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [familySettings, setFamilySettings] = useState({ autoApproveTasks: true });
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);

    useEffect(() => {
        if (user?.role === 'parent') {
            setIsLoadingSettings(true);
            fetch(`/api/family/settings?userId=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.autoApproveTasks !== undefined) {
                        setFamilySettings({ autoApproveTasks: data.autoApproveTasks });
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setIsLoadingSettings(false));
        }
    }, [user]);

    const handleAutoApproveChange = async (checked: boolean) => {
        // Optimistic update
        setFamilySettings(prev => ({ ...prev, autoApproveTasks: checked }));

        try {
            const res = await fetch('/api/family/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    autoApproveTasks: checked
                }),
            });

            if (!res.ok) throw new Error('Failed to update settings');

            toast({
                title: 'Thành công',
                description: `Đã ${checked ? 'bật' : 'tắt'} tự động duyệt công việc`,
            });
        } catch (error) {
            // Revert on error
            setFamilySettings(prev => ({ ...prev, autoApproveTasks: !checked }));
            toast({
                title: 'Lỗi',
                description: 'Không thể cập nhật cài đặt',
                variant: 'destructive',
            });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            return toast({
                title: 'Lỗi',
                description: 'Mật khẩu mới không khớp nhau',
                variant: 'destructive',
            });
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    name: formData.name,
                    email: formData.email,
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Cập nhật thất bại');

            // Update local storage and context
            login(data);

            toast({
                title: 'Thành công',
                description: 'Thông tin cá nhân đã được cập nhật',
            });

            // Clear password fields
            setFormData({
                ...formData,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error: any) {
            toast({
                title: 'Lỗi',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="container mx-auto py-10 space-y-6 px-4 md:px-6 max-w-2xl">
            <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/dashboard">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Thông tin cá nhân</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Family Settings (Only for Parents) */}
                {user.role === 'parent' && (
                    <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm border-t-4 border-t-green-500">
                        <CardHeader className="bg-gradient-to-br from-green-50/50 to-teal-50/50 dark:from-green-900/20 dark:to-teal-900/20">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Settings className="h-5 w-5 text-green-500" /> Cài đặt gia đình
                            </CardTitle>
                            <CardDescription>Các thiết lập áp dụng cho toàn bộ gia đình.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-between space-y-0 rounded-lg border p-4 shadow-sm bg-background/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Tự động duyệt công việc</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Nếu bật, các công việc đã hoàn thành sẽ được tự động duyệt vào 12h trưa hàng ngày.
                                    </p>
                                </div>
                                <Switch
                                    checked={familySettings.autoApproveTasks}
                                    onCheckedChange={handleAutoApproveChange}
                                    disabled={isLoadingSettings}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Basic Info */}
                <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm border-t-4 border-t-blue-500">
                    <CardHeader className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-500" /> Thông tin cơ bản
                        </CardTitle>
                        <CardDescription>Cập nhật tên và địa chỉ email của bạn.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Họ và tên</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Địa chỉ Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-3 py-1">
                                Vai trò: {user.role === 'parent' ? 'Phụ huynh' : 'Thành viên nhí'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Password Change */}
                <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm border-t-4 border-t-indigo-500">
                    <CardHeader className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-indigo-500" /> Bảo mật
                        </CardTitle>
                        <CardDescription>Đổi mật khẩu để bảo vệ tài khoản của bạn.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    className="pl-10"
                                    placeholder="Nhập nếu muốn đổi mật khẩu"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 p-4 flex justify-end">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                        >
                            {isSubmitting ? 'Đang lưu...' : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
