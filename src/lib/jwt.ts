// src/lib/jwt.ts
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode('Hello-myname-is-boomboom'); // เปลี่ยนให้ปลอดภัย

export async function createJWT(payload: object): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<any> {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
