/**
 * Netlify Function: bold-checkout
 * Basado en la lógica criptográfica de alta confianza de github:diegosarmiento11/bold-payments
 * Genera la firma de integridad obligatoria de Bold: SHA256(orderId + amount + currency + secretKey)
 * Cero dependencias externas (usa node:crypto nativo).
 */

const { createHash } = require('node:crypto');

exports.handler = async (event) => {
  // Configuración de encabezados CORS
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
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido. Utilice POST.' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const {
      serviceId,
      serviceName,
      amount,
      currency = 'COP',
      customerName = '',
      customerEmail = '',
      customerPhone = ''
    } = payload;

    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'El monto es obligatorio y debe ser mayor a 0.' })
      };
    }

    // Llaves de Bold: tomadas de variables de entorno (o llaves de prueba activas)
    const identityKey = process.env.BOLD_IDENTITY_KEY || 'pbKbHLhQdLjwBABTK1oY3RMKWApHfsj3pRCJKnhPe5k';
    const secretKey = process.env.BOLD_SECRET_KEY || 'QyialeisVBJ8GYcdMcwTcw';

    // Generar Order ID único trazable
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderId = `CATA-${serviceId ? serviceId.toUpperCase().slice(0, 8) : 'ORD'}-${timestamp}-${randomHex}`;

    // Monto entero para Colombia (sin decimales en COP)
    const normalizedAmount = Math.round(amount);

    // Cálculo del hash de integridad según especificación oficial de Bold:
    // SHA256(orderId + amount + currency + secretKey)
    const stringToSign = `${orderId}${normalizedAmount}${currency}${secretKey}`;
    const integritySignature = createHash('sha256').update(stringToSign).digest('hex');

    const description = (serviceName || 'Mentoría Holística - Catalina Arango').slice(0, 100);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        orderId,
        amount: normalizedAmount,
        currency,
        apiKey: identityKey,
        integritySignature,
        description,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        },
        mode: process.env.BOLD_SECRET_KEY ? 'production' : 'sandbox-demo'
      })
    };
  } catch (err) {
    console.error('Error generando orden Bold:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno generando la orden de pago', detail: err.message })
    };
  }
};
