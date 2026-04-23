const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');

admin.initializeApp();
const db = admin.firestore();

const BREVO_API_KEY = defineSecret('BREVO_API_KEY');
const PPL_CLIENT_ID = defineSecret('PPL_CLIENT_ID');
const PPL_CLIENT_SECRET = defineSecret('PPL_CLIENT_SECRET');
const PPL_BASE_URL = defineSecret('PPL_BASE_URL'); // např. https://api-dev.dhl.com/ecs/ppl/myapi2
const FROM_EMAIL = { name: 'Concept Czech', email: 'podpora@conceptczech.cz' };

const APPROVERS = [
  { email: 'knobloch.petr@gmail.com', name: 'Petr' },
  { email: 'steiger@conceptczech.cz', name: 'Kuba' },
  { email: 'kaisersot@conceptczech.cz', name: 'Honza' }
];

// ── Helpers ──────────────────────────────────────────────
function todayDDMM() {
  const d = new Date();
  return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');
}

function escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildEmailHtml(subject, body, discount, icon) {
  const bodyHtml = escHtml(body).replace(/\n/g, '<br>');
  const discountHtml = discount ? (
    '<div style="margin:28px 0;padding:32px 24px;background:#111111;text-align:center">' +
      '<div style="font-size:10px;color:#9a8060;text-transform:uppercase;letter-spacing:5px;margin-bottom:14px;font-family:Arial,sans-serif">Váš slevový kód</div>' +
      '<div style="font-size:42px;font-weight:400;color:#e8c96a;letter-spacing:10px;font-family:Georgia,serif">' + escHtml(discount) + '</div>' +
      '<div style="margin:16px auto 0;width:60px;height:1px;background:#c9a84c"></div>' +
      '<div style="font-size:11px;color:#888;margin-top:12px;letter-spacing:2px;font-family:Arial,sans-serif">Platnost 14 dní od doručení</div>' +
    '</div>' +
    '<div style="margin:0 0 32px 0;padding:20px 24px;background:#faf8f4;border-top:1px solid #e8dfc8;border-bottom:1px solid #e8dfc8;text-align:center">' +
      '<div style="font-size:11px;color:#b8912a;margin-bottom:8px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif">Jak uplatnit slevu?</div>' +
      '<div style="font-size:13px;color:#666;line-height:1.8;font-family:Arial,sans-serif">Sleva platí na Vaši příští objednávku.<br>Kontaktujte svého obchodního zástupce a sdělte mu tento kód —<br>rád Vám s objednávkou pomůže.</div>' +
    '</div>'
  ) : '';

  return `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><style>:root{color-scheme:light only}body{margin:0;padding:0;background:#f5f0e8 !important}.wrapper{background:#f5f0e8 !important}.card{background:#ffffff !important}.header{background:#111111 !important}.footer{background:#111111 !important}.body-cell{background:#ffffff !important}.cta-cell{background:#ffffff !important}@media(max-width:600px){.card{width:100% !important;border-radius:0 !important}.body-cell{padding:32px 24px 20px !important}.cta-cell{padding:8px 24px 28px !important}}</style></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,'Times New Roman',serif">
<table width="100%" cellpadding="0" cellspacing="0" class="wrapper" style="background:#f5f0e8;padding:40px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" class="card" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.15)">
<tr><td style="background:linear-gradient(90deg,#b8912a,#e8c96a,#c9a84c,#f0d060,#b8912a);height:4px;padding:0"></td></tr>
<tr><td class="header" style="background:#111111;padding:44px 40px 36px;text-align:center">
  <div style="font-size:10px;color:#9a8060;letter-spacing:6px;text-transform:uppercase;margin-bottom:14px;font-family:Arial,sans-serif">Jsme továrna na sny pro vaše vlasy</div>
  <div style="font-size:38px;font-weight:400;color:#e8c96a;letter-spacing:8px;text-transform:uppercase;font-family:Georgia,serif">Concept Czech</div>
  <div style="font-size:10px;color:#666;margin-top:8px;letter-spacing:4px;font-family:Arial,sans-serif">S.R.O.</div>
  <div style="margin-top:24px;height:1px;background:linear-gradient(90deg,transparent,#c9a84c,transparent)"></div>
</td></tr>
<tr><td class="header" style="background:#111111;padding:20px 40px 32px;text-align:center">
  <div style="font-size:56px;line-height:1">${icon}</div>
</td></tr>
<tr><td class="body-cell" style="padding:48px 48px 32px;text-align:center;background:#ffffff">
  <div style="height:1px;background:linear-gradient(90deg,transparent,#d4af5a,transparent);margin-bottom:36px"></div>
  <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 24px 0;font-weight:400;text-align:center;letter-spacing:3px;text-transform:uppercase;font-family:Georgia,serif">${escHtml(subject)}</h1>
  <div style="font-size:15px;line-height:2;color:#444;margin-bottom:32px;text-align:center;font-family:Arial,sans-serif">${bodyHtml}</div>
  ${discountHtml}
</td></tr>
<tr><td class="cta-cell" style="padding:8px 48px 40px;text-align:center;background:#ffffff">
  <a href="https://www.conceptczech.cz" style="display:inline-block;background:#111111;color:#e8c96a;text-decoration:none;font-size:12px;padding:16px 40px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif">Navštívit náš web</a>
</td></tr>
<tr><td style="background:linear-gradient(90deg,#b8912a,#e8c96a,#c9a84c,#f0d060,#b8912a);height:4px;padding:0"></td></tr>
<tr><td class="footer" style="background:#111111;padding:28px 40px;text-align:center">
  <div style="font-size:11px;color:#c9a84c;margin-bottom:8px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif">Concept Czech s.r.o.</div>
  <div style="font-size:11px;color:#555;line-height:2;font-family:Arial,sans-serif">
    podpora@conceptczech.cz<br>
    <a href="https://www.conceptczech.cz" style="color:#9a8060;text-decoration:none;letter-spacing:2px">www.conceptczech.cz</a>
  </div>
</td></tr>
</table></td></tr></table></body></html>`;
}

function sendBrevoEmail(to, toName, subject, htmlContent) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: FROM_EMAIL,
      replyTo: FROM_EMAIL,
      to: [{ email: to, name: toName }],
      subject,
      htmlContent
    });
    const req = https.request({
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY.value(),
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Schvalovací email pro management ────────────────────
function buildApprovalEmail(pendingId, birthday, nameday, baseUrl) {
  const approveUrl = `${baseUrl}/approveCelebrants?id=${pendingId}`;

  let rows = '';
  birthday.forEach(c => {
    rows += `<tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e8d8;font-family:Arial,sans-serif;font-size:14px">${escHtml(c.name)}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e8d8;font-family:Arial,sans-serif;font-size:14px;text-align:center">🎂 Narozeniny</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e8d8;font-family:Arial,sans-serif;font-size:14px;text-align:center;color:#b8912a;font-weight:700">BDAY10 (10%)</td>
    </tr>`;
  });
  nameday.forEach(c => {
    rows += `<tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e8d8;font-family:Arial,sans-serif;font-size:14px">${escHtml(c.name)}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e8d8;font-family:Arial,sans-serif;font-size:14px;text-align:center">🌸 Svátek</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e8d8;font-family:Arial,sans-serif;font-size:14px;text-align:center;color:#b8912a;font-weight:700">SVATEK5 (5%)</td>
    </tr>`;
  });

  return `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="light"><style>body{margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif}</style></head>
<body style="margin:0;padding:0;background:#f5f0e8">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.15)">
<tr><td style="background:linear-gradient(90deg,#b8912a,#e8c96a,#c9a84c,#f0d060,#b8912a);height:4px;padding:0"></td></tr>
<tr><td style="background:#111111;padding:36px 40px;text-align:center">
  <div style="font-size:10px;color:#9a8060;letter-spacing:6px;text-transform:uppercase;margin-bottom:10px">Interní notifikace</div>
  <div style="font-size:32px;font-weight:400;color:#e8c96a;letter-spacing:6px;text-transform:uppercase;font-family:Georgia,serif">Concept Czech</div>
  <div style="margin-top:20px;height:1px;background:linear-gradient(90deg,transparent,#c9a84c,transparent)"></div>
</td></tr>
<tr><td style="padding:40px 40px 32px;background:#ffffff">
  <h1 style="font-size:20px;color:#111111;font-weight:700;margin:0 0 8px 0;text-align:center">Dnešní oslavenci — ke schválení</h1>
  <p style="font-size:14px;color:#666;text-align:center;margin:0 0 28px 0">Zkontrolujte seznam a klikněte na tlačítko pro odeslání blahopřání.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8dfc8;border-radius:8px;overflow:hidden;margin-bottom:32px">
    <thead>
      <tr style="background:#f5f0e8">
        <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:2px">Salon</th>
        <th style="padding:10px 16px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:2px">Typ</th>
        <th style="padding:10px 16px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:2px">Sleva</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div style="text-align:center">
    <a href="${approveUrl}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#f0c040);color:#111111;text-decoration:none;font-size:13px;font-weight:800;padding:18px 48px;border-radius:6px;letter-spacing:3px;text-transform:uppercase">✓ Schválit a odeslat emaily</a>
  </div>
  <p style="font-size:12px;color:#aaa;text-align:center;margin:20px 0 0 0">Stačí kliknout jednou — klidně kdokoliv z vás.</p>
</td></tr>
<tr><td style="background:linear-gradient(90deg,#b8912a,#e8c96a,#c9a84c,#f0d060,#b8912a);height:4px;padding:0"></td></tr>
<tr><td style="background:#111111;padding:20px 40px;text-align:center">
  <div style="font-size:11px;color:#555;line-height:2">podpora@conceptczech.cz &nbsp;|&nbsp; <a href="https://www.conceptczech.cz" style="color:#9a8060;text-decoration:none">www.conceptczech.cz</a></div>
</td></tr>
</table></td></tr></table></body></html>`;
}

// ── Scheduled: každý den v 7:00 ────────────────────────
exports.dailyCelebrantsEmail = onSchedule({
  schedule: '0 7 * * *',
  timeZone: 'Europe/Prague',
  region: 'europe-west1',
  secrets: [BREVO_API_KEY],
}, async (event) => {
  const today = todayDDMM();
  logger.info(`Checking celebrants for ${today}`);

  const snap = await db.collection('clients').get();
  const birthday = [], nameday = [];

  snap.forEach(doc => {
    const c = { id: doc.id, ...doc.data() };
    if (c.active === false || !c.email) return;
    if (c.birthday === today) birthday.push(c);
    if (c.nameday === today) nameday.push(c);
  });

  if (!birthday.length && !nameday.length) {
    logger.info('No celebrants today.');
    return;
  }

  // Ulož pending batch do Firestore
  const pendingRef = await db.collection('pending_celebrants').add({
    date: today,
    birthday: birthday.map(c => ({ id: c.id, name: c.name, email: c.email, contactPerson: c.contactPerson || '' })),
    nameday: nameday.map(c => ({ id: c.id, name: c.name, email: c.email, contactPerson: c.contactPerson || '' })),
    approved: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const baseUrl = 'https://europe-west1-concept-czech-hq.cloudfunctions.net';
  const approvalHtml = buildApprovalEmail(pendingRef.id, birthday, nameday, baseUrl);
  const subject = `🎉 Dnešní oslavenci ke schválení (${birthday.length + nameday.length} osob)`;

  // Pošli schvalovací email všem 3
  for (const approver of APPROVERS) {
    try {
      await sendBrevoEmail(approver.email, approver.name, subject, approvalHtml);
      logger.info(`Approval email sent to ${approver.email}`);
    } catch (e) {
      logger.error(`Failed to send approval to ${approver.email}:`, e);
    }
  }
});

// ── HTTP: schválení kliknutím ────────────────────────────
exports.approveCelebrants = onRequest({
  region: 'europe-west1',
  secrets: [BREVO_API_KEY],
}, async (req, res) => {
  const id = req.query.id;
  if (!id) {
    res.status(400).send('Chybí ID.');
    return;
  }

  const docRef = db.collection('pending_celebrants').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    res.status(404).send('Záznam nenalezen nebo již odeslán.');
    return;
  }

  const data = doc.data();

  if (data.approved) {
    res.status(200).send(`
      <html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;background:#f5f0e8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
      .box{background:#fff;border-radius:8px;padding:40px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:400px}
      h2{color:#b8912a}p{color:#666}</style></head>
      <body><div class="box"><h2>✓ Již odesláno</h2><p>Emaily byly dříve schváleny a odeslány.</p></div></body></html>
    `);
    return;
  }

  // Označ jako schváleno
  await docRef.update({ approved: true, approvedAt: admin.firestore.FieldValue.serverTimestamp() });

  let sent = 0, errors = 0;

  // Odešli narozeninové emaily
  for (const c of data.birthday) {
    const name = c.contactPerson || c.name;
    const subject = 'Všechno nejlepší k narozeninám!';
    const body = `Milý/á ${name},\n\npřejeme Vám krásný narozeninový den plný radosti a pohody.\nJako dárek od nás máte 10% slevu navíc na Vaši příští objednávku.`;
    const html = buildEmailHtml(subject, body, 'BDAY10', '🎂');
    try {
      const r = await sendBrevoEmail(c.email, name, subject, html);
      if (r.status < 300) {
        sent++;
        await db.collection('email_log').add({ recipientEmail: c.email, recipientName: c.name, clientId: c.id, type: 'birthday', subject, success: true, sentAt: admin.firestore.FieldValue.serverTimestamp(), sentBy: 'auto-approved' });
      } else { errors++; }
    } catch (e) { errors++; logger.error(`Birthday send error ${c.email}:`, e); }
  }

  // Odešli sváteční emaily
  for (const c of data.nameday) {
    const name = c.contactPerson || c.name;
    const subject = 'Všechno nejlepší ke svátku!';
    const body = `Milý/á ${name},\n\npřejeme Vám krásný sváteční den plný pohody a radosti.\nJako dárek od nás máte 5% slevu navíc na Vaši příští objednávku.`;
    const html = buildEmailHtml(subject, body, 'SVATEK5', '🌸');
    try {
      const r = await sendBrevoEmail(c.email, name, subject, html);
      if (r.status < 300) {
        sent++;
        await db.collection('email_log').add({ recipientEmail: c.email, recipientName: c.name, clientId: c.id, type: 'nameday', subject, success: true, sentAt: admin.firestore.FieldValue.serverTimestamp(), sentBy: 'auto-approved' });
      } else { errors++; }
    } catch (e) { errors++; logger.error(`Nameday send error ${c.email}:`, e); }
  }

  res.status(200).send(`
    <html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;background:#f5f0e8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .box{background:#fff;border-radius:8px;padding:48px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:440px}
    h2{color:#b8912a;font-size:24px;margin-bottom:12px}.count{font-size:48px;font-weight:700;color:#111;margin:16px 0}.label{color:#888;font-size:14px}
    .err{color:#c62828;font-size:13px;margin-top:8px}</style></head>
    <body><div class="box">
      <h2>✓ Emaily odeslány!</h2>
      <div class="count">${sent}</div>
      <div class="label">kadeřníků dostalo blahopřání</div>
      ${errors > 0 ? `<div class="err">${errors} chyb při odesílání</div>` : ''}
      <p style="color:#666;font-size:13px;margin-top:20px">Vše bylo zaznamenáno v historii emailů.</p>
    </div></body></html>
  `);
});

// ── Callable: odeslání emailu z frontendu (clients.js, shipments.js) ──
// Nahrazuje přímé volání Brevo API z prohlížeče, aby klíč zůstal serverový.
const EMAIL_ALLOWED_ROLES = ['admin', 'office', 'warehouse'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.sendEmailViaBrevo = onCall({
  region: 'europe-west1',
  secrets: [BREVO_API_KEY],
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Musíte být přihlášen.');
  }

  const uid = request.auth.uid;
  const email = request.auth.token.email || '';

  const adminEmailRegex = /.+@conceptczech\.cz$/i;
  const hardcodedAdmins = ['knobloch.petr@gmail.com', 'info@banbosh.cz'];
  const isHardcodedAdmin = adminEmailRegex.test(email) || hardcodedAdmins.includes(email.toLowerCase());

  if (!isHardcodedAdmin) {
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      throw new HttpsError('permission-denied', 'Uživatel nenalezen.');
    }
    const role = userSnap.data().role || '';
    if (!EMAIL_ALLOWED_ROLES.includes(role)) {
      throw new HttpsError('permission-denied', 'Nemáte oprávnění odesílat emaily.');
    }
  }

  const { to, toName, subject, htmlContent } = request.data || {};
  if (!to || !subject || !htmlContent) {
    throw new HttpsError('invalid-argument', 'Chybí povinné parametry (to, subject, htmlContent).');
  }
  if (!EMAIL_RE.test(String(to))) {
    throw new HttpsError('invalid-argument', 'Neplatná emailová adresa.');
  }
  if (String(htmlContent).length > 200000) {
    throw new HttpsError('invalid-argument', 'Obsah emailu je příliš dlouhý.');
  }

  try {
    const result = await sendBrevoEmail(to, toName || '', subject, htmlContent);
    if (result.status >= 400) {
      logger.warn(`Brevo returned ${result.status}`, { body: result.body, uid });
      throw new HttpsError('internal', `Brevo API vrátilo chybu ${result.status}.`);
    }
    return { success: true, status: result.status };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    logger.error('sendEmailViaBrevo failed', err);
    throw new HttpsError('internal', err.message || 'Odeslání selhalo.');
  }
});

// ══════════════════════════════════════════════════════════════
//  PPL CPL API integrace
// ══════════════════════════════════════════════════════════════

// Token cache v paměti instance — stačí, PPL token platí ~30 minut
let pplTokenCache = { token: null, expiresAt: 0 };

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function pplGetAccessToken() {
  const now = Date.now();
  if (pplTokenCache.token && pplTokenCache.expiresAt > now + 30000) {
    return pplTokenCache.token;
  }

  const baseUrl = (PPL_BASE_URL.value() || '').replace(/\/+$/, '');
  if (!baseUrl) throw new Error('PPL_BASE_URL není nastaveno.');
  const url = new URL(baseUrl + '/login/getAccessToken');

  const form = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: PPL_CLIENT_ID.value(),
    client_secret: PPL_CLIENT_SECRET.value(),
    scope: 'myapi2',
  }).toString();

  const res = await httpRequest({
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(form),
      'Accept': 'application/json',
    },
  }, form);

  if (res.status >= 400) {
    throw new Error(`PPL token error ${res.status}: ${res.body}`);
  }

  const data = JSON.parse(res.body);
  const token = data.access_token || data.accessToken;
  const expiresIn = (data.expires_in || data.expiresIn || 1800) * 1000;
  if (!token) throw new Error('PPL token: access_token není v odpovědi.');

  pplTokenCache = { token, expiresAt: now + expiresIn };
  return token;
}

