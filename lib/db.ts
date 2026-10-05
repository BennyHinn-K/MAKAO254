import * as fs from 'node:fs';
import * as path from 'node:path';

export type Collection = 'city' | 'countryside' | 'beach';
export type PropertyStatus = 'draft' | 'published';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type ContactStatus = 'new' | 'read' | 'replied';

export interface Property {
  id: string;
  title: string;
  slug: string;
  collection: Collection;
  description: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  location: string;
  lat: number | null;
  lng: number | null;
  status: PropertyStatus;
  rating: number;
  created_at: string;
}

export interface Booking {
  id: string;
  property_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  total_price: number | null;
  status: BookingStatus;
  created_at: string;
}

export interface Review {
  id: string;
  property_id: string;
  guest_name: string;
  rating: number;
  comment: string | null;
  approved: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string;
  status: ContactStatus;
  created_at: string;
}

interface DatabaseShape {
  properties: Property[];
  bookings: Booking[];
  reviews: Review[];
  contact_messages: ContactMessage[];
}

const DB_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DB_DIR, 'makao254.json');

const SEED_IMAGES = {
  city: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Premium%20photorealistic%20architectural%20photography%20of%20a%20luxury%20high-rise%20BnB%20in%20Nairobi%20Kenya%20with%20panoramic%20skyline%20view%2C%20floor%20to%20ceiling%20windows%2C%20sunset%20golden%20light%2C%20modern%20African%20interior%20design&image_size=landscape_4_3',
  beach: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Premium%20photorealistic%20architectural%20photography%20of%20a%20luxury%20beachfront%20BnB%20on%20the%20Kenyan%20coast%20near%20Mombasa%2C%20private%20beach%20access%2C%20palm%20trees%2C%20turquoise%20Indian%20Ocean%2C%20golden%20hour%20sunlight%2C%20elegant%20Swahili%20architecture&image_size=landscape_4_3',
  countryside: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Breathtaking%20view%20from%20a%20luxury%20countryside%20BnB%20in%20the%20Kenyan%20highlands%20near%20Naivasha%2C%20rolling%20green%20hills%2C%20acacia%20trees%2C%20traditional%20stone%20and%20thatched%20roof%20lodge%2C%20dramatic%20sunset%20sky%2C%20African%20landscape&image_size=landscape_4_3',
};

function uid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function now() {
  return new Date().toISOString();
}

