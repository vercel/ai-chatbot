import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

export const GET = async () => {
  const signInUrl = await getSignInUrl();
  return redirect(signInUrl);
};
