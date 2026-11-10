import { put, list, head } from '@vercel/blob';

const BLOB_PATH = 'state.json';

function defaultState() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    deleted: [],
    saved: [],
  };
}

function isValidState(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (!Array.isArray(body.deleted) || !Array.isArray(body.saved)) return false;
  const okEntry = (e) =>
    e && typeof e === 'object' && typeof e.id === 'string' && typeof e.name === 'string';
  return body.deleted.every(okEntry) && body.saved.every(okEntry);
}

async function readState() {
  try {
    const { blobs } = await list({
      prefix: BLOB_PATH,
      limit: 1,
      token: process.env.STATE_READ_WRITE_TOKEN,
    });
    const blob = blobs.find((b) => b.pathname === BLOB_PATH);
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

  if (req.method === 'GET') {
    const state = await readState();
    if (!state) {
      const fresh = defaultState();
      return res.status(200).json({ ...fresh, _source: 'default' });
    }
    return res.status(200).json({ ...state, _source: 'blob' });
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
    const state = {
      version: 1,
      updatedAt: new Date().toISOString(),
      deleted: body.deleted.slice(0, 1000),
      saved: body.saved.slice(0, 1000),
    };
    try {
      await put(BLOB_PATH, JSON.stringify(state), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        token: process.env.STATE_READ_WRITE_TOKEN,
      });
    } catch (e) {
      return res.status(500).json({ error: 'blob write failed', detail: String(e && e.message ? e.message : e) });
    }
    return res.status(200).json({ ...state, _source: 'blob' });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
