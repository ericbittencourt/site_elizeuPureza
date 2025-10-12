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
  const text = 'Elizeu Pureza';
  const el = document.getElementById('typing-text');
  let i = 0;
  function step() {
    if (!el) return;
    el.textContent = text.substring(0, i);
    i++;
    if (i <= text.length) {
      setTimeout(step, 120);
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