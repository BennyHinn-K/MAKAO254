import * as fs from 'node:fs';
import * as path from 'node:path';
import * as bcrypt from 'bcryptjs';
import { generateSecret } from 'otplib';

export type Collection = 'city' | 'countryside' | 'beach';
export type PropertyStatus = 'draft' | 'published';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type ContactStatus = 'new' | 'read' | 'replied';
export type AdminRole = 'admin' | 'viewer';

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
  sqm: number | null;
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

export interface Admin {
  id: string;
  email: string;
  password_hash: string;
  role: AdminRole;
  totp_secret: string;
  created_at: string;
}

export interface AdminSession {
  id: string;
  admin_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

interface DatabaseShape {
  properties: Property[];
  bookings: Booking[];
  reviews: Review[];
  contact_messages: ContactMessage[];
  admins: Admin[];
  admin_sessions: AdminSession[];
}

const DB_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DB_DIR, 'makao254.json');

const PEXELS = {
  nairobiSkyline: 'https://images.pexels.com/photos/11341669/pexels-photo-11341669.jpeg?auto=compress&cs=tinysrgb&w=1600',
  apartmentInterior: 'https://images.pexels.com/photos/3634634/pexels-photo-3634634.jpeg?auto=compress&cs=tinysrgb&w=1200',
  masterBedroom: 'https://images.pexels.com/photos/545012/pexels-photo-545012.jpeg?auto=compress&cs=tinysrgb&w=1200',
  rooftopPool: 'https://images.pexels.com/photos/261397/pexels-photo-261397.jpeg?auto=compress&cs=tinysrgb&w=1200',
  dianiBeach: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1600',
  beachLiving: 'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=1200',
  beachBedroom: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200',
  beachPool: 'https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=1200',
  highland: 'https://images.pexels.com/photos/434263/pexels-photo-434263.jpeg?auto=compress&cs=tinysrgb&w=1600',
  lodgeLiving: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1200',
  rusticBedroom: 'https://images.pexels.com/photos/5099325/pexels-photo-5099325.jpeg?auto=compress&cs=tinysrgb&w=1200',
  safariTent: 'https://images.pexels.com/photos/7562315/pexels-photo-7562315.jpeg?auto=compress&cs=tinysrgb&w=1200',
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
        'A sun-drenched, design-led penthouse in the heart of Lavington, with wrap-around views of the Nairobi skyline, a private rooftop terrace, and interiors curated with modern African craft, hardwoods, and warm textiles.',
      price_per_night: 24500,
      max_guests: 4,
      bedrooms: 2,
      bathrooms: 2,
      sqm: 150,
      amenities: ['Wi-Fi', 'Rooftop pool', 'Parking', 'Gym', '24/7 security', 'Kitchen', 'Washer', 'Air conditioning'],
      images: [PEXELS.nairobiSkyline, PEXELS.apartmentInterior, PEXELS.masterBedroom, PEXELS.rooftopPool],
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
        'A quiet artists apartment tucked into the leafy streets of Kilimani, walking distance to the best cafés, Yaya Centre, and Gallery Watatu. Sleeps three with a private study nook, linen daybed, and small back garden.',
      price_per_night: 16800,
      max_guests: 3,
      bedrooms: 2,
      bathrooms: 1,
      sqm: 105,
      amenities: ['Wi-Fi', 'Kitchen', 'Workspace', 'Smart TV', 'Secure entry', 'Back garden', 'Air conditioning'],
      images: [PEXELS.apartmentInterior, PEXELS.masterBedroom, PEXELS.nairobiSkyline],
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
        'A stone-and-timber farmhouse tucked into the Aberdares foothills with panoramic views of Lake Naivasha. Five acres of private garden, a chef on call, and a fire deck for starry evenings with the sounds of the wild.',
      price_per_night: 42000,
      max_guests: 8,
      bedrooms: 4,
      bathrooms: 3,
      sqm: 380,
      amenities: ['Wi-Fi', 'Fireplace', 'Hot tub', 'Private chef', 'BBQ area', 'Hiking trails', 'Staff included'],
      images: [PEXELS.highland, PEXELS.lodgeLiving, PEXELS.rusticBedroom, PEXELS.rooftopPool],
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
        'Boutique tented suites under ancient fig trees on a private Mara conservancy bordering the Maasai Mara National Reserve. Daily game drives, sundowner bush cocktails, and generous hosting from the resident Maasai team.',
      price_per_night: 85000,
      max_guests: 6,
      bedrooms: 3,
      bathrooms: 3,
      sqm: 240,
      amenities: ['Game drives included', 'En-suite tent', 'Outdoor shower', 'Restaurant', 'Bar', 'Fire pit', 'Conservancy walks'],
      images: [PEXELS.highland, PEXELS.safariTent, PEXELS.rusticBedroom],
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
        'A private beachfront Swahili-styled villa on Galu Beach, a short stroll from Diani best beach bars. White sand steps from your veranda, a private chef, and a swaying palm-fringed infinity pool that melts into the Indian Ocean.',
      price_per_night: 58000,
      max_guests: 8,
      bedrooms: 4,
      bathrooms: 4,
      sqm: 320,
      amenities: ['Private beach', 'Infinity pool', 'Kitchen staff', 'Wi-Fi', 'Kayaks', 'Beach lounge', 'BBQ', 'Air conditioning'],
      images: [PEXELS.dianiBeach, PEXELS.beachLiving, PEXELS.beachBedroom, PEXELS.beachPool],
      location: 'Diani Beach, Kwale County',
      lat: -4.3079,
      lng: 39.58,
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
        'A restored white-washed Lamu house with hand-carved Swahili doors, a rooftop dhow deck for breakfast and sunsets, and direct access to Shela dunes. Stone Town is a short dhow ride away, and Lamu Old Town a leisurely walk.',
      price_per_night: 34000,
      max_guests: 5,
      bedrooms: 3,
      bathrooms: 2,
      sqm: 220,
      amenities: ['Rooftop deck', 'Dhow trips', 'In-house cook', 'Wi-Fi', 'Beach access', 'Courtyard', 'Museum walk distance'],
      images: [PEXELS.dianiBeach, PEXELS.beachLiving, PEXELS.beachBedroom],
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
        'The Lavington Loft is exactly as described — the rooftop view alone is worth it. Everything was beautifully considered, from the kitchen supplies to the welcome booklet on Kenyan coffee.',
      approved: true,
      created_at: now(),
    },
    {
      id: uid(),
      property_id: 'will-be-linked-by-seed-post-link',
      guest_name: 'Wanjiru M.',
      rating: 5,
      comment:
        'Spent four days at Diani Drift. The chef made incredible Swahili breakfasts, and the infinity pool feels almost connected to the sea. We will be back.',
      approved: true,
      created_at: now(),
    },
  ],
  contact_messages: [],
  admins: [
    {
      id: 'admin_001',
      email: process.env.ADMIN_SEED_EMAIL || 'admin@makao254.com',
      password_hash: '__REPLACE_WITH_BCRYPT_HASH__',
      role: 'admin',
      totp_secret: '__REPLACE_WITH_TOTP_SECRET__',
      created_at: now(),
    },
  ],
  admin_sessions: [],
};

