import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import DashboardShell from './DashboardShell';

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token || !verifyToken(token)) {
    redirect('/login');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