const seed: DatabaseShape = {
  properties: [
    {
      id: uid(),
      title: 'The Lavington Loft — Skyline Living',
      slug: 'the-lavington-loft',
      collection: 'city',
      description:
        'A sun-drenched design-led penthouse in the heart of Lavington with wrap-around views of the Nairobi skyline, private rooftop terrace, and curated interiors inspired by modern African craft.',
      price_per_night: 24500,
      max_guests: 4,
      bedrooms: 2,
      bathrooms: 2,
      amenities: ['Wi-Fi', 'Rooftop pool', 'Parking', 'Gym', '24/7 security', 'Kitchen', 'Washer'],
      images: [
        SEED_IMAGES.city,
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Luxury%20BnB%20living%20room%20interior%20in%20Nairobi%2C%20floor%20to%20ceiling%20windows%2C%20warm%20leather%20sofa%2C%20African%20art%20on%20walls%2C%20wooden%20floor%2C%20afternoon%20light&image_size=landscape_4_3',
      ],
      location: 'Lavington, Nairobi',
      lat: -1.2921,
      lng: 36.8219,
      status: 'published',
      rating: 4.92,
      created_at: now(),
    },
    {
      id: uid(),
      title: 'Kilimani Canvas — A Westlands Retreat',
      slug: 'kilimani-canvas',
      collection: 'city',
      description:
        'A quiet artists apartment tucked into the leafy streets of Kilimani, walking distance to great cafés, Yaya Centre, and Gallery Watatu. Sleeps 3 with a private study nook.',
      price_per_night: 16800,
      max_guests: 3,
      bedrooms: 2,
      bathrooms: 1,
      amenities: ['Wi-Fi', 'Kitchen', 'Workspace', 'Smart TV', 'Secure entry', 'Back garden'],
      images: [
        SEED_IMAGES.city,
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Elegant%20minimalist%20Kilimani%20apartment%20bedroom%20with%20linen%20bedding%2C%20sheer%20curtains%2C%20plants%2C%20Nairobi%20green%20outdoor%20view&image_size=landscape_4_3',
      ],
      location: 'Kilimani, Nairobi',
      lat: -1.2897,
      lng: 36.7836,
      status: 'published',
      rating: 4.78,
      created_at: now(),
    },
    {
      id: uid(),
      title: 'Highland House — Naivasha Countryside',
      slug: 'highland-house-naivasha',
      collection: 'countryside',
      description:
        'A stone-and-timber farmhouse tucked into the Aberdares foothills with views of Lake Naivasha. Five acres of private garden, a chef on call, and a fire deck for starry evenings.',
      price_per_night: 42000,
      max_guests: 8,
      bedrooms: 4,
      bathrooms: 3,
      amenities: ['Wi-Fi', 'Fireplace', 'Hot tub', 'Private chef', 'BBQ area', 'Hiking trails', 'Staff included'],
      images: [
        SEED_IMAGES.countryside,
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Luxurious%20Kenyan%20highland%20lodge%20living%20room%20with%20large%20stone%20fireplace%2C%20leather%20sofas%2C%20wooden%20beams%2C%20panoramic%20green%20hill%20views&image_size=landscape_4_3',
      ],
      location: 'Lake Naivasha, Nakuru County',
      lat: -0.7791,
      lng: 36.4314,
      status: 'published',
      rating: 4.97,
      created_at: now(),
    },
    {
      id: uid(),
      title: 'Mara Fig — Masai Mara Safari Lodge',
      slug: 'mara-fig-lodge',
      collection: 'countryside',
      description:
        'Boutique tented suites under ancient fig trees on a private Mara conservancy bordering the Maasai Mara National Reserve. Daily game drives, sundowner bush cocktails, and authentic Maasai hosting.',
      price_per_night: 85000,
      max_guests: 6,
      bedrooms: 3,
      bathrooms: 3,
      amenities: ['Game drives included', 'En-suite tent', 'Outdoor shower', 'Restaurant', 'Bar', 'Fire pit', 'Conservancy walks'],
      images: [
        SEED_IMAGES.countryside,
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Luxurious%20safari%20tent%20suite%20Maasai%20Mara%20at%20sunset%2C%20canopied%20bed%2C%20elegant%20furniture%2C%20savanna%20plains%20view%20through%20opening%2C%20warm%20lantern%20light&image_size=landscape_4_3',
      ],
      location: 'Maasai Mara, Narok County',
      lat: -1.4922,
      lng: 35.1123,
      status: 'published',
      rating: 4.99,
      created_at: now(),
    },
    {
      id: uid(),
      title: 'Diani Drift — Beachfront Villa',
      slug: 'diani-drift-villa',
      collection: 'beach',
      description:
        'A private beachfront Swahili-styled villa on Galu Beach, a short stroll from Diani\'s best beach bars. White sand steps from your veranda, a private chef, and swaying palm-fringed infinity pool.',
      price_per_night: 58000,
      max_guests: 8,
      bedrooms: 4,
      bathrooms: 4,
      amenities: ['Private beach', 'Infinity pool', 'Kitchen staff', 'Wi-Fi', 'Kayaks', 'Beach lounge', 'BBQ'],
      images: [
        SEED_IMAGES.beach,
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Luxurious%20Swahili%20beach%20villa%20bedroom%20white%20linen%204%20poster%20bed%2C%20sheer%20mosquito%20net%2C%20ocean%20breeze%20through%20open%20doors%2C%20warm%20morning%20light&image_size=landscape_4_3',
      ],
      location: 'Diani Beach, Kwale County',
      lat: -4.3079,
      lng: 39.5800,
      status: 'published',
      rating: 4.89,
      created_at: now(),
    },
    {
      id: uid(),
      title: 'Lamu Light — Shela Private Home',
      slug: 'lamu-light-shela',
      collection: 'beach',
      description:
        'A restored white-washed Lamu house with hand-carved Swahili doors, a rooftop dhow deck for breakfast, and direct access to Shela dunes. Stone Town is a short dhow ride away.',
      price_per_night: 34000,
      max_guests: 5,
      bedrooms: 3,
      bathrooms: 2,
      amenities: ['Rooftop deck', 'Dhow trips', 'In-house cook', 'Wi-Fi', 'Beach access', 'Courtyard', 'Museum walk distance'],
      images: [
        SEED_IMAGES.beach,
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Swahili%20Lamu%20stone%20town%20house%20interior%20courtyard%2C%20whitewashed%20walls%2C%20wooden%20carved%20doors%2C%20terracotta%20pots%2C%20bougainvillea%2C%20dappled%20light&image_size=landscape_4_3',
      ],
      location: 'Shela, Lamu County',
      lat: -2.2725,
      lng: 40.9034,
      status: 'published',
      rating: 4.84,
      created_at: now(),
    },
  ],
  bookings: [],
  reviews: [
    {
      id: uid(),
      property_id: 'will-be-linked-by-seed-post-link',
      guest_name: 'Amina K.',
      rating: 5,
      comment:
        'The Lavington Loft is exactly as described — the rooftop view alone is worth it. Everything was beautifully considered, from the kitchen supplies to the welcome booklet.',
      approved: true,
      created_at: now(),
    },
  ],
  contact_messages: [],
};

