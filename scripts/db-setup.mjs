/**
 * Makao254 — database setup: applies db/schema.sql then seeds sample data.
 * Idempotent: safe to run repeatedly.
 *
 *   npm run db:setup
 *
 * Requires DATABASE_URL (read from the environment or from .env).
 */
import { readFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Minimal .env loader so the script works without extra dependencies.
function loadEnv() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, '');
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}
loadEnv();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Add it to .env (see .env.example).');
  process.exit(1);
}

const isLocal = /(localhost|127\.0\.0\.1)/.test(connectionString);
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

const properties = [
  {
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
    rating: 4.92,
  },
  {
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
    rating: 4.78,
  },
  {
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
    rating: 4.97,
  },
  {
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
    rating: 4.99,
  },
  {
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
    rating: 4.89,
  },
  {
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
    rating: 4.84,
  },
];

const reviews = [
  {
    slug: 'the-lavington-loft',
    guest_name: 'Amina K.',
    rating: 5,
    comment:
      'The Lavington Loft is exactly as described — the rooftop view alone is worth it. Everything was beautifully considered, from the kitchen supplies to the welcome booklet on Kenyan coffee.',
  },
  {
    slug: 'diani-drift-villa',
    guest_name: 'Wanjiru M.',
    rating: 5,
    comment:
      'Spent four days at Diani Drift. The chef made incredible Swahili breakfasts, and the infinity pool feels almost connected to the sea. We will be back.',
  },
];

/** RFC 4648 base32 (no padding) — the format TOTP authenticator apps expect. */
function toBase32(buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

const pool = new Pool({
  connectionString,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
  max: 3,
});

async function main() {
  console.log(`→ Connecting to ${isLocal ? 'local' : 'remote'} PostgreSQL...`);

  await pool.query(readFileSync(join(root, 'db', 'schema.sql'), 'utf8'));
  console.log('✓ Schema applied (db/schema.sql)');

  let inserted = 0;
  for (const p of properties) {
    const res = await pool.query(
      `INSERT INTO properties
         (title, slug, collection, description, price_per_night, max_guests, bedrooms, bathrooms,
          sqm, amenities, images, location, lat, lng, status, rating)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'published',$15)
       ON CONFLICT (slug) DO NOTHING`,
      [
        p.title, p.slug, p.collection, p.description, p.price_per_night, p.max_guests, p.bedrooms,
        p.bathrooms, p.sqm, p.amenities, p.images, p.location, p.lat, p.lng, p.rating,
      ],
    );
    inserted += res.rowCount ?? 0;
  }
  console.log(`✓ Properties seeded (${inserted} new, ${properties.length - inserted} already present)`);

  const { rows: reviewCount } = await pool.query('SELECT count(*)::int AS n FROM reviews');
  if (reviewCount[0].n === 0) {
    for (const r of reviews) {
      await pool.query(
        `INSERT INTO reviews (property_id, guest_name, rating, comment, approved)
         SELECT id, $2, $3, $4, true FROM properties WHERE slug = $1`,
        [r.slug, r.guest_name, r.rating, r.comment],
      );
    }
    console.log(`✓ Reviews seeded (${reviews.length})`);
  } else {
    console.log('• Reviews already present, skipping');
  }

  const email = process.env.ADMIN_SEED_EMAIL || 'admin@makao254.com';
  const password = process.env.ADMIN_SEED_PASSWORD || 'Makao254!Secure';
  const passwordHash = await bcrypt.hash(password, 10);
  const totpSecret = toBase32(randomBytes(20));
  const { rows: adminRows } = await pool.query(
    `INSERT INTO admins (email, password_hash, role, totp_secret)
     VALUES ($1, $2, 'admin', $3)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [email, passwordHash, totpSecret],
  );

  if (adminRows.length) {
    const issuer = encodeURIComponent('Makao254');
    const label = encodeURIComponent(`Makao254:${email}`);
    console.log('\n✓ Admin created — store these now, the TOTP secret is shown only once:');
    console.log(`   email     : ${email}`);
    console.log(`   password  : ${password}`);
    console.log(`   TOTP secret: ${totpSecret}`);
    console.log(`   otpauth URI: otpauth://totp/${label}?secret=${totpSecret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`);
  } else {
    console.log(`• Admin ${email} already exists, skipping`);
  }
}

try {
  await main();
  console.log('\nDatabase is ready.');
} catch (error) {
  console.error('\nSetup failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
