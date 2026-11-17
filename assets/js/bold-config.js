/**
 * Configuración Central de Pasarela de Pagos BOLD
 * Catalina Arango — Trascendamos Juntos
 * 
 * Basado en la integración oficial de Bold Colombia (developers.bold.co)
 * y el conector certificado github:diegosarmiento11/bold-payments.
 */

window.BOLD_CONFIG = {
  // Las llaves y credenciales se gestionan de forma segura en el servidor backend (Netlify Functions)
  apiKey: "",
  
  // URL de redirección cuando el usuario completa la transacción
  redirectionUrl: window.location.origin + "/pago-confirmado.html",

  // Moneda por defecto: COP (Pesos Colombianos) o USD
  defaultCurrency: "COP",

  // Datos de contacto de respaldo
  whatsappNumber: "573143385095",
  contactEmail: "trascedamosjuntos89@gmail.com",

  // Generador centralizado de enlaces y mensajes formales para WhatsApp (+57 314 338 5095)
  getWhatsAppUrl: function (productId, customerName) {
    const phone = this.whatsappNumber || "573143385095";
    const product = this.products ? this.products[productId] : null;

    let serviceTitle = "una mentoría / proceso de sanación";
    let priceText = "";

    if (product) {
      serviceTitle = product.name;
      const copStr = product.priceCOP ? '$' + Number(product.priceCOP).toLocaleString('es-CO') + ' COP' : '';
      const usdStr = product.priceUSD ? '$' + product.priceUSD + ' USD' : '';
      priceText = (usdStr && copStr) ? ` (${usdStr} / ${copStr})` : (usdStr ? ` (${usdStr})` : '');
    } else if (typeof productId === 'string' && productId) {
      serviceTitle = productId;
    }

    const greeting = customerName
      ? `Hola Cata, un cordial saludo. Mi nombre es ${customerName}.`
      : `Hola Cata, un cordial saludo.`;

    const message = `${greeting}\n\nEstoy interesado/a en coordinar el pago de: *${serviceTitle}*${priceText}.\n\n¿Me podrías indicar los medios de pago disponibles y los pasos a seguir para agendar mi espacio?\n\nMuchas gracias.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  },

  // Catálogo oficial de Mentorías, Programas y Membresías de Cata Arango
  products: {
    "regreso-a-ti": {
      id: "regreso-a-ti",
      name: "Regreso a Ti — Mentoría Individual (90 min)",
      shortName: "Regreso a Ti",
      category: "Mentoría 1 a 1",
      priceUSD: 88,
      priceCOP: 360000,
      duration: "1 sesión de 90 minutos",
      badge: "Nivel Inicial",
      description: "Identificación del bloqueo emocional raíz, reconexión con tu cuerpo, ejercicio de escritura terapéutico y audio guiado de 5 a 7 min."
    },
    "proceso-despertar": {
      id: "proceso-despertar",
      name: "Proceso Despertar — 3 Sesiones / 3 Semanas",
      shortName: "Proceso Despertar",
      category: "Inmersión 3 Semanas",
      priceUSD: 222,
      priceCOP: 900000,
      duration: "3 sesiones de 90 minutos c/u",
      badge: "Inmersión Recomendada",
      description: "Mapeo y desprogramación del bloqueo raíz primario, sanación de la herida del niño interior, abandono, culpa, heridas o traumas identificados en sesión y ritual de soberanía."
    },
    "renacer-interno": {
      id: "renacer-interno",
      name: "Renacer Interno VIP — 12 Sesiones / 3 Meses",
      shortName: "Renacer Interno VIP",
      category: "Acompañamiento VIP Trimestral",
      priceUSD: 999,
      priceCOP: 4100000,
      duration: "12 sesiones semanales de 90 min",
      badge: "Acompañamiento VIP",
      description: "Contenedor exclusivo de 3 meses. 12 sesiones semanales, 3 audios personalizados, llamada de emergencia mensual y diario digital guiado."
    },
    "escritura-terapeutica": {
      id: "escritura-terapeutica",
      name: "Escritura Terapéutica & Sanación Consciente",
      shortName: "Escritura Terapéutica",
      category: "Programa Clínico Online",
      priceUSD: 150,
      priceCOP: 600000,
      duration: "Acceso Vitalicio",
      badge: "Programa Completo",
      description: "Programa estructurado de introspección profunda: 4 módulos clínicos en video, cuadernos y guías descargables en PDF y audios guiados."
    },
    "membresia-memoria": {
      id: "membresia-memoria",
      name: "Membresía Memoria Sagrada (Nivel II)",
      shortName: "Memoria Sagrada",
      category: "Membresía Mensual",
      priceUSD: 17,
      priceCOP: 70000,
      duration: "Mensual Recurrente",
      badge: "Nivel II",
      description: "Circuito de hábitos conscientes, meditaciones exclusivas descargables y bitácora de autorregulación."
    },
    "membresia-refugio": {
      id: "membresia-refugio",
      name: "Membresía El Refugio (Nivel III)",
      shortName: "El Refugio",
      category: "Círculos Quincenales en Vivo",
      priceUSD: 45,
      priceCOP: 185000,
      duration: "Mensual Recurrente",
      badge: "Nivel III · Recomendado",
      description: "2 círculos en vivo al mes por Zoom con Catalina Arango, canal privado de Telegram con Cata y sesiones de preguntas en vivo."
    },
    "membresia-santuario": {
      id: "membresia-santuario",
      name: "Membresía El Santuario (Nivel IV VIP)",
      shortName: "El Santuario",
      category: "Membresía VIP Integral",
      priceUSD: 99,
      priceCOP: 400000,
      duration: "Mensual Recurrente",
      badge: "Nivel IV · VIP",
      description: "Todo el acceso a El Refugio más 1 sesión individual privada mensual de 60 minutos con Catalina Arango y canal prioritario."
    }
  }
};
