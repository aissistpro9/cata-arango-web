const express = require('express');
const compression = require('compression');
const path = require('path');
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security, Strict Transport & Permissions Headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=*, geolocation=(), payment=*');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://checkout.bold.co https://api.web3forms.com https://unpkg.com https://elevenlabs.io https://*.elevenlabs.io https://apis.google.com https://accounts.google.com; worker-src 'self' blob: data: https:; child-src 'self' blob: https:; connect-src 'self' https: wss: blob: data: stun: turn: turns:; media-src 'self' data: https: blob:; frame-src 'self' https://checkout.bold.co https://www.youtube.com https://youtube.com https://elevenlabs.io https://*.elevenlabs.io https://calendar.google.com https://meet.google.com; object-src 'none'; base-uri 'self'; form-action 'self' https://api.web3forms.com https://checkout.bold.co;");
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

// API Routes
app.all('/api/bold-checkout', runNetlifyFunction('./netlify/functions/bold-checkout.js'));
app.all('/api/bold-webhook', runNetlifyFunction('./netlify/functions/bold-webhook.js'));
app.all('/api/contact', runNetlifyFunction('./netlify/functions/contact.js'));
app.all('/api/calendar', runNetlifyFunction('./netlify/functions/google-calendar.js'));
app.all('/api/google-calendar', runNetlifyFunction('./netlify/functions/google-calendar.js'));
app.all('/api/send-scanner-link', runNetlifyFunction('./netlify/functions/send-scanner-link.js'));

// Health check endpoint
app.get('/health', (req, res) => res.status(200).send('OK'));

// Optimized Static Assets Delivery with Granular Cache Control
app.use(express.static(path.join(__dirname, '.'), {
  extensions: ['html'],
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // HTML is fast-validated to ensure fresh updates
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    } else if (filePath.match(/\.(jpg|jpeg|png|webp|svg|ico|mp4|ogg|mp3|woff2|woff|ttf)$/i)) {
      // Media, images and fonts cached for 30 days immutable
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    } else if (filePath.match(/\.(css|js)$/i)) {
      // CSS & JS cached for 7 days with stale-while-revalidate
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    }
  }
}));

// Fallback to index.html for root or unknown GET requests
app.use((req, res) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).send('Not Found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cata Arango Holistic Server running on port ${PORT}`);
});
