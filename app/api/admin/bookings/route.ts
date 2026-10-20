import { NextRequest, NextResponse } from 'next/server';
import {
  createBooking,
  deleteBooking,
  getBookingById,
  listBookings,
  updateBooking,
} from '@/lib/db';

export async function GET() {
  try {
    const rows = await listBookings();
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Could not list bookings.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id ?? '').trim();
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
    const patch: Record<string, unknown> = {};
    if (body.status === 'pending' || body.status === 'confirmed' || body.status === 'cancelled') patch.status = body.status;
    if (typeof body.guest_name === 'string') patch.guest_name = body.guest_name;
    if (typeof body.guest_email === 'string') patch.guest_email = body.guest_email;
    if (body.total_price === null || Number.isFinite(Number(body.total_price))) patch.total_price = body.total_price === null ? null : Number(body.total_price);
    const updated = await updateBooking(id, patch);
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
    const removed = await deleteBooking(id);
    if (!removed) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete.' }, { status: 500 });
  }
}
