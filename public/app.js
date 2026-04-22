/* ============================================================
   APP.JS — Main app logic, i18n, navigation, utilities
   ============================================================ */

/* ---------- i18n STRINGS ---------- */
const STRINGS = {
  cs: {
    loginPhone: 'Telefonní číslo',
    loginPassword: 'Heslo',
    loginSubmit: 'Přihlásit se',
    loginForgot: 'Zapomenuté heslo?',
    loginForgotInfo: 'Kontaktujte administratora pro reset hesla.',
    loginPending: 'Váš účet čeká na schválení adminem. Zkuste to později.',
    loginError: 'Chyba při přihlášení',
    phoneNotFound: 'Telefonní číslo nebylo nalezeno',
    wrongPassword: 'Nesprávné heslo',
    changePassword: 'Změnit heslo',
    currentPassword: 'Současné heslo',
    newPassword: 'Nové heslo',
    newPasswordRepeat: 'Zopakujte nové heslo',
    passwordChanged: 'Heslo bylo změněno',
    passwordMismatch: 'Hesla se neshodují',
    passwordTooShort: 'Heslo musí mít alespoň 6 znaků',
    logout: 'Odhlásit se',
    navTasks: 'Úkoly',
    navBoard: 'Nástěnka',
    navCalendar: 'Kalendář',
    navTeam: 'Tým',
    // Tasks
    tasksTitle: 'Úkoly',
    filterMine: 'Moje',
    filterAll: 'Všechny',
    filterByPerson: 'Podle osoby',
    filterByDate: 'Podle termínu',
    addTask: 'Nový úkol',
    taskName: 'Název úkolu',
    taskDesc: 'Popis',
    taskAssignee: 'Přiřadit',
    taskDue: 'Termín',
    taskPriority: 'Priorita',
    priorityNormal: 'Normální',
    priorityHigh: 'Vysoká',
    priorityUrgent: 'Urgentní',
    statusNew: 'Nový',
    statusProgress: 'V řešení',
    statusDone: 'Hotovo',
    save: 'Uložit',
    cancel: 'Zrušit',
    delete: 'Smazat',
    comment: 'Komentář',
    addComment: 'Přidat komentář',
    noTasks: 'Žádné úkoly',
    allUsers: 'Všichni',
    changeStatus: 'Změnit stav',
    back: 'Zpět',
    // Board
    boardTitle: 'Nástěnka',
    addPost: 'Nový příspěvek',
    postTitle: 'Nadpis',
    postContent: 'Text příspěvku',
    postImage: 'URL obrázku (volitelně)',
    postVisibility: 'Viditelnost',
    visAll: 'Všichni',
    noPosts: 'Žádné příspěvky',
    // Calendar
    calendarTitle: 'Marketing kalendář',
    addEvent: 'Nová událost',
    eventTitle: 'Název události',
    eventDate: 'Datum',
    eventType: 'Typ',
    eventDesc: 'Popis',
    typeIG: 'Instagram příspěvek',
    typeFB: 'Facebook příspěvek',
    typeEmail: 'E-mail kampaň',
    typeHairdresser: 'Akce pro kadeřníky',
    typeCustomer: 'Akce pro zákazníky',
    typeNews: 'Novinky',
    typeDeadline: 'Deadline',
    noEvents: 'Žádné události',
    viewMonth: 'Měsíc',
    viewWeek: 'Týden',
    // Team
    teamTitle: 'Tým',
    // Admin
    adminTitle: 'Admin panel',
    pendingUsers: 'Čekající na schválení',
    manageUsers: 'Správa uživatelů',
    approve: 'Schválit',
    reject: 'Zamítnout',
    role: 'Role',
    activityLog: 'Log aktivit',
    noPending: 'Žádní čekající uživatelé',
    systemSettings: 'Nastavení systému',
    telegramCommands: 'Telegram příkazy',
    // Days
    mon: 'Po', tue: 'Út', wed: 'St', thu: 'Čt', fri: 'Pá', sat: 'So', sun: 'Ne',
    // Months
    months: ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'],
    today: 'Dnes',
    assignedToRole: 'Přiřazen roli',
    assignedToUser: 'Přiřazen uživateli',
    everyone: 'Všichni',
    noAccess: 'Nemáte přístup k této sekci.',
    editUser: 'Upravit uživatele',
    deactivate: 'Deaktivovat',
    activate: 'Aktivovat',
    active: 'Aktivní',
    inactive: 'Neaktivní',
    // Stats
    navStats: 'Pohoda',
    statsUpload: 'Nahrát export z Pohody',
    statsNoData: 'Zatím žádná data. Nahrajte export z Pohody.',
    statsThisMonth: 'Obrat tento měsíc',
    statsLastMonth: 'Obrat minulý měsíc',
    statsActiveSalons: 'Aktivní salony',
    statsTopProducts: 'Top produkty',
    statsAllOZ: 'Všichni OZ',
    statsTotalRevenue: 'Celkový obrat firmy',
    statsTrend: 'Trend',
    statsRevenue: 'Obrat',
    statsQuantity: 'Množství',
    statsProduct: 'Produkt',
    statsName: 'Jméno',
    statsFilterBrand: 'Filtr podle značky',
    statsAllBrands: 'Vše',
    statsMonthlyRevenue: 'Měsíční obraty',
    // Clients
    navClients: 'Kadeřníci',
    clientsTitle: 'Kadeřníci a salony',
    clientsSearch: 'Hledat...',
    clientsAdd: 'Přidat kadeřníka',
    clientsImport: 'Importovat z Pohody',
    clientsSendEmail: 'Odeslat e-mail',
    clientsName: 'Salon',
    clientsContact: 'Kontakt',
    clientsCity: 'Město',
    clientsOZ: 'Obchodní zástupce',
    clientsBirthday: 'Dnes slaví narozeniny',
    clientsNameday: 'Dnes má svátek',
    clientsThisWeek: 'Tento týden'
  },
  sk: {
    loginPhone: 'Telefónne číslo',
    loginPassword: 'Heslo',
    loginSubmit: 'Prihlásiť sa',
    loginForgot: 'Zabudnuté heslo?',
    loginForgotInfo: 'Kontaktujte administrátora pre reset hesla.',
    loginPending: 'Váš účet čaká na schválenie adminom. Skúste to neskôr.',
    loginError: 'Chyba pri prihlásení',
    phoneNotFound: 'Telefónne číslo nebolo nájdené',
    wrongPassword: 'Nesprávné heslo',
    changePassword: 'Změnit heslo',
    currentPassword: 'Súčasné heslo',
    newPassword: 'Nové heslo',
    newPasswordRepeat: 'Zopakujte nové heslo',
    passwordChanged: 'Heslo bolo zmenené',
    passwordMismatch: 'Heslá sa nezhodujú',
    passwordTooShort: 'Heslo musí mať aspoň 6 znakov',
    logout: 'Odhlásiť sa',
    navTasks: 'Úlohy',
    navBoard: 'Nástěnka',
    navCalendar: 'Kalendář',
    navTeam: 'Tím',
    tasksTitle: 'Úlohy',
    filterMine: 'Moje',
    filterAll: 'Všetky',
    filterByPerson: 'Podľa osoby',
    filterByDate: 'Podľa termínu',
    addTask: 'Nová úloha',
    taskName: 'Názov úlohy',
    taskDesc: 'Popis',
    taskAssignee: 'Priradiť',
    taskDue: 'Termín',
    taskPriority: 'Priorita',
    priorityNormal: 'Normálna',
    priorityHigh: 'Vysoká',
    priorityUrgent: 'Urgentná',
    statusNew: 'Nová',
    statusProgress: 'V riešení',
    statusDone: 'Hotovo',
    save: 'Uložit',
    cancel: 'Zrušit',
    delete: 'Zmazať',
    comment: 'Komentář',
    addComment: 'Přidat komentář',
    noTasks: 'Žiadne úlohy',
    allUsers: 'Všetci',
    changeStatus: 'Změnit stav',
    back: 'Späť',
    boardTitle: 'Nástěnka',
    addPost: 'Nový príspevok',
    postTitle: 'Nadpis',
    postContent: 'Text príspevku',
    postImage: 'URL obrázku (voliteľne)',
    postVisibility: 'Viditeľnosť',
    visAll: 'Všetci',
    noPosts: 'Žiadne príspevky',
    calendarTitle: 'Marketing kalendár',
    addEvent: 'Nová udalosť',
    eventTitle: 'Názov udalosti',
    eventDate: 'Dátum',
    eventType: 'Typ',
    eventDesc: 'Popis',
    typeIG: 'Instagram príspevok',
    typeFB: 'Facebook príspevok',
    typeEmail: 'E-mail kampaň',
    typeHairdresser: 'Akcia pre kaderníkov',
    typeCustomer: 'Akcia pre zákazníkov',
    typeNews: 'Novinky',
    typeDeadline: 'Deadline',
    noEvents: 'Žiadne udalosti',
    viewMonth: 'Mesiac',
    viewWeek: 'Týždeň',
    teamTitle: 'Tím',
    adminTitle: 'Admin panel',
    pendingUsers: 'Čakajúci na schválenie',
    manageUsers: 'Správa používateľov',
    approve: 'Schváliť',
    reject: 'Zamietnuť',
    role: 'Rola',
    activityLog: 'Log aktivit',
    noPending: 'Žiadni čakajúci používatelia',
    systemSettings: 'Nastavenia systému',
    telegramCommands: 'Telegram příkazy',
    mon: 'Po', tue: 'Ut', wed: 'St', thu: 'Št', fri: 'Pi', sat: 'So', sun: 'Ne',
    months: ['Január','Február','Marec','Apríl','Máj','Jún','Júl','August','September','Október','November','December'],
    today: 'Dnes',
    assignedToRole: 'Priradený roli',
    assignedToUser: 'Priradený používateľovi',
    everyone: 'Všetci',
    noAccess: 'Nemáte prístup k tejto sekcii.',
    editUser: 'Upraviť používateľa',
    deactivate: 'Deaktivovať',
    activate: 'Aktivovať',
    active: 'Aktívny',
    inactive: 'Neaktívny',
    // Stats
    navStats: 'Pohoda',
    statsUpload: 'Nahrát export z Pohody',
    statsNoData: 'Zatiaľ žiadne dáta. Nahrajte export z Pohody.',
    statsThisMonth: 'Obrat tento mesiac',
    statsLastMonth: 'Obrat minulý mesiac',
    statsActiveSalons: 'Aktívne salóny',
    statsTopProducts: 'Top produkty',
    statsAllOZ: 'Všetci OZ',
    statsTotalRevenue: 'Celkový obrat firmy',
    statsTrend: 'Trend',
    statsRevenue: 'Obrat',
    statsQuantity: 'Množstvo',
    statsProduct: 'Produkt',
    statsName: 'Meno',
    statsFilterBrand: 'Filter podľa značky',
    statsAllBrands: 'Všetko',
    statsMonthlyRevenue: 'Mesačné obraty',
    // Clients
    navClients: 'Kadeřníci',
    clientsTitle: 'Kadeřníci a salony',
    clientsSearch: 'Hľadať...',
    clientsAdd: 'Pridať kaderníka',
    clientsImport: 'Importovať z Pohody',
    clientsSendEmail: 'Odoslať e-mail',
    clientsName: 'Salon',
    clientsContact: 'Kontakt',
    clientsCity: 'Město',
    clientsOZ: 'Obchodný zástupca',
    clientsBirthday: 'Dnes slávi narodeniny',
    clientsNameday: 'Dnes má meniny',
    clientsThisWeek: 'Tento týždeň'
  }
};

