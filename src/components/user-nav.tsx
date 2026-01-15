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
import { LogOut, Settings, CreditCard, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export function UserNav() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const role = user?.role || 'child';

  const handleLogout = () => {
    logout();
  }

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 px-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline-block">{user.name}</span>
          <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {role === 'parent' ? 'Phụ huynh' : 'Thành viên nhí'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center w-full">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Thông tin cá nhân</span>
            </Link>
          </DropdownMenuItem>
          {role === 'child' && (
            <DropdownMenuItem asChild>
              <Link href="/history">
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
