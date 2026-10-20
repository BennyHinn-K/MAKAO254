import { NextRequest, NextResponse } from 'next/server';
import {
  approveReview,
  deleteReview,
  listAllReviews,
} from '@/lib/db';

export async function GET() {
  try {
    const rows = await listAllReviews();
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Could not list.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id ?? '').trim();
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
    if (body.action === 'approve') {
      const updated = await approveReview(id);
      if (!updated) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Could not update.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
    const removed = await deleteReview(id);
    if (!removed) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete.' }, { status: 500 });
  }
}
