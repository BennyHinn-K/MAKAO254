import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment, verifyCallbackSignature } from '@/lib/payments';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = {
    checkout_id: searchParams.get('checkout_id') || '',
    booking_id: searchParams.get('booking_id') || '',
    amount: searchParams.get('amount') || '0',
    token: searchParams.get('token') || '',
  };
  const status = (searchParams.get('status') as any) || 'success';
  const valid = verifyCallbackSignature(params);
  if (!valid) return NextResponse.json({ error: 'Invalid signature.' }, { status: 403 });
  const result = await confirmPayment({ ...params, status, amount: Number(params.amount) });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await confirmPayment({
      provider: body.provider,
      checkout_id: body.checkout_id,
      booking_id: body.booking_id,
      amount: body.amount,
      status: body.status,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
