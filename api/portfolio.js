const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://znzkefmfgqzsvawtwyqb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuemtlZm1mZ3F6c3Zhd3R3eXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzY5NDEsImV4cCI6MjA3Nzc1Mjk0MX0.vI7B6yNoOxVVGVSg2HNqrvdB7BS40y5fx60gHNAZTeE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'HEAD') return res.status(200).end();

  const token = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  let userId = null;
  if (token) {
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (!userErr && userData && userData.user) {
      userId = userData.user.id;
    }
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true, items: data || [] });
    }

    if (req.method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'not_authenticated' });
      const body = await readBody(req);
      const item = body.item || body;
      if (!item.id) item.id = Date.now().toString();
      if (!item.created_at) item.created_at = new Date().toISOString();
      item.user_id = userId;

      const { error } = await supabase.from('portfolio').upsert(item);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true, item });
    }

    if (req.method === 'PUT') {
      if (!userId) return res.status(401).json({ error: 'not_authenticated' });
      const body = await readBody(req);
      const item = body.item || body;
      if (!item || !item.id) return res.status(400).json({ error: 'missing_id' });
      item.user_id = userId;

      const { error } = await supabase.from('portfolio').update(item).eq('id', item.id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true, item });
    }

    if (req.method === 'DELETE') {
      if (!userId) return res.status(401).json({ error: 'not_authenticated' });
      const url = new URL(req.url, 'http://localhost');
      const id = url.searchParams.get('id');
      if (!id) return res.status(400).json({ error: 'missing_id' });
      const { error } = await supabase.from('portfolio').delete().eq('id', id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: e?.message });
  }
};