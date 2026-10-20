import { randomBytes, createHmac } from 'node:crypto';
import { getBookingById, updateBooking, type BookingStatus } from './db';

export type PaymentProvider = 'sandbox' | 'mpesa' | 'card';

const PROVIDER: PaymentProvider = (process.env.PAYMENT_PROVIDER as PaymentProvider) || 'sandbox';
const API_KEY = process.env.PAYMENT_API_KEY || '';
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || process.env.AUTH_SECRET || 'dev-secret';

export interface CheckoutRequest {
  booking_id: string;
  amount: number;
  currency: string;
  customer_email?: string;
  customer_phone?: string;
  customer_name?: string;
  description: string;
  success_url: string;
  cancel_url: string;
}

export interface CheckoutResult {
  provider: PaymentProvider;
  checkout_id: string;
  payment_url: string;
  expires_at?: string;
}

function uid() {
  return randomBytes(16).toString('hex');
}

async function sandboxCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
  const id = 'sbx_' + uid();
  const expires_at = new Date(Date.now() + 1000 * 60 * 30).toISOString();
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const token = createHmac('sha256', WEBHOOK_SECRET).update(id + ':' + req.booking_id + ':' + req.amount).digest('hex').slice(0, 16);
  const callback = `${base}/api/payments/webhook?provider=sandbox&checkout_id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}&status=success&booking_id=${encodeURIComponent(req.booking_id)}&amount=${req.amount}`;
  const payment_url = `${base}/api/payments/confirm?checkout_id=${encodeURIComponent(id)}&booking_id=${encodeURIComponent(req.booking_id)}&amount=${req.amount}&redirect_success=${encodeURIComponent(req.success_url)}&redirect_cancel=${encodeURIComponent(req.cancel_url)}&callback=${encodeURIComponent(callback)}`;
  return { provider: 'sandbox', checkout_id: id, payment_url, expires_at };
}

async function mpesaCheckout(_req: CheckoutRequest): Promise<CheckoutResult> {
  // Stub: implement M-Pesa Daraja STK push here with env credentials.
  return sandboxCheckout(_req);
}

async function cardCheckout(_req: CheckoutRequest): Promise<CheckoutResult> {
  // Stub: implement card provider (e.g. Paystack/Flutterwave) here.
  return sandboxCheckout(_req);
}

export async function createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
  if (req.amount <= 0) throw new Error('Invalid amount.');
  if (!req.booking_id) throw new Error('Missing booking.');
  if (PROVIDER === 'mpesa') return mpesaCheckout(req);
  if (PROVIDER === 'card') return cardCheckout(req);
  return sandboxCheckout(req);
}

export function verifyCallbackSignature(params: { checkout_id: string; booking_id: string; amount: string; token: string }) {
  const expected = createHmac('sha256', WEBHOOK_SECRET)
    .update(`${params.checkout_id}:${params.booking_id}:${params.amount}`)
    .digest('hex')
    .slice(0, 16);
  return expected === params.token;
}

export async function confirmPayment(params: {
  provider?: PaymentProvider;
  checkout_id: string;
  booking_id: string;
  amount: number | string;
  status: 'success' | 'failed' | 'cancelled';
}): Promise<{ ok: boolean; booking?: { id: string; status: BookingStatus } }> {
  const amount = typeof params.amount === 'string' ? Number(params.amount) : params.amount;
  const booking = await getBookingById(params.booking_id);
  if (!booking) return { ok: false };
  const expected = booking.total_price || amount;
  if (params.status === 'success' && Number(amount) >= (expected || Number(amount))) {
    const updated = await updateBooking(booking.id, { status: 'confirmed' });
    return { ok: true, booking: updated ? { id: updated.id, status: updated.status } : undefined };
  }
  if (params.status === 'cancelled' || params.status === 'failed') {
    // keep pending; an operator may retry
    return { ok: true, booking: { id: booking.id, status: booking.status } };
  }
  return { ok: false };
}
