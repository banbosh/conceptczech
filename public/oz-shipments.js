/* ============================================================
   OZ-SHIPMENTS.JS — "Zásilky klientů" pro obchodní zástupce
   Zobrazuje zásilky, kde oz === currentUser.displayName
   ============================================================ */
const OzShipments = (() => {
  let unsubscribe = null;
  let rowsCache = [];
  let filterText = '';
  let filterStatus = '';

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

  function render() {
    const container = document.getElementById('view-oz-shipments');
    if (!container) return;

    const profile = Auth.getProfile();
    if (!profile) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Nepřihlášen.</div></div>';
      return;
    }

    // Jméno pro filtrování — porovnává se s polem oz na zásilce
    const myName = (profile.displayName || '').trim();

    let html = `<h1 class="page-title">Zásilky mých klientů</h1>`;

    html += `<div class="card mb-16">
      <div style="font-size:0.9rem;color:var(--gray-600);margin-bottom:12px">
        Zde vidíš všechny zásilky, které mají v poli "OZ" tvé jméno: <strong>${escapeHtml(myName || '—')}</strong>.
        Stav se aktualizuje automaticky každých 30 minut.
      </div>
      <div class="flex gap-8" style="flex-wrap:wrap">
        <input id="oz-filter-text" class="form-input" placeholder="Hledat tracking, klient, email, objednávka…" style="flex:1;min-width:200px">
        <select id="oz-filter-status" class="form-select" style="max-width:220px">
          <option value="">Všechny stavy</option>
          ${Object.entries(STATUS_LABELS).map(([k, v]) => `<option value="${k}">${v.text}</option>`).join('')}
        </select>
      </div>
    </div>`;

    html += `<div id="oz-shipments-list"><div class="spinner"></div></div>`;
    container.innerHTML = html;

    const searchInp = document.getElementById('oz-filter-text');
    const statusSel = document.getElementById('oz-filter-status');
    if (searchInp) searchInp.addEventListener('input', (e) => { filterText = e.target.value.toLowerCase(); paint(); });
    if (statusSel) statusSel.addEventListener('change', (e) => { filterStatus = e.target.value; paint(); });

    subscribe(myName);
  }

  function subscribe(myName) {
    if (unsubscribe) unsubscribe();
    const q = db.collection('shipments')
      .where('oz', '==', myName)
      .orderBy('createdAt', 'desc')
      .limit(500);

    unsubscribe = q.onSnapshot(snap => {
      rowsCache = [];
      snap.forEach(doc => rowsCache.push({ id: doc.id, ...doc.data() }));
      paint();
    }, err => {
      console.error('oz-shipments onSnapshot', err);
      const list = document.getElementById('oz-shipments-list');
      if (list) list.innerHTML = `<div class="empty-state"><div class="empty-state-text">Chyba při načítání: ${escapeHtml(err.message || '')}</div></div>`;
    });
  }

  function paint() {
    const list = document.getElementById('oz-shipments-list');
    if (!list) return;

    let filtered = rowsCache;
    if (filterText) {
      filtered = filtered.filter(r =>
        (r.trackingNum || '').toLowerCase().includes(filterText) ||
        (r.clientName || '').toLowerCase().includes(filterText) ||
        (r.recipientName || '').toLowerCase().includes(filterText) ||
        (r.recipientEmail || '').toLowerCase().includes(filterText) ||
        (r.orderNum || '').toLowerCase().includes(filterText)
      );
    }
    if (filterStatus) {
      filtered = filtered.filter(r => (r.pplStatus || 'unknown') === filterStatus);
    }

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-text">Žádné zásilky k zobrazení.</div></div>`;
      return;
    }

    let html = '<div class="cl-table-wrap"><table class="st-table" style="font-size:0.85rem"><thead><tr>';
    html += '<th>Stav</th><th>Klient</th><th>Příjemce</th><th>Objednávka</th><th>Tracking</th><th>Předáno</th><th>Poslední sync</th><th></th>';
    html += '</tr></thead><tbody>';

    filtered.forEach(r => {
      const st = STATUS_LABELS[r.pplStatus] || STATUS_LABELS.unknown;
      const trackingUrl = `https://www.ppl.cz/vyhledat-zasilku?parcelNumber=${encodeURIComponent(r.trackingNum)}`;
      html += `<tr>
        <td><span class="status-badge" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:${st.color}15;color:${st.color};font-weight:600;font-size:0.78rem;white-space:nowrap;letter-spacing:0.02em">
          <span style="width:6px;height:6px;border-radius:50%;background:${st.color};display:inline-block"></span>${st.text}
        </span></td>
        <td>${escapeHtml(r.clientName || '—')}</td>
        <td>
          <div>${escapeHtml(r.recipientName || '')}</div>
          <div style="font-size:0.75rem;color:var(--gray-500)">${escapeHtml(r.recipientEmail || '')}</div>
        </td>
        <td>${escapeHtml(r.orderNum || '—')}</td>
        <td style="font-family:ui-monospace,Menlo,Consolas,monospace"><strong>${escapeHtml(r.trackingNum || '')}</strong></td>
        <td style="white-space:nowrap">${formatDate(r.emailHandoverSentAt || r.createdAt)}</td>
        <td style="white-space:nowrap;font-size:0.75rem;color:var(--gray-500)">${formatDate(r.pplLastSyncAt) || '—'}</td>
        <td><a href="${trackingUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-outline">Sledovat</a></td>
      </tr>`;
    });

    html += '</tbody></table></div>';
    list.innerHTML = html;
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
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  }

  return { render, destroy };
})();
