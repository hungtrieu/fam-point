'use client';

import Link from 'next/link';
import { CheckCircle, Gift, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navbar / Header */}
      <header className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-bold text-2xl text-primary">
          <Heart className="h-8 w-8 fill-current" />
          <span>Family Rewards</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="ghost">Đăng nhập</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Đăng ký</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900/50 dark:to-background">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Gia Đình Gắn Kết, <br /> Yêu Thương Đong Đầy
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10">
          Biến những công việc nhà hàng ngày thành niềm vui. Giúp trẻ xây dựng thói quen tốt thông qua hệ thống tích điểm và đổi quà thú vị.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg" className="w-full sm:w-auto text-lg h-12 px-8 rounded-full shadow-lg hover:shadow-xl transition-all">
              Bắt đầu ngay <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-12 px-8 rounded-full">
              Tôi quản lý gia đình
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Cách Family Rewards hoạt động</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-blue-50/50 dark:bg-slate-800/50">
            <CardContent className="pt-6 text-center flex flex-col items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Giao Nhiệm Vụ</h3>
              <p className="text-muted-foreground">
                Phụ huynh tạo danh sách việc nhà hoặc bài tập. Dễ dàng theo dõi tiến độ của con.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-purple-50/50 dark:bg-slate-800/50">
            <CardContent className="pt-6 text-center flex flex-col items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
                <Gift className="h-8 w-8 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Tích Điểm & Đổi Quà</h3>
              <p className="text-muted-foreground">
                Mỗi nhiệm vụ hoàn thành sẽ mang lại điểm số. Trẻ dùng điểm để đổi lấy những phần thưởng yêu thích.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-rose-50/50 dark:bg-slate-800/50">
            <CardContent className="pt-6 text-center flex flex-col items-center">
              <div className="p-3 bg-rose-100 dark:bg-rose-900 rounded-full mb-4">
                <Heart className="h-8 w-8 text-rose-600 dark:text-rose-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Gắn Kết Gia Đình</h3>
              <p className="text-muted-foreground">
                Tạo động lực tích cực, giảm bớt căng thẳng trong việc giáo dục con cái và xây dựng không khí gia đình vui vẻ.
              </p>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Family Rewards. Xây dựng thói quen, vun đắp yêu thương.</p>
      </footer>
    </div>
  );
}
