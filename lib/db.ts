import { Pool, type QueryResultRow } from 'pg';

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/* ---------------- connection ---------------- */

const globalForPool = globalThis as unknown as { __makaoPool?: Pool };

function getPool(): Pool {
  if (globalForPool.__makaoPool) return globalForPool.__makaoPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. See .env.example and run `npm run db:setup`.');
  }
  const isLocal = /(localhost|127\.0\.0\.1)/.test(connectionString);

  globalForPool.__makaoPool = new Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  return globalForPool.__makaoPool;
}

async function query<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query<T>(sql, params);
  return result.rows;
}

/* ---------------- row mapping ---------------- */

function toIso(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function toDateOnly(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
}

function num(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

function numOrNull(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function mapProperty(r: Record<string, unknown>): Property {
  return {
    id: String(r.id),
    title: String(r.title),
    slug: String(r.slug),
    collection: r.collection as Collection,
    description: (r.description as string) ?? '',
    price_per_night: num(r.price_per_night),
    max_guests: num(r.max_guests),
    bedrooms: num(r.bedrooms),
    bathrooms: num(r.bathrooms),
    sqm: numOrNull(r.sqm),
    amenities: (r.amenities as string[]) ?? [],
    images: (r.images as string[]) ?? [],
    location: (r.location as string) ?? '',
    lat: numOrNull(r.lat),
    lng: numOrNull(r.lng),
    status: r.status as PropertyStatus,
    rating: num(r.rating),
    created_at: toIso(r.created_at) ?? new Date().toISOString(),
  };
}

function mapBooking(r: Record<string, unknown>): Booking {
  return {
    id: String(r.id),
    property_id: (r.property_id as string) ?? null,
    guest_name: String(r.guest_name),
    guest_email: String(r.guest_email),
    guest_phone: (r.guest_phone as string) ?? null,
    check_in: toDateOnly(r.check_in),
    check_out: toDateOnly(r.check_out),
    guests: num(r.guests),
    total_price: numOrNull(r.total_price),
    status: r.status as BookingStatus,
    created_at: toIso(r.created_at) ?? new Date().toISOString(),
  };
}

function mapReview(r: Record<string, unknown>): Review {
  return {
    id: String(r.id),
    property_id: String(r.property_id),
    guest_name: String(r.guest_name),
    rating: num(r.rating),
    comment: (r.comment as string) ?? null,
    approved: Boolean(r.approved),
    created_at: toIso(r.created_at) ?? new Date().toISOString(),
  };
}

function mapContactMessage(r: Record<string, unknown>): ContactMessage {
  return {
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    phone: (r.phone as string) ?? null,
    subject: (r.subject as string) ?? null,
    message: String(r.message),
    source: (r.source as string) ?? 'website',
    status: r.status as ContactStatus,
    created_at: toIso(r.created_at) ?? new Date().toISOString(),
  };
}

function mapAdmin(r: Record<string, unknown>): Admin {
  return {
    id: String(r.id),
    email: String(r.email),
    password_hash: String(r.password_hash),
    role: r.role as AdminRole,
    totp_secret: String(r.totp_secret),
    created_at: toIso(r.created_at) ?? new Date().toISOString(),
  };
}

function mapAdminSession(r: Record<string, unknown>): AdminSession {
  return {
    id: String(r.id),
    admin_id: String(r.admin_id),
    token_hash: String(r.token_hash),
    expires_at: toIso(r.expires_at) ?? new Date().toISOString(),
    created_at: toIso(r.created_at) ?? new Date().toISOString(),
  };
}

/** Builds a parameterised `SET a = $1, b = $2` clause from a whitelisted patch. */
function buildUpdate(
  patch: Record<string, unknown>,
  columns: readonly string[],
  startIndex = 1,
): { clause: string; values: unknown[] } | null {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const column of columns) {
    if (!(column in patch) || patch[column] === undefined) continue;
    values.push(patch[column]);
    sets.push(`${column} = $${startIndex + values.length - 1}`);
  }
  if (!sets.length) return null;
  return { clause: sets.join(', '), values };
}

const PROPERTY_COLUMNS = [
  'title', 'slug', 'collection', 'description', 'price_per_night', 'max_guests', 'bedrooms',
  'bathrooms', 'sqm', 'amenities', 'images', 'location', 'lat', 'lng', 'status', 'rating',
] as const;

const BOOKING_COLUMNS = [
  'property_id', 'guest_name', 'guest_email', 'guest_phone', 'check_in', 'check_out',
  'guests', 'total_price', 'status',
] as const;

/* ===================== PROPERTIES ===================== */

export async function listPublishedProperties(): Promise<Property[]> {
  const rows = await query(
    `SELECT * FROM properties WHERE status = 'published' ORDER BY rating DESC, created_at DESC`,
  );
  return rows.map(mapProperty);
}

export async function listAllProperties(): Promise<Property[]> {
  const rows = await query(`SELECT * FROM properties ORDER BY created_at DESC`);
  return rows.map(mapProperty);
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  if (!isUuid(id)) return undefined;
  const rows = await query(`SELECT * FROM properties WHERE id = $1`, [id]);
  return rows[0] ? mapProperty(rows[0]) : undefined;
}

export async function listPropertiesBySlug(slug: string): Promise<Property | undefined> {
  const rows = await query(`SELECT * FROM properties WHERE slug = $1`, [slug]);
  return rows[0] ? mapProperty(rows[0]) : undefined;
}

export async function createProperty(
  input: Omit<Property, 'id' | 'created_at' | 'rating' | 'status'> & Partial<Pick<Property, 'rating' | 'status' | 'sqm'>>,
): Promise<Property> {
  const rows = await query(
    `INSERT INTO properties
       (title, slug, collection, description, price_per_night, max_guests, bedrooms, bathrooms,
        sqm, amenities, images, location, lat, lng, status, rating)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      input.title, input.slug, input.collection, input.description, input.price_per_night,
      input.max_guests, input.bedrooms, input.bathrooms, input.sqm ?? null, input.amenities,
      input.images, input.location, input.lat, input.lng, input.status ?? 'published',
      input.rating ?? 0,
    ],
  );
  return mapProperty(rows[0]);
}

export async function updateProperty(id: string, patch: Partial<Property>): Promise<Property | undefined> {
  if (!isUuid(id)) return undefined;
  const update = buildUpdate(patch, PROPERTY_COLUMNS);
  if (!update) return getPropertyById(id);

  const rows = await query(
    `UPDATE properties SET ${update.clause} WHERE id = $${update.values.length + 1} RETURNING *`,
    [...update.values, id],
  );
  return rows[0] ? mapProperty(rows[0]) : undefined;
}

export async function deleteProperty(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = await query(`DELETE FROM properties WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

/* ===================== BOOKINGS ===================== */

export async function listBookings(): Promise<Booking[]> {
  const rows = await query(`SELECT * FROM bookings ORDER BY created_at DESC`);
  return rows.map(mapBooking);
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
  if (!isUuid(id)) return undefined;
  const rows = await query(`SELECT * FROM bookings WHERE id = $1`, [id]);
  return rows[0] ? mapBooking(rows[0]) : undefined;
}

export async function createBooking(
  input: Omit<Booking, 'id' | 'created_at' | 'status'> & Partial<Pick<Booking, 'status'>>,
): Promise<Booking> {
  const rows = await query(
    `INSERT INTO bookings
       (property_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, total_price, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      isUuid(input.property_id) ? input.property_id : null,
      input.guest_name, input.guest_email, input.guest_phone ?? null,
      input.check_in ?? null, input.check_out ?? null, input.guests,
      input.total_price ?? null, input.status ?? 'pending',
    ],
  );
  return mapBooking(rows[0]);
}

export async function updateBooking(id: string, patch: Partial<Booking>): Promise<Booking | undefined> {
  if (!isUuid(id)) return undefined;
  const update = buildUpdate(patch, BOOKING_COLUMNS);
  if (!update) return getBookingById(id);

  const rows = await query(
    `UPDATE bookings SET ${update.clause} WHERE id = $${update.values.length + 1} RETURNING *`,
    [...update.values, id],
  );
  return rows[0] ? mapBooking(rows[0]) : undefined;
}

export async function deleteBooking(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = await query(`DELETE FROM bookings WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

/* ===================== REVIEWS ===================== */

export async function listApprovedReviews(propertyId?: string): Promise<Review[]> {
  const filter = propertyId ? (isUuid(propertyId) ? propertyId : null) : null;
  if (propertyId && !filter) return [];
  const rows = await query(
    `SELECT * FROM reviews
     WHERE approved = true AND ($1::uuid IS NULL OR property_id = $1::uuid)
     ORDER BY created_at DESC`,
    [filter],
  );
  return rows.map(mapReview);
}

export async function listAllReviews(): Promise<Review[]> {
  const rows = await query(`SELECT * FROM reviews ORDER BY created_at DESC`);
  return rows.map(mapReview);
}

export async function createReview(
  input: Omit<Review, 'id' | 'created_at' | 'approved'> & Partial<Pick<Review, 'approved'>>,
): Promise<Review> {
  if (!isUuid(input.property_id)) throw new Error('A valid property_id is required.');
  const rows = await query(
    `INSERT INTO reviews (property_id, guest_name, rating, comment, approved)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [input.property_id, input.guest_name, input.rating, input.comment ?? null, input.approved ?? false],
  );
  return mapReview(rows[0]);
}

export async function approveReview(id: string): Promise<Review | undefined> {
  if (!isUuid(id)) return undefined;
  const rows = await query(`UPDATE reviews SET approved = true WHERE id = $1 RETURNING *`, [id]);
  return rows[0] ? mapReview(rows[0]) : undefined;
}

export async function deleteReview(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = await query(`DELETE FROM reviews WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

/* ===================== CONTACT MESSAGES ===================== */

export async function listContactMessages(): Promise<ContactMessage[]> {
  const rows = await query(`SELECT * FROM contact_messages ORDER BY created_at DESC`);
  return rows.map(mapContactMessage);
}

export async function createContactMessage(
  input: Omit<ContactMessage, 'id' | 'created_at' | 'source' | 'status'> &
    Partial<Pick<ContactMessage, 'source' | 'status'>>,
): Promise<ContactMessage> {
  const rows = await query(
    `INSERT INTO contact_messages (name, email, phone, subject, message, source, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      input.name, input.email, input.phone ?? null, input.subject ?? null, input.message,
      input.source ?? 'website', input.status ?? 'new',
    ],
  );
  return mapContactMessage(rows[0]);
}

export async function updateContactStatus(id: string, status: ContactStatus): Promise<ContactMessage | undefined> {
  if (!isUuid(id)) return undefined;
  const rows = await query(`UPDATE contact_messages SET status = $1 WHERE id = $2 RETURNING *`, [status, id]);
  return rows[0] ? mapContactMessage(rows[0]) : undefined;
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = await query(`DELETE FROM contact_messages WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

/* ===================== ADMINS & SESSIONS ===================== */

export async function getAdminByEmail(email: string): Promise<Admin | undefined> {
  const rows = await query(`SELECT * FROM admins WHERE lower(email) = lower($1)`, [email]);
  return rows[0] ? mapAdmin(rows[0]) : undefined;
}

export async function getAdminById(id: string): Promise<Admin | undefined> {
  if (!isUuid(id)) return undefined;
  const rows = await query(`SELECT * FROM admins WHERE id = $1`, [id]);
  return rows[0] ? mapAdmin(rows[0]) : undefined;
}

export async function updateAdminPassword(id: string, passwordHash: string): Promise<Admin | undefined> {
  if (!isUuid(id)) return undefined;
  const rows = await query(`UPDATE admins SET password_hash = $1 WHERE id = $2 RETURNING *`, [passwordHash, id]);
  return rows[0] ? mapAdmin(rows[0]) : undefined;
}

export async function updateAdminTotp(id: string, totpSecret: string): Promise<Admin | undefined> {
  if (!isUuid(id)) return undefined;
  const rows = await query(`UPDATE admins SET totp_secret = $1 WHERE id = $2 RETURNING *`, [totpSecret, id]);
  return rows[0] ? mapAdmin(rows[0]) : undefined;
}

export async function createAdminSession(input: Omit<AdminSession, 'id' | 'created_at'>): Promise<AdminSession> {
  const rows = await query(
    `INSERT INTO admin_sessions (admin_id, token_hash, expires_at) VALUES ($1,$2,$3) RETURNING *`,
    [input.admin_id, input.token_hash, input.expires_at],
  );
  return mapAdminSession(rows[0]);
}

export async function getAdminSessionByTokenHash(tokenHash: string): Promise<AdminSession | undefined> {
  const rows = await query(`SELECT * FROM admin_sessions WHERE token_hash = $1`, [tokenHash]);
  return rows[0] ? mapAdminSession(rows[0]) : undefined;
}

export async function revokeAdminSession(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = await query(`DELETE FROM admin_sessions WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

export async function pruneExpiredAdminSessions(): Promise<void> {
  await query(`DELETE FROM admin_sessions WHERE expires_at <= now()`);
}
