/* ============================================================
   HOME — Úvodní dashboard po přihlášení
   Shrnutí toho, co uživatele dnes čeká: úkoly, oslavenci, novinky,
   zásilky. Funguje pro všechny role.
   ============================================================ */
const Home = (() => {
  let unsubTasks = null;
  let unsubBoard = null;
  let unsubClients = null;
  let unsubShipments = null;
  let tasksCache = [];
  let boardCache = [];
  let clientsCache = [];
  let shipmentsCache = [];

  function render() {
    const container = document.getElementById('view-home');
    if (!container) return;

    const profile = Auth.getProfile();
    if (!profile) {
      container.innerHTML = '';
      return;
    }

    const name = profile.displayName || profile.email || '';
    const firstName = name.split(' ')[0] || name;
    const hour = new Date().getHours();
    const greeting = hour < 11 ? 'Dobré ráno' : hour < 18 ? 'Dobrý den' : 'Dobrý večer';

    container.innerHTML = `
      <div style="margin-bottom:24px">
        <h1 style="font-size:1.8rem;font-weight:700;color:var(--gray-900);margin:0;letter-spacing:-0.02em">${escapeHtml(greeting)}, ${escapeHtml(firstName)}.</h1>
        <div style="color:var(--gray-600);font-size:0.95rem;margin-top:4px">${formatTodayCs()}</div>
      </div>
      <div id="home-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:20px">
        <div class="card"><div style="color:var(--gray-500)">Načítám…</div></div>
      </div>
      <div id="home-sections" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px"></div>
    `;

    subscribeAll();
  }

  function subscribeAll() {
    const profile = Auth.getProfile();
    if (!profile) return;

    if (!unsubTasks) {
      unsubTasks = db.collection('tasks')
        .orderBy('createdAt', 'desc')
        .limit(300)
        .onSnapshot(
          snap => {
            const uid = profile.id, role = profile.role;
            tasksCache = snap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(t => t.assignedTo === uid || t.assignedRole === role || t.assignedRole === 'all' || Auth.isAdmin(profile));
            paint();
          },
          err => console.warn('home tasks', err.message)
        );
    }
    if (!unsubBoard) {
      unsubBoard = db.collection('board')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .onSnapshot(
          snap => {
            boardCache = snap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(b => !b.roles || b.roles.length === 0 || b.roles.includes('all') || b.roles.includes(profile.role) || Auth.isAdmin(profile));
            paint();
          },
          err => console.warn('home board', err.message)
        );
    }
    if (!unsubClients) {
      unsubClients = db.collection('clients')
        .orderBy('name')
        .limit(2000)
        .onSnapshot(
          snap => {
            clientsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            paint();
          },
          err => console.warn('home clients', err.message)
        );
    }
    // Shipments jen pro role, co k nim mají přístup
    const hasShip = ['admin', 'office', 'warehouse', 'sales_cz', 'sales_sk'].includes(profile.role) || Auth.isAdmin(profile);
    if (hasShip && !unsubShipments) {
      const myName = (profile.displayName || '').trim();
      let q = db.collection('shipments').orderBy('createdAt', 'desc').limit(200);
      if (profile.role === 'sales_cz' || profile.role === 'sales_sk') {
        q = db.collection('shipments').where('oz', '==', myName).orderBy('createdAt', 'desc').limit(200);
      }
      unsubShipments = q.onSnapshot(
        snap => { shipmentsCache = snap.docs.map(d => ({ id: d.id, ...d.data() })); paint(); },
        err => console.warn('home shipments', err.message)
      );
    }
  }

  function paint() {
    const statsEl = document.getElementById('home-stats');
    const sectEl = document.getElementById('home-sections');
    if (!statsEl || !sectEl) return;

    const profile = Auth.getProfile();
    const now = new Date();
    const myTasks = tasksCache.filter(t => t.status !== 'done');
    const overdue = myTasks.filter(t => t.dueDate && parseDue(t.dueDate) < new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    const dueToday = myTasks.filter(t => t.dueDate && isSameDay(parseDue(t.dueDate), now) && !overdue.includes(t));
    const unreadBoard = boardCache.filter(b => {
      const last = (profile && profile.lastBoardReadAt) ? parseDue(profile.lastBoardReadAt) : null;
      return !last || (b.createdAt && parseDue(b.createdAt) > last);
    });

    const todayDDMM = String(now.getDate()).padStart(2, '0') + '.' + String(now.getMonth() + 1).padStart(2, '0');
    const celebTodayBirthday = clientsCache.filter(c => c.active !== false && (c.birthday || '').trim() === todayDDMM);
    const celebTodayNameday  = clientsCache.filter(c => c.active !== false && (c.nameday  || '').trim() === todayDDMM);
    const celebrantsToday = celebTodayBirthday.length + celebTodayNameday.length;

    const activeShipments = shipmentsCache.filter(s => s.pplStatus && s.pplStatus !== 'delivered' && s.pplStatus !== 'returned');

    // Stats grid
    statsEl.innerHTML = [
      statCard('Úkoly k vyřešení', myTasks.length, overdue.length ? `${overdue.length} po termínu` : (dueToday.length ? `${dueToday.length} na dnes` : 'Vše v pořádku'), 'tasks', overdue.length ? 'var(--danger)' : 'var(--accent)'),
      statCard('Dnešní oslavenci', celebrantsToday, celebrantsToday ? 'Klikni, pošli gratulaci' : 'Nikdo z klientů', 'clients', celebrantsToday ? 'var(--accent)' : 'var(--gray-300)'),
      statCard('Nové novinky', unreadBoard.length, unreadBoard.length ? 'Nepřečtené' : 'Vše přečteno', 'board', unreadBoard.length ? 'var(--primary)' : 'var(--gray-300)'),
      activeShipments.length || profile.role === 'warehouse' || Auth.isAdmin(profile)
        ? statCard('Aktivní zásilky', activeShipments.length, 'V přepravě', 'shipments', 'var(--primary)')
        : ''
    ].filter(Boolean).join('');

    // Sekce: úkoly po termínu / dnes, oslavenci dnes, poslední novinky
    let sections = '';

    if (overdue.length) {
      sections += sectionCard('Úkoly po termínu', 'var(--danger)', `
        ${overdue.slice(0, 8).map(renderTaskRow).join('')}
        ${overdue.length > 8 ? `<div style="text-align:center;margin-top:8px"><button class="btn btn-sm btn-outline" data-jump="tasks">Zobrazit všechny (${overdue.length})</button></div>` : ''}
      `);
    }
    if (dueToday.length) {
      sections += sectionCard('Na dnes', 'var(--accent-dark)', dueToday.map(renderTaskRow).join(''));
    }

    if (celebrantsToday) {
      let content = '';
      celebTodayBirthday.forEach(c => {
        content += `<div style="padding:8px 0;border-top:1px solid var(--gray-200);display:flex;justify-content:space-between;align-items:baseline"><strong>${escapeHtml(c.name || '')}</strong><span style="font-size:0.78rem;color:var(--gray-500)">narozeniny · ${escapeHtml(c.email || '')}</span></div>`;
      });
      celebTodayNameday.forEach(c => {
        content += `<div style="padding:8px 0;border-top:1px solid var(--gray-200);display:flex;justify-content:space-between;align-items:baseline"><strong>${escapeHtml(c.name || '')}</strong><span style="font-size:0.78rem;color:var(--gray-500)">svátek · ${escapeHtml(c.email || '')}</span></div>`;
      });
      sections += sectionCard('Oslavenci dnes', 'var(--accent)', content);
    }

    if (boardCache.slice(0, 3).length) {
      sections += sectionCard('Nejnovější novinky', 'var(--primary)', boardCache.slice(0, 3).map(b => `
        <div style="padding:10px 0;border-top:1px solid var(--gray-200)">
          <div style="font-weight:600;color:var(--gray-900)">${escapeHtml(b.title || '—')}</div>
          <div style="font-size:0.78rem;color:var(--gray-500);margin-top:2px">${b.authorName ? escapeHtml(b.authorName) + ' · ' : ''}${formatDate(b.createdAt)}</div>
          ${b.content ? `<div style="margin-top:6px;font-size:0.88rem;color:var(--gray-700);line-height:1.5">${escapeHtml(b.content.slice(0, 140))}${b.content.length > 140 ? '…' : ''}</div>` : ''}
        </div>
      `).join('') + `<div style="text-align:center;margin-top:10px"><button class="btn btn-sm btn-outline" data-jump="board">Všechny novinky</button></div>`);
    }

    if (activeShipments.length && (profile.role === 'warehouse' || Auth.isAdmin(profile) || profile.role === 'office')) {
      sections += sectionCard('Aktivní zásilky', 'var(--primary)', `
        <div style="color:var(--gray-600);font-size:0.88rem;margin-bottom:6px">${activeShipments.length} zásilek čeká na doručení</div>
        <button class="btn btn-sm btn-outline" data-jump="shipments">Otevřít Zásilky</button>
      `);
    }

    if (!sections) {
      sections = `<div class="card" style="text-align:center;padding:48px 24px"><div style="font-size:1rem;color:var(--gray-700);margin-bottom:8px">Žádné nevyřízené úkoly, žádní oslavenci, žádné nepřečtené novinky.</div><div style="color:var(--gray-500);font-size:0.9rem">Skvělá práce — využij klid k něčemu dobrému.</div></div>`;
    }

    sectEl.innerHTML = sections;

    // Clicks → přepnout modul
    container_clickJumps();
  }

  function container_clickJumps() {
    const container = document.getElementById('view-home');
    if (!container) return;
    container.querySelectorAll('[data-jump]').forEach(el => {
      if (el.dataset.jumpBound) return;
      el.dataset.jumpBound = '1';
      el.addEventListener('click', () => {
        const mod = el.dataset.jump;
        if (typeof App.switchModule === 'function') App.switchModule(mod);
      });
    });
  }

  function statCard(label, value, hint, jumpTo, accent) {
    return `<div class="card" data-jump="${jumpTo}" style="cursor:pointer;border-top:3px solid ${accent || 'var(--accent)'}">
      <div style="font-size:0.72rem;color:var(--gray-500);text-transform:uppercase;letter-spacing:1px;font-weight:700">${escapeHtml(label)}</div>
      <div style="font-size:2.2rem;font-weight:700;margin:6px 0 4px;color:var(--gray-900);line-height:1">${value}</div>
      <div style="font-size:0.82rem;color:var(--gray-600)">${escapeHtml(hint)}</div>
    </div>`;
  }

  function sectionCard(title, accent, content) {
    return `<div class="card" style="border-top:3px solid ${accent}">
      <div style="font-size:0.8rem;color:var(--gray-500);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:10px">${escapeHtml(title)}</div>
      ${content}
    </div>`;
  }

  function renderTaskRow(t) {
    const overdue = t.dueDate && parseDue(t.dueDate) < new Date(new Date().setHours(0,0,0,0));
    return `<div style="padding:8px 0;border-top:1px solid var(--gray-200);display:flex;justify-content:space-between;align-items:baseline;gap:12px">
      <div style="flex:1">
        <div style="font-weight:600;color:var(--gray-900)">${escapeHtml(t.title || '')}</div>
        ${t.assignedRole ? `<div style="font-size:0.75rem;color:var(--gray-500)">${escapeHtml(App.roleLabel ? App.roleLabel(t.assignedRole) : t.assignedRole)}${t.assignedTo && App.getUserName ? ' · ' + escapeHtml(App.getUserName(t.assignedTo) || '') : ''}</div>` : ''}
      </div>
      ${t.dueDate ? `<div style="font-size:0.78rem;font-weight:${overdue ? 700 : 500};color:${overdue ? 'var(--danger)' : 'var(--gray-600)'};white-space:nowrap">${App.formatDate(t.dueDate)}</div>` : ''}
    </div>`;
  }

  function parseDue(d) {
    if (!d) return new Date('9999-12-31');
    if (d.toDate) return d.toDate();
    return new Date(d);
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function formatTodayCs() {
    const d = new Date();
    return d.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function formatDate(ts) {
    if (!ts) return '';
    try {
      const d = ts.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts));
      if (!d || isNaN(d.getTime())) return '';
      return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return ''; }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function destroy() {
    if (unsubTasks)     { unsubTasks(); unsubTasks = null; }
    if (unsubBoard)     { unsubBoard(); unsubBoard = null; }
    if (unsubClients)   { unsubClients(); unsubClients = null; }
    if (unsubShipments) { unsubShipments(); unsubShipments = null; }
  }

  return { render, destroy };
})();
