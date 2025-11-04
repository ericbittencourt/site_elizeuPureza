// Pré-carregador: remove ao carregar DOM
document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('preloader');
  setTimeout(() => preloader?.classList.add('hide'), 600);
  setTimeout(() => preloader?.remove(), 1200);

  // Detectar e ativar vídeos locais (prioriza WebM, depois MP4, com remoto como fallback)
  function prepareLocalVideos() {
    const videos = document.querySelectorAll('video.bg-video');
    videos.forEach((video) => {
      const localMp4 = video.dataset.localSrc;
      const localWebm = video.dataset.localWebm;
      const localPoster = video.dataset.localPoster;

      if (localPoster) video.poster = localPoster;

      const existingSources = Array.from(video.querySelectorAll('source'));
      const newSources = [];

      // Prioridade: WebM -> MP4
      if (localWebm) newSources.push({ src: localWebm, type: 'video/webm' });
      if (localMp4) newSources.push({ src: localMp4, type: 'video/mp4' });

      // Fallback remoto (apenas se existir)
      if (existingSources.length) {
        const s0 = existingSources[0];
        newSources.push({ src: s0.src, type: s0.type || '' });
      }

      if (!newSources.length) return; // nada a fazer

      // Substitui fontes de uma vez para evitar múltiplos aborts
      existingSources.forEach((s) => s.remove());
      newSources.forEach(({ src, type }) => {
        const s = document.createElement('source');
        s.src = src;
        if (type) s.type = type;
        video.appendChild(s);
      });

      // Um único load para aplicar nova ordem
      video.load();
    });
  }
  prepareLocalVideos();
});

// Efeito de digitação no HERO (inicia após o preloader sumir)
(function typeWriter() {
  const el = document.getElementById('typing-text');
  if (!el) return;
  const text = 'Elizeu Pureza';
  const speed = 120;

  const start = () => {
    el.textContent = '';
    let i = 0;
    function step() {
      el.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) {
        setTimeout(step, speed);
      } else {
        const subtitle = document.querySelector('.hero-subtitle');
        if (subtitle) subtitle.classList.add('is-rise');
      }
    }
    step();
  };

  const pre = document.getElementById('preloader');
  if (pre) {
    // preloader remove em ~1200ms; iniciar logo após
    setTimeout(start, 1300);
  } else {
    start();
  }
})();

// Animar entrada suave com IntersectionObserver
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('appear');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));

// Seção ativa para fundos fixos: mostra o vídeo da seção visível
(function activateFixedBackgrounds(){
  const sections = Array.from(document.querySelectorAll('#hero, #portfolio, #sobre, #servicos, #depoimentos, #contato'));
  if (!sections.length) return;

  const setActive = (active) => {
    sections.forEach((s) => s.classList.toggle('is-active', s === active));
  };

  const pickByCenter = () => {
    const viewportCenter = window.innerHeight / 2;
    let best = sections[0];
    let bestDist = Infinity;
    sections.forEach((s) => {
      const r = s.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const dist = Math.abs(center - viewportCenter);
      if (dist < bestDist) { bestDist = dist; best = s; }
    });
    setActive(best);
  };

  // Inicializa pelo centro do viewport
  pickByCenter();

  // Atualiza de forma suave ao rolar/redimensionar
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        pickByCenter();
        ticking = false;
      });
      ticking = true;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();

// Parallax suave em vídeos de fundo
function updateParallax() {
  const els = document.querySelectorAll('[data-parallax]');
  const scrollY = window.scrollY;
  els.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const offset = (rect.top + scrollY) * 0.0008; // intensidade sutil
    el.style.transform = `translate3d(0, ${offset * 20}px, 0)`;
  });
}
updateParallax();
window.addEventListener('scroll', updateParallax, { passive: true });

// -----------------------------
// Admin: roteamento e login mock
// -----------------------------
(function adminModule(){
  const ADMIN_PATH = '/admin';
  let initialized = false;
  const CRED_HASH = '4a5afc6a96b43901088eafb3487073444ab492ed53df37ccfa938e25ed0eb279'; // SHA-256 de 'admin:12345678'

  function isAdminRoute() {
    const path = window.location.pathname.replace(/\/+$/, '');
    return path === ADMIN_PATH;
  }

  function isAuthenticated() {
    return localStorage.getItem('adminAuth') === 'true';
  }

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  async function refreshAuthState() {
    try {
      const user = await window.getCurrentUser();
      if (user) {
        localStorage.setItem('adminAuth', 'true');
        const nameEl = document.getElementById('admin-name');
        if (nameEl) nameEl.textContent = user.email || (user.user_metadata && user.user_metadata.name) || 'admin';
      } else {
        localStorage.removeItem('adminAuth');
      }
    } catch {
      localStorage.removeItem('adminAuth');
    }
  }

  async function sha256(str) {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    const arr = Array.from(new Uint8Array(buf));
    return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function updateView() {
    const adminSection = document.getElementById('admin');
    const loginCard = document.getElementById('admin-login');
    const dashCard = document.getElementById('admin-dashboard');
    const body = document.body;

    if (!adminSection) return;

    if (isAdminRoute()) {
      body.classList.add('is-admin');
      adminSection.hidden = false;
      if (isAuthenticated()) {
        hide(loginCard);
        show(dashCard);
      } else {
        show(loginCard);
        hide(dashCard);
      }
    } else {
      body.classList.remove('is-admin');
      adminSection.hidden = true;
    }
  }

  function initEvents() {
    if (initialized) return;
    initialized = true;
    const form = document.getElementById('admin-login-form');
    const error = document.getElementById('admin-error');
    const logoutBtn = document.getElementById('admin-logout');
    const nameEl = document.getElementById('admin-name');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = ((document.getElementById('admin-user') || {}).value || '').trim();
        const password = ((document.getElementById('admin-pass') || {}).value || '').trim();
        try {
          await window.login(email, password);
          await refreshAuthState();
          if (error) error.hidden = true;
          updateView();
        } catch (err) {
          console.error('Falha no login', err);
          if (error) error.hidden = false;
        }
      });

      // Esconder mensagem de erro ao digitar novamente
      const hideError = () => { if (error) error.hidden = true; };
      const userEl = document.getElementById('admin-user');
      const passEl = document.getElementById('admin-pass');
      if (userEl) userEl.addEventListener('input', hideError);
      if (passEl) passEl.addEventListener('input', hideError);
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try { await window.logout(); } catch {}
        localStorage.removeItem('adminAuth');
        history.pushState({}, '', '/');
        updateView();
      });
    }

    // Atualiza UI ao alterar o estado de autenticação
    try {
      window.onAuthChange(async () => {
        await refreshAuthState();
        updateView();
      });
    } catch {}
  }

  async function renderRoute() {
    await refreshAuthState();
    updateView();
    initEvents();
  }

  document.addEventListener('DOMContentLoaded', renderRoute);
  window.addEventListener('popstate', renderRoute);
})();

