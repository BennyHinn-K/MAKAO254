import { NextRequest, NextResponse } from 'next/server';
import {
  createContactMessage,
  deleteContactMessage,
  listContactMessages,
  updateContactStatus,
} from '@/lib/db';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  try {
    const rows = await listContactMessages();
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const phone = typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null;
    const subject =
      typeof body.subject === 'string' && body.subject.trim() ? body.subject.trim() : null;
    const message = String(body.message ?? '').trim();
    const source = typeof body.source === 'string' && body.source.trim() ? body.source : 'website';

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Please provide your name, email, and message.' },
        { status: 400 },
      );
    }

    if (!emailRe.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email.' }, { status: 400 });
    }

    const created = await createContactMessage({
      name,
      email,
      phone,
      subject,
      message,
      source,
    });
    return NextResponse.json({ ok: true, message: created });
  } catch {
    return NextResponse.json({ error: 'Could not send message.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
    const status =
      body.status === 'read' || body.status === 'replied' ? body.status : 'read';
    const updated = await updateContactStatus(id, status);
    if (!updated)
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Could not update message.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
    const removed = await deleteContactMessage(id);
    if (!removed) return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete message.' }, { status: 500 });
  }
}