// Zkusí několik cest k tracking endpointu — PPL CPL API má mírně variabilní
// tvar podle verze. Vrací první úspěšnou odpověď.
async function pplFetchTracking(trackingNumber) {
  const baseUrl = (PPL_BASE_URL.value() || '').replace(/\/+$/, '');
  const token = await pplGetAccessToken();

  const candidates = [
    `/shipment/${encodeURIComponent(trackingNumber)}/events`,
    `/shipment/${encodeURIComponent(trackingNumber)}`,
    `/tracking/${encodeURIComponent(trackingNumber)}`,
    `/shipment?ShipmentNumbers=${encodeURIComponent(trackingNumber)}`,
  ];

  let lastError = null;
  for (const path of candidates) {
    const url = new URL(baseUrl + path);
    const res = await httpRequest({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    if (res.status < 400 && res.body) {
      try {
        return { path, data: JSON.parse(res.body) };
      } catch (e) {
        lastError = new Error(`PPL ${path}: neparsovatelné JSON (${res.status}).`);
        continue;
      }
    }
    lastError = new Error(`PPL ${path} → HTTP ${res.status}`);
    if (res.status === 404) continue; // zkusit další variantu
    if (res.status === 401) break;    // token problém — nemá smysl pokračovat
  }
  throw lastError || new Error('PPL tracking: žádná varianta cesty nefungovala.');
}

// Normalizuje různé tvary odpovědi PPL API do našich statusů.
function pplNormalizeStatus(apiResponse) {
  // Pokusíme se najít stav / události v různých tvarech odpovědi.
  const s = apiResponse;
  const events = s.events || s.Events || s.trackingEvents || s.shipmentEvents ||
    (Array.isArray(s) && s) ||
    (s.shipments && s.shipments[0] && (s.shipments[0].events || s.shipments[0].Events)) ||
    [];
  const statusField = s.status || s.Status || s.state || s.shipmentStatus ||
    (s.shipments && s.shipments[0] && (s.shipments[0].status || s.shipments[0].Status));

  const eventList = (Array.isArray(events) ? events : []).map(e => ({
    timestamp: e.timestamp || e.Timestamp || e.date || e.Date || e.time || null,
    code: String(e.code || e.Code || e.statusCode || e.eventCode || e.type || '').toUpperCase(),
    text: e.text || e.description || e.Description || e.statusText || e.name || '',
  }));

  // Odvoď cílový stav
  const codes = eventList.map(e => e.code);
  const texts = eventList.map(e => (e.text || '').toLowerCase()).concat(
    [String(statusField || '').toLowerCase()]
  );
  const anyCode = (...needles) => codes.some(c => needles.some(n => c.includes(n)));
  const anyText = (...needles) => texts.some(t => needles.some(n => t.includes(n)));

  let status = 'created';
  if (anyCode('DELIVERED', 'DELIV') || anyText('doručeno', 'delivered')) status = 'delivered';
  else if (anyCode('RETURN', 'REFUSE', 'UNDELIV') || anyText('vrácen', 'vracena', 'returned', 'nedoručitelná')) status = 'returned';
  else if (anyCode('OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPT', 'COURIER') || anyText('ve výdeji', 'out for delivery', 'v doručování')) status = 'out_for_delivery';
  else if (anyCode('IN_TRANSIT', 'TRANSIT', 'DEPOT') || anyText('v přepravě', 'in transit', 'depo')) status = 'in_transit';
  else if (anyCode('PICKUP', 'PICKED', 'COLLECTED', 'ACCEPTED', 'RECEIVED', 'HAND') || anyText('předáno', 'předána', 'picked up', 'přijata')) status = 'handed_to_courier';
  else if (anyCode('PROBLEM', 'ERROR', 'EXCEPTION') || anyText('problém', 'exception')) status = 'problem';

  return {
    status,
    statusText: (eventList[0] && eventList[0].text) || String(statusField || '') || 'Neznámý stav',
    events: eventList,
  };
}

function buildHandoverEmailHtml(trackingNum, orderNum) {
  const trackingUrl = `https://www.ppl.cz/vyhledat-zasilku?parcelNumber=${encodeURIComponent(trackingNum)}`;
  return `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
<tr><td style="background:#1a1a1a;padding:24px 32px;text-align:center">
<div style="color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase">CONCEPT CZECH</div>
<div style="color:#888;font-size:11px;letter-spacing:2px;margin-top:6px">Jsme továrna na sny pro vaše vlasy</div>
</td></tr>
<tr><td style="background:#ffffff;padding:32px">
<p style="color:#333;font-size:16px;margin:0 0 16px">Dobrý den,</p>
<p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 20px">🚚 Dnes jsme vyexpedovali Vaši objednávku${orderNum ? ` č. <strong>${orderNum}</strong>` : ''}.</p>
<p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px">Objednávky v rámci ČR doručujeme <strong>následující pracovní den</strong>. Pro Slovensko o den později. Číslo zásilky a odkaz na sledování naleznete níže:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;margin:24px 0"><tr><td style="padding:20px 24px">
<div style="color:#c9a84c;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Sledování zásilky</div>
<div style="color:#fff;font-size:20px;font-weight:700;letter-spacing:2px;margin-bottom:16px">📦 ${trackingNum}</div>
<a href="${trackingUrl}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#f0d080);color:#1a1a1a;text-decoration:none;padding:10px 24px;border-radius:4px;font-size:13px;font-weight:700;letter-spacing:1px">🔗 Sledovat zásilku online</a>
</td></tr></table>
<p style="color:#333;font-size:15px;line-height:1.7;margin:24px 0 0">🙏 Moc děkujeme za Vaši objednávku a přejeme krásný den. 🌞</p>
</td></tr>
<tr><td style="background:#1a1a1a;padding:20px 32px;text-align:center;color:#888;font-size:12px">
<a href="mailto:podpora@conceptczech.cz" style="color:#c9a84c;text-decoration:none">podpora@conceptczech.cz</a> · <a href="https://www.conceptczech.cz" style="color:#c9a84c;text-decoration:none">www.conceptczech.cz</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

function buildDeliveryDayEmailHtml(trackingNum, orderNum) {
  const trackingUrl = `https://www.ppl.cz/vyhledat-zasilku?parcelNumber=${encodeURIComponent(trackingNum)}`;
  return `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
<tr><td style="background:#1a1a1a;padding:24px 32px;text-align:center">
<div style="color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase">CONCEPT CZECH</div>
</td></tr>
<tr><td style="background:#ffffff;padding:32px">
<p style="color:#333;font-size:16px;margin:0 0 16px">Dobrý den,</p>
<p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 20px">📬 Vaše objednávka${orderNum ? ` č. <strong>${orderNum}</strong>` : ''} bude dnes doručena.</p>
<p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px">Balík právě předáváme kurýrovi a během dnešního dne k Vám dorazí. Přesnější čas doručení najdete v online sledování:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;margin:24px 0"><tr><td style="padding:20px 24px">
<div style="color:#c9a84c;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Sledování zásilky</div>
<div style="color:#fff;font-size:20px;font-weight:700;letter-spacing:2px;margin-bottom:16px">📦 ${trackingNum}</div>
<a href="${trackingUrl}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#f0d080);color:#1a1a1a;text-decoration:none;padding:10px 24px;border-radius:4px;font-size:13px;font-weight:700;letter-spacing:1px">🔗 Sledovat zásilku online</a>
</td></tr></table>
<p style="color:#333;font-size:15px;line-height:1.7;margin:24px 0 0">🙏 Děkujeme za Vaši důvěru a přejeme krásný den. 🌞</p>
</td></tr>
<tr><td style="background:#1a1a1a;padding:20px 32px;text-align:center;color:#888;font-size:12px">
<a href="mailto:podpora@conceptczech.cz" style="color:#c9a84c;text-decoration:none">podpora@conceptczech.cz</a> · <a href="https://www.conceptczech.cz" style="color:#c9a84c;text-decoration:none">www.conceptczech.cz</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

async function maybeSendStatusEmail(docRef, shipment, status) {
  if (!shipment.recipientEmail) return;
  const updates = {};

  if (status === 'handed_to_courier' && !shipment.emailHandoverSentAt) {
    const html = buildHandoverEmailHtml(shipment.trackingNum, shipment.orderNum || '');
    const subject = `🚚 Vaše objednávka${shipment.orderNum ? ` č. ${shipment.orderNum}` : ''} byla expedována`;
    const r = await sendBrevoEmail(shipment.recipientEmail, shipment.recipientName || '', subject, html);
    if (r.status < 300) {
      updates.emailHandoverSentAt = admin.firestore.FieldValue.serverTimestamp();
      await db.collection('shipment_email_log').add({
        trackingNum: shipment.trackingNum,
        name: shipment.recipientName || '',
        email: shipment.recipientEmail,
        orderNum: shipment.orderNum || '',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentBy: 'auto-sync',
        type: 'handover',
      });
    } else {
      logger.warn(`Brevo handover send ${r.status}`, { body: r.body, tracking: shipment.trackingNum });
    }
  }

  if (status === 'out_for_delivery' && !shipment.emailDeliveryDaySentAt) {
    const html = buildDeliveryDayEmailHtml(shipment.trackingNum, shipment.orderNum || '');
    const subject = `📬 Vaše objednávka${shipment.orderNum ? ` č. ${shipment.orderNum}` : ''} bude dnes doručena`;
    const r = await sendBrevoEmail(shipment.recipientEmail, shipment.recipientName || '', subject, html);
    if (r.status < 300) {
      updates.emailDeliveryDaySentAt = admin.firestore.FieldValue.serverTimestamp();
      await db.collection('shipment_email_log').add({
        trackingNum: shipment.trackingNum,
        name: shipment.recipientName || '',
        email: shipment.recipientEmail,
        orderNum: shipment.orderNum || '',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentBy: 'auto-sync',
        type: 'delivery_day',
      });
    } else {
      logger.warn(`Brevo delivery-day send ${r.status}`, { body: r.body, tracking: shipment.trackingNum });
    }
  }

  if (Object.keys(updates).length) {
    await docRef.update(updates);
  }
}

// Scheduled: každých 30 minut (v pracovní době) projde aktivní zásilky a
// synchronizuje stav z PPL. Na konci podle stavu pošle případně email.
exports.syncShipmentStatuses = onSchedule({
  schedule: '*/30 7-19 * * 1-6',
  timeZone: 'Europe/Prague',
  region: 'europe-west1',
  secrets: [BREVO_API_KEY, PPL_CLIENT_ID, PPL_CLIENT_SECRET, PPL_BASE_URL],
  timeoutSeconds: 540,
}, async () => {
  const snap = await db.collection('shipments')
    .where('pplStatus', 'not-in', ['delivered', 'returned'])
    .limit(200)
    .get();

  if (snap.empty) {
    logger.info('syncShipmentStatuses: nic k synchronizaci.');
    return;
  }

  let ok = 0, failed = 0, statusChanged = 0;

  for (const doc of snap.docs) {
    const shipment = doc.data();
    if (!shipment.trackingNum) continue;

    try {
      const { path, data } = await pplFetchTracking(shipment.trackingNum);
      const normalized = pplNormalizeStatus(data);

      const updates = {
        pplLastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
        pplLastSyncPath: path,
      };

      if (normalized.status !== shipment.pplStatus) {
        updates.pplStatus = normalized.status;
        updates.pplStatusText = normalized.statusText;
        updates.pplStatusHistory = normalized.events.slice(0, 50);
        statusChanged++;
      }

      await doc.ref.update(updates);

      const merged = { ...shipment, ...updates };
      await maybeSendStatusEmail(doc.ref, merged, normalized.status);

      ok++;
    } catch (e) {
      failed++;
      logger.warn(`sync ${shipment.trackingNum} selhalo:`, e.message || e);
      await doc.ref.update({
        pplLastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
        pplLastSyncError: String(e.message || e).slice(0, 500),
      });
    }
  }

  logger.info(`syncShipmentStatuses hotovo: ok=${ok}, failed=${failed}, statusChanged=${statusChanged}`);
});

// Callable: ruční test PPL konektivity (admin pro debug)
exports.pplTestTracking = onCall({
  region: 'europe-west1',
  secrets: [PPL_CLIENT_ID, PPL_CLIENT_SECRET, PPL_BASE_URL],
}, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Musíte být přihlášen.');
  const email = (request.auth.token.email || '').toLowerCase();
  const isAdm = /.+@conceptczech\.cz$/i.test(email) || ['knobloch.petr@gmail.com', 'info@banbosh.cz'].includes(email);
  if (!isAdm) {
    const userSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!userSnap.exists || userSnap.data().role !== 'admin') {
      throw new HttpsError('permission-denied', 'Jen admin.');
    }
  }
  const trackingNumber = (request.data && request.data.trackingNumber) || '';
  if (!trackingNumber) throw new HttpsError('invalid-argument', 'Chybí trackingNumber.');

  try {
    const { path, data } = await pplFetchTracking(trackingNumber);
    const normalized = pplNormalizeStatus(data);
    return { ok: true, path, normalized, raw: data };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
});
