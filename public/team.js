/* ============================================================
   TEAM MODULE
   ============================================================ */
const Team = (() => {

  function render() {
    const container = document.getElementById('view-team');
    const profile = Auth.getProfile();
    const isAdm = Auth.isAdmin(profile);
    const users = App.getAllUsers();

    const approved = Object.values(users)
      .filter(u => u.approved && u.role !== 'pending')
      .sort((a, b) => {
        const order = { admin: 0, office: 1, warehouse: 2, backoffice: 3, sales_cz: 4, sales_sk: 5 };
        return (order[a.role] ?? 99) - (order[b.role] ?? 99);
      });

    let html = `<h1 class="page-title">${App.t('teamTitle')}</h1>`;

    if (approved.length === 0) {
      html += `<div class="empty-state"><div class="empty-state-text">Zatím v systému nejsou schválení uživatelé. Nový člen týmu se tu objeví, jakmile se přihlásí a admin ho schválí v modulu Admin.</div></div>`;
      container.innerHTML = html;
      return;
    }

    // Group by role
    const grouped = {};
    approved.forEach(u => {
      const role = u.role || 'other';
      if (!grouped[role]) grouped[role] = [];
      grouped[role].push(u);
    });

    Object.entries(grouped).forEach(([role, members]) => {
      html += `<div class="mb-8" style="font-size:0.8rem;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:1px;padding:8px 0 4px">${App.roleLabel(role)}</div>`;
      members.forEach(u => {
        const initials = getInitials(u.displayName || u.email);
        html += `<div class="card team-card" ${isAdm ? `data-uid="${u.id}" style="cursor:pointer"` : ''}>
          ${u.photoURL
            ? `<img src="${App.escapeHtml(u.photoURL)}" class="team-avatar" style="object-fit:cover" alt="">`
            : `<div class="team-avatar">${initials}</div>`}
          <div class="team-info">
            <div class="team-name">${App.escapeHtml(u.displayName || u.email)}</div>
            <div class="team-role">${App.roleLabel(u.role)}</div>
            ${u.email ? `<div class="team-contact">${App.escapeHtml(u.email)}</div>` : ''}
            ${u.phone ? `<div class="team-contact">${App.escapeHtml(u.phone)}</div>` : ''}
          </div>
          ${isAdm ? `<span class="badge badge-role">${u.approved ? App.t('active') : App.t('inactive')}</span>` : ''}
        </div>`;
      });
    });

    container.innerHTML = html;

    // Admin click to edit
    if (isAdm) {
      container.querySelectorAll('.card[data-uid]').forEach(card => {
        card.addEventListener('click', () => {
          showEditUserModal(card.dataset.uid);
        });
      });
    }
  }

  function showEditUserModal(uid) {
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
        <select class="form-select" id="edit-user-role">${roleOptions}</select>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-primary flex-1" id="save-user-btn">${App.t('save')}</button>
        <button class="btn ${user.approved ? 'btn-danger' : 'btn-outline'}" id="toggle-user-btn">
          ${user.approved ? App.t('deactivate') : App.t('activate')}
        </button>
        <button class="btn btn-outline" id="cancel-user-btn">${App.t('cancel')}</button>
      </div>`;

    App.openModal(html);
    document.getElementById('modal-close-btn').addEventListener('click', App.closeModal);
    document.getElementById('cancel-user-btn').addEventListener('click', App.closeModal);

    document.getElementById('save-user-btn').addEventListener('click', async () => {
      const newRole = document.getElementById('edit-user-role').value;
      await db.collection('users').doc(uid).update({ role: newRole });
      App.logActivity('user_role_change', user.email + ' -> ' + newRole);
      await App.loadAllUsers();
      App.closeModal();
      render();
      App.toast('OK', 'success');
    });

    document.getElementById('toggle-user-btn').addEventListener('click', async () => {
      await db.collection('users').doc(uid).update({ approved: !user.approved });
      App.logActivity(user.approved ? 'user_deactivate' : 'user_activate', user.email);
      await App.loadAllUsers();
      App.closeModal();
      render();
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