seed.reviews[0].property_id = seed.properties[0].id;

function ensureDb() {
  try {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    } else {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (!parsed.properties || !parsed.properties.length) {
        fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
      }
    }
  } catch (err) {
    // fallback read-only in-memory for read-only filesystems
  }
}

function load(): DatabaseShape {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return JSON.parse(JSON.stringify(seed));
  }
}

function save(db: DatabaseShape) {
  try {
    ensureDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch {
    // ignore on read-only fs
  }
}

/* ===================== PROPERTIES ===================== */

export async function listPublishedProperties(): Promise<Property[]> {
  const db = load();
  return db.properties
    .filter((p) => p.status === 'published')
    .sort((a, b) => b.rating - a.rating);
}

export async function listAllProperties(): Promise<Property[]> {
  const db = load();
  return db.properties.slice();
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  const db = load();
  return db.properties.find((p) => p.id === id);
}

export async function createProperty(
  input: Omit<Property, 'id' | 'created_at' | 'rating' | 'status'> & Partial<Pick<Property, 'rating' | 'status'>>,
): Promise<Property> {
  const db = load();
  const next: Property = {
    id: uid(),
    created_at: now(),
    rating: input.rating ?? 0,
    status: input.status ?? 'published',
    title: input.title,
    slug: input.slug,
    collection: input.collection,
    description: input.description,
    price_per_night: input.price_per_night,
    max_guests: input.max_guests,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    amenities: input.amenities,
    images: input.images,
    location: input.location,
    lat: input.lat,
    lng: input.lng,
  };
  db.properties.unshift(next);
  save(db);
  return next;
}

export async function updateProperty(id: string, patch: Partial<Property>): Promise<Property | undefined> {
  const db = load();
  const idx = db.properties.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  db.properties[idx] = { ...db.properties[idx], ...patch, id };
  save(db);
  return db.properties[idx];
}

export async function deleteProperty(id: string): Promise<boolean> {
  const db = load();
  const before = db.properties.length;
  db.properties = db.properties.filter((p) => p.id !== id);
  save(db);
  return db.properties.length < before;
}

/* ===================== BOOKINGS ===================== */

export async function listBookings(): Promise<Booking[]> {
  const db = load();
  return db.bookings.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
  const db = load();
  return db.bookings.find((b) => b.id === id);
}

export async function createBooking(
  input: Omit<Booking, 'id' | 'created_at' | 'status'> & Partial<Pick<Booking, 'status'>>,
): Promise<Booking> {
  const db = load();
  const next: Booking = {
    id: uid(),
    created_at: now(),
    status: input.status ?? 'pending',
    property_id: input.property_id ?? null,
    guest_name: input.guest_name,
    guest_email: input.guest_email,
    guest_phone: input.guest_phone ?? null,
    check_in: input.check_in ?? null,
    check_out: input.check_out ?? null,
    guests: input.guests,
    total_price: input.total_price ?? null,
  };
  db.bookings.unshift(next);
  save(db);
  return next;
}

export async function updateBooking(id: string, patch: Partial<Booking>): Promise<Booking | undefined> {
  const db = load();
  const idx = db.bookings.findIndex((b) => b.id === id);
  if (idx === -1) return undefined;
  db.bookings[idx] = { ...db.bookings[idx], ...patch, id };
  save(db);
  return db.bookings[idx];
}

export async function deleteBooking(id: string): Promise<boolean> {
  const db = load();
  const before = db.bookings.length;
  db.bookings = db.bookings.filter((b) => b.id !== id);
  save(db);
  return db.bookings.length < before;
}

/* ===================== REVIEWS ===================== */

export async function listApprovedReviews(propertyId?: string): Promise<Review[]> {
  const db = load();
  return db.reviews
    .filter((r) => r.approved && (!propertyId || r.property_id === propertyId))
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function listAllReviews(): Promise<Review[]> {
  const db = load();
  return db.reviews.slice();
}

export async function createReview(
  input: Omit<Review, 'id' | 'created_at' | 'approved'> & Partial<Pick<Review, 'approved'>>,
): Promise<Review> {
  const db = load();
  const next: Review = {
    id: uid(),
    created_at: now(),
    approved: input.approved ?? false,
    property_id: input.property_id,
    guest_name: input.guest_name,
    rating: input.rating,
    comment: input.comment ?? null,
  };
  db.reviews.unshift(next);
  save(db);
  return next;
}

export async function approveReview(id: string): Promise<Review | undefined> {
  const db = load();
  const idx = db.reviews.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  db.reviews[idx].approved = true;
  save(db);
  return db.reviews[idx];
}

export async function deleteReview(id: string): Promise<boolean> {
  const db = load();
  const before = db.reviews.length;
  db.reviews = db.reviews.filter((r) => r.id !== id);
  save(db);
  return db.reviews.length < before;
}

/* ===================== CONTACT MESSAGES ===================== */

export async function listContactMessages(): Promise<ContactMessage[]> {
  const db = load();
  return db.contact_messages.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function createContactMessage(
  input: Omit<ContactMessage, 'id' | 'created_at' | 'source' | 'status'> &
    Partial<Pick<ContactMessage, 'source' | 'status'>>,
): Promise<ContactMessage> {
  const db = load();
  const next: ContactMessage = {
    id: uid(),
    created_at: now(),
    source: input.source ?? 'website',
    status: input.status ?? 'new',
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    subject: input.subject ?? null,
    message: input.message,
  };
  db.contact_messages.unshift(next);
  save(db);
  return next;
}

export async function updateContactStatus(id: string, status: ContactStatus): Promise<ContactMessage | undefined> {
  const db = load();
  const idx = db.contact_messages.findIndex((m) => m.id === id);
  if (idx === -1) return undefined;
  db.contact_messages[idx].status = status;
  save(db);
  return db.contact_messages[idx];
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const db = load();
  const before = db.contact_messages.length;
  db.contact_messages = db.contact_messages.filter((m) => m.id !== id);
  save(db);
  return db.contact_messages.length < before;
}
