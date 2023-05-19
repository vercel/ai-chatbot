import { EncryptJWT, base64url } from 'jose';

export async function encryptJWECookie<T extends string | object = any>(
  payload: T,
  expirationTime: string,
  secret: string | undefined = process.env.JWE_SECRET
): Promise<string> {
  if (!secret) {
    throw new Error('Missing JWE secret');
  }

  return new EncryptJWT(payload as any)
    .setExpirationTime(expirationTime)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(base64url.decode(secret));
}
