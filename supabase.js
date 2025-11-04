// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://znzkefmfgqzsvawtwyqb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuemtlZm1mZ3F6c3Zhd3R3eXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzY5NDEsImV4cCI6MjA3Nzc1Mjk0MX0.vI7B6yNoOxVVGVSg2HNqrvdB7BS40y5fx60gHNAZTeE';

// Inicializa o cliente Supabase
function createSupabaseClient() {
  return supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Funções para o portfólio
window.getPortfolioItems = async function() {
  const supabase = createSupabaseClient();
  // Buscar do Supabase
  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar do Supabase:', error);
    throw error;
  }
  return data || [];
}

window.savePortfolioItem = async function(item) {
  const supabase = createSupabaseClient();
  // Garante que o item tenha um ID
  if (!item.id) {
    item.id = Date.now().toString();
  }
  
  // Adiciona timestamp se não existir
  if (!item.created_at) {
    item.created_at = new Date().toISOString();
  }
  
  // Salvar no Supabase
  const { data, error } = await supabase
    .from('portfolio')
    .upsert(item);
  
  if (error) {
    console.error('Erro ao salvar no Supabase:', error);
    throw error;
  }
  
  return item;
}

window.deletePortfolioItem = async function(id) {
  const supabase = createSupabaseClient();
  // Excluir do Supabase
  const { error } = await supabase
    .from('portfolio')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Erro ao excluir do Supabase:', error);
    throw error;
  }
  
  return true;
}

// Upload de arquivos
window.uploadFile = async function(file) {
  const supabase = createSupabaseClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `portfolio/${fileName}`;
  
  // Upload para o Supabase Storage
  const { data, error } = await supabase
    .storage
    .from('media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('Erro no upload para Supabase:', error);
    
    // Tentar API da Vercel como alternativa
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Falha no upload');
      
      const data = await response.json();
      return data.url;
    } catch (apiErr) {
      console.error('Erro no upload via API:', apiErr);
      throw apiErr;
    }
  }
  
  // Obter URL pública
  const { data: publicURL } = supabase
    .storage
    .from('media')
    .getPublicUrl(filePath);
  
  return publicURL?.publicUrl || null;
}

// -----------------------------
// Autenticação (Supabase Auth)
// -----------------------------
window.login = async function(email, password) {
  const client = createSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

window.logout = async function() {
  const client = createSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
  return true;
}

window.getCurrentUser = async function() {
  const client = createSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data?.user || null;
}

window.onAuthChange = function(callback) {
  const client = createSupabaseClient();
  client.auth.onAuthStateChange((event, session) => {
    try { callback(event, session); } catch {}
  });
}