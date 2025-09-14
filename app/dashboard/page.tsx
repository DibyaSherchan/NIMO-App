// app/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
      <p className="mt-4">Hello, {session.user?.name}!</p>
      <p>Your email: {session.user?.email}</p>
      <p>Your role: {session.user?.role}</p>
      <p>Your ID: {session.user?.id}</p>
    </div>
  );
}