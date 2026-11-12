/**
 * Netlify Function: bold-webhook
 * Basado en la lógica de verificación webhook de github:diegosarmiento11/bold-payments
 * Verifica: x-bold-signature = hex( HMAC_SHA256( secretKey, base64(rawBody) ) )
 * Contrato de Bold: responder 200 a eventos procesados o ignorados, 401 si falla firma, 405 si no es POST.
 */

const { createHmac, timingSafeEqual } = require('node:crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = event.headers || {};
  const signature = headers['x-bold-signature'] || headers['X-Bold-Signature'];
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : Buffer.from(event.body || '', 'utf8');

  const secretKey = process.env.BOLD_SECRET_KEY || 'QyialeisVBJ8GYcdMcwTcw';
  const candidateKeys = [secretKey, ''];

  if (signature) {
    const encoded = rawBody.toString('base64');
    let isValid = false;

    for (const key of candidateKeys) {
      const expected = Buffer.from(createHmac('sha256', key).update(encoded).digest('hex'));
      const received = Buffer.from(signature);

      if (expected.length === received.length && timingSafeEqual(expected, received)) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      console.warn('Firma de webhook Bold no coincide con ninguna llave candidata');
      return { statusCode: 401, body: JSON.stringify({ error: 'Firma inválida' }) };
    }
  }

  try {
    const data = JSON.parse(rawBody.toString('utf8'));
    const eventType = data.type; // 'SALE_APPROVED' | 'SALE_REJECTED'
    const reference = data.data?.metadata?.reference || data.subject || 'Sin Referencia';
    const amount = data.data?.amount?.total || 0;

    console.log(`[Bold Webhook] Evento recibido: ${eventType} para referencia: ${reference}, monto: ${amount}`);

    // Aquí se puede conectar con base de datos, notificación por email o CRM
    if (eventType === 'SALE_APPROVED') {
      console.log(`✅ PAGO APROBADO BOLD: ${reference}`);
    } else if (eventType === 'SALE_REJECTED') {
      console.log(`❌ PAGO RECHAZADO BOLD: ${reference}`);
    }

    // Bold exige responder 200 para no reencolar la notificación eternamente
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true, event: eventType, reference })
    };
  } catch (err) {
    console.error('Error parseando webhook Bold:', err);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true, error: 'JSON malformado pero notificado' })
    };
  }
};
