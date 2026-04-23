/* ============================================================
   OZ-HUB — Dashboard obchodního zástupce
   Tabs: Přehled | Moje zásilky | Moji klienti | Moje úkoly | Novinky
   Filtrováno podle: oz (v kolekcích) === currentUser.displayName
   ============================================================ */
const OzShipments = (() => {
  let activeTab = 'overview';
  let unsubShipments = null;
  let unsubClients = null;
  let unsubTasks = null;
  let unsubBoard = null;
  let shipmentsCache = [];
  let clientsCache = [];
  let tasksCache = [];
  let boardCache = [];
  let filterShipmentStatus = '';
  let filterText = '';

  const STATUS_LABELS = {
    created:           { text: 'Vytvořeno',        color: '#64748b' },
    handed_to_courier: { text: 'Předáno dopravci', color: '#d97706' },
    in_transit:        { text: 'V přepravě',        color: '#1e40af' },
    out_for_delivery:  { text: 'Dnes doručeno',     color: '#047857' },
    delivered:         { text: 'Doručeno',          color: '#047857' },
    returned:          { text: 'Vráceno',           color: '#dc2626' },
    problem:           { text: 'Problém',           color: '#b45309' },
    unknown:           { text: 'Neznámý',           color: '#94a3b8' },
  };

  function getMyName() {
    const p = Auth.getProfile();
    return ((p && p.displayName) || '').trim();
  }

  function render() {
    const container = document.getElementById('view-oz-shipments');
    if (!container) return;

    const myName = getMyName();
    if (!myName) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Nejdříve si vyplň jméno v profilu.</div></div>';
      return;
    }

    let html = `<h1 class="page-title">Můj přehled</h1>`;
    html += `<div style="color:var(--gray-600);margin-bottom:16px;font-size:0.9rem">
      Dashboard pro tebe jako OZ: <strong>${escapeHtml(myName)}</strong>. Vidíš zásilky svých klientů, jejich seznam, své úkoly a nejnovější zprávy z firmy.
    </div>`;

    // Tabs
    const tabs = [
      { id: 'overview',  label: 'Přehled' },
      { id: 'shipments', label: 'Zásilky' },
      { id: 'clients',   label: 'Klienti' },
      { id: 'tasks',     label: 'Úkoly' },
      { id: 'news',      label: 'Novinky' },
    ];
    html += `<div class="oz-tabs" style="display:flex;gap:4px;border-bottom:1px solid var(--gray-200);margin-bottom:16px;flex-wrap:wrap">`;
    tabs.forEach(t => {
      const active = t.id === activeTab;
      html += `<button class="oz-tab-btn" data-tab="${t.id}" style="padding:10px 18px;border:none;background:${active ? 'var(--primary)' : 'transparent'};color:${active ? 'var(--white)' : 'var(--gray-700)'};font-weight:600;font-size:0.9rem;border-radius:${active ? 'var(--radius) var(--radius) 0 0' : '0'};cursor:pointer;${active ? '' : 'border-bottom:2px solid transparent'}">${t.label}</button>`;
    });
    html += `</div>`;

    html += `<div id="oz-tab-content"></div>`;

    container.innerHTML = html;

    container.querySelectorAll('.oz-tab-btn').forEach(b => {
      b.addEventListener('click', () => {
        activeTab = b.dataset.tab;
        render();
      });
    });

    subscribeAll(myName);
    renderTab(myName);
  }

  function subscribeAll(myName) {
    // Shipments pro tohoto OZ
    if (!unsubShipments) {
      unsubShipments = db.collection('shipments')
        .where('oz', '==', myName)
        .orderBy('createdAt', 'desc')
        .limit(500)
        .onSnapshot(
          snap => { shipmentsCache = snap.docs.map(d => ({ id: d.id, ...d.data() })); if (activeTab === 'overview' || activeTab === 'shipments') renderTab(myName); },
          err => console.warn('shipments', err.message)
        );
    }
    // Clients pro tohoto OZ
    if (!unsubClients) {
      unsubClients = db.collection('clients')
        .orderBy('name')
        .limit(2000)
        .onSnapshot(
          snap => {
            clientsCache = snap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(c => (c.oz || '').trim() === myName);
            if (activeTab === 'overview' || activeTab === 'clients') renderTab(myName);
          },
          err => console.warn('clients', err.message)
        );
    }
    // Tasks pro mě (role nebo individuální přiřazení)
    if (!unsubTasks) {
      unsubTasks = db.collection('tasks')
        .orderBy('createdAt', 'desc')
        .limit(300)
        .onSnapshot(
          snap => {
            const profile = Auth.getProfile();
            const uid = profile ? profile.id : '';
            const role = profile ? profile.role : '';
            tasksCache = snap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(t => t.assignedTo === uid || t.assignedRole === role || t.assignedRole === 'all');
            if (activeTab === 'overview' || activeTab === 'tasks') renderTab(myName);
          },
          err => console.warn('tasks', err.message)
        );
    }
    // Board novinky (pro moji roli)
    if (!unsubBoard) {
      unsubBoard = db.collection('board')
        .orderBy('createdAt', 'desc')
        .limit(30)
        .onSnapshot(
          snap => {
            const profile = Auth.getProfile();
            const role = profile ? profile.role : '';
            boardCache = snap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(b => !b.roles || b.roles.length === 0 || b.roles.includes('all') || b.roles.includes(role));
            if (activeTab === 'overview' || activeTab === 'news') renderTab(myName);
          },
          err => console.warn('board', err.message)
        );
    }
  }

  function renderTab(myName) {
    const el = document.getElementById('oz-tab-content');
    if (!el) return;
    if (activeTab === 'overview')       el.innerHTML = renderOverview(myName);
    else if (activeTab === 'shipments') el.innerHTML = renderShipments();
    else if (activeTab === 'clients')   el.innerHTML = renderClients();
    else if (activeTab === 'tasks')     el.innerHTML = renderTasks();
    else if (activeTab === 'news')      el.innerHTML = renderNews();

    // Bind filters on shipments
    if (activeTab === 'shipments') {
      const s = el.querySelector('#oz-filter-text');
      const st = el.querySelector('#oz-filter-status');
      if (s) s.addEventListener('input', e => { filterText = e.target.value.toLowerCase(); el.querySelector('#oz-shipments-list').innerHTML = renderShipmentsTable(); });
      if (st) st.addEventListener('change', e => { filterShipmentStatus = e.target.value; el.querySelector('#oz-shipments-list').innerHTML = renderShipmentsTable(); });
    }
  }

  /* ========== Overview ========== */
  function renderOverview(myName) {
    const now = new Date();
    const activeShipments = shipmentsCache.filter(s => s.pplStatus !== 'delivered' && s.pplStatus !== 'returned');
    const deliveredThisMonth = shipmentsCache.filter(s => {
      if (s.pplStatus !== 'delivered') return false;
      const d = s.emailDeliveryDaySentAt || s.createdAt;
      const dt = d && d.toDate ? d.toDate() : null;
      return dt && dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    }).length;

    const myUid = (Auth.getProfile() || {}).id;
    const myTasks = tasksCache.filter(t => t.status !== 'done');
    const overdue = myTasks.filter(t => t.dueDate && parseDue(t.dueDate) < now);
    const dueToday = myTasks.filter(t => t.dueDate && isSameDay(parseDue(t.dueDate), now));

    const thisWeekBirthdays = getUpcomingCelebrants(clientsCache, 'birthday', 7);
    const thisWeekNamedays = getUpcomingCelebrants(clientsCache, 'nameday', 7);

    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:24px">
        ${statCard('Aktivní zásilky', activeShipments.length, 'Probíhá doručování', 'shipments')}
        ${statCard('Doručeno tento měsíc', deliveredThisMonth, 'Zásilky klientů', 'shipments')}
        ${statCard('Moji klienti', clientsCache.length, 'Salóny pod tebou', 'clients')}
        ${statCard('Moje úkoly', myTasks.length, overdue.length ? `${overdue.length} po termínu` : (dueToday.length ? `${dueToday.length} dnes` : 'Žádné po termínu'), 'tasks', overdue.length ? 'var(--danger)' : null)}
      </div>

      ${overdue.length ? `
        <div class="card" style="background:#fef2f2;border-color:#fecaca;margin-bottom:12px">
          <div style="font-weight:700;color:var(--danger);margin-bottom:8px">Úkoly po termínu (${overdue.length})</div>
          ${overdue.slice(0, 5).map(t => `<div style="padding:8px 0;border-top:1px solid #fecaca;font-size:0.9rem"><strong>${escapeHtml(t.title)}</strong> <span style="color:var(--gray-500)">· termín ${App.formatDate(t.dueDate)}</span></div>`).join('')}
        </div>
      ` : ''}

      ${dueToday.length ? `
        <div class="card" style="margin-bottom:12px">
          <div style="font-weight:700;margin-bottom:8px">Úkoly na dnes (${dueToday.length})</div>
          ${dueToday.map(t => `<div style="padding:8px 0;border-top:1px solid var(--gray-200);font-size:0.9rem"><strong>${escapeHtml(t.title)}</strong></div>`).join('')}
        </div>
      ` : ''}

      ${(thisWeekBirthdays.length || thisWeekNamedays.length) ? `
        <div class="card" style="margin-bottom:12px">
          <div style="font-weight:700;margin-bottom:10px">Oslavenci mezi mými klienty (příštích 7 dní)</div>
          ${thisWeekBirthdays.map(c => `<div style="padding:6px 0;font-size:0.88rem">${App.formatDate ? formatDayMonth(c.birthday) : c.birthday} · <strong>${escapeHtml(c.name)}</strong> — narozeniny</div>`).join('')}
          ${thisWeekNamedays.map(c => `<div style="padding:6px 0;font-size:0.88rem">${formatDayMonth(c.nameday)} · <strong>${escapeHtml(c.name)}</strong> — svátek</div>`).join('')}
        </div>
      ` : ''}

      ${boardCache.slice(0, 3).length ? `
        <div class="card">
          <div style="font-weight:700;margin-bottom:10px">Nejnovější firemní novinky</div>
          ${boardCache.slice(0, 3).map(b => `
            <div style="padding:10px 0;border-top:1px solid var(--gray-200)">
              <div style="font-weight:600">${escapeHtml(b.title || '—')}</div>
              <div style="color:var(--gray-500);font-size:0.78rem;margin-top:2px">${b.authorName ? escapeHtml(b.authorName) + ' · ' : ''}${formatDate(b.createdAt)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  function statCard(label, value, hint, tab, accent) {
    return `<div class="card" data-jump="${tab}" style="cursor:pointer;border-top:3px solid ${accent || 'var(--accent)'}">
      <div style="font-size:0.75rem;color:var(--gray-500);text-transform:uppercase;letter-spacing:1px;font-weight:600">${escapeHtml(label)}</div>
      <div style="font-size:2rem;font-weight:700;margin:6px 0 4px;color:var(--gray-900)">${value}</div>
      <div style="font-size:0.8rem;color:var(--gray-600)">${escapeHtml(hint)}</div>
    </div>`;
  }

  // Delegate click on stat cards in overview
  document.addEventListener('click', (e) => {
    const card = e.target.closest && e.target.closest('[data-jump]');
    if (!card) return;
    const hub = document.getElementById('view-oz-shipments');
    if (!hub || !hub.contains(card)) return;
    activeTab = card.dataset.jump;
    render();
  });

  /* ========== Shipments tab ========== */
  function renderShipments() {
    return `
      <div class="card mb-16" style="margin-bottom:12px">
        <div class="flex gap-8" style="flex-wrap:wrap">
          <input id="oz-filter-text" class="form-input" placeholder="Hledat tracking, klient, email, objednávka…" style="flex:1;min-width:200px">
          <select id="oz-filter-status" class="form-select" style="max-width:220px">
            <option value="">Všechny stavy</option>
            ${Object.entries(STATUS_LABELS).map(([k, v]) => `<option value="${k}" ${k === filterShipmentStatus ? 'selected' : ''}>${v.text}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="oz-shipments-list">${renderShipmentsTable()}</div>
    `;
  }

  function renderShipmentsTable() {
    let list = shipmentsCache;
    if (filterText) {
      list = list.filter(r =>
        (r.trackingNum || '').toLowerCase().includes(filterText) ||
        (r.clientName || '').toLowerCase().includes(filterText) ||
        (r.recipientName || '').toLowerCase().includes(filterText) ||
        (r.recipientEmail || '').toLowerCase().includes(filterText) ||
        (r.orderNum || '').toLowerCase().includes(filterText)
      );
    }
    if (filterShipmentStatus) {
      list = list.filter(r => (r.pplStatus || 'unknown') === filterShipmentStatus);
    }

    if (list.length === 0) {
      return `<div class="empty-state"><div class="empty-state-text">Žádné zásilky k zobrazení.</div></div>`;
    }

    let html = '<div class="cl-table-wrap"><table class="st-table" style="font-size:0.85rem"><thead><tr>';
    html += '<th>Stav</th><th>Klient</th><th>Příjemce</th><th>Objednávka</th><th>Tracking</th><th>Předáno</th><th></th>';
    html += '</tr></thead><tbody>';
    list.forEach(r => {
      const st = STATUS_LABELS[r.pplStatus] || STATUS_LABELS.unknown;
      const trackingUrl = `https://www.ppl.cz/vyhledat-zasilku?parcelNumber=${encodeURIComponent(r.trackingNum)}`;
      html += `<tr>
        <td><span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:${st.color}15;color:${st.color};font-weight:600;font-size:0.78rem"><span style="width:6px;height:6px;border-radius:50%;background:${st.color}"></span>${st.text}</span></td>
        <td>${escapeHtml(r.clientName || '—')}</td>
        <td><div>${escapeHtml(r.recipientName || '')}</div><div style="font-size:0.75rem;color:var(--gray-500)">${escapeHtml(r.recipientEmail || '')}</div></td>
        <td>${escapeHtml(r.orderNum || '—')}</td>
        <td style="font-family:ui-monospace,Menlo,Consolas,monospace"><strong>${escapeHtml(r.trackingNum || '')}</strong></td>
        <td style="white-space:nowrap">${formatDate(r.emailHandoverSentAt || r.createdAt)}</td>
        <td><a href="${trackingUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-outline">Sledovat</a></td>
      </tr>`;
    });
    html += '</tbody></table></div>';
    return html;
  }

  /* ========== Clients tab ========== */
  function renderClients() {
    if (clientsCache.length === 0) {
      return `<div class="empty-state"><div class="empty-state-text">Zatím žádní klienti přiřazení tomuto OZ. Admin ti je doplní v modulu Kadeřníci.</div></div>`;
    }

    const sorted = [...clientsCache].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    let html = '<div class="cl-table-wrap"><table class="st-table" style="font-size:0.88rem"><thead><tr>';
    html += '<th>Název</th><th>Kontakt</th><th>Email</th><th>Telefon</th><th>Město</th><th>Narozeniny</th>';
    html += '</tr></thead><tbody>';
    sorted.forEach(c => {
      html += `<tr>
        <td><strong>${escapeHtml(c.name || '')}</strong></td>
        <td>${escapeHtml(c.contactPerson || '—')}</td>
        <td>${c.email ? `<a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>` : '—'}</td>
        <td>${c.phone ? `<a href="tel:${escapeHtml(c.phone)}">${escapeHtml(c.phone)}</a>` : '—'}</td>
        <td>${escapeHtml(c.city || '—')}</td>
        <td>${escapeHtml(c.birthday || '—')}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
    return html;
  }

  /* ========== Tasks tab ========== */
  function renderTasks() {
    const now = new Date();
    const open = tasksCache.filter(t => t.status !== 'done');
    const done = tasksCache.filter(t => t.status === 'done');

    if (open.length === 0 && done.length === 0) {
      return `<div class="empty-state"><div class="empty-state-text">Zatím žádné úkoly. Až ti je zadá admin, uvidíš je zde.</div></div>`;
    }

    const row = (t, overdue) => {
      const pColor = t.priority === 'urgent' ? 'var(--danger)' : t.priority === 'high' ? 'var(--warning)' : 'var(--gray-300)';
      return `<div class="card" style="border-left:4px solid ${pColor};padding:12px 16px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline">
          <div style="flex:1">
            <div style="font-weight:600">${escapeHtml(t.title || '')}${t.status === 'done' ? ' <span style="color:var(--success);font-weight:400">· hotovo</span>' : ''}</div>
            ${t.description ? `<div style="color:var(--gray-600);margin-top:4px;font-size:0.85rem">${escapeHtml(t.description).replace(/\n/g, '<br>')}</div>` : ''}
          </div>
          <div style="text-align:right;min-width:100px">
            ${t.dueDate ? `<div style="font-size:0.78rem;color:${overdue ? 'var(--danger)' : 'var(--gray-600)'};font-weight:${overdue ? '700' : '500'}">${overdue ? 'PO TERMÍNU · ' : ''}${App.formatDate(t.dueDate)}</div>` : ''}
            ${t.createdBy ? `<div style="font-size:0.72rem;color:var(--gray-500);margin-top:2px">Zadal: ${escapeHtml(t.createdBy)}</div>` : ''}
          </div>
        </div>
      </div>`;
    };

    let html = '';
    if (open.length) {
      const sorted = [...open].sort((a, b) => {
        const pOrder = { urgent: 0, high: 1, normal: 2 };
        const pa = pOrder[a.priority] ?? 2, pb = pOrder[b.priority] ?? 2;
        if (pa !== pb) return pa - pb;
        const da = a.dueDate ? parseDue(a.dueDate).getTime() : Infinity;
        const db2 = b.dueDate ? parseDue(b.dueDate).getTime() : Infinity;
        return da - db2;
      });
      html += `<div style="font-weight:700;margin:0 0 8px 0;color:var(--gray-700);font-size:0.85rem;text-transform:uppercase;letter-spacing:1px">K vyřešení (${open.length})</div>`;
      sorted.forEach(t => { html += row(t, t.dueDate && parseDue(t.dueDate) < now); });
    }
    if (done.length) {
      html += `<div style="font-weight:700;margin:20px 0 8px 0;color:var(--gray-500);font-size:0.85rem;text-transform:uppercase;letter-spacing:1px">Hotovo (${done.length})</div>`;
      done.slice(0, 20).forEach(t => { html += row(t, false); });
    }
    return html;
  }

  /* ========== News tab ========== */
  function renderNews() {
    if (boardCache.length === 0) {
      return `<div class="empty-state"><div class="empty-state-text">Zatím žádné novinky.</div></div>`;
    }
    return boardCache.map(b => `
      <div class="card" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px">
          <div style="font-size:1.1rem;font-weight:700;color:var(--gray-900)">${escapeHtml(b.title || '—')}</div>
          <div style="font-size:0.78rem;color:var(--gray-500);white-space:nowrap">${formatDate(b.createdAt)}</div>
        </div>
        ${b.authorName ? `<div style="font-size:0.78rem;color:var(--gray-500);margin-top:2px">${escapeHtml(b.authorName)}</div>` : ''}
        ${b.imageUrl ? `<img src="${escapeHtml(b.imageUrl)}" style="max-width:100%;border-radius:6px;margin-top:10px">` : ''}
        ${b.content ? `<div style="margin-top:10px;line-height:1.6;color:var(--gray-800)">${escapeHtml(b.content).replace(/\n/g, '<br>')}</div>` : ''}
      </div>
    `).join('');
  }

  /* ========== Helpers ========== */
  function parseDue(d) {
    if (!d) return new Date('9999-12-31');
    if (d.toDate) return d.toDate();
    return new Date(d);
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function getUpcomingCelebrants(clients, field, daysAhead) {
    const now = new Date();
    const res = [];
    for (let i = 0; i <= daysAhead; i++) {
      const d = new Date(now); d.setDate(now.getDate() + i);
      const key = String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');
      clients.forEach(c => {
        if (c.active === false) return;
        if ((c[field] || '').trim() === key) res.push(c);
      });
    }
    return res;
  }

  function formatDayMonth(s) {
    return s || '';
  }

  function formatDate(ts) {
    if (!ts) return '';
    try {
      const d = ts.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts));
      if (!d || isNaN(d.getTime())) return '';
      return d.toLocaleString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function destroy() {
    if (unsubShipments) { unsubShipments(); unsubShipments = null; }
    if (unsubClients)   { unsubClients();   unsubClients = null; }
    if (unsubTasks)     { unsubTasks();     unsubTasks = null; }
    if (unsubBoard)     { unsubBoard();     unsubBoard = null; }
  }

  return { render, destroy };
})();
