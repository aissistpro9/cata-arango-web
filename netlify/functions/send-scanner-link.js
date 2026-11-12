/**
 * Netlify Serverless Function: send-scanner-link
 * Gestiona el envío seguro de enlaces mágicos para el Escáner de Patrones Inconscientes.
 * Protege 100% las credenciales en backend serverless (NUNCA expuestas al frontend).
 */

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const MAGIC_SECRET = process.env.MAGIC_LINK_SECRET || 'grounded_soul_sanctuary_cata_arango_2026';
const GMAIL_USER = process.env.GMAIL_USER || 'carango398@gmail.com';
const GMAIL_APP_PASS = (process.env.GMAIL_APP_PASSWORD || 'ayxiljbfwccmuczf').replace(/\s+/g, '');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'OK' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const name = (data.name || data.nombre || 'Buscador de Calma').trim();
    const email = (data.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Por favor ingresa un correo electrónico válido.' })
      };
    }

    // Generación criptográfica segura de token de Enlace Mágico
    const token = crypto.createHmac('sha256', MAGIC_SECRET).update(email).digest('hex');

    // Determinación del dominio base
    const host = event.headers.host || 'blessiatech-cata-arango.netlify.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const magicUrl = `${baseUrl}/escaner-de-patrones.html?magic_token=${token}&email=${encodeURIComponent(email)}&nombre=${encodeURIComponent(name)}`;

    let emailSent = false;
    let emailError = null;

    // Configuración del transporte Nodemailer seguro con la App Password
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASS
        }
      });

      const htmlBody = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Georgia', serif; background-color: #f7f3ee; color: #3d342d; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e7ded4; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
          .header { background: linear-gradient(135deg, #444a42 0%, #2f342e 100%); padding: 36px 25px; text-align: center; color: #ffffff; }
          .header h1 { font-size: 24px; font-weight: normal; margin: 0 0 8px 0; letter-spacing: 1px; color: #e9e3da; }
          .header p { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #cbb493; margin: 0; }
          .content { padding: 35px 30px; line-height: 1.7; font-size: 16px; color: #473e35; }
          .highlight { font-style: italic; color: #8c7355; margin: 20px 0; padding: 15px 20px; border-left: 3px solid #8c7355; background: #faf7f2; }
          .btn-container { text-align: center; margin: 35px 0; }
          .btn { background: #8c7355; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 30px; font-weight: bold; font-size: 15px; letter-spacing: 1px; display: inline-block; box-shadow: 0 4px 14px rgba(140, 115, 85, 0.3); }
          .footer { background-color: #f7f3ee; padding: 25px; text-align: center; font-size: 13px; color: #8e8378; border-top: 1px solid #ebe4dc; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <p>Santuario de Calma & Reconexión</p>
            <h1>CATALINA ARANGO RIVERA</h1>
          </div>
          <div class="content">
            <p>Hola, <strong>${name}</strong>.</p>
            <p>Qué alegría darte la bienvenida a este espacio seguro y consciente creado especialmente para ti.</p>
            
            <div class="highlight">
              "Dejo de ser mi crítica para empezar a ser mi refugio."
            </div>
            
            <p>Aquí tienes tu <strong>Enlace Mágico Privado</strong> para acceder al <strong>Escáner de Patrones Inconscientes</strong> y a tu <strong>Audio Guiado de 8 Minutos</strong> para silenciar el sobrepensamiento y reconectar con tu paz interior.</p>
            
            <div class="btn-container">
              <a href="${magicUrl}" class="btn" target="_blank">INGRESAR A MI ESCÁNER Y AUDIO AHORA &rarr;</a>
            </div>
            
            <p style="font-size: 14px; color: #6b6055;">
              Este enlace es personal y exclusivo para ti. Si el botón no abre automáticamente, puedes copiar y pegar el siguiente enlace en tu navegador:<br>
              <a href="${magicUrl}" style="color: #8c7355; word-break: break-all;">${magicUrl}</a>
            </p>
            
            <p style="margin-top: 30px;">
              Tómate estos minutos en un lugar tranquilo, respira profundo y permítete mirar con compasión lo que tu mente inconsciente ha querido proteger.<br><br>
              Con amor y presencia,<br>
              <strong>Catalina Arango Rivera</strong><br>
              <span style="font-size: 13px; color: #8c7355;">Mentora Holística & Guía de Transformación Interior</span>
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Catalina Arango Rivera · Todos los derechos reservados.<br>
            Medellín, Colombia · Acompañamiento Internacional</p>
          </div>
        </div>
      </body>
      </html>
      `;

      await transporter.sendMail({
        from: `"Catalina Arango · Grounded Soul Sanctuary" <${GMAIL_USER}>`,
        to: email,
        subject: `✨ Tu Enlace Mágico: Escáner de Patrones Inconscientes + Audio de Reconexión`,
        html: htmlBody
      });

      emailSent = true;
    } catch (err) {
      console.error('Error al enviar correo con Gmail SMTP:', err.message);
      emailError = err.message;
    }

    if (!emailSent) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No se pudo enviar el correo de acceso. Verifica que la contraseña de aplicación de Gmail esté activa.',
          details: emailError
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Enlace mágico enviado exitosamente a tu correo electrónico.',
        emailSent: true
      })
    };
  } catch (error) {
    console.error('Error general en send-scanner-link:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Ocurrió un error al procesar tu solicitud.',
        details: error.message
      })
    };
  }
};
