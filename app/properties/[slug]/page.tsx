'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bath,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Heart,
  MapPin,
  Maximize2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Wifi,
  Car,
  Waves,
  Flame,
  Snowflake,
  ChefHat,
  Dumbbell,
  Trees,
} from 'lucide-react';
import type { Property } from '@/lib/db';

function buildWhatsAppHref(property: Pick<Property, 'title' | 'slug' | 'price_per_night'>) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER || '254700254254';
  const cleaned = number.replace(/[^0-9]/g, '');
  const message = `Hi Makao254! I'd like to know more about ${property.title} (${property.slug}) KES ${property.price_per_night.toLocaleString()}/night. Please share availability.`;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

const amenityIcons: Record<string, any> = {
  'Wi-Fi': Wifi,
  'Parking': Car,
  'Rooftop pool': Waves,
  'Infinity pool': Waves,
  'Private beach': Waves,
  'Gym': Dumbbell,
  'Fireplace': Flame,
  'Hot tub': Waves,
  'Kitchen': ChefHat,
  'Air conditioning': Snowflake,
  'BBQ area': Flame,
  'Pool': Waves,
  'Hiking trails': Trees,
  'Private chef': ChefHat,
  'Staff included': BadgeCheck,
};

function iconFor(a: string) {
  if (amenityIcons[a]) return amenityIcons[a];
  return Sparkles;
}

