import { jwtDecrypt, base64url } from 'jose';

export async function decryptJWECookie<T extends string | object = any>(
  cookie: string,
  secret: string | undefined = process.env.JWE_SECRET
): Promise<T | undefined> {
  if (!secret) {
    throw new Error('Missing JWE secret');
  }

  if (typeof cookie !== 'string') return;

  try {
    const { payload } = await jwtDecrypt(cookie, base64url.decode(secret));
    const decoded = payload as T;

    // @ts-expect-error jwt field
    delete decoded.iat;
    // @ts-expect-error jwt field
    delete decoded.exp;
    return decoded;
  } catch {
    // Do nothing
  }
}
