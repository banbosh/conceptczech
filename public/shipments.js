/* ============================================================
   SHIPMENTS.JS — Zásilky / Expedice + odesílání emailů
   Concept Czech s.r.o.
   ============================================================ */

const Shipments = (() => {

  // Brevo volání přesunuto do Cloud Functions (functions/index.js: sendEmailViaBrevo).
  // Klíč už není v klientském kódu.

  // Řádky zásilek v aktuální session
  let rows = [];
  let sentLog = [];
  let logUnsubscribe = null;
  let clientsCache = [];       // pole klientů pro autocomplete
  let clientsById = new Map(); // lookup pro dohledání OZ

  function render() {
    const container = document.getElementById('view-shipments');
    if (!container) return;

    const profile = Auth.getProfile();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'office' && profile.role !== 'warehouse')) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-text">Nemáte přístup k této sekci.</div></div>`;
      return;
    }

    let html = `<h1 class="page-title">Zásilky &amp; Emaily</h1>`;

    html += `<div class="card mb-16">
      <div style="font-size:0.9rem;color:var(--gray-600);margin-bottom:12px">
        Nahraj PDF export z PPL portálu — tabulka se vyplní automaticky včetně emailů příjemců.
      </div>
      <div id="shipment-rows"></div>
      <div class="flex gap-8 mt-12" style="flex-wrap:wrap;align-items:center">
        <button class="btn btn-primary" id="btn-import-csv" style="font-size:0.95rem;padding:12px 20px">
          Nahrát PDF z PPL → automaticky vyplnit emaily
        </button>
        <button class="btn btn-outline btn-sm" id="btn-add-row">+ Přidat zásilku ručně</button>
        <button class="btn btn-outline btn-sm" id="btn-clear-rows">Vymazat vše</button>
        <input type="file" id="csv-file-input" accept=".csv,.pdf,.txt,.tsv,text/csv,application/pdf" style="display:none">
      </div>
      <div id="import-status" style="margin-top:12px;font-size:0.85rem"></div>

      <details style="margin-top:16px;border-top:1px solid var(--gray-200);padding-top:12px">
        <summary style="cursor:pointer;color:var(--gray-600);font-size:0.85rem;font-weight:600">Pokročilé možnosti</summary>
        <div class="flex gap-8" style="flex-wrap:wrap;margin-top:10px">
          <button class="btn btn-outline btn-sm" id="btn-paste-ppl">Vložit text z PPL</button>
          <button class="btn btn-outline btn-sm" id="btn-enrich-ppl">Doplnit emaily pro existující řádky</button>
          <button class="btn btn-outline btn-sm" id="btn-fetch-ppl">Načíst seznam z API (produkce)</button>
          <button class="btn btn-outline btn-sm" id="btn-test-ppl">Test PPL přihlášení</button>
          <button class="btn btn-outline btn-sm" id="btn-test-label">Vygenerovat testovací etiketu</button>
        </div>
        <div style="color:var(--gray-500);font-size:0.75rem;margin-top:8px">
          Tyhle akce se běžně nepotřebují. Použij je jen pokud hlavní nahrávání PDF nefunguje nebo testuješ PPL produkční API.
        </div>
      </details>
    </div>`;

    html += `<div class="card mb-16" id="email-preview-section" style="display:none">
      <div style="font-weight:700;margin-bottom:8px">Náhled emailu</div>
      <div id="email-preview-content" style="background:var(--gray-50);border-radius:8px;padding:12px;font-size:0.85rem"></div>
    </div>`;

    html += `<div class="flex gap-8 mb-24">
      <button class="btn btn-primary" id="btn-send-all" style="display:none">
        Odeslat všem zákazníkům (<span id="send-count">0</span>)
      </button>
      <button class="btn btn-outline btn-sm" id="btn-preview-email">Náhled emailu</button>
    </div>`;

    // Log odeslaných
    html += `<div class="admin-section">
      <div class="admin-section-title">Historie odeslaných emailů</div>
      <div id="shipment-log"><div class="spinner"></div></div>
    </div>`;

    container.innerHTML = html;

    // Pokud nemáme žádné řádky, přidej 3 prázdné
    if (rows.length === 0) {
      rows = [emptyRow(), emptyRow(), emptyRow()];
    }

    // Načti seznam klientů (pro autocomplete propojení se zásilkou)
    loadClients().then(() => {
      renderClientDatalist();
      renderRows(container);
    });

    renderRows(container);
    bindEvents(container);
    loadLog(container);
  }

  function emptyRow() {
    return { id: Date.now() + Math.random(), trackingNum: '', name: '', email: '', orderNum: '', clientId: '', oz: '' };
  }

  async function loadClients() {
    try {
      const snap = await db.collection('clients').orderBy('name').limit(2000).get();
      clientsCache = [];
      clientsById = new Map();
      snap.forEach(doc => {
        const c = { id: doc.id, ...doc.data() };
        clientsCache.push(c);
        clientsById.set(c.id, c);
      });
    } catch (e) {
      console.warn('loadClients failed:', e);
    }
  }

  function renderClientDatalist() {
    // Datalist se opakovaně použije u všech řádků
    if (document.getElementById('shipment-clients-list')) return;
    const dl = document.createElement('datalist');
    dl.id = 'shipment-clients-list';
    dl.innerHTML = clientsCache.map(c =>
      `<option data-id="${c.id}" value="${App.escapeHtml(c.name)}${c.city ? ' (' + App.escapeHtml(c.city) + ')' : ''}"></option>`
    ).join('');
    document.body.appendChild(dl);
  }

  function findClientByDisplay(display) {
    if (!display) return null;
    const val = String(display).trim();
    // Exact match "Název (Město)" nebo jen "Název"
    return clientsCache.find(c => {
      const a = c.name;
      const b = `${c.name}${c.city ? ' (' + c.city + ')' : ''}`;
      return a === val || b === val;
    }) || null;
  }

  function renderRows(container) {
    const el = container.querySelector('#shipment-rows');
    if (!el) return;

    const filledCount = rows.filter(r => r.trackingNum && r.email).length;
    const sendBtn = container.querySelector('#btn-send-all');
    const sendCount = container.querySelector('#send-count');
    if (sendBtn) {
      sendBtn.style.display = filledCount > 0 ? '' : 'none';
      if (sendCount) sendCount.textContent = filledCount;
    }

    el.innerHTML = `
      <div class="cl-table-wrap">
        <table class="st-table" style="font-size:0.85rem">
          <thead>
            <tr>
              <th style="width:150px">Číslo zásilky *</th>
              <th style="width:200px">Klient (volitelné)</th>
              <th style="width:160px">Jméno příjemce</th>
              <th>Email *</th>
              <th style="width:120px">Č. objednávky</th>
              <th style="width:40px"></th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, i) => {
              const linked = r.clientId ? clientsById.get(r.clientId) : null;
              const clientDisplay = linked ? `${linked.name}${linked.city ? ' (' + linked.city + ')' : ''}` : '';
              return `
              <tr data-idx="${i}">
                <td><input class="form-input row-tracking" style="font-size:0.8rem;padding:6px 8px" placeholder="44150009587" value="${App.escapeHtml(r.trackingNum)}" data-idx="${i}"></td>
                <td><input class="form-input row-client" list="shipment-clients-list" style="font-size:0.8rem;padding:6px 8px" placeholder="Napiš část názvu…" value="${App.escapeHtml(clientDisplay)}" data-idx="${i}"></td>
                <td><input class="form-input row-name" style="font-size:0.8rem;padding:6px 8px" placeholder="Jana Nováková" value="${App.escapeHtml(r.name)}" data-idx="${i}"></td>
                <td><input class="form-input row-email" style="font-size:0.8rem;padding:6px 8px" placeholder="email@example.com" value="${App.escapeHtml(r.email)}" data-idx="${i}" type="email"></td>
                <td><input class="form-input row-order" style="font-size:0.8rem;padding:6px 8px" placeholder="260100720" value="${App.escapeHtml(r.orderNum)}" data-idx="${i}"></td>
                <td><button class="btn btn-sm" style="background:none;color:var(--gray-400);padding:4px 6px" data-remove="${i}" title="Odstranit">✕</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    // Bind input changes
    el.querySelectorAll('.row-tracking').forEach(inp => {
      inp.addEventListener('input', e => { rows[+e.target.dataset.idx].trackingNum = e.target.value.trim(); updateSendButton(container); });
    });
    el.querySelectorAll('.row-client').forEach(inp => {
      inp.addEventListener('change', e => {
        const idx = +e.target.dataset.idx;
        const client = findClientByDisplay(e.target.value);
        if (client) {
          rows[idx].clientId = client.id;
          rows[idx].oz = client.oz || '';
          // Auto-doplnit jméno + email, pokud ještě prázdné
          if (!rows[idx].name && client.contactPerson) rows[idx].name = client.contactPerson;
          else if (!rows[idx].name) rows[idx].name = client.name;
          if (!rows[idx].email && client.email) rows[idx].email = client.email;
          renderRows(container);
        } else {
          rows[idx].clientId = '';
          rows[idx].oz = '';
        }
      });
    });
    el.querySelectorAll('.row-name').forEach(inp => {
      inp.addEventListener('input', e => { rows[+e.target.dataset.idx].name = e.target.value; });
    });
    el.querySelectorAll('.row-email').forEach(inp => {
      inp.addEventListener('input', e => { rows[+e.target.dataset.idx].email = e.target.value.trim(); updateSendButton(container); });
    });
    el.querySelectorAll('.row-order').forEach(inp => {
      inp.addEventListener('input', e => { rows[+e.target.dataset.idx].orderNum = e.target.value.trim(); });
    });
    el.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        rows.splice(+btn.dataset.remove, 1);
        renderRows(container);
      });
    });
  }

  function updateSendButton(container) {
    const filledCount = rows.filter(r => r.trackingNum && r.email).length;
    const sendBtn = container.querySelector('#btn-send-all');
    const sendCount = container.querySelector('#send-count');
    if (sendBtn) {
      sendBtn.style.display = filledCount > 0 ? '' : 'none';
      if (sendCount) sendCount.textContent = filledCount;
    }
  }

  function bindEvents(container) {
    container.querySelector('#btn-add-row').addEventListener('click', () => {
      rows.push(emptyRow());
      renderRows(container);
    });

    container.querySelector('#btn-clear-rows').addEventListener('click', () => {
      if (confirm('Vymazat všechny zásilky?')) {
        rows = [emptyRow(), emptyRow(), emptyRow()];
        renderRows(container);
      }
    });

    container.querySelector('#btn-preview-email').addEventListener('click', () => {
      const preview = container.querySelector('#email-preview-section');
      const previewContent = container.querySelector('#email-preview-content');
      const sampleTracking = rows.find(r => r.trackingNum)?.trackingNum || '44150009587';
      const sampleName = rows.find(r => r.name)?.name || 'Jana Nováková';
      const sampleOrder = rows.find(r => r.orderNum)?.orderNum || '2026000183';
      previewContent.innerHTML = buildEmailPreview(sampleTracking, sampleName, sampleOrder);
      preview.style.display = '';
      preview.scrollIntoView({ behavior: 'smooth' });
    });

    container.querySelector('#btn-send-all').addEventListener('click', () => sendAll(container));

    // Import souboru — CSV nebo PDF
    const fileInp = container.querySelector('#csv-file-input');
    container.querySelector('#btn-import-csv').addEventListener('click', () => fileInp.click());
    fileInp.addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const isPdf = /\.pdf$/i.test(f.name) || f.type === 'application/pdf';
      if (isPdf) handlePdfFile(f, container);
      else handleCsvFile(f, container);
      fileInp.value = '';
    });

    // Načíst zásilky z PPL API
    container.querySelector('#btn-fetch-ppl').addEventListener('click', () => fetchFromPPL(container));
    container.querySelector('#btn-test-ppl').addEventListener('click', () => testPPLLogin(container));
    container.querySelector('#btn-test-label').addEventListener('click', () => createTestLabel(container));
    container.querySelector('#btn-paste-ppl').addEventListener('click', () => openPastePPLModal(container));
    container.querySelector('#btn-enrich-ppl').addEventListener('click', () => enrichFromPPL(container));
  }

  async function enrichFromPPL(container, silent) {
    const statusEl = container.querySelector('#import-status');
    const btn = container.querySelector('#btn-enrich-ppl');
    // Vynecháme ty, co už email mají (ať zbytečně netěžíme API)
    const trackings = rows.map(r => r.trackingNum).filter((t, i) => t && t.length >= 8 && !rows[i].email);
    if (trackings.length === 0) {
      if (!silent) {
        statusEl.innerHTML = '<span style="color:var(--warning)">V tabulce není žádné tracking číslo bez emailu.</span>';
      }
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = `Doplňuji (${trackings.length}×)…`; }
    if (!silent) {
      statusEl.innerHTML = `<span style="color:var(--gray-600)">Volám PPL API pro ${trackings.length} zásilek…</span>`;
    }

    try {
      const fn = firebase.app().functions('europe-west1').httpsCallable('pplEnrichShipments');
      const res = await fn({ trackingNumbers: trackings });
      const d = res.data || {};

      if (!d.ok) {
        statusEl.innerHTML = `<span style="color:var(--danger)">Chyba PPL: ${escapeHtml(d.error || 'neznámá')}</span>`;
        return;
      }

      let filled = 0;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r.trackingNum || r.email) continue;
        const found = d.results && d.results[r.trackingNum];
        if (found && found.email) {
          r.email = found.email;
          if (!r.name && found.name) r.name = found.name;
          filled++;
        }
      }
      renderRows(container);

      const total = rows.filter(r => r.trackingNum).length;
      const withEmail = rows.filter(r => r.trackingNum && r.email).length;
      const missing = total - withEmail;
      statusEl.innerHTML = `<span style="color:var(--success)">Hotovo.</span>` +
        ` Zásilek: ${total}. Emailů vyplněno: ${withEmail}.` +
        (missing > 0
          ? ` <span style="color:var(--warning)">${missing} stále bez emailu — doplň ručně a stiskni Odeslat.</span>`
          : ` <span style="color:var(--success)">Vše připraveno k odeslání.</span>`);
    } catch (err) {
      console.error('enrich error', err);
      statusEl.innerHTML = `<span style="color:var(--danger)">Chyba: ${escapeHtml(err.message || err.code || String(err))}</span>`;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Doplnit emaily pro existující řádky'; }
    }
  }

  /* ============================================================
     Ruční vložení textu z PPL portálu
     (uživatel zkopíruje obsah stránky "Tisk - Seznam balíků"
     a vloží do textarea; vytáhneme tracking číslo + jméno + var. symbol)
     ============================================================ */
  function openPastePPLModal(container) {
    const html = `
      <div class="modal-header">
        <h3 class="modal-title">Vložit text z PPL</h3>
        <button class="modal-close" id="paste-close">&times;</button>
      </div>
      <div style="font-size:0.88rem;color:var(--gray-600);margin-bottom:12px;line-height:1.6">
        1. Na portálu <strong>klient.ppl.cz</strong> otevři <em>Tisk — Seznam balíků</em>.<br>
        2. Vyber zásilky, stiskni <strong>Ctrl + A</strong> → <strong>Ctrl + C</strong> (nebo jen to, co potřebuješ).<br>
        3. Vlož níže a klikni <em>Analyzovat</em>.
      </div>
      <textarea id="paste-ppl-text" class="form-textarea" style="min-height:220px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:0.82rem" placeholder="Vlož sem text z PPL..."></textarea>
      <div class="flex gap-8 mt-12">
        <button class="btn btn-primary" id="paste-parse">Analyzovat a naplnit tabulku</button>
        <button class="btn btn-outline" id="paste-cancel">Zrušit</button>
      </div>
    `;
    App.openModal(html);
    document.getElementById('paste-close').addEventListener('click', App.closeModal);
    document.getElementById('paste-cancel').addEventListener('click', App.closeModal);
    document.getElementById('paste-parse').addEventListener('click', () => {
      const text = document.getElementById('paste-ppl-text').value || '';
      const parsed = parsePPLText(text);
      if (parsed.length === 0) {
        App.toast('V textu jsem nenašel žádná tracking čísla.', 'error');
        return;
      }

      // Pokus o spárování jména s klientem v databázi (pro auto-email)
      const paired = parsed.map(p => {
        const match = matchClientByName(p.name);
        return {
          ...p,
          clientId: match ? match.id : '',
          email: match ? (match.email || '') : '',
          oz: match ? (match.oz || '') : '',
        };
      });

      const fresh = paired.map(p => {
        const r = emptyRow();
        r.trackingNum = p.trackingNum;
        r.name = p.name;
        r.email = p.email;
        r.orderNum = p.orderNum || '';
        r.clientId = p.clientId || '';
        r.oz = p.oz || '';
        return r;
      });

      const allEmpty = rows.every(r => !r.trackingNum && !r.email && !r.orderNum);
      rows = allEmpty ? fresh : rows.concat(fresh);
      renderRows(container);

      const matchedCount = paired.filter(p => p.email).length;
      const unmatched = paired.length - matchedCount;
      const statusEl = container.querySelector('#import-status');
      statusEl.innerHTML = `<span style="color:var(--success)">Naimportováno ${paired.length} zásilek.</span>` +
        ` <span style="color:var(--gray-700)">Z toho ${matchedCount} automaticky dohledáno v databázi klientů</span>` +
        (unmatched > 0 ? `, <span style="color:var(--warning)">${unmatched} bez emailu — doplň ručně</span>.` : '.');

      App.closeModal();
    });
  }

  function parsePPLText(text) {
    if (!text) return [];
    const results = [];
    const seen = new Set();

    // Rozdělíme text na "záznamy" — detekujeme řádky, které začínají
    // tracking číslem (8-14 číslic na začátku řádku, po whitespace).
    const trackingRe = /(?:^|\n)\s*(\d{9,14})\b([^\n]*)/g;

    let match;
    while ((match = trackingRe.exec(text)) !== null) {
      const trackingNum = match[1];
      if (seen.has(trackingNum)) continue;
      seen.add(trackingNum);

      // Za tracking číslem bývá na stejném řádku (nebo dalších) adresa a var. symbol
      const tail = match[2] || '';

      // Var. symbol: 6-10ciferné číslo oddělené whitespace, typicky 26xxxxxxx
      const vs = tail.match(/\b(2[56]\d{7,8})\b/);
      const orderNum = vs ? vs[1] : '';

      // Jméno/firma: text mezi PSČ a "/" oddělovačem
      // PPL print format: "PSČ Firma / Ulice / Město ..."
      let name = '';
      const psclabel = tail.match(/\b(\d{5})\s+([^/\n]+?)(?:\s*\/|,|$)/);
      if (psclabel) name = psclabel[2].trim();

      // Pokud na tom řádku jméno nenajdeme, zkus další řádek
      if (!name) {
        const afterIdx = match.index + match[0].length;
        const next = text.substring(afterIdx, afterIdx + 200);
        const nxt = next.match(/\b(\d{5})\s+([^/\n]+?)(?:\s*\/|,|$)/);
        if (nxt) name = nxt[2].trim();
      }

      results.push({
        trackingNum,
        name: (name || '').replace(/\s+/g, ' ').trim(),
        orderNum,
      });
    }

    return results;
  }

  function matchClientByName(nameRaw) {
    if (!nameRaw || clientsCache.length === 0) return null;
    const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    const needle = norm(nameRaw);
    if (!needle) return null;

    // 1) Přesná shoda normalizovaných názvů (name nebo contactPerson)
    let best = null, bestScore = 0;
    for (const c of clientsCache) {
      const hay1 = norm(c.name);
      const hay2 = norm(c.contactPerson);
      let score = 0;
      if (hay1 && (hay1 === needle || hay1.includes(needle) || needle.includes(hay1))) score = Math.max(score, 2);
      if (hay2 && (hay2 === needle || hay2.includes(needle) || needle.includes(hay2))) score = Math.max(score, 2);

      // 2) Shoda některého slova (např. příjmení)
      if (score < 2) {
        const needleWords = needle.split(' ').filter(w => w.length >= 3);
        const hayAll = (hay1 + ' ' + hay2).trim();
        const overlap = needleWords.filter(w => hayAll.includes(w)).length;
        if (overlap >= 2) score = Math.max(score, 1.5);
        else if (overlap === 1 && needleWords.length === 1) score = Math.max(score, 1);
      }

      if (score > bestScore) { bestScore = score; best = c; }
    }
    return bestScore >= 1 ? best : null;
  }

  async function createTestLabel(container) {
    const statusEl = container.querySelector('#import-status');
    const btn = container.querySelector('#btn-test-label');
    btn.disabled = true;
    btn.textContent = 'Generuji…';
    statusEl.innerHTML = '<span style="color:var(--gray-600)">Vytvářím testovací zásilku v PPL…</span>';

    try {
      const createFn = firebase.app().functions('europe-west1').httpsCallable('pplCreateTestShipment');
      const createRes = await createFn({});
      const c = createRes.data || {};

      if (!c.ok) {
        const attempts = (c.attempts || []).slice(0, 8).map(a => {
          const label = a.productType
            ? `ProductType: <code>${escapeHtml(a.productType)}</code>`
            : `<code>${escapeHtml(a.path || '(neznámá cesta)')}</code>`;
          const ok = a.productTypeOk ? ' <span style="color:var(--success)">(ProductType prošel!)</span>' : '';
          return `<div style="margin-top:4px">${label} → HTTP ${a.status || '?'}${ok}</div>
           <div style="color:var(--gray-600);margin-left:12px;font-size:0.8rem;word-break:break-all">${escapeHtml((a.response || '').slice(0, 400))}</div>`;
        }).join('');
        const more = c.attempts && c.attempts.length > 8 ? `<div style="color:var(--gray-500);margin-top:4px">… a dalších ${c.attempts.length - 8} pokusů</div>` : '';
        const schemaLine = c.schemaEnum && c.schemaEnum.length
          ? `<div style="color:var(--gray-700);margin-top:6px">OpenAPI schema (${escapeHtml(c.schemaUrl || '')}) vrátilo enum: <code>${c.schemaEnum.map(x => escapeHtml(x)).join(', ')}</code></div>`
          : '';
        const validLine = c.validProductFound
          ? `<div style="color:var(--success);margin-top:6px">Platný ProductType: <code>${escapeHtml(c.validProductFound)}</code> (selhala jiná pole)</div>`
          : '';
        statusEl.innerHTML = `<span style="color:var(--danger)">Vytvoření testovací zásilky selhalo.</span>
          ${c.error ? `<div style="color:var(--gray-700);margin-top:6px"><strong>${escapeHtml(c.error)}</strong></div>` : ''}
          ${schemaLine}
          ${validLine}
          ${attempts ? `<div style="margin-top:8px">${attempts}${more}</div>` : ''}`;
        return;
      }

      // Pokusíme se najít ID/tracking z odpovědi
      const shipmentData = c.shipment || {};
      const trackingNum =
        findFirst(shipmentData, ['shipmentNumber', 'ShipmentNumber', 'trackingNumber', 'TrackingNumber', 'number', 'id', 'Id']) ||
        (Array.isArray(shipmentData.shipments) && shipmentData.shipments[0] && (shipmentData.shipments[0].shipmentNumber || shipmentData.shipments[0].trackingNumber)) ||
        c.referenceId;

      statusEl.innerHTML = `<span style="color:var(--success)">Zásilka vytvořena! (${escapeHtml(c.path || '')}, HTTP ${c.status})</span>
        <div style="color:var(--gray-700);margin-top:6px">Tracking / ID: <code>${escapeHtml(trackingNum || '(nenalezeno v odpovědi)')}</code></div>
        <div style="color:var(--gray-600);margin-top:4px">Reference: <code>${escapeHtml(c.referenceId || '')}</code></div>
        <div style="color:var(--gray-600);margin-top:4px">Stahuji PDF etiketu…</div>`;

      // Teď stáhneme PDF etiketu
      if (!trackingNum) {
        statusEl.innerHTML += `<div style="color:var(--warning);margin-top:6px">Nemůžu stáhnout etiketu — nenašel jsem ID v odpovědi. Pošli mi prosím screenshot a doladíme.</div>
          <details style="margin-top:6px"><summary style="cursor:pointer;color:var(--gray-600)">Ukázat celou odpověď</summary>
          <pre style="background:var(--gray-100);padding:8px;border-radius:4px;overflow:auto;max-height:300px;font-size:0.75rem">${escapeHtml(JSON.stringify(shipmentData, null, 2))}</pre></details>`;
        return;
      }

      const labelFn = firebase.app().functions('europe-west1').httpsCallable('pplGetLabel');
      const labelRes = await labelFn({ shipmentId: trackingNum });
      const l = labelRes.data || {};

      if (l.ok && l.pdfBase64) {
        // Stáhnout jako soubor
        const byteChars = atob(l.pdfBase64);
        const bytes = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        const filename = `PPL-test-etiketa-${trackingNum}.pdf`;
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

        statusEl.innerHTML += `<div style="color:var(--success);margin-top:8px"><strong>PDF etiketa stažena: ${escapeHtml(filename)}</strong></div>
          <div style="color:var(--gray-600);margin-top:4px">Pošli ji emailem na PPL pro odemčení produkce.</div>
          <div style="margin-top:6px"><a href="${blobUrl}" target="_blank" class="btn btn-outline btn-sm">Otevřít PDF</a></div>`;
      } else {
        const attempts = (l.attempts || []).map(a =>
          `<div><code>${escapeHtml(a.path || '')}</code> (${a.method || ''}) → HTTP ${a.status || '?'} ${a.contentType ? '(' + a.contentType + ')' : ''} ${a.error ? '— ' + escapeHtml(a.error) : ''}</div>`
        ).join('');
        statusEl.innerHTML += `<div style="color:var(--danger);margin-top:8px">Nepodařilo se stáhnout PDF etiketu.</div>
          ${l.error ? `<div style="margin-top:4px;color:var(--gray-700)"><strong>${escapeHtml(l.error)}</strong></div>` : ''}
          ${attempts ? `<div style="margin-top:6px;color:var(--gray-600);font-size:0.85rem">${attempts}</div>` : ''}`;
      }
    } catch (err) {
      console.error(err);
      statusEl.innerHTML = `<span style="color:var(--danger)">Chyba: ${escapeHtml(err.message || err.code || String(err))}</span>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Vygenerovat testovací etiketu';
    }
  }

  function findFirst(obj, keys) {
    if (!obj || typeof obj !== 'object') return '';
    for (const k of keys) {
      if (obj[k] != null && String(obj[k]).trim() !== '') return String(obj[k]).trim();
    }
    return '';
  }

  async function testPPLLogin(container) {
    const statusEl = container.querySelector('#import-status');
    const btn = container.querySelector('#btn-test-ppl');
    btn.disabled = true;
    btn.textContent = 'Testuji…';
    statusEl.innerHTML = '<span style="color:var(--gray-600)">Volám PPL login…</span>';

    try {
      const fn = firebase.app().functions('europe-west1').httpsCallable('pplTestLogin');
      const res = await fn({});
      const d = res.data || {};
      if (d.ok) {
        statusEl.innerHTML = `<span style="color:var(--success)">PPL přihlášení funguje!</span>
          <div style="color:var(--gray-600);margin-top:6px">URL: <code>${escapeHtml(d.url || '')}</code></div>
          <div style="color:var(--gray-600);margin-top:4px">HTTP ${d.status} — odpověď začíná: <code>${escapeHtml(d.bodyPreview || '')}</code></div>`;
      } else {
        statusEl.innerHTML = `<span style="color:var(--danger)">PPL přihlášení selhalo (${escapeHtml(d.stage || '')})</span>
          <div style="color:var(--gray-700);margin-top:6px">${escapeHtml(d.error || '')}</div>
          <div style="color:var(--gray-600);margin-top:6px">HTTP ${d.status || '?'} — <code>${escapeHtml(d.bodyPreview || '')}</code></div>`;
      }
    } catch (err) {
      statusEl.innerHTML = `<span style="color:var(--danger)">Chyba volání testu: ${escapeHtml(err.message || err.code || String(err))}</span>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Test PPL přihlášení';
    }
  }

  async function fetchFromPPL(container) {
    const statusEl = container.querySelector('#import-status');
    const btn = container.querySelector('#btn-fetch-ppl');
    btn.disabled = true;
    btn.textContent = 'Načítám z PPL…';
    statusEl.innerHTML = '<span style="color:var(--gray-600)">Volám PPL API…</span>';

    try {
      const fn = firebase.app().functions('europe-west1').httpsCallable('pplListShipments');
      const res = await fn({ days: 1 });
      const data = res.data || {};
      if (data.ok && Array.isArray(data.shipments) && data.shipments.length > 0) {
        const fresh = data.shipments.map(s => {
          const r = emptyRow();
          r.trackingNum = s.trackingNum || '';
          r.name = s.name || '';
          r.email = s.email || '';
          r.orderNum = s.orderNum || '';
          return r;
        });
        const allEmpty = rows.every(r => !r.trackingNum && !r.email && !r.orderNum);
        rows = allEmpty ? fresh : rows.concat(fresh);
        renderRows(container);
        const warn = fresh.filter(r => !r.email).length;
        statusEl.innerHTML = `<span style="color:var(--success)">Načteno ${fresh.length} zásilek z PPL (endpoint ${data.path}).</span>` +
          (warn > 0 ? ` <span style="color:var(--warning)">${warn} bez emailu — doplň ručně.</span>` : '');
      } else if (data.ok && data.count === 0) {
        statusEl.innerHTML = `<span style="color:var(--warning)">PPL API odpovědělo na ${data.path}, ale dnes nevrací žádné zásilky. Zkus nahrát CSV export z portálu.</span>`;
      } else {
        const stage = data.stage ? ` [${data.stage}]` : '';
        const attempts = (data.attempts || []).map(a => {
          if (a.error) return `<code>${escapeHtml(a.path)}</code> → chyba: ${escapeHtml(a.error)}`;
          const preview = a.bodyPreview ? ` — <code style="font-size:0.75rem">${escapeHtml(a.bodyPreview)}</code>` : '';
          return `<code>${escapeHtml(a.path)}</code> → HTTP ${a.status}${preview}`;
        }).join('<br>');
        statusEl.innerHTML = `<span style="color:var(--danger)">PPL nevrátilo seznam zásilek${stage}.</span>
          <div style="color:var(--gray-700);margin-top:6px"><strong>${escapeHtml(data.error || '')}</strong></div>
          ${data.hint ? `<div style="color:var(--gray-600);margin-top:4px">${escapeHtml(data.hint)}</div>` : ''}
          ${attempts ? `<div style="color:var(--gray-600);margin-top:6px;line-height:1.7">${attempts}</div>` : ''}
          <div style="color:var(--gray-600);margin-top:8px">Zkus "Test PPL přihlášení" pro ověření credentials. Nebo nahraj CSV.</div>`;
      }
    } catch (err) {
      console.error('PPL fetch error:', err);
      statusEl.innerHTML = `<span style="color:var(--danger)">Chyba PPL: ${escapeHtml(err.message || err.code || String(err))}</span>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Načíst dnešní z PPL';
    }
  }

  /* ============================================================
     PDF IMPORT — výpis z PPL portálu (Tisk - Seznam balíků)
     ============================================================ */
  async function handlePdfFile(file, container) {
    const statusEl = container.querySelector('#import-status');
    if (!window.pdfjsLib) {
      statusEl.innerHTML = '<span style="color:var(--danger)">PDF knihovna se nenačetla. Refreshni stránku (Ctrl+Shift+R) a zkus znovu.</span>';
      return;
    }
    statusEl.innerHTML = '<span style="color:var(--gray-600)">Čtu PDF…</span>';

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // Sebereme text, zachováme pozici (x,y), pak složíme do řádků
        const items = content.items.map(it => ({
          str: it.str,
          x: it.transform ? it.transform[4] : 0,
          y: it.transform ? it.transform[5] : 0,
        }));
        // Seskup podle Y (řádky), uvnitř seřaď podle X
        const byY = new Map();
        items.forEach(it => {
          const y = Math.round(it.y);
          if (!byY.has(y)) byY.set(y, []);
          byY.get(y).push(it);
        });
        const sortedYs = [...byY.keys()].sort((a, b) => b - a); // shora dolů
        for (const y of sortedYs) {
          const line = byY.get(y).sort((a, b) => a.x - b.x).map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
          if (line) fullText += line + '\n';
        }
        fullText += '\n';
      }

      const parsed = parsePPLText(fullText);
      if (parsed.length === 0) {
        statusEl.innerHTML = `<span style="color:var(--danger)">V PDF jsem nenašel žádná tracking čísla.</span>
          <details style="margin-top:6px"><summary style="cursor:pointer;color:var(--gray-600)">Ukázat extrahovaný text</summary>
          <pre style="background:var(--gray-100);padding:8px;border-radius:4px;overflow:auto;max-height:300px;font-size:0.75rem">${escapeHtml(fullText.slice(0, 3000))}</pre></details>`;
        return;
      }

      // Spárujeme s klienty pro email
      const paired = parsed.map(p => {
        const match = matchClientByName(p.name);
        return {
          ...p,
          clientId: match ? match.id : '',
          email: match ? (match.email || '') : '',
          oz: match ? (match.oz || '') : '',
        };
      });

      const fresh = paired.map(p => {
        const r = emptyRow();
        r.trackingNum = p.trackingNum;
        r.name = p.name;
        r.email = p.email;
        r.orderNum = p.orderNum || '';
        r.clientId = p.clientId || '';
        r.oz = p.oz || '';
        return r;
      });

      const allEmpty = rows.every(r => !r.trackingNum && !r.email && !r.orderNum);
      rows = allEmpty ? fresh : rows.concat(fresh);
      renderRows(container);

      const matchedCount = paired.filter(p => p.email).length;
      statusEl.innerHTML = `<span style="color:var(--success)">Naimportováno z PDF: ${paired.length} zásilek.</span>` +
        ` <span style="color:var(--gray-700)">Z klientské databáze dohledáno ${matchedCount} emailů.</span>` +
        ` <span style="color:var(--gray-600)">Doplňuji zbylé emaily z PPL API…</span>`;

      // Automaticky dotáhnout emaily z PPL pro ty, které je ještě nemají
      try {
        await enrichFromPPL(container, /* silent */ true);
      } catch (e) {
        console.warn('Auto-enrich failed:', e);
      }
    } catch (err) {
      console.error('PDF parse error:', err);
      statusEl.innerHTML = `<span style="color:var(--danger)">Chyba při čtení PDF: ${escapeHtml(err.message || String(err))}</span>`;
    }
  }

  /* ============================================================
     CSV IMPORT — PPL export z portálu myppl.cz
     Rozpoznává české i anglické názvy sloupců, oddělovače ,;\t
     ============================================================ */

  function handleCsvFile(file, container) {
    const statusEl = container.querySelector('#import-status');
    statusEl.innerHTML = '<span style="color:var(--gray-600)">Načítám soubor…</span>';

    const reader = new FileReader();
    reader.onerror = () => {
      statusEl.innerHTML = '<span style="color:var(--danger)">Chyba při čtení souboru.</span>';
    };
    reader.onload = (e) => {
      const buf = new Uint8Array(e.target.result);
      // Nejdřív UTF-8; pokud se objeví replacement znak, přepneme na Windows-1250
      let text = '';
      try { text = new TextDecoder('utf-8', { fatal: false }).decode(buf); } catch (_) {}
      if ((text.match(/�/g) || []).length > 2) {
        try { text = new TextDecoder('windows-1250').decode(buf); } catch (_) {}
      }
      try {
        const parsed = parseCsv(text);
        const mapped = mapCsvRows(parsed.rows, parsed.header);
        if (mapped.imported.length === 0) {
          statusEl.innerHTML = `<span style="color:var(--danger)">Nepodařilo se najít v CSV tracking číslo.</span>
            <div style="color:var(--gray-600);margin-top:6px">Rozpoznané sloupce: ${parsed.header.map(h => `<code style="background:var(--gray-100);padding:2px 6px;border-radius:4px">${escapeHtml(h)}</code>`).join(' ')}</div>
            <div style="color:var(--gray-600);margin-top:6px">Hledám sloupec s názvem obsahujícím "zásilk", "tracking", "parcel" nebo "AWB".</div>`;
          return;
        }

        // Doplň nové řádky: prázdné přepíšeme, pak přidáme
        const freshRows = mapped.imported.map(m => {
          const r = emptyRow();
          r.trackingNum = m.trackingNum || '';
          r.name = m.name || '';
          r.email = m.email || '';
          r.orderNum = m.orderNum || '';
          return r;
        });

        // Pokud má uživatel jen prázdné řádky, nahradíme je
        const allEmpty = rows.every(r => !r.trackingNum && !r.email && !r.orderNum);
        rows = allEmpty ? freshRows : rows.concat(freshRows);
        renderRows(container);

        const warn = mapped.imported.filter(m => !m.email).length;
        statusEl.innerHTML = `<span style="color:var(--success)">Importováno ${mapped.imported.length} zásilek.</span>` +
          (warn > 0 ? ` <span style="color:var(--warning)">${warn} zásilek bez emailu — doplň ručně, jinak se neodešlou.</span>` : '');
      } catch (err) {
        console.error('CSV parse error:', err);
        statusEl.innerHTML = `<span style="color:var(--danger)">Chyba při zpracování CSV: ${escapeHtml(err.message || String(err))}</span>`;
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function parseCsv(text) {
    // Odstraň BOM
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

    // Najdi oddělovač: ; (český CSV), , (anglický), \t (tab)
    const firstLine = text.split(/\r?\n/)[0] || '';
    const counts = { ';': (firstLine.match(/;/g) || []).length,
                     ',': (firstLine.match(/,/g) || []).length,
                     '\t': (firstLine.match(/\t/g) || []).length };
    const delim = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || ',';

    const lines = splitCsvLines(text);
    if (lines.length < 2) throw new Error('Soubor neobsahuje žádná data.');

    const parsedLines = lines.map(l => parseCsvLine(l, delim));
    const header = parsedLines[0].map(h => (h || '').trim());
    const rows = parsedLines.slice(1).filter(r => r.some(v => (v || '').trim() !== ''));
    return { header, rows };
  }

  function splitCsvLines(text) {
    // Rozdělí na řádky, respektuje uvozovky (aby ';' uvnitř "..." nelomilo řádek)
    const out = [];
    let cur = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') { inQ = !inQ; cur += ch; continue; }
      if ((ch === '\n' || ch === '\r') && !inQ) {
        if (cur.length) { out.push(cur); cur = ''; }
        // Přeskoč druhý znak \r\n
        if (ch === '\r' && text[i + 1] === '\n') i++;
        continue;
      }
      cur += ch;
    }
    if (cur.length) out.push(cur);
    return out;
  }

  function parseCsvLine(line, delim) {
    const out = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; continue; }
        inQ = !inQ;
        continue;
      }
      if (ch === delim && !inQ) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out.map(v => v.trim());
  }

  function mapCsvRows(rows, header) {
    const norm = (s) => String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // odstraň diakritiku
      .replace(/[^a-z0-9]/g, '');

    const idxOf = (needles) => {
      const normHeader = header.map(norm);
      for (const n of needles) {
        const nn = norm(n);
        const i = normHeader.findIndex(h => h.includes(nn));
        if (i >= 0) return i;
      }
      return -1;
    };

    const iTracking = idxOf(['cislozasilky', 'cislozasi', 'tracking', 'parcel', 'awb', 'shipment', 'cpl']);
    const iName     = idxOf(['prijemce', 'jmeno', 'name', 'kontaktniosoba', 'contact', 'firma', 'company']);
    const iEmail    = idxOf(['email', 'mail', 'eshopmail']);
    const iOrder    = idxOf(['cisloobj', 'objednavk', 'order', 'variabilni', 'reference']);

    if (iTracking < 0) return { imported: [] };

    const imported = [];
    for (const r of rows) {
      const trackingNum = (r[iTracking] || '').trim();
      if (!trackingNum) continue;
      imported.push({
        trackingNum,
        name:  iName  >= 0 ? (r[iName]  || '').trim() : '',
        email: iEmail >= 0 ? (r[iEmail] || '').trim() : '',
        orderNum: iOrder >= 0 ? (r[iOrder] || '').trim() : '',
      });
    }
    return { imported };
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function sendAll(container) {
    const toSend = rows.filter(r => r.trackingNum && r.email);
    if (toSend.length === 0) return;

    const btn = container.querySelector('#btn-send-all');
    btn.disabled = true;
    btn.textContent = 'Odesílám…';

    const profile = Auth.getProfile() || {};
    let sent = 0, failed = 0;

    for (const r of toSend) {
      try {
        await sendEmail(r);
        sent++;
        const now = firebase.firestore.FieldValue.serverTimestamp();

        // 1) Log odeslaného emailu (pro staré zobrazení historie)
        await db.collection('shipment_email_log').add({
          trackingNum: r.trackingNum,
          name: r.name,
          email: r.email,
          orderNum: r.orderNum,
          sentAt: now,
          sentBy: profile.displayName || 'system',
          type: 'handover_manual'
        });

        // 2) Vytvořit / aktualizovat záznam v kolekci 'shipments' pro
        //    sledování stavu PPL a zobrazení v OZ dashboardu.
        const linkedClient = clientsById.get(r.clientId) || null;
        const ozName = (linkedClient && linkedClient.oz) || r.oz || '';
        const clientName = (linkedClient && linkedClient.name) || r.name || '';

        await db.collection('shipments').doc(r.trackingNum).set({
          trackingNum: r.trackingNum,
          orderNum: r.orderNum || '',
          recipientEmail: r.email,
          recipientName: r.name || '',
          clientId: r.clientId || null,
          clientName: clientName,
          oz: ozName,
          pplStatus: 'handed_to_courier',
          pplStatusText: 'Předáno dopravci (manuálně)',
          pplStatusHistory: [{ timestamp: new Date().toISOString(), code: 'MANUAL_HANDOVER', text: 'Předáno dopravci (manuálně v aplikaci)' }],
          emailHandoverSentAt: now,
          createdAt: now,
          createdBy: profile.id || 'system',
          createdByName: profile.displayName || ''
        }, { merge: true });
      } catch (e) {
        console.error('Email error:', r.email, e);
        failed++;
      }
    }

    btn.disabled = false;
    btn.textContent = `Odeslat všem zákazníkům (${toSend.length})`;

    if (failed === 0) {
      App.toast(`Odesláno ${sent} emailů`, 'success');
      App.logActivity('shipment_emails_sent', `${sent} zásilek`);
      // Vymazat odeslaná čísla zásilek
      rows = rows.map(r => (r.trackingNum && r.email) ? emptyRow() : r);
      renderRows(container);
    } else {
      App.toast(`Odesláno ${sent}, chyba ${failed}`, 'error');
    }

    loadLog(container);
  }

  async function sendEmail(row) {
    const html = buildEmailHtml(row.trackingNum, row.name, row.orderNum);
    const subject = `Vaše objednávka č. ${row.orderNum || row.trackingNum} byla expedována`;

    const sendFn = firebase.app().functions('europe-west1').httpsCallable('sendEmailViaBrevo');
    await sendFn({
      to: row.email,
      toName: row.name || '',
      subject,
      htmlContent: html
    });
  }

  function buildEmailHtml(trackingNum, name, orderNum) {
    const trackingUrl = `https://www.ppl.cz/vyhledat-zasilku?parcelNumber=${trackingNum}`;

    return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,0.08)">

      <!-- Accent top bar -->
      <tr><td style="background:#fbbf24;height:4px;font-size:0;line-height:0">&nbsp;</td></tr>

      <!-- Header -->
      <tr>
        <td style="background:#1e3a8a;padding:28px 32px">
          <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Concept Czech</div>
          <div style="color:#93c5fd;font-size:12px;letter-spacing:1px;margin-top:4px">Velkoobchod pro kadeřníky</div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#ffffff;padding:32px">

          <p style="color:#0f172a;font-size:16px;margin:0 0 16px">Dobrý den,</p>

          <p style="color:#0f172a;font-size:15px;line-height:1.7;margin:0 0 20px">
            dnes jsme vyexpedovali Vaši objednávku${orderNum ? ` č. <strong>${orderNum}</strong>` : ''}.
          </p>

          <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">
            Objednávky v rámci České republiky standardně doručujeme <strong>následující pracovní den</strong>. Pro Slovensko počítejte prosím s doručením o jeden pracovní den později. Pro sledování stavu zásilky využijte číslo níže:
          </p>

          <!-- Tracking box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:24px 0">
            <tr>
              <td style="padding:20px 24px">
                <div style="color:#64748b;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Číslo zásilky</div>
                <div style="color:#0f172a;font-size:22px;font-weight:700;letter-spacing:1px;margin-bottom:16px;font-family:ui-monospace,Menlo,Consolas,monospace">${trackingNum}</div>
                <a href="${trackingUrl}" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:13px;font-weight:600;letter-spacing:0.5px">
                  Sledovat zásilku online
                </a>
              </td>
            </tr>
          </table>

          <p style="color:#0f172a;font-size:15px;line-height:1.7;margin:24px 0 0">
            Děkujeme za Vaši objednávku a přejeme krásný den.
          </p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center">
          <div style="color:#475569;font-size:12px">
            <a href="mailto:podpora@conceptczech.cz" style="color:#1e40af;text-decoration:none;font-weight:600">podpora@conceptczech.cz</a>
            &nbsp;·&nbsp;
            <a href="https://www.conceptczech.cz" style="color:#1e40af;text-decoration:none;font-weight:600">www.conceptczech.cz</a>
          </div>
          <div style="color:#94a3b8;font-size:11px;margin-top:8px">Concept Czech s.r.o. · Jesenická 513, 252 44 Psáry - Dolní Jirčany</div>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
  }

  function buildEmailPreview(trackingNum, name, orderNum) {
    // Zjednodušený náhled pro zobrazení v systému
    return `<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;max-width:500px;background:#fff">
      <div style="background:#fbbf24;height:3px"></div>
      <div style="background:#1e3a8a;padding:12px 16px;color:#fff;font-size:14px;font-weight:700;letter-spacing:2px">CONCEPT CZECH</div>
      <div style="padding:16px;background:#fff;font-size:13px;color:#0f172a;line-height:1.7">
        <p><strong>Dobrý den,</strong></p>
        <p>dnes jsme vyexpedovali Vaši objednávku č. <strong>${orderNum || '---'}</strong>.</p>
        <p style="color:#475569">Objednávky v rámci ČR doručujeme následující pracovní den, na Slovensko o den později.</p>
        <p>Číslo zásilky: <strong style="font-family:ui-monospace,Menlo,Consolas,monospace">${trackingNum}</strong></p>
        <p><a href="https://www.ppl.cz/vyhledat-zasilku?parcelNumber=${trackingNum}" style="color:#1e40af;font-weight:600">Sledovat zásilku online</a></p>
        <p>Děkujeme za Vaši objednávku a přejeme krásný den.</p>
      </div>
      <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:10px 16px;text-align:center;color:#475569;font-size:11px">podpora@conceptczech.cz · www.conceptczech.cz</div>
    </div>`;
  }

  function loadLog(container) {
    if (logUnsubscribe) logUnsubscribe();
    const logEl = container.querySelector('#shipment-log');
    if (!logEl) return;

    logUnsubscribe = db.collection('shipment_email_log')
      .orderBy('sentAt', 'desc')
      .limit(30)
      .onSnapshot(snap => {
        if (snap.empty) {
          logEl.innerHTML = '<div style="font-size:0.85rem;color:var(--gray-500)">Zatím žádné odeslané emaily.</div>';
          return;
        }
        let html = '<div class="cl-table-wrap"><table class="st-table" style="font-size:0.82rem"><thead><tr><th>Datum</th><th>Zásilka</th><th>Zákazník</th><th>Email</th><th>Objednávka</th><th>Odeslal</th></tr></thead><tbody>';
        snap.forEach(doc => {
          const d = doc.data();
          html += `<tr>
            <td>${App.formatDateTime(d.sentAt)}</td>
            <td><strong>${App.escapeHtml(d.trackingNum || '')}</strong></td>
            <td>${App.escapeHtml(d.name || '')}</td>
            <td>${App.escapeHtml(d.email || '')}</td>
            <td>${App.escapeHtml(d.orderNum || '')}</td>
            <td>${App.escapeHtml(d.sentBy || '')}</td>
          </tr>`;
        });
        html += '</tbody></table></div>';
        logEl.innerHTML = html;
      });
  }

  function destroy() {
    if (logUnsubscribe) logUnsubscribe();
  }

  return { render, destroy };
})();
