/**
 * DocFlow Cloud Functions
 *
 * `familyInvite` — bezpečný endpoint pro odesílání rodinných pozvánek přes Resend.
 *
 * Ochrany:
 *  1. Firebase ID token v hlavičce  Authorization: Bearer <token>
 *  2. inviterEmail musí odpovídat ověřenému e-mailu v tokenu
 *  3. (volitelné) Firebase App Check token (X-Firebase-AppCheck)
 *  4. Rate limit: 10 pozvánek / uživatele / 24h, maximálně 2 za minutu
 *  5. Validace vstupních polí (délka, formát, anti-HTML)
 *  6. CORS jen pro povolený origin
 *
 * Secrets (firebase functions:secrets:set RESEND_API_KEY):
 *  - RESEND_API_KEY
 */

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

const ALLOWED_ORIGINS = [
  'https://banbosh-smlouvy.web.app',
  'https://banbosh-smlouvy.firebaseapp.com',
];

const FROM_EMAIL = 'DocFlow <noreply@banbosh.cz>';
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

// ── Helpers ──────────────────────────────────────────────
function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Firebase-AppCheck');
  res.set('Access-Control-Max-Age', '3600');
}

async function verifyAppCheck(req) {
  const token = req.header('X-Firebase-AppCheck');
  if (!token) return { ok: false, reason: 'no-token' };
  try {
    await admin.appCheck().verifyToken(token);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.code || e.message };
  }
}

async function verifyUser(req) {
  const header = req.header('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch (e) {
    logger.warn('Invalid ID token', { code: e.code });
    return null;
  }
}

// Rate limit: returns { ok, retryAfterSec }
async function checkRateLimit(uid) {
  const ref = db.collection('rate_limits').doc(uid);
  const now = Date.now();
  const minuteAgo = now - 60 * 1000;
  const dayAgo = now - 24 * 60 * 60 * 1000;

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : { events: [] };
    const events = (data.events || []).filter((t) => t > dayAgo);
    const lastMinute = events.filter((t) => t > minuteAgo).length;
    if (lastMinute >= 2) return { ok: false, retryAfterSec: 60 };
    if (events.length >= 10) return { ok: false, retryAfterSec: 6 * 60 * 60 };
    events.push(now);
    tx.set(ref, { events, updatedAt: now }, { merge: true });
    return { ok: true };
  });
}

function buildInviteEmailHtml(inviterName, inviterEmail) {
  const name = escHtml(inviterName || 'Někdo');
  const email = escHtml(inviterEmail || '');
  return `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#e8e8e8">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 16px"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#1a1d27;border:1px solid #2a2d3a;border-radius:16px;padding:40px 32px">
      <tr><td style="text-align:center;padding-bottom:24px">
        <div style="font-size:22px;font-weight:800;color:#fff">Doc<span style="color:#6366f1">Flow</span></div>
      </td></tr>
      <tr><td style="text-align:center">
        <h1 style="font-size:22px;color:#fff;margin:0 0 12px 0;font-weight:700">Byli jste pozváni do rodinného účtu</h1>
        <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 24px 0">
          <strong style="color:#fff">${name}</strong> (${email}) vás zve ke sdílení smluv a předplatného v aplikaci DocFlow.
        </p>
        <a href="https://banbosh-smlouvy.web.app" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px">Otevřít DocFlow</a>
        <p style="color:#6b7280;font-size:12px;margin:28px 0 0 0">Pokud nechcete být pozváni, tento e-mail prostě ignorujte.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

async function sendResend(apiKey, to, inviterName, inviterEmail) {
  const body = JSON.stringify({
    from: FROM_EMAIL,
    to: [to],
    subject: `${inviterName || 'Někdo'} vás zve do DocFlow`,
    html: buildInviteEmailHtml(inviterName, inviterEmail),
    reply_to: inviterEmail || undefined,
  });
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

// ── familyInvite ─────────────────────────────────────────
exports.familyInvite = onRequest(
  {
    region: 'us-central1',
    secrets: [RESEND_API_KEY],
    cors: false,
    maxInstances: 10,
    timeoutSeconds: 15,
  },
  async (req, res) => {
    setCors(req, res);
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method-not-allowed' });
      return;
    }

    // 1. App Check (pokud klient posílá token; při prvním nasazení může být volitelné)
    const appCheck = await verifyAppCheck(req);
    const appCheckEnforced = process.env.APP_CHECK_ENFORCED === 'true';
    if (appCheckEnforced && !appCheck.ok) {
      res.status(401).json({ error: 'app-check-failed', reason: appCheck.reason });
      return;
    }

    // 2. Auth
    const user = await verifyUser(req);
    if (!user) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }

    // 3. Parse + validace
    const { inviterName, inviterEmail, toEmail } = req.body || {};
    if (typeof toEmail !== 'string' || !EMAIL_RE.test(toEmail) || toEmail.length > 254) {
      res.status(400).json({ error: 'invalid-email' });
      return;
    }
    if (typeof inviterName !== 'string' || inviterName.length > 120) {
      res.status(400).json({ error: 'invalid-name' });
      return;
    }
    if (typeof inviterEmail !== 'string' || !EMAIL_RE.test(inviterEmail)) {
      res.status(400).json({ error: 'invalid-inviter-email' });
      return;
    }
    // inviterEmail se musí shodovat s ověřeným tokenem
    if (user.email && user.email.toLowerCase() !== inviterEmail.toLowerCase()) {
      res.status(403).json({ error: 'inviter-mismatch' });
      return;
    }
    if (toEmail.toLowerCase() === (user.email || '').toLowerCase()) {
      res.status(400).json({ error: 'self-invite' });
      return;
    }

    // 4. Rate limit
    const rl = await checkRateLimit(user.uid);
    if (!rl.ok) {
      res.set('Retry-After', String(rl.retryAfterSec));
      res.status(429).json({ error: 'rate-limited', retryAfterSec: rl.retryAfterSec });
      return;
    }

    // 5. Odeslat
    try {
      const result = await sendResend(RESEND_API_KEY.value(), toEmail, inviterName, inviterEmail);
      if (result.status >= 300) {
        logger.error('Resend failed', { status: result.status, body: result.body });
        res.status(502).json({ error: 'send-failed', status: result.status });
        return;
      }
      logger.info('Invite sent', { uid: user.uid, toEmail });
      res.status(200).json({ ok: true });
    } catch (e) {
      logger.error('Invite error', { error: e.message });
      res.status(500).json({ error: 'internal' });
    }
  }
);


// ════════════════════════════════════════════════════════════════════
// ocrSmlouva — OCR scan smluv přes Google Cloud Vision API
// ════════════════════════════════════════════════════════════════════

const { ImageAnnotatorClient } = require('@google-cloud/vision');
let _visionClient = null;
function getVisionClient() {
  if (!_visionClient) _visionClient = new ImageAnnotatorClient();
  return _visionClient;
}

/**
 * Parse extracted text → vytáhnout název, datum, částku, frekvenci
 */
function parseContractText(text) {
  if (!text) return { name: '', date: '', amount: null, currency: 'CZK', period: null };

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const fullText = text.toLowerCase();

  // === DATUM === (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, DD. MM. YYYY)
  const dateMatch = text.match(/(\b\d{1,2})[.\/\-]\s?(\d{1,2})[.\/\-]\s?(\d{2,4})\b/) ||
                    text.match(/\b(\d{4})[.\/\-](\d{1,2})[.\/\-](\d{1,2})\b/);
  let dateIso = '';
  if (dateMatch) {
    let d, m, y;
    if (dateMatch[1].length === 4) { y = dateMatch[1]; m = dateMatch[2]; d = dateMatch[3]; }
    else { d = dateMatch[1]; m = dateMatch[2]; y = dateMatch[3]; if (y.length === 2) y = '20' + y; }
    d = String(d).padStart(2, '0'); m = String(m).padStart(2, '0');
    dateIso = `${y}-${m}-${d}`;
  }

  // === ČÁSTKA === hledáme největší číslo s kontextem peněz
  const amounts = [];
  const amountRe = /(?:^|[\s])(\d{1,3}(?:[\s,]\d{3})*(?:[.,]\d{1,2})?)\s*(kč|czk|€|eur|usd|\$)\b/gi;
  let mm;
  while ((mm = amountRe.exec(text)) !== null) {
    const num = parseFloat(mm[1].replace(/\s/g, '').replace(',', '.'));
    if (!isNaN(num)) amounts.push({ value: num, currency: mm[2].toUpperCase() === 'KČ' ? 'CZK' : mm[2].toUpperCase() });
  }
  // Vyber největší (typicky cena)
  amounts.sort((a, b) => b.value - a.value);
  const amount = amounts[0] ? amounts[0].value : null;
  const currency = amounts[0] ? amounts[0].currency : 'CZK';

  // === NÁZEV === první neprázdný řádek (obvykle title)
  let name = '';
  for (const line of lines.slice(0, 6)) {
    if (line.length >= 3 && line.length <= 80 && !/^\d+$/.test(line)) {
      name = line; break;
    }
  }

  // === FREKVENCE ===
  let period = null;
  if (/měsíčn|monthly|měsíc/i.test(fullText)) period = 'monthly';
  else if (/ročn|yearly|annual|rok/i.test(fullText)) period = 'yearly';
  else if (/čtvrtletn|quarterly/i.test(fullText)) period = 'quarterly';

  return { name, date: dateIso, amount, currency, period };
}

exports.ocrSmlouva = onRequest(
  {
    region: 'us-central1',
    cors: false,
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: '512MiB',
  },
  async (req, res) => {
    setCors(req, res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'method-not-allowed' }); return; }

    // 1. Auth
    const user = await verifyUser(req);
    if (!user) { res.status(401).json({ error: 'unauthenticated' }); return; }

    // 2. Rate limit (sdíleno s familyInvite — 10/den/uživatel)
    const rl = await checkRateLimit(user.uid);
    if (!rl.ok) {
      res.set('Retry-After', String(rl.retryAfterSec));
      res.status(429).json({ error: 'rate-limited', retryAfterSec: rl.retryAfterSec });
      return;
    }

    // 3. Vstupní obrázek (base64)
    const { imageBase64 } = req.body || {};
    if (typeof imageBase64 !== 'string' || imageBase64.length < 100) {
      res.status(400).json({ error: 'invalid-image' });
      return;
    }
    if (imageBase64.length > 8 * 1024 * 1024) {
      res.status(413).json({ error: 'image-too-large' });
      return;
    }

    // 4. Volání Cloud Vision API
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const visionClient = getVisionClient();
      const [result] = await visionClient.textDetection({
        image: { content: cleanBase64 },
        imageContext: { languageHints: ['cs', 'en'] }
      });
      const fullText = (result.fullTextAnnotation && result.fullTextAnnotation.text) || '';

      const parsed = parseContractText(fullText);

      logger.info('OCR done', { uid: user.uid, textLen: fullText.length, parsed });
      res.status(200).json({
        ok: true,
        text: fullText,
        parsed,
      });
    } catch (e) {
      logger.error('Vision API error', { error: e.message });
      res.status(500).json({ error: 'vision-failed', detail: e.message });
    }
  }
);
