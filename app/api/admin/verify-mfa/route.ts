import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, setSessionCookie, verifyTotpCode } from '@/lib/auth';
import { getAdminByEmail } from '@/lib/db';
import * as z from 'zod';

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const admin = await getAdminByEmail(parsed.email);
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }
    const valid = verifyTotpCode(admin.totp_secret, parsed.code);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 401 });
    }
    const cookie = await createSessionCookie(admin.id);
    setSessionCookie(cookie);
    return NextResponse.json({ ok: true, role: admin.role });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
