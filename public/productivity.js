/* ============================================================
   PRODUCTIVITY.JS — Statistiky plnění úkolů a produktivity týmu
   ============================================================ */

const Productivity = (() => {

  let tasks = [];
  let users = [];
  let unsubscribe = null;
  let periodDays = 30;

  const DEPT_MAP = {
    warehouse:  'Sklad',
    office:     'Kancelář',
    backoffice: 'Back office',
    admin:      'Management',
    sales_cz:   'OZ Česko',
    sales_sk:   'OZ Slovensko'
  };

  function esc(s) { return App.escapeHtml(s); }

  function render() {
    const container = document.getElementById('view-productivity');
    if (!container) return;

    container.innerHTML = `
      <h1 class="page-title">Statistiky produktivity</h1>
      <div id="prod-loading" style="text-align:center;padding:40px;color:#8894b8">Načítám data...</div>
    `;

    loadData(container);
  }

  async function loadData(container) {
    try {
      const [tasksSnap, usersSnap] = await Promise.all([
        db.collection('tasks').get(),
        db.collection('team_members').get()
      ]);

      tasks = [];
      tasksSnap.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));

      users = [];
      usersSnap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));

      renderDashboard(container);
    } catch (e) {
      container.querySelector('#prod-loading').textContent = 'Chyba při načítání dat.';
    }
  }

  function renderDashboard(container) {
    const now = new Date();
    const cutoff = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Celkové statistiky
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const newTasks = tasks.filter(t => t.status === 'new').length;
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
    const overdue = tasks.filter(t => {
      if (t.status === 'done' || !t.dueDate) return false;
      const due = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
      return due < now;
    }).length;

    const doneRate = total > 0 ? Math.round((done / total) * 100) : 0;

    // Statistiky podle oddělení
    const deptStats = {};
    for (const [key, label] of Object.entries(DEPT_MAP)) {
      const deptTasks = tasks.filter(t => t.assignedRole === key);
      const deptDone = deptTasks.filter(t => t.status === 'done').length;
      deptStats[key] = {
        label,
        total: deptTasks.length,
        done: deptDone,
        inProgress: deptTasks.filter(t => t.status === 'in_progress').length,
        pending: deptTasks.filter(t => t.status === 'new').length,
        rate: deptTasks.length > 0 ? Math.round((deptDone / deptTasks.length) * 100) : 0
      };
    }

    // Statistiky podle priority
    const byPriority = {
      urgent: tasks.filter(t => t.priority === 'urgent'),
      high: tasks.filter(t => t.priority === 'high'),
      normal: tasks.filter(t => !t.priority || t.priority === 'normal')
    };

    let html = `<h1 class="page-title">Statistiky produktivity</h1>`;

    // Filtr období
    html += `<div class="prod-period-filter" style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap">
      <span style="font-size:0.8rem;color:var(--gray-500);align-self:center">Zobrazit:</span>
      <button class="filter-chip${periodDays===7?' active':''}" data-days="7">7 dní</button>
      <button class="filter-chip${periodDays===30?' active':''}" data-days="30">30 dní</button>
      <button class="filter-chip${periodDays===90?' active':''}" data-days="90">90 dní</button>
      <button class="filter-chip${periodDays===365?' active':''}" data-days="365">Rok</button>
      <button class="filter-chip${periodDays===9999?' active':''}" data-days="9999">Vše</button>
    </div>`;

    // Souhrnné karty
    html += `<div class="prod-summary-grid">
      ${summaryCard('Celkem úkolů', total, '#1a237e')}
      ${summaryCard('Hotovo', done, '#1a237e')}
      ${summaryCard('V řešení', inProgress, '#1565c0')}
      ${summaryCard('Čeká', newTasks, '#666')}
      ${summaryCard('Urgentní', urgent, '#1a237e')}
      ${summaryCard('Po termínu', overdue, '#1a237e')}
    </div>`;

    // Celková úspěšnost
    html += `<div class="card" style="margin-bottom:16px">
      <div style="font-size:0.9rem;font-weight:700;color:var(--primary);margin-bottom:12px">Celková úspěšnost plnění</div>
      <div style="display:flex;align-items:center;gap:16px">
        <div style="flex:1">
          <div class="prod-progress-bar">
            <div class="prod-progress-fill" style="width:${doneRate}%;background:${doneRate>=80?'#1a237e':doneRate>=50?'#ffd54f':'#1a237e'}"></div>
          </div>
        </div>
        <div style="font-size:1.5rem;font-weight:800;color:var(--primary);min-width:56px;text-align:right">${doneRate}%</div>
      </div>
      <div style="font-size:0.78rem;color:#8894b8;margin-top:6px">${done} z ${total} úkolů dokončeno</div>
    </div>`;

    // Statistiky podle oddělení
    html += `<div class="card" style="margin-bottom:16px">
      <div style="font-size:0.9rem;font-weight:700;color:var(--primary);margin-bottom:16px">Plnění podle oddělení</div>
      <div class="prod-dept-list">`;

    for (const [key, stat] of Object.entries(deptStats)) {
      if (stat.total === 0) continue;
      const color = stat.rate >= 80 ? '#1a237e' : stat.rate >= 50 ? '#ffd54f' : '#1a237e';
      html += `<div class="prod-dept-row">
        <div class="prod-dept-name">${esc(stat.label)}</div>
        <div class="prod-dept-bar-wrap">
          <div class="prod-progress-bar">
            <div class="prod-progress-fill" style="width:${stat.rate}%;background:${color}"></div>
          </div>
        </div>
        <div class="prod-dept-stats">
          <span style="color:${color};font-weight:700">${stat.rate}%</span>
          <span style="color:#8894b8;font-size:0.78rem">${stat.done}/${stat.total}</span>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin:4px 0 12px 0;font-size:0.78rem;color:#8894b8">
        <span style="color:#1a237e">Hotovo: ${stat.done}</span>
        <span style="color:#1565c0">V řešení: ${stat.inProgress}</span>
        <span>Čeká: ${stat.pending}</span>
      </div>`;
    }

    html += `</div></div>`;

    // Statistiky podle priority
    html += `<div class="card" style="margin-bottom:16px">
      <div style="font-size:0.9rem;font-weight:700;color:var(--primary);margin-bottom:16px">Plnění podle priority</div>
      <div class="st-table-scroll"><table class="st-table">
        <thead><tr>
          <th>Priorita</th><th>Celkem</th><th>Hotovo</th><th>V řešení</th><th>Čeká</th><th>Úspěšnost</th>
        </tr></thead>
        <tbody>
          ${priorityRow('Urgentní', byPriority.urgent, '#1a237e')}
          ${priorityRow('Vysoká', byPriority.high, '#1a237e')}
          ${priorityRow('Normální', byPriority.normal, '#555')}
        </tbody>
      </table></div>
    </div>`;

    // Periodické vs. projektové
    const periodic = tasks.filter(t => t.recurring && t.recurring !== 'none');
    const projects = tasks.filter(t => !t.recurring || t.recurring === 'none');
    const periodicDone = periodic.filter(t => t.status === 'done').length;
    const projectsDone = projects.filter(t => t.status === 'done').length;

    html += `<div class="card" style="margin-bottom:16px">
      <div style="font-size:0.9rem;font-weight:700;color:var(--primary);margin-bottom:16px">Typy úkolů</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="background:var(--gray-50);border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:1.6rem;font-weight:800;color:var(--primary)">${periodic.length}</div>
          <div style="font-size:0.8rem;color:var(--gray-500);margin-top:4px">Periodické úkoly</div>
          <div style="font-size:0.75rem;color:#1a237e;margin-top:4px">Hotovo: ${periodicDone}</div>
        </div>
        <div style="background:var(--gray-50);border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:1.6rem;font-weight:800;color:var(--primary)">${projects.length}</div>
          <div style="font-size:0.8rem;color:var(--gray-500);margin-top:4px">Projekty a rozvoj</div>
          <div style="font-size:0.75rem;color:#1a237e;margin-top:4px">Hotovo: ${projectsDone}</div>
        </div>
      </div>
    </div>`;

    // ── Nasazení jednotlivých lidí ──
    html += `<div class="card" style="margin-bottom:16px">
      <div style="font-size:0.9rem;font-weight:700;color:var(--primary);margin-bottom:16px">Nasazení lidí</div>
      <div class="st-table-scroll"><table class="st-table">
        <thead><tr>
          <th>Jméno</th>
          <th>Oddělení</th>
          <th>Celkem</th>
          <th>Hotovo</th>
          <th>V řešení</th>
          <th>Čeká</th>
          <th>Po termínu</th>
          <th>Úspěšnost</th>
        </tr></thead>
        <tbody>`;

    // Statistiky per role (každý člen týmu)
    const ROLE_MEMBERS = {
      admin:      users.filter(u => u.role === 'admin'),
      office:     users.filter(u => u.role === 'office'),
      backoffice: users.filter(u => u.role === 'backoffice'),
      warehouse:  users.filter(u => u.role === 'warehouse'),
      sales_cz:   users.filter(u => u.role === 'sales_cz'),
      sales_sk:   users.filter(u => u.role === 'sales_sk'),
    };

    // Unikátní role které mají úkoly
    const rolesWithTasks = Object.keys(DEPT_MAP).filter(role =>
      tasks.some(t => t.assignedRole === role)
    );

    rolesWithTasks.forEach(role => {
      const roleMembers = ROLE_MEMBERS[role] || [];
      const roleTasks = tasks.filter(t => t.assignedRole === role);
      const roleDone = roleTasks.filter(t => t.status === 'done').length;
      const roleInProg = roleTasks.filter(t => t.status === 'in_progress').length;
      const rolePending = roleTasks.filter(t => t.status === 'new').length;
      const roleOverdue = roleTasks.filter(t => {
        if (t.status === 'done' || !t.dueDate) return false;
        const due = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
        return due < now;
      }).length;
      const roleRate = roleTasks.length > 0 ? Math.round((roleDone / roleTasks.length) * 100) : 0;
      const rateColor = roleRate >= 80 ? '#1a237e' : roleRate >= 50 ? '#ffd54f' : '#1a237e';

      if (roleMembers.length > 0) {
        // Zobraz každého člena zvlášť
        roleMembers.forEach((member, idx) => {
          html += `<tr>
            <td><strong>${esc(member.displayName || member.name || '—')}</strong></td>
            ${idx === 0 ? `<td rowspan="${roleMembers.length}" style="vertical-align:middle;color:var(--gray-500);font-size:0.8rem">${esc(DEPT_MAP[role])}</td>` : ''}
            ${idx === 0 ? `<td rowspan="${roleMembers.length}" style="vertical-align:middle;text-align:center">${roleTasks.length}</td>` : ''}
            ${idx === 0 ? `<td rowspan="${roleMembers.length}" style="vertical-align:middle;text-align:center;color:#1a237e;font-weight:600">${roleDone}</td>` : ''}
            ${idx === 0 ? `<td rowspan="${roleMembers.length}" style="vertical-align:middle;text-align:center;color:#1565c0">${roleInProg}</td>` : ''}
            ${idx === 0 ? `<td rowspan="${roleMembers.length}" style="vertical-align:middle;text-align:center">${rolePending}</td>` : ''}
            ${idx === 0 ? `<td rowspan="${roleMembers.length}" style="vertical-align:middle;text-align:center;color:${roleOverdue>0?'#1a237e':'#8894b8'};font-weight:${roleOverdue>0?'700':'400'}">${roleOverdue}</td>` : ''}
            ${idx === 0 ? `<td rowspan="${roleMembers.length}" style="vertical-align:middle;text-align:center">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="flex:1;min-width:60px">
                  <div class="prod-progress-bar"><div class="prod-progress-fill" style="width:${roleRate}%;background:${rateColor}"></div></div>
                </div>
                <strong style="color:${rateColor}">${roleRate}%</strong>
              </div>
            </td>` : ''}
          </tr>`;
        });
      } else {
        // Žádný konkrétní člen — zobraz jen roli
        html += `<tr>
          <td style="color:#8894b8;font-style:italic">—</td>
          <td style="color:var(--gray-500);font-size:0.8rem">${esc(DEPT_MAP[role])}</td>
          <td style="text-align:center">${roleTasks.length}</td>
          <td style="text-align:center;color:#1a237e;font-weight:600">${roleDone}</td>
          <td style="text-align:center;color:#1565c0">${roleInProg}</td>
          <td style="text-align:center">${rolePending}</td>
          <td style="text-align:center;color:${roleOverdue>0?'#1a237e':'#8894b8'}">${roleOverdue}</td>
          <td style="text-align:center">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;min-width:60px">
                <div class="prod-progress-bar"><div class="prod-progress-fill" style="width:${roleRate}%;background:${rateColor}"></div></div>
              </div>
              <strong style="color:${rateColor}">${roleRate}%</strong>
            </div>
          </td>
        </tr>`;
      }
    });

    html += `</tbody></table></div></div>`;

    container.innerHTML = html;

    // Bindování filtru
    container.querySelectorAll('[data-days]').forEach(btn => {
      btn.addEventListener('click', () => {
        periodDays = parseInt(btn.dataset.days);
        render();
      });
    });
  }

  function summaryCard(label, value, color) {
    return `<div class="prod-summary-card">
      <div class="prod-summary-value" style="color:${color}">${value}</div>
      <div class="prod-summary-label">${label}</div>
    </div>`;
  }

  function priorityRow(label, list, color) {
    const done = list.filter(t => t.status === 'done').length;
    const inProg = list.filter(t => t.status === 'in_progress').length;
    const pending = list.filter(t => t.status === 'new').length;
    const rate = list.length > 0 ? Math.round((done / list.length) * 100) : 0;
    return `<tr>
      <td><span style="color:${color};font-weight:600">${label}</span></td>
      <td>${list.length}</td>
      <td style="color:#1a237e">${done}</td>
      <td style="color:#1565c0">${inProg}</td>
      <td>${pending}</td>
      <td><strong style="color:${rate>=80?'#1a237e':rate>=50?'#ffd54f':'#1a237e'}">${rate}%</strong></td>
    </tr>`;
  }

  return { render };
})();
