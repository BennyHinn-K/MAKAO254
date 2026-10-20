import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirect_success = searchParams.get('redirect_success') || '/';
  const redirect_cancel = searchParams.get('redirect_cancel') || '/';
  const callback = searchParams.get('callback');
  const bookingId = searchParams.get('booking_id');

  const autoHtml = callback ? `
    <div class="step"><p>Payment processing…</p>
    <div class="spinner" /></div>
    <script>
      fetch(${JSON.stringify(callback)}).then(r => r.json()).then(data => {
        const ok = data.ok && data.booking?.status === 'confirmed';
        setTimeout(() => window.location.href = ok ? ${JSON.stringify(redirect_success)} : ${JSON.stringify(redirect_cancel)}, 600);
      }).catch(() => setTimeout(() => window.location.href = ${JSON.stringify(redirect_success)}, 600));
    </script>` : '';

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Makao254 · Payment</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;background:#faf7f2;color:hsl(28 15% 12%);padding:1.5rem}
  .card{max-width:440px;width:100%;background:#fff;border-radius:20px;padding:2.25rem;box-shadow:0 20px 50px rgba(0,0,0,.08)}
  .brand{display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem}
  .mark{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:hsl(28 60% 52%);color:#fff;font-family:Fraunces,serif;font-weight:600}
  h1{font-family:Fraunces,serif;font-weight:500;font-size:1.6rem;margin:0 0 .5rem}
  p{color:hsl(28 10% 45%);line-height:1.6;margin:0}
  .amount{font-size:1.75rem;font-family:Fraunces,serif;margin:.75rem 0 1.25rem}
  .actions{display:flex;flex-direction:column;gap:.6rem;margin-top:1.5rem}
  button{padding:.9rem 1.4rem;border-radius:999px;border:none;font-size:.9rem;font-weight:500;cursor:pointer;min-height:44px;font-family:inherit}
  .primary{background:hsl(28 15% 12%);color:#faf7f2}
  .ghost{background:transparent;border:1px solid hsl(28 15% 82%);color:hsl(28 10% 35%)}
  .step{text-align:center;padding:1rem 0}
  .spinner{width:36px;height:36px;border:3px solid hsl(28 20% 92%);border-top-color:hsl(28 60% 52%);border-radius:50%;animation:spin 1s linear infinite;margin:1rem auto 0}
  @keyframes spin{to{transform:rotate(360deg)}}
  .meta{margin-top:1.25rem;font-size:.8rem;color:hsl(28 10% 50%)}
  .badge{display:inline-block;padding:.2rem .65rem;border-radius:999px;background:hsl(45 80% 92%);color:hsl(35 70% 35%);font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem}
</style>
</head>
<body>
  <div class="card">
    <div class="brand"><span class="mark">M</span><strong style="font-family:Fraunces,serif;font-weight:500;font-size:1.1rem">Makao<span style="color:hsl(28 60% 52%);font-weight:400">254</span></strong></div>
    <span class="badge">Sandbox Checkout</span>
    <h1>Confirm your booking payment</h1>
    <p>Booking reference <b>${bookingId ? bookingId.slice(0, 8).toUpperCase() : '—'}</b></p>
    <div class="amount">KES ${Number(searchParams.get('amount') || 0).toLocaleString()}</div>
    ${autoHtml || `
      <div class="actions">
        <form action=${JSON.stringify(callback || redirect_success)} method="get">
          <input type="hidden" name="status" value="success" />
          <button class="primary" type="submit">Pay and confirm</button>
        </form>
        <a class="ghost" href=${JSON.stringify(redirect_cancel)} style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">Cancel and return</a>
      </div>
      <p class="meta">Demo mode: no real charge is made. Click Pay and confirm to simulate a successful payment and confirm your booking.</p>
    `}
  </div>
</body>
</html>`;
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
