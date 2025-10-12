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