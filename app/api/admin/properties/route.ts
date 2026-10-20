import { NextRequest, NextResponse } from 'next/server';
import {
  createProperty,
  deleteProperty,
  getPropertyById,
  listAllProperties,
  updateProperty,
  type Collection,
} from '@/lib/db';

const collectionMap: Record<string, Collection> = {
  city: 'city',
  countryside: 'countryside',
  beach: 'beach',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const one = await getPropertyById(id);
      return NextResponse.json(one ?? null);
    }
    const rows = await listAllProperties();
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Could not list properties.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const collection = collectionMap[String(body.collection ?? 'city')] ?? 'city';
    const created = await createProperty({
      title: String(body.title ?? 'Untitled').trim(),
      slug:
        String(body.slug ?? String(body.title ?? 'property').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim() ||
        'property-' + Math.random().toString(36).slice(2, 8),
      collection,
      description: String(body.description ?? '').trim(),
      price_per_night: Number.isFinite(Number(body.price_per_night)) ? Math.max(0, Number(body.price_per_night)) : 0,
      max_guests: Number.isFinite(Number(body.max_guests)) ? Math.max(1, Number(body.max_guests)) : 2,
      bedrooms: Number.isFinite(Number(body.bedrooms)) ? Math.max(1, Number(body.bedrooms)) : 1,
      bathrooms: Number.isFinite(Number(body.bathrooms)) ? Math.max(1, Number(body.bathrooms)) : 1,
      sqm: body.sqm === null || body.sqm === '' ? null : Number.isFinite(Number(body.sqm)) ? Number(body.sqm) : null,
      amenities: Array.isArray(body.amenities) ? body.amenities.map((a: unknown) => String(a)) : [],
      images: Array.isArray(body.images) ? body.images.map((a: unknown) => String(a)) : [],
      location: typeof body.location === 'string' ? body.location.trim() : '',
      lat: Number.isFinite(Number(body.lat)) ? Number(body.lat) : null,
      lng: Number.isFinite(Number(body.lng)) ? Number(body.lng) : null,
      rating: Number.isFinite(Number(body.rating)) ? Number(body.rating) : 0,
      status: body.status === 'draft' ? 'draft' : 'published',
    });
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: 'Could not create property.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id ?? '').trim();
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
    const existing = await getPropertyById(id);
    if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const patch: Record<string, unknown> = {};
    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim();
    if (typeof body.slug === 'string' && body.slug.trim()) patch.slug = body.slug.trim();
    if (typeof body.collection === 'string' && collectionMap[body.collection]) patch.collection = collectionMap[body.collection];
    if (typeof body.description === 'string') patch.description = body.description;
    if (Number.isFinite(Number(body.price_per_night))) patch.price_per_night = Math.max(0, Number(body.price_per_night));
    if (Number.isFinite(Number(body.max_guests))) patch.max_guests = Math.max(1, Number(body.max_guests));
    if (Number.isFinite(Number(body.bedrooms))) patch.bedrooms = Math.max(1, Number(body.bedrooms));
    if (Number.isFinite(Number(body.bathrooms))) patch.bathrooms = Math.max(1, Number(body.bathrooms));
    if (body.sqm === null) patch.sqm = null;
    else if (body.sqm !== undefined) {
      if (body.sqm === '') patch.sqm = null;
      else if (Number.isFinite(Number(body.sqm))) patch.sqm = Number(body.sqm);
    }
    if (Array.isArray(body.amenities)) patch.amenities = body.amenities.map((a: unknown) => String(a));
    if (Array.isArray(body.images)) patch.images = body.images.map((a: unknown) => String(a));
    if (typeof body.location === 'string') patch.location = body.location.trim();
    if (body.lat === null) patch.lat = null;
    else if (Number.isFinite(Number(body.lat))) patch.lat = Number(body.lat);
    if (body.lng === null) patch.lng = null;
    else if (Number.isFinite(Number(body.lng))) patch.lng = Number(body.lng);
    if (body.status === 'draft' || body.status === 'published') patch.status = body.status;
    if (Number.isFinite(Number(body.rating))) patch.rating = Number(body.rating);
    const updated = await updateProperty(id, patch);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Could not update.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
    const removed = await deleteProperty(id);
    if (!removed) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete.' }, { status: 500 });
  }
}
