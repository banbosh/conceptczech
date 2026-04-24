/* ============================================================
   CLIENTS.JS — Kadernici modul: sprava kaderniku/salonu, email marketing
   Concept Czech s.r.o.
   ============================================================ */

const Clients = (() => {
  let clients = [];
  let unsubscribe = null;
  let detailId = null;
  let filterOZ = '';
  let filterCity = '';
  let searchQuery = '';
  let sortBy = 'name';
  let sortAsc = true;
  let selectedIds = new Set();

  // Brevo volání přesunuto do Cloud Functions (functions/index.js: sendEmailViaBrevo).
  // Klíč už není v klientském kódu.

  function t(k) { return App.t(k); }
  function esc(s) { return App.escapeHtml(s); }

  function isAdminOrOffice() {
    const p = Auth.getProfile();
    return p && (p.role === 'admin' || p.role === 'office');
  }

  /* ========== Birthday / Nameday helpers ========== */
  function todayDDMM() {
    const d = new Date();
    return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function thisWeekDDMM() {
    const dates = [];
    for (let i = 0; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0'));
    }
    return dates;
  }

  function getCelebrants(list, field) {
    const today = todayDDMM();
    return list.filter(c => c[field] === today && c.active !== false);
  }

  function getWeekCelebrants(list, field) {
    const week = thisWeekDDMM();
    const today = todayDDMM();
    return list.filter(c => c[field] && week.includes(c[field]) && c[field] !== today && c.active !== false);
  }

  /* ========== Subscribe to Firestore ========== */
  function subscribe() {
    if (unsubscribe) unsubscribe();
    unsubscribe = db.collection('clients')
      .orderBy('name')
      .onSnapshot(snap => {
        clients = [];
        snap.forEach(doc => clients.push({ id: doc.id, ...doc.data() }));
        if (App.getActiveModule() === 'clients') render();
      });
  }

  /* ========== Filtering & Sorting ========== */
  function getFilteredClients() {
    let filtered = clients.filter(c => c.active !== false);

    if (filterOZ) {
      filtered = filtered.filter(c => c.oz === filterOZ);
    }
    if (filterCity) {
      filtered = filtered.filter(c => c.city && c.city.toLowerCase() === filterCity.toLowerCase());
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }

    filtered.sort((a, b) => {
      let va = '', vb = '';
      if (sortBy === 'name') { va = a.name || ''; vb = b.name || ''; }
      else if (sortBy === 'city') { va = a.city || ''; vb = b.city || ''; }
      else if (sortBy === 'oz') { va = a.oz || ''; vb = b.oz || ''; }
      const cmp = va.localeCompare(vb, 'cs');
      return sortAsc ? cmp : -cmp;
    });

    return filtered;
  }

  function getUniqueOZs() {
    const set = new Set();
    clients.forEach(c => { if (c.oz) set.add(c.oz); });
    return [...set].sort();
  }

  function getUniqueCities() {
    const set = new Set();
    clients.forEach(c => { if (c.city) set.add(c.city); });
    return [...set].sort();
  }

  /* ========== Main Render ========== */
  function render() {
    if (!isAdminOrOffice()) return;

    if (detailId) {
      renderDetail(detailId);
      return;
    }

    const container = document.getElementById('view-clients');
    if (!container) return;

    if (!unsubscribe) subscribe();

    const filtered = getFilteredClients();
    const ozList = getUniqueOZs();
    const cityList = getUniqueCities();

    // Birthday/Nameday alerts
    const todayBirthday = getCelebrants(clients, 'birthday');
    const todayNameday = getCelebrants(clients, 'nameday');
    const weekBirthday = getWeekCelebrants(clients, 'birthday');
    const weekNameday = getWeekCelebrants(clients, 'nameday');

    let html = '';

    // Header row: title + akční tlačítka
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px">';
    html += '<div><h1 class="page-title" style="margin-bottom:0">' + t('clientsTitle') + '</h1></div>';
    html += '<div class="flex gap-8" style="flex-wrap:wrap">';
    html += '<button class="btn btn-outline btn-sm" id="cl-import-btn">' + t('clientsImport') + '</button>';
    html += '<button class="btn btn-primary btn-sm" id="cl-add-btn">+ ' + t('clientsAdd') + '</button>';
    html += '<button class="btn btn-accent btn-sm hidden" id="cl-bulk-email-btn">' + t('clientsSendEmail') + ' (<span id="cl-sel-count">0</span>)</button>';
    html += '</div>';
    html += '</div>';

    // Alerts
    if (todayBirthday.length || todayNameday.length || weekBirthday.length || weekNameday.length) {
      html += '<div class="cl-alerts">';
      if (todayBirthday.length) {
        html += '<div class="cl-alert cl-alert-birthday"><strong>' + t('clientsBirthday') + ':</strong> ' +
          todayBirthday.map(c => esc(c.name)).join(', ') + '</div>';
      }
      if (todayNameday.length) {
        html += '<div class="cl-alert cl-alert-nameday"><strong>' + t('clientsNameday') + ':</strong> ' +
          todayNameday.map(c => esc(c.name)).join(', ') + '</div>';
      }
      if (weekBirthday.length || weekNameday.length) {
        const weekAll = [...weekBirthday, ...weekNameday];
        html += '<div class="cl-alert cl-alert-week"><strong>' + t('clientsThisWeek') + ':</strong> ' +
          weekAll.map(c => esc(c.name) + ' (' + esc(c.birthday || c.nameday) + ')').join(', ') + '</div>';
      }
      html += '</div>';
    }

    // Toolbar — vyhledávání + filtry v jednom řádku
    html += '<div class="card" style="padding:14px 16px;margin-bottom:16px">';
    html += '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">';
    html += '<input class="form-input" type="text" id="cl-search" placeholder="' + t('clientsSearch') + '" value="' + esc(searchQuery) + '" style="flex:1;min-width:200px">';
    html += '<select class="form-select" id="cl-filter-oz" style="min-width:180px;max-width:220px">';
    html += '<option value="">Všichni OZ</option>';
    ozList.forEach(oz => {
      html += '<option value="' + esc(oz) + '"' + (filterOZ === oz ? ' selected' : '') + '>' + esc(oz) + '</option>';
    });
    html += '</select>';
    html += '<select class="form-select" id="cl-filter-city" style="min-width:180px;max-width:220px">';
    html += '<option value="">Všechna města</option>';
    cityList.forEach(c => {
      html += '<option value="' + esc(c) + '"' + (filterCity === c ? ' selected' : '') + '>' + esc(c) + '</option>';
    });
    html += '</select>';
    html += '</div>';
    // Sort controls — druhý řádek uvnitř stejné karty
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-200)">';
    html += '<span style="font-size:0.78rem;color:var(--gray-500);margin-right:4px;text-transform:uppercase;letter-spacing:1px;font-weight:600">Seřadit</span>';
    html += '<button class="filter-chip' + (sortBy === 'name' ? ' active' : '') + '" data-sort="name">Název ' + (sortBy === 'name' ? (sortAsc ? '&uarr;' : '&darr;') : '') + '</button>';
    html += '<button class="filter-chip' + (sortBy === 'city' ? ' active' : '') + '" data-sort="city">Město ' + (sortBy === 'city' ? (sortAsc ? '&uarr;' : '&darr;') : '') + '</button>';
    html += '<button class="filter-chip' + (sortBy === 'oz' ? ' active' : '') + '" data-sort="oz">OZ ' + (sortBy === 'oz' ? (sortAsc ? '&uarr;' : '&darr;') : '') + '</button>';
    html += '</div>';
    html += '</div>';

    // Table (desktop) / Cards (mobile)
    if (!filtered.length) {
      if (clients.length === 0) {
        html += '<div class="card" style="text-align:center;padding:48px 24px">';
        html += '<div style="font-size:1rem;color:var(--gray-700);margin-bottom:8px;font-weight:600">Zatím tu nejsou žádní kadeřníci.</div>';
        html += '<div style="color:var(--gray-500);font-size:0.88rem;margin-bottom:20px">Naimportuj je z Pohody nebo je přidej ručně.</div>';
        html += '<button class="btn btn-primary btn-sm" id="cl-empty-import">Importovat z Pohody</button>';
        html += '</div>';
      } else {
        html += '<div class="card" style="text-align:center;padding:28px"><div style="color:var(--gray-600)">Žádní kadeřníci neodpovídají filtru.</div></div>';
      }
    } else {
      // Desktop table
      html += '<div class="cl-table-wrap"><table class="st-table cl-table">';
      html += '<thead><tr>';
      html += '<th><input type="checkbox" id="cl-select-all"></th>';
      html += '<th>' + t('clientsName') + '</th>';
      html += '<th>' + t('clientsContact') + '</th>';
      html += '<th>' + t('clientsCity') + '</th>';
      html += '<th>' + t('clientsOZ') + '</th>';
      html += '<th>Email</th>';
      html += '<th>Telefon</th>';
      html += '<th>Akce</th>';
      html += '</tr></thead><tbody>';
      filtered.forEach(c => {
        var checked = selectedIds.has(c.id) ? ' checked' : '';
        html += '<tr class="cl-row" data-id="' + c.id + '">';
        html += '<td><input type="checkbox" class="cl-cb" data-id="' + c.id + '"' + checked + '></td>';
        html += '<td><strong>' + esc(c.name) + '</strong></td>';
        html += '<td>' + esc(c.contactPerson || '') + '</td>';
        html += '<td>' + esc(c.city || '') + '</td>';
        html += '<td>' + esc(c.oz || '') + '</td>';
        html += '<td>' + esc(c.email || '') + '</td>';
        html += '<td>' + esc(c.phone || '') + '</td>';
        html += '<td><button class="btn btn-sm btn-outline cl-email-btn" data-id="' + c.id + '" title="' + t('clientsSendEmail') + '">&#9993;</button></td>';
        html += '</tr>';
      });
      html += '</tbody></table></div>';

      // Mobile cards
      html += '<div class="cl-cards">';
      filtered.forEach(c => {
        var checked = selectedIds.has(c.id) ? ' checked' : '';
        html += '<div class="card cl-card" data-id="' + c.id + '">';
        html += '<div class="cl-card-header">';
        html += '<input type="checkbox" class="cl-cb-m" data-id="' + c.id + '"' + checked + '>';
        html += '<div class="cl-card-title">' + esc(c.name) + '</div>';
        html += '</div>';
        html += '<div class="cl-card-meta">';
        if (c.contactPerson) html += '<div>' + esc(c.contactPerson) + '</div>';
        if (c.city) html += '<div>&#128205; ' + esc(c.city) + '</div>';
        if (c.oz) html += '<div>&#128100; ' + esc(c.oz) + '</div>';
        if (c.email) html += '<div>&#9993; ' + esc(c.email) + '</div>';
        if (c.phone) html += '<div>&#128222; ' + esc(c.phone) + '</div>';
        html += '</div>';
        html += '<div class="cl-card-actions">';
        html += '<button class="btn btn-sm btn-outline cl-email-btn" data-id="' + c.id + '">' + t('clientsSendEmail') + '</button>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '<div style="font-size:0.8rem;color:var(--gray-400);margin-top:12px">Celkem: ' + filtered.length + ' / ' + clients.length + '</div>';

    container.innerHTML = html;
    bindListEvents(container);
  }

  /* ========== List Event Bindings ========== */
  function bindListEvents(container) {
    // Search
    var searchInput = container.querySelector('#cl-search');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value;
        render();
      });
      setTimeout(function() {
        var el = document.getElementById('cl-search');
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      }, 0);
    }

    // Filters
    var ozFilter = container.querySelector('#cl-filter-oz');
    if (ozFilter) ozFilter.addEventListener('change', function(e) { filterOZ = e.target.value; render(); });
    var cityFilter = container.querySelector('#cl-filter-city');
    if (cityFilter) cityFilter.addEventListener('change', function(e) { filterCity = e.target.value; render(); });

    // Sort
    container.querySelectorAll('[data-sort]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var s = btn.dataset.sort;
        if (sortBy === s) sortAsc = !sortAsc;
        else { sortBy = s; sortAsc = true; }
        render();
      });
    });

    // Row clicks (open detail)
    container.querySelectorAll('.cl-row').forEach(function(row) {
      row.addEventListener('click', function(e) {
        if (e.target.type === 'checkbox' || e.target.closest('button')) return;
        detailId = row.dataset.id;
        render();
      });
    });
    container.querySelectorAll('.cl-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        if (e.target.type === 'checkbox' || e.target.closest('button')) return;
        detailId = card.dataset.id;
        render();
      });
    });

    // Checkboxes
    var updateBulkBtn = function() {
      var bulkBtn = container.querySelector('#cl-bulk-email-btn');
      var countSpan = container.querySelector('#cl-sel-count');
      if (bulkBtn) {
        bulkBtn.classList.toggle('hidden', selectedIds.size === 0);
        if (countSpan) countSpan.textContent = selectedIds.size;
      }
    };

    container.querySelectorAll('.cl-cb, .cl-cb-m').forEach(function(cb) {
      cb.addEventListener('change', function(e) {
        e.stopPropagation();
        var id = cb.dataset.id;
        if (cb.checked) selectedIds.add(id); else selectedIds.delete(id);
        container.querySelectorAll('[data-id="' + id + '"]').forEach(function(el) {
          if (el.type === 'checkbox') el.checked = cb.checked;
        });
        updateBulkBtn();
      });
    });

    var selectAll = container.querySelector('#cl-select-all');
    if (selectAll) {
      selectAll.addEventListener('change', function() {
        var filtered = getFilteredClients();
        if (selectAll.checked) {
          filtered.forEach(function(c) { selectedIds.add(c.id); });
        } else {
          selectedIds.clear();
        }
        render();
      });
    }

    // Add button
    var addBtn = container.querySelector('#cl-add-btn');
    if (addBtn) addBtn.addEventListener('click', showAddModal);

    // Import button (toolbar)
    var importBtn = container.querySelector('#cl-import-btn');
    if (importBtn) importBtn.addEventListener('click', showImportModal);
    // Import button (empty state)
    var emptyImportBtn = container.querySelector('#cl-empty-import');
    if (emptyImportBtn) emptyImportBtn.addEventListener('click', showImportModal);

    // Bulk email button
    var bulkBtn = container.querySelector('#cl-bulk-email-btn');
    if (bulkBtn) bulkBtn.addEventListener('click', function() { showBulkEmailModal(); });

    // Individual email buttons
    container.querySelectorAll('.cl-email-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        showEmailModal(btn.dataset.id);
      });
    });

    updateBulkBtn();
  }

  /* ========== Detail View ========== */
  function renderDetail(id) {
    var container = document.getElementById('view-clients');
    if (!container) return;
    var client = clients.find(function(c) { return c.id === id; });
    if (!client) { detailId = null; render(); return; }

    var html = '<button class="detail-back" id="cl-back">&larr; ' + t('back') + '</button>';
    html += '<div class="card" style="margin-bottom:16px">';
    html += '<h2 style="font-size:1.15rem;font-weight:700;color:var(--primary);margin-bottom:12px">' + esc(client.name) + '</h2>';
    html += '<div class="cl-detail-grid">';
    html += '<div class="cl-detail-item"><span class="cl-detail-label">' + t('clientsContact') + ':</span> ' + esc(client.contactPerson || '-') + '</div>';
    html += '<div class="cl-detail-item"><span class="cl-detail-label">Email:</span> ' + esc(client.email || '-') + '</div>';
    html += '<div class="cl-detail-item"><span class="cl-detail-label">Telefon:</span> ' + esc(client.phone || '-') + '</div>';
    html += '<div class="cl-detail-item"><span class="cl-detail-label">' + t('clientsCity') + ':</span> ' + esc(client.city || '-') + '</div>';
    html += '<div class="cl-detail-item"><span class="cl-detail-label">Adresa:</span> ' + esc(client.address || '-') + '</div>';
    html += '<div class="cl-detail-item"><span class="cl-detail-label">' + t('clientsOZ') + ':</span> ' + esc(client.oz || '-') + '</div>';
    html += '<div class="cl-detail-item"><span class="cl-detail-label">Narozeniny:</span> ' + esc(client.birthday || '-') + '</div>';
    html += '<div class="cl-detail-item"><span class="cl-detail-label">Svátek:</span> ' + esc(client.nameday || '-') + '</div>';
    if (client.notes) {
      html += '<div class="cl-detail-item" style="grid-column:1/-1"><span class="cl-detail-label">Poznámky:</span> ' + esc(client.notes) + '</div>';
    }
    html += '</div>';
    html += '<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">';
    html += '<button class="btn btn-primary btn-sm" id="cl-edit-btn">Upravit</button>';
    html += '<button class="btn btn-accent btn-sm" id="cl-send-email-btn">' + t('clientsSendEmail') + '</button>';
    html += '<button class="btn btn-danger btn-sm" id="cl-delete-btn">' + t('delete') + '</button>';
    html += '</div>';
    html += '</div>';

    // Email log history
    html += '<div class="card"><h3 style="font-size:1rem;font-weight:700;color:var(--primary);margin-bottom:12px">Historie e-mailů</h3>';
    html += '<div id="cl-email-log"><div class="spinner"></div></div>';
    html += '</div>';

    container.innerHTML = html;

    // Back button
    container.querySelector('#cl-back').addEventListener('click', function() { detailId = null; render(); });

    // Edit
    container.querySelector('#cl-edit-btn').addEventListener('click', function() { showEditModal(client); });

    // Send email
    container.querySelector('#cl-send-email-btn').addEventListener('click', function() { showEmailModal(client.id); });

    // Delete
    container.querySelector('#cl-delete-btn').addEventListener('click', async function() {
      if (!confirm('Opravdu smazat ' + client.name + '?')) return;
      await db.collection('clients').doc(client.id).delete();
      App.toast('Smazáno', 'success');
      App.logActivity('client_delete', client.name);
      detailId = null;
      render();
    });

    // Load email log
    loadEmailLog(client.email || client.id);
  }

  async function loadEmailLog(emailOrId) {
    var logContainer = document.getElementById('cl-email-log');
    if (!logContainer) return;

    try {
      var snap = await db.collection('email_log')
        .where('recipientEmail', '==', emailOrId)
        .orderBy('sentAt', 'desc')
        .limit(20)
        .get();

      if (snap.empty) {
        logContainer.innerHTML = '<div style="color:var(--gray-400);font-size:0.85rem">Žádné odeslané e-maily</div>';
        return;
      }

      var html = '<div class="cl-email-log-list">';
      snap.forEach(function(doc) {
        var d = doc.data();
        var date = d.sentAt ? App.formatDateTime(d.sentAt) : '';
        html += '<div class="cl-email-log-item">';
        html += '<div class="cl-email-log-subject">' + esc(d.subject || '') + '</div>';
        html += '<div class="cl-email-log-meta">' + esc(d.type || '') + ' | ' + date + ' | ';
        html += d.success ? '<span style="color:var(--success)">Odeslano</span>' : '<span style="color:var(--danger)">Chyba</span>';
        html += '</div></div>';
      });
      html += '</div>';
      logContainer.innerHTML = html;
    } catch (err) {
      logContainer.innerHTML = '<div style="color:var(--gray-400);font-size:0.85rem">Nelze nacist historii e-mailů</div>';
    }
  }

  /* ========== Add / Edit Modal ========== */
  function showAddModal() {
    showClientForm(null);
  }

  function showEditModal(client) {
    showClientForm(client);
  }

  function showClientForm(client) {
    var isEdit = !!client;
    var title = isEdit ? 'Upravit kadeřníka' : t('clientsAdd');
    var ozList = getUniqueOZs();

    var html = '<div class="modal-header">';
    html += '<div class="modal-title">' + title + '</div>';
    html += '<button class="modal-close" onclick="App.closeModal()">&times;</button>';
    html += '</div>';
    html += '<div class="form-group"><label class="form-label">' + t('clientsName') + ' *</label>';
    html += '<input class="form-input" id="cf-name" value="' + esc(client ? client.name || '' : '') + '" required></div>';
    html += '<div class="form-group"><label class="form-label">' + t('clientsContact') + '</label>';
    html += '<input class="form-input" id="cf-contact" value="' + esc(client ? client.contactPerson || '' : '') + '"></div>';
    html += '<div class="form-group"><label class="form-label">Email</label>';
    html += '<input class="form-input" type="email" id="cf-email" value="' + esc(client ? client.email || '' : '') + '"></div>';
    html += '<div class="form-group"><label class="form-label">Telefon</label>';
    html += '<input class="form-input" type="tel" id="cf-phone" value="' + esc(client ? client.phone || '' : '') + '"></div>';
    html += '<div class="form-group"><label class="form-label">' + t('clientsCity') + '</label>';
    html += '<input class="form-input" id="cf-city" value="' + esc(client ? client.city || '' : '') + '"></div>';
    html += '<div class="form-group"><label class="form-label">Adresa</label>';
    html += '<input class="form-input" id="cf-address" value="' + esc(client ? client.address || '' : '') + '"></div>';
    html += '<div class="form-group"><label class="form-label">' + t('clientsOZ') + '</label>';
    html += '<input class="form-input" id="cf-oz" list="cf-oz-list" value="' + esc(client ? client.oz || '' : '') + '">';
    html += '<datalist id="cf-oz-list">';
    ozList.forEach(function(oz) { html += '<option value="' + esc(oz) + '">'; });
    html += '</datalist></div>';
    html += '<div style="display:flex;gap:12px">';
    html += '<div class="form-group" style="flex:1"><label class="form-label">Narozeniny (DD.MM)</label>';
    html += '<input class="form-input" id="cf-birthday" placeholder="01.03" value="' + esc(client ? client.birthday || '' : '') + '"></div>';
    html += '<div class="form-group" style="flex:1"><label class="form-label">Svátek (DD.MM)</label>';
    html += '<input class="form-input" id="cf-nameday" placeholder="19.03" value="' + esc(client ? client.nameday || '' : '') + '"></div>';
    html += '</div>';
    html += '<div class="form-group"><label class="form-label">Poznámky</label>';
    html += '<textarea class="form-textarea" id="cf-notes">' + esc(client ? client.notes || '' : '') + '</textarea></div>';
    html += '<button class="btn btn-primary btn-block" id="cf-save">' + t('save') + '</button>';

    App.openModal(html);

    document.getElementById('cf-save').addEventListener('click', async function() {
      var name = document.getElementById('cf-name').value.trim();
      if (!name) { App.toast('Vyplňte název salonu', 'error'); return; }

      var data = {
        name: name,
        contactPerson: document.getElementById('cf-contact').value.trim(),
        email: document.getElementById('cf-email').value.trim(),
        phone: document.getElementById('cf-phone').value.trim(),
        city: document.getElementById('cf-city').value.trim(),
        address: document.getElementById('cf-address').value.trim(),
        oz: document.getElementById('cf-oz').value.trim(),
        birthday: document.getElementById('cf-birthday').value.trim(),
        nameday: document.getElementById('cf-nameday').value.trim(),
        notes: document.getElementById('cf-notes').value.trim(),
        active: true
      };

      var btn = document.getElementById('cf-save');
      btn.disabled = true;

      try {
        if (isEdit) {
          await db.collection('clients').doc(client.id).update(data);
          App.toast('Uloženo', 'success');
          App.logActivity('client_update', name);
        } else {
          data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          await db.collection('clients').add(data);
          App.toast('Kadeřník přidán', 'success');
          App.logActivity('client_create', name);
        }
        App.closeModal();
      } catch (err) {
        App.toast('Chyba: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ========== Import z Pohody (CSV / XLSX) ========== */
  function showImportModal() {
    var html = '<div class="modal-header">';
    html += '<div class="modal-title">Import z Pohody</div>';
    html += '<button class="modal-close" onclick="App.closeModal()">&times;</button>';
    html += '</div>';
    html += '<div style="font-size:0.88rem;color:var(--gray-700);margin-bottom:16px;line-height:1.6">';
    html += 'Nahraj CSV, XLSX nebo XLS export z Pohody. Aplikace automaticky rozpozná sloupce:';
    html += '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">';
    html += ['Firma', 'Email', 'Telefon', 'Město', 'Ulice', 'IČO', 'Obchodní zástupce', 'Narozeniny', 'Svátek'].map(function(c) {
      return '<code style="background:var(--gray-100);padding:2px 8px;border-radius:4px;font-size:0.78rem">' + c + '</code>';
    }).join('');
    html += '</div></div>';
    html += '<div class="form-group">';
    html += '<label class="st-upload-btn" for="import-csv-file" style="cursor:pointer">';
    html += '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
    html += ' Vybrat soubor (CSV / XLSX / XLS)</label>';
    html += '<input type="file" id="import-csv-file" accept=".csv,.xlsx,.xls,.tsv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" style="display:none">';
    html += '</div>';
    html += '<div id="import-preview" class="hidden"></div>';
    html += '<div class="form-group"><label class="form-label">Duplicity (stejný e-mail)</label>';
    html += '<select class="form-select" id="import-duplicity">';
    html += '<option value="update">Aktualizovat (doporučeno)</option>';
    html += '<option value="skip">Přeskočit</option>';
    html += '</select></div>';
    html += '<button class="btn btn-primary btn-block hidden" id="import-confirm">Importovat</button>';

    App.openModal(html);

    var importRows = [];

    document.getElementById('import-csv-file').addEventListener('change', async function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var rows;
      try {
        rows = await parseImportFile(file);
      } catch (err) {
        App.toast('Chyba při čtení souboru: ' + (err.message || err), 'error');
        return;
      }
      importRows = rows;

      if (!rows.length) {
        App.toast('CSV neobsahuje data', 'error');
        return;
      }

      var preview = document.getElementById('import-preview');
      var ph = '<div style="font-size:0.85rem;margin-bottom:8px"><strong>Náhled (' + rows.length + ' zaznamu):</strong></div>';
      ph += '<div class="st-table-scroll"><table class="st-table" style="min-width:400px"><thead><tr><th>Firma</th><th>Email</th><th>Mesto</th><th>OZ</th></tr></thead><tbody>';
      rows.slice(0, 5).forEach(function(r) {
        ph += '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.email) + '</td><td>' + esc(r.city) + '</td><td>' + esc(r.oz) + '</td></tr>';
      });
      if (rows.length > 5) ph += '<tr><td colspan="4" style="color:var(--gray-400);text-align:center">... a dalsich ' + (rows.length - 5) + '</td></tr>';
      ph += '</tbody></table></div>';
      preview.innerHTML = ph;
      preview.classList.remove('hidden');
      document.getElementById('import-confirm').classList.remove('hidden');
    });

    document.getElementById('import-confirm').addEventListener('click', async function() {
      if (!importRows.length) return;
      var btn = document.getElementById('import-confirm');
      btn.disabled = true;
      btn.textContent = 'Importuji...';

      var duplicity = document.getElementById('import-duplicity').value;
      var existingEmails = {};
      clients.forEach(function(c) { if (c.email) existingEmails[c.email.toLowerCase()] = c.id; });

      var imported = 0, skipped = 0, updated = 0;

      // Chunk into batches of 400 (Firestore limit is 500)
      var operations = [];
      for (var i = 0; i < importRows.length; i++) {
        var row = importRows[i];
        var emailLower = (row.email || '').toLowerCase();
        var existingId = emailLower ? existingEmails[emailLower] : null;

        if (existingId) {
          if (duplicity === 'skip') { skipped++; continue; }
          var updateData = {
            name: row.name,
            phone: row.phone || '',
            city: row.city || '',
            address: row.address || '',
            oz: row.oz || ''
          };
          if (row.contactPerson) updateData.contactPerson = row.contactPerson;
          if (row.birthday) updateData.birthday = row.birthday;
          if (row.nameday) updateData.nameday = row.nameday;
          if (row.ico) updateData.ico = row.ico;
          if (row.dic) updateData.dic = row.dic;
          operations.push({ type: 'update', id: existingId, data: updateData });
          updated++;
        } else {
          operations.push({ type: 'set', data: {
            name: row.name,
            contactPerson: row.contactPerson || '',
            email: row.email || '',
            phone: row.phone || '',
            city: row.city || '',
            address: row.address || '',
            oz: row.oz || '',
            birthday: row.birthday || '',
            nameday: row.nameday || '',
            ico: row.ico || '',
            dic: row.dic || '',
            notes: '',
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }});
          imported++;
        }
      }

      try {
        // Process in batches of 400
        for (var b = 0; b < operations.length; b += 400) {
          var chunk = operations.slice(b, b + 400);
          var batch = db.batch();
          chunk.forEach(function(op) {
            if (op.type === 'update') {
              batch.update(db.collection('clients').doc(op.id), op.data);
            } else {
              batch.set(db.collection('clients').doc(), op.data);
            }
          });
          await batch.commit();
        }
        App.toast('Import dokončen: ' + imported + ' nových, ' + updated + ' aktualizovaných, ' + skipped + ' přeskočených', 'success');
        App.logActivity('client_import', imported + ' nových, ' + updated + ' aktualizovanych');
        App.closeModal();
      } catch (err) {
        App.toast('Chyba importu: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Importovat';
      }
    });
  }

  async function parseImportFile(file) {
    var name = (file.name || '').toLowerCase();
    var isXlsx = /\.xlsx?$/.test(name) ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel';

    if (isXlsx) {
      if (!window.XLSX) throw new Error('Knihovna XLSX se nenačetla. Refreshni stránku (Ctrl+Shift+R).');
      var buf = await file.arrayBuffer();
      var wb = XLSX.read(buf, { type: 'array', cellDates: true });
      var sheetName = wb.SheetNames[0];
      if (!sheetName) throw new Error('XLSX soubor neobsahuje žádný list.');
      var ws = wb.Sheets[sheetName];
      // Převedeme na CSV (middle layer) a pak rozparsujeme stejnou cestou
      var csv = XLSX.utils.sheet_to_csv(ws, { FS: ';', RS: '\n' });
      return parseImportCSV(csv);
    }

    // CSV / TSV / text
    var text = await file.text();
    return parseImportCSV(text);
  }

  function parseImportCSV(text) {
    var lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    var headerLine = lines[0];
    var delimiter = headerLine.includes(';') ? ';' : ',';
    var headers = headerLine.split(delimiter).map(function(h) { return h.trim().replace(/^"|"$/g, ''); });
    var rows = [];

    var find = function(needles, obj) {
      var keys = Object.keys(obj);
      for (var n = 0; n < needles.length; n++) {
        var k = keys.find(function(key) { return key.toLowerCase().includes(needles[n].toLowerCase()); });
        if (k && obj[k]) return obj[k];
      }
      return '';
    };

    for (var i = 1; i < lines.length; i++) {
      var vals = lines[i].split(delimiter).map(function(v) { return v.trim().replace(/^"|"$/g, ''); });
      if (vals.length < 2) continue;
      var obj = {};
      headers.forEach(function(h, idx) { obj[h] = vals[idx] || ''; });

      rows.push({
        name: find(['Firma', 'firma', 'Nazev', 'nazev', 'Jmeno', 'Název', 'Jméno'], obj),
        contactPerson: find(['Kontaktní osoba', 'Kontakt', 'Kontaktni', 'Contact'], obj),
        email: find(['Email', 'email', 'E-mail', 'e-mail', 'Mail'], obj),
        phone: find(['Telefon', 'telefon', 'Tel', 'tel', 'Mobil', 'Phone'], obj),
        city: find(['Mesto', 'mesto', 'Město', 'City'], obj),
        address: find(['Ulice', 'ulice', 'Adresa', 'adresa', 'Street'], obj),
        oz: find(['Obchodní zástupce', 'obchodni zastupce', 'OZ', 'Zastupce', 'Zástupce'], obj),
        birthday: normalizeDDMM(find(['Narozeniny', 'narozeniny', 'Datum narození', 'Birthday'], obj)),
        nameday: normalizeDDMM(find(['Svátek', 'svatek', 'Nameday'], obj)),
        ico: find(['IČO', 'ICO', 'ico'], obj),
        dic: find(['DIČ', 'DIC', 'dic'], obj)
      });
    }
    return rows.filter(function(r) { return r.name; });
  }

  // Pohoda obvykle ukládá datum ve formátu DD.MM.RRRR nebo RRRR-MM-DD
  // Potřebujeme jen DD.MM pro oslavence.
  function normalizeDDMM(val) {
    if (!val) return '';
    var s = String(val).trim();
    // Formát DD.MM.YYYY nebo DD.MM
    var m1 = s.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?$/);
    if (m1) return pad2(m1[1]) + '.' + pad2(m1[2]);
    // Formát YYYY-MM-DD
    var m2 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m2) return pad2(m2[3]) + '.' + pad2(m2[2]);
    // Formát D/M/YYYY
    var m3 = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (m3) return pad2(m3[1]) + '.' + pad2(m3[2]);
    return s;
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  /* ========== Email Sending ========== */
  function showEmailModal(clientId) {
    var client = clients.find(function(c) { return c.id === clientId; });
    if (!client || !client.email) {
      App.toast('Klient nemá e-mail', 'error');
      return;
    }
    showEmailForm([client]);
  }

  function showBulkEmailModal() {
    var selected = clients.filter(function(c) { return selectedIds.has(c.id) && c.email; });
    if (!selected.length) {
      App.toast('Vyberte klienty s e-mailem', 'error');
      return;
    }
    showEmailForm(selected);
  }

  function getEmailSubject(type) {
    switch (type) {
      case 'birthday': return 'Vsechno nejlepsi k narozeninam!';
      case 'nameday': return 'Vsechno nejlepsi ke svatku!';
      case 'promo': return 'Specialni nabidka pro Vas!';
      case 'newsletter': return 'Novinky od Concept Czech';
      default: return '';
    }
  }

  function getEmailBody(type, clientName) {
    var name = clientName || 'vazeny partnere';
    switch (type) {
      case 'birthday':
        return 'Mily/a ' + name + ',\n\nprejeme Vam vse nejlepsi k narozeninam! Jako darek od nas mate slevu na pristi objednavku.\n\nKod: [KOD]\n\nS pratelskym pozdravem,\nTym Concept Czech';
      case 'nameday':
        return 'Mily/a ' + name + ',\n\nprejeme Vam vse nejlepsi ke svatku! Jako darek od nas mate slevu na pristi objednavku.\n\nKod: [KOD]\n\nS pratelskym pozdravem,\nTym Concept Czech';
      case 'promo':
        return 'Vazeni partneri,\n\npripravili jsme pro Vas specialni nabidku. Vyuzijte slevu na nase produkty.\n\nKod: [KOD]\n\nS pozdravem,\nTym Concept Czech';
      case 'newsletter':
        return 'Vazeni partneri,\n\nprinasime Vam novinky z nasi nabidky.\n\nS pozdravem,\nTym Concept Czech';
      default:
        return '';
    }
  }

  function showEmailForm(recipients) {
    var isBulk = recipients.length > 1;
    var singleName = recipients.length === 1 ? (recipients[0].contactPerson || recipients[0].name) : '';

    var html = '<div class="modal-header">';
    html += '<div class="modal-title">' + t('clientsSendEmail');
    html += isBulk ? ' (' + recipients.length + ' prijemcu)' : ' &mdash; ' + esc(recipients[0].name);
    html += '</div>';
    html += '<button class="modal-close" onclick="App.closeModal()">&times;</button>';
    html += '</div>';

    html += '<div class="form-group"><label class="form-label">Typ e-mailu</label>';
    html += '<select class="form-select" id="em-type">';
    html += '<option value="birthday">Narozeniny</option>';
    html += '<option value="nameday">Svátek</option>';
    html += '<option value="promo">Akce / Sleva</option>';
    html += '<option value="newsletter">Newsletter</option>';
    html += '<option value="custom">Vlastní</option>';
    html += '</select></div>';

    html += '<div class="form-group"><label class="form-label">Předmět</label>';
    html += '<input class="form-input" id="em-subject" value="' + esc(getEmailSubject('birthday')) + '"></div>';

    html += '<div class="form-group"><label class="form-label">Tělo e-mailu (HTML povoleno)</label>';
    html += '<textarea class="form-textarea" id="em-body" style="min-height:150px">' + esc(getEmailBody('birthday', singleName)) + '</textarea></div>';

    html += '<div class="form-group"><label class="form-label">Slevový kód (volitelne)</label>';
    html += '<input class="form-input" id="em-discount" placeholder="SLEVA20"></div>';

    html += '<div class="login-error" id="em-error" style="display:none;margin-bottom:12px"></div>';
    html += '<button class="btn btn-primary btn-block" id="em-send">' + t('clientsSendEmail') + '</button>';

    App.openModal(html);

    // Update subject/body when type changes
    document.getElementById('em-type').addEventListener('change', function(e) {
      var type = e.target.value;
      document.getElementById('em-subject').value = getEmailSubject(type);
      document.getElementById('em-body').value = getEmailBody(type, singleName);
    });

    document.getElementById('em-send').addEventListener('click', async function() {
      var type = document.getElementById('em-type').value;
      var subject = document.getElementById('em-subject').value.trim();
      var body = document.getElementById('em-body').value.trim();
      var discount = document.getElementById('em-discount').value.trim();
      var errEl = document.getElementById('em-error');

      if (!subject || !body) {
        errEl.textContent = 'Vyplňte předmět a tělo e-mailu';
        errEl.style.display = 'block';
        return;
      }

      var btn = document.getElementById('em-send');
      btn.disabled = true;
      btn.textContent = 'Odesílám...';

      var successCount = 0, errorCount = 0;

      for (var i = 0; i < recipients.length; i++) {
        var recipient = recipients[i];
        if (!recipient.email) continue;
        var personalBody = body
          .replace(/\[jmeno\]/gi, recipient.contactPerson || recipient.name)
          .replace(/\[KOD\]/gi, discount)
          .replace(/\[X\]/gi, discount);

        var emailHtml = buildEmailHTML(subject, personalBody, discount, type);

        try {
          var sendFn = firebase.app().functions('europe-west1').httpsCallable('sendEmailViaBrevo');
          await sendFn({
            to: recipient.email,
            toName: recipient.name,
            subject: subject,
            htmlContent: emailHtml
          });
          var success = true;

          await db.collection('email_log').add({
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            clientId: recipient.id,
            type: type,
            subject: subject,
            success: success,
            sentAt: firebase.firestore.FieldValue.serverTimestamp(),
            sentBy: Auth.getProfile().id
          });

          successCount++;
        } catch (err) {
          errorCount++;
          await db.collection('email_log').add({
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            clientId: recipient.id,
            type: type,
            subject: subject,
            success: false,
            error: err.message,
            sentAt: firebase.firestore.FieldValue.serverTimestamp(),
            sentBy: Auth.getProfile().id
          });
        }
      }

      if (errorCount === 0) {
        App.toast('Odesláno ' + successCount + ' e-mailů', 'success');
        App.logActivity('email_sent', successCount + ' e-mailů, typ: ' + type);
      } else {
        App.toast('Odeslano: ' + successCount + ', Chyby: ' + errorCount, errorCount > successCount ? 'error' : 'success');
      }
      App.closeModal();
      selectedIds.clear();
    });
  }

  /* ========== Email HTML Template ========== */
  function buildEmailHTML(subject, body, discount, emailType) {
    var bodyHtml = esc(body).replace(/\n/g, '<br>');

    var label = '';
    if (emailType === 'birthday') label = 'Narozeninové přání';
    else if (emailType === 'nameday') label = 'Přání ke svátku';
    else if (emailType === 'promo') label = 'Speciální nabídka';
    else if (emailType === 'newsletter') label = 'Novinky';

    var labelHtml = label
      ? '<div style="font-size:11px;color:#1e40af;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-weight:600">' + esc(label) + '</div>'
      : '';

    var discountHtml = '';
    if (discount) {
      discountHtml =
        '<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;background:#1e3a8a;border-radius:8px"><tr><td style="padding:28px 24px;text-align:center">' +
          '<div style="font-size:11px;color:#93c5fd;text-transform:uppercase;letter-spacing:3px;margin-bottom:10px">Váš slevový kód</div>' +
          '<div style="font-size:32px;font-weight:700;color:#fbbf24;letter-spacing:6px;font-family:ui-monospace,Menlo,Consolas,monospace">' + esc(discount) + '</div>' +
          '<div style="font-size:11px;color:#cbd5e1;margin-top:10px;letter-spacing:1px">Platnost 14 dní od doručení</div>' +
        '</td></tr></table>' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px"><tr><td style="padding:16px 20px;text-align:center">' +
          '<div style="font-size:11px;color:#475569;margin-bottom:6px;letter-spacing:2px;text-transform:uppercase;font-weight:600">Jak uplatnit slevu</div>' +
          '<div style="font-size:13px;color:#475569;line-height:1.7">Sleva platí na Vaši příští objednávku. Kontaktujte svého obchodního zástupce a sdělte mu tento kód.</div>' +
        '</td></tr></table>';
    }

    return '<!DOCTYPE html>' +
      '<html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">' +
      '<meta name="color-scheme" content="light">' +
      '<meta name="supported-color-schemes" content="light">' +
      '<title>' + esc(subject) + '</title>' +
      '<style>' +
      ':root { color-scheme: light only; }' +
      'body { margin:0;padding:0;background:#f1f5f9 !important; }' +
      '@media (max-width:600px) {' +
      '  .card { width:100% !important; border-radius:0 !important; }' +
      '  .body-cell { padding:28px 20px !important; }' +
      '}' +
      '</style>' +
      '</head>' +
      '<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0">' +
      '<tr><td align="center">' +
      '<table width="600" cellpadding="0" cellspacing="0" class="card" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,0.08)">' +
      // Accent top bar (yellow)
      '<tr><td style="background:#fbbf24;height:4px;font-size:0;line-height:0">&nbsp;</td></tr>' +
      // Header (deep blue)
      '<tr><td style="background:#1e3a8a;padding:28px 32px">' +
      '<div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Concept Czech</div>' +
      '<div style="color:#93c5fd;font-size:12px;letter-spacing:1px;margin-top:4px">Velkoobchod pro kadeřníky</div>' +
      '</td></tr>' +
      // White body
      '<tr><td class="body-cell" style="padding:36px 40px 28px;background:#ffffff">' +
      labelHtml +
      '<h1 style="font-size:22px;color:#0f172a;margin:0 0 20px 0;font-weight:700;letter-spacing:0.3px">' + esc(subject) + '</h1>' +
      '<div style="font-size:15px;line-height:1.8;color:#334155;margin-bottom:24px">' + bodyHtml + '</div>' +
      discountHtml +
      '<div style="text-align:center;margin-top:4px">' +
      '<a href="https://www.conceptczech.cz" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 28px;border-radius:6px;letter-spacing:0.5px">Navštívit náš web</a>' +
      '</div>' +
      '</td></tr>' +
      // Footer
      '<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center">' +
      '<div style="font-size:12px;color:#475569">' +
      '<a href="mailto:podpora@conceptczech.cz" style="color:#1e40af;text-decoration:none;font-weight:600">podpora@conceptczech.cz</a>' +
      ' &nbsp;·&nbsp; ' +
      '<a href="https://www.conceptczech.cz" style="color:#1e40af;text-decoration:none;font-weight:600">www.conceptczech.cz</a>' +
      '</div>' +
      '<div style="font-size:11px;color:#94a3b8;margin-top:8px">Concept Czech s.r.o. · Jesenická 513, 252 44 Psáry - Dolní Jirčany</div>' +
      '</td></tr>' +

      '</table>' +
      '</td></tr></table></body></html>';
  }

  return { render, subscribe, showAddModal, _getClients: () => clients };
})();
