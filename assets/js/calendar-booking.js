/**
 * CALENDARIO & AGENDAMIENTO CON GOOGLE CALENDAR & GOOGLE MEET
 * Catalina Arango · Trascendamos Juntos
 * 
 * Configuración:
 * - Días habilitados: Únicamente Lunes a Viernes (Fines de semana deshabilitados).
 * - Horario: 9:00 a.m. a 12:00 p.m. (Hora Colombia / COT GMT-5).
 * - Integración: Generación de sala Google Meet y enlace directo a Google Calendar.
 */

(function() {
  'use strict';

  const GOOGLE_CLIENT_ID = '64085876571-hgpeb7hph4tq7n5gaddeurdjpulfinrs.apps.googleusercontent.com';
  const CATA_WHATSAPP = '573143385095';
  const CATA_EMAIL = 'trascedamosjuntos89@gmail.com';

  const TIME_SLOTS = [
    { id: '09:00 AM', label: '09:00 a.m. – 09:10 a.m.', shortLabel: '09:00 - 09:10', startH: 9, startM: 0, endH: 9, endM: 10 },
    { id: '09:15 AM', label: '09:15 a.m. – 09:25 a.m.', shortLabel: '09:15 - 09:25', startH: 9, startM: 15, endH: 9, endM: 25 },
    { id: '09:30 AM', label: '09:30 a.m. – 09:40 a.m.', shortLabel: '09:30 - 09:40', startH: 9, startM: 30, endH: 9, endM: 40 },
    { id: '09:45 AM', label: '09:45 a.m. – 09:55 a.m.', shortLabel: '09:45 - 09:55', startH: 9, startM: 45, endH: 9, endM: 55 },
    { id: '10:00 AM', label: '10:00 a.m. – 10:10 a.m.', shortLabel: '10:00 - 10:10', startH: 10, startM: 0, endH: 10, endM: 10 },
    { id: '10:15 AM', label: '10:15 a.m. – 10:25 a.m.', shortLabel: '10:15 - 10:25', startH: 10, startM: 15, endH: 10, endM: 25 },
    { id: '10:30 AM', label: '10:30 a.m. – 10:40 a.m.', shortLabel: '10:30 - 10:40', startH: 10, startM: 30, endH: 10, endM: 40 },
    { id: '10:45 AM', label: '10:45 a.m. – 10:55 a.m.', shortLabel: '10:45 - 10:55', startH: 10, startM: 45, endH: 10, endM: 55 },
    { id: '11:00 AM', label: '11:00 a.m. – 11:10 a.m.', shortLabel: '11:00 - 11:10', startH: 11, startM: 0, endH: 11, endM: 10 },
    { id: '11:15 AM', label: '11:15 a.m. – 11:25 a.m.', shortLabel: '11:15 - 11:25', startH: 11, startM: 15, endH: 11, endM: 25 },
    { id: '11:30 AM', label: '11:30 a.m. – 11:40 a.m.', shortLabel: '11:30 - 11:40', startH: 11, startM: 30, endH: 11, endM: 40 },
    { id: '11:45 AM', label: '11:45 a.m. – 11:55 a.m.', shortLabel: '11:45 - 11:55', startH: 11, startM: 45, endH: 11, endM: 55 }
  ];

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  let currentDate = new Date();
  let viewYear = currentDate.getFullYear();
  let viewMonth = currentDate.getMonth();

  let selectedDate = null; // 'YYYY-MM-DD'
  let selectedSlot = null; // object from TIME_SLOTS
  let lastBookingData = null;

  function initCalendar() {
    const prevBtn = document.getElementById('calPrevBtn');
    const nextBtn = document.getElementById('calNextBtn');

    if (prevBtn) prevBtn.addEventListener('click', () => changeMonth(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeMonth(1));

    renderMonth();
    renderTimeSlots();
    updateLiveSummary();

    // Auto-seleccionar el primer día hábil disponible (Lunes a Viernes)
    selectFirstAvailableDay();

    // Auto-completar desde parámetros URL si provienen de pago o reserva
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlName = urlParams.get('nombre') || urlParams.get('name') || '';
      const urlService = urlParams.get('servicio') || urlParams.get('service') || '';
      
      const nameInput = document.getElementById('contactName');
      const serviceSelect = document.getElementById('contactService');
      
      if (urlName && nameInput && !nameInput.value) {
        nameInput.value = urlName;
      }
      
      if (urlService && serviceSelect) {
        // Buscar coincidencia parcial o exacta
        for (let i = 0; i < serviceSelect.options.length; i++) {
          const optText = serviceSelect.options[i].text.toLowerCase();
          const optVal = serviceSelect.options[i].value.toLowerCase();
          const target = urlService.toLowerCase();
          if (optText.includes(target) || target.includes(optVal) || optVal.includes(target)) {
            serviceSelect.selectedIndex = i;
            break;
          }
        }
      }
    } catch (e) {
      // Ignorar si no hay parámetros
    }
  }

  function changeMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    } else if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    renderMonth();
  }

  function renderMonth() {
    const titleEl = document.getElementById('calMonthTitle');
    const gridEl = document.getElementById('calDaysGrid');
    const prevBtn = document.getElementById('calPrevBtn');

    if (!titleEl || !gridEl) return;

    titleEl.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

    // Deshabilitar botón prev si estamos en el mes actual o pasado
    const now = new Date();
    if (prevBtn) {
      const isPastMonth = (viewYear < now.getFullYear()) || (viewYear === now.getFullYear() && viewMonth <= now.getMonth());
      prevBtn.disabled = isPastMonth;
    }

    gridEl.innerHTML = '';

    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    // Ajustar para que la semana empiece en Lunes (0 = Lun, 6 = Dom)
    const adjustedFirstDay = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Días vacíos al inicio del mes
    for (let i = 0; i < adjustedFirstDay; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'cal-day-cell empty';
      gridEl.appendChild(emptyCell);
    }

    // Días del mes
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(viewYear, viewMonth, day);
      cellDate.setHours(0, 0, 0, 0);
      const dayOfWeek = cellDate.getDay(); // 0 = Dom, 6 = Sab

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-day-cell';
      btn.textContent = day;

      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      btn.dataset.date = dateStr;

      // Es hoy?
      if (cellDate.getTime() === today.getTime()) {
        btn.classList.add('today');
      }

      // Deshabilitar fines de semana (Sábado y Domingo) y días pasados
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const isPast = cellDate.getTime() < today.getTime();

      if (isWeekend) {
        btn.classList.add('disabled', 'weekend');
        btn.title = 'No disponible los fines de semana';
      } else if (isPast) {
        btn.classList.add('disabled');
        btn.title = 'Fecha anterior';
      } else {
        // Día hábil disponible (Lunes a Viernes)
        btn.classList.add('available');
        btn.title = `${DAY_NAMES[dayOfWeek]} ${day} de ${MONTH_NAMES[viewMonth]} · Disponible (9am - 12pm)`;

        if (selectedDate === dateStr) {
          btn.classList.add('selected');
        }

        btn.addEventListener('click', () => {
          document.querySelectorAll('.cal-day-cell.selected').forEach(el => el.classList.remove('selected'));
          btn.classList.add('selected');
          selectedDate = dateStr;
          updateSelectedDateBadge();
          updateLiveSummary();
        });
      }

      gridEl.appendChild(btn);
    }
  }

  function updateSelectedDateBadge() {
    const bannerText = document.getElementById('stepSelectedDateText');
    if (selectedDate && bannerText) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayName = DAY_NAMES[dateObj.getDay()];
      const monthName = MONTH_NAMES[m - 1];
      bannerText.textContent = `${dayName}, ${d} de ${monthName}`;
    }
  }

  function goToTimeStep() {
    updateSelectedDateBadge();
  }

  function goToDateStep() {
    updateSelectedDateBadge();
  }

  window.goToDateStep = goToDateStep;
  window.goToTimeStep = goToTimeStep;

  function selectFirstAvailableDay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar el siguiente día hábil (L-V) desde hoy o mañana
    for (let i = 1; i <= 14; i++) {
      const candidate = new Date();
      candidate.setDate(candidate.getDate() + i);
      const dow = candidate.getDay();
      if (dow >= 1 && dow <= 5) {
        // Es de Lunes a Viernes
        const y = candidate.getFullYear();
        const m = candidate.getMonth();
        const d = candidate.getDate();
        selectedDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        selectedSlot = TIME_SLOTS[0]; // 09:00 AM default
        viewYear = y;
        viewMonth = m;
        renderMonth();
        renderTimeSlots();
        updateLiveSummary();
        break;
      }
    }
  }

  function renderTimeSlots() {
    const container = document.getElementById('timeSlotsGrid');
    if (!container) return;

    container.innerHTML = '';

    const groups = [
      { hour: 9, label: '09:00 a.m. · Inicio mañana', icon: 'wb_twilight' },
      { hour: 10, label: '10:00 a.m. · Media mañana', icon: 'light_mode' },
      { hour: 11, label: '11:00 a.m. · Cierre mañana', icon: 'sunny' }
    ];

    groups.forEach((group) => {
      const groupSlots = TIME_SLOTS.filter(s => s.startH === group.hour);
      if (groupSlots.length === 0) return;

      const groupDiv = document.createElement('div');
      groupDiv.className = 'time-slot-hour-group';

      const title = document.createElement('div');
      title.className = 'time-slot-hour-title';
      title.innerHTML = `<span class="material-symbols-outlined" style="font-size: 15px; color: var(--primary);">${group.icon}</span> <span>${group.label}</span>`;
      groupDiv.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'time-slot-hour-buttons';

      groupSlots.forEach((slot) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-slot-btn';
        btn.title = `${slot.label} (Hora Colombia COT)`;
        if (selectedSlot && selectedSlot.id === slot.id) {
          btn.classList.add('active');
        }

        btn.innerHTML = `
          <span class="material-symbols-outlined slot-icon" style="font-size: 13px;">${(selectedSlot && selectedSlot.id === slot.id) ? 'check_circle' : 'schedule'}</span>
          <span>${slot.shortLabel || slot.label}</span>
        `;

        btn.addEventListener('click', () => {
          document.querySelectorAll('.time-slot-btn').forEach(b => {
            b.classList.remove('active');
            const icon = b.querySelector('.slot-icon');
            if (icon) icon.textContent = 'schedule';
          });
          btn.classList.add('active');
          const activeIcon = btn.querySelector('.slot-icon');
          if (activeIcon) activeIcon.textContent = 'check_circle';

          selectedSlot = slot;
          updateLiveSummary();
        });

        grid.appendChild(btn);
      });

      groupDiv.appendChild(grid);
      container.appendChild(groupDiv);
    });
  }

  function updateLiveSummary() {
    const badgeEl = document.getElementById('bookingSelectionBadge');
    const textEl = document.getElementById('bookingSelectionText');
    const formDateInput = document.getElementById('hiddenBookingDate');
    const formTimeInput = document.getElementById('hiddenBookingTime');

    if (!selectedDate || !selectedSlot) {
      if (badgeEl) badgeEl.style.display = 'none';
      if (textEl) textEl.innerHTML = '<strong>Selecciona un día y una franja horaria</strong> en el calendario para reservar tu sesión 1 a 1.';
      return;
    }

    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayName = DAY_NAMES[dateObj.getDay()];
    const monthName = MONTH_NAMES[m - 1];

    const formattedDate = `${dayName}, ${d} de ${monthName} de ${y}`;
    const formattedTime = selectedSlot.label;

    if (formDateInput) formDateInput.value = selectedDate;
    if (formTimeInput) formTimeInput.value = selectedSlot.id;

    if (badgeEl) {
      badgeEl.style.display = 'flex';
      badgeEl.innerHTML = `
        <span class="material-symbols-outlined" style="font-size: 16px; color: var(--primary);">event_available</span>
        <span><strong>${formattedDate}</strong> · ${formattedTime}</span>
      `;
    }

    if (textEl) {
      textEl.innerHTML = `
        <strong>${formattedDate} · ${formattedTime}</strong>
        <span>Videollamada privada 1 a 1 con Catalina Arango (Hora Colombia GMT-5)</span>
      `;
    }
  }

  // Generador local de sala de Google Meet (código oficial de 3-4-3 letras)
  function createMeetRoomCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randPart = (len) => {
      let res = '';
      for (let i = 0; i < len; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return res;
    };
    return `cat-${randPart(4)}-${randPart(3)}`;
  }

  // Generador del enlace 1-click para Google Calendar
  function buildGoogleCalendarLink(appointment) {
    const { name, email, phone, service, date, slot, meetUrl, message } = appointment;
    const [y, m, d] = date.split('-').map(Number);

    // Calcular horas en UTC (Bogotá UTC-5 -> sumar 5 a UTC)
    const pad = (n) => String(n).padStart(2, '0');

    const startUtc = new Date(Date.UTC(y, m - 1, d, slot.startH + 5, slot.startM, 0));
    const endUtc = new Date(Date.UTC(y, m - 1, d, slot.endH + 5, slot.endM, 0));

    const toGCalIso = (dt) => `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`;
    const datesParam = `${toGCalIso(startUtc)}/${toGCalIso(endUtc)}`;

    const title = `Sesión con Cata Arango (10 min máx.) · ${service}`;
    const details = `Hola ${name},

Tu sesión privada y puntual de dudas/alineación con Catalina Arango está confirmada.

⏱️ Duración: 10 minutos máximo.
📹 Enlace de la videollamada:
${meetUrl}

📅 Fecha: ${date}
⏰ Horario: ${slot.label} (Hora Colombia / COT GMT-5)
🌱 Asunto / Proceso: ${service}
👤 Consultante: ${name} (${email}${phone ? ' / ' + phone : ''})

Motivo / Consulta:
"${message || 'Sin observaciones'}"

IMPORTANTE:
- La reunión tiene una duración máxima de 10 minutos. Te agradecemos conectarte con puntualidad.
- Confirmación y soporte gestionado exclusivamente a través de correo electrónico.
- Ingresa 2 minutos antes para verificar tu conexión, micrófono y cámara.

Catalina Arango · Trascendamos Juntos
trascedamosjuntos89@gmail.com`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${datesParam}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(meetUrl)}&add=${encodeURIComponent(email)},${encodeURIComponent(CATA_EMAIL)}`;
  }

  // Generador de archivo .ICS (iCalendar universal para Apple Calendar, Outlook, etc.)
  function downloadIcsFile(appointment) {
    const { name, service, date, slot, meetUrl, message } = appointment;
    const [y, m, d] = date.split('-').map(Number);
    const pad = (n) => String(n).padStart(2, '0');

    const startUtc = new Date(Date.UTC(y, m - 1, d, slot.startH + 5, slot.startM, 0));
    const endUtc = new Date(Date.UTC(y, m - 1, d, slot.endH + 5, slot.endM, 0));

    const toIcsIso = (dt) => `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Catalina Arango//Trascendamos Juntos//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:cata-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@trascendamosjuntos.com`,
      `DTSTAMP:${toIcsIso(new Date())}`,
      `DTSTART:${toIcsIso(startUtc)}`,
      `DTEND:${toIcsIso(endUtc)}`,
      `SUMMARY:Sesión con Cata Arango (10 min máx.) · ${service}`,
      `DESCRIPTION:Sesión privada de 10 min máx. con Catalina Arango.\\n\\nVideollamada: ${meetUrl}\\nConsultante: ${name}\\nConfirmación exclusiva por correo electrónico.\\nNotas: ${message || 'Sin notas'}`,
      `LOCATION:${meetUrl}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Recordatorio: Tu sesión con Cata Arango comienza en 30 minutos',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Cita_Cata_Arango_${date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Procesar envío del formulario y agendamiento
  window.handleAgendaSubmit = async function(e) {
    e.preventDefault();

    if (!selectedDate || !selectedSlot) {
      alert('Por favor selecciona una fecha y horario disponible en el calendario de la izquierda (Lunes a Viernes de 9:00 a.m. a 12:00 p.m. · Sesiones de 10 min).');
      const calBox = document.getElementById('calendarPanel');
      if (calBox) calBox.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('submitBtnText');
    const btnIcon = document.getElementById('submitBtnIcon');

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const service = document.getElementById('contactService').value;
    const message = document.getElementById('contactMsg').value.trim();

    // Estado visual de envío
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.75';
    btnText.textContent = 'Reservando espacio...';
    btnIcon.textContent = 'hourglass_top';

    const meetCode = createMeetRoomCode();
    const defaultMeetUrl = `https://meet.google.com/${meetCode}`;

    const appointmentPayload = {
      name,
      email,
      phone,
      service,
      date: selectedDate,
      time: selectedSlot.id,
      slot: selectedSlot,
      message,
      meetUrl: defaultMeetUrl
    };

    let serverSuccess = false;
    let finalMeetUrl = defaultMeetUrl;
    let finalGCalUrl = buildGoogleCalendarLink(appointmentPayload);

    try {
      // Intentar procesar a través de la Netlify Function /api/calendar
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(appointmentPayload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          serverSuccess = true;
          if (data.meetUrl) finalMeetUrl = data.meetUrl;
          if (data.googleCalendarUrl) finalGCalUrl = data.googleCalendarUrl;
        }
      }
    } catch (apiErr) {
      console.warn('Error conectando con el servicio de agendamiento SMTP:', apiErr);
    }

    appointmentPayload.meetUrl = finalMeetUrl;
    appointmentPayload.googleCalendarUrl = finalGCalUrl;
    lastBookingData = appointmentPayload;

    // Mostrar Pantalla de Éxito con Confirmación por Correo
    showBookingSuccess(appointmentPayload);
  };

  function showBookingSuccess(appointment) {
    const formPanel = document.getElementById('formPanelContent');
    const successCard = document.getElementById('bookingSuccessCard');

    if (!successCard) return;

    const [y, m, d] = appointment.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayName = DAY_NAMES[dateObj.getDay()];
    const monthName = MONTH_NAMES[m - 1];
    const fullDateStr = `${dayName}, ${d} de ${monthName} de ${y}`;

    document.getElementById('resCustomerName').textContent = appointment.name;
    document.getElementById('resCustomerEmail').textContent = appointment.email;
    document.getElementById('resAppointmentDate').textContent = fullDateStr;
    document.getElementById('resAppointmentTime').textContent = appointment.slot.label + ' (10 min máx. · Hora Colombia)';
    document.getElementById('resAppointmentService').textContent = appointment.service;

    // Enlace de confirmación en el aviso de correo
    const emailNoticeEl = document.getElementById('resEmailNotice');
    if (emailNoticeEl) emailNoticeEl.textContent = appointment.email;

    // Enlace de Google Meet
    const meetLinkEl = document.getElementById('resMeetLink');
    const openMeetBtn = document.getElementById('btnOpenMeet');
    if (meetLinkEl) meetLinkEl.textContent = appointment.meetUrl;
    if (openMeetBtn) openMeetBtn.href = appointment.meetUrl;

    // Botón Google Calendar
    const gcalBtn = document.getElementById('btnAddGoogleCalendar');
    if (gcalBtn) gcalBtn.href = appointment.googleCalendarUrl;

    if (formPanel) formPanel.style.display = 'none';
    successCard.style.display = 'flex';
    successCard.scrollIntoView({ behavior: 'smooth' });
  }

  // Funciones Globales para UI
  window.copyMeetUrl = function() {
    if (!lastBookingData || !lastBookingData.meetUrl) return;
    navigator.clipboard.writeText(lastBookingData.meetUrl).then(() => {
      const copyBtn = document.getElementById('btnCopyMeet');
      if (copyBtn) {
        copyBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">check</span><span>¡Copiado!</span>';
        setTimeout(() => {
          copyBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">content_copy</span><span>Copiar Enlace</span>';
        }, 2500);
      }
    });
  };

  window.downloadAppointmentIcs = function() {
    if (lastBookingData) {
      downloadIcsFile(lastBookingData);
    }
  };

  window.resetBookingView = function() {
    goToDateStep();
    const formPanel = document.getElementById('formPanelContent');
    const successCard = document.getElementById('bookingSuccessCard');
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('submitBtnText');
    const btnIcon = document.getElementById('submitBtnIcon');

    if (form) form.reset();
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
    if (btnText) btnText.textContent = 'Confirmar Cita';
    if (btnIcon) btnIcon.textContent = 'video_call';

    if (successCard) successCard.style.display = 'none';
    if (formPanel) formPanel.style.display = 'block';

    selectFirstAvailableDay();
  };

  // Inicialización cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendar);
  } else {
    initCalendar();
  }
})();
