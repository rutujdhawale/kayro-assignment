// Standard clinical consultation hours with 13:00 to 14:00 lunch break
const CLINIC_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

// Sample records from the assignment
const RAW_SAMPLE_DATA = [
  {
    id: 'apt-1',
    clientName: 'Riya Shah',
    phone: '+91 98200 11111',
    rawDate: '24/10/2026',
    rawTime: '10:00',
    status: 'Booked',
    confirmedArrival: false,
    reminderSent: false,
    rescheduleCount: 0,
    format: 'in-person'
  },
  {
    id: 'apt-2',
    clientName: 'Arjun Mehta',
    phone: '+91 98200 22222',
    rawDate: '2026-10-24',
    rawTime: '11:30am',
    status: 'Booked',
    confirmedArrival: true,
    reminderSent: true,
    rescheduleCount: 0,
    format: 'in-person'
  },
  {
    id: 'apt-3',
    clientName: 'Riya Shah',
    phone: '+91 98200 11111',
    rawDate: '25-10-2026',
    rawTime: '4 pm',
    status: 'Booked',
    confirmedArrival: false,
    reminderSent: false,
    rescheduleCount: 0,
    format: 'virtual'
  },
  {
    id: 'apt-4',
    clientName: 'Meera Iyer',
    phone: '',
    rawDate: '23/10/2026',
    rawTime: '09:00',
    status: 'Done',
    confirmedArrival: true,
    reminderSent: true,
    rescheduleCount: 0,
    format: 'in-person'
  },
  {
    id: 'apt-5',
    clientName: 'Kabir Rao',
    phone: '+91 98200 33333',
    rawDate: '22/10/2026',
    rawTime: '14:00',
    status: 'No-show',
    confirmedArrival: false,
    reminderSent: false,
    rescheduleCount: 0,
    format: 'virtual'
  }
];

function normalizeDateToISO(dateStr) {
  if (!dateStr) return '';
  const str = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parts = str.split(/[\/\-]/);
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return str;
}

