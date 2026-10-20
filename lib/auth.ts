import * as bcrypt from 'bcryptjs';
import { generateSecret, verifySync } from 'otplib';
import { randomBytes, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import {
  createAdminSession,
  getAdminByEmail,
  getAdminById,
  getAdminSessionByTokenHash,
  pruneExpiredAdminSessions,
  revokeAdminSession,
  updateAdminPassword,
  updateAdminTotp,
  type Admin,
  type AdminRole,
} from './db';

const AUTH_COOKIE = 'makao254_admin_session';
const AUTH_SECRET = process.env.AUTH_SECRET ?? 'dev-only-insecure-secret-override-in-env';
const SESSION_TTL_SECONDS = 86400;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTotpSecret(): string {
  return generateSecret();
}

export function buildTotpUri(secret: string, email: string): string {
  const encodedIssuer = encodeURIComponent('Makao254 Admin');
  const encodedLabel = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedLabel}?secret=${encodeURIComponent(secret)}&issuer=${encodedIssuer}`;
}

export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    return verifySync({ secret, token: code, epochTolerance: 30 }).valid;
  } catch {
    return false;
  }
}

function signToken(token: string): string {
  const hmac = createHash('sha256').update(`${token}.${AUTH_SECRET}`).digest('hex');
  return `${token}.${hmac.slice(0, 16)}`;
}

function verifySignedCookie(value: string): string | null {
  const [token, sig] = value.split('.');
  if (!token || !sig) return null;
  const expected = createHash('sha256').update(`${token}.${AUTH_SECRET}`).digest('hex').slice(0, 16);
  if (expected !== sig) return null;
  return token;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSessionCookie(adminId: string): Promise<string> {
  await pruneExpiredAdminSessions();
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await createAdminSession({ admin_id: adminId, token_hash: tokenHash, expires_at: expiresAt });
  return signToken(rawToken);
}

export async function revokeSessionByToken(signedValue: string): Promise<void> {
  const raw = verifySignedCookie(signedValue);
  if (!raw) return;
  const tokenHash = hashToken(raw);
  const session = await getAdminSessionByTokenHash(tokenHash);
  if (session) await revokeAdminSession(session.id);
}

export type AdminSessionResult =
  | { ok: true; admin: Admin; sessionId: string; role: AdminRole }
  | { ok: false; reason: 'missing' | 'invalid' | 'expired' };

export async function getAdminFromRequest(): Promise<AdminSessionResult> {
  const store = cookies();
  const signed = store.get(AUTH_COOKIE)?.value;
  if (!signed) return { ok: false, reason: 'missing' };
  const raw = verifySignedCookie(signed);
  if (!raw) return { ok: false, reason: 'invalid' };
  const tokenHash = hashToken(raw);
  const session = await getAdminSessionByTokenHash(tokenHash);
  if (!session) return { ok: false, reason: 'invalid' };
  if (new Date(session.expires_at) <= new Date()) {
    await revokeAdminSession(session.id);
    return { ok: false, reason: 'expired' };
  }
  const admin = await getAdminById(session.admin_id);
  if (!admin) return { ok: false, reason: 'expired' };
  return { ok: true, admin, sessionId: session.id, role: admin.role };
}

export function setSessionCookie(value: string | null) {
  const store = cookies();
  if (!value) {
    store.delete(AUTH_COOKIE);
    return;
  }
  store.set(AUTH_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: value === null ? 0 : SESSION_TTL_SECONDS,
  });
}

export async function loginAdmin(email: string, password: string): Promise<{ ok: true; admin: Admin } | { ok: false; error: string }> {
  const admin = await getAdminByEmail(email);
  if (!admin) return { ok: false, error: 'Invalid credentials.' };
  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) return { ok: false, error: 'Invalid credentials.' };
  return { ok: true, admin };
}

export async function changeAdminPassword(adminId: string, currentPassword: string, newPassword: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdminById(adminId);
  if (!admin) return { ok: false, error: 'Admin not found.' };
  const valid = await verifyPassword(currentPassword, admin.password_hash);
  if (!valid) return { ok: false, error: 'Current password is incorrect.' };
  if (newPassword.length < 8) return { ok: false, error: 'New password must be at least 8 characters.' };
  const nextHash = await hashPassword(newPassword);
  await updateAdminPassword(adminId, nextHash);
  return { ok: true };
}

export async function regenerateAdminTotp(adminId: string, currentPassword: string): Promise<{ ok: true; secret: string; uri: string } | { ok: false; error: string }> {
  const admin = await getAdminById(adminId);
  if (!admin) return { ok: false, error: 'Admin not found.' };
  const valid = await verifyPassword(currentPassword, admin.password_hash);
  if (!valid) return { ok: false, error: 'Current password is incorrect.' };
  const secret = generateTotpSecret();
  await updateAdminTotp(adminId, secret);
  return { ok: true, secret, uri: buildTotpUri(secret, admin.email) };
}

export function requireRole(role: AdminRole, allowed: AdminRole[] = ['admin']): boolean {
  return allowed.includes(role);
}
