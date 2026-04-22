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

  function render() {
    const container = document.getElementById('view-shipments');
    if (!container) return;

    const profile = Auth.getProfile();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'office' && profile.role !== 'warehouse')) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-text">Nemáte přístup k této sekci.</div></div>`;
      return;
    }

    let html = `<h1 class="page-title">📦 Zásilky & Emaily</h1>`;

    html += `<div class="card mb-16">
      <div style="font-size:0.9rem;color:var(--gray-600);margin-bottom:12px">
        Zadejte zásilky z dnešního PPL výdeji. Každý řádek = jedna zásilka. Po vyplnění emailů odešlete notifikace zákazníkům.
      </div>
      <div id="shipment-rows"></div>
      <div class="flex gap-8 mt-12">
        <button class="btn btn-outline btn-sm" id="btn-add-row">+ Přidat zásilku</button>
        <button class="btn btn-outline btn-sm" id="btn-clear-rows">Vymazat vše</button>
      </div>
    </div>`;

    html += `<div class="card mb-16" id="email-preview-section" style="display:none">
      <div style="font-weight:700;margin-bottom:8px">📧 Náhled emailu</div>
      <div id="email-preview-content" style="background:#f9f9f9;border-radius:8px;padding:12px;font-size:0.85rem"></div>
    </div>`;

    html += `<div class="flex gap-8 mb-24">
      <button class="btn btn-primary" id="btn-send-all" style="display:none">
        ✉️ Odeslat všem zákazníkům (<span id="send-count">0</span>)
      </button>
      <button class="btn btn-outline btn-sm" id="btn-preview-email">👁 Náhled emailu</button>
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

    renderRows(container);
    bindEvents(container);
    loadLog(container);
  }

  function emptyRow() {
    return { id: Date.now() + Math.random(), trackingNum: '', name: '', email: '', orderNum: '' };
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
              <th style="width:160px">Číslo zásilky *</th>
              <th style="width:180px">Jméno zákazníka</th>
              <th>Email zákazníka *</th>
              <th style="width:130px">Číslo objednávky</th>
              <th style="width:40px"></th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, i) => `
              <tr data-idx="${i}">
                <td><input class="form-input row-tracking" style="font-size:0.8rem;padding:6px 8px" placeholder="44150009587" value="${App.escapeHtml(r.trackingNum)}" data-idx="${i}"></td>
                <td><input class="form-input row-name" style="font-size:0.8rem;padding:6px 8px" placeholder="Jana Nováková" value="${App.escapeHtml(r.name)}" data-idx="${i}"></td>
                <td><input class="form-input row-email" style="font-size:0.8rem;padding:6px 8px" placeholder="email@example.com" value="${App.escapeHtml(r.email)}" data-idx="${i}" type="email"></td>
                <td><input class="form-input row-order" style="font-size:0.8rem;padding:6px 8px" placeholder="260100720" value="${App.escapeHtml(r.orderNum)}" data-idx="${i}"></td>
                <td><button class="btn btn-sm" style="background:none;color:var(--gray-400);padding:4px 6px" data-remove="${i}" title="Odstranit">✕</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;

    // Bind input changes
    el.querySelectorAll('.row-tracking').forEach(inp => {
      inp.addEventListener('input', e => { rows[+e.target.dataset.idx].trackingNum = e.target.value.trim(); updateSendButton(container); });
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
  }

  async function sendAll(container) {
    const toSend = rows.filter(r => r.trackingNum && r.email);
    if (toSend.length === 0) return;

    const btn = container.querySelector('#btn-send-all');
    btn.disabled = true;
    btn.textContent = '⏳ Odesílám...';

    let sent = 0, failed = 0;

    for (const r of toSend) {
      try {
        await sendEmail(r);
        sent++;
        // Uložit do logu
        await db.collection('shipment_email_log').add({
          trackingNum: r.trackingNum,
          name: r.name,
          email: r.email,
          orderNum: r.orderNum,
          sentAt: firebase.firestore.FieldValue.serverTimestamp(),
          sentBy: Auth.getProfile()?.displayName || 'system'
        });
      } catch (e) {
        console.error('Email error:', r.email, e);
        failed++;
      }
    }

    btn.disabled = false;
    btn.textContent = `✉️ Odeslat všem zákazníkům (${toSend.length})`;

    if (failed === 0) {
      App.toast(`✅ Odesláno ${sent} emailů`, 'success');
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
    const subject = `🚚 Vaše objednávka č. ${row.orderNum || row.trackingNum} byla expedována`;

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
    const greeting = name ? `Vážený zákazníku ${name.split(' ')[0]},` : 'Dobrý den,';

    return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

      <!-- Header -->
      <tr>
        <td style="background:#1a1a1a;padding:24px 32px;text-align:center">
          <div style="width:100%;height:3px;background:linear-gradient(90deg,#c9a84c,#f0d080,#c9a84c);margin-bottom:20px"></div>
          <div style="color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase">CONCEPT CZECH</div>
          <div style="color:#888;font-size:11px;letter-spacing:2px;margin-top:6px">Jsme továrna na sny pro vaše vlasy</div>
          <div style="width:100%;height:3px;background:linear-gradient(90deg,#c9a84c,#f0d080,#c9a84c);margin-top:20px"></div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#ffffff;padding:32px">

          <p style="color:#333;font-size:16px;margin:0 0 16px">${greeting}</p>

          <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 20px">
            🚚 Dnes jsme vyexpedovali Vaši objednávku${orderNum ? ` č. <strong>${orderNum}</strong>` : ''}.
          </p>

          <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px">
            Objednávky v rámci České republiky standardně doručujeme <strong>následující pracovní den</strong>.
            Pro Slovensko počítejte prosím s doručením o jeden pracovní den později.
          </p>

          <!-- Tracking box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;margin:24px 0">
            <tr>
              <td style="padding:20px 24px">
                <div style="color:#c9a84c;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Sledování zásilky</div>
                <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:2px;margin-bottom:16px">📦 ${trackingNum}</div>
                <a href="${trackingUrl}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#f0d080);color:#1a1a1a;text-decoration:none;padding:10px 24px;border-radius:4px;font-size:13px;font-weight:700;letter-spacing:1px">
                  🔗 Sledovat zásilku online
                </a>
              </td>
            </tr>
          </table>

          <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 16px">
            Děkujeme, že jste si vybrali náš obchod! 🛍️❤️ Fakturu společně s malou pozorností 🎁 od nás najdete ve Vašem balíčku.
          </p>

          <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 16px">
            Velmi si vážíme toho, že jste nakoupili právě u nás. 🙏 Doufáme, že vše proběhlo v pořádku ✔️ a že nám i nadále zachováte svou přízeň. 🌟
          </p>

          <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 24px">
            Pokud byste si našli chvíli na napsání krátké recenze ✍️ na náš obchod, udělalo by nám to obrovskou radost. 😊
            Vaše zpětná vazba 🗨️ je pro nás nesmírně důležitá a pomáhá nám se neustále zlepšovat. 🚀
          </p>

          <p style="color:#333;font-size:15px;line-height:1.7;margin:0">
            🙏 Ještě jednou Vám moc děkujeme za objednávku a přejeme krásný zbytek dne. 🌞
          </p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#1a1a1a;padding:20px 32px;text-align:center">
          <div style="width:100%;height:1px;background:linear-gradient(90deg,transparent,#c9a84c,transparent);margin-bottom:16px"></div>
          <div style="color:#888;font-size:12px">
            <a href="mailto:podpora@conceptczech.cz" style="color:#c9a84c;text-decoration:none">podpora@conceptczech.cz</a>
            &nbsp;·&nbsp;
            <a href="https://www.conceptczech.cz" style="color:#c9a84c;text-decoration:none">www.conceptczech.cz</a>
          </div>
          <div style="color:#555;font-size:11px;margin-top:8px">Concept Czech s.r.o. · Jesenická 513, 25244 Psáry - Dolní Jirčany</div>
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
    return `<div style="border:1px solid #e0d5c0;border-radius:8px;overflow:hidden;max-width:500px">
      <div style="background:#1a1a1a;padding:12px 16px;text-align:center;color:#c9a84c;font-size:14px;font-weight:700;letter-spacing:2px">CONCEPT CZECH</div>
      <div style="padding:16px;background:#fff;font-size:13px;color:#333;line-height:1.7">
        <p><strong>Dobrý den,</strong></p>
        <p>🚚 Dnes jsme vyexpedovali Vaši objednávku č. <strong>${orderNum || '---'}</strong>.</p>
        <p>📦 Číslo zásilky: <strong>${trackingNum}</strong></p>
        <p>🔗 <a href="https://www.ppl.cz/vyhledat-zasilku?parcelNumber=${trackingNum}" style="color:#c9a84c">Sledovat zásilku online</a></p>
        <p style="color:#888;font-size:12px">+ text s poděkováním, pozorností v balíčku a výzvou k recenzi</p>
      </div>
      <div style="background:#1a1a1a;padding:8px 16px;text-align:center;color:#888;font-size:11px">podpora@conceptczech.cz · www.conceptczech.cz</div>
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
