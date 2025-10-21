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
        const user = (document.getElementById('admin-user') || {}).value || '';
        const pass = (document.getElementById('admin-pass') || {}).value || '';
        const h = await sha256(`${user}:${pass}`);
        const ok = h === CRED_HASH;
        if (ok) {
          localStorage.setItem('adminAuth', 'true');
          if (nameEl) nameEl.textContent = user;
          if (error) error.hidden = true;
          updateView();
        } else {
          if (error) error.hidden = false;
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminAuth');
        history.pushState({}, '', '/');
        updateView();
      });
    }
  }

  function renderRoute() {
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
  }
  function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }

  function renderGrid() {
    const el = grid();
    if (!el) return;
    const items = loadItems();
    el.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'section-subtitle';
      empty.textContent = 'Nenhum item no portfólio ainda.';
      el.appendChild(empty);
      return;
    }
    items.forEach((it) => {
      const a = document.createElement('a');
      a.className = 'card';
      a.href = it.url || '#';
      a.target = '_blank';
      a.title = it.title || '';

      const thumb = document.createElement('div');
      thumb.className = 'thumb';

      if (it.type === 'video') {
        const v = document.createElement('video');
        v.src = it.url || '';
        v.muted = true;
        v.preload = 'metadata';
        v.setAttribute('playsinline', '');
        thumb.appendChild(v);
      } else {
        const img = document.createElement('img');
        img.src = it.url || '';
        img.alt = it.title || 'Imagem';
        thumb.appendChild(img);
      }

      const meta = document.createElement('div');
      meta.className = 'meta';
      const desc = document.createElement('span');
      desc.className = 'desc';
      desc.textContent = it.title || '';
      const tags = document.createElement('span');
      tags.className = 'tags';
      tags.textContent = (it.tags || []).join(' ');

      meta.appendChild(desc);
      meta.appendChild(tags);
      a.appendChild(thumb);
      a.appendChild(meta);
      el.appendChild(a);
    });
  }

  function renderAdmin() {
    const listEl = adminList();
    if (!listEl) return;
    const items = loadItems();
    listEl.innerHTML = '';
    if (!items.length) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = 'Sem itens cadastrados.';
      listEl.appendChild(p);
      return;
    }
    items.forEach((it) => {
      const row = document.createElement('div');
      row.className = 'admin-item-row';
      row.innerHTML = `
        <div class="admin-item-main">
          <strong>[${it.type}]</strong> ${it.title || ''}
          <a href="${it.url}" target="_blank" class="admin-link">${it.url}</a>
          <span class="admin-tags">${(it.tags||[]).join(' ')}</span>
        </div>
        <div class="admin-item-actions">
          <button class="btn btn-secondary" data-action="edit">Editar</button>
          <button class="btn btn-secondary" data-action="delete">Excluir</button>
        </div>
      `;
      row.querySelector('[data-action="edit"]').addEventListener('click', () => startEdit(it.id));
      row.querySelector('[data-action="delete"]').addEventListener('click', () => removeItem(it.id));
      listEl.appendChild(row);
    });
  }

  function startEdit(id) {
    const items = loadItems();
    const it = items.find((x) => x.id === id);
    const form = addForm();
    if (!it || !form) return;
    form.type.value = it.type || 'image';
    form.title.value = it.title || '';
    form.url.value = it.url || '';
    form.tags.value = (it.tags || []).join(', ');
    editingIdInput().value = id;
    cancelBtn().hidden = false;
  }

  function removeItem(id) {
    const items = loadItems().filter((x) => x.id !== id);
    saveItems(items);
    renderGrid();
    renderAdmin();
  }

  function upsertItem(data) {
    const items = loadItems();
    const editId = editingIdInput().value;
    if (editId) {
      const idx = items.findIndex((x) => x.id === editId);
      if (idx >= 0) items[idx] = { ...items[idx], ...data };
    } else {
      items.push({ id: uid(), ...data });
    }
    saveItems(items);
    renderGrid();
    renderAdmin();
  }

  function initForm() {
    const form = addForm();
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = form.type.value;
      const title = form.title.value.trim();
      const url = form.url.value.trim();
      const tags = form.tags.value.split(',').map((t) => t.trim()).filter(Boolean);
      upsertItem({ type, title, url, tags });
      form.reset();
      editingIdInput().value = '';
      cancelBtn().hidden = true;
    });
    const c = cancelBtn();
    if (c) {
      c.addEventListener('click', () => {
        form.reset();
        editingIdInput().value = '';
        c.hidden = true;
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderGrid();
    renderAdmin();
    initForm();
  });
})();