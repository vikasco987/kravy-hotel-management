import RoomDashboard from '@/app/components/RoomDashboard';
import { getAuthUser } from '@/lib/auth-utils';
import { hasPermission, getAuthorizedRedirectUrl } from '@/lib/permissions';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getAuthUser();

  if (user && user.isStaff && !hasPermission(user, 'page:dashboard')) {
    const targetUrl = getAuthorizedRedirectUrl(user);
    if (targetUrl !== '/dashboard') {
      redirect(targetUrl);
    }
  }

  return (
    <main>
      <RoomDashboard />
    </main>
  );
}