function normalizeTimeTo24h(timeStr) {
  if (!timeStr) return '';
  const str = timeStr.trim().toLowerCase();
  if (str === '4 pm' || str === '4pm') return '16:00';
  if (str === '11:30am' || str === '11:30 am') return '11:30';
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const mins = match[2];
    if (str.includes('pm') && hours < 12) hours += 12;
    if (str.includes('am') && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${mins}`;
  }
  return timeStr;
}

function formatHumanTime(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${m} ${ampm}`;
}

function formatHumanDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function cleanPhone(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

function validatePhone(phoneStr) {
  if (!phoneStr) throw new Error('Phone number is required.');
  const digits = cleanPhone(phoneStr);
  if (digits.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number (e.g. 98200 11111).');
  }
  return digits;
}

function formatPhoneDisplay(phone) {
  if (!phone) return '';
  const digits = cleanPhone(phone);
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone.startsWith('+91') ? phone : `+91 ${phone}`;
}

const SYSTEM_TODAY = new Date().toISOString().split('T')[0];
// Allow today and future dates to be booked, while past archive dates (< 2026-10-23) are disabled
const MIN_BOOKABLE_DATE = SYSTEM_TODAY < '2026-10-23' ? SYSTEM_TODAY : '2026-10-23';
const TODAY_ISO = '2026-10-24';
const STORAGE_KEY = 'kayro_nourish_persistent_v3';
const CLIENT_PHONE_KEY = 'kayro_client_phone_v3';

// Persistent store syncing localStorage with local appointments.json
class AppointmentStore {
  constructor() {
    this.appointments = [];
    this.load();
    this.syncFromBackend();
  }

  load() {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        this.appointments = JSON.parse(cached);
        return;
      } catch (e) {}
    }
    this.reset();
  }

  reset() {
    this.appointments = RAW_SAMPLE_DATA.map(item => ({
      id: item.id,
      clientName: item.clientName,
      phone: item.phone,
      date: normalizeDateToISO(item.rawDate),
      time: normalizeTimeTo24h(item.rawTime),
      status: item.status,
      confirmedArrival: Boolean(item.confirmedArrival),
      reminderSent: Boolean(item.reminderSent),
      rescheduleCount: item.rescheduleCount || 0,
      format: item.format || 'in-person'
    }));
    this.save();
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.appointments));
    this.syncToBackend();
  }

  syncToBackend() {
    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.appointments)
    }).catch(() => {});
  }

  syncFromBackend() {
    fetch('/api/appointments', {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          this.appointments = data;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          renderClient();
          renderDashboard();
        }
      })
      .catch(() => {});
  }

  getAll() {
    return [...this.appointments].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }

  getByPhone(phone) {
    const cPhone = cleanPhone(phone);
    if (!cPhone) return [];
    return this.getAll().filter(item => cleanPhone(item.phone) === cPhone);
  }

  isSlotBooked(dateIso, timeSlot, excludeId = null) {
    return this.appointments.some(item => {
      if (excludeId && item.id === excludeId) return false;
      const holdsSlot = item.status === 'Booked' || item.status === 'Done';
      return item.date === dateIso && item.time === timeSlot && holdsSlot;
    });
  }

  addAppointment({ clientName, phone, date, time, status = 'Booked' }) {
    if (date < MIN_BOOKABLE_DATE) {
      throw new Error('Past dates cannot be booked.');
    }
    if (this.isSlotBooked(date, time)) {
      throw new Error(`Slot ${formatHumanTime(time)} on ${formatHumanDate(date)} is already taken.`);
    }

    const cleanP = cleanPhone(phone);
    const cleanN = clientName ? clientName.trim().toLowerCase() : '';

    // Check if client with same name or phone already has an active upcoming booking
    if (status === 'Booked') {
      const existing = this.appointments.find(a => {
        if (a.status !== 'Booked' || a.date < MIN_BOOKABLE_DATE) return false;
        const matchPhone = cleanP && cleanPhone(a.phone) === cleanP;
        const matchName = cleanN && a.clientName && a.clientName.trim().toLowerCase() === cleanN;
        return matchPhone || matchName;
      });

      if (existing) {
        throw new Error(`Already present! You already have an active booking on ${formatHumanDate(existing.date)} at ${formatHumanTime(existing.time)}.`);
      }
    }

    const newAppt = {
      id: 'apt-' + Date.now(),
      clientName: clientName.trim(),
      phone: cleanP ? formatPhoneDisplay(cleanP) : (phone ? phone.trim() : ''),
      date,
      time,
      status,
      confirmedArrival: false,
      reminderSent: false,
      rescheduleCount: 0,
      format: 'in-person'
    };
    this.appointments.push(newAppt);
    this.save();
    return newAppt;
  }

  updateStatus(id, newStatus) {
    const item = this.appointments.find(a => a.id === id);
    if (item) {
      item.status = newStatus;
      this.save();
    }
  }

  confirmArrival(id) {
    const item = this.appointments.find(a => a.id === id);
    if (item) {
      item.confirmedArrival = true;
      this.save();
    }
  }

  markReminderSent(id) {
    const item = this.appointments.find(a => a.id === id);
    if (item) {
      item.reminderSent = true;
      this.save();
      return item;
    }
    return null;
  }

  // Enforces 1-time reschedule rule per consultation
  reschedule(id, newDate, newTime) {
    if (newDate < MIN_BOOKABLE_DATE) {
      throw new Error('Cannot reschedule to a past date.');
    }
    const item = this.appointments.find(a => a.id === id);
    if (!item) throw new Error('Appointment not found.');

    if ((item.rescheduleCount || 0) >= 1) {
      throw new Error('This consultation has already been rescheduled once. Please message Dr. Maya on WhatsApp for further adjustments.');
    }

    if (this.isSlotBooked(newDate, newTime, id)) {
      throw new Error('Slot is taken. Please pick another open time.');
    }

    item.date = newDate;
    item.time = newTime;
    item.status = 'Booked';
    item.confirmedArrival = false;
    item.rescheduleCount = (item.rescheduleCount || 0) + 1;
    this.save();
    return item;
  }

  cancelAppointment(id) {
    const item = this.appointments.find(a => a.id === id);
    if (item) {
      item.status = 'Cancelled';
      item.confirmedArrival = false;
      this.save();
    }
  }
}

const store = new AppointmentStore();

