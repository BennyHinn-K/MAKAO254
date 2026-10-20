import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, revokeSessionByToken, setSessionCookie } from '@/lib/auth';
import { cookies } from 'next/headers';

const AUTH_COOKIE = 'makao254_admin_session';

export async function POST(_request: NextRequest) {
  try {
    const store = cookies();
    const current = store.get(AUTH_COOKIE)?.value;
    if (current) {
      await revokeSessionByToken(current);
    }
    setSessionCookie(null);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not log out.' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  const session = await getAdminFromRequest();
  if (!session.ok) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    email: session.admin.email,
    role: session.role,
  });
}
