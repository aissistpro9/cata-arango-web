/**
 * CATA ARANGO — TRASCENDAMOS JUNTOS
 * Regulación Consciente del Sistema Nervioso
 * Ambient Nature Sound — Canto Puro de Pájaros del Bosque al Amanecer
 */

(function () {
  'use strict';

  const AUDIO_SRC = 'assets/audio/pajaros-naturaleza.mp3';
  const DEFAULT_VOLUME = 0.48; // Volumen equilibrado: perfectamente audible, suave y relajante (48%)
  const STORAGE_KEY_TIME = 'cata_nature_audio_time';

  // 1. Instanciación inmediata para carga y reproducción ultrarrápida (0ms de retraso)
  const audio = new Audio(AUDIO_SRC);
  audio.id = 'cata-nature-audio';
  audio.loop = true;
  audio.volume = DEFAULT_VOLUME;
  audio.preload = 'auto';

  // Limpiar cualquier residuo de pausa anterior para que siempre arranque activo
  try {
    localStorage.removeItem('cata_nature_audio_paused');
    sessionStorage.removeItem('cata_nature_audio_paused');
  } catch (e) {}

  // Restaurar posición de reproducción si viene navegando entre páginas
  try {
    const savedTime = parseFloat(sessionStorage.getItem(STORAGE_KEY_TIME) || '0');
    if (!isNaN(savedTime) && savedTime > 0) {
      audio.currentTime = savedTime % 60;
    }
  } catch (e) {}

  // Intento de reproducción instantánea inmediata
  const immediatePlay = audio.play();
  if (immediatePlay !== undefined) {
    immediatePlay.catch(() => {
      // Si el navegador retiene sonido hasta el primer movimiento/clic,
      // desbloqueamos al primer micro-gesto del visitante
      attachInstantUnlocker();
    });
  }

  // Guardar posición al cambiar de página
  window.addEventListener('beforeunload', () => {
    try {
      if (audio && !isNaN(audio.currentTime)) {
        sessionStorage.setItem(STORAGE_KEY_TIME, audio.currentTime.toString());
      }
    } catch (e) {}
  });

  let widgetEl = null;
  let userManuallyPaused = false;

  function init() {
    createWidget();
    bindEvents();
    updateUI(true); // Siempre despausado al recargar o ingresar
  }

  function createWidget() {
    if (document.getElementById('nature-sound-widget')) return;

    const style = document.createElement('style');
    style.id = 'cata-nature-sound-styles';
    style.textContent = `
      .nature-sound-compact-pill {
        position: fixed;
        bottom: 22px;
        left: 22px;
        z-index: 9999;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px;
        background: rgba(247, 243, 233, 0.96);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1.5px solid rgba(116, 136, 115, 0.38);
        border-radius: 9999px;
        box-shadow: 0 8px 24px -4px rgba(30, 28, 16, 0.22), 0 2px 8px rgba(116, 136, 115, 0.15);
        cursor: pointer;
        user-select: none;
        transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease;
      }

      .nature-sound-compact-pill:hover {
        transform: translateY(-2px) scale(1.03);
        box-shadow: 0 12px 28px -4px rgba(30, 28, 16, 0.28), 0 4px 12px rgba(116, 136, 115, 0.22);
      }

      /* Círculo verde izquierdo con barras animadas */
      .nature-pill-circle-left {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background-color: #4e614e;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background-color 0.25s ease;
      }

      .nature-sound-compact-pill.is-paused .nature-pill-circle-left {
        background-color: #748873;
      }

      .nature-bars {
        display: inline-flex;
        align-items: flex-end;
        gap: 2.5px;
        height: 16px;
      }

      .nature-bar {
        width: 3px;
        background: #ffffff;
        border-radius: 2px;
        height: 4px;
        transition: height 0.2s ease;
      }

      .nature-sound-compact-pill.is-playing .nature-bar:nth-child(1) {
        animation: soundBarDance 1s ease-in-out infinite alternate;
      }
      .nature-sound-compact-pill.is-playing .nature-bar:nth-child(2) {
        animation: soundBarDance 1.3s ease-in-out 0.2s infinite alternate;
      }
      .nature-sound-compact-pill.is-playing .nature-bar:nth-child(3) {
        animation: soundBarDance 0.85s ease-in-out 0.4s infinite alternate;
      }

      @keyframes soundBarDance {
        0% { height: 3px; }
        100% { height: 16px; }
      }

      /* Círculo derecho con botón de Pausa / Play */
      .nature-pill-circle-right {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background-color: rgba(116, 136, 115, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #4e614e;
        flex-shrink: 0;
        transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
      }

      .nature-sound-compact-pill:hover .nature-pill-circle-right {
        background-color: rgba(116, 136, 115, 0.28);
      }

      .nature-pill-circle-right svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
      }

      @media (max-width: 768px) {
        .nature-sound-compact-pill {
          bottom: 16px;
          left: 16px;
          padding: 4px;
          gap: 5px;
        }
        .nature-pill-circle-left,
        .nature-pill-circle-right {
          width: 35px;
          height: 35px;
        }
      }
    `;
    document.head.appendChild(style);

    widgetEl = document.createElement('div');
    widgetEl.className = 'nature-sound-compact-pill is-playing'; // Activado visualmente por defecto
    widgetEl.id = 'nature-sound-widget';
    widgetEl.setAttribute('role', 'button');
    widgetEl.setAttribute('tabindex', '0');
    widgetEl.setAttribute('aria-label', 'Canto de Pájaros: Clic para pausar');
    widgetEl.setAttribute('title', '🌿 Canto de Pájaros del Bosque · Clic para pausar');

    widgetEl.innerHTML = `
      <div class="nature-pill-circle-left" id="natureCircleLeft">
        <div class="nature-bars">
          <span class="nature-bar"></span>
          <span class="nature-bar"></span>
          <span class="nature-bar"></span>
        </div>
      </div>
      <div class="nature-pill-circle-right" id="natureCircleRight">
        <svg id="natureIconPause" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
        <svg id="natureIconPlay" viewBox="0 0 24 24" style="display: none; margin-left: 2px;">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
    `;

    document.body.appendChild(widgetEl);
  }

  function bindEvents() {
    function handleToggle(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      toggleAudio();
    }

    widgetEl.addEventListener('click', handleToggle);
    widgetEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleToggle(e);
      }
    });

    audio.addEventListener('play', () => updateUI(true));
    audio.addEventListener('playing', () => updateUI(true));
    audio.addEventListener('pause', () => {
      if (userManuallyPaused) {
        updateUI(false);
      }
    });
  }

  function toggleAudio() {
    if (!audio) return;

    if (audio.paused) {
      userManuallyPaused = false;
      audio.volume = DEFAULT_VOLUME;
      audio.play().then(() => {
        updateUI(true);
      }).catch(err => {
        console.warn('Play error:', err);
      });
    } else {
      userManuallyPaused = true;
      audio.pause();
      updateUI(false);
    }
  }

  function updateUI(playing) {
    if (!widgetEl) return;
    const pauseIcon = document.getElementById('natureIconPause');
    const playIcon = document.getElementById('natureIconPlay');

    if (playing) {
      widgetEl.classList.remove('is-paused');
      widgetEl.classList.add('is-playing');
      widgetEl.setAttribute('aria-label', 'Canto de Pájaros: Clic para pausar');
      widgetEl.setAttribute('title', '🌿 Canto de Pájaros del Bosque · Clic para pausar');
      if (pauseIcon) pauseIcon.style.display = 'block';
      if (playIcon) playIcon.style.display = 'none';
    } else {
      widgetEl.classList.remove('is-playing');
      widgetEl.classList.add('is-paused');
      widgetEl.setAttribute('aria-label', 'Canto de Pájaros: Clic para reproducir');
      widgetEl.setAttribute('title', '🌿 Canto de Pájaros · Clic para reanudar');
      if (pauseIcon) pauseIcon.style.display = 'none';
      if (playIcon) playIcon.style.display = 'block';
    }
  }

  function attachInstantUnlocker() {
    const events = ['pointerdown', 'click', 'touchstart', 'scroll', 'mousemove', 'wheel', 'keydown'];

    function unlock() {
      if (!userManuallyPaused && audio && audio.paused) {
        audio.volume = DEFAULT_VOLUME;
        audio.play().then(() => {
          updateUI(true);
        }).catch(() => {});
      }
      events.forEach(evt => {
        window.removeEventListener(evt, unlock, true);
      });
    }

    events.forEach(evt => {
      window.addEventListener(evt, unlock, { capture: true, once: true, passive: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