// UI Elements
const UI = {
  viewClient: document.getElementById('viewClient'),
  viewDashboard: document.getElementById('viewDashboard'),
  doctorIntroSection: document.getElementById('doctorIntroSection'),
  clientPersonalView: document.getElementById('clientPersonalView'),
  btnEnterExistingPhone: document.getElementById('btnEnterExistingPhone'),
  btnExitClient: document.getElementById('btnExitClient'),
  clientPhoneLabel: document.getElementById('clientPhoneLabel'),
  btnSwitchPhone: document.getElementById('btnSwitchPhone'),
  greetingTitle: document.getElementById('greetingTitle'),
  nextConsultSection: document.getElementById('nextConsultationSection'),
  upcomingList: document.getElementById('upcomingList'),
  pastSection: document.getElementById('pastSection'),
  pastList: document.getElementById('pastList'),
  pastCount: document.getElementById('pastCount'),
  btnOpenBooking: document.getElementById('btnOpenBooking'),
  filterAll: document.getElementById('filterAll'),
  filterToday: document.getElementById('filterToday'),
  btnDownloadExcel: document.getElementById('btnDownloadExcel'),
  btnOpenAddManual: document.getElementById('btnOpenAddManual'),
  dashboardCards: document.getElementById('dashboardCards'),
  dashboardTableBody: document.getElementById('dashboardTableBody'),
  btnResetData: document.getElementById('btnResetData'),
  toast: document.getElementById('toastMessage'),

  // Modals
  bookingModal: document.getElementById('bookingModal'),
  btnCloseBooking: document.getElementById('btnCloseBooking'),
  bookingForm: document.getElementById('bookingForm'),
  bookName: document.getElementById('bookName'),
  bookPhone: document.getElementById('bookPhone'),
  bookDate: document.getElementById('bookDate'),
  bookSlotGrid: document.getElementById('bookSlotGrid'),
  bookSelectedSlot: document.getElementById('bookSelectedSlot'),
  bookSlotHint: document.getElementById('bookSlotHint'),
  btnSubmitBooking: document.getElementById('btnSubmitBooking'),

  rescheduleModal: document.getElementById('rescheduleModal'),
  btnCloseReschedule: document.getElementById('btnCloseReschedule'),
  rescheduleForm: document.getElementById('rescheduleForm'),
  reschedId: document.getElementById('reschedId'),
  reschedContextText: document.getElementById('reschedContextText'),
  reschedDate: document.getElementById('reschedDate'),
  reschedSlotGrid: document.getElementById('reschedSlotGrid'),
  reschedSelectedSlot: document.getElementById('reschedSelectedSlot'),
  reschedSlotHint: document.getElementById('reschedSlotHint'),
  btnSubmitReschedule: document.getElementById('btnSubmitReschedule'),

  manualAddModal: document.getElementById('manualAddModal'),
  btnCloseManualAdd: document.getElementById('btnCloseManualAdd'),
  manualAddForm: document.getElementById('manualAddForm'),
  manualName: document.getElementById('manualName'),
  manualPhone: document.getElementById('manualPhone'),
  manualDate: document.getElementById('manualDate'),
  manualSlotGrid: document.getElementById('manualSlotGrid'),
  manualSelectedSlot: document.getElementById('manualSelectedSlot'),
  manualStatus: document.getElementById('manualStatus'),
  manualSlotHint: document.getElementById('manualSlotHint'),
  btnSubmitManualAdd: document.getElementById('btnSubmitManualAdd'),

  switchPhoneModal: document.getElementById('switchPhoneModal'),
  btnCloseSwitchPhone: document.getElementById('btnCloseSwitchPhone'),
  switchPhoneForm: document.getElementById('switchPhoneForm'),
  switchPhoneInput: document.getElementById('switchPhoneInput'),
  btnSubmitSwitchPhone: document.getElementById('btnSubmitSwitchPhone')
};

let currentDashboardFilter = 'all';

function showToast(msg) {
  UI.toast.textContent = msg;
  UI.toast.classList.add('show');
  setTimeout(() => UI.toast.classList.remove('show'), 3000);
}

function getActiveClientPhone() {
  return localStorage.getItem(CLIENT_PHONE_KEY) || '';
}

function setActiveClientPhone(phone) {
  localStorage.setItem(CLIENT_PHONE_KEY, phone);
  renderClient();
}

function handleRoute() {
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const isDashboard = hash.includes('dashboard') || path.endsWith('/dashboard');

  if (isDashboard) {
    UI.viewClient.style.display = 'none';
    UI.viewDashboard.style.display = 'block';
    renderDashboard();
  } else {
    UI.viewDashboard.style.display = 'none';
    UI.viewClient.style.display = 'block';
    renderClient();
  }
}

