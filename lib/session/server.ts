import { type NextApiRequest } from 'next';
import { type NextRequest } from 'next/server';
import { userSessionCookieName } from './constants';
import { decryptJWECookie } from '../cookies/decrypt-jwe';
import { type Session } from './types';

export async function getSessionFromCookie(cookieValue?: string) {
  if (!cookieValue) return;

  const session = await decryptJWECookie<Session>(cookieValue);

  return session;
}

export async function getSessionFromReq(
  req: NextApiRequest | NextRequest
): Promise<Session | undefined> {
  const cookieValue =
    'get' in req.cookies && typeof req.cookies.get === 'function'
      ? req.cookies.get(userSessionCookieName)?.value
      : (req.cookies as Record<string, string>)[userSessionCookieName];
  return getSessionFromCookie(cookieValue);
}
