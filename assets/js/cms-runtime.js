/**
 * CMS RUNTIME — Catalina Arango · Trascendamos Juntos
 * Sincroniza dinámicamente todo el contenido guardado desde el Panel de Autogestión (/panel)
 * persistido en el servidor (/api/cms) y respaldado en localStorage.
 */
(function() {
  'use strict';

  // 1. RENDER DE TIRILLA DE PROMOCIÓN SUPERIOR
  function renderPromoStrip(promoData) {
    try {
      const p = promoData || JSON.parse(localStorage.getItem('cata_promo_strip') || 'null') || {};
      let bar = document.getElementById('promoStripBar');

      const isClosedSession = sessionStorage.getItem('cata_promo_closed') === 'true';

      if (p && p.active === true && typeof p.text === 'string' && p.text.trim().length > 0 && !isClosedSession) {
        if (!bar) {
          bar = document.createElement('div');
          bar.id = 'promoStripBar';
          document.body.insertBefore(bar, document.body.firstChild);
        }
        bar.style.display = 'flex';
        bar.style.alignItems = 'center';
        bar.style.justifyContent = 'center';
        bar.style.gap = '0.75rem';
        bar.style.padding = '0.65rem 1.25rem';
        bar.style.fontSize = '0.88rem';
        bar.style.fontWeight = '600';
        bar.style.textAlign = 'center';
        bar.style.flexWrap = 'wrap';
        bar.style.position = 'relative';
        bar.style.zIndex = '1000';
        bar.style.width = '100%';
        bar.style.boxSizing = 'border-box';
        bar.style.background = p.bgColor || '#2f342e';
        bar.style.color = p.textColor || '#f7d598';
        bar.style.lineHeight = '1.4';
        bar.style.transition = 'all 0.3s ease';

        const cta = p.ctaText
          ? `<a href="${p.ctaUrl || '#'}" style="color:${p.textColor || '#f7d598'};text-decoration:underline;font-weight:700;margin-left:0.5rem;display:inline-block;">${p.ctaText}</a>`
          : '';

        const emoji = p.emoji ? `<span style="font-size:1.1rem;margin-right:0.35rem;">${p.emoji}</span>` : '';

        bar.innerHTML = `
          <div style="display:inline-flex;align-items:center;flex-wrap:wrap;justify-content:center;gap:0.35rem;">
            ${emoji}<span>${p.text}</span>${cta}
          </div>
          <button type="button" aria-label="Cerrar aviso" onclick="sessionStorage.setItem('cata_promo_closed','true');this.parentElement.style.display='none';" style="background:none;border:none;color:${p.textColor || '#f7d598'};cursor:pointer;font-size:1.15rem;margin-left:0.85rem;line-height:1;padding:0.2rem 0.4rem;opacity:0.85;display:inline-flex;align-items:center;justify-content:center;" title="Cerrar aviso">✕</button>
        `;
      } else {
        if (bar) {
          bar.style.display = 'none';
          bar.style.height = '0';
          bar.style.padding = '0';
          bar.style.margin = '0';
          bar.innerHTML = '';
        }
      }
    } catch(e) {
      console.warn('Error rendering promo strip:', e);
    }
  }

  // 2. APLICAR OVERRIDES DE CMS
  function applyCmsOverrides(cmsData) {
    try {
      const data = cmsData || JSON.parse(localStorage.getItem('cata_cms_content') || 'null') || {};
      if (!data || Object.keys(data).length === 0) return;

      document.querySelectorAll('[data-cms]').forEach(function(el) {
        const key = el.getAttribute('data-cms');
        if (data[key] !== undefined && data[key] !== null && String(data[key]).trim() !== '') {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = data[key];
          } else {
            el.innerHTML = data[key];
          }
        }
      });

      Object.keys(data).forEach(function(key) {
        const val = data[key];
        if (val === undefined || val === null || String(val).trim() === '') return;
        const el = document.getElementById(key);
        if (el) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = val;
          } else {
            el.innerHTML = val;
          }
        }
      });
    } catch(e) {}
  }

  // 3. SINCRONIZACIÓN CON EL SERVIDOR (/api/cms)
  async function syncWithServer() {
    try {
      const res = await fetch('/api/cms', { cache: 'no-cache' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      if (data.promo) {
        localStorage.setItem('cata_promo_strip', JSON.stringify(data.promo));
        renderPromoStrip(data.promo);
      }
      if (data.cms) {
        localStorage.setItem('cata_cms_content', JSON.stringify(data.cms));
        applyCmsOverrides(data.cms);
      }
      if (data.landings) {
        if (data.landings.landing1) localStorage.setItem('cata_landing_1', JSON.stringify(data.landings.landing1));
        if (data.landings.landing2) localStorage.setItem('cata_landing_2', JSON.stringify(data.landings.landing2));
        if (data.landings.landing3) localStorage.setItem('cata_landing_3', JSON.stringify(data.landings.landing3));
      }
    } catch (err) {
      // Offline fallback
    }
  }

  // Ejecución inicial rápida (0ms con datos locales)
  renderPromoStrip();
  applyCmsOverrides();

  // Sincronización con el servidor
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncWithServer);
  } else {
    syncWithServer();
  }

  // Exportar para llamadas manuales si es necesario
  window.refreshCmsRuntime = function(data) {
    if (data && data.promo) renderPromoStrip(data.promo);
    if (data && data.cms) applyCmsOverrides(data.cms);
  };
})();
