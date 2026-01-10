'use client';

import { useAuth } from '@/context/auth-context';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Đang tải thông tin...</div>;
  }

  const roleParam = user?.role || 'parent'; // Use parent as fallback or redirect to login?

  if (!user) {
    // Ideally redirect here or show message
    return <div className="p-8 text-center text-red-500">Vui lòng đăng nhập để tiếp tục.</div>;
  }

  return (
    <div className="p-8 text-center space-y-4">
      <h2 className="text-2xl font-bold text-green-600">Đăng nhập MongoDB thành công!</h2>
      <p className="text-lg">Chào mừng bạn! Tính năng Đăng ký và Đăng nhập đã được chuyển đổi sang MongoDB.</p>
      <p className="text-gray-500">Dashboard và các tính năng khác (Công việc, Phần thưởng) đang được cập nhật để sử dụng MongoDB.</p>
      <p>Vai trò hiện tại: <strong>{roleParam}</strong> (tài khoản: {user.email})</p>
    </div>
  )
}
