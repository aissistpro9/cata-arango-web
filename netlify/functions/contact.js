/**
 * Netlify Serverless Function: contact
 * Procesa mensajes de contacto y registros de lead magnet vía Gmail SMTP autenticado.
 * Utiliza nodemailer con carango398@gmail.com y variables de entorno de Netlify.
 * 100% seguro: NINGUNA clave ni credencial expuesta al frontend.
 */

const nodemailer = require('nodemailer');

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
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido. Utilice POST.' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');

    // Detección anti-spam honeypot
    if (data.botcheck) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Procesado' })
      };
    }

    const name = (data.name || 'Consultante').trim();
    const email = (data.email || '').trim().toLowerCase();
    const phone = (data.phone || '').trim();
    const service = data.service || 'Consulta General';
    const message = data.message || '';
    const subject = data.subject || `Nuevo Mensaje de Contacto · ${name} (${service})`;

    let emailSent = false;
    let smtpError = null;

    // 1. Envío prioritario vía Gmail SMTP autenticado (carango398@gmail.com)
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASS
        }
      });

      // Notificación a Catalina Arango
      await transporter.sendMail({
        from: `"Web Catalina Arango" <${GMAIL_USER}>`,
        to: GMAIL_USER,
        replyTo: email,
        subject: `📩 [Contacto Web] ${name} - ${service}`,
        html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5ded5; border-radius: 12px; overflow: hidden;">
          <div style="background: #444a42; color: #fbf9f5; padding: 25px 30px; text-align: center;">
            <h2 style="margin: 0; font-weight: normal; font-size: 22px; letter-spacing: 1px;">Nuevo Mensaje Recibido</h2>
            <p style="margin: 5px 0 0; font-size: 13px; color: #d4c3b3; text-transform: uppercase;">Formulario de Contacto · Trascendamos Juntos</p>
          </div>
          <div style="padding: 30px; color: #3d342d; line-height: 1.6;">
            <p>Hola Catalina, has recibido una nueva solicitud desde tu sitio web:</p>
            <ul style="background: #faf7f2; border-left: 4px solid #a77f60; padding: 15px 20px; list-style: none; margin: 20px 0; border-radius: 4px;">
              <li><strong>Nombre:</strong> ${name}</li>
              <li><strong>Correo:</strong> <a href="mailto:${email}" style="color: #444a42;">${email}</a></li>
              <li><strong>WhatsApp / Tel:</strong> ${phone || 'No especificado'}</li>
              <li><strong>Servicio o Proceso:</strong> ${service}</li>
            </ul>
            <p><strong>Mensaje del consultante:</strong></p>
            <blockquote style="margin: 15px 0; padding: 15px; background: #f5f2ed; border-radius: 8px; font-style: italic;">
              "${message || 'Sin mensaje adicional'}"
            </blockquote>
          </div>
          <div style="background: #f7f3ee; padding: 15px 30px; text-align: center; font-size: 12px; color: #8e8378; border-top: 1px solid #ebd9c5;">
            Trascendamos Juntos · Catalina Arango Rivera · Espacio Seguro
          </div>
        </div>
        `
      });

      // Confirmación automática al consultante
      if (email && email.includes('@')) {
        await transporter.sendMail({
          from: `"Catalina Arango" <${GMAIL_USER}>`,
          to: email,
          subject: `Recibí tu mensaje · Catalina Arango`,
          html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5ded5; border-radius: 12px; overflow: hidden;">
            <div style="background: #444a42; color: #fbf9f5; padding: 25px 30px; text-align: center;">
              <h2 style="margin: 0; font-weight: normal; font-size: 22px;">Trascendamos Juntos</h2>
              <p style="margin: 5px 0 0; font-size: 13px; color: #d4c3b3; text-transform: uppercase;">Catalina Arango Rivera</p>
            </div>
            <div style="padding: 30px; color: #3d342d; line-height: 1.7; font-size: 15px;">
              <p>Hola <strong>${name}</strong>,</p>
              <p>Gracias por acercarte a este espacio y compartir conmigo. He recibido tu mensaje con respecto a <strong>${service}</strong>.</p>
              <p>Reviso cada mensaje con presencia y cuidado. En breve me comunicaré contigo por este medio o por WhatsApp para dar respuesta a tu inquietud y orientarte en el mejor camino para tu proceso.</p>
              <p style="margin-top: 25px; font-style: italic; color: #a77f60;">
                "Sanar no es volverse otra persona, sino regresar a ti misma con compasión."
              </p>
              <p style="margin-top: 20px;">
                Con cariño,<br>
                <strong>Catalina Arango</strong><br>
                <span style="font-size: 13px; color: #8e8378;">Mentora y Terapeuta Holística Integral</span>
              </p>
            </div>
            <div style="background: #f7f3ee; padding: 15px; text-align: center; font-size: 12px; color: #8e8378; border-top: 1px solid #ebd9c5;">
              ¿Deseas agendar una videollamada de 10 min? Puedes hacerlo directamente desde la sección de agenda en la web.
            </div>
          </div>
          `
        });
      }

      emailSent = true;
    } catch (smtpErr) {
      console.error('Error en envío SMTP contacto:', smtpErr);
      smtpError = smtpErr.message;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Tu mensaje ha sido enviado con éxito. Te responderé muy pronto.',
        emailSent,
        smtpError
      })
    };
  } catch (err) {
    console.error('Error procesando formulario:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Error interno al enviar mensaje', details: err.message })
    };
  }
};
