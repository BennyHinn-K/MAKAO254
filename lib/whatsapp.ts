import { createBooking, getPropertyById, listPublishedProperties, type Property } from './db';

export function buildWhatsAppLink(target: { title: string; slug?: string; id?: string; price_per_night?: number } | Property, customMessage?: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER || process.env.WHATSAPP_BUSINESS_NUMBER || '254700254254';
  const cleaned = number.replace(/[^0-9]/g, '');
  const name = target.title || 'a Makao stay';
  let message = customMessage;
  if (!message) {
    const slugPart = target.slug ? ` (${target.slug})` : target.id ? ` (#${target.id})` : '';
    const pricePart = typeof target.price_per_night === 'number' ? ` KES ${target.price_per_night.toLocaleString()}/night` : '';
    message = `Hi Makao254! I'd like to know more about ${name}${slugPart}${pricePart}. Please share availability.`;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

const FAQ_ANSWERS: { keywords: string[]; answer: string }[] = [
  { keywords: ['hi', 'hello', 'hey', 'mambo', 'habari'], answer: 'Habari! Welcome to Makao254 🏡. I can help you:\n1. Browse stays — say "city", "beach", or "countryside"\n2. View details — "tell me about Diani Drift"\n3. Book — say "book {stay name}"\n4. FAQs — ask about prices, pets, WiFi, check-in times, or cleaning\n\nHow can I help?' },
  { keywords: ['price', 'prices', 'cost', 'how much'], answer: 'Our stays start from ~KES 16,800/night (Kilimani Canvas) up to KES 85,000/night (Mara Fig Lodge). All prices include hosting; cleaning and extras are detailed per stay. Send the name and I will quote exactly!' },
  { keywords: ['check-in', 'check in', 'checkout', 'check-out', 'check out'], answer: 'Standard check-in is 2pm, checkout 11am. Early check-in / late checkout may be possible for an extra fee depending on availability — just ask when booking.' },
  { keywords: ['cleaning', 'cleaner', 'housekeeping'], answer: 'A light clean is included before arrival. For longer stays (7+ nights), we include a mid-stay clean. Deep cleans and daily housekeeping can be arranged at cost.' },
  { keywords: ['pet', 'dogs', 'cat'], answer: 'Pets are welcome at our countryside and beach homes — please mention them when booking so we can confirm the best spot. City apartments are pet-friendly on a case-by-case basis with a small pet fee.' },
  { keywords: ['wifi', 'internet', 'wi-fi'], answer: 'Every Makao includes fast, uncapped Wi-Fi. City homes have fiber; coastal and countryside homes use Starlink or dedicated 5G.' },
  { keywords: ['payment', 'pay', 'mpesa', 'card'], answer: 'We accept M-Pesa, Visa/Mastercard, and bank transfer. For WhatsApp bookings I can send you a secure checkout link — 30% deposit to hold, balance 7 days before check-in.' },
  { keywords: ['cancel', 'refund'], answer: 'Free cancellation up to 7 days before check-in for full refund of deposit. Inside 7 days the deposit is non-refundable but may be transferred to a future date.' },
];

export function getFaqAnswer(message: string): string | null {
  const lower = message.toLowerCase();
  for (const faq of FAQ_ANSWERS) {
    if (faq.keywords.some((k) => lower.includes(k))) return faq.answer;
  }
  return null;
}

function normalize(phone: string) {
  return phone.replace(/[^0-9]/g, '');
}

type BookingDraft = {
  propertyId?: string;
  step: 'start' | 'property' | 'dates' | 'guests' | 'name' | 'email' | 'phone' | 'confirm' | 'pay';
  check_in?: string;
  check_out?: string;
  guests?: number;
  name?: string;
  email?: string;
  phone?: string;
};

const drafts: Record<string, BookingDraft> = {};

export function parseInbound(payload: any) {
  const message = String(payload?.Body || payload?.message?.text || payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || '').trim();
  const from = normalize(String(payload?.From || payload?.from || payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || ''));
  return { message, from };
}

export async function listStaysByKeyword(kw: string) {
  const all = await listPublishedProperties();
  const lower = kw.toLowerCase();
  const match = all.filter((p) =>
    p.collection === lower ||
    p.title.toLowerCase().includes(lower) ||
    p.location.toLowerCase().includes(lower)
  );
  return match.length > 0 ? match : all.slice(0, 3);
}

export async function startBookingFlow(phone: string, keyword: string): Promise<string> {
  const candidates = await listStaysByKeyword(keyword);
  const first = candidates[0];
  if (!first) return "I couldn't find a stay matching that — try city, beach, countryside, or a name like 'Diani Drift'.";
  drafts[phone] = { step: 'property', propertyId: first.id };
  return `Great choice — *${first.title}* (${first.location}).\nKES ${first.price_per_night.toLocaleString()}/night · sleeps ${first.max_guests}.\n\nCheck-in date? (YYYY-MM-DD please)`;
}

function nights(ci?: string, co?: string) {
  if (!ci || !co) return 0;
  const ms = new Date(co).getTime() - new Date(ci).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export async function continueBookingFlow(phone: string, msg: string): Promise<string> {
  const draft = drafts[phone] ?? { step: 'start' as const };

  if (draft.step === 'start') {
    const candidates = await listStaysByKeyword(msg);
    if (candidates.length > 0) {
      const first = candidates[0];
      drafts[phone] = { step: 'property', propertyId: first.id };
      return `*${first.title}* · KES ${first.price_per_night.toLocaleString()}/night · sleeps ${first.max_guests}.\nCheck-in date? (YYYY-MM-DD)`;
    }
  }

  if (draft.step === 'property') {
    draft.check_in = msg.match(/\d{4}-\d{2}-\d{2}/)?.[0] || msg;
    draft.step = 'dates';
    drafts[phone] = draft;
    return `Check-in: ${draft.check_in}. Check-out date? (YYYY-MM-DD)`;
  }
  if (draft.step === 'dates') {
    draft.check_out = msg.match(/\d{4}-\d{2}-\d{2}/)?.[0] || msg;
    draft.step = 'guests';
    drafts[phone] = draft;
    const n = nights(draft.check_in, draft.check_out);
    return `Great — ${n || '?'} night${n === 1 ? '' : 's'}. How many guests?`;
  }
  if (draft.step === 'guests') {
    draft.guests = Number(msg.replace(/[^0-9]/g, '')) || 2;
    draft.step = 'name';
    drafts[phone] = draft;
    return `Ok — ${draft.guests} guest${draft.guests === 1 ? '' : 's'}. Your full name?`;
  }
  if (draft.step === 'name') {
    draft.name = msg;
    draft.step = 'email';
    drafts[phone] = draft;
    return `Thanks ${draft.name.split(' ')[0]}! Email for confirmation?`;
  }
  if (draft.step === 'email') {
    draft.email = msg;
    draft.step = 'phone';
    drafts[phone] = draft;
    return `Last step — best contact number? (you can reply with "same")`;
  }
  if (draft.step === 'phone') {
    draft.phone = msg.toLowerCase() === 'same' ? phone : normalize(msg) || phone;
    draft.step = 'confirm';
    const prop = draft.propertyId ? await getPropertyById(draft.propertyId) : null;
    const n = nights(draft.check_in, draft.check_out);
    const total = prop && n ? prop.price_per_night * n : 0;
    const summary = [
      `Booking summary for *${prop?.title || 'your stay'}*:`,
      `· ${draft.check_in} → ${draft.check_out} (${n} night${n === 1 ? '' : 's'})`,
      `· Guests: ${draft.guests}`,
      `· Name: ${draft.name}`,
      `· Email: ${draft.email}`,
      `· Phone: ${draft.phone}`,
      total ? `· Total: KES ${total.toLocaleString()}` : '',
      `\nReply with *YES* to confirm and get a payment link.`
    ].filter(Boolean).join('\n');
    drafts[phone] = draft;
    return summary;
  }
  if (draft.step === 'confirm') {
    if (/yes|confirm|ok|sure|book/i.test(msg)) {
      const prop = draft.propertyId ? await getPropertyById(draft.propertyId) : null;
      const n = nights(draft.check_in, draft.check_out);
      const total = prop && n ? prop.price_per_night * n : null;
      const booking = await createBooking({
        property_id: draft.propertyId || null,
        guest_name: draft.name || 'WhatsApp guest',
        guest_email: draft.email || '',
        guest_phone: draft.phone || phone,
        check_in: draft.check_in || null,
        check_out: draft.check_out || null,
        guests: draft.guests || 1,
        total_price: total,
        status: 'pending',
      });
      drafts[phone] = { ...draft, step: 'pay' };
      const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://project-iota-pearl-68.vercel.app';
      const payLink = `${base}/api/payments/checkout?booking_id=${encodeURIComponent(booking.id)}`;
      const totalLine = total ? ` KES ${total.toLocaleString()}` : '';
      return `Booking confirmed! Ref #${booking.id.slice(0, 8).toUpperCase()}.\n\nComplete payment here → ${payLink}\n\nOr say "pay later" and our team will be in touch shortly. Karibu!`;
    }
    return `No problem — send YES when you are ready, or "cancel" to start over.`;
  }
  if (draft.step === 'pay') {
    if (/later|pay later|call/i.test(msg)) {
      return `Perfect — our team will reach out to finalize payment via WhatsApp. Karibu Makao! 🏡`;
    }
  }

  // Fallback for unknown inputs — offer FAQ again
  const faq = getFaqAnswer(msg);
  if (faq) return faq;
  return "I can help you book — just say 'book' plus a stay name (e.g. 'book Diani Drift'). Or browse: city, beach, countryside.";
}

export async function handleInboundWhatsApp(raw: any): Promise<string> {
  const { message, from } = parseInbound(raw);
  if (!message || !from) return '';

  const greeting = getFaqAnswer(message);
  if (/^(book|stay|reserve)\b/i.test(message)) {
    const rest = message.replace(/^(book|stay|reserve)\s*/i, '');
    return startBookingFlow(from, rest || 'beach');
  }

  if (/(city|beach|countryside|nairobi|diani|mara|naivasha|lamu|kilimani|lavington)/i.test(message)) {
    const matches = await listStaysByKeyword(message);
    const lines = matches.slice(0, 4).map((p, i) => `${i + 1}. *${p.title}* — KES ${p.price_per_night.toLocaleString()}/night · ${p.location}`);
    if (greeting) return `${greeting}\n\nHere are stays matching your search:\n${lines.join('\n')}\n\nReply with "book" + number (e.g. "book 2") for more.`;
    return `Here are stays matching your search:\n${lines.join('\n')}\n\nReply "book 1", "book 2", etc to get started.`;
  }

  if (/(about|details|info|tell me about)\b/i.test(message)) {
    const matches = await listStaysByKeyword(message);
    if (matches[0]) {
      const p = matches[0];
      drafts[from] = { step: 'property', propertyId: p.id };
      return [
        `*${p.title}*`,
        p.location,
        `Rating ${p.rating.toFixed(1)} · Sleeps ${p.max_guests} · ${p.bedrooms} bd · ${p.bathrooms} ba${p.sqm ? ` · ${p.sqm} m²` : ''}`,
        `KES ${p.price_per_night.toLocaleString()}/night`,
        '',
        p.description,
        p.amenities?.length ? `Amenities: ${p.amenities.slice(0, 6).join(' · ')}` : '',
        '',
        `Reply "book" to begin booking, or "dates" to pick check-in.`
      ].filter(Boolean).join('\n');
    }
  }

  if (from && drafts[from] && drafts[from].step !== 'start') {
    return continueBookingFlow(from, message);
  }

  return greeting || FAQ_ANSWERS[0].answer;
}
