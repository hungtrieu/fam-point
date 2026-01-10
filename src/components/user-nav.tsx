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
import { users } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CreditCard, LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type UserNavProps = {
  role: 'parent' | 'child';
};

export function UserNav({ role }: UserNavProps) {
  const searchParams = useSearchParams();
  const user =
    role === 'parent'
      ? users.find((u) => u.role === 'parent')
      : users.find((u) => u.role === 'child');

  if (!user) return null;

  const getAvatarUrl = (avatarId: string) => {
    return PlaceHolderImages.find(p => p.id === avatarId)?.imageUrl || `https://picsum.photos/seed/${avatarId}/100/100`;
  }
  
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={getAvatarUrl(user.avatar)}
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
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Lịch sử điểm</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Đăng xuất</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
