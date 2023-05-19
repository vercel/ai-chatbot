import { cookies } from 'next/headers';
import { userSessionCookieName } from './constants';
import { getSessionFromCookie } from './server';

export async function getServerSession() {
  const cookieValue = cookies().get(userSessionCookieName)?.value;
  return getSessionFromCookie(cookieValue);
}
