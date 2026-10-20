import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';
import { getPropertyById, updateProperty } from '@/lib/db';

const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads', 'properties');

function sanitize(name: string): string {
  const ext = path.extname(name).toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 6);
  const base = path.basename(name, path.extname(name))
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
    .replace(/^-|-$/g, '');
  return `${base || 'image'}-${randomBytes(4).toString('hex')}${ext || '.jpg'}`;
}

async function parseMultipart(body: Body, boundary: string) {
  const buffer = Buffer.from(await (body as any).arrayBuffer());
  const sections = buffer.toString('binary').split(`--${boundary}`);
  const files: { fieldname: string; filename: string; mime: string; data: Buffer }[] = [];
  for (const section of sections) {
    if (!section.includes('filename=')) continue;
    const headerMatch = section.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)";\s*filename="([^"]+)"[\s\S]*?Content-Type:\s*([^\r\n]+)/i);
    if (!headerMatch) continue;
    const [, fieldname, filename, mime] = headerMatch;
    const dataStart = section.indexOf('\r\n\r\n');
    const dataEnd = section.lastIndexOf('\r\n');
    if (dataStart === -1 || dataEnd === -1 || dataEnd <= dataStart) continue;
    const rawBytes = Buffer.from(section.slice(dataStart + 4, dataEnd), 'binary');
    files.push({ fieldname, filename, mime: mime.trim(), data: rawBytes });
  }
  return files;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      return NextResponse.json({ error: 'Missing multipart boundary.' }, { status: 400 });
    }
    const boundary = boundaryMatch[1];
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    const files = await parseMultipart(request.body as unknown as Body, boundary);
    if (!files.length) return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });

    const saved: string[] = [];
    for (const file of files) {
      if (!file.mime.startsWith('image/')) continue;
      const safe = sanitize(file.filename);
      const dir = propertyId ? path.join(UPLOAD_DIR, propertyId) : UPLOAD_DIR;
      await mkdir(dir, { recursive: true });
      const fullPath = path.join(dir, safe);
      await writeFile(fullPath, file.data);
      const publicUrl = propertyId
        ? `/uploads/properties/${encodeURIComponent(propertyId)}/${encodeURIComponent(safe)}`
        : `/uploads/properties/${encodeURIComponent(safe)}`;
      saved.push(publicUrl);
    }

    if (propertyId && saved.length > 0) {
      const existing = await getPropertyById(propertyId);
      if (existing) {
        const merged = [...(existing.images || []), ...saved];
        await updateProperty(propertyId, { images: merged });
      }
    }

    return NextResponse.json({ ok: true, urls: saved });
  } catch {
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
