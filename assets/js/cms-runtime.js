/**
 * CMS RUNTIME — Catalina Arango · Trascendamos Juntos
 * Sincroniza dinámicamente todo el contenido guardado desde el Panel de Autogestión (admin.html)
 * en tiempo real en todas las páginas de la web.
 * Soporta elementos por atributo [data-cms="key"] o por su id="key".
 */
(function() {
  'use strict';

  function initCms() {
    renderPromoStrip();
    applyCmsOverrides();
  }

  // 1. RENDER DE TIRILLA DE PROMOCIÓN SUPERIOR
  function renderPromoStrip() {
    try {
      const p = JSON.parse(localStorage.getItem('cata_promo_strip') || '{}');
      let bar = document.getElementById('promoStripBar');

      if (p && p.active && p.text) {
        if (!bar) {
          bar = document.createElement('div');
          bar.id = 'promoStripBar';
          document.body.insertBefore(bar, document.body.firstChild);
        }
        bar.style.display = 'flex';
        bar.style.alignItems = 'center';
        bar.style.justifyContent = 'center';
        bar.style.gap = '1rem';
        bar.style.padding = '0.65rem 1.5rem';
        bar.style.fontSize = '0.88rem';
        bar.style.fontWeight = '600';
        bar.style.textAlign = 'center';
        bar.style.flexWrap = 'wrap';
        bar.style.position = 'relative';
        bar.style.zIndex = '1000';
        bar.style.background = p.bgColor || '#2f342e';
        bar.style.color = p.textColor || '#f7d598';

        const cta = p.ctaText
          ? `<a href="${p.ctaUrl || '#'}" style="color:${p.textColor || '#f7d598'};text-decoration:underline;margin-left:0.5rem;">${p.ctaText}</a>`
          : '';

        bar.innerHTML = `
          <span>${p.emoji || ''} ${p.text} ${cta}</span>
          <button onclick="this.parentElement.style.display='none'" style="background:none;border:none;color:${p.textColor || '#f7d598'};cursor:pointer;font-size:1.1rem;margin-left:1rem;line-height:1;" title="Cerrar aviso">✕</button>
        `;
      } else if (bar) {
        bar.style.display = 'none';
      }
    } catch(e) {}
  }

  // 2. OVERRIDES DE CONTENIDO CMS EN TIEMPO REAL
  function applyCmsOverrides() {
    try {
      const data = JSON.parse(localStorage.getItem('cata_cms_content') || '{}');
      if (!data || Object.keys(data).length === 0) return;

      // Aplicar por atributo data-cms
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

      // Aplicar por id directo
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

      // Mapeo inteligente de precios USD visibles
      if (data['mentorias_regreso_usd']) {
        document.querySelectorAll('[data-cms="mentorias_regreso_usd_display"]').forEach(function(el) {
          el.textContent = '$' + data['mentorias_regreso_usd'];
        });
      }
      if (data['mentorias_despertar_usd']) {
        document.querySelectorAll('[data-cms="mentorias_despertar_usd_display"]').forEach(function(el) {
          el.textContent = '$' + data['mentorias_despertar_usd'];
        });
      }
      if (data['mentorias_renacer_usd']) {
        document.querySelectorAll('[data-cms="mentorias_renacer_usd_display"]').forEach(function(el) {
          el.textContent = '$' + data['mentorias_renacer_usd'];
        });
      }
      if (data['mentorias_escritura_usd']) {
        document.querySelectorAll('[data-cms="mentorias_escritura_usd_display"]').forEach(function(el) {
          el.textContent = '$' + data['mentorias_escritura_usd'];
        });
      }
      if (data['escaner_oferta_precio']) {
        document.querySelectorAll('[data-cms="escaner_oferta_precio_display"]').forEach(function(el) {
          el.textContent = '$' + data['escaner_oferta_precio'];
        });
      }
      if (data['footer_lema']) {
        document.querySelectorAll('[data-cms="footer_lema"]').forEach(function(el) {
          el.textContent = data['footer_lema'];
        });
      }

      // WhatsApp oficial en todos los enlaces
      if (data['global_whatsapp']) {
        const cleanPhone = data['global_whatsapp'].replace(/[^0-9]/g, '');
        document.querySelectorAll('a[href*="wa.me"]').forEach(function(a) {
          try {
            const urlObj = new URL(a.href);
            const textParam = urlObj.searchParams.get('text') || '';
            a.href = 'https://wa.me/' + cleanPhone + (textParam ? '?text=' + encodeURIComponent(textParam) : '');
          } catch(e) {}
        });
      }

      // Correo oficial
      if (data['global_email']) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(function(a) {
          a.href = 'mailto:' + data['global_email'];
          if (a.textContent.includes('@')) a.textContent = data['global_email'];
        });
      }

      // Redes sociales globales
      if (data['global_instagram']) {
        document.querySelectorAll('a[href*="instagram.com"]').forEach(function(a) { a.href = data['global_instagram']; });
      }
      if (data['global_facebook']) {
        document.querySelectorAll('a[href*="facebook.com"]').forEach(function(a) { a.href = data['global_facebook']; });
      }
      if (data['global_youtube']) {
        document.querySelectorAll('a[href*="youtube.com"]').forEach(function(a) { a.href = data['global_youtube']; });
      }
      if (data['global_tiktok']) {
        document.querySelectorAll('a[href*="tiktok.com"]').forEach(function(a) { a.href = data['global_tiktok']; });
      }
    } catch(e) {
      console.warn('CMS Runtime warning:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCms);
  } else {
    initCms();
  }
})();
