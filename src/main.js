import './styles.css';

document.querySelector('#year').textContent = new Date().getFullYear();

const themeToggle = document.querySelector('#theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const themeColor = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  themeToggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
  themeToggle.title = `Switch to ${dark ? 'light' : 'dark'} mode`;
  themeColor.content = dark ? '#11171c' : '#f7f6f2';
}

applyTheme(document.documentElement.dataset.theme || (systemTheme.matches ? 'dark' : 'light'));

themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  try { localStorage.setItem('theme', nextTheme); } catch {}
});

systemTheme.addEventListener('change', (event) => {
  try {
    if (localStorage.getItem('theme')) return;
  } catch {}
  applyTheme(event.matches ? 'dark' : 'light');
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const videos = document.querySelectorAll('.lazy-video');

if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target: video, isIntersecting }) => {
      if (isIntersecting) {
        const source = video.querySelector('source[data-src]');
        if (source) {
          source.src = source.dataset.src;
          source.removeAttribute('data-src');
          video.load();
        }
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { rootMargin: '180px 0px', threshold: 0.15 });

  videos.forEach((video) => videoObserver.observe(video));
}

const dialog = document.querySelector('#model-dialog');
const status = document.querySelector('#viewer-status');
const loadingCopy = document.querySelector('.loading-copy');
let viewer;
let lastTrigger;

async function openModel(key, trigger) {
  lastTrigger = trigger;
  dialog.showModal();
  document.body.classList.add('dialog-open');
  status.textContent = 'LOADING INTERACTIVE MODEL';
  loadingCopy.textContent = 'loading model';
  document.querySelector('.viewer-loading').classList.remove('hidden');

  try {
    if (!viewer) {
      const { createCadViewer } = await import('./cad-viewer.js');
      viewer = createCadViewer();
    }
    await viewer.openProject(key);
  } catch (error) {
    status.textContent = 'MODEL UNAVAILABLE';
    loadingCopy.textContent = 'The 3D model could not be loaded.';
    console.error(error);
  }
}

document.querySelectorAll('.model-trigger').forEach((button) => {
  button.addEventListener('click', () => openModel(button.dataset.model, button));
});

function closeDialog() {
  if (document.fullscreenElement) document.exitFullscreen();
  dialog.close();
}

document.querySelector('#close-view').addEventListener('click', closeDialog);
document.querySelector('#reset-view').addEventListener('click', () => viewer?.reset());
document.querySelector('#fullscreen-view').addEventListener('click', () => {
  const shell = document.querySelector('.dialog-shell');
  if (document.fullscreenElement) document.exitFullscreen();
  else shell.requestFullscreen?.();
});

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) closeDialog();
});

dialog.addEventListener('close', () => {
  viewer?.setActive(false);
  document.body.classList.remove('dialog-open');
  lastTrigger?.focus();
});
