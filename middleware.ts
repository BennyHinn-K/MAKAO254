import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'makao254_admin_session';
const AUTH_SECRET = process.env.AUTH_SECRET ?? 'dev-only-insecure-secret-override-in-env';

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

/**
 * Edge-safe signature check mirroring `signToken` in lib/auth.ts:
 * cookie value is `${rawToken}.${sha256(`${rawToken}.${AUTH_SECRET}`).slice(0, 16)}`.
 * The Edge runtime cannot import node:crypto or the JSON DB, so full session
 * validation happens inside the Node.js API routes.
 */
async function hasValidSignature(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [token, sig] = value.split('.');
  if (!token || !sig) return false;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${token}.${AUTH_SECRET}`));
  const expected = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
  return expected === sig;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith('/api/admin');
  const isPageRoute = pathname.startsWith('/admin');

  const response = NextResponse.next();

  if (isPageRoute) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // The /admin page renders its own login form, so it is not blocked here.
  if (!isApiRoute) return response;

  const publicApiRoutes = ['/api/admin/login', '/api/admin/verify-mfa'];
  if (publicApiRoutes.some((r) => pathname === r)) return response;

  const authenticated = await hasValidSignature(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return response;
}
