const { createClient } = require('@supabase/supabase-js');

// Lê variáveis de ambiente (com valores padrão do projeto, se não definidos)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://znzkefmfgqzsvawtwyqb.supabase.co';
const ANON_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuemtlZm1mZ3F6c3Zhd3R3eXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzY5NDEsImV4cCI6MjA3Nzc1Mjk0MX0.vI7B6yNoOxVVGVSg2HNqrvdB7BS40y5fx60gHNAZTeE';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || null;

// Cria cliente priorizando a service key (se existir), caso contrário usa a anon key
function createClientSafe() {
  const key = SERVICE_KEY || ANON_KEY;
  return createClient(SUPABASE_URL, key);
}

module.exports = async (req, res) => {
  // CORS básico e método permitido
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const meta = {
    supabase_url: SUPABASE_URL,
    has_anon_key: Boolean(ANON_KEY),
    has_service_key: Boolean(SERVICE_KEY),
    vercel_env: process.env.VERCEL ? 'vercel' : 'local',
  };

  const client = createClientSafe();

  const result = {
    ok: true,
    meta,
    checks: {
      supabase_client: false,
      portfolio_select: false,
      auth_admin_list: false,
    },
    errors: {},
  };

  // Check 1: cliente supabase inicializado
  try {
    // A criação do cliente não lança erro, então marcamos como true
    result.checks.supabase_client = true;
  } catch (e) {
    result.errors.supabase_client = e?.message || String(e);
    result.ok = false;
  }

  // Check 2: SELECT simples na tabela 'portfolio'
  try {
    const { error } = await client.from('portfolio').select('id').limit(1);
    if (!error) {
      result.checks.portfolio_select = true;
    } else {
      result.errors.portfolio_select = error.message;
      // RLS pode bloquear insert/update/delete, mas select deve ser público pelo nosso script
    }
  } catch (e) {
    result.errors.portfolio_select = e?.message || String(e);
  }

  // Check 3: Admin listUsers (só funciona com service key)
  if (SERVICE_KEY) {
    try {
      const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (!error) {
        result.checks.auth_admin_list = true;
        result.meta.users_count_sample = Array.isArray(data?.users) ? data.users.length : null;
      } else {
        result.errors.auth_admin_list = error.message;
      }
    } catch (e) {
      result.errors.auth_admin_list = e?.message || String(e);
    }
  }

  return res.status(200).json(result);
};