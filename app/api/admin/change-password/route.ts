import { NextRequest, NextResponse } from 'next/server';
import { changeAdminPassword, getAdminFromRequest } from '@/lib/auth';
import * as z from 'zod';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminFromRequest();
    if (!session.ok) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const body = await request.json();
    const parsed = schema.parse(body);
    const result = await changeAdminPassword(session.admin.id, parsed.currentPassword, parsed.newPassword);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
