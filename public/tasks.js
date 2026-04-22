/* ============================================================
   TASKS MODULE — Redesign: dept cards, tabs, row-based display
   ============================================================ */
const Tasks = (() => {
  let activeTab = 'periodic';   // periodic | projects | urgent | done
  let activeDept = null;        // null = all, or 'warehouse','office', etc.
  let detailTaskId = null;
  let unsubscribe = null;
  let tasks = [];

  /* ---------- Role / Department helpers ---------- */
  const DEPT_MAP = {
    warehouse:  { label: 'Sklad',         color: '#1a237e' },
    office:     { label: 'Kancelář',     color: '#1a237e' },
    backoffice: { label: 'Back office',  color: '#1a237e' },
    admin:      { label: 'Management',   color: '#1a237e' },
    sales_cz:   { label: 'OZ Česko',     color: '#1a237e' },
    sales_sk:   { label: 'OZ Slovensko', color: '#1a237e' }
  };

  const RECURRENCE_BADGES = {
    daily:   { label: 'Denn\u011b' },
    weekly:  { label: 'T\u00fddn\u011b' },
    monthly: { label: 'M\u011bs\u00ed\u010dn\u011b' }
  };

  function deptBadgeHtml(role) {
    const d = DEPT_MAP[role];
    if (!d) return '';
    return `<span class="dept-badge" style="--dept-color:${d.color}">${d.label}</span>`;
  }

  function periodBadgeHtml(recurring) {
    const r = RECURRENCE_BADGES[recurring];
    if (!r) return '';
    return `<span class="period-badge">${r.label}</span>`;
  }

  /* ---------- Task categorization ---------- */
  function getTaskTab(task) {
    if (task.status === 'done') return 'done';
    if (task.recurring && task.recurring !== 'none') return 'periodic';
    return 'projects';
  }

  function isUrgent(task) {
    return task.priority === 'urgent' && task.status !== 'done';
  }

  function getFilteredTasks() {
    const profile = Auth.getProfile();
    const isAdm = Auth.isAdmin(profile);

    // Visibility filter
    let visible = isAdm ? tasks : tasks.filter(t => isTaskForMe(t, profile));

    // Department filter
    if (activeDept) {
      visible = visible.filter(t => t.assignedRole === activeDept);
    }

    // Tab filter
    let filtered;
    if (activeTab === 'urgent') {
      filtered = visible.filter(t => isUrgent(t));
    } else if (activeTab === 'done') {
      filtered = visible.filter(t => t.status === 'done');
    } else if (activeTab === 'periodic') {
      filtered = visible.filter(t => t.status !== 'done' && t.recurring && t.recurring !== 'none');
    } else {
      // projects
      filtered = visible.filter(t => t.status !== 'done' && (!t.recurring || t.recurring === 'none'));
    }

    // Sort: urgent first, then by due date
    filtered.sort((a, b) => {
      const pOrder = { urgent: 0, high: 1, normal: 2 };
      const pa = pOrder[a.priority] ?? 2;
      const pb = pOrder[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      const da = parseDueDate(a.dueDate);
      const db2 = parseDueDate(b.dueDate);
      return da - db2;
    });

    return filtered;
  }

  function parseDueDate(d) {
    if (!d) return new Date('9999-12-31');
    if (d.toDate) return d.toDate();
    return new Date(d);
  }

  /* ---------- Count helpers for dept cards ---------- */
  function countByDept(visibleTasks) {
    const counts = {};
    for (const role of Object.keys(DEPT_MAP)) {
      counts[role] = 0;
    }
    for (const t of visibleTasks) {
      if (t.status !== 'done' && counts[t.assignedRole] !== undefined) {
        counts[t.assignedRole]++;
      }
    }
    return counts;
  }

  function countByTab(visibleTasks) {
    let periodic = 0, projects = 0, urgent = 0, done = 0;
    for (const t of visibleTasks) {
      if (t.status === 'done') { done++; continue; }
      if (isUrgent(t)) urgent++;
      if (t.recurring && t.recurring !== 'none') periodic++;
      else projects++;
    }
    return { periodic, projects, urgent, done };
  }

  /* ---------- isTaskForMe ---------- */
  function isTaskForMe(task, profile) {
    if (!profile) return false;
    if (Auth.isAdmin(profile)) return true;
    if (task.assignedRole === 'all') return true;
    if (task.assignedRole && task.assignedRole === profile.role) return true;
    // Legacy support for assignedTo field
    if (task.assignedTo === profile.id) return true;
    if (task.assignedTo === 'all') return true;
    return false;
  }

  /* ---------- Main render ---------- */
  function render() {
    if (detailTaskId) {
      renderDetail(detailTaskId);
      return;
    }
    renderList();
  }

  /* ---------- Nameday / Birthday widget for home ---------- */
  /* ---- Český kalendář svátků ---- */
  const CZ_NAMEDAYS = {
    '01.01': 'Nový rok', '02.01': 'Karina', '03.01': 'Radmila', '04.01': 'Diana',
    '05.01': 'Dalimil', '06.01': 'Tři králové', '07.01': 'Vilma', '08.01': 'Čestmír',
    '09.01': 'Vladan', '10.01': 'Břetislav', '11.01': 'Bohdana', '12.01': 'Pravoslav',
    '13.01': 'Edita', '14.01': 'Radovan', '15.01': 'Alice', '16.01': 'Ctirad',
    '17.01': 'Drahoslav', '18.01': 'Vladislav', '19.01': 'Doubravka', '20.01': 'Ilona',
    '21.01': 'Běla', '22.01': 'Slavomír', '23.01': 'Zdeněk', '24.01': 'Milena',
    '25.01': 'Miloš', '26.01': 'Zora', '27.01': 'Ingrid', '28.01': 'Otýlie',
    '29.01': 'Zdislava', '30.01': 'Robin', '31.01': 'Marika',
    '01.02': 'Hynek', '02.02': 'Nela', '03.02': 'Blažej', '04.02': 'Jarmila',
    '05.02': 'Dobromila', '06.02': 'Vanda', '07.02': 'Veronika', '08.02': 'Milada',
    '09.02': 'Apolena', '10.02': 'Mojmír', '11.02': 'Božena', '12.02': 'Slavěna',
    '13.02': 'Věnceslava', '14.02': 'Valentýn', '15.02': 'Jiřina', '16.02': 'Ljuba',
    '17.02': 'Miloslava', '18.02': 'Gizela', '19.02': 'Patrik', '20.02': 'Oldřich',
    '21.02': 'Lenka', '22.02': 'Petr', '23.02': 'Romana', '24.02': 'Matěj',
    '25.02': 'Liliana', '26.02': 'Dorota', '27.02': 'Alexandr', '28.02': 'Lumír',
    '29.02': 'Horymír',
    '01.03': 'Bedřich', '02.03': 'Anežka', '03.03': 'Kamil', '04.03': 'Stela',
    '05.03': 'Kazimír', '06.03': 'Miroslav', '07.03': 'Tomáš', '08.03': 'Gabriela',
    '09.03': 'Františka', '10.03': 'Viktorie', '11.03': 'Anděla', '12.03': 'Řehoř',
    '13.03': 'Růžena', '14.03': 'Rút', '15.03': 'Ida', '16.03': 'Herbert',
    '17.03': 'Vlastimil', '18.03': 'Eduard', '19.03': 'Josef', '20.03': 'Světlana',
    '21.03': 'Radek', '22.03': 'Leona', '23.03': 'Ivona', '24.03': 'Gabriel',
    '25.03': 'Marián', '26.03': 'Emanuel', '27.03': 'Dita', '28.03': 'Soňa',
    '29.03': 'Taťána', '30.03': 'Arnošt', '31.03': 'Kvido',
    '01.04': 'Hugo', '02.04': 'Erika', '03.04': 'Richard', '04.04': 'Ivana',
    '05.04': 'Miroslava', '06.04': 'Vendula', '07.04': 'Heřman', '08.04': 'Ema',
    '09.04': 'Dušan', '10.04': 'Dáša', '11.04': 'Izabela', '12.04': 'Julius',
    '13.04': 'Aleš', '14.04': 'Vincenc', '15.04': 'Anastázie', '16.04': 'Irena',
    '17.04': 'Rudolf', '18.04': 'Valérie', '19.04': 'Rostislav', '20.04': 'Marcela',
    '21.04': 'Alexandra', '22.04': 'Evženie', '23.04': 'Vojtěch', '24.04': 'Jiří',
    '25.04': 'Marek', '26.04': 'Oto', '27.04': 'Jaroslav', '28.04': 'Vlastislav',
    '29.04': 'Robert', '30.04': 'Blahoslav',
    '01.05': 'Svátek práce', '02.05': 'Zikmund', '03.05': 'Alexej', '04.05': 'Květoslav',
    '05.05': 'Klaudie', '06.05': 'Radoslav', '07.05': 'Stanislav', '08.05': 'Den vítězství',
    '09.05': 'Ctibor', '10.05': 'Blažena', '11.05': 'Svatava', '12.05': 'Pankrác',
    '13.05': 'Servác', '14.05': 'Bonifác', '15.05': 'Žofie', '16.05': 'Přemysl',
    '17.05': 'Aneta', '18.05': 'Nataša', '19.05': 'Ivo', '20.05': 'Zbyněk',
    '21.05': 'Monika', '22.05': 'Emil', '23.05': 'Vladimír', '24.05': 'Jana',
    '25.05': 'Viola', '26.05': 'Filip', '27.05': 'Valdemar', '28.05': 'Vilém',
    '29.05': 'Maxmilián', '30.05': 'Ferdinand', '31.05': 'Kamila',
    '01.06': 'Laura', '02.06': 'Jarmil', '03.06': 'Tamara', '04.06': 'Dalibor',
    '05.06': 'Dobroslav', '06.06': 'Norbert', '07.06': 'Iveta', '08.06': 'Medard',
    '09.06': 'Stanislava', '10.06': 'Gita', '11.06': 'Bruno', '12.06': 'Antonie',
    '13.06': 'Antonín', '14.06': 'Roland', '15.06': 'Vít', '16.06': 'Zoltán',
    '17.06': 'Adolf', '18.06': 'Milan', '19.06': 'Leoš', '20.06': 'Květa',
    '21.06': 'Alois', '22.06': 'Pavla', '23.06': 'Zdeňka', '24.06': 'Jan',
    '25.06': 'Ivan', '26.06': 'Adriana', '27.06': 'Ladislav', '28.06': 'Lubomír',
    '29.06': 'Petr a Pavel', '30.06': 'Šárka',
    '01.07': 'Jaroslava', '02.07': 'Patricie', '03.07': 'Radomír', '04.07': 'Prokop',
    '05.07': 'Cyril a Metoděj', '06.07': 'Jan Hus', '07.07': 'Bohuslava', '08.07': 'Nora',
    '09.07': 'Drahoslava', '10.07': 'Libuše', '11.07': 'Olga', '12.07': 'Bořek',
    '13.07': 'Markéta', '14.07': 'Karolína', '15.07': 'Jindřich', '16.07': 'Luboš',
    '17.07': 'Martina', '18.07': 'Drahomíra', '19.07': 'Čeněk', '20.07': 'Ilja',
    '21.07': 'Vítězslav', '22.07': 'Magdaléna', '23.07': 'Libor', '24.07': 'Kristýna',
    '25.07': 'Jakub', '26.07': 'Anna', '27.07': 'Věroslav', '28.07': 'Viktor',
    '29.07': 'Marta', '30.07': 'Bořivoj', '31.07': 'Ignác',
    '01.08': 'Oskar', '02.08': 'Gustav', '03.08': 'Miluše', '04.08': 'Dominik',
    '05.08': 'Kristián', '06.08': 'Oldřiška', '07.08': 'Lada', '08.08': 'Soběslav',
    '09.08': 'Roman', '10.08': 'Vavřinec', '11.08': 'Zuzana', '12.08': 'Klára',
    '13.08': 'Alžběta', '14.08': 'Arnošt', '15.08': 'Hana', '16.08': 'Jáchym',
    '17.08': 'Petra', '18.08': 'Helena', '19.08': 'Ludvík', '20.08': 'Bernard',
    '21.08': 'Johana', '22.08': 'Bohuslav', '23.08': 'Sandra', '24.08': 'Bartoloměj',
    '25.08': 'Radim', '26.08': 'Luděk', '27.08': 'Otakar', '28.08': 'Augustýn',
    '29.08': 'Evelína', '30.08': 'Vladěna', '31.08': 'Pavlína',
    '01.09': 'Linda', '02.09': 'Adéla', '03.09': 'Bronislav', '04.09': 'Jindřiška',
    '05.09': 'Boris', '06.09': 'Boleslav', '07.09': 'Regína', '08.09': 'Mariana',
    '09.09': 'Daniela', '10.09': 'Irma', '11.09': 'Denisa', '12.09': 'Marie',
    '13.09': 'Lubor', '14.09': 'Radka', '15.09': 'Jolana', '16.09': 'Ludmila',
    '17.09': 'Naděžda', '18.09': 'Kryštof', '19.09': 'Zita', '20.09': 'Oleg',
    '21.09': 'Matouš', '22.09': 'Darina', '23.09': 'Bořislav', '24.09': 'Jaromír',
    '25.09': 'Zlata', '26.09': 'Andrea', '27.09': 'Jonáš', '28.09': 'Václav',
    '29.09': 'Michal', '30.09': 'Jeroným',
    '01.10': 'Igor', '02.10': 'Olivie', '03.10': 'Bohumil', '04.10': 'František',
    '05.10': 'Eliška', '06.10': 'Hanuš', '07.10': 'Justýna', '08.10': 'Věra',
    '09.10': 'Štefan', '10.10': 'Marina', '11.10': 'Andrej', '12.10': 'Marcel',
    '13.10': 'Renáta', '14.10': 'Agáta', '15.10': 'Tereza', '16.10': 'Havel',
    '17.10': 'Hedvika', '18.10': 'Lukáš', '19.10': 'Michaela', '20.10': 'Vendelín',
    '21.10': 'Brigita', '22.10': 'Sabina', '23.10': 'Teodor', '24.10': 'Nina',
    '25.10': 'Beáta', '26.10': 'Erik', '27.10': 'Šarlota', '28.10': 'Den vzniku ČSR',
    '29.10': 'Silvie', '30.10': 'Tadeáš', '31.10': 'Štěpánka',
    '01.11': 'Felix', '02.11': 'Dušičky', '03.11': 'Hubert', '04.11': 'Karel',
    '05.11': 'Miriam', '06.11': 'Liběna', '07.11': 'Saskie', '08.11': 'Bohumír',
    '09.11': 'Bohdan', '10.11': 'Evžen', '11.11': 'Martin', '12.11': 'Benedikt',
    '13.11': 'Tibor', '14.11': 'Sáva', '15.11': 'Leopold', '16.11': 'Otmar',
    '17.11': 'Den boje za svobodu', '18.11': 'Romana', '19.11': 'Alžběta', '20.11': 'Nikola',
    '21.11': 'Albert', '22.11': 'Cecílie', '23.11': 'Klement', '24.11': 'Emílie',
    '25.11': 'Kateřina', '26.11': 'Artur', '27.11': 'Xenie', '28.11': 'René',
    '29.11': 'Zina', '30.11': 'Ondřej',
    '01.12': 'Iva', '02.12': 'Blanka', '03.12': 'Svatoslav', '04.12': 'Barbora',
    '05.12': 'Mikuláš', '06.12': 'Mikuláš', '07.12': 'Ambrož', '08.12': 'Květoslava',
    '09.12': 'Vratislav', '10.12': 'Julie', '11.12': 'Dana', '12.12': 'Simona',
    '13.12': 'Lucie', '14.12': 'Lýdie', '15.12': 'Radana', '16.12': 'Albína',
    '17.12': 'Daniel', '18.12': 'Miloslav', '19.12': 'Ester', '20.12': 'Dagmar',
    '21.12': 'Natálie', '22.12': 'Šimon', '23.12': 'Vlasta', '24.12': 'Štědrý den',
    '25.12': '1. svátek vánoční', '26.12': '2. svátek vánoční', '27.12': 'Žaneta',
    '28.12': 'Bohumila', '29.12': 'Judita', '30.12': 'David', '31.12': 'Silvestr'
  };

  function renderCelebrantsWidget() {
    const d = new Date();
    const today = String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');
    const nameday = CZ_NAMEDAYS[today] || '';

    let w = '<div class="home-celebrants">';
    w += '<div class="home-celebrant home-celebrant-nameday">';
    w += '<div><strong>Svátek má dnes:</strong> ' + (nameday || '—') + '</div>';
    w += '</div>';
    w += '</div>';
    return w;
  }

  function renderList() {
    const container = document.getElementById('view-tasks');
    const profile = Auth.getProfile();
    const isAdm = Auth.isAdmin(profile);
    const visibleAll = isAdm ? tasks : tasks.filter(t => isTaskForMe(t, profile));
    const deptCounts = countByDept(visibleAll);

    // Apply dept filter for tab counts
    const afterDept = activeDept ? visibleAll.filter(t => t.assignedRole === activeDept) : visibleAll;
    const tabCounts = countByTab(afterDept);

    let html = `<h1 class="page-title">\u00dakoly</h1>`;

    // ── Celebrants widget ──
    html += renderCelebrantsWidget();

    // ── Department filter cards ──
    if (isAdm) {
      html += `<div class="dept-filter-cards">`;
      for (const [role, info] of Object.entries(DEPT_MAP)) {
        const isActive = activeDept === role;
        html += `<button class="dept-card${isActive ? ' active' : ''}" data-dept="${role}" style="--dept-color:${info.color}">
          
          <span class="dept-card-label">${info.label}</span>
          <span class="dept-card-count">${deptCounts[role]}</span>
        </button>`;
      }
      html += `</div>`;
    }

    // ── Tab bar ──
    html += `<div class="tab-bar task-tabs">
      <button class="tab-btn${activeTab === 'periodic' ? ' active' : ''}" data-tab="periodic">Periodick\u00e9 <span class="tab-count">${tabCounts.periodic}</span></button>
      <button class="tab-btn${activeTab === 'projects' ? ' active' : ''}" data-tab="projects">Projekty a rozvoj <span class="tab-count">${tabCounts.projects}</span></button>
      <button class="tab-btn${activeTab === 'urgent' ? ' active' : ''}" data-tab="urgent">Urgentn\u00ed <span class="tab-count">${tabCounts.urgent}</span></button>
      <button class="tab-btn${activeTab === 'done' ? ' active' : ''}" data-tab="done">Hotov\u00e9 <span class="tab-count">${tabCounts.done}</span></button>
    </div>`;

    // ── Task rows placeholder ──
    html += `<div class="task-rows" id="task-rows-container"></div>`;

    container.innerHTML = html;

    // ── Event listeners: dept cards ──
    container.querySelectorAll('.dept-card').forEach(btn => {
      btn.addEventListener('click', () => {
        activeDept = activeDept === btn.dataset.dept ? null : btn.dataset.dept;
        renderList();
      });
    });

    // ── Event listeners: tabs ──
    container.querySelectorAll('.task-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        renderList();
      });
    });

    // ── Subscribe to Firestore ──
    subscribeTasks(container);
  }

  function subscribeTasks(container) {
    if (unsubscribe) unsubscribe();

    unsubscribe = db.collection('tasks')
      .onSnapshot(snap => {
        tasks = [];
        snap.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));
        renderTaskRows(container);
      }, err => {
        console.error('Tasks snapshot error:', err);
      });
  }

  function renderTaskRows(container) {
    // Re-render the full list to keep counts in sync
    const profile = Auth.getProfile();
    const isAdm = Auth.isAdmin(profile);
    const visibleAll = isAdm ? tasks : tasks.filter(t => isTaskForMe(t, profile));
    const deptCounts = countByDept(visibleAll);
    const afterDept = activeDept ? visibleAll.filter(t => t.assignedRole === activeDept) : visibleAll;
    const tabCounts = countByTab(afterDept);

    // Update dept card counts
    container.querySelectorAll('.dept-card').forEach(card => {
      const role = card.dataset.dept;
      const countEl = card.querySelector('.dept-card-count');
      if (countEl) countEl.textContent = deptCounts[role] || 0;
      card.classList.toggle('active', activeDept === role);
    });

    // Update tab counts
    const tabMap = { periodic: tabCounts.periodic, projects: tabCounts.projects, urgent: tabCounts.urgent, done: tabCounts.done };
    container.querySelectorAll('.task-tabs .tab-btn').forEach(btn => {
      const countEl = btn.querySelector('.tab-count');
      if (countEl) countEl.textContent = tabMap[btn.dataset.tab] || 0;
    });

    // Render rows
    const rowsContainer = container.querySelector('#task-rows-container');
    if (!rowsContainer) return;

    const filtered = getFilteredTasks();

    if (filtered.length === 0) {
      rowsContainer.innerHTML = `<div class="empty-state"><div class="empty-state-text">\u017d\u00e1dn\u00e9 \u00fakoly v t\u00e9to kategorii</div></div>`;
      return;
    }

    rowsContainer.innerHTML = filtered.map(task => {
      const priorityColor = task.priority === 'urgent' ? 'var(--danger)' :
        task.priority === 'high' ? 'var(--warning)' : 'var(--gray-300)';

      const statusClass = task.status === 'new' ? 'badge-new' :
        task.status === 'in_progress' ? 'badge-progress' : 'badge-done';
      const statusLabel = task.status === 'new' ? 'Nov\u00fd' :
        task.status === 'in_progress' ? 'V \u0159e\u0161en\u00ed' : 'Hotovo';

      const dueDateStr = task.dueDate ? App.formatDate(task.dueDate) : '';
      const isOverdue = task.dueDate && task.status !== 'done' && parseDueDate(task.dueDate) < new Date();

      return `<div class="task-row" data-task-id="${task.id}">
        <div class="task-row-priority" style="background:${priorityColor}"></div>
        <div class="task-row-body">
          <div class="task-row-top">
            <span class="task-row-title">${App.escapeHtml(task.title)}</span>
            <div class="task-row-badges">
              ${deptBadgeHtml(task.assignedRole)}
              ${periodBadgeHtml(task.recurring)}
            </div>
          </div>
          <div class="task-row-bottom">
            <span class="badge ${statusClass}">${statusLabel}</span>
            ${dueDateStr ? `<span class="task-row-due${isOverdue ? ' overdue' : ''}">${dueDateStr}</span>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');

    // Click handlers for detail
    rowsContainer.querySelectorAll('.task-row[data-task-id]').forEach(row => {
      row.addEventListener('click', () => {
        detailTaskId = row.dataset.taskId;
        renderDetail(detailTaskId);
      });
    });
  }

  /* ---------- Detail View ---------- */
  function renderDetail(taskId) {
    const container = document.getElementById('view-tasks');
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      detailTaskId = null;
      renderList();
      return;
    }

    const profile = Auth.getProfile();
    const isAdm = Auth.isAdmin(profile);
    const isMine = isTaskForMe(task, profile);
    const statusBadge = task.status === 'new' ? 'badge-new' :
      task.status === 'in_progress' ? 'badge-progress' : 'badge-done';
    const statusLabel = task.status === 'new' ? 'Nov\u00fd' :
      task.status === 'in_progress' ? 'V \u0159e\u0161en\u00ed' : 'Hotovo';

    let html = `
      <button class="detail-back" id="task-back">&larr; ${App.t('back')}</button>
      <div class="card priority-${task.priority || 'normal'}">
        <div class="flex justify-between items-center mb-8">
          <span class="badge ${statusBadge}">${statusLabel}</span>
          <div class="flex gap-4 items-center">
            ${deptBadgeHtml(task.assignedRole)}
            ${periodBadgeHtml(task.recurring)}
            <span class="badge badge-${task.priority || 'normal'}">${App.t('priority' + capitalize(task.priority || 'normal'))}</span>
          </div>
        </div>
        <h2 class="card-title" style="font-size:1.1rem">${App.escapeHtml(task.title)}</h2>
        <div class="card-meta">${task.dueDate ? App.formatDate(task.dueDate) : ''}${task.createdBy ? ' \u00b7 ' + task.createdBy : ''}</div>
        ${task.description ? `<div class="card-body mt-8">${App.escapeHtml(task.description)}</div>` : ''}
      </div>`;

    // Status change buttons
    if (isMine || isAdm) {
      html += `<div class="flex gap-8 mb-16 flex-wrap">
        <span style="font-size:0.85rem;font-weight:600;color:var(--gray-600);align-self:center">${App.t('changeStatus')}:</span>
        ${task.status !== 'new' ? `<button class="btn btn-sm btn-outline" data-status="new">${App.t('statusNew')}</button>` : ''}
        ${task.status !== 'in_progress' ? `<button class="btn btn-sm btn-outline" data-status="in_progress">${App.t('statusProgress')}</button>` : ''}
        ${task.status !== 'done' ? `<button class="btn btn-sm btn-primary" data-status="done">${App.t('statusDone')}</button>` : ''}
        ${isAdm ? `<button class="btn btn-sm btn-danger" id="task-delete">${App.t('delete')}</button>` : ''}
      </div>`;
    }

    // Comments section
    html += `<div class="comments-section" id="task-comments"><div class="spinner"></div></div>`;
    html += `<div class="comment-input-row mt-8">
      <input class="form-input" id="task-comment-input" placeholder="${App.t('comment')}...">
      <button class="btn btn-sm btn-primary" id="task-comment-add">${App.t('addComment')}</button>
    </div>`;

    container.innerHTML = html;

    // Back button
    container.querySelector('#task-back').addEventListener('click', () => {
      detailTaskId = null;
      renderList();
    });

    // Status buttons
    container.querySelectorAll('[data-status]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await db.collection('tasks').doc(taskId).update({ status: btn.dataset.status });
        App.logActivity('task_status', task.title + ' -> ' + btn.dataset.status);
        App.toast(App.t('statusDone'), 'success');
      });
    });

    // Delete
    const delBtn = container.querySelector('#task-delete');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (confirm(App.t('delete') + '?')) {
          await db.collection('tasks').doc(taskId).delete();
          App.logActivity('task_delete', task.title);
          detailTaskId = null;
          renderList();
        }
      });
    }

    // Load comments
    loadComments(taskId, 'tasks', container.querySelector('#task-comments'));

    // Add comment
    container.querySelector('#task-comment-add').addEventListener('click', () => {
      const input = container.querySelector('#task-comment-input');
      if (input.value.trim()) {
        addComment(taskId, 'tasks', input.value.trim());
        input.value = '';
      }
    });

    container.querySelector('#task-comment-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        container.querySelector('#task-comment-add').click();
      }
    });
  }

  /* ---------- Add Task Modal (admin) ---------- */
  function showAddModal() {
    const deptOptions = Object.entries(DEPT_MAP).map(([role, info]) =>
      `<option value="${role}">${info.label}</option>`
    ).join('');

    const html = `
      <div class="modal-header">
        <h3 class="modal-title">${App.t('addTask')}</h3>
        <button class="modal-close" id="modal-close-btn">&times;</button>
      </div>
      <div class="form-group">
        <label class="form-label">${App.t('taskName')}</label>
        <input class="form-input" id="new-task-title" required>
      </div>
      <div class="form-group">
        <label class="form-label">${App.t('taskDesc')}</label>
        <textarea class="form-textarea" id="new-task-desc"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Pro koho (odd\u011blen\u00ed)</label>
        <select class="form-select" id="new-task-dept">${deptOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">${App.t('taskDue')}</label>
        <input type="date" class="form-input" id="new-task-due">
      </div>
      <div class="form-group">
        <label class="form-label">${App.t('taskPriority')}</label>
        <select class="form-select" id="new-task-priority">
          <option value="normal">${App.t('priorityNormal')}</option>
          <option value="high">${App.t('priorityHigh')}</option>
          <option value="urgent">${App.t('priorityUrgent')}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Typ \u00fakolu</label>
        <select class="form-select" id="new-task-type">
          <option value="project">Projekt / jednor\u00e1zov\u00fd</option>
          <option value="periodic">Periodick\u00fd</option>
        </select>
      </div>
      <div class="form-group" id="new-task-recurrence-group" style="display:none">
        <label class="form-label">Periodicita</label>
        <select class="form-select" id="new-task-recurrence">
          <option value="daily">\u{1F504} Denn\u011b</option>
          <option value="weekly">\u{1F4C5} T\u00fddn\u011b</option>
          <option value="monthly">\u{1F4C6} M\u011bs\u00ed\u010dn\u011b</option>
        </select>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-primary flex-1" id="save-task-btn">${App.t('save')}</button>
        <button class="btn btn-outline" id="cancel-task-btn">${App.t('cancel')}</button>
      </div>`;

    App.openModal(html);
    document.getElementById('modal-close-btn').addEventListener('click', App.closeModal);
    document.getElementById('cancel-task-btn').addEventListener('click', App.closeModal);
    document.getElementById('save-task-btn').addEventListener('click', saveTask);

    // Toggle recurrence field
    document.getElementById('new-task-type').addEventListener('change', (e) => {
      document.getElementById('new-task-recurrence-group').style.display =
        e.target.value === 'periodic' ? 'block' : 'none';
    });
  }

  async function saveTask() {
    const title = document.getElementById('new-task-title').value.trim();
    if (!title) return;

    const taskType = document.getElementById('new-task-type').value;
    const dueVal = document.getElementById('new-task-due').value;

    const data = {
      title,
      description: document.getElementById('new-task-desc').value.trim(),
      assignedRole: document.getElementById('new-task-dept').value,
      assignedTo: null,
      dueDate: dueVal ? (() => { const [y,m,d] = dueVal.split('-').map(Number); return new Date(y, m-1, d, 12, 0, 0); })() : null,
      priority: document.getElementById('new-task-priority').value,
      status: 'new',
      recurring: taskType === 'periodic' ? document.getElementById('new-task-recurrence').value : 'none',
      createdBy: Auth.getProfile().displayName || Auth.getProfile().email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('tasks').add(data);
    App.logActivity('task_create', title);
    App.closeModal();
    App.toast(App.t('addTask') + ': ' + title, 'success');
  }

  /* ---------- Comments (shared helper) ---------- */
  function loadComments(docId, collection, container) {
    db.collection(collection).doc(docId).collection('comments')
      .onSnapshot(snap => {
        const comments = [];
        snap.forEach(doc => comments.push({ id: doc.id, ...doc.data() }));
        container.innerHTML = comments.length === 0
          ? ''
          : comments.map(c => `<div class="comment">
              <span class="comment-author">${App.escapeHtml(c.authorName || App.getUserName(c.author))}</span>
              <span class="comment-date">${App.formatDateTime(c.createdAt)}</span>
              <div class="comment-text">${App.escapeHtml(c.text)}</div>
            </div>`).join('');
      });
  }

  async function addComment(docId, collection, text) {
    const profile = Auth.getProfile();
    await db.collection(collection).doc(docId).collection('comments').add({
      text,
      author: profile.id,
      authorName: profile.displayName || profile.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function destroy() {
    if (unsubscribe) unsubscribe();
    detailTaskId = null;
  }

  return { render, showAddModal, destroy, loadComments, addComment };
})();
