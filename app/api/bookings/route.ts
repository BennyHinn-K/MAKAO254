import { NextRequest, NextResponse } from 'next/server';
import {
  createBooking,
  deleteBooking,
  getBookingById,
  listBookings,
  updateBooking,
} from '@/lib/db';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  try {
    const rows = await listBookings();
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const guestName = typeof body.guestName === 'string' ? body.guestName.trim() : '';
    const guestEmail = typeof body.guestEmail === 'string' ? body.guestEmail.trim() : '';
    const guestPhone = typeof body.guestPhone === 'string' ? body.guestPhone.trim() : null;
    const checkIn = typeof body.checkIn === 'string' && body.checkIn ? body.checkIn : null;
    const checkOut = typeof body.checkOut === 'string' && body.checkOut ? body.checkOut : null;
    const guests = Number.isFinite(Number(body.guests))
      ? Math.max(1, Math.min(20, Number(body.guests)))
      : 1;
    const propertyId = typeof body.propertyId === 'string' && body.propertyId ? body.propertyId : null;

    if (!guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'Please provide your name and email.' },
        { status: 400 },
      );
    }

    if (!emailRe.test(guestEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 },
      );
    }

    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
      return NextResponse.json(
        { error: 'Check out must be after check in.' },
        { status: 400 },
      );
    }

    const created = await createBooking({
      property_id: propertyId,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone || null,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      total_price: Number.isFinite(Number(body.total_price)) ? Number(body.total_price) : null,
      status:
        body.status === 'confirmed' || body.status === 'cancelled'
          ? body.status
          : 'pending',
    });

    return NextResponse.json({ ok: true, booking: created });
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id ?? '').trim();
    if (!id) return NextResponse.json({ error: 'Missing booking id.' }, { status: 400 });
    const existing = await getBookingById(id);
    if (!existing) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });

    const patch: Record<string, unknown> = {};
    if (typeof body.property_id === 'string' || body.property_id === null)
      patch.property_id = body.property_id;
    if (typeof body.guest_name === 'string' && body.guest_name.trim())
      patch.guest_name = body.guest_name.trim();
    if (typeof body.guest_email === 'string' && emailRe.test(body.guest_email.trim()))
      patch.guest_email = body.guest_email.trim();
    if (typeof body.guest_phone === 'string') patch.guest_phone = body.guest_phone || null;
    else if (body.guest_phone === null) patch.guest_phone = null;
    if (typeof body.check_in === 'string') patch.check_in = body.check_in || null;
    else if (body.check_in === null) patch.check_in = null;
    if (typeof body.check_out === 'string') patch.check_out = body.check_out || null;
    else if (body.check_out === null) patch.check_out = null;
    if (Number.isFinite(Number(body.guests)))
      patch.guests = Math.max(1, Math.min(20, Number(body.guests)));
    if (body.total_price === null) patch.total_price = null;
    else if (Number.isFinite(Number(body.total_price)))
      patch.total_price = Number(body.total_price);
    if (
      body.status === 'pending' ||
      body.status === 'confirmed' ||
      body.status === 'cancelled'
    )
      patch.status = body.status;

    const updated = await updateBooking(id, patch);
    if (!updated) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Could not update booking.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing booking id.' }, { status: 400 });
    const removed = await deleteBooking(id);
    if (!removed) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete booking.' }, { status: 500 });
  }
}
