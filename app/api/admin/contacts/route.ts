import { NextRequest, NextResponse } from 'next/server';
import {
  deleteContactMessage,
  listContactMessages,
  updateContactStatus,
} from '@/lib/db';

export async function GET() {
  try {
    const rows = await listContactMessages();
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Could not list.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id ?? '').trim();
    const status = String(body.status ?? '') as any;
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
    if (!['new', 'read', 'replied'].includes(status)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    const updated = await updateContactStatus(id, status);
    if (!updated) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Could not update.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
    const removed = await deleteContactMessage(id);
    if (!removed) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete.' }, { status: 500 });
  }
}