type Review = {
  id: string;
  guest_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type PageProps = { params: { slug: string } };

export default function PropertyDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState('');
  const [booking, setBooking] = useState({
    name: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
  });
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewSent, setReviewSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/properties?slug=${encodeURIComponent(params.slug)}`);
        const full: Property | null = res.ok ? await res.json() : null;
        if (cancelled) return;
        const current = full && full.id ? full : null;
        setProperty(current);
        if (current) {
          const reviewRes = await fetch(`/api/reviews?propertyId=${encodeURIComponent(current.id)}`);
          if (!cancelled && reviewRes.ok) {
            const rv = await reviewRes.json();
            setReviews(Array.isArray(rv) ? rv : []);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params.slug]);

  const whatsappLink = useMemo(
    () => property ? buildWhatsAppHref(property) : '',
    [property]
  );

  if (loading) {
    return (
      <div className="stay-shell">
        <div className="container stay-hero-skeleton" aria-hidden="true" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="stay-shell">
        <div className="container not-found">
          <h1>Property not found</h1>
          <p>This stay may have been removed. Try browsing other stays.</p>
          <Link href="/#stays" className="button button-dark"><ArrowLeft size={16} /> Back to stays</Link>
        </div>
      </div>
    );
  }

  const { price_per_night, bedrooms, bathrooms, max_guests, sqm, images, amenities, lat, lng, title, location, description, rating, id } = property;

  const submitBooking = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        propertyId: id,
        guestName: booking.name,
        guestEmail: booking.email,
        guestPhone: booking.phone,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
      };
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('booking_failed');
      setSubmitted(true);
    } catch {
      setNotice('Something went wrong. Please try again or send us a WhatsApp message.');
    }
  };

  const submitReview = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: id,
          guest_name: reviewForm.name,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment || null,
        }),
      });
      if (!res.ok) throw new Error('review_failed');
      setReviewSent(true);
      setReviewForm({ name: '', rating: 5, comment: '' });
    } catch {
      setNotice('Could not submit review.');
    }
  };

  return (
    <div className="stay-shell">
      <header className="stay-header container">
        <Link href="/#stays" className="text-link stay-back"><ArrowLeft size={16} /> Back to stays</Link>
        <div className="stay-title-row">
          <div>
            <h1>{title}</h1>
            <div className="stay-sub"><span className="stay-meta-item"><MapPin size={15} /> {location}</span><span className="stay-meta-item"><Star size={15} fill="currentColor" /> {rating.toFixed(2)} rating</span></div>
          </div>
          <div className="stay-ctas">
            {whatsappLink && (
              <a className="button button-light whatsapp-btn" href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={17} /> Chat on WhatsApp
              </a>
            )}
            <button className="button button-dark" onClick={() => setBookingOpen(true)}>Book this Makao <ArrowRight size={17} /></button>
          </div>
        </div>
      </header>

      <section className="stay-gallery container">
        <div className={`gallery-main ${images.length === 1 ? 'solo' : ''}`} onClick={() => images.length > 1 && setLightboxOpen(true)}>
          <img src={images[activePhoto] || images[0]} alt={title} />
          {images.length > 1 && (
            <button className="gallery-expand" aria-label="Expand gallery"><Maximize2 size={17} /></button>
          )}
        </div>
        {images.length > 1 && (
          <div className="gallery-thumbs">
            {images.map((src, i) => (
              <button
                key={src + i}
                className={activePhoto === i ? 'thumb active' : 'thumb'}
                onClick={() => setActivePhoto(i)}
                aria-label={`Show photo ${i + 1}`}
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="stay-content container">
        <div className="stay-main">
          <div className="stay-specs">
            <span><BedDouble size={17} /> {bedrooms} bedroom{bedrooms > 1 ? 's' : ''}</span>
            <span><Bath size={17} /> {bathrooms} bathroom{bathrooms > 1 ? 's' : ''}</span>
            <span><Users size={17} /> Up to {max_guests} guests</span>
            {sqm && <span><Maximize2 size={17} /> {sqm} m²</span>}
          </div>

          <div className="stay-section">
            <p className="eyebrow">About this Makao</p>
            <h2>The stay.</h2>
            <p className="stay-description">{description}</p>
          </div>

          <div className="stay-section">
            <p className="eyebrow">Highlights</p>
            <h2>Amenities</h2>
            <div className="amenities-grid">
              {amenities.length === 0 && <p className="muted">Amenities list coming soon.</p>}
              {amenities.map((a) => {
                const Icon = iconFor(a);
                return (
                  <div key={a} className="amenity">
                    <span className="amenity-icon"><Icon size={17} /></span>
                    <span>{a}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {lat !== null && lng !== null && (
            <div className="stay-section">
              <p className="eyebrow">Getting there</p>
              <h2>Location</h2>
              <div className="stay-map">
                <iframe
                  title={`${title} map`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(String(lat))},${encodeURIComponent(String(lng))}&z=13&output=embed`}
                  width="100%"
                  height="360"
                  style={{ border: 0, borderRadius: 16 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}

          <div className="stay-section" id="reviews">
            <div className="section-row"><div><p className="eyebrow">Guest voice</p><h2>Reviews</h2></div></div>
            <div className="reviews-list">
              {reviews.length === 0 && <p className="muted">Be the first to leave a review after your stay.</p>}
              {reviews.map((r) => (
                <article className="review-item" key={r.id}>
                  <header>
                    <strong>{r.guest_name}</strong>
                    <span className="rating"><Star size={13} fill="currentColor" /> {r.rating.toFixed(1)}</span>
                  </header>
                  {r.comment && <p>{r.comment}</p>}
                </article>
              ))}
            </div>
            <form className="review-form" onSubmit={submitReview}>
              <p className="eyebrow">Share your stay</p>
              <h3>Leave a review</h3>
              {reviewSent ? (
                <div className="review-ok"><CheckCircle2 size={18} /> Thanks! Your review is pending approval.</div>
              ) : (
                <div className="review-grid">
                  <label>Full name<input required value={reviewForm.name} onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })} /></label>
                  <label>Rating
                    <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>
                      <option value={5}>5 · Exceptional</option>
                      <option value={4}>4 · Very good</option>
                      <option value={3}>3 · Good</option>
                      <option value={2}>2 · Fair</option>
                      <option value={1}>1 · Poor</option>
                    </select>
                  </label>
                  <label className="full">Your experience<textarea rows={4} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="What did you love about this Makao?" /></label>
                  <button className="button button-dark" type="submit">Submit review <ArrowRight size={16} /></button>
                </div>
              )}
            </form>
          </div>
        </div>

        <aside className="stay-aside">
          <div className="price-card">
            <div className="price-row"><strong>KES {price_per_night.toLocaleString()}</strong> <span>/ night</span></div>
            <button className="button button-dark block" onClick={() => setBookingOpen(true)}>Request to book <ArrowRight size={16} /></button>
            {whatsappLink && <a className="button button-light block whatsapp-btn" href={whatsappLink} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Or chat on WhatsApp</a>}
            <ul className="price-checks">
              <li><ShieldCheck size={16} /> Verified host</li>
              <li><CalendarDays size={16} /> Free cancellation up to 7 days</li>
              <li><Sparkles size={16} /> Welcome basket included</li>
            </ul>
          </div>
        </aside>
      </section>

      <footer className="footer stay-footer">
        <div className="container footer-inner">
          <div>
            <Link className="brand footer-brand" href="/"><span className="brand-mark">M</span><span>Makao<span className="brand-number">254</span></span></Link>
            <p>Curated stays across Kenya.<br />Made for your next story.</p>
          </div>
          <div className="footer-links">
            <div>
              <small>Explore</small>
              <Link href="/#collections">Collections</Link>
              <Link href="/#featured">Featured stays</Link>
              <Link href="/#story">Our story</Link>
            </div>
            <div>
              <small>Contact</small>
              <a href="mailto:hello@makao254.com">hello@makao254.com</a>
              <a href="tel:+254700254254">+254 700 254 254</a>
              {whatsappLink && <a href={whatsappLink} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>}
            </div>
          </div>
        </div>
        <div className="container footer-bottom"><span>© 2026 Makao254</span><span>Made with intention in Kenya</span></div>
      </footer>

      {lightboxOpen && (
        <div className="lightbox" role="dialog" onMouseDown={(e) => { if (e.target === e.currentTarget) setLightboxOpen(false); }}>
          <button className="icon-btn absolute-close" onClick={() => setLightboxOpen(false)} aria-label="Close gallery"><X size={18} /></button>
          <img src={images[activePhoto]} alt={title} />
          {images.length > 1 && (
            <div className="lightbox-thumbs">
              {images.map((src, i) => (
                <button key={src + i} className={activePhoto === i ? 'thumb active' : 'thumb'} onClick={() => setActivePhoto(i)}>
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {bookingOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingOpen(false); }}>
          <div className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="stay-booking-title">
            <button className="modal-close" aria-label="Close booking form" onClick={() => setBookingOpen(false)}><X size={20} /></button>
            {submitted ? (
              <div className="success-state">
                <span className="success-icon"><Sparkles size={22} /></span>
                <p className="eyebrow">Request received</p>
                <h2>You&apos;re on your way<br /><em>to {title.split(' — ')[0]}.</em></h2>
                <p>Our host team will confirm availability and reply within a few hours. Prefer chat? Message us on WhatsApp.</p>
                <div className="success-actions">
                  <button className="button button-dark" onClick={() => setBookingOpen(false)}>Done <ArrowRight size={17} /></button>
                  {whatsappLink && <a className="button button-light whatsapp-btn" href={whatsappLink} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Chat on WhatsApp</a>}
                </div>
              </div>
            ) : (
              <>
                <p className="eyebrow">Make it yours</p>
                <h2 id="stay-booking-title">Book {title.split(' — ')[0]}.</h2>
                <p className="modal-copy">Tell us a little about your stay. We will confirm within hours.</p>
                <form className="booking-form" onSubmit={submitBooking}>
                  <label>Full name<input name="name" required placeholder="Your name" value={booking.name} onChange={(e) => setBooking({ ...booking, name: e.target.value })} /></label>
                  <label>Email<input name="email" required type="email" placeholder="you@example.com" value={booking.email} onChange={(e) => setBooking({ ...booking, email: e.target.value })} /></label>
                  <div className="form-row">
                    <label>Check in<input name="checkIn" required type="date" value={booking.checkIn} onChange={(e) => setBooking({ ...booking, checkIn: e.target.value })} /></label>
                    <label>Check out<input name="checkOut" required type="date" value={booking.checkOut} onChange={(e) => setBooking({ ...booking, checkOut: e.target.value })} /></label>
                  </div>
                  <div className="form-row">
                    <label>Guests
                      <select name="guests" value={booking.guests} onChange={(e) => setBooking({ ...booking, guests: Number(e.target.value) })}>
                        {Array.from({ length: Math.max(8, max_guests) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
                      </select>
                    </label>
                    <label>Phone<input name="phone" required type="tel" placeholder="+254" value={booking.phone} onChange={(e) => setBooking({ ...booking, phone: e.target.value })} /></label>
                  </div>
                  {notice && <p className="form-error">{notice}</p>}
                  <button className="button button-dark form-submit" type="submit">Request to book <ArrowRight size={17} /></button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
