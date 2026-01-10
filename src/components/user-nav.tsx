'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CreditCard, LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDoc, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type UserNavProps = {
  role: 'parent' | 'child';
};

export function UserNav({ role }: UserNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { firestore, auth } = useFirebase();
  const { user: authUser, isUserLoading } = useUser();
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, isLoading: userLoading } = useDoc<User>(userDocRef);

  if (isUserLoading || userLoading || !user) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <Avatar className="h-9 w-9" />
      </Button>
    )
  };


  const getAvatarUrl = (avatarId: string) => {
    return PlaceHolderImages.find(p => p.id === avatarId)?.imageUrl || `https://picsum.photos/seed/${avatarId}/100/100`;
  }
  
  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || 'U';
  }

  const handleLogout = () => {
    auth.signOut();
    router.push('/');
  }
  
  const createUrl = (baseHref: string) => {
    const params = new URLSearchParams(searchParams);
    const [path, query] = baseHref.split('?');
    if (query) {
      new URLSearchParams(query).forEach((value, key) => {
        params.set(key, value);
      });
    }
    return `${path}?${params.toString()}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={getAvatarUrl(user.avatar || '1')}
              alt={user.name}
              data-ai-hint="user avatar"
            />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.role === 'parent' ? 'Phụ huynh' : 'Thành viên nhí'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Thông tin cá nhân</span>
          </DropdownMenuItem>
          {user.role === 'child' && (
            <DropdownMenuItem asChild>
               <Link href={createUrl('/history')}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Lịch sử điểm</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