/* ---------- APP STATE ---------- */
const App = (() => {
  let lang = localStorage.getItem('cc_lang') || 'cs';
  let activeModule = 'tasks';
  let usersCache = {};

  function t(key) {
    return (STRINGS[lang] && STRINGS[lang][key]) || (STRINGS.cs[key]) || key;
  }

  function getLang() { return lang; }

  function setLang(l) {
    lang = l;
    localStorage.setItem('cc_lang', l);
    document.getElementById('btn-lang').textContent = l.toUpperCase();
    applyI18n();
    // Re-render active module
    renderActiveModule();
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (STRINGS[lang] && STRINGS[lang][key]) {
        el.textContent = STRINGS[lang][key];
      }
    });
  }

  /* ---------- Navigation ---------- */
  function initNavigation() {
    const allNavItems = document.querySelectorAll('.nav-item[data-module]');
    allNavItems.forEach(item => {
      item.addEventListener('click', () => {
        const mod = item.getAttribute('data-module');
        switchModule(mod);
      });
    });
  }

  function switchModule(mod) {
    activeModule = mod;
    // Update nav items
    document.querySelectorAll('.nav-item[data-module]').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-module') === mod);
    });
    // Update views
    document.querySelectorAll('.module-view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById('view-' + mod);
    if (view) view.classList.add('active');
    // Show/hide FAB
    updateFAB();
    renderActiveModule();
  }

  function getActiveModule() { return activeModule; }

  function renderActiveModule() {
    switch (activeModule) {
      case 'tasks': Tasks.render(); break;
      case 'board': Board.render(); break;
      case 'calendar': Calendar.render(); break;
      case 'team': Team.render(); break;
      case 'admin': Admin.render(); break;
      case 'stats': Stats.render(); break;
      case 'productivity': Productivity.render(); break;
      case 'clients': Clients.render(); break;
      case 'shipments': Shipments.render(); break;
    }
  }

  function updateFAB() {
    const fab = document.getElementById('fab-add');
    const profile = Auth.getProfile();
    const isAdm = profile && Auth.isAdmin(profile);

    if (activeModule === 'tasks' && isAdm) {
      fab.classList.remove('hidden');
      fab.onclick = () => Tasks.showAddModal();
    } else if (activeModule === 'board' && isAdm) {
      fab.classList.remove('hidden');
      fab.onclick = () => Board.showAddModal();
    } else if (activeModule === 'calendar' && isAdm) {
      fab.classList.remove('hidden');
      fab.onclick = () => Calendar.showAddModal();
    } else if (activeModule === 'clients' && profile && (profile.role === 'admin' || profile.role === 'office')) {
      fab.classList.remove('hidden');
      fab.onclick = () => Clients.showAddModal();
    } else {
      fab.classList.add('hidden');
      fab.onclick = null;
    }
  }

  /* ---------- Admin visibility ---------- */
  function updateAdminVisibility() {
    const profile = Auth.getProfile();
    const show = profile && Auth.isAdmin(profile);
    const sidebarAdmin = document.getElementById('sidebar-admin');
    const bottomAdmin = document.getElementById('bottom-admin');
    if (sidebarAdmin) sidebarAdmin.classList.toggle('hidden', !show);
    if (bottomAdmin) bottomAdmin.classList.toggle('hidden', !show);
    // Clients tab: visible for admin and office
    const showClients = profile && (profile.role === 'admin' || profile.role === 'office');
    const sidebarClients = document.getElementById('sidebar-clients');
    const bottomClients = document.getElementById('bottom-clients');
    if (sidebarClients) sidebarClients.classList.toggle('hidden', !showClients);
    if (bottomClients) bottomClients.classList.toggle('hidden', !showClients);
  }

  /* ---------- Modal ---------- */
  function openModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.innerHTML = html;
    overlay.classList.add('open');
    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
  }

  /* ---------- Toast ---------- */
  function toast(message, type) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast-' + type : '');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => { el.remove(); }, 3500);
  }

  /* ---------- User cache ---------- */
  async function loadAllUsers() {
    const snap = await db.collection('users').get();
    usersCache = {};
    snap.forEach(doc => {
      usersCache[doc.id] = { id: doc.id, ...doc.data() };
    });
    return usersCache;
  }

  function getAllUsers() { return usersCache; }

  function getUserName(uid) {
    if (usersCache[uid]) return usersCache[uid].displayName || usersCache[uid].email || uid;
    return uid;
  }

  function getUsersByRole(role) {
    return Object.values(usersCache).filter(u => u.role === role && u.approved);
  }

  function getApprovedUsers() {
    return Object.values(usersCache).filter(u => u.approved);
  }

  /* ---------- Date formatting ---------- */
  function formatDate(d) {
    if (!d) return '';
    if (d.toDate) d = d.toDate();
    if (typeof d === 'string') d = new Date(d);
    return d.toLocaleDateString(lang === 'sk' ? 'sk-SK' : 'cs-CZ');
  }

  function formatDateTime(d) {
    if (!d) return '';
    if (d.toDate) d = d.toDate();
    if (typeof d === 'string') d = new Date(d);
    return d.toLocaleDateString(lang === 'sk' ? 'sk-SK' : 'cs-CZ') + ' ' +
      d.toLocaleTimeString(lang === 'sk' ? 'sk-SK' : 'cs-CZ', { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- Roles ---------- */
  const ROLES = ['admin', 'office', 'warehouse', 'backoffice', 'sales_cz', 'sales_sk'];

  function roleLabel(role) {
    const labels = {
      admin: 'Admin',
      office: 'Kancelář',
      warehouse: 'Sklad',
      backoffice: 'Back office',
      sales_cz: 'OZ Česko',
      sales_sk: 'OZ Slovensko',
      pending: 'Čeká na schválení'
    };
    return labels[role] || role;
  }

  /* ---------- Init ---------- */
  function init() {
    // Language button
    document.getElementById('btn-lang').textContent = lang.toUpperCase();
    document.getElementById('btn-lang').addEventListener('click', () => {
      setLang(lang === 'cs' ? 'sk' : 'cs');
    });

    // Hamburger drawer
    const btnHamburger = document.getElementById('btn-hamburger');
    const drawerNav = document.getElementById('drawer-nav');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const drawerClose = document.getElementById('drawer-close');

    function openDrawer() {
      drawerNav.classList.remove('hidden');
      drawerOverlay.classList.remove('hidden');
      // Aktualizuj user info v draweru
      const profile = Auth.getProfile();
      const drawerUser = document.getElementById('drawer-user-info');
      if (drawerUser && profile) {
        drawerUser.textContent = profile.displayName || profile.email || '';
      }
    }
    function closeDrawer() {
      drawerNav.classList.add('hidden');
      drawerOverlay.classList.add('hidden');
    }

    if (btnHamburger) btnHamburger.addEventListener('click', openDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

    // Drawer navigace
    document.querySelectorAll('.drawer-item[data-module]').forEach(item => {
      item.addEventListener('click', () => {
        closeDrawer();
        switchModule(item.dataset.module);
      });
    });
    const drawerLogout = document.getElementById('drawer-logout');
    if (drawerLogout) drawerLogout.addEventListener('click', () => { closeDrawer(); Auth.logout(); });

    // Toggle password visibility
    const togglePwd = document.getElementById('toggle-password');
    if (togglePwd) {
      togglePwd.addEventListener('click', () => {
        const inp = document.getElementById('login-password');
        if (inp.type === 'password') {
          inp.type = 'text';
          togglePwd.textContent = '🙈';
        } else {
          inp.type = 'password';
          togglePwd.textContent = '👁';
        }
      });
    }

    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('login-phone').value.trim();
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('btn-login');
      btn.disabled = true;
      btn.textContent = '...';
      try {
        await Auth.loginWithPhone(phone, password);
      } catch (err) {
        const msg = err.code === 'phone-not-found' ? 'Telefonní číslo nebylo nalezeno v systému.' :
                    err.code === 'wrong-password' ? 'Nesprávné heslo. Výchozí heslo je: concept' :
                    err.message || t('loginError');
        showLoginError(msg);
      } finally {
        btn.disabled = false;
        btn.textContent = t('loginSubmit');
      }
    });

    // Forgot password link — pošle reset email
    document.getElementById('forgot-password-link').addEventListener('click', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('login-phone').value.trim();
      const info = document.getElementById('forgot-password-info');
      if (!phone) {
        info.textContent = 'Nejprve zadejte telefonní číslo, pak klikněte Zapomenuté heslo.';
        info.classList.remove('hidden');
        return;
      }
      // Najdi email podle telefonu
      try {
        const db2 = firebase.firestore();
        const normalized = phone.replace(/[\s\-]/g, '');
        const snap = await db2.collection('team_members').where('phone', '==', normalized).limit(1).get();
        if (snap.empty) {
          info.textContent = 'Telefonní číslo nebylo nalezeno.';
          info.classList.remove('hidden');
          return;
        }
        const email = snap.docs[0].data().email;
        await firebase.auth().sendPasswordResetEmail(email);
        info.textContent = `Reset hesla odeslán na email: ${email}`;
        info.classList.remove('hidden');
      } catch (err) {
        info.textContent = 'Chyba při odesílání resetu: ' + err.message;
        info.classList.remove('hidden');
      }
    });

    // User menu
    document.getElementById('header-user-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('user-menu').classList.toggle('open');
    });
    document.addEventListener('click', () => {
      document.getElementById('user-menu').classList.remove('open');
    });
    document.getElementById('btn-logout').addEventListener('click', () => {
      Auth.logout();
    });

    // Change password
    document.getElementById('btn-change-password').addEventListener('click', () => {
      document.getElementById('user-menu').classList.remove('open');
      showChangePasswordModal();
    });

    initNavigation();
    applyI18n();

    // Auth state
    Auth.onAuthStateChanged(async (user, profile) => {
      if (!user) {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-shell').style.display = 'none';
        return;
      }

      if (!profile.approved) {
        document.getElementById('login-pending').style.display = 'block';
        return;
      }

      // Approved user — show app
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app-shell').style.display = 'block';
      document.getElementById('login-pending').style.display = 'none';

      // Set user info in header
      const avatarEl = document.getElementById('header-avatar');
      const displayName = profile.displayName || user.displayName || user.email || '';
      if (user.photoURL) {
        avatarEl.src = user.photoURL;
        avatarEl.style.display = '';
      } else {
        // Iniciály jako avatar
        const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
        avatarEl.style.display = 'none';
        const parent = avatarEl.parentNode;
        let initialsEl = parent.querySelector('.avatar-initials');
        if (!initialsEl) {
          initialsEl = document.createElement('div');
          initialsEl.className = 'avatar-initials';
          initialsEl.style.cssText = 'width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1a237e,#3949ab);color:#ffd54f;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0';
          parent.insertBefore(initialsEl, avatarEl);
        }
        initialsEl.textContent = initials;
      }
      document.getElementById('header-username').textContent = displayName.split(' ')[0] || user.email;

      // Load users
      await loadAllUsers();
      updateAdminVisibility();
      renderActiveModule();

      // Listen for telegram commands (real-time)
      listenTelegramCommands();

      // Počasí v horní liště
      loadWeather();
    });
  }

  function showLoginError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  }

  /* ---------- Telegram Commands Listener ---------- */
  async function loadWeather() {
    const el = document.getElementById('header-weather');
    if (!el) return;
    try {
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=50.08&longitude=14.43&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Europe/Prague';
      const res = await fetch(url);
      const data = await res.json();
      const c = data.current;
      const code = c.weather_code;
      const descs = {
        0:'Jasno', 1:'Převážně jasno', 2:'Polojasno', 3:'Zataženo',
        45:'Mlha', 48:'Mlha', 51:'Mrholení', 53:'Mrholení', 55:'Mrholení',
        61:'Déšť', 63:'Déšť', 65:'Silný déšť',
        71:'Sněžení', 73:'Sněžení', 75:'Silné sněžení',
        80:'Přeháňky', 81:'Přeháňky', 82:'Silné přeháňky',
        95:'Bouřka', 96:'Bouřka', 99:'Silná bouřka'
      };
      const desc = descs[code] || descs[Math.floor(code / 10) * 10] || '';
      el.textContent = 'Praha  ' + Math.round(c.temperature_2m) + '°C' + (desc ? '  ' + desc : '');
    } catch (e) {
      el.textContent = '';
    }
  }

  function listenTelegramCommands() {
    const profile = Auth.getProfile();
    if (!profile || !Auth.isAdmin(profile)) return;

    db.collection('telegram_commands')
      .where('processed', '==', false)
      .onSnapshot(snap => {
        snap.docChanges().forEach(async change => {
          if (change.type === 'added') {
            const cmd = change.doc.data();
            await processTelegramCommand(change.doc.id, cmd);
          }
        });
      });
  }

  async function processTelegramCommand(docId, cmd) {
    try {
      if (cmd.action === 'add_task') {
        // Resolve assignee
        let assignedTo = cmd.assignee || '';
        let assignType = 'role';

        // Check if assignee matches a known user name
        const users = Object.values(usersCache);
        const matched = users.find(u =>
          (u.displayName || '').toLowerCase().includes(assignedTo.toLowerCase())
        );
        if (matched) {
          assignedTo = matched.id;
          assignType = 'user';
        } else if (['vsichni', 'vsetci', 'all'].includes(assignedTo.toLowerCase())) {
          assignedTo = 'all';
          assignType = 'role';
        } else if (ROLES.includes(assignedTo)) {
          assignType = 'role';
        }

        await db.collection('tasks').add({
          title: cmd.title || 'Úkol z Telegramu',
          description: cmd.description || '',
          assignedTo: assignedTo,
          assignType: assignType,
          assignedBy: 'telegram',
          dueDate: cmd.due ? new Date(cmd.due) : null,
          priority: cmd.priority || 'normal',
          status: 'new',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Mark as processed
        await db.collection('telegram_commands').doc(docId).update({ processed: true });
        toast('Úkol z Telegramu vytvořen: ' + (cmd.title || ''), 'success');
      }
    } catch (err) {
      console.error('Telegram command error:', err);
      await db.collection('telegram_commands').doc(docId).update({
        processed: true,
        error: err.message
      });
    }
  }

  /* ---------- Change Password Modal ---------- */
  function showChangePasswordModal() {
    const html = `
      <div class="modal-header">
        <div class="modal-title">${t('changePassword')}</div>
        <button class="modal-close" onclick="App.closeModal()">&times;</button>
      </div>
      <div class="form-group">
        <label class="form-label">${t('currentPassword')}</label>
        <input class="form-input" type="password" id="cp-current" required>
      </div>
      <div class="form-group">
        <label class="form-label">${t('newPassword')}</label>
        <input class="form-input" type="password" id="cp-new" required>
      </div>
      <div class="form-group">
        <label class="form-label">${t('newPasswordRepeat')}</label>
        <input class="form-input" type="password" id="cp-repeat" required>
      </div>
      <div class="login-error" id="cp-error" style="display:none;margin-bottom:12px;"></div>
      <button class="btn btn-primary btn-block" id="cp-submit">${t('save')}</button>
    `;
    openModal(html);

    document.getElementById('cp-submit').addEventListener('click', async () => {
      const current = document.getElementById('cp-current').value;
      const newPw = document.getElementById('cp-new').value;
      const repeat = document.getElementById('cp-repeat').value;
      const errEl = document.getElementById('cp-error');

      if (newPw.length < 6) {
        errEl.textContent = t('passwordTooShort');
        errEl.style.display = 'block';
        return;
      }
      if (newPw !== repeat) {
        errEl.textContent = t('passwordMismatch');
        errEl.style.display = 'block';
        return;
      }

      const btn = document.getElementById('cp-submit');
      btn.disabled = true;
      try {
        await Auth.changePassword(current, newPw);
        closeModal();
        toast(t('passwordChanged'), 'success');
      } catch (err) {
        errEl.textContent = err.message || t('loginError');
        errEl.style.display = 'block';
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ---------- Activity Log ---------- */
  async function logActivity(action, details) {
    try {
      const profile = Auth.getProfile();
      await db.collection('activity_log').add({
        action,
        details: details || '',
        userId: profile ? profile.id : 'system',
        userName: profile ? (profile.displayName || profile.email) : 'System',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.error('Log error:', e);
    }
  }

  return {
    init, t, getLang, setLang, switchModule, getActiveModule,
    openModal, closeModal, toast,
    loadAllUsers, getAllUsers, getUserName, getUsersByRole, getApprovedUsers,
    formatDate, formatDateTime, escapeHtml,
    ROLES, roleLabel, updateFAB, updateAdminVisibility,
    logActivity, renderActiveModule
  };
})();

// Start app when DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
