/* ============================================================
   ADMIN MODULE
   ============================================================ */
const Admin = (() => {

  function render() {
    const container = document.getElementById('view-admin');
    const profile = Auth.getProfile();

    if (!profile || !Auth.isAdmin(profile)) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-text">${App.t('noAccess')}</div></div>`;
      return;
    }

    const users = App.getAllUsers();
    const pending = Object.values(users).filter(u => !u.approved || u.role === 'pending');
    const allUsers = Object.values(users).filter(u => u.approved && u.role !== 'pending');

    let html = `<h1 class="page-title">${App.t('adminTitle')}</h1>`;

    // Pending users
    html += `<div class="admin-section">
      <div class="admin-section-title">${App.t('pendingUsers')}</div>`;

    if (pending.length === 0) {
      html += `<div style="font-size:0.85rem;color:var(--gray-500)">${App.t('noPending')}</div>`;
    } else {
      pending.forEach(u => {
        html += `<div class="card pending-user-card">
          <div>
            <div style="font-weight:600">${App.escapeHtml(u.displayName || u.email)}</div>
            <div style="font-size:0.8rem;color:var(--gray-500)">${App.escapeHtml(u.email)}</div>
          </div>
          <div class="pending-actions">
            <button class="btn btn-sm btn-primary" data-approve="${u.id}">${App.t('approve')}</button>
            <button class="btn btn-sm btn-danger" data-reject="${u.id}">${App.t('reject')}</button>
          </div>
        </div>`;
      });
    }
    html += `</div>`;

    // All users management
    html += `<div class="admin-section">
      <div class="admin-section-title">${App.t('manageUsers')} (${allUsers.length})</div>`;

    allUsers.forEach(u => {
      html += `<div class="card team-card" data-uid="${u.id}" style="cursor:pointer">
        <div class="team-avatar" style="width:36px;height:36px;font-size:0.85rem">${getInitials(u.displayName || u.email)}</div>
        <div class="team-info">
          <div class="team-name">${App.escapeHtml(u.displayName || u.email)}</div>
          <div class="team-role">${App.roleLabel(u.role)} &middot; ${App.escapeHtml(u.email)}</div>
        </div>
      </div>`;
    });
    html += `</div>`;

    // Quick add task
    html += `<div class="admin-section">
      <div class="admin-section-title">${App.t('addTask')}</div>
      <button class="btn btn-primary" id="admin-add-task">${App.t('addTask')}</button>
    </div>`;

    // Telegram commands
    html += `<div class="admin-section">
      <div class="admin-section-title">${App.t('telegramCommands')}</div>
      <div id="telegram-commands-list"><div class="spinner"></div></div>
    </div>`;

    // Activity log
    html += `<div class="admin-section">
      <div class="admin-section-title">${App.t('activityLog')}</div>
      <div id="activity-log"><div class="spinner"></div></div>
    </div>`;

    container.innerHTML = html;

    // Approve/Reject handlers
    container.querySelectorAll('[data-approve]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.approve;
        await approveUser(uid);
      });
    });

    container.querySelectorAll('[data-reject]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.reject;
        await rejectUser(uid);
      });
    });

    // Edit user
    container.querySelectorAll('.card[data-uid]').forEach(card => {
      card.addEventListener('click', () => {
        showEditRoleModal(card.dataset.uid);
      });
    });

    // Quick add task
    container.querySelector('#admin-add-task').addEventListener('click', () => {
      Tasks.showAddModal();
    });

    // Load telegram commands
    loadTelegramCommands(container.querySelector('#telegram-commands-list'));

    // Load activity log
    loadActivityLog(container.querySelector('#activity-log'));
  }

  async function approveUser(uid) {
    const roleHtml = App.ROLES.map(r =>
      `<option value="${r}">${App.roleLabel(r)}</option>`
    ).join('');

    const html = `
      <div class="modal-header">
        <h3 class="modal-title">${App.t('approve')}</h3>
        <button class="modal-close" id="modal-close-btn">&times;</button>
      </div>
      <div class="form-group">
        <label class="form-label">${App.t('role')}</label>
        <select class="form-select" id="approve-role">${roleHtml}</select>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-primary flex-1" id="confirm-approve">${App.t('approve')}</button>
        <button class="btn btn-outline" id="cancel-approve">${App.t('cancel')}</button>
      </div>`;

    App.openModal(html);
    document.getElementById('modal-close-btn').addEventListener('click', App.closeModal);
    document.getElementById('cancel-approve').addEventListener('click', App.closeModal);
    document.getElementById('confirm-approve').addEventListener('click', async () => {
      const role = document.getElementById('approve-role').value;
      await db.collection('users').doc(uid).update({ approved: true, role });
      App.logActivity('user_approve', uid + ' as ' + role);
      await App.loadAllUsers();
      App.closeModal();
      render();
      App.toast(App.t('approve') + ' OK', 'success');
    });
  }

  async function rejectUser(uid) {
    if (!confirm(App.t('reject') + '?')) return;
    await db.collection('users').doc(uid).delete();
    App.logActivity('user_reject', uid);
    await App.loadAllUsers();
    render();
  }

  function showEditRoleModal(uid) {
    const users = App.getAllUsers();
    const user = users[uid];
    if (!user) return;

    let roleOptions = App.ROLES.map(r =>
      `<option value="${r}" ${user.role === r ? 'selected' : ''}>${App.roleLabel(r)}</option>`
    ).join('');

    const html = `
      <div class="modal-header">
        <h3 class="modal-title">${App.t('editUser')}</h3>
        <button class="modal-close" id="modal-close-btn">&times;</button>
      </div>
      <div class="mb-16">
        <strong>${App.escapeHtml(user.displayName || user.email)}</strong>
        <div style="font-size:0.85rem;color:var(--gray-500)">${App.escapeHtml(user.email)}</div>
      </div>
      <div class="form-group">
        <label class="form-label">${App.t('role')}</label>
        <select class="form-select" id="edit-role">${roleOptions}</select>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-primary flex-1" id="save-role-btn">${App.t('save')}</button>
        <button class="btn ${user.approved ? 'btn-danger' : 'btn-outline'}" id="toggle-active-btn">
          ${user.approved ? App.t('deactivate') : App.t('activate')}
        </button>
        <button class="btn btn-outline" id="cancel-role-btn">${App.t('cancel')}</button>
      </div>`;

    App.openModal(html);
    document.getElementById('modal-close-btn').addEventListener('click', App.closeModal);
    document.getElementById('cancel-role-btn').addEventListener('click', App.closeModal);

    document.getElementById('save-role-btn').addEventListener('click', async () => {
      const newRole = document.getElementById('edit-role').value;
      await db.collection('users').doc(uid).update({ role: newRole });
      App.logActivity('user_role_change', user.email + ' -> ' + newRole);
      await App.loadAllUsers();
      App.closeModal();
      render();
      App.toast('Uloženo', 'success');
    });

    document.getElementById('toggle-active-btn').addEventListener('click', async () => {
      await db.collection('users').doc(uid).update({ approved: !user.approved });
      App.logActivity(user.approved ? 'user_deactivate' : 'user_activate', user.email);
      await App.loadAllUsers();
      App.closeModal();
      render();
    });
  }

  function loadTelegramCommands(container) {
    db.collection('telegram_commands')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .onSnapshot(snap => {
        if (snap.empty) {
          container.innerHTML = '<div style="font-size:0.85rem;color:var(--gray-500);padding:8px 0">Zatím žádné příkazy z Telegramu.</div>';
          return;
        }
        let html = '';
        snap.forEach(doc => {
          const cmd = doc.data();
          html += `<div class="log-entry">
            <span class="badge ${cmd.processed ? 'badge-done' : 'badge-new'}">${cmd.processed ? 'OK' : 'NEW'}</span>
            <strong>${App.escapeHtml(cmd.action || '')}</strong>: ${App.escapeHtml(cmd.title || '')}
            <div class="log-time">${App.formatDateTime(cmd.createdAt)}</div>
          </div>`;
        });
        container.innerHTML = html;
      });
  }

  function loadActivityLog(container) {
    db.collection('activity_log')
      .orderBy('createdAt', 'desc')
      .limit(30)
      .onSnapshot(snap => {
        if (snap.empty) {
          container.innerHTML = '<div style="font-size:0.85rem;color:var(--gray-500);padding:8px 0">Zatím žádná zaznamenaná aktivita.</div>';
          return;
        }
        let html = '';
        snap.forEach(doc => {
          const log = doc.data();
          html += `<div class="log-entry">
            <strong>${App.escapeHtml(log.userName || '')}</strong> — ${App.escapeHtml(log.action || '')}
            ${log.details ? ': ' + App.escapeHtml(log.details) : ''}
            <div class="log-time">${App.formatDateTime(log.createdAt)}</div>
          </div>`;
        });
        container.innerHTML = html;
      });
  }

  function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  return { render };
})();