seed.reviews[0].property_id = seed.properties[0].id;
seed.reviews[1].property_id = seed.properties[4].id;

function ensureDb() {
  try {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
      scheduleAdminMigration();
    } else {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<DatabaseShape>;
      if (!parsed.properties || !parsed.properties.length) {
        fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
        scheduleAdminMigration();
      } else {
        let changed = false;
        if (!parsed.admins) {
          parsed.admins = seed.admins;
          changed = true;
        }
        if (!parsed.admin_sessions) {
          parsed.admin_sessions = seed.admin_sessions;
          changed = true;
        }
        if (parsed.properties.some((p) => typeof (p as any).sqm === 'undefined')) {
          parsed.properties = seed.properties;
          changed = true;
        }
        if (changed) fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
        scheduleAdminMigration();
      }
    }
  } catch {
    // fallback read-only in-memory for read-only filesystems
  }
}

let migrationScheduled = false;
function scheduleAdminMigration() {
  if (migrationScheduled) return;
  migrationScheduled = true;
  queueMicrotask(async () => {
    try {
      if (!fs.existsSync(DB_FILE)) return;
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<DatabaseShape>;
      if (!parsed.admins) return;
      let changed = false;
      for (const admin of parsed.admins) {
        const needsPassword =
          admin.password_hash === '__REPLACE_WITH_BCRYPT_HASH__' ||
          admin.password_hash === '$2a$10$w9l/8T0fC.XbCz/lm2P9NOPXbK.9b86i8c6oV78n8T8N9z2m6b86y';
        const needsTotp =
          admin.totp_secret === '__REPLACE_WITH_TOTP_SECRET__' ||
          admin.totp_secret === 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
        if (needsPassword) {
          const password = process.env.ADMIN_SEED_PASSWORD || 'Makao254!Secure';
          admin.password_hash = await bcrypt.hash(password, 10);
          changed = true;
        }
        if (needsTotp) {
          admin.totp_secret = generateSecret();
          changed = true;
        }
      }
      if (changed) fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    } catch {
      // migration best-effort
    } finally {
      migrationScheduled = false;
    }
  });
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
  input: Omit<Property, 'id' | 'created_at' | 'rating' | 'status'> & Partial<Pick<Property, 'rating' | 'status' | 'sqm'>>,
): Promise<Property> {
  const db = load();
  const next: Property = {
    id: uid(),
    created_at: now(),
    rating: input.rating ?? 0,
    status: input.status ?? 'published',
    sqm: input.sqm ?? null,
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

/* ===================== ADMINS & SESSIONS ===================== */

export async function getAdminByEmail(email: string): Promise<Admin | undefined> {
  const db = load();
  return db.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
}

export async function getAdminById(id: string): Promise<Admin | undefined> {
  const db = load();
  return db.admins.find((a) => a.id === id);
}

export async function updateAdminPassword(id: string, passwordHash: string): Promise<Admin | undefined> {
  const db = load();
  const idx = db.admins.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  db.admins[idx].password_hash = passwordHash;
  save(db);
  return db.admins[idx];
}

export async function updateAdminTotp(id: string, totpSecret: string): Promise<Admin | undefined> {
  const db = load();
  const idx = db.admins.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  db.admins[idx].totp_secret = totpSecret;
  save(db);
  return db.admins[idx];
}

export async function createAdminSession(input: Omit<AdminSession, 'id' | 'created_at'>): Promise<AdminSession> {
  const db = load();
  const next: AdminSession = { id: uid(), created_at: now(), ...input };
  db.admin_sessions.unshift(next);
  save(db);
  return next;
}

export async function getAdminSessionByTokenHash(tokenHash: string): Promise<AdminSession | undefined> {
  const db = load();
  return db.admin_sessions.find((s) => s.token_hash === tokenHash);
}

export async function revokeAdminSession(id: string): Promise<boolean> {
  const db = load();
  const before = db.admin_sessions.length;
  db.admin_sessions = db.admin_sessions.filter((s) => s.id !== id);
  save(db);
  return db.admin_sessions.length < before;
}

export async function pruneExpiredAdminSessions(): Promise<void> {
  const db = load();
  const nowIso = now();
  db.admin_sessions = db.admin_sessions.filter((s) => s.expires_at > nowIso);
  save(db);
}

export async function listPropertiesBySlug(slug: string): Promise<Property | undefined> {
  const db = load();
  return db.properties.find((p) => p.slug === slug);
}
