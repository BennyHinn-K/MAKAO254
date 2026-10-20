import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { handleInboundWhatsApp, parseInbound } from '@/lib/whatsapp';

const SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || 'dev-webhook-secret';
const SANDBOX = process.env.WHATSAPP_SANDBOX !== 'false';

function buildTwiML(message: string) {
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message><Body>${escaped}</Body></Message></Response>`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('hub.challenge');
  const token = searchParams.get('hub.verify_token');
  if (token === SECRET && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Invalid verification.' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256') || request.headers.get('x-twilio-signature') || '';
    const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const contentType = request.headers.get('content-type') || '';
    let raw = '';
    let payload: any;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      raw = await request.text();
      const params = new URLSearchParams(raw);
      payload = Object.fromEntries(params.entries());
    } else {
      raw = await request.text();
      try { payload = JSON.parse(raw); } catch { payload = {}; }
    }

    const valid =
      (SANDBOX && bearer === SECRET) ||
      (signature && signature === createHmac('sha256', SECRET).update(raw).digest('hex')) ||
      !signature;

    if (!valid && !SANDBOX) return NextResponse.json({ error: 'Invalid signature.' }, { status: 403 });

    const reply = await handleInboundWhatsApp(payload);
    const { message, from } = parseInbound(payload);

    if (typeof payload === 'object' && payload && (payload.AccountSid || payload.From)) {
      return new NextResponse(buildTwiML(reply), {
        status: 200,
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      });
    }

    return NextResponse.json({ ok: true, reply, from, echoMessage: message });
  } catch {
    return NextResponse.json({ error: 'Could not process message.' }, { status: 500 });
  }
}
