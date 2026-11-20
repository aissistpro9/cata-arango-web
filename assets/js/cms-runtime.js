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
      const header = document.querySelector('.site-header');
      const main = document.querySelector('main');

      const isClosedSession = sessionStorage.getItem('cata_promo_closed') === 'true';
      const isActive = p && p.active === true && typeof p.text === 'string' && p.text.trim().length > 0;

      if (isActive && !isClosedSession) {
        if (!bar) {
          bar = document.createElement('div');
          bar.id = 'promoStripBar';
          document.body.insertBefore(bar, document.body.firstChild);
        }

        const bgColor = p.bgColor || '#2f342e';
        const textColor = p.textColor || '#f7d598';

        bar.style.display = 'flex';
        bar.style.alignItems = 'center';
        bar.style.justifyContent = 'center';
        bar.style.padding = '0.55rem 2.5rem 0.55rem 1rem';
        bar.style.fontSize = '0.86rem';
        bar.style.fontWeight = '600';
        bar.style.textAlign = 'center';
        bar.style.position = 'fixed';
        bar.style.top = '0';
        bar.style.left = '0';
        bar.style.width = '100%';
        bar.style.boxSizing = 'border-box';
        bar.style.background = bgColor;
        bar.style.color = textColor;
        bar.style.lineHeight = '1.35';
        bar.style.zIndex = '1005';
        bar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.18)';
        bar.style.transition = 'all 0.25s ease';

        const cta = p.ctaText
          ? `<a href="${p.ctaUrl || '#'}" style="color:${textColor};text-decoration:underline;font-weight:700;margin-left:0.5rem;display:inline-block;">${p.ctaText}</a>`
          : '';

        const emoji = p.emoji ? `<span style="font-size:1.1rem;margin-right:0.35rem;">${p.emoji}</span>` : '';

        bar.innerHTML = `
          <div style="display:inline-flex;align-items:center;flex-wrap:wrap;justify-content:center;gap:0.35rem;">
            ${emoji}<span>${p.text}</span>${cta}
          </div>
          <button type="button" aria-label="Cerrar aviso" id="promoCloseBtn" style="background:none;border:none;color:${textColor};cursor:pointer;font-size:1.2rem;position:absolute;right:0.85rem;top:50%;transform:translateY(-50%);line-height:1;padding:0.25rem 0.5rem;opacity:0.85;display:inline-flex;align-items:center;justify-content:center;" title="Cerrar aviso">✕</button>
        `;

        document.body.classList.add('has-promo-strip');

        function updateLayoutOffset() {
          if (!bar || bar.style.display === 'none') return;
          const barHeight = bar.offsetHeight || 38;
          document.documentElement.style.setProperty('--promo-height', barHeight + 'px');
          if (header) {
            header.style.top = barHeight + 'px';
          }
          if (main) {
            main.style.paddingTop = (80 + barHeight) + 'px';
          }
        }

        updateLayoutOffset();
        requestAnimationFrame(updateLayoutOffset);
        window.addEventListener('resize', updateLayoutOffset);

        const closeBtn = document.getElementById('promoCloseBtn');
        if (closeBtn) {
          closeBtn.onclick = function() {
            sessionStorage.setItem('cata_promo_closed', 'true');
            bar.style.display = 'none';
            document.body.classList.remove('has-promo-strip');
            document.documentElement.style.removeProperty('--promo-height');
            if (header) header.style.top = '0';
            if (main) main.style.paddingTop = '80px';
            window.removeEventListener('resize', updateLayoutOffset);
          };
        }
      } else {
        document.body.classList.remove('has-promo-strip');
        document.documentElement.style.removeProperty('--promo-height');
        if (bar) {
          bar.style.display = 'none';
          bar.style.height = '0';
          bar.style.padding = '0';
          bar.style.margin = '0';
          bar.innerHTML = '';
        }
        if (header) {
          header.style.top = '0';
        }
        if (main) {
          main.style.paddingTop = '80px';
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

      // Mapeo inteligente y sincronizado de precios en todas las páginas (Inicio, Mentorías, etc.)
      if (data.mentorias_regreso_usd) {
        document.querySelectorAll('.pricing-card').forEach(function(card) {
          if (card.textContent.includes('REGRESO A TI')) {
            const p = card.querySelector('.pricing-price');
            if (p) p.textContent = '$' + data.mentorias_regreso_usd;
            const btnSpan = card.querySelector('button.btn-primary span:last-child');
            if (btnSpan && btnSpan.textContent.includes('Pagar en Línea')) {
              btnSpan.textContent = 'Pagar en Línea · $' + data.mentorias_regreso_usd + ' USD';
            }
          }
        });
      }
      if (data.mentorias_despertar_usd) {
        document.querySelectorAll('.pricing-card').forEach(function(card) {
          if (card.textContent.includes('PROCESO DESPERTAR')) {
            const p = card.querySelector('.pricing-price');
            if (p) p.textContent = '$' + data.mentorias_despertar_usd;
            const btnSpan = card.querySelector('button.btn-primary span:last-child');
            if (btnSpan && btnSpan.textContent.includes('Pagar en Línea')) {
              btnSpan.textContent = 'Pagar en Línea · $' + data.mentorias_despertar_usd + ' USD';
            }
          }
        });
      }
      if (data.mentorias_renacer_usd) {
        document.querySelectorAll('.pricing-card').forEach(function(card) {
          if (card.textContent.includes('RENACER INTERNO')) {
            const p = card.querySelector('.pricing-price');
            if (p) p.textContent = '$' + data.mentorias_renacer_usd;
            const btnSpan = card.querySelector('button.btn-primary span:last-child');
            if (btnSpan && btnSpan.textContent.includes('Pagar en Línea')) {
              btnSpan.textContent = 'Pagar en Línea · $' + data.mentorias_renacer_usd + ' USD';
            }
          }
        });
      }
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
        const prevText = localStorage.getItem('cata_promo_saved_text');
        if (data.promo.active && data.promo.text && data.promo.text !== prevText) {
          sessionStorage.removeItem('cata_promo_closed');
          localStorage.setItem('cata_promo_saved_text', data.promo.text);
        }
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
