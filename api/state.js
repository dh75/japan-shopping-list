import { put, list } from '@vercel/blob';
import { createHash } from 'crypto';

// Per-user state for the public service.
// The page sends the Google ID token (Google Identity Services) as
// Authorization: Bearer <id_token>. The token is verified with Google,
// and the state lives in a per-user blob users/<hash>/state.json.
// Without a token the API answers 401 and the page falls back to
// localStorage-only mode.

const TOKEN = process.env.STATE_READ_WRITE_TOKEN;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

function defaultState() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    deleted: [],
    saved: [],
    // Purchased items: snapshots { id, name, price?, image?, store?, purchasedDate? }
    // so the separate purchased page can render them without the catalog.
    // The page sends/reads this list under the name `bought`; the API keeps
    // both names in sync (same array) so either name works.
    purchased: [],
    bought: [],
    // Activity history: { type, id, name, at } where type is a short action
    // name such as saved / unsaved / deleted / restored / purchased / unpurchased.
    // Newest entries are at the end; the server keeps the newest 500.
    history: [],
  };
}

function normalizeHistoryEntry(e) {
  const out = { type: e.type, id: e.id, name: e.name, at: e.at };
  return out;
}

function normalizePurchasedEntry(e) {
  // Accept a plain id string as well as { id, name, ... }.
  if (typeof e === 'string') return { id: e, name: e };
  const out = { id: e.id, name: typeof e.name === 'string' && e.name ? e.name : e.id };
  for (const k of ['price', 'image', 'store', 'purchasedDate']) {
    if (typeof e[k] === 'string' && e[k]) out[k] = e[k];
  }
  // The page may carry the purchase date under another field name.
  if (!out.purchasedDate) {
    for (const k of ['date', 'boughtAt', 'purchasedAt']) {
      if (typeof e[k] === 'string' && e[k]) { out.purchasedDate = e[k]; break; }
    }
  }
  return out;
}

function isValidState(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (!Array.isArray(body.deleted) || !Array.isArray(body.saved)) return false;
  // purchased / bought are optional for old clients; when present each must
  // be an array. Entries may be plain id strings or { id, name, ... }.
  if (body.purchased !== undefined && !Array.isArray(body.purchased)) return false;
  if (body.bought !== undefined && !Array.isArray(body.bought)) return false;
  // history is optional for old clients; when present it must be an array.
  // Validation is intentionally loose on the action type so the page can
  // add new action names without breaking sync.
  if (body.history !== undefined && !Array.isArray(body.history)) return false;
  const okEntry = (e) =>
    e && typeof e === 'object' && typeof e.id === 'string' && typeof e.name === 'string';
  const okPurchasedEntry = (e) =>
    typeof e === 'string' ||
    (e && typeof e === 'object' && typeof e.id === 'string');
  const okHistoryEntry = (e) =>
    e && typeof e === 'object' && typeof e.type === 'string' && typeof e.id === 'string' &&
    typeof e.name === 'string' && typeof e.at === 'string';
  const purchasedOk =
    (!Array.isArray(body.purchased) || body.purchased.every(okPurchasedEntry)) &&
    (!Array.isArray(body.bought) || body.bought.every(okPurchasedEntry));
  const historyOk = !Array.isArray(body.history) || body.history.every(okHistoryEntry);
  return body.deleted.every(okEntry) && body.saved.every(okEntry) && purchasedOk && historyOk;
}

// Verify a Google ID token and return the user's opaque subject id (sub),
// or null when the token is missing/invalid. The blob key is a hash of the
// sub so the stored path reveals neither the sub nor the user's identity.
async function verifyGoogleToken(req) {
  const auth = req.headers.authorization || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const idToken = match[1];
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const claims = await res.json();
    if (CLIENT_ID && claims.aud !== CLIENT_ID) return null;
    if (!claims.sub) return null;
    if (claims.exp && Number(claims.exp) * 1000 < Date.now()) return null;
    if (claims.iss !== 'https://accounts.google.com' && claims.iss !== 'accounts.google.com')
      return null;
    return String(claims.sub);
  } catch (e) {
    return null;
  }
}

function blobPathFor(sub) {
  const hash = createHash('sha256')
    .update(`${sub}:${TOKEN || 'no-token'}`)
    .digest('hex')
    .slice(0, 32);
  return `users/${hash}/state.json`;
}

async function readState(blobPath) {
  try {
    const { blobs } = await list({ prefix: blobPath, limit: 1, token: TOKEN });
    const blob = blobs.find((b) => b.pathname === blobPath);
    if (!blob) return null;
    // Blob CDN caches by URL; always use a fresh query so a just-overwritten
    // blob is read from origin instead of a cached copy.
    const res = await fetch(`${blob.url}?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  const sub = await verifyGoogleToken(req);
  if (!sub) {
    return res.status(401).json({ error: 'login required' });
  }
  const blobPath = blobPathFor(sub);

  if (req.method === 'GET') {
    const state = await readState(blobPath);
    if (!state) {
      const fresh = defaultState();
      return res.status(200).json({ ...fresh, _source: 'default' });
    }
    // Merge over defaults so old stored states gain the purchased field.
    // Keep both purchased/bought names in sync in every response.
    const merged = { ...defaultState(), ...state };
    merged.purchased = Array.isArray(merged.purchased) ? merged.purchased : [];
    merged.bought = merged.purchased;
    return res.status(200).json({ ...merged, _source: 'blob' });
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'invalid json' });
      }
    }
    if (!isValidState(body)) {
      return res.status(400).json({ error: 'invalid state shape' });
    }
    // Old clients may post without purchased/history; keep the stored lists then.
    // The page sends the purchased list as `bought`; union both names by id.
    let purchased = [];
    let history = [];
    const incomingPurchased = [];
    if (Array.isArray(body.purchased)) incomingPurchased.push(...body.purchased);
    if (Array.isArray(body.bought)) incomingPurchased.push(...body.bought);
    if (incomingPurchased.length) {
      const seen = new Set();
      purchased = incomingPurchased
        .map(normalizePurchasedEntry)
        .filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        })
        .slice(0, 1000);
    } else {
      const existing = await readState(blobPath);
      if (existing && Array.isArray(existing.purchased)) purchased = existing.purchased;
      else if (existing && Array.isArray(existing.bought)) purchased = existing.bought;
    }
    if (Array.isArray(body.history)) {
      history = body.history;
    } else {
      const existing = await readState(blobPath);
      if (existing && Array.isArray(existing.history)) history = existing.history;
    }
    const state = {
      version: 1,
      updatedAt: new Date().toISOString(),
      deleted: body.deleted.slice(0, 1000),
      saved: body.saved.slice(0, 1000),
      purchased,
      bought: purchased,
      // Keep only the newest 500 history entries.
      history: history.slice(-500).map(normalizeHistoryEntry),
    };
    try {
      await put(blobPath, JSON.stringify(state), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        token: TOKEN,
      });
    } catch (e) {
      return res.status(500).json({ error: 'blob write failed', detail: String(e && e.message ? e.message : e) });
    }
    return res.status(200).json({ ...state, _source: 'blob' });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