(function portfolioModule(){
  const LS_KEY = 'portfolioItems';

  const grid = () => document.getElementById('portfolio-grid');
  const adminList = () => document.getElementById('admin-items');
  const addForm = () => document.getElementById('admin-add-form');
  const cancelBtn = () => document.getElementById('cancel-edit');
  const editingIdInput = () => document.getElementById('editing-id');

  function loadItems() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function saveItems(items) {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
    // também persistir no servidor
    saveServer(items).catch(() => {});
  }
  async function fetchServer(){
    try {
      // Usar Supabase em vez de API local
      return await getPortfolioItems();
    } catch (error) {
      console.error('Erro ao buscar do Supabase:', error);
      // Fallback para arquivo local se Supabase falhar
      try {
        const res2 = await fetch('/assets/portfolio.json', { cache: 'no-store' });
        if (res2.ok) return await res2.json();
      } catch {}
      return null;
    }
  }
  
  async function saveServer(items){
    try {
      // Não precisamos mais salvar todos os itens de uma vez
      // O Supabase gerencia cada item individualmente
      return true;
    } catch (error) {
      console.error('Erro ao salvar no Supabase:', error);
      return false;
    }
  }
  async function syncFromServer(){
    const serverItems = await fetchServer();
    if (serverItems && Array.isArray(serverItems)) {
      localStorage.setItem(LS_KEY, JSON.stringify(serverItems));
      renderGrid();
      renderAdmin();
    }
  }

  function showBackendWarningIfNeeded(){
    const el = document.getElementById('admin-backend-warning');
    if (!el) return;
    fetch('/api/portfolio', { method: 'HEAD' })
      .then(r => { if (!r.ok) throw new Error('no_api'); })
      .catch(() => { el.hidden = false; });
  }

  function exportJson(){
    const btn = document.getElementById('export-json');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const items = loadItems();
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Função para renderizar a grade de itens
  function renderGrid() {
    const items = loadItems();
    const grid = document.getElementById('portfolio-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'portfolio-item';
      card.dataset.id = item.id;
      
      const content = document.createElement('div');
      content.className = 'portfolio-content';
      
      if (item.type === 'image') {
        const img = document.createElement('img');
        img.src = item.url;
        img.alt = item.title;
        content.appendChild(img);
      } else if (item.type === 'video') {
        const video = document.createElement('video');
        video.src = item.url;
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        content.appendChild(video);
      }
      
      const overlay = document.createElement('div');
      overlay.className = 'portfolio-overlay';
      
      const title = document.createElement('h3');
      title.textContent = item.title;
      overlay.appendChild(title);
      
      const desc = document.createElement('p');
      desc.textContent = item.description;
      overlay.appendChild(desc);
      
      content.appendChild(overlay);
      card.appendChild(content);
      grid.appendChild(card);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('portfolio-grid')) {
      renderGrid();
    }
    if (document.getElementById('admin-form')) {
      renderAdmin();
      initForm();
      syncFromServer();
      exportJson();
      showBackendWarningIfNeeded();
    }
  });
})();



function fileInput() { return document.getElementById('item-file'); }

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function uploadFile(file) {
  try {
    // Usar o Supabase Storage para upload
    const url = await window.uploadFile(file);
    if (url) return url;
    throw new Error('upload_failed');
  } catch (e) { 
    console.error('Upload falhou', e); 
    
    // Fallback para o servidor local se o Supabase falhar
    try {
      const dataUrl = await fileToBase64(file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, data: dataUrl })
      });
      if (!res.ok) throw new Error('upload_failed');
      const json = await res.json();
      if (json && json.ok && json.url) return json.url;
    } catch {}
    
    return null; 
  }
}


function removeItem(id) {
  const items = loadItems().filter((x) => x.id !== id);
  localStorage.setItem(LS_KEY, JSON.stringify(items));
  
  // Excluir do Supabase
  deletePortfolioItem(id).catch(err => console.error('Erro ao excluir do Supabase:', err));
  
  renderGrid();
  renderAdmin();
}