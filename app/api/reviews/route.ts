import { NextRequest, NextResponse } from 'next/server';
import {
  approveReview,
  createReview,
  deleteReview,
  listAllReviews,
  listApprovedReviews,
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const propertyId = searchParams.get('propertyId') || undefined;
    const rows = all ? await listAllReviews() : await listApprovedReviews(propertyId);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const propertyId = String(body.property_id ?? body.propertyId ?? '').trim();
    const guestName = String(body.guest_name ?? body.guestName ?? '').trim();
    const rating = Number.isFinite(Number(body.rating))
      ? Math.max(1, Math.min(5, Math.round(Number(body.rating))))
      : 5;
    const comment =
      typeof body.comment === 'string' && body.comment.trim() ? body.comment.trim() : null;

    if (!propertyId)
      return NextResponse.json({ error: 'Property id is required.' }, { status: 400 });
    if (!guestName)
      return NextResponse.json({ error: 'Your name is required.' }, { status: 400 });

    const created = await createReview({
      property_id: propertyId,
      guest_name: guestName,
      rating,
      comment,
      approved: body.approved === true,
    });
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: 'Could not create review.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing review id.' }, { status: 400 });
    const updated = await approveReview(id);
    if (!updated) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Could not approve review.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing review id.' }, { status: 400 });
    const removed = await deleteReview(id);
    if (!removed) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete review.' }, { status: 500 });
  }
}
