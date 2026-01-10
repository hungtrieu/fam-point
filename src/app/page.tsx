import Link from 'next/link';
import { Home, User, Baby } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Home className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Gia Đình Gắn Kết</CardTitle>
          <CardDescription>
            Cùng nhau xây dựng thói quen tốt và nhận phần thưởng xứng đáng!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Button asChild size="lg">
              <Link href="/dashboard?role=parent">
                <User className="mr-2 h-5 w-5" />
                Đăng nhập (Phụ huynh)
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/dashboard?role=child">
                <Baby className="mr-2 h-5 w-5" />
                Đăng nhập (Con)
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>Một sản phẩm giúp gia đình thêm gắn kết.</p>
      </footer>
    </main>
  );
}
