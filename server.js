const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// High-performance gzip/deflate compression for all static assets & responses
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Middleware to parse JSON and urlencoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security, Strict Transport & Permissions Headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=*, geolocation=(), payment=*');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://checkout.bold.co https://api.web3forms.com https://unpkg.com https://cdn.jsdelivr.net https://elevenlabs.io https://*.elevenlabs.io https://apis.google.com https://accounts.google.com; worker-src 'self' blob: data: https:; child-src 'self' blob: https:; connect-src 'self' https: wss: ws: blob: data: stun: turn: turns:; media-src 'self' data: https: blob:; frame-src 'self' https://checkout.bold.co https://www.youtube.com https://youtube.com https://elevenlabs.io https://*.elevenlabs.io https://calendar.google.com https://meet.google.com https://unpkg.com; object-src 'none'; base-uri 'self'; form-action 'self' https://api.web3forms.com https://checkout.bold.co;");
  next();
});

// ============================================================================
// CLEAN SLUGS & CANONICAL 301 REDIRECTS (ELIMINACIÓN ESTRICTA DE .HTML)
// ============================================================================
const SLUG_MAP_FROM_HTML = {
  '/index.html': '/',
  '/admin.html': '/panel',
  '/autogestion.html': '/panel',
  '/sobre-mi.html': '/sobre-mi',
  '/mentorias-y-cursos.html': '/mentorias',
  '/mentorias.html': '/mentorias',
  '/cursos.html': '/mentorias',
  '/comunidad.html': '/comunidad',
  '/testimonios.html': '/testimonios',
  '/contacto-y-faq.html': '/contacto',
  '/contacto.html': '/contacto',
  '/faq.html': '/contacto',
  '/escaner-de-patrones.html': '/escaner',
  '/escaner.html': '/escaner',
  '/pago-confirmado.html': '/pago-confirmado',
  '/portal-agencia.html': '/portal',
  '/portal.html': '/portal',
  '/landing-despertar.html': '/despertar',
  '/despertar.html': '/despertar',
  '/landing-escritura.html': '/escritura',
  '/escritura.html': '/escritura',
  '/landing-regreso-a-ti.html': '/regreso-a-ti',
  '/regreso-a-ti.html': '/regreso-a-ti',
  '/bienvenida.html': '/bienvenida',
  '/presentacion_profesional_cata_arango.html': '/presentacion',
  '/presentacion.html': '/presentacion'
};

const LEGACY_SLUG_REDIRECTS = {
  '/admin': '/panel',
  '/autogestion': '/panel',
  '/acceso': '/panel',
  '/mentorias-y-cursos': '/mentorias',
  '/cursos': '/mentorias',
  '/contacto-y-faq': '/contacto',
  '/faq': '/contacto',
  '/escaner-de-patrones': '/escaner',
  '/escaner-patrones': '/escaner',
  '/landing-despertar': '/despertar',
  '/landing-escritura': '/escritura',
  '/landing-regreso-a-ti': '/regreso-a-ti',
  '/portal-agencia': '/portal',
  '/agencia': '/portal'
};

// Middleware para forzar 301 permanente a slugs limpios sin .html
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  const cleanReqPath = req.path.toLowerCase();
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

  // 1. Redireccionar cualquier petición con extensión .html
  if (cleanReqPath.endsWith('.html')) {
    if (SLUG_MAP_FROM_HTML[cleanReqPath]) {
      return res.redirect(301, SLUG_MAP_FROM_HTML[cleanReqPath] + query);
    }
    const withoutExt = cleanReqPath.slice(0, -5);
    const target = withoutExt === '/index' ? '/' : withoutExt;
    return res.redirect(301, target + query);
  }

  // 2. Redireccionar slugs alternativos hacia su canónico
  if (LEGACY_SLUG_REDIRECTS[cleanReqPath]) {
    return res.redirect(301, LEGACY_SLUG_REDIRECTS[cleanReqPath] + query);
  }

  next();
});

