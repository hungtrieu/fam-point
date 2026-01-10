'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
    familyName: z.string().min(2, {
        message: 'Tên gia đình phải có ít nhất 2 ký tự.',
    }),
    fullName: z.string().min(2, {
        message: 'Họ tên phụ huynh phải có ít nhất 2 ký tự.',
    }),
    email: z.string().email({
        message: 'Vui lòng nhập địa chỉ email hợp lệ.',
    }),
    password: z.string().min(6, {
        message: 'Mật khẩu phải có ít nhất 6 ký tự.',
    }),
});

import { useAuth } from '@/context/auth-context';

export default function SignupPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            familyName: '',
            fullName: '',
            email: '',
            password: '',
        },
    });

    const { login } = useAuth();

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    familyName: values.familyName,
                    name: values.fullName,
                    email: values.email,
                    password: values.password,
                    role: 'parent',
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Đăng ký thất bại');
            }

            // Login using context
            login(data.user);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Tạo tài khoản</CardTitle>
                    <CardDescription className="text-center">
                        Nhập thông tin bên dưới để tạo tài khoản gia đình của bạn
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="familyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên gia đình</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Gia đình Hạnh Phúc" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Họ tên Phụ huynh</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nguyễn Văn A" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="email@vidu.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mật khẩu</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="******" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-500">
                        Đã có tài khoản?{' '}
                        <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-500">
                            Đăng nhập
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
