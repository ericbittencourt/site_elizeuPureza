// Pré-carregador: remove ao carregar DOM
document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('preloader');
  setTimeout(() => preloader?.classList.add('hide'), 600);
  setTimeout(() => preloader?.remove(), 1200);

  // Detectar e ativar vídeos locais se existirem
  function prepareLocalVideos() {
    const videos = document.querySelectorAll('video.bg-video');
    videos.forEach((video) => {
      const localSrc = video.dataset.localSrc;
      const localPoster = video.dataset.localPoster;
      if (!localSrc) return;

      // Tenta usar diretamente o arquivo local; se falhar, reverte para remoto
      let source = video.querySelector('source');
      if (!source) {
        source = document.createElement('source');
        video.appendChild(source);
      }

      const remoteSrc = source.src;
      const remotePoster = video.poster;

      source.src = localSrc;
      if (!source.type) source.type = 'video/mp4';
      if (localPoster) video.poster = localPoster;

      const onError = () => {
        source.src = remoteSrc;
        video.poster = remotePoster;
        video.load();
        video.removeEventListener('error', onError);
        video.removeEventListener('loadeddata', onLoaded);
      };
      const onLoaded = () => {
        // Local carregado com sucesso, remove handlers
        video.removeEventListener('error', onError);
        video.removeEventListener('loadeddata', onLoaded);
      };
      video.addEventListener('error', onError, { once: true });
      video.addEventListener('loadeddata', onLoaded, { once: true });
      video.load();
    });
  }
  prepareLocalVideos();
});

// Efeito de digitação no HERO
(function typeWriter() {
  const el = document.getElementById('typing-text');
  if (!el) return;
  const text = 'Elizeu Pureza';
  el.textContent = '';
  let i = 0;
  const speed = 120;
  function step() {
    el.textContent = text.slice(0, i);
    i++;
    if (i <= text.length) {
      setTimeout(step, speed);
    }
  }
  step();
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