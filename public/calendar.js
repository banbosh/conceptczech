/* ============================================================
   CALENDAR MODULE — Marketing kalendar
   ============================================================ */
const Calendar = (() => {
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();
  let events = [];
  let unsubscribe = null;
  let detailEventId = null;
  let viewMode = 'month'; // month | week

  const EVENT_TYPES = {
    ig: { color: '#e1306c', labelKey: 'typeIG' },
    fb: { color: '#1877f2', labelKey: 'typeFB' },
    email: { color: '#43a047', labelKey: 'typeEmail' },
    hairdresser: { color: '#7b1fa2', labelKey: 'typeHairdresser' },
    customer: { color: '#ff9800', labelKey: 'typeCustomer' },
    news: { color: '#00bcd4', labelKey: 'typeNews' },
    deadline: { color: '#e53935', labelKey: 'typeDeadline' }
  };

  function render() {
    if (detailEventId) {
      renderDetail(detailEventId);
      return;
    }
    renderCalendar();
  }

  function renderCalendar() {
    const container = document.getElementById('view-calendar');

    let html = `<h1 class="page-title">${App.t('calendarTitle')}</h1>`;

    // View toggle
    html += `<div class="toolbar">
      <button class="filter-chip ${viewMode === 'month' ? 'active' : ''}" data-view="month">${App.t('viewMonth') || 'Měsíc'}</button>
      <button class="filter-chip ${viewMode === 'week' ? 'active' : ''}" data-view="week">${App.t('viewWeek') || 'Týden'}</button>
    </div>`;

    // Navigation
    html += `<div class="calendar-nav">
      <button class="calendar-nav-btn" id="cal-prev">&larr;</button>
      <span class="calendar-month-title">${App.t('months')[currentMonth]} ${currentYear}</span>
      <button class="calendar-nav-btn" id="cal-next">&rarr;</button>
    </div>`;

    // Legend
    html += `<div class="event-legend">`;
    Object.entries(EVENT_TYPES).forEach(([key, val]) => {
      html += `<div class="legend-item"><div class="event-color-dot" style="background:${val.color}"></div>${App.t(val.labelKey)}</div>`;
    });
    html += `</div>`;

    if (viewMode === 'month') {
      html += renderMonthGrid();
    } else {
      html += renderWeekGrid();
    }

    // Events list for the month/week
    html += `<div id="cal-events-list"></div>`;

    container.innerHTML = html;

    // Navigation
    container.querySelector('#cal-prev').addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar();
    });
    container.querySelector('#cal-next').addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar();
    });

    // View toggle
    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        if (viewMode === 'week') {
          const now = new Date();
          currentMonth = now.getMonth();
          currentYear = now.getFullYear();
        }
        renderCalendar();
      });
    });

    // Calendar cell clicks
    container.querySelectorAll('.calendar-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const date = cell.dataset.date;
        showDayEvents(date);
      });
    });

    // Subscribe to events
    subscribeEvents(container);
  }

  function renderMonthGrid() {
    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    let html = `<div class="calendar-grid">`;

    // Header
    dayKeys.forEach(d => {
      html += `<div class="calendar-header-cell">${App.t(d)}</div>`;
    });

    // Days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    let startDow = firstDay.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // Convert to Mon=0

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Previous month padding
    const prevMonthLast = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const day = prevMonthLast - i;
      html += `<div class="calendar-cell other-month"><span class="calendar-day">${day}</span></div>`;
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;

      // Find events for this day
      const dayEvents = events.filter(e => {
        const ed = e.date ? (e.date.toDate ? e.date.toDate() : new Date(e.date)) : null;
        if (!ed) return false;
        const eStr = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}-${String(ed.getDate()).padStart(2, '0')}`;
        return eStr === dateStr;
      });

      html += `<div class="calendar-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
        <span class="calendar-day">${d}</span>
        <div>${dayEvents.slice(0, 3).map(e => `<span class="calendar-dot" style="background:${(EVENT_TYPES[e.type] || {}).color || '#999'}"></span>`).join('')}</div>
      </div>`;
    }

    // Next month padding
    const totalCells = startDow + lastDay.getDate();
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      html += `<div class="calendar-cell other-month"><span class="calendar-day">${i}</span></div>`;
    }

    html += `</div>`;
    return html;
  }

  function renderWeekGrid() {
    // Find Monday of current week (always use real today)
    const now = new Date();
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0
    const monday = new Date(now);
    monday.setDate(now.getDate() - dow);

    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let html = `<div class="calendar-grid">`;
    dayKeys.forEach(d => {
      html += `<div class="calendar-header-cell">${App.t(d)}</div>`;
    });

    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const otherMonth = day.getMonth() !== currentMonth;

      const dayEvents = events.filter(e => {
        const ed = e.date ? (e.date.toDate ? e.date.toDate() : new Date(e.date)) : null;
        if (!ed) return false;
        const eStr = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}-${String(ed.getDate()).padStart(2, '0')}`;
        return eStr === dateStr;
      });

      html += `<div class="calendar-cell ${isToday ? 'today' : ''} ${otherMonth ? 'other-month' : ''}" data-date="${dateStr}">
        <span class="calendar-day">${day.getDate()}</span>
        <div>${dayEvents.map(e => `<span class="calendar-dot" style="background:${(EVENT_TYPES[e.type] || {}).color || '#999'}"></span>`).join('')}</div>
      </div>`;
    }

    html += `</div>`;
    return html;
  }

  function subscribeEvents(container) {
    if (unsubscribe) unsubscribe();

    // Get events for the visible month range (with some margin)
    const start = new Date(currentYear, currentMonth - 1, 1);
    const end = new Date(currentYear, currentMonth + 2, 0);

    unsubscribe = db.collection('calendar')
      .orderBy('date', 'asc')
      .onSnapshot(snap => {
        events = [];
        snap.forEach(doc => events.push({ id: doc.id, ...doc.data() }));
        renderEventsList(container);

        // Re-render dots on calendar cells
        container.querySelectorAll('.calendar-cell[data-date]').forEach(cell => {
          const dateStr = cell.dataset.date;
          const dayEvents = events.filter(e => {
            const ed = e.date ? (e.date.toDate ? e.date.toDate() : new Date(e.date)) : null;
            if (!ed) return false;
            const eStr = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}-${String(ed.getDate()).padStart(2, '0')}`;
            return eStr === dateStr;
          });
          const dotsEl = cell.querySelector('div');
          if (dotsEl) {
            dotsEl.innerHTML = dayEvents.slice(0, 3).map(e =>
              `<span class="calendar-dot" style="background:${(EVENT_TYPES[e.type] || {}).color || '#999'}"></span>`
            ).join('');
          }
        });
      });
  }

  function renderEventsList(container) {
    const listEl = container.querySelector('#cal-events-list');
    if (!listEl) return;

    // Filter events for current month
    const monthEvents = events.filter(e => {
      const ed = e.date ? (e.date.toDate ? e.date.toDate() : new Date(e.date)) : null;
      if (!ed) return false;
      return ed.getMonth() === currentMonth && ed.getFullYear() === currentYear;
    });

    if (monthEvents.length === 0) {
      listEl.innerHTML = `<div class="empty-state mt-16"><div class="empty-state-text">${App.t('noEvents')}</div></div>`;
      return;
    }

    listEl.innerHTML = monthEvents.map(e => {
      const typeInfo = EVENT_TYPES[e.type] || { color: '#999', labelKey: '' };
      return `<div class="event-list-item" data-event-id="${e.id}">
        <div class="event-color-dot" style="background:${typeInfo.color}"></div>
        <span class="event-list-title">${App.escapeHtml(e.title)}</span>
        <span class="event-list-date">${App.formatDate(e.date)}</span>
      </div>`;
    }).join('');

    listEl.querySelectorAll('.event-list-item').forEach(el => {
      el.addEventListener('click', () => {
        detailEventId = el.dataset.eventId;
        renderDetail(detailEventId);
      });
    });
  }

  function showDayEvents(dateStr) {
    const dayEvents = events.filter(e => {
      const ed = e.date ? (e.date.toDate ? e.date.toDate() : new Date(e.date)) : null;
      if (!ed) return false;
      const eStr = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}-${String(ed.getDate()).padStart(2, '0')}`;
      return eStr === dateStr;
    });

    if (dayEvents.length === 0) return;
    if (dayEvents.length === 1) {
      detailEventId = dayEvents[0].id;
      renderDetail(detailEventId);
      return;
    }

    // Show list of events for that day
    let html = `<div class="modal-header">
      <h3 class="modal-title">${dateStr}</h3>
      <button class="modal-close" id="modal-close-btn">&times;</button>
    </div>`;
    html += dayEvents.map(e => {
      const typeInfo = EVENT_TYPES[e.type] || { color: '#999' };
      return `<div class="event-list-item" data-event-id="${e.id}" style="cursor:pointer">
        <div class="event-color-dot" style="background:${typeInfo.color}"></div>
        <span class="event-list-title">${App.escapeHtml(e.title)}</span>
      </div>`;
    }).join('');

    App.openModal(html);
    document.getElementById('modal-close-btn').addEventListener('click', App.closeModal);
    document.querySelectorAll('#modal-content .event-list-item').forEach(el => {
      el.addEventListener('click', () => {
        App.closeModal();
        detailEventId = el.dataset.eventId;
        renderDetail(detailEventId);
      });
    });
  }

  /* ---------- Detail ---------- */
  function renderDetail(eventId) {
    const container = document.getElementById('view-calendar');
    const event = events.find(e => e.id === eventId);
    if (!event) {
      detailEventId = null;
      renderCalendar();
      return;
    }

    const profile = Auth.getProfile();
    const isAdm = Auth.isAdmin(profile);
    const typeInfo = EVENT_TYPES[event.type] || { color: '#999', labelKey: '' };

    let html = `
      <button class="detail-back" id="cal-back">&larr; ${App.t('back')}</button>
      <div class="card">
        <div class="flex items-center gap-8 mb-8">
          <div class="event-color-dot" style="background:${typeInfo.color};width:14px;height:14px"></div>
          <span class="badge" style="background:${typeInfo.color};color:#fff">${App.t(typeInfo.labelKey)}</span>
        </div>
        <h2 class="card-title" style="font-size:1.1rem">${App.escapeHtml(event.title)}</h2>
        <div class="card-meta">${App.formatDate(event.date)}</div>
        ${event.description ? `<div class="card-body mt-8" style="white-space:pre-wrap">${App.escapeHtml(event.description)}</div>` : ''}
        ${isAdm ? `<div class="mt-16"><button class="btn btn-sm btn-danger" id="cal-delete">${App.t('delete')}</button></div>` : ''}
      </div>`;

    html += `<div class="comments-section" id="cal-comments"><div class="spinner"></div></div>`;
    html += `<div class="comment-input-row mt-8">
      <input class="form-input" id="cal-comment-input" placeholder="${App.t('comment')}...">
      <button class="btn btn-sm btn-primary" id="cal-comment-add">${App.t('addComment')}</button>
    </div>`;

    container.innerHTML = html;

    container.querySelector('#cal-back').addEventListener('click', () => {
      detailEventId = null;
      renderCalendar();
    });

    const delBtn = container.querySelector('#cal-delete');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (confirm(App.t('delete') + '?')) {
          await db.collection('calendar').doc(eventId).delete();
          App.logActivity('calendar_delete', event.title);
          detailEventId = null;
          renderCalendar();
        }
      });
    }

    Tasks.loadComments(eventId, 'calendar', container.querySelector('#cal-comments'));

    container.querySelector('#cal-comment-add').addEventListener('click', () => {
      const input = container.querySelector('#cal-comment-input');
      if (input.value.trim()) {
        Tasks.addComment(eventId, 'calendar', input.value.trim());
        input.value = '';
      }
    });

    container.querySelector('#cal-comment-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') container.querySelector('#cal-comment-add').click();
    });
  }

  /* ---------- Add Event Modal ---------- */
  function showAddModal() {
    let typeOptions = Object.entries(EVENT_TYPES).map(([key, val]) =>
      `<option value="${key}">${App.t(val.labelKey)}</option>`
    ).join('');

    const html = `
      <div class="modal-header">
        <h3 class="modal-title">${App.t('addEvent')}</h3>
        <button class="modal-close" id="modal-close-btn">&times;</button>
      </div>
      <div class="form-group">
        <label class="form-label">${App.t('eventTitle')}</label>
        <input class="form-input" id="new-event-title" required>
      </div>
      <div class="form-group">
        <label class="form-label">${App.t('eventDate')}</label>
        <input type="date" class="form-input" id="new-event-date" required>
      </div>
      <div class="form-group">
        <label class="form-label">${App.t('eventType')}</label>
        <select class="form-select" id="new-event-type">${typeOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">${App.t('eventDesc')}</label>
        <textarea class="form-textarea" id="new-event-desc"></textarea>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-primary flex-1" id="save-event-btn">${App.t('save')}</button>
        <button class="btn btn-outline" id="cancel-event-btn">${App.t('cancel')}</button>
      </div>`;

    App.openModal(html);
    document.getElementById('modal-close-btn').addEventListener('click', App.closeModal);
    document.getElementById('cancel-event-btn').addEventListener('click', App.closeModal);
    document.getElementById('save-event-btn').addEventListener('click', saveEvent);
  }

  async function saveEvent() {
    const title = document.getElementById('new-event-title').value.trim();
    const dateVal = document.getElementById('new-event-date').value;
    if (!title || !dateVal) return;

    // Parse date as local time (avoid UTC midnight → wrong day in CET timezone)
    const [y, m, d] = dateVal.split('-').map(Number);
    const localDate = new Date(y, m - 1, d, 12, 0, 0); // noon local time

    await db.collection('calendar').add({
      title,
      date: localDate,
      type: document.getElementById('new-event-type').value,
      description: document.getElementById('new-event-desc').value.trim(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    App.logActivity('calendar_create', title);
    App.closeModal();
    App.toast(App.t('addEvent') + ': ' + title, 'success');
  }

  return { render, showAddModal };
})();
