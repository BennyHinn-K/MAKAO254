'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Compass,
  Heart,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { heroVariants } from '@/lib/copy';
import { OptimizedVideo } from '@/components/ui/optimized-video';

const heroImages = {
  city: '/images/city/city-hero.jpg',
  cityInterior: '/images/city/city-interior.jpg',
  cityBedroom: '/images/city/city-bedroom.jpg',
  cityPool: '/images/city/city-pool.jpg',
  beach: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1600',
  beachInterior: 'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=1200',
  beachBedroom: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200',
  beachPool: 'https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=1200',
  countryside: 'https://images.pexels.com/photos/434263/pexels-photo-434263.jpeg?auto=compress&cs=tinysrgb&w=1600',
  countrysideInterior: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1200',
  countrysideBedroom: 'https://images.pexels.com/photos/5099325/pexels-photo-5099325.jpeg?auto=compress&cs=tinysrgb&w=1200',
  countrysidePool: 'https://images.pexels.com/photos/261397/pexels-photo-261397.jpeg?auto=compress&cs=tinysrgb&w=1200',
};

const heroSlides = [
  { label: 'Beach / Coastal escape', video: '/videos/BVID^^.mp4', fallback: heroImages.beach },
  { label: 'City / Skyline living', video: '/videos/CSIDE.mp4', fallback: heroImages.city },
];

type Collection = 'All' | 'City' | 'Countryside' | 'Beach';

type Listing = {
  id: string;
  slug: string;
  title: string;
  location: string;
  collection: Exclude<Collection, 'All'>;
  price: number;
  rating: number;
  beds: number;
  image: string;
  tag?: string;
};

const collectionCards = [
  { name: 'City' as const, eyebrow: '01 / Skyline living', copy: 'Design-led apartments above the pulse of Nairobi.', image: heroImages.city, tone: 'city' },
  { name: 'Countryside' as const, eyebrow: '02 / Highland retreat', copy: 'Slow mornings, open skies and the luxury of space.', image: heroImages.countryside, tone: 'green' },
  { name: 'Beach' as const, eyebrow: '03 / Coastal escape', copy: 'Barefoot days framed by salt air and warm light.', image: heroImages.beach, tone: 'ocean' },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-KE').format(price);
}

function collectionLabel(value: string): Exclude<Collection, 'All'> {
  if (value === 'city') return 'City';
  if (value === 'countryside') return 'Countryside';
  return 'Beach';
}