// Adapter to run Netlify Functions inside Express
function runNetlifyFunction(fnPath) {
  return async (req, res) => {
    try {
      const { handler } = require(fnPath);
      const event = {
        httpMethod: req.method,
        path: req.path,
        headers: req.headers,
        queryStringParameters: req.query,
        body: typeof req.body === 'object' ? JSON.stringify(req.body) : (req.body || ''),
      };
      const response = await handler(event, {});
      if (response.headers) {
        for (const [k, v] of Object.entries(response.headers)) {
          res.setHeader(k, v);
        }
      }
      res.status(response.statusCode || 200).send(response.body);
    } catch (err) {
      console.error(`Error executing ${fnPath}:`, err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

// ============================================================================
// PERSISTENT CMS API (server-side database in data/cms.json)
// ============================================================================
const CMS_FILE = path.join(__dirname, 'data', 'cms.json');
let cmsMemoryCache = null;

function getCmsData() {
  if (cmsMemoryCache) return cmsMemoryCache;
  try {
    if (fs.existsSync(CMS_FILE)) {
      const raw = fs.readFileSync(CMS_FILE, 'utf8');
      cmsMemoryCache = JSON.parse(raw);
      return cmsMemoryCache;
    }
  } catch (err) {
    console.error('Error reading data/cms.json:', err);
  }
  return { promo: { active: false }, cms: {}, landings: {} };
}

// GET /api/cms — Read persisted CMS data
app.get('/api/cms', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const data = getCmsData();
  res.json(data);
});

// POST /api/cms — Persist CMS updates from Admin Panel
app.post('/api/cms', (req, res) => {
  try {
    const payload = req.body || {};
    const current = getCmsData();

    if (payload.promo !== undefined) {
      current.promo = Object.assign({}, current.promo || {}, payload.promo);
    }
    if (payload.cms !== undefined) {
      current.cms = Object.assign({}, current.cms || {}, payload.cms);
    }
    if (payload.landings !== undefined) {
      current.landings = current.landings || {};
      for (const [k, v] of Object.entries(payload.landings)) {
        current.landings[k] = Object.assign({}, current.landings[k] || {}, v);
      }
    }
    if (payload.landing && payload.landingKey) {
      current.landings = current.landings || {};
      current.landings[payload.landingKey] = Object.assign({}, current.landings[payload.landingKey] || {}, payload.landing);
    }

    const dir = path.dirname(CMS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(CMS_FILE, JSON.stringify(current, null, 2), 'utf8');
    cmsMemoryCache = current;

    res.json({
      success: true,
      message: 'Configuración guardada exitosamente en el servidor',
      updated_at: new Date().toISOString(),
      data: current
    });
  } catch (err) {
    console.error('Error saving data to cms.json:', err);
    res.status(500).json({ error: 'Error guardando en el servidor', details: err.message });
  }
});

// ============================================================================
// CANONICAL CLEAN ROUTES (SERVE HTML PAGES SECURELY WITHOUT EXTENSION)
// ============================================================================

// 1. Inicio
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Panel de Autogestión (Acceso oficial y seguro)
app.get('/panel', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// 3. Sobre Mí
app.get('/sobre-mi', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.sendFile(path.join(__dirname, 'sobre-mi.html'));
});

// 4. Mentorías y Cursos
app.get('/mentorias', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.sendFile(path.join(__dirname, 'mentorias-y-cursos.html'));
});

// 5. Comunidad
app.get('/comunidad', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.sendFile(path.join(__dirname, 'comunidad.html'));
});

// 6. Testimonios
app.get('/testimonios', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.sendFile(path.join(__dirname, 'testimonios.html'));
});

// 7. Contacto & FAQ
app.get('/contacto', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.sendFile(path.join(__dirname, 'contacto-y-faq.html'));
});

// 8. Escáner de Patrones Inconscientes
app.get('/escaner', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.sendFile(path.join(__dirname, 'escaner-de-patrones.html'));
});

// 9. Confirmación de Pago Bold
app.get('/pago-confirmado', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'pago-confirmado.html'));
});

// 10. Portal Agencia Blessia
app.get('/portal', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.sendFile(path.join(__dirname, 'portal-agencia.html'));
});

// 11. Portada de Bienvenida
app.get('/bienvenida', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.sendFile(path.join(__dirname, 'bienvenida.html'));
});

// 12. Presentación Profesional Blessia
app.get('/presentacion', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.sendFile(path.join(__dirname, 'presentacion_profesional_cata_arango.html'));
});

// 12. Landings de Promoción & Captura
app.get('/despertar', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.sendFile(path.join(__dirname, 'landing-despertar.html'));
});

app.get('/escritura', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.sendFile(path.join(__dirname, 'landing-escritura.html'));
});

app.get('/regreso-a-ti', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.sendFile(path.join(__dirname, 'landing-regreso-a-ti.html'));
});

// Standard API Routes
app.all('/api/bold-checkout', runNetlifyFunction('./netlify/functions/bold-checkout.js'));
app.all('/api/bold-webhook', runNetlifyFunction('./netlify/functions/bold-webhook.js'));
app.all('/api/contact', runNetlifyFunction('./netlify/functions/contact.js'));
app.all('/api/calendar', runNetlifyFunction('./netlify/functions/google-calendar.js'));
app.all('/api/google-calendar', runNetlifyFunction('./netlify/functions/google-calendar.js'));
app.all('/api/send-scanner-link', runNetlifyFunction('./netlify/functions/send-scanner-link.js'));

// Health check endpoint
app.get('/health', (req, res) => res.status(200).send('OK'));

// Optimized Static Assets Delivery (index and extensions disabled to enforce clean routes)
app.use(express.static(path.join(__dirname, '.'), {
  index: false,
  extensions: false,
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else if (filePath.match(/\.(jpg|jpeg|png|webp|svg|ico|mp4|ogg|mp3|woff2|woff|ttf)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    } else if (filePath.match(/\.(css|js)$/i)) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }
}));

// Fallback to index.html for unknown clean routes (excluding static file assets)
app.use((req, res) => {
  if (req.method === 'GET') {
    if (path.extname(req.path)) {
      return res.status(404).send('Not Found');
    }
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).send('Not Found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cata Arango Holistic Server running on port ${PORT}`);
});
