import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin } from '@/lib/auth';
import * as z from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const result = await loginAdmin(parsed.email, parsed.password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    return NextResponse.json({ ok: true, requiresMfa: true, email: result.admin.email });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