function waLink(title: string, slug?: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER || '254700254254';
  const text = `Hi Makao254, I'd like to know more about ${title}${slug ? ` (${slug})` : ''}.`;
  return `https://wa.me/${number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
}

export default function Home() {
  const [activeCollection, setActiveCollection] = useState<Collection>('All');
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroSlide, setHeroSlide] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const variant = searchParams.get('v')?.toLowerCase() === 'b' ? heroVariants.B : heroVariants.A;

  useEffect(() => {
    const timer = window.setInterval(() => setHeroSlide((current) => (current + 1) % heroSlides.length), 9000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/properties');
        if (!response.ok) throw new Error('fetch_failed');
        const data = await response.json();
        if (cancelled) return;
        setListings(data);
      } catch {
        if (!cancelled) setListings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const visibleListings = useMemo(
    () => activeCollection === 'All' ? listings : listings.filter((listing) => listing.collection === activeCollection),
    [activeCollection, listings]
  );

  const openBooking = (listing?: Listing) => {
    setSelectedListing(listing ?? null);
    setSubmitted(false);
    setNotice('');
    setBookingOpen(true);
  };

  const handleBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      propertyId: selectedListing?.id ?? null,
      guestName: String(form.get('name') ?? ''),
      guestEmail: String(form.get('email') ?? ''),
      guestPhone: String(form.get('phone') ?? ''),
      checkIn: String(form.get('checkIn') ?? ''),
      checkOut: String(form.get('checkOut') ?? ''),
      guests: Number(form.get('guests') ?? 1),
    };

    try {
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('booking_failed');
      setSubmitted(true);
    } catch {
      setNotice('Your request could not be sent right now. Please try again.');
    }
  };

  const toggleSaved = (id: string) => {
    setSavedIds((current) => current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]);
  };

  return (
    <main className="makao-shell">
      <section className="hero" id="top">
        <div className="hero-media" aria-hidden="true">
          <OptimizedVideo
            key={heroSlides[heroSlide].video}
            src={heroSlides[heroSlide].video}
            poster={heroSlides[heroSlide].fallback}
            isAboveFold
          />
        </div>
        <nav className="nav container">
          <a className="brand" href="#top" aria-label="Makao254 home"><span className="brand-mark">M</span><span>Makao<span className="brand-number">254</span></span></a>
          <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
            <a href="#collections" onClick={() => setMenuOpen(false)}>Collections</a>
            <a href="#stays" onClick={() => setMenuOpen(false)}>Find a stay</a>
            <a href="#story" onClick={() => setMenuOpen(false)}>Our story</a>
            <button className="nav-host" onClick={() => openBooking()}>List your home <ArrowRight size={15} /></button>
          </div>
          <button className="icon-button menu-button" aria-label="Open menu" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </nav>
        <div className="hero-content container">
          <p className="eyebrow light"><Sparkles size={14} /> {variant.eyebrow}</p>
          <h1>{variant.headline[0]}<br /><em>{variant.headline[1]}</em></h1>
          <p className="hero-copy">{variant.subheading}</p>
          <a className="button button-light" href="#stays">Explore stays <ArrowRight size={17} /></a>
        </div>
        <div className="hero-footer container"><span>Scroll to discover</span><span className="scroll-line" /><span className="hero-location">{heroSlides[heroSlide].label}</span><div className="hero-dots" aria-label="Hero slides">{heroSlides.map((slide, index) => <button key={slide.label} className={index === heroSlide ? 'hero-dot active' : 'hero-dot'} aria-label={`Show ${slide.label}`} onClick={() => setHeroSlide(index)} />)}</div></div>
      </section>

      <section className="search-wrap container" id="stays">
        <div className="search-card">
          <div className="search-field"><span className="field-icon"><Compass size={18} /></span><span><small>Where</small><strong>Anywhere in Kenya</strong></span></div>
          <div className="search-field"><span className="field-icon"><CalendarDays size={18} /></span><span><small>When</small><strong>Add dates</strong></span></div>
          <div className="search-field"><span className="field-icon"><Users size={18} /></span><span><small>Guests</small><strong>Add guests</strong></span></div>
          <button className="search-button" onClick={() => openBooking()}><Search size={19} /> <span>Search stays</span></button>
        </div>
      </section>

      <section className="section container" id="collections">
        <div className="section-heading"><div><p className="eyebrow">The Makao edit</p><h2>Stay somewhere<br /><em>worth remembering.</em></h2></div><p className="section-intro">Three distinct ways to experience the best of Kenya, brought together by a shared love of considered spaces and generous hosting.</p></div>
        <div className="collection-grid">
          {collectionCards.map((collection, index) => <button key={collection.name} className={`collection-card tone-${collection.tone}`} onClick={() => { setActiveCollection(collection.name); document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' }); }}>
            <img src={collection.image} alt={`${collection.name} collection`} /><span className="collection-shade" /><span className="collection-copy"><small>{collection.eyebrow}</small><strong>{collection.name}</strong><span>{collection.copy}</span><i>Explore <ArrowRight size={16} /></i></span><span className="collection-number">0{index + 1}</span>
          </button>)}
        </div>
      </section>

      <section className="featured section container" id="featured">
        <div className="section-heading compact"><div><p className="eyebrow">Places with a point of view</p><h2>Featured stays</h2></div><a className="text-link" href="#featured">View all stays <ArrowRight size={16} /></a></div>
        <div className="filter-row">{(['All', 'City', 'Countryside', 'Beach'] as Collection[]).map((collection) => <button key={collection} className={activeCollection === collection ? 'filter active' : 'filter'} onClick={() => setActiveCollection(collection)}>{collection}</button>)}</div>
        <div className="listing-grid">
          {loading && Array.from({ length: 6 }).map((_, index) => (
            <div className="listing-skeleton" key={`skeleton-${index}`}>
              <div className="skeleton-image" />
              <div className="skeleton-line wide" />
              <div className="skeleton-line" />
              <div className="skeleton-line narrow" />
            </div>
          ))}
          {!loading && visibleListings.length === 0 && (
            <p className="empty-state">No stays found in this collection yet. Check back soon.</p>
          )}
          {!loading && visibleListings.map((listing) => (
            <article className="listing-card" key={listing.id}>
              <div className="listing-image">
                <img src={listing.image} alt={listing.title} loading="lazy" />
                <button className="save-button" aria-label={`Save ${listing.title}`} onClick={() => toggleSaved(listing.id)}>
                  <Heart size={19} fill={savedIds.includes(listing.id) ? 'currentColor' : 'none'} />
                </button>
                <a
                  className="whatsapp-chip"
                  href={waLink(listing.title, listing.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chat on WhatsApp about ${listing.title}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle size={14} />
                </a>
                {listing.tag && <span className="listing-tag">{listing.tag}</span>}
              </div>
              <div className="listing-info">
                <div><h3>{listing.title}</h3><p>{listing.location}</p></div>
                <span className="rating"><Star size={14} fill="currentColor" /> {listing.rating.toFixed(2)}</span>
              </div>
              <div className="listing-meta">
                <span><BedDouble size={15} /> {listing.beds} bedrooms</span>
                <span><b>KES {formatPrice(listing.price)}</b> / night</span>
              </div>
              <div className="listing-actions">
                <button className="listing-link" onClick={() => router.push(`/properties/${encodeURIComponent(listing.slug)}`)}>
                  View stay <ArrowRight size={15} />
                </button>
                <button className="ghost-link" onClick={() => openBooking(listing)}>Quick enquiry</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="story section" id="story">
        <div className="story-image"><img src={heroImages.countrysideInterior} alt="Light-filled Makao254 living space" /></div>
        <div className="story-content">
          <p className="eyebrow">The Makao feeling</p>
          <h2>Not just a place<br />to sleep.</h2>
          <p>Makao means home. We choose spaces that make you linger a little longer, hosts who know the good spots, and details that turn a weekend away into a story you keep telling.</p>
          <div className="story-points">
            <span><ShieldCheck size={19} /> Verified spaces</span>
            <span><Sparkles size={19} /> Thoughtful hosting</span>
            <span><Compass size={19} /> Local perspective</span>
          </div>
          <a className="button button-dark" href="#collections">Discover Makao254 <ArrowRight size={17} /></a>
        </div>
      </section>

      <section className="quote-section container">
        <span className="quote-mark">&ldquo;</span>
        <blockquote>Every Makao has a little more room for the good things.</blockquote>
        <p>— The Makao254 promise</p>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <a className="brand footer-brand" href="#top"><span className="brand-mark">M</span><span>Makao<span className="brand-number">254</span></span></a>
            <p>Curated stays across Kenya.<br />Made for your next story.</p>
          </div>
          <div className="footer-links">
            <div>
              <small>Explore</small>
              <a href="#collections">Collections</a>
              <a href="#featured">Featured stays</a>
              <a href="#story">Our story</a>
            </div>
            <div>
              <small>Contact</small>
              <a href="mailto:hello@makao254.com">hello@makao254.com</a>
              <a href="tel:+254700254254">+254 700 254 254</a>
              <a href="#top">Instagram</a>
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 Makao254</span>
          <span>Made with intention in Kenya</span>
        </div>
      </footer>

      {bookingOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingOpen(false); }}>
          <div className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
            <button className="modal-close" aria-label="Close booking form" onClick={() => setBookingOpen(false)}><X size={20} /></button>
            {submitted ? (
              <div className="success-state">
                <span className="success-icon"><Sparkles size={22} /></span>
                <p className="eyebrow">Request received</p>
                <h2>You&rsquo;re on your way<br /><em>to Makao.</em></h2>
                <p>Our host team will be in touch shortly to confirm the details of your stay.</p>
                <button className="button button-dark" onClick={() => setBookingOpen(false)}>Done <ArrowRight size={17} /></button>
              </div>
            ) : (
              <>
                <p className="eyebrow">Make it yours</p>
                <h2 id="booking-title">Plan your stay.</h2>
                <p className="modal-copy">{selectedListing ? `Tell us a little about your stay at ${selectedListing.title}.` : 'Tell us what you are looking for and we will find your perfect Makao.'}</p>
                <form className="booking-form" onSubmit={handleBooking}>
                  <label>Full name<input name="name" required placeholder="Your name" /></label>
                  <label>Email address<input name="email" required type="email" placeholder="you@example.com" /></label>
                  <div className="form-row">
                    <label>Check in<input name="checkIn" required type="date" /></label>
                    <label>Check out<input name="checkOut" required type="date" /></label>
                  </div>
                  <div className="form-row">
                    <label>Guests
                      <select name="guests" defaultValue="2">
                        <option value="1">1 guest</option>
                        <option value="2">2 guests</option>
                        <option value="3">3 guests</option>
                        <option value="4">4+ guests</option>
                      </select>
                    </label>
                    <label>Phone<input name="phone" required type="tel" placeholder="+254" /></label>
                  </div>
                  {notice && <p className="form-error">{notice}</p>}
                  <button className="button button-dark form-submit" type="submit">Request to book <ArrowRight size={17} /></button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
