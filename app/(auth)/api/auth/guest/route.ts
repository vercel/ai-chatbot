import { redirect } from 'next/navigation';
import { auth, signIn } from '@/app/(auth)/auth';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    await signIn('guest', { redirect: false });
    redirect('/');
  }

  return new Response('Unauthorized', { status: 401 });
}