function applyMinDateConstraints() {
  [UI.bookDate, UI.reschedDate, UI.manualDate].forEach(input => {
    if (input) input.min = MIN_BOOKABLE_DATE;
  });
}

// Populates slot buttons with clear Free vs Taken status
function populateSlots(container, hiddenInput, hint, dateIso, excludeId = null) {
  container.innerHTML = '';
  hiddenInput.value = '';

  if (!dateIso) {
    hint.textContent = 'Pick a date to view available times.';
    return;
  }

  if (dateIso < MIN_BOOKABLE_DATE) {
    hint.textContent = 'Past dates cannot be selected.';
    return;
  }

  hint.textContent = `Slots for ${formatHumanDate(dateIso)}:`;

  let firstAvailableSlot = null;
  let firstAvailableBtn = null;

  CLINIC_SLOTS.forEach(slot => {
    const isTaken = store.isSlotBooked(dateIso, slot, excludeId);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot-btn';
    btn.dataset.slot = slot;

    if (isTaken) {
      btn.disabled = true;
      btn.innerHTML = `<span>${formatHumanTime(slot)}</span><span class="slot-sub-tag taken">Taken</span>`;
    } else {
      btn.innerHTML = `<span>${formatHumanTime(slot)}</span><span class="slot-sub-tag">Free</span>`;
      btn.addEventListener('click', () => {
        container.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        hiddenInput.value = slot;
      });
      if (!firstAvailableSlot) {
        firstAvailableSlot = slot;
        firstAvailableBtn = btn;
      }
    }
    container.appendChild(btn);
  });

  // Auto-select the first available slot by default so user has an active slot immediately
  if (firstAvailableBtn && firstAvailableSlot) {
    firstAvailableBtn.classList.add('selected');
    hiddenInput.value = firstAvailableSlot;
  }
}

