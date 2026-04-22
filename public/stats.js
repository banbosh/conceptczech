/* ============================================================
   STATS.JS — Statistiky module: CSV/XML upload, admin & OZ dashboards
   Concept Czech s.r.o.
   ============================================================ */

const Stats = (() => {
  const BRANDS = ['Previa', 'pH Laboratories', 'Gama Professional', 'Tek Itaky', 'Ayat Parfumes', 'Vlastni produkty'];
  let cachedData = null;

  /* ========== Helpers ========== */
  function t(k) { return App.t(k); }
  function esc(s) { return App.escapeHtml(s); }

  function isAdminOrOffice() {
    const p = Auth.getProfile();
    return p && (p.role === 'admin' || p.role === 'office');
  }

  function isSalesOZ() {
    const p = Auth.getProfile();
    return p && (p.role === 'sales_cz' || p.role === 'sales_sk');
  }

  function currentOZName() {
    const p = Auth.getProfile();
    return p ? (p.displayName || p.email || '') : '';
  }

  function monthKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function thisMonthKey() { return monthKey(new Date()); }

  function lastMonthKey() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return monthKey(d);
  }

  function thisYear() { return new Date().getFullYear(); }

  function formatCZK(n) {
    return Math.round(Number(n || 0)).toLocaleString('cs-CZ') + ' Kč';
  }

  function formatPct(val) {
    if (!isFinite(val)) return '0 %';
    return (val >= 0 ? '+' : '') + val.toFixed(1) + ' %';
  }

  function pctChange(current, previous) {
    if (!previous) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  function trendHTML(current, previous) {
    if (current > previous) return '<span class="st-up">&#9650;</span>';
    if (current < previous) return '<span class="st-down">&#9660;</span>';
    return '<span class="st-flat">&mdash;</span>';
  }

  function pctChangeHTML(current, previous) {
    const pct = pctChange(current, previous);
    const cls = pct >= 0 ? 'st-up' : 'st-down';
    return '<span class="' + cls + '">' + formatPct(pct) + '</span>';
  }

  function normalizeBrand(brand) {
    if (!brand) return 'Vlastni produkty';
    const map = {
      'ph': 'pH Laboratories',
      'ph laboratories': 'pH Laboratories',
      'gama': 'Gama Professional',
      'gama professional': 'Gama Professional',
      'ayat': 'Ayat Parfumes',
      'ayat parfumes': 'Ayat Parfumes',
      'vlastni': 'Vlastni produkty',
      'vlastni produkty': 'Vlastni produkty',
      'previa': 'Previa',
      'tek itaky': 'Tek Itaky'
    };
    return map[brand.toLowerCase()] || brand;
  }

  function detectBrand(productName) {
    if (!productName) return 'Vlastni produkty';
    const lower = productName.toLowerCase();
    if (lower.includes('previa')) return 'Previa';
    if (lower.includes('ph ') || lower.startsWith('ph')) return 'pH Laboratories';
    if (lower.includes('gama')) return 'Gama Professional';
    if (lower.includes('ayat')) return 'Ayat Parfumes';
    if (lower.includes('tek') || lower.includes('itaky')) return 'Tek Itaky';
    return 'Vlastni produkty';
  }

  function getPrice(r) {
    return r.priceWithVAT || r.priceNoVAT || 0;
  }

  function last12Months() {
    const months = [];
    const d = new Date();
    for (let i = 11; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      months.push(monthKey(m));
    }
    return months;
  }

  function monthLabel(mk) {
    const monthNames = t('months');
    const parts = mk.split('-');
    const mIdx = parseInt(parts[1]) - 1;
    if (Array.isArray(monthNames) && monthNames[mIdx]) {
      return monthNames[mIdx].substring(0, 3);
    }
    return mk;
  }

  function daysSince(dateStr) {
    if (!dateStr) return 9999;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 9999;
    return Math.floor((new Date() - d) / 86400000);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return parts[2] + '.' + parts[1] + '.' + parts[0];
    return dateStr;
  }

  /* ========== CSV Parsing ========== */
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') ? ';' : ',';
    const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
      if (vals.length < 2) continue;
      const row = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
      rows.push(row);
    }
    return rows;
  }

  function mapCSVRow(row) {
    const keys = Object.keys(row);
    const find = (needles) => {
      for (const n of needles) {
        const k = keys.find(key => key.toLowerCase().includes(n.toLowerCase()));
        if (k) return row[k];
      }
      return '';
    };
    return {
      docNumber: find(['Doklad', 'doklad', 'cislo']),
      date: find(['Datum', 'datum']),
      customer: find(['Odberatel', 'odberatel', 'Zakaznik', 'zakaznik']),
      ozName: find(['Obchodní zástupce', 'obchodni zastupce', 'OZ', 'Zastupce', 'zastupce']),
      productCode: find(['Kod zbozi', 'kod zbozi', 'Kod', 'kod']),
      productName: find(['Název zboží', 'nazev zbozi', 'Nazev', 'nazev', 'Zbozi', 'zbozi']),
      quantity: parseFloat(find(['Mnozstvi', 'mnozstvi', 'Pocet', 'pocet']).replace(',', '.')) || 0,
      priceNoVAT: parseFloat(find(['Cena bez DPH', 'cena bez dph', 'Bez DPH']).replace(/\s/g, '').replace(',', '.')) || 0,
      priceWithVAT: parseFloat(find(['Cena s DPH', 'cena s dph', 'S DPH', 'Celkem']).replace(/\s/g, '').replace(',', '.')) || 0
    };
  }

  /* ========== XML Parsing ========== */
  function parseXML(text) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const rows = [];
    const faktury = doc.querySelectorAll('Faktura, faktura, Invoice, invoice, dataPackItem');
    faktury.forEach(f => {
      const getText = (selectors) => {
        for (const s of selectors) {
          const el = f.querySelector(s);
          if (el && el.textContent) return el.textContent.trim();
        }
        return '';
      };
      const items = f.querySelectorAll('Polozka, polozka, Item, item, invoiceItem');
      if (items.length > 0) {
        items.forEach(item => {
          const getItemText = (selectors) => {
            for (const s of selectors) {
              const el = item.querySelector(s);
              if (el && el.textContent) return el.textContent.trim();
            }
            return '';
          };
          rows.push({
            docNumber: getText(['Cislo', 'cislo', 'number']),
            date: getText(['Datum', 'datum', 'date', 'dateInvoice']),
            customer: getText(['Odberatel, odberatel, Firma, firma, company']),
            ozName: getText(['ObchodniZastupce', 'obchodniZastupce', 'centre']),
            productCode: getItemText(['Kod', 'kod', 'code']),
            productName: getItemText(['Nazev', 'nazev', 'text, name']),
            quantity: parseFloat(getItemText(['Mnozstvi', 'mnozstvi', 'quantity']).replace(',', '.')) || 0,
            priceNoVAT: parseFloat(getItemText(['Cena', 'cena', 'homeCurrency amount, rateVAT']).replace(/\s/g, '').replace(',', '.')) || 0,
            priceWithVAT: parseFloat(getItemText(['CenaSdph', 'cenaSdph', 'priceSum']).replace(/\s/g, '').replace(',', '.')) || 0
          });
        });
      } else {
        rows.push({
          docNumber: getText(['Cislo', 'cislo', 'number']),
          date: getText(['Datum', 'datum', 'date']),
          customer: getText(['Odberatel', 'odberatel', 'Firma']),
          ozName: getText(['ObchodniZastupce', 'obchodniZastupce']),
          productCode: getText(['Kod', 'kod']),
          productName: getText(['Nazev', 'nazev']),
          quantity: parseFloat(getText(['Mnozstvi', 'mnozstvi']).replace(',', '.')) || 0,
          priceNoVAT: parseFloat(getText(['Cena', 'cena']).replace(/\s/g, '').replace(',', '.')) || 0,
          priceWithVAT: parseFloat(getText(['CenaSdph', 'cenaSdph']).replace(/\s/g, '').replace(',', '.')) || 0
        });
      }
    });
    return rows;
  }

  /* ========== Upload ========== */
  async function handleUpload(file) {
    const text = await file.text();
    let records;
    if (file.name.endsWith('.xml')) {
      records = parseXML(text);
    } else {
      records = parseCSV(text).map(mapCSVRow);
    }
    if (!records.length) {
      App.toast('Soubor neobsahuje žádná data', 'error');
      return;
    }

    const batch = db.batch();
    const uploadRef = db.collection('stats_uploads').doc();
    batch.set(uploadRef, {
      fileName: file.name,
      uploadedBy: Auth.getProfile().id,
      uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
      recordCount: records.length
    });

    records.forEach(rec => {
      const recRef = uploadRef.collection('records').doc();
      batch.set(recRef, {
        ...rec,
        brand: detectBrand(rec.productName),
        monthKey: rec.date ? monthKey(new Date(rec.date.split('.').reverse().join('-'))) : ''
      });
    });

    records.forEach(rec => {
      const flatRef = db.collection('stats_records').doc();
      let parsedDate = rec.date;
      if (rec.date && rec.date.includes('.')) {
        const parts = rec.date.split('.');
        if (parts.length === 3) {
          parsedDate = parts[2].trim() + '-' + parts[1].trim().padStart(2, '0') + '-' + parts[0].trim().padStart(2, '0');
        }
      }
      batch.set(flatRef, {
        ...rec,
        dateParsed: parsedDate,
        brand: detectBrand(rec.productName),
        monthKey: parsedDate ? monthKey(new Date(parsedDate)) : '',
        uploadId: uploadRef.id,
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    App.toast('Nahráno ' + records.length + ' záznamů', 'success');
    App.logActivity('stats_upload', file.name + ' (' + records.length + ' záznamů)');
    cachedData = null;
    render();
  }

  /* ========== Load Data ========== */
  async function loadData() {
    if (cachedData) return cachedData;
    const snap = await db.collection('stats_records').get();
    const records = [];
    snap.forEach(doc => {
      const d = doc.data();
      d.brand = normalizeBrand(d.brand);
      records.push({ id: doc.id, ...d });
    });
    cachedData = records;
    return records;
  }

  /* ========== Aggregation ========== */
  function filterByOZ(records, ozName) {
    if (!ozName) return records;
    return records.filter(r =>
      r.ozName && r.ozName.toLowerCase().includes(ozName.toLowerCase())
    );
  }

  function revenueForMonth(records, mk) {
    return records.filter(r => r.monthKey === mk).reduce((s, r) => s + getPrice(r), 0);
  }

  function revenueForYear(records, year) {
    const prefix = String(year);
    return records.filter(r => r.monthKey && r.monthKey.startsWith(prefix))
      .reduce((s, r) => s + getPrice(r), 0);
  }

  function revenueByMonth(records) {
    const map = {};
    records.forEach(r => {
      if (r.monthKey) map[r.monthKey] = (map[r.monthKey] || 0) + getPrice(r);
    });
    return map;
  }

  function revenueByBrand(records, mk) {
    const data = mk ? records.filter(r => r.monthKey === mk) : records;
    const map = {};
    BRANDS.forEach(b => { map[b] = 0; });
    data.forEach(r => {
      const b = r.brand || 'Vlastni produkty';
      if (map[b] !== undefined) map[b] += getPrice(r);
      else map[b] = (map[b] || 0) + getPrice(r);
    });
    return map;
  }

  function activeSalonSet(records) {
    const tm = thisMonthKey();
    const lm = lastMonthKey();
    const set = new Set();
    records.forEach(r => {
      if (r.customer && (r.monthKey === tm || r.monthKey === lm)) set.add(r.customer);
    });
    return set;
  }

  function topProducts(records, mk, limit) {
    const data = mk ? records.filter(r => r.monthKey === mk) : records;
    const map = {};
    data.forEach(r => {
      const key = r.productName || r.productCode || '?';
      if (!map[key]) map[key] = { name: key, brand: r.brand || '', qty: 0, revenue: 0 };
      map[key].qty += (r.quantity || 0);
      map[key].revenue += getPrice(r);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  }

  function allOZNames(records) {
    const set = new Set();
    records.forEach(r => { if (r.ozName) set.add(r.ozName); });
    return [...set].sort();
  }

  function inactiveSalons(records, ozName) {
    const data = ozName ? filterByOZ(records, ozName) : records;
    const map = {};
    data.forEach(r => {
      if (!r.customer) return;
      const date = r.dateParsed || '';
      if (!map[r.customer] || date > map[r.customer].lastDate) {
        map[r.customer] = { name: r.customer, lastDate: date, ozName: r.ozName || '' };
      }
    });
    return Object.values(map)
      .map(s => ({ ...s, days: daysSince(s.lastDate) }))
      .filter(s => s.days >= 30)
      .sort((a, b) => b.days - a.days);
  }

  function orderCount(records, mk) {
    const data = records.filter(r => r.monthKey === mk);
    const set = new Set();
    data.forEach(r => {
      set.add(r.docNumber || (r.customer + '|' + r.dateParsed));
    });
    return set.size;
  }

  function avgOrderValue(records, mk) {
    const data = records.filter(r => r.monthKey === mk);
    const orders = {};
    data.forEach(r => {
      const key = r.docNumber || (r.customer + '|' + r.dateParsed);
      orders[key] = (orders[key] || 0) + getPrice(r);
    });
    const vals = Object.values(orders);
    if (!vals.length) return 0;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }

  function bestBrandForOZ(records, ozName) {
    const tm = thisMonthKey();
    const data = records.filter(r => r.ozName === ozName && r.monthKey === tm);
    const map = {};
    data.forEach(r => {
      const b = r.brand || 'Vlastni produkty';
      map[b] = (map[b] || 0) + getPrice(r);
    });
    let best = '';
    let max = 0;
    for (const [b, v] of Object.entries(map)) {
      if (v > max) { max = v; best = b; }
    }
    return best;
  }

  /* ========== Render: Upload Section ========== */
  function renderUploadSection() {
    if (!isAdminOrOffice()) return '';
    return `
      <div class="st-upload">
        <label class="st-upload-btn" for="st-file-input">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Nahrát export z Pohody
        </label>
        <input type="file" id="st-file-input" accept=".csv,.xml" style="display:none">
      </div>`;
  }

  /* ========== Render: Vertical Bar Chart (12 months) ========== */
  function renderBarChart(monthlyMap, title) {
    const months = last12Months();
    const values = months.map(m => monthlyMap[m] || 0);
    const max = Math.max(...values, 1);

    let html = '<div class="st-section">';
    html += '<div class="st-section-title">' + esc(title) + '</div>';
    html += '<div class="st-chart"><div class="st-chart-bars">';
    months.forEach((m, i) => {
      const pct = Math.round((values[i] / max) * 100);
      html += `
        <div class="st-bar-col">
          <div class="st-bar-val">${formatCZK(values[i])}</div>
          <div class="st-bar-track"><div class="st-bar" style="height:${Math.max(pct, 2)}%"></div></div>
          <div class="st-bar-label">${esc(monthLabel(m))}</div>
        </div>`;
    });
    html += '</div></div></div>';
    return html;
  }

  /* ========== Render: Horizontal Bar Chart (brands, admin) ========== */
  function renderBrandChart(records, mk, title) {
    const brandRev = revenueByBrand(records, mk);
    const max = Math.max(...Object.values(brandRev), 1);
    const total = Object.values(brandRev).reduce((s, v) => s + v, 0);

    let html = '<div class="st-section">';
    html += '<div class="st-section-title">' + esc(title) + '</div>';
    BRANDS.forEach(brand => {
      const val = brandRev[brand] || 0;
      const pct = max > 0 ? Math.round((val / max) * 100) : 0;
      const pctTotal = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
      html += `
        <div class="st-hbar-row">
          <div class="st-hbar-label">${esc(brand)}</div>
          <div class="st-hbar-track"><div class="st-hbar-fill" style="width:${Math.max(pct, 1)}%"></div></div>
          <div class="st-hbar-val">${formatCZK(val)}</div>
        </div>`;
    });
    html += '</div>';
    return html;
  }

  /* ========== Render: Brand % Bars (OZ) ========== */
  function renderBrandPctBars(records, title) {
    const brandRev = revenueByBrand(records, null);
    const total = Object.values(brandRev).reduce((s, v) => s + v, 0);

    let html = '<div class="st-section">';
    html += '<div class="st-section-title">' + esc(title) + '</div>';
    BRANDS.forEach(brand => {
      const val = brandRev[brand] || 0;
      const pct = total > 0 ? ((val / total) * 100) : 0;
      html += `
        <div class="st-pbar-row">
          <div class="st-pbar-label">${esc(brand)}</div>
          <div class="st-pbar-track">
            <div class="st-pbar-fill" style="width:${Math.max(pct, 0.5)}%">
              ${pct >= 8 ? pct.toFixed(1) + ' %' : ''}
            </div>
          </div>
          <div class="st-pbar-val">${pct.toFixed(1)} %</div>
        </div>`;
    });
    html += '</div>';
    return html;
  }

  /* ========== Render: ADMIN Dashboard ========== */
  function renderAdminDashboard(records) {
    const tm = thisMonthKey();
    const lm = lastMonthKey();
    const year = thisYear();

    const revThis = revenueForMonth(records, tm);
    const revLast = revenueForMonth(records, lm);
    const revYear = revenueForYear(records, year);
    const salonCount = activeSalonSet(records).size;
    const change = pctChange(revThis, revLast);

    let html = '';

    /* --- 1. KPI Cards (4) --- */
    html += '<div class="st-kpi-grid">';
    html += `
      <div class="st-kpi st-kpi-hero">
        <div class="st-kpi-label">Celkový obrat tento měsíc</div>
        <div class="st-kpi-value st-kpi-big">${formatCZK(revThis)}</div>
      </div>
      <div class="st-kpi">
        <div class="st-kpi-label">Obrat minulý měsíc</div>
        <div class="st-kpi-value">${formatCZK(revLast)}</div>
        <div class="st-kpi-meta ${change >= 0 ? 'st-up' : 'st-down'}">${trendHTML(revThis, revLast)} ${formatPct(change)}</div>
      </div>
      <div class="st-kpi">
        <div class="st-kpi-label">Celkový obrat ${year}</div>
        <div class="st-kpi-value">${formatCZK(revYear)}</div>
      </div>
      <div class="st-kpi">
        <div class="st-kpi-label">Aktivní salony</div>
        <div class="st-kpi-value">${salonCount}</div>
      </div>`;
    html += '</div>';

    /* --- 2. Monthly revenue chart (12 months) --- */
    html += renderBarChart(revenueByMonth(records), 'Měsíční obraty posledních 12 měsíců');

    /* --- 3. OZ comparison table --- */
    const ozNames = allOZNames(records);
    const ozRows = ozNames.map(name => {
      const ozData = filterByOZ(records, name);
      const rT = revenueForMonth(ozData, tm);
      const rL = revenueForMonth(ozData, lm);
      const salons = new Set();
      ozData.forEach(r => {
        if (r.customer && (r.monthKey === tm || r.monthKey === lm)) salons.add(r.customer);
      });
      return {
        name,
        revThis: rT,
        revLast: rL,
        salons: salons.size,
        bestBrand: bestBrandForOZ(records, name)
      };
    }).sort((a, b) => b.revThis - a.revThis);

    html += '<div class="st-section">';
    html += '<div class="st-section-title">Srovnání obchodních zástupců</div>';
    html += '<div class="st-table-scroll"><table class="st-table">';
    html += '<thead><tr><th>#</th><th>Jméno OZ</th><th>Obrat tento měsíc</th><th>Obrat minulý měsíc</th><th>Změna %</th><th>Trend</th><th>Salony</th><th>Nejprodávanější značka</th></tr></thead>';
    html += '<tbody>';
    ozRows.forEach((oz, i) => {
      let cls = '';
      if (i === 0) cls = ' class="st-rank-gold"';
      else if (i === 1) cls = ' class="st-rank-silver"';
      else if (i === 2) cls = ' class="st-rank-bronze"';
      html += `<tr${cls}>
        <td>${i + 1}.</td>
        <td><strong>${esc(oz.name)}</strong></td>
        <td>${formatCZK(oz.revThis)}</td>
        <td>${formatCZK(oz.revLast)}</td>
        <td>${pctChangeHTML(oz.revThis, oz.revLast)}</td>
        <td>${trendHTML(oz.revThis, oz.revLast)}</td>
        <td>${oz.salons}</td>
        <td>${esc(oz.bestBrand)}</td>
      </tr>`;
    });
    if (!ozRows.length) html += '<tr><td colspan="8" class="st-empty-cell">Žádná data</td></tr>';
    html += '</tbody></table></div></div>';

    /* --- 4. Brand revenue chart (this month) --- */
    html += renderBrandChart(records, tm, 'Obraty podle značky tento měsíc');

    /* --- 5. Top 20 products --- */
    const top20 = topProducts(records, tm, 20);
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Top 20 nejprodávanějších produktů</div>';
    html += '<div class="st-table-scroll"><table class="st-table">';
    html += '<thead><tr><th>#</th><th>Název</th><th>Značka</th><th>Počet kusů</th><th>Obrat</th></tr></thead>';
    html += '<tbody>';
    top20.forEach((p, i) => {
      html += `<tr>
        <td>${i + 1}.</td>
        <td>${esc(p.name)}</td>
        <td>${esc(p.brand)}</td>
        <td>${Math.round(p.qty)}</td>
        <td>${formatCZK(p.revenue)}</td>
      </tr>`;
    });
    if (!top20.length) html += '<tr><td colspan="5" class="st-empty-cell">Žádná data</td></tr>';
    html += '</tbody></table></div></div>';

    /* --- 6. Inactive salons (30+ days) --- */
    const inactive = inactiveSalons(records, null);
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Neaktivní salony (30+ dní bez objednávky)</div>';
    html += '<div class="st-table-scroll"><table class="st-table">';
    html += '<thead><tr><th>Salon</th><th>OZ</th><th>Poslední objednávka</th><th>Dny bez nákupu</th></tr></thead>';
    html += '<tbody>';
    inactive.forEach(s => {
      const dangerCls = s.days > 60 ? ' class="st-danger"' : '';
      html += `<tr>
        <td>${esc(s.name)}</td>
        <td>${esc(s.ozName)}</td>
        <td>${formatDate(s.lastDate)}</td>
        <td${dangerCls}><strong>${s.days}</strong></td>
      </tr>`;
    });
    if (!inactive.length) html += '<tr><td colspan="4" class="st-empty-cell">Všechny salony jsou aktivní</td></tr>';
    html += '</tbody></table></div></div>';

    return html;
  }

  /* ========== Render: OZ Dashboard ========== */
  function renderOZDashboard(records) {
    const ozName = currentOZName();
    const data = filterByOZ(records, ozName);
    const tm = thisMonthKey();
    const lm = lastMonthKey();
    const year = thisYear();

    const revThis = revenueForMonth(data, tm);
    const revLast = revenueForMonth(data, lm);
    const revYear = revenueForYear(data, year);
    const salonCount = activeSalonSet(data).size;
    const orders = orderCount(data, tm);
    const avgOrd = avgOrderValue(data, tm);
    const change = pctChange(revThis, revLast);

    let html = '';

    /* --- 1. KPI Cards (6) --- */
    html += '<div class="st-kpi-grid">';
    html += `
      <div class="st-kpi st-kpi-hero">
        <div class="st-kpi-label">Obrat tento měsíc</div>
        <div class="st-kpi-value st-kpi-big">${formatCZK(revThis)}</div>
      </div>
      <div class="st-kpi">
        <div class="st-kpi-label">Obrat minulý měsíc</div>
        <div class="st-kpi-value">${formatCZK(revLast)}</div>
        <div class="st-kpi-meta ${change >= 0 ? 'st-up' : 'st-down'}">${trendHTML(revThis, revLast)} ${formatPct(change)}</div>
      </div>
      <div class="st-kpi">
        <div class="st-kpi-label">Obrat ${year}</div>
        <div class="st-kpi-value">${formatCZK(revYear)}</div>
      </div>
      <div class="st-kpi">
        <div class="st-kpi-label">Aktivní salony</div>
        <div class="st-kpi-value">${salonCount}</div>
      </div>
      <div class="st-kpi">
        <div class="st-kpi-label">Průměrná objednávka</div>
        <div class="st-kpi-value">${formatCZK(avgOrd)}</div>
      </div>
      <div class="st-kpi">
        <div class="st-kpi-label">Objednávky tento měsíc</div>
        <div class="st-kpi-value">${orders}</div>
      </div>`;
    html += '</div>';

    /* --- 2. Monthly bar chart (12 months) --- */
    html += renderBarChart(revenueByMonth(data), 'Moje měsíční obraty posledních 12 měsíců');

    /* --- 3. Top 10 products --- */
    const top10 = topProducts(data, null, 10);
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Moje top 10 produktů</div>';
    html += '<div class="st-table-scroll"><table class="st-table">';
    html += '<thead><tr><th>#</th><th>Název</th><th>Kusy</th><th>Obrat</th></tr></thead>';
    html += '<tbody>';
    top10.forEach((p, i) => {
      html += `<tr>
        <td>${i + 1}.</td>
        <td>${esc(p.name)}</td>
        <td>${Math.round(p.qty)}</td>
        <td>${formatCZK(p.revenue)}</td>
      </tr>`;
    });
    if (!top10.length) html += '<tr><td colspan="4" class="st-empty-cell">Žádná data</td></tr>';
    html += '</tbody></table></div></div>';

    /* --- 4. My salons --- */
    const salonMap = {};
    data.forEach(r => {
      if (!r.customer) return;
      if (!salonMap[r.customer]) {
        salonMap[r.customer] = { name: r.customer, revThis: 0, revLast: 0, revTotal: 0, lastDate: '' };
      }
      salonMap[r.customer].revTotal += getPrice(r);
      if (r.monthKey === tm) salonMap[r.customer].revThis += getPrice(r);
      if (r.monthKey === lm) salonMap[r.customer].revLast += getPrice(r);
      const d = r.dateParsed || '';
      if (d > salonMap[r.customer].lastDate) salonMap[r.customer].lastDate = d;
    });
    const salons = Object.values(salonMap).sort((a, b) => b.revThis - a.revThis);

    html += '<div class="st-section">';
    html += '<div class="st-section-title">Moje salony – přehled</div>';
    html += '<div class="st-table-scroll"><table class="st-table">';
    html += '<thead><tr><th>Salon</th><th>Obrat tento měsíc</th><th>Obrat celkem</th><th>Poslední objednávka</th><th>Trend</th></tr></thead>';
    html += '<tbody>';
    salons.forEach(s => {
      html += `<tr>
        <td>${esc(s.name)}</td>
        <td>${formatCZK(s.revThis)}</td>
        <td>${formatCZK(s.revTotal)}</td>
        <td>${formatDate(s.lastDate)}</td>
        <td>${trendHTML(s.revThis, s.revLast)}</td>
      </tr>`;
    });
    if (!salons.length) html += '<tr><td colspan="5" class="st-empty-cell">Žádná data</td></tr>';
    html += '</tbody></table></div></div>';

    /* --- 5. Inactive salons --- */
    const inactive = inactiveSalons(records, ozName);
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Neaktivní salony (30+ dní bez objednávky)</div>';
    html += '<div class="st-table-scroll"><table class="st-table">';
    html += '<thead><tr><th>Salon</th><th>Poslední objednávka</th><th>Dny bez objednávky</th></tr></thead>';
    html += '<tbody>';
    inactive.forEach(s => {
      const dangerCls = s.days > 60 ? ' class="st-danger"' : '';
      html += `<tr>
        <td>${esc(s.name)}</td>
        <td>${formatDate(s.lastDate)}</td>
        <td${dangerCls}><strong>${s.days}</strong></td>
      </tr>`;
    });
    if (!inactive.length) html += '<tr><td colspan="3" class="st-empty-cell">Všechny salony jsou aktivní</td></tr>';
    html += '</tbody></table></div></div>';

    /* --- 6. Brand % bars --- */
    html += renderBrandPctBars(data, 'Obraty podle značky');

    return html;
  }

  /* ========== Main Render ========== */
  async function render() {
    const container = document.getElementById('view-stats');
    if (!container) return;

    const profile = Auth.getProfile();
    if (!profile || !profile.approved) {
      container.innerHTML = '<div class="module-empty">' + t('noAccess') + '</div>';
      return;
    }

    container.innerHTML = '<div class="st-loading">Načítám data...</div>';

    try {
      const records = await loadData();

      let html = '<div class="st-module">';
      html += renderUploadSection();

      if (!records.length) {
        html += '<div class="st-empty">Zatím žádná data. Nahrajte export z Pohody.</div>';
      } else if (isAdminOrOffice()) {
        html += renderAdminDashboard(records);
      } else {
        html += renderOZDashboard(records);
      }

      html += '</div>';
      container.innerHTML = html;

      // Bind file input
      const fileInput = document.getElementById('st-file-input');
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) handleUpload(file);
        });
      }
    } catch (err) {
      console.error('Stats render error:', err);
      container.innerHTML = '<div class="st-loading">Chyba při načítání dat.</div>';
    }
  }

  return { render };
})();
