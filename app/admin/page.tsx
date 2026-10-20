'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CheckCircle2,
  Eye,
  LogOut,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

type TabKey = 'properties' | 'bookings' | 'contacts' | 'reviews' | 'account';

type Property = {
  id: string;
  title: string;
  slug: string;
  collection: 'city' | 'countryside' | 'beach';
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
  status: 'draft' | 'published';
  rating: number;
  created_at: string;
};

type Booking = {
  id: string;
  property_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  total_price: number | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
};

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
};

type Review = {
  id: string;
  property_id: string;
  guest_name: string;
  rating: number;
  comment: string | null;
  approved: boolean;
  created_at: string;
};

type AuthState =
  | { mode: 'loading' }
  | { mode: 'login' }
  | { mode: 'mfa'; email: string }
  | { mode: 'dashboard'; role: string; email: string };

const tabs: { key: TabKey; label: string; icon: typeof Settings }[] = [
  { key: 'properties', label: 'Properties', icon: BedDouble },
  { key: 'bookings', label: 'Bookings', icon: CheckCircle2 },
  { key: 'contacts', label: 'Contact', icon: XCircle },
  { key: 'reviews', label: 'Reviews', icon: Star },
  { key: 'account', label: 'Account', icon: ShieldCheck },
];

const emptyProperty = (): Property => ({
  id: '',
  title: '',
  slug: '',
  collection: 'city',
  description: '',
  price_per_night: 0,
  max_guests: 2,
  bedrooms: 1,
  bathrooms: 1,
  sqm: null,
  amenities: [],
  images: [],
  location: '',
  lat: null,
  lng: null,
  status: 'published',
  rating: 0,
  created_at: new Date().toISOString(),
});

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [auth, setAuth] = useState<AuthState>({ mode: 'loading' });
  const [notice, setNotice] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [tab, setTab] = useState<TabKey>('properties');
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me', { cache: 'no-store' });
        const data = await res.json();
        if (data.authenticated) {
          setAuth({ mode: 'dashboard', role: data.role || 'admin', email: data.email });
          if (redirect) router.replace(redirect);
        } else {
          setAuth({ mode: 'login' });
        }
      } catch {
        setAuth({ mode: 'login' });
      }
    })();
  }, [redirect, router]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setNotice('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');
      setAuth({ mode: 'mfa', email: data.email });
    } catch (err: any) {
      setNotice(err.message || 'Login failed.');
    }
  };

  const handleMfa = async (e: FormEvent) => {
    e.preventDefault();
    setNotice('');
    try {
      const res = await fetch('/api/admin/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: auth.mode === 'mfa' ? auth.email : '', code: mfaCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code.');
      setAuth({ mode: 'dashboard', role: data.role, email: auth.mode === 'mfa' ? auth.email : '' });
    } catch (err: any) {
      setNotice(err.message || 'MFA failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/me', { method: 'POST' });
    } catch {}
    setAuth({ mode: 'login' });
    setNotice('Signed out.');
  };

  if (auth.mode === 'loading') return <AdminShell><div className="admin-center">Loading…</div></AdminShell>;

  if (auth.mode !== 'dashboard') {
    return (
      <AdminShell>
        <div className="admin-auth">
          <div className="admin-auth-card">
            <div className="admin-auth-brand"><span className="brand-mark">M</span><h2>Makao<span>254</span> Admin</h2></div>
            {notice && <div className="admin-notice error">{notice}</div>}
            {auth.mode === 'login' ? (
              <form className="admin-form" onSubmit={handleLogin}>
                <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@makao254.com" /></label>
                <label>Password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></label>
                <button type="submit" className="admin-btn primary">Continue <ArrowRight size={16} /></button>
                <small className="admin-hint">Seed credentials from ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD in .env</small>
              </form>
            ) : (
              <form className="admin-form" onSubmit={handleMfa}>
                <button type="button" className="admin-back" onClick={() => setAuth({ mode: 'login' })}><ArrowLeft size={14} /> Back to login</button>
                <p className="admin-sub">Enter the 6-digit code from your authenticator app for <b>{auth.email}</b>.</p>
                <label>Verification code<input required inputMode="numeric" pattern="\d{6}" maxLength={6} value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" /></label>
                <button type="submit" className="admin-btn primary">Verify &amp; sign in</button>
              </form>
            )}
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="admin-dashboard">
        <aside className="admin-sidebar">
          <div className="admin-brand-row">
            <span className="brand-mark">M</span>
            <div>
              <strong>Makao254</strong>
              <small>{auth.email}</small>
            </div>
          </div>
          <nav className="admin-tabs">
            {tabs.map((t) => (
              <button key={t.key} className={tab === t.key ? 'admin-tab active' : 'admin-tab'} onClick={() => setTab(t.key)}>
                <t.icon size={17} /> <span>{t.label}</span>
              </button>
            ))}
          </nav>
          <button className="admin-logout" onClick={handleLogout}><LogOut size={16} /> Sign out</button>
        </aside>
        <main className="admin-main">
          {tab === 'properties' && <PropertiesPanel />}
          {tab === 'bookings' && <BookingsPanel />}
          {tab === 'contacts' && <ContactsPanel />}
          {tab === 'reviews' && <ReviewsPanel />}
          {tab === 'account' && <AccountPanel email={auth.email} />}
        </main>
      </div>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return <div className="admin-shell">{children}</div>;
}

/* ================ PROPERTIES ================ */

function PropertiesPanel() {
  const [rows, setRows] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Property>(emptyProperty());
  const [uploadBusy, setUploadBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/properties');
      setRows(res.ok ? await res.json() : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(emptyProperty()); setEditorOpen(true); };
  const openEdit = (p: Property) => { setEditing({ ...p, amenities: [...(p.amenities || [])], images: [...(p.images || [])] }); setEditorOpen(true); };

  const remove = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/properties?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    load();
  };

  const saveProperty = async () => {
    const payload = { ...editing, id: editing.id || undefined };
    if (!payload.id) delete (payload as any).id;
    const res = await fetch('/api/admin/properties', {
      method: payload.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setEditorOpen(false);
      load();
    } else {
      alert('Could not save property.');
    }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadBusy(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f, i) => fd.append(`image_${i}`, f));
      const url = editing.id ? `/api/admin/upload?property_id=${encodeURIComponent(editing.id)}` : '/api/admin/upload';
      const res = await fetch(url, { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.urls?.length) {
        setEditing((e) => ({ ...e, images: [...(e.images || []), ...data.urls] }));
        if (!editing.id && data.urls[0]) {
          // keep in images array; after first save they will be linked
        }
      }
    } finally {
      setUploadBusy(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Properties</h1>
          <small>{rows.length} total</small>
        </div>
        <button className="admin-btn primary" onClick={openCreate}><Plus size={16} /> New property</button>
      </div>
      <div className="table-wrap">
        {loading ? <p className="panel-loading">Loading…</p> : (
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Location</th><th>Type</th><th>Price/night</th><th>Rating</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.title}</b><div className="muted">#{p.slug}</div></td>
                  <td>{p.location || '—'}</td>
                  <td><span className="chip">{p.collection}</span></td>
                  <td>KES {p.price_per_night?.toLocaleString()}</td>
                  <td>{p.rating?.toFixed?.(1) ?? '—'}</td>
                  <td><span className={`pill ${p.status}`}>{p.status}</span></td>
                  <td className="row-actions">
                    <button className="icon-btn" onClick={() => window.open(`/properties/${p.slug}`, '_blank')} title="Preview"><Eye size={15} /></button>
                    <button className="icon-btn" onClick={() => openEdit(p)} title="Edit"><Save size={15} /></button>
                    <button className="icon-btn danger" onClick={() => remove(p.id, p.title)} title="Delete"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7}><p className="panel-empty">No properties yet.</p></td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {editorOpen && (
        <div className="modal" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditorOpen(false); }}>
          <div className="modal-card wide">
            <div className="modal-head"><h2>{editing.id ? 'Edit property' : 'New property'}</h2><button className="icon-btn" onClick={() => setEditorOpen(false)}><X size={16} /></button></div>
            <div className="modal-body grid-2">
              <label>Title<input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label>
              <label>Slug<input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></label>
              <label>Location<input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></label>
              <label>Collection
                <select value={editing.collection} onChange={(e) => setEditing({ ...editing, collection: e.target.value as any })}>
                  <option value="city">City</option><option value="countryside">Countryside</option><option value="beach">Beach</option>
                </select>
              </label>
              <label>Price (KES)<input type="number" min={0} value={editing.price_per_night} onChange={(e) => setEditing({ ...editing, price_per_night: Number(e.target.value) })} /></label>
              <label>Rating<input type="number" step="0.01" min={0} max={5} value={editing.rating} onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })} /></label>
              <label>Bedrooms<input type="number" min={1} value={editing.bedrooms} onChange={(e) => setEditing({ ...editing, bedrooms: Number(e.target.value) })} /></label>
              <label>Bathrooms<input type="number" min={1} value={editing.bathrooms} onChange={(e) => setEditing({ ...editing, bathrooms: Number(e.target.value) })} /></label>
              <label>Max guests<input type="number" min={1} value={editing.max_guests} onChange={(e) => setEditing({ ...editing, max_guests: Number(e.target.value) })} /></label>
              <label>Sq m (optional)<input type="number" value={editing.sqm ?? ''} onChange={(e) => setEditing({ ...editing, sqm: e.target.value === '' ? null : Number(e.target.value) })} /></label>
              <label>Latitude<input type="number" step="0.0001" value={editing.lat ?? ''} onChange={(e) => setEditing({ ...editing, lat: e.target.value === '' ? null : Number(e.target.value) })} /></label>
              <label>Longitude<input type="number" step="0.0001" value={editing.lng ?? ''} onChange={(e) => setEditing({ ...editing, lng: e.target.value === '' ? null : Number(e.target.value) })} /></label>
              <label className="full">Amenities (comma separated)
                <input value={(editing.amenities || []).join(', ')} onChange={(e) => setEditing({ ...editing, amenities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
              </label>
              <label className="full">Description<textarea rows={4} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>
              <label className="full">Status
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}>
                  <option value="published">Published</option><option value="draft">Draft</option>
                </select>
              </label>
              <div className="full">
                <div className="uploader">
                  <label className="admin-btn ghost"><Upload size={16} /> {uploadBusy ? 'Uploading…' : 'Upload images'}
                    <input type="file" multiple accept="image/*" hidden disabled={uploadBusy} onChange={(e) => uploadImages(e.target.files)} />
                  </label>
                  <small>{editing.images?.length || 0} images saved (show below)</small>
                </div>
                <div className="image-grid">
                  {(editing.images || []).map((src, i) => (
                    <div className="thumb" key={src + i}>
                      <img src={src} alt="" />
                      <button className="icon-btn small danger" onClick={() => setEditing({ ...editing, images: editing.images.filter((_, idx) => idx !== i) })}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="admin-btn ghost" onClick={() => setEditorOpen(false)}>Cancel</button>
              <button className="admin-btn primary" onClick={saveProperty}><Save size={16} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================ BOOKINGS ================ */

function BookingsPanel() {
  const [rows, setRows] = useState<Booking[]>([]);
  const load = async () => setRows(await fetch('/api/admin/bookings').then((r) => r.ok ? r.json() : []));
  useEffect(() => { load(); }, []);
  const setStatus = async (id: string, status: Booking['status']) => {
    await fetch('/api/admin/bookings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    load();
  };
  const remove = async (id: string) => { if (!confirm('Delete this booking?')) return; await fetch(`/api/admin/bookings?id=${id}`, { method: 'DELETE' }); load(); };
  return (
    <div className="panel">
      <div className="panel-head"><div><h1>Bookings</h1><small>{rows.length}</small></div></div>
      <div className="table-wrap">
        <table className="admin-table"><thead><tr><th>Guest</th><th>Property</th><th>Dates</th><th>Guests</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td><b>{b.guest_name}</b><div className="muted">{b.guest_email}</div></td>
                <td className="muted">{b.property_id ?? '—'}</td>
                <td>{b.check_in || '—'} → {b.check_out || '—'}</td>
                <td>{b.guests}</td>
                <td>
                  <select className={`pill ${b.status}`} value={b.status} onChange={(e) => setStatus(b.id, e.target.value as any)}>
                    <option value="pending">pending</option><option value="confirmed">confirmed</option><option value="cancelled">cancelled</option>
                  </select>
                </td>
                <td className="row-actions"><button className="icon-btn danger" onClick={() => remove(b.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6}><p className="panel-empty">No bookings yet.</p></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================ CONTACTS ================ */

function ContactsPanel() {
  const [rows, setRows] = useState<Contact[]>([]);
  const load = async () => setRows(await fetch('/api/admin/contacts').then((r) => r.ok ? r.json() : []));
  useEffect(() => { load(); }, []);
  const setStatus = async (id: string, status: Contact['status']) => {
    await fetch('/api/admin/contacts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    load();
  };
  const remove = async (id: string) => { if (!confirm('Delete message?')) return; await fetch(`/api/admin/contacts?id=${id}`, { method: 'DELETE' }); load(); };
  return (
    <div className="panel">
      <div className="panel-head"><div><h1>Contact messages</h1><small>{rows.length}</small></div></div>
      <div className="table-wrap">
        <table className="admin-table"><thead><tr><th>Name</th><th>Message</th><th>Source</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td><b>{m.name}</b><div className="muted">{m.email} {m.phone && `· ${m.phone}`}</div></td>
                <td className="message-cell">{m.subject && <div className="muted"><b>Subject:</b> {m.subject}</div>}{m.message}</td>
                <td><span className="chip">{m.source || 'website'}</span></td>
                <td>
                  <select className={`pill ${m.status}`} value={m.status} onChange={(e) => setStatus(m.id, e.target.value as any)}>
                    <option value="new">new</option><option value="read">read</option><option value="replied">replied</option>
                  </select>
                </td>
                <td className="row-actions"><button className="icon-btn danger" onClick={() => remove(m.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5}><p className="panel-empty">No messages yet.</p></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================ REVIEWS ================ */

function ReviewsPanel() {
  const [rows, setRows] = useState<Review[]>([]);
  const load = async () => setRows(await fetch('/api/admin/reviews').then((r) => r.ok ? r.json() : []));
  useEffect(() => { load(); }, []);
  const approve = async (id: string) => { await fetch('/api/admin/reviews', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'approve' }) }); load(); };
  const remove = async (id: string) => { if (!confirm('Delete review?')) return; await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' }); load(); };
  return (
    <div className="panel">
      <div className="panel-head"><div><h1>Reviews</h1><small>{rows.length}</small></div></div>
      <div className="table-wrap">
        <table className="admin-table"><thead><tr><th>Guest</th><th>Property</th><th>Rating</th><th>Comment</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><b>{r.guest_name}</b></td>
                <td className="muted">{r.property_id}</td>
                <td><span className="rating"><Star size={13} fill="currentColor" /> {r.rating}</span></td>
                <td className="message-cell">{r.comment || '—'}</td>
                <td><span className={`pill ${r.approved ? 'published' : 'draft'}`}>{r.approved ? 'approved' : 'pending'}</span></td>
                <td className="row-actions">
                  {!r.approved && <button className="icon-btn" onClick={() => approve(r.id)} title="Approve"><CheckCircle2 size={15} /></button>}
                  <button className="icon-btn danger" onClick={() => remove(r.id)} title="Delete"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6}><p className="panel-empty">No reviews yet.</p></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================ ACCOUNT ================ */

function AccountPanel({ email }: { email: string }) {
  const [current, setCurrent] = useState('');
  const [nextPw, setNextPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (nextPw !== confirmPw) { setNotice({ type: 'err', text: 'Passwords do not match.' }); return; }
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: nextPw }),
    });
    const data = await res.json();
    if (res.ok) { setNotice({ type: 'ok', text: 'Password updated.' }); setCurrent(''); setNextPw(''); setConfirmPw(''); }
    else setNotice({ type: 'err', text: data.error || 'Could not update.' });
  };
  return (
    <div className="panel narrow">
      <div className="panel-head"><div><h1>Account</h1><small>{email}</small></div></div>
      {notice && <div className={`admin-notice ${notice.type}`}>{notice.text}</div>}
      <form className="admin-form" onSubmit={submit}>
        <label>Current password<input required type="password" value={current} onChange={(e) => setCurrent(e.target.value)} /></label>
        <label>New password<input required type="password" minLength={8} value={nextPw} onChange={(e) => setNextPw(e.target.value)} /></label>
        <label>Confirm new password<input required type="password" minLength={8} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} /></label>
        <button className="admin-btn primary" type="submit"><Save size={16} /> Update password</button>
      </form>
      <div className="account-totp">
        <h3>Two-factor authentication</h3>
        <p className="muted">TOTP is always required for admin access. Scan or re-import the secret into your authenticator app. To regenerate, use the CLI / reset the database entry.</p>
      </div>
    </div>
  );
}