// Render Client App
function renderClient() {
  const phone = getActiveClientPhone();

  // If no phone is active, show the doctor profile & direct booking CTA
  if (!phone) {
    if (UI.doctorIntroSection) UI.doctorIntroSection.style.display = 'block';
    if (UI.clientPersonalView) UI.clientPersonalView.style.display = 'none';
    return;
  }

  // Active client session: show personal bookings and controls
  if (UI.doctorIntroSection) UI.doctorIntroSection.style.display = 'none';
  if (UI.clientPersonalView) UI.clientPersonalView.style.display = 'block';

  UI.clientPhoneLabel.textContent = `Your phone: ${formatPhoneDisplay(phone)}`;

  const allForClient = store.getByPhone(phone);
  const clientName = allForClient.length > 0 ? allForClient[0].clientName.split(' ')[0] : 'there';
  UI.greetingTitle.textContent = `Hey, ${clientName}`;

  const upcomingBooked = allForClient.filter(a => a.status === 'Booked' && a.date >= MIN_BOOKABLE_DATE);
  const nextAppt = upcomingBooked[0];

  // Next appointment hero card
  if (nextAppt) {
    const canResched = (nextAppt.rescheduleCount || 0) < 1;
    UI.nextConsultSection.innerHTML = `
      <div class="hero-card">
        <div class="hero-tag">Next consultation</div>
        <div class="hero-time">${formatHumanTime(nextAppt.time)}</div>
        <div class="hero-date">${formatHumanDate(nextAppt.date)}</div>

        <div class="confirm-prompt">
          <div class="confirm-text">Still coming?</div>
          <div class="confirm-actions">
            ${
              nextAppt.confirmedArrival
                ? `<button class="btn-confirm is-confirmed">✓ Confirmed</button>`
                : `<button class="btn-confirm" onclick="handleConfirmArrival('${nextAppt.id}')">Yes, I'm coming</button>`
            }
            ${
              canResched
                ? `<button class="btn-pivot" onclick="openReschedule('${nextAppt.id}')">Reschedule</button>`
                : `<button class="btn-pivot" style="opacity: 0.6; cursor: not-allowed;" title="Rescheduled once already" onclick="showToast('Consultations can be rescheduled only once.')">Rescheduled (1/1)</button>`
            }
          </div>
        </div>

        <div class="card-footer-actions">
          ${
            canResched
              ? `<button class="action-link" onclick="openReschedule('${nextAppt.id}')">Reschedule</button>`
              : `<span class="action-link disabled" title="Reschedule limit reached">Rescheduled (1/1)</span>`
          }
          <button class="action-link danger" onclick="handleCancel('${nextAppt.id}')">Cancel consultation</button>
        </div>
      </div>
    `;
  } else {
    UI.nextConsultSection.innerHTML = `
      <div class="card empty-consult-card">
        <div style="font-size: 28px; margin-bottom: 8px;">🗓️</div>
        <div class="empty-title">No upcoming consultations</div>
        <div class="empty-sub">No sessions are currently scheduled for <strong>${formatPhoneDisplay(phone)}</strong>.</div>
        <button type="button" class="btn-book-empty" onclick="window.openBookingModal()">Book a consultation</button>
      </div>
    `;
  }

  // Upcoming list
  const otherUpcoming = upcomingBooked.slice(1);
  if (otherUpcoming.length === 0) {
    UI.upcomingList.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No additional upcoming sessions.</div>`;
  } else {
    UI.upcomingList.innerHTML = otherUpcoming.map(appt => {
      const canResched = (appt.rescheduleCount || 0) < 1;
      return `
        <div class="appt-card">
          <div class="appt-top">
            <div>
              <div class="appt-time">${formatHumanTime(appt.time)}</div>
              <div class="appt-date">${formatHumanDate(appt.date)}</div>
            </div>
            <span class="status-pill status-${appt.status.toLowerCase().replace(' ', '')}">${appt.status}</span>
          </div>
          <div class="appt-actions">
            ${
              canResched
                ? `<button class="action-link" onclick="openReschedule('${appt.id}')">Reschedule</button>`
                : `<span class="action-link disabled">Rescheduled (1/1)</span>`
            }
            <button class="action-link danger" onclick="handleCancel('${appt.id}')">Cancel</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Past list
  const past = allForClient.filter(a => a.status === 'Done' || a.status === 'No-show' || a.status === 'Cancelled' || a.date < MIN_BOOKABLE_DATE);
  UI.pastCount.textContent = past.length;
  if (past.length === 0) {
    UI.pastList.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 8px 0;">No past consultations.</div>`;
  } else {
    UI.pastList.innerHTML = past.map(appt => {
      let note = '';
      if (appt.status === 'Cancelled') note = '• Cancelled by client (slot freed)';
      else if (appt.status === 'Done') note = '• Completed consultation';
      else if (appt.status === 'No-show') note = '• Missed consultation';

      return `
        <div class="appt-card">
          <div class="appt-top">
            <div>
              <div class="appt-time">${formatHumanTime(appt.time)}</div>
              <div class="appt-date">${formatHumanDate(appt.date)}</div>
              ${note ? `<div class="past-note">${note}</div>` : ''}
            </div>
            <span class="status-pill status-${appt.status.toLowerCase().replace(' ', '')}">${appt.status}</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Render Nutritionist Dashboard
function renderDashboard() {
  const all = store.getAll();
  const visible = currentDashboardFilter === 'today'
    ? all.filter(a => a.date === TODAY_ISO)
    : all;

  // Cards for mobile
  UI.dashboardCards.innerHTML = visible.length === 0
    ? `<div class="card" style="text-align: center; color: var(--text-muted); font-size: 13px;">No consultations found.</div>`
    : visible.map(appt => {
        const clean = cleanPhone(appt.phone);
        const waLink = clean
          ? `https://wa.me/91${clean}?text=${encodeURIComponent(`Hi ${appt.clientName}, looking forward to our consultation today at ${formatHumanTime(appt.time)}.`)}`
          : null;
        const isRisk = appt.status === 'Booked' && !appt.confirmedArrival;

        return `
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <div>
                <strong style="font-size: 14px;">${appt.clientName}</strong>
                <div style="font-size: 12px; color: var(--text-muted);">
                  ${appt.phone ? `<a href="tel:${clean}" style="color: inherit; text-decoration: none;">${formatPhoneDisplay(appt.phone)}</a>` : 'No phone'}
                </div>
              </div>
              <select class="select-status status-${appt.status.toLowerCase().replace(' ', '')}" onchange="handleStatusChange('${appt.id}', this.value)">
                <option value="Booked" ${appt.status === 'Booked' ? 'selected' : ''}>Booked</option>
                <option value="Done" ${appt.status === 'Done' ? 'selected' : ''}>Done</option>
                <option value="No-show" ${appt.status === 'No-show' ? 'selected' : ''}>No-show</option>
                <option value="Cancelled" ${appt.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </div>

            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">
              ${formatHumanDate(appt.date)} at ${formatHumanTime(appt.time)}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 8px;">
              <div>
                ${appt.confirmedArrival ? `<span class="marker-confirmed">✓ Confirmed</span>` : ''}
                ${isRisk ? `<span class="marker-risk">⚠️ Unconfirmed</span>` : ''}
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                ${
                  appt.reminderSent
                    ? `<span class="remind-sent">✓ Sent</span>`
                    : `<button class="btn-remind" onclick="handleSendReminder('${appt.id}')">Remind</button>`
                }
                ${waLink ? `<a href="${waLink}" target="_blank" class="link-wa">WhatsApp</a>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');

  // Table for desktop
  UI.dashboardTableBody.innerHTML = visible.length === 0
    ? `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No consultations found.</td></tr>`
    : visible.map(appt => {
        const clean = cleanPhone(appt.phone);
        const waLink = clean
          ? `https://wa.me/91${clean}?text=${encodeURIComponent(`Hi ${appt.clientName}, looking forward to our consultation today at ${formatHumanTime(appt.time)}.`)}`
          : null;
        const isRisk = appt.status === 'Booked' && !appt.confirmedArrival;

        return `
          <tr>
            <td><strong>${appt.clientName}</strong></td>
            <td>${appt.phone ? `<a href="tel:${clean}" style="color: inherit; text-decoration: none;">${formatPhoneDisplay(appt.phone)}</a>` : '<span style="color: var(--text-subtle);">None</span>'}</td>
            <td>${formatHumanDate(appt.date)}</td>
            <td>${formatHumanTime(appt.time)}</td>
            <td>
              <select class="select-status status-${appt.status.toLowerCase().replace(' ', '')}" onchange="handleStatusChange('${appt.id}', this.value)">
                <option value="Booked" ${appt.status === 'Booked' ? 'selected' : ''}>Booked</option>
                <option value="Done" ${appt.status === 'Done' ? 'selected' : ''}>Done</option>
                <option value="No-show" ${appt.status === 'No-show' ? 'selected' : ''}>No-show</option>
                <option value="Cancelled" ${appt.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </td>
            <td>
              ${appt.confirmedArrival ? `<span class="marker-confirmed">✓ Confirmed</span>` : ''}
              ${isRisk ? `<span class="marker-risk">⚠️ Unconfirmed</span>` : ''}
            </td>
            <td>
              ${
                appt.reminderSent
                  ? `<span class="remind-sent">✓ Sent</span>`
                  : `<button class="btn-remind" onclick="handleSendReminder('${appt.id}')">Remind</button>`
              }
            </td>
            <td>
              ${waLink ? `<a href="${waLink}" target="_blank" class="link-wa">WhatsApp</a>` : '<span style="color: var(--text-subtle);">-</span>'}
            </td>
          </tr>
        `;
      }).join('');
}

// Download Excel CSV function
function downloadExcel() {
  const all = store.getAll();
  const headers = ['Client Name', 'Phone', 'Date', 'Time', 'Status', 'Checked-In', 'Reminder Sent', 'Reschedules'];
  const rows = all.map(a => [
    `"${a.clientName}"`,
    `"${a.phone ? formatPhoneDisplay(a.phone) : ''}"`,
    `"${a.date}"`,
    `"${a.time}"`,
    `"${a.status}"`,
    `"${a.confirmedArrival ? 'Yes' : 'No'}"`,
    `"${a.reminderSent ? 'Yes' : 'No'}"`,
    `"${a.rescheduleCount || 0}"`
  ]);

  // Include UTF-8 BOM so Excel opens with correct encoding
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `kayro_consultations_${TODAY_ISO}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Consultations downloaded as Excel file');
}

// Global actions
window.handleStatusChange = function(id, val) {
  store.updateStatus(id, val);
  renderDashboard();
  renderClient();
  showToast(`Status updated to ${val}`);
};

window.handleConfirmArrival = function(id) {
  store.confirmArrival(id);
  renderClient();
  renderDashboard();
  showToast('Spot confirmed with Dr. Maya!');
};

window.handleSendReminder = function(id) {
  const appt = store.markReminderSent(id);
  renderDashboard();
  if (appt) {
    showToast(`Reminder sent to ${appt.clientName}`);
  }
};

window.handleCancel = function(id) {
  store.cancelAppointment(id);
  renderClient();
  renderDashboard();
  
  // Auto-expand past consultations so user immediately sees the cancelled consultation
  const pastDetails = document.getElementById('pastSection');
  if (pastDetails) pastDetails.open = true;

  showToast('Consultation cancelled. Your spot has been freed.');
};

window.openReschedule = function(id) {
  const item = store.appointments.find(a => a.id === id);
  if (!item) return;

  if ((item.rescheduleCount || 0) >= 1) {
    showToast('Consultations can be rescheduled only once. Please contact Dr. Maya on WhatsApp.');
    return;
  }

  UI.reschedId.value = id;
  UI.reschedContextText.textContent = `${item.clientName} · Currently ${formatHumanDate(item.date)} at ${formatHumanTime(item.time)}`;
  UI.reschedDate.value = item.date >= MIN_BOOKABLE_DATE ? item.date : TODAY_ISO;
  populateSlots(UI.reschedSlotGrid, UI.reschedSelectedSlot, UI.reschedSlotHint, UI.reschedDate.value, id);
  UI.rescheduleModal.classList.add('open');
};

// Open booking modal
window.openBookingModal = function() {
  const phone = cleanPhone(getActiveClientPhone());
  UI.bookPhone.value = phone;
  UI.bookDate.value = TODAY_ISO;
  populateSlots(UI.bookSlotGrid, UI.bookSelectedSlot, UI.bookSlotHint, TODAY_ISO);
  UI.bookingModal.classList.add('open');
};

// Handlers for modal forms
function handleBookingSubmit(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  try {
    const rawName = UI.bookName.value.trim();
    if (!rawName || rawName.length < 2) {
      showToast('Please enter your full name (at least 2 characters).');
      UI.bookName.focus();
      return false;
    }

    const validPhone = validatePhone(UI.bookPhone.value);
    const date = UI.bookDate.value;
    if (!date) {
      showToast('Please choose a consultation date.');
      UI.bookDate.focus();
      return false;
    }

    const time = UI.bookSelectedSlot.value;
    if (!time) {
      showToast('Please tap an available 30-min slot.');
      return false;
    }

    store.addAppointment({
      clientName: rawName,
      phone: validPhone,
      date,
      time
    });

    setActiveClientPhone(validPhone);
    UI.bookingModal.classList.remove('open');
    renderClient();
    renderDashboard();
    showToast(`Consultation confirmed for ${formatHumanDate(date)} at ${formatHumanTime(time)}!`);
  } catch (err) {
    showToast(err.message);
  }
  return false;
}

function handleRescheduleSubmit(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const time = UI.reschedSelectedSlot.value;
  if (!time) {
    showToast('Please select a new time slot.');
    return false;
  }
  try {
    const updated = store.reschedule(UI.reschedId.value, UI.reschedDate.value, time);
    UI.rescheduleModal.classList.remove('open');
    renderClient();
    renderDashboard();
    showToast(`Rescheduled to ${formatHumanDate(updated.date)} at ${formatHumanTime(updated.time)} (1 of 1 reschedule used)`);
  } catch (err) {
    showToast(err.message);
  }
  return false;
}

function handleManualAddSubmit(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  try {
    const name = UI.manualName.value.trim();
    if (!name || name.length < 2) {
      showToast('Please enter a client name.');
      UI.manualName.focus();
      return false;
    }

    let phoneVal = UI.manualPhone.value.trim();
    if (phoneVal) phoneVal = validatePhone(phoneVal);

    const date = UI.manualDate.value;
    if (!date) {
      showToast('Please select a date.');
      UI.manualDate.focus();
      return false;
    }

    const time = UI.manualSelectedSlot.value;
    if (!time) {
      showToast('Please choose an available slot.');
      return false;
    }

    store.addAppointment({
      clientName: name,
      phone: phoneVal,
      date,
      time,
      status: UI.manualStatus.value
    });

    UI.manualAddModal.classList.remove('open');
    renderDashboard();
    renderClient();
    showToast(`Appointment added for ${name}!`);
  } catch (err) {
    showToast(err.message);
  }
  return false;
}

function handleSwitchPhoneSubmit(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  try {
    const valid = validatePhone(UI.switchPhoneInput.value);
    setActiveClientPhone(valid);
    UI.switchPhoneModal.classList.remove('open');
    showToast(`Loaded consultations for ${formatPhoneDisplay(valid)}`);
  } catch (err) {
    showToast(err.message);
    UI.switchPhoneInput.focus();
  }
  return false;
}

// Modal event bindings (both button clicks and form submits handled safely)
UI.btnOpenBooking.addEventListener('click', window.openBookingModal);
UI.btnCloseBooking.addEventListener('click', () => UI.bookingModal.classList.remove('open'));
UI.bookDate.addEventListener('change', (e) => populateSlots(UI.bookSlotGrid, UI.bookSelectedSlot, UI.bookSlotHint, e.target.value));

UI.bookingForm.addEventListener('submit', handleBookingSubmit);
if (UI.btnSubmitBooking) UI.btnSubmitBooking.addEventListener('click', handleBookingSubmit);

UI.btnCloseReschedule.addEventListener('click', () => UI.rescheduleModal.classList.remove('open'));
UI.reschedDate.addEventListener('change', (e) => populateSlots(UI.reschedSlotGrid, UI.reschedSelectedSlot, UI.reschedSlotHint, e.target.value, UI.reschedId.value));

UI.rescheduleForm.addEventListener('submit', handleRescheduleSubmit);
if (UI.btnSubmitReschedule) UI.btnSubmitReschedule.addEventListener('click', handleRescheduleSubmit);

UI.btnOpenAddManual.addEventListener('click', () => {
  UI.manualName.value = '';
  UI.manualPhone.value = '';
  UI.manualDate.value = TODAY_ISO;
  populateSlots(UI.manualSlotGrid, UI.manualSelectedSlot, UI.manualSlotHint, TODAY_ISO);
  UI.manualAddModal.classList.add('open');
});
UI.btnCloseManualAdd.addEventListener('click', () => UI.manualAddModal.classList.remove('open'));
UI.manualDate.addEventListener('change', (e) => populateSlots(UI.manualSlotGrid, UI.manualSelectedSlot, UI.manualSlotHint, e.target.value));

UI.manualAddForm.addEventListener('submit', handleManualAddSubmit);
if (UI.btnSubmitManualAdd) UI.btnSubmitManualAdd.addEventListener('click', handleManualAddSubmit);

UI.btnSwitchPhone.addEventListener('click', () => {
  UI.switchPhoneInput.value = cleanPhone(getActiveClientPhone());
  UI.switchPhoneModal.classList.add('open');
});
UI.btnCloseSwitchPhone.addEventListener('click', () => UI.switchPhoneModal.classList.remove('open'));

UI.switchPhoneForm.addEventListener('submit', handleSwitchPhoneSubmit);
if (UI.btnSubmitSwitchPhone) UI.btnSubmitSwitchPhone.addEventListener('click', handleSwitchPhoneSubmit);

if (UI.btnEnterExistingPhone) {
  UI.btnEnterExistingPhone.addEventListener('click', () => {
    UI.switchPhoneInput.value = '';
    UI.switchPhoneModal.classList.add('open');
  });
}

if (UI.btnExitClient) {
  UI.btnExitClient.addEventListener('click', () => {
    localStorage.removeItem(CLIENT_PHONE_KEY);
    renderClient();
    showToast('Returned to Dr. Maya Sen profile');
  });
}

// Dashboard controls
UI.filterAll.addEventListener('click', () => {
  currentDashboardFilter = 'all';
  UI.filterAll.classList.add('active');
  UI.filterToday.classList.remove('active');
  renderDashboard();
});

UI.filterToday.addEventListener('click', () => {
  currentDashboardFilter = 'today';
  UI.filterToday.classList.add('active');
  UI.filterAll.classList.remove('active');
  renderDashboard();
});

UI.btnDownloadExcel.addEventListener('click', downloadExcel);

UI.btnResetData.addEventListener('click', () => {
  if (confirm('Reset to original sample data?')) {
    store.reset();
    fetch('/api/reset', { method: 'POST' }).catch(() => {});
    renderClient();
    renderDashboard();
    showToast('Demo data reset');
  }
});

// Routing
window.addEventListener('hashchange', handleRoute);
window.addEventListener('popstate', handleRoute);

// Outside click modal dismissal
[UI.bookingModal, UI.rescheduleModal, UI.manualAddModal, UI.switchPhoneModal].forEach(m => {
  m.addEventListener('click', (e) => {
    if (e.target === m) m.classList.remove('open');
  });
});

// Initial boot
applyMinDateConstraints();
handleRoute();
