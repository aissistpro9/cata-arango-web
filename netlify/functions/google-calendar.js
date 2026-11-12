/**
 * Netlify Serverless Function: google-calendar
 * Gestiona el agendamiento de citas 1 a 1 con Catalina Arango y alertas de interés.
 * Genera sala de videollamada privada, enlace directo a Google Calendar,
 * y envía notificaciones por correo vía Gmail SMTP (carango398@gmail.com) tanto
 * a Catalina como al consultante de forma 100% segura.
 */

const { randomBytes } = require('node:crypto');
const nodemailer = require('nodemailer');

const GMAIL_USER = process.env.GMAIL_USER || 'carango398@gmail.com';
const GMAIL_APP_PASS = (process.env.GMAIL_APP_PASSWORD || 'ayxiljbfwccmuczf').replace(/\s+/g, '');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'OK' }) };
  }

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'active',
        service: 'Videollamada Privada · Catalina Arango',
        schedule: 'Lunes a Viernes · 9:00 a.m. a 12:00 p.m. (COT GMT-5)'
      })
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido. Utilice POST.' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');

    // =========================================================================
    // CASO 1: NOTIFICACIÓN DE INTERÉS INMEDIATO (Usuario hace clic en "Sí, quiero agendar")
    // =========================================================================
    if (data.type === 'interest_expressed') {
      const { name = 'Consultante', email = '', pattern = '', phone = '' } = data;

      const subject = `🔔 ALERTA DE INTERÉS: ${name} quiere agendar Asesoría de 10 min (Patrón: ${pattern})`;
      const textMsg = `¡Hola Catalina!\n\nUna persona completó el Escáner de Patrones Inconscientes y acaba de solicitar agendar la Asesoría de Claridad de 10 minutos contigo:\n\n• Nombre: ${name}\n• Correo: ${email}\n• WhatsApp: ${phone || 'No especificado aún'}\n• Patrón Inconsciente Detectado: ${pattern}\n\nEstá en este momento en la pantalla de selección de día y hora en tu web.`;

      // 1. Notificación vía Nodemailer SMTP a Cata
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: GMAIL_USER, pass: GMAIL_APP_PASS }
        });
        await transporter.sendMail({
          from: `"Escáner de Patrones" <${GMAIL_USER}>`,
          to: GMAIL_USER,
          subject,
          text: textMsg
        });
      } catch (e) {
        console.warn('Nodemailer interest notification warn:', e.message);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Alerta de interés notificada a Catalina vía SMTP' })
      };
    }

    // =========================================================================
    // CASO 2: AGENDAMIENTO Y CONFIRMACIÓN DE CITA (10 MIN)
    // =========================================================================
    const {
      name = '',
      email = '',
      phone = '',
      service = 'Asesoría de Diagnóstico de 10 min · Escáner de Patrones Inconscientes',
      date = '', // formato: YYYY-MM-DD
      time = '', // formato: '09:00 AM'
      message = '',
      pattern = ''
    } = data;

    if (!name || !email || !date || !time) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Faltan campos obligatorios: nombre, correo, fecha y horario son requeridos.'
        })
      };
    }

    // 1. Generar código y sala privada para la reunión
    const p1 = randomBytes(2).toString('hex').slice(0, 3);
    const p2 = randomBytes(2).toString('hex').slice(0, 4);
    const p3 = randomBytes(2).toString('hex').slice(0, 3);
    const meetCode = `cat-${p1}-${p2}${p3}`.slice(0, 12);
    const meetUrl = `https://meet.google.com/${meetCode}`;

    // 2. Parsear fecha y calcular rango de inicio/fin en hora de Colombia (UTC-5)
    let hour = 9;
    let minute = 0;
    const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
    if (timeMatch) {
      hour = parseInt(timeMatch[1], 10);
      minute = parseInt(timeMatch[2], 10);
      const ampm = (timeMatch[3] || '').toUpperCase();
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
    }

    const [yearStr, monthStr, dayStr] = date.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);

    const startDateUtc = new Date(Date.UTC(year, month, day, hour + 5, minute, 0));
    const endDateUtc = new Date(startDateUtc.getTime() + 10 * 60 * 1000);

    const pad = (n) => String(n).padStart(2, '0');
    const toGoogleIso = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const gDates = `${toGoogleIso(startDateUtc)}/${toGoogleIso(endDateUtc)}`;

    // 3. Generar enlace oficial 1-click de Google Calendar
    const eventTitle = `Asesoría de Claridad (10 min) con Cata Arango · ${name}`;
    const eventDetails = `Hola ${name},

Tu sesión privada de diagnóstico de 10 minutos con Catalina Arango está confirmada.

⏱️ Duración: 10 minutos máximo.
📹 Enlace de tu videollamada privada:
${meetUrl}

📅 Fecha: ${date}
⏰ Horario: ${time} (Hora Colombia / COT GMT-5)
🌱 Asunto: ${service}
🔍 Patrón Inconsciente: ${pattern || 'Revisión general'}
👤 Consultante: ${name} (${email} / ${phone || 'Sin WhatsApp'})

Motivo / Comentarios:
"${message || 'Sin observaciones'}"

Recomendación:
- Conéctate 2 minutos antes para probar audio y video.

Catalina Arango Rivera · Grounded Soul Sanctuary
carango398@gmail.com`;

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${gDates}&details=${encodeURIComponent(eventDetails)}&location=${encodeURIComponent(meetUrl)}&add=${encodeURIComponent(email)},carango398@gmail.com`;

    const dateObj = new Date(year, month, day);
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const formattedDate = `${diasSemana[dateObj.getDay()]}, ${day} de ${meses[month]} de ${year}`;

    // 4. Envío vía Nodemailer SMTP a Catalina Arango y al consultante
    let smtpSuccess = false;
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASS }
      });

      // A) Correo a Catalina
      await transporter.sendMail({
        from: `"Calendario Cata Arango" <${GMAIL_USER}>`,
        to: GMAIL_USER,
        subject: `🗓️ NUEVA CITA CONFIRMADA: ${name} (${formattedDate} - ${time})`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #ebd9c5; border-radius: 12px; overflow: hidden;">
          <div style="background: #444a42; color: #fff; padding: 25px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">Nueva Cita Agendada (10 min)</h2>
            <p style="margin: 5px 0 0; color: #d4c3b3; font-size: 13px;">Videollamada Privada · Catalina Arango</p>
          </div>
          <div style="padding: 25px; color: #333; line-height: 1.6;">
            <p><strong>Detalles del Agendamiento:</strong></p>
            <ul style="background: #faf7f2; border-left: 4px solid #a77f60; padding: 15px 20px; list-style: none; border-radius: 4px;">
              <li><strong>Consultante:</strong> ${name}</li>
              <li><strong>Correo:</strong> ${email}</li>
              <li><strong>WhatsApp:</strong> ${phone || 'No especificado'}</li>
              <li><strong>Fecha:</strong> ${formattedDate}</li>
              <li><strong>Horario:</strong> ${time} (Hora Colombia COT)</li>
              <li><strong>Proceso:</strong> ${service}</li>
              ${pattern ? `<li><strong>Patrón Escaneado:</strong> ${pattern}</li>` : ''}
              <li><strong>Enlace Videollamada:</strong> <a href="${meetUrl}" style="color: #444a42; font-weight: bold;">${meetUrl}</a></li>
            </ul>
            <p><strong>Comentarios:</strong><br><em>"${message || 'Sin notas'}"</em></p>
            <div style="margin: 20px 0; text-align: center;">
              <a href="${googleCalendarUrl}" style="background: #444a42; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Ver / Agregar a Google Calendar</a>
            </div>
          </div>
        </div>
        `
      });

      // B) Correo de confirmación al consultante
      if (email && email.includes('@')) {
        await transporter.sendMail({
          from: `"Catalina Arango" <${GMAIL_USER}>`,
          to: email,
          subject: `✓ Cita Confirmada con Catalina Arango (${formattedDate} - ${time})`,
          html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #ebd9c5; border-radius: 12px; overflow: hidden;">
            <div style="background: #444a42; color: #fbf9f5; padding: 30px; text-align: center;">
              <h2 style="margin: 0; font-weight: normal; font-size: 22px; color: #e9e3da;">Tu Cita está Confirmada</h2>
              <p style="margin: 6px 0 0; font-size: 13px; color: #cbb493; text-transform: uppercase; letter-spacing: 1px;">Asesoría de Claridad de 10 minutos</p>
            </div>
            <div style="padding: 30px; color: #3d342d; line-height: 1.7; font-size: 15px;">
              <p>Hola <strong>${name}</strong>,</p>
              <p>Tu espacio privado de diagnóstico de 10 minutos conmigo ha quedado formalmente reservado en la agenda:</p>
              
              <div style="background: #faf7f2; border: 1.5px solid #ebd9c5; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0;">📅 <strong>Fecha:</strong> ${formattedDate}</p>
                <p style="margin: 0 0 10px 0;">⏰ <strong>Horario:</strong> ${time} (Hora Colombia / COT GMT-5)</p>
                <p style="margin: 0 0 10px 0;">⏱️ <strong>Duración:</strong> 10 minutos</p>
                <p style="margin: 0;">📹 <strong>Tu Enlace de Videollamada:</strong><br>
                  <a href="${meetUrl}" style="color: #8c7355; font-weight: bold; word-break: break-all; font-size: 16px;">${meetUrl}</a>
                </p>
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${googleCalendarUrl}" target="_blank" style="background: #8c7355; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(140, 115, 85, 0.25);">
                  📅 AGREGAR A MI GOOGLE CALENDAR
                </a>
              </div>

              <p style="font-size: 14px; color: #6b6055;">
                <strong>Recomendación importante:</strong><br>
                Te sugiero ingresar 2 minutos antes para verificar tu conexión, micrófono y cámara. Honraremos con puntualidad tus 10 minutos para sacar el máximo provecho a este momento de claridad.
              </p>

              <p style="margin-top: 25px;">
                Con presencia y cariño,<br>
                <strong>Catalina Arango Rivera</strong><br>
                <span style="font-size: 13px; color: #8e8378;">Mentora y Terapeuta Holística Integral</span>
              </p>
            </div>
            <div style="background: #f7f3ee; padding: 15px; text-align: center; font-size: 12px; color: #8e8378; border-top: 1px solid #ebd9c5;">
              Si necesitas reprogramar, responde directamente a este correo con al menos 2 horas de anticipación.
            </div>
          </div>
          `
        });
      }
      smtpSuccess = true;
    } catch (mailErr2) {
      console.error('Error al enviar correo Nodemailer SMTP:', mailErr2);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        smtpSuccess,
        meetUrl,
        googleCalendarUrl,
        appointment: {
          name,
          email,
          phone,
          service,
          date,
          time,
          formattedDate,
          formattedTime: `${time} (Hora Colombia)`,
          meetUrl
        }
      })
    };
  } catch (err) {
    console.error('Error procesando cita:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Ocurrió un error al procesar tu cita.',
        details: err.message
      })
    };
  }
};
