/**
 * CMS RUNTIME — Catalina Arango · Trascendamos Juntos
 * Sincroniza dinámicamente el contenido del Panel de Autogestión (admin.html)
 * en todas las páginas del sitio web en tiempo real:
 * - Tirilla de Promoción Superior (Sitewide)
 * - Textos editados con data-cms
 * - Redes sociales y WhatsApp globales
 */
(function() {
  'use strict';

  function initCms() {
    renderPromoStrip();
    applyCmsOverrides();
  }

  // 1. RENDER DE TIRILLA DE PROMOCIÓN
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

  // 2. OVERRIDES DE CONTENIDO CMS
  function applyCmsOverrides() {
    try {
      const data = JSON.parse(localStorage.getItem('cata_cms_content') || '{}');
      if (!data || Object.keys(data).length === 0) return;

      document.querySelectorAll('[data-cms]').forEach(function(el) {
        const key = el.getAttribute('data-cms');
        if (data[key] !== undefined && data[key] !== null && data[key].trim() !== '') {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = data[key];
          } else {
            el.innerHTML = data[key];
          }
        }
      });

      // WhatsApp oficial
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

      // Correo
      if (data['global_email']) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(function(a) {
          a.href = 'mailto:' + data['global_email'];
          if (a.textContent.includes('@')) a.textContent = data['global_email'];
        });
      }

      // Redes
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
