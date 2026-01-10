import { users, tasks, rewards } from '@/lib/data';
import ParentDashboard from '@/components/dashboard/parent-dashboard';
import ChildDashboard from '@/components/dashboard/child-dashboard';

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { role?: 'parent' | 'child'; user?: string };
}) {
  const role = searchParams.role || 'child';

  if (role === 'parent') {
    const parentUser = users.find((u) => u.role === 'parent');
    if (!parentUser) return <div>Không tìm thấy người dùng.</div>;
    return (
      <ParentDashboard user={parentUser} tasks={tasks} allUsers={users} />
    );
  }

  // For simplicity, we'll use the first child user.
  // In a real app, this would be the currently logged-in user.
  const childUser = users.find((u) => u.role === 'child');
  if (!childUser) return <div>Không tìm thấy người dùng.</div>;
  const childTasks = tasks.filter((t) => t.assignedTo === childUser.id);

  return (
    <ChildDashboard user={childUser} tasks={childTasks} rewards={rewards} />
  );
}
