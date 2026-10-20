import { NextRequest, NextResponse } from 'next/server';
import { createCheckout, verifyCallbackSignature, confirmPayment } from '@/lib/payments';
import { getBookingById } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const booking_id = searchParams.get('booking_id') || '';
    const booking = await getBookingById(booking_id);
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const checkout = await createCheckout({
      booking_id: booking.id,
      amount: booking.total_price || 1,
      currency: 'KES',
      customer_email: booking.guest_email || undefined,
      customer_phone: booking.guest_phone || undefined,
      customer_name: booking.guest_name,
      description: `Makao254 booking ${booking.id}`,
      success_url: `${base}/?booked=1`,
      cancel_url: `${base}/?booked=cancelled`,
    });
    return NextResponse.redirect(checkout.payment_url);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Could not start checkout.' }, { status: 500 });
  }
}
