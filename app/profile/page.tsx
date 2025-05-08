import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await auth();
  
  // If not logged in, redirect to login
  if (!session?.user || session?.user.type === 'guest') {
    redirect('/login');
  }
  
  // If logged in, redirect to home (the modal will be opened via client-side code)
  redirect('/');
} 