'use client';
import Link from 'next/link';
import { Home, User, Baby } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirebase } from '@/firebase';
import { initiateAnonymousSignIn, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { firestore } = useFirebase();

  const handleLogin = async (role: 'parent' | 'child') => {
    try {
      initiateAnonymousSignIn(auth);
      // This is a simplified user creation flow.
      // In a real app, you would have a more robust user management system.
      auth.onAuthStateChanged(user => {
        if (user && firestore) {
           const userRef = doc(firestore, 'users', user.uid);
           const userData = {
             id: user.uid,
             name: role === 'parent' ? 'Mẹ' : 'Con',
             role: role,
             email: user.email || `${role}@example.com`,
           };
           setDocumentNonBlocking(userRef, userData, { merge: true });
           router.push(`/dashboard?role=${role}`);
        }
      });
      
    } catch (error) {
      console.error("Login failed", error);
    }
  };

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
            <Button size="lg" onClick={() => handleLogin('parent')}>
                <User className="mr-2 h-5 w-5" />
                Đăng nhập (Phụ huynh)
            </Button>
            <Button variant="secondary" size="lg" onClick={() => handleLogin('child')}>
                <Baby className="mr-2 h-5 w-5" />
                Đăng nhập (Con)
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
