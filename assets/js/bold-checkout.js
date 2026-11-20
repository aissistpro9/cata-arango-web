/**
 * Módulo de Checkout de Pagos BOLD
 * Catalina Arango — Trascendamos Juntos
 * 
 * Implementa la integración del Botón de Pagos de Bold Colombia
 * Conectado con la lógica de firma de servidor (github:diegosarmiento11/bold-payments)
 */

(function () {
  'use strict';

  let currentProduct = null;
  let currentCurrency = 'COP'; // COP o USD

  // Formateadores numéricos
  const formatCOP = (num) => '$' + Number(num).toLocaleString('es-CO') + ' COP';
  const formatUSD = (num) => '$' + Number(num).toLocaleString('en-US') + ' USD';

  // Inyectar el HTML del modal al DOM
  function createCheckoutModal() {
    if (document.getElementById('boldCheckoutModal')) return;

    const modalHtml = `
      <div id="boldCheckoutModal" class="bold-modal-overlay" style="display:none;" aria-hidden="true" role="dialog">
        <div class="bold-modal-container">
          
          <!-- Encabezado del Modal -->
          <div class="bold-modal-header">
            <div class="bold-modal-header-branding">
              <img src="assets/images/LOGO_SOL_Y_LUNA-removebg.png" alt="Sol y Luna" class="bold-modal-logo">
              <div>
                <span class="bold-modal-eyebrow">PASARELA OFICIAL DE PAGO</span>
                <h3 id="boldModalTitle" class="bold-modal-title">Finalizar Reserva</h3>
              </div>
            </div>
            <button type="button" class="bold-modal-close" onclick="window.closeBoldCheckout()" aria-label="Cerrar ventana">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Cuerpo del Modal -->
          <div class="bold-modal-body">
            
            <!-- Resumen del Servicio Seleccionado -->
            <div class="bold-product-card">
              <div class="bold-product-meta">
                <span id="boldProductBadge" class="bold-product-badge">Mentoría 1 a 1</span>
                <span id="boldProductDuration" class="bold-product-duration">1.5 Horas</span>
              </div>
              <h4 id="boldProductName" class="bold-product-name">Regreso a Ti</h4>
              <p id="boldProductDesc" class="bold-product-desc">
                Identificación del bloqueo emocional raíz y reconexión consciente.
              </p>
              
              <div class="bold-price-row">
                <div>
                  <span class="bold-price-label">Inversión Total:</span>
                  <div class="bold-price-wrap">
                    <span id="boldPriceValue" class="bold-price-value">$360.000 COP</span>
                    <span id="boldPriceSecondary" class="bold-price-sec">($88 USD)</span>
                  </div>
                </div>

                <!-- Selector de Moneda -->
                <div class="bold-currency-toggle">
                  <button type="button" class="bold-cur-btn active" data-cur="COP" onclick="window.setBoldCurrency('COP')">COP</button>
                  <button type="button" class="bold-cur-btn" data-cur="USD" onclick="window.setBoldCurrency('USD')">USD</button>
                </div>
              </div>
            </div>

            <!-- Formulario de Datos del Paciente / Alumno -->
            <form id="boldCheckoutForm" onsubmit="window.handleBoldSubmit(event)" class="bold-form">
              <div class="bold-form-group">
                <label for="boldCustomerName">Nombre Completo *</label>
                <input type="text" id="boldCustomerName" required placeholder="Tu nombre y apellido" class="bold-input">
              </div>

              <div class="bold-form-row">
                <div class="bold-form-group">
                  <label for="boldCustomerEmail">Correo Electrónico *</label>
                  <input type="email" id="boldCustomerEmail" required placeholder="tucorreo@ejemplo.com" class="bold-input">
                </div>
                <div class="bold-form-group">
                  <label for="boldCustomerPhone">WhatsApp / Teléfono *</label>
                  <input type="tel" id="boldCustomerPhone" required placeholder="+57 300 000 0000" class="bold-input">
                </div>
              </div>

              <!-- Banner de Medios de Pago Aceptados -->
              <div class="bold-badges-container">
                <div class="bold-badges-header">
                  <span class="material-symbols-outlined">lock</span>
                  <span>Pagos 100% cifrados y protegidos:</span>
                </div>
                <div class="bold-methods-list">
                  <span class="bold-method-pill">Tarjetas de Crédito y Débito</span>
                  <span class="bold-method-pill">PSE (Transferencia Segura)</span>
                  <span class="bold-method-pill">Cifrado SSL 256 bits</span>
                </div>
              </div>

              <!-- Botones de Acción -->
              <div class="bold-actions-stack">
                <button type="submit" id="boldSubmitBtn" class="btn btn-primary bold-btn-submit">
                  <span class="material-symbols-outlined">shield_with_heart</span>
                  <span>Continuar al Pago Seguro</span>
                </button>
              </div>

              <p class="bold-security-footnote">
                Al continuar serás redirigido a la pasarela de pagos segura y certificada. Recibirás tu confirmación de reserva y comprobante digital en tu correo electrónico.
              </p>
            </form>

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Pre-cargar el script oficial de Bold en segundo plano
    if (!document.querySelector('script[src="https://checkout.bold.co/library/boldPaymentButton.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://checkout.bold.co/library/boldPaymentButton.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }

  // Abrir Modal con Producto
  window.openBoldCheckout = function (productId, preferredCurrency) {
    createCheckoutModal();

    const config = window.BOLD_CONFIG || {};
    const product = config.products ? config.products[productId] : null;

    if (!product) {
      console.warn('Producto no encontrado en BOLD_CONFIG:', productId);
      window.location.href = '/contacto';
      return;
    }

    currentProduct = product;
    currentCurrency = preferredCurrency || config.defaultCurrency || 'COP';

    // Rellenar datos en la interfaz
    document.getElementById('boldProductName').textContent = product.name;
    document.getElementById('boldProductBadge').textContent = product.badge || product.category;
    document.getElementById('boldProductDuration').textContent = product.duration || '';
    document.getElementById('boldProductDesc').textContent = product.description || '';

    // Prellenar nombre y correo si ya se ingresaron en el escáner o formulario
    const nameField = document.getElementById('boldCustomerName');
    const emailField = document.getElementById('boldCustomerEmail');
    if (nameField && !nameField.value) {
      const detectedName = (typeof window.userName !== 'undefined' && window.userName && window.userName !== 'Buscadora') 
        ? window.userName 
        : (document.getElementById('contactName')?.value || '');
      if (detectedName) nameField.value = detectedName;
    }
    if (emailField && !emailField.value) {
      const detectedEmail = (typeof window.userEmail !== 'undefined' && window.userEmail) 
        ? window.userEmail 
        : (document.getElementById('contactEmail')?.value || '');
      if (detectedEmail) emailField.value = detectedEmail;
    }

    // Sincronizar botones de selector de moneda
    document.querySelectorAll('.bold-cur-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cur') === currentCurrency);
    });

    updatePriceDisplay();

    const modal = document.getElementById('boldCheckoutModal');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  // Cerrar Modal
  window.closeBoldCheckout = function () {
    const modal = document.getElementById('boldCheckoutModal');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  };

  // Cambiar Moneda (COP / USD)
  window.setBoldCurrency = function (curr) {
    currentCurrency = curr;
    document.querySelectorAll('.bold-cur-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cur') === curr);
    });
    updatePriceDisplay();
  };

  function updatePriceDisplay() {
    if (!currentProduct) return;
    const priceVal = document.getElementById('boldPriceValue');
    const priceSec = document.getElementById('boldPriceSecondary');

    if (currentCurrency === 'COP') {
      priceVal.textContent = formatCOP(currentProduct.priceCOP);
      priceSec.textContent = `(${formatUSD(currentProduct.priceUSD)})`;
    } else {
      priceVal.textContent = formatUSD(currentProduct.priceUSD);
      priceSec.textContent = `(${formatCOP(currentProduct.priceCOP)})`;
    }
  }

  // Cálculo de firma SHA-256 en cliente para modo estático o de respaldo
  async function computeClientIntegrityHash(orderId, amount, currency, secretKey) {
    const text = `${orderId}${amount}${currency}${secretKey}`;
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Procesar Checkout con Bold
  window.handleBoldSubmit = async function (e) {
    e.preventDefault();
    if (!currentProduct) return;

    const btn = document.getElementById('boldSubmitBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span><span>Conectando pasarela de pago...</span>`;

    const name = document.getElementById('boldCustomerName').value.trim();
    const email = document.getElementById('boldCustomerEmail').value.trim();
    const phone = document.getElementById('boldCustomerPhone').value.trim();
    const amount = currentCurrency === 'COP' ? currentProduct.priceCOP : currentProduct.priceUSD;

    const payload = {
      serviceId: currentProduct.id,
      serviceName: currentProduct.name,
      amount: Math.round(amount),
      currency: currentCurrency,
      customerName: name,
      customerEmail: email,
      customerPhone: phone
    };

    let orderData = null;

    try {
      // 1. Firmar de forma 100% segura en el servidor (Netlify Serverless Function)
      // Sin exponer llaves privadas en el navegador del cliente
      const res = await fetch('/api/bold-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        orderData = await res.json();
      }
    } catch (err) {
      console.warn('Servidor de pago seguro no disponible:', err);
    }

    // 2. Si no hubo respuesta serverless, derivar a atención directa sin exponer credenciales
    if (!orderData || !orderData.integritySignature) {
      window.payViaWhatsApp();
      btn.disabled = false;
      btn.innerHTML = originalText;
      return;
    }

    try {
      // 3. Abrir la pasarela de pagos oficial de Bold
      launchBoldNativeCheckout(orderData);
    } catch (err) {
      console.error('Error lanzando checkout de Bold:', err);
      showSuccessOrFallbackNotice(payload);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  };

  // Lanzar el checkout oficial de Bold
  function launchBoldNativeCheckout(orderData) {
    const redirectionUrl = window.BOLD_CONFIG.redirectionUrl + 
      `?orderId=${encodeURIComponent(orderData.orderId)}` +
      `&servicio=${encodeURIComponent(orderData.description)}` +
      `&monto=${encodeURIComponent(orderData.amount)}` +
      `&moneda=${encodeURIComponent(orderData.currency)}` +
      `&nombre=${encodeURIComponent(orderData.customer?.name || '')}`;

    // Si la librería de Bold expone el constructor BoldCheckout:
    if (typeof window.BoldCheckout !== 'undefined') {
      try {
        const checkout = new window.BoldCheckout({
          orderId: orderData.orderId,
          currency: orderData.currency,
          amount: String(orderData.amount),
          apiKey: orderData.apiKey,
          integritySignature: orderData.integritySignature,
          description: orderData.description,
          redirectionUrl: redirectionUrl
        });
        
        window.closeBoldCheckout();
        checkout.open();
        return;
      } catch (err) {
        console.warn('Constructor BoldCheckout falló, recurriendo al botón embebido:', err);
      }
    }

    // Modal / botón inyectado con los atributos de datos oficiales de Bold
    const existingScript = document.getElementById('boldDynamicScript');
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    script.id = 'boldDynamicScript';
    script.src = 'https://checkout.bold.co/library/boldPaymentButton.js';
    script.setAttribute('data-bold-button', 'dark-L');
    script.setAttribute('data-api-key', orderData.apiKey);
    script.setAttribute('data-order-id', orderData.orderId);
    script.setAttribute('data-amount', String(orderData.amount));
    script.setAttribute('data-currency', orderData.currency);
    script.setAttribute('data-description', orderData.description);
    script.setAttribute('data-integrity-signature', orderData.integritySignature);
    script.setAttribute('data-redirection-url', redirectionUrl);

    // Guardar en sessionStorage para consulta en confirmación
    sessionStorage.setItem('cata_last_order', JSON.stringify({
      orderId: orderData.orderId,
      serviceName: orderData.description,
      amount: orderData.amount,
      currency: orderData.currency,
      customerName: orderData.customer?.name || '',
      date: new Date().toISOString()
    }));

    document.body.appendChild(script);

    // Si el script de Bold carga un disparador automático:
    setTimeout(() => {
      const boldBtn = document.querySelector('.bold-btn, [data-bold-button]');
      if (boldBtn) {
        boldBtn.click();
      }
    }, 600);
  }

  // Notificación de confirmación guiada con WhatsApp
  function showSuccessOrFallbackNotice(payload) {
    const config = window.BOLD_CONFIG;
    const msg = encodeURIComponent(
      `¡Hola Cata! Acabo de iniciar mi reserva en tu web:\n\n` +
      `🌿 *Servicio:* ${payload.serviceName}\n` +
      `💰 *Monto:* ${payload.currency === 'COP' ? formatCOP(payload.amount) : formatUSD(payload.amount)}\n` +
      `👤 *Nombre:* ${payload.customerName}\n` +
      `✉️ *Correo:* ${payload.customerEmail}\n` +
      `📱 *WhatsApp:* ${payload.customerPhone}\n\n` +
      `Deseo coordinar el pago para agendar mi espacio.`
    );

    const waUrl = `https://wa.me/${config.whatsappNumber}?text=${msg}`;
    
    // Guardar en sessionStorage para la página de confirmación
    sessionStorage.setItem('cata_last_order', JSON.stringify({
      ...payload,
      date: new Date().toISOString()
    }));

    // Redirigir a página de confirmación
    window.location.href = `/pago-confirmado?servicio=${encodeURIComponent(payload.serviceName)}&monto=${payload.amount}&moneda=${payload.currency}&nombre=${encodeURIComponent(payload.customerName)}`;
  }

  // Contacto directo por WhatsApp con mensaje formal organizado (+57 314 338 5095)
  window.payViaWhatsApp = function () {
    if (!currentProduct) return;
    const name = document.getElementById('boldCustomerName')?.value.trim() || '';
    const config = window.BOLD_CONFIG;
    const waUrl = (config && typeof config.getWhatsAppUrl === 'function')
      ? config.getWhatsAppUrl(currentProduct.id, name)
      : `https://wa.me/573143385095?text=${encodeURIComponent(`Hola Cata, un cordial saludo. Estoy interesado/a en coordinar el pago de: *${currentProduct.name}*. ¿Me podrías indicar los medios de pago disponibles y los pasos a seguir para agendar mi espacio? Muchas gracias.`)}`;

    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = waUrl;
    } else {
      window.open(waUrl, '_blank');
    }
  };

  // Apertura directa por ID de producto desde cualquier tarjeta o enlace
  window.payViaWhatsAppDirect = function (productId) {
    const config = window.BOLD_CONFIG;
    const waUrl = (config && typeof config.getWhatsAppUrl === 'function')
      ? config.getWhatsAppUrl(productId)
      : `https://wa.me/573143385095`;

    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = waUrl;
    } else {
      window.open(waUrl, '_blank');
    }
  };

  // Inicializar al cargar el DOM
  document.addEventListener('DOMContentLoaded', function () {
    createCheckoutModal();

    // Enlazar botones que tengan data-bold-product
    document.querySelectorAll('[data-bold-product]').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const prodId = this.getAttribute('data-bold-product');
        const cur = this.getAttribute('data-bold-currency') || undefined;
        window.openBoldCheckout(prodId, cur);
      });
    });

    // Cerrar al presionar la tecla ESC
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        window.closeBoldCheckout();
      }
    });
  });

})();
