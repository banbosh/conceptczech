/* ============================================================
   APP.JS — Main app logic, i18n, navigation, utilities
   ============================================================ */

/* ---------- i18n STRINGS ---------- */
const STRINGS = {
  cs: {
    loginPhone: 'Telefonní číslo',
    loginPassword: 'Heslo',
    loginSubmit: 'Přihlásit se',
    loginForgot: 'Zapomenute heslo?',
    loginForgotInfo: 'Kontaktujte administratora pro reset hesla.',
    loginPending: 'Vas ucet ceka na schvaleni adminem. Zkuste to pozdeji.',
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
    logout: 'Odhlasit se',
    navTasks: 'Úkoly',
    navBoard: 'Nástěnka',
    navCalendar: 'Kalendář',
    navTeam: 'Tym',
    // Tasks
    tasksTitle: 'Úkoly',
    filterMine: 'Moje',
    filterAll: 'Všechny',
    filterByPerson: 'Podle osoby',
    filterByDate: 'Podle terminu',
    addTask: 'Novy ukol',
    taskName: 'Nazev ukolu',
    taskDesc: 'Popis',
    taskAssignee: 'Priradit',
    taskDue: 'Termin',
    taskPriority: 'Priorita',
    priorityNormal: 'Normální',
    priorityHigh: 'Vysoká',
    priorityUrgent: 'Urgentní',
    statusNew: 'Novy',
    statusProgress: 'V reseni',
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
    postContent: 'Text prispevku',
    postImage: 'URL obrazku (volitelne)',
    postVisibility: 'Viditelnost',
    visAll: 'Všichni',
    noPosts: 'Žádné příspěvky',
    // Calendar
    calendarTitle: 'Marketing kalendar',
    addEvent: 'Nová událost',
    eventTitle: 'Nazev udalosti',
    eventDate: 'Datum',
    eventType: 'Typ',
    eventDesc: 'Popis',
    typeIG: 'Instagram prispevek',
    typeFB: 'Facebook prispevek',
    typeEmail: 'E-mail kampan',
    typeHairdresser: 'Akce pro kaderniky',
    typeCustomer: 'Akce pro zakazniky',
    typeNews: 'Novinky',
    typeDeadline: 'Deadline',
    noEvents: 'Žádné události',
    // Team
    teamTitle: 'Tym',
    // Admin
    adminTitle: 'Admin panel',
    pendingUsers: 'Čekající na schválení',
    manageUsers: 'Sprava uzivatelu',
    approve: 'Schválit',
    reject: 'Zamítnout',
    role: 'Role',
    activityLog: 'Log aktivit',
    noPending: 'Zadni cekajici uzivatele',
    systemSettings: 'Nastavení systému',
    telegramCommands: 'Telegram prikazy',
    // Days
    mon: 'Po', tue: 'Ut', wed: 'St', thu: 'Ct', fri: 'Pa', sat: 'So', sun: 'Ne',
    // Months
    months: ['Leden','Unor','Brezen','Duben','Kveten','Cerven','Cervenec','Srpen','Zari','Rijen','Listopad','Prosinec'],
    today: 'Dnes',
    assignedToRole: 'Prirazen roli',
    assignedToUser: 'Prirazen uzivateli',
    everyone: 'Všichni',
    noAccess: 'Nemate pristup k teto sekci.',
    editUser: 'Upravit uživatele',
    deactivate: 'Deaktivovat',
    activate: 'Aktivovat',
    active: 'Aktivni',
    inactive: 'Neaktivni',
    // Stats
    navStats: 'Pohoda',
    statsUpload: 'Nahrat export z Pohody',
    statsNoData: 'Zatim zadna data. Nahrajte export z Pohody.',
    statsThisMonth: 'Obrat tento mesic',
    statsLastMonth: 'Obrat minuly mesic',
    statsActiveSalons: 'Aktivni salony',
    statsTopProducts: 'Top produkty',
    statsAllOZ: 'Všichni OZ',
    statsTotalRevenue: 'Celkovy obrat firmy',
    statsTrend: 'Trend',
    statsRevenue: 'Obrat',
    statsQuantity: 'Mnozstvi',
    statsProduct: 'Produkt',
    statsName: 'Jmeno',
    statsFilterBrand: 'Filtr podle znacky',
    statsAllBrands: 'Vse',
    statsMonthlyRevenue: 'Mesicni obraty',
    // Clients
    navClients: 'Kadeřníci',
    clientsTitle: 'Kadeřníci a salony',
    clientsSearch: 'Hledat...',
    clientsAdd: 'Přidat kadeřníka',
    clientsImport: 'Importovat z Pohody',
    clientsSendEmail: 'Odeslat e-mail',
    clientsName: 'Salon',
    clientsContact: 'Kontakt',
    clientsCity: 'Mesto',
    clientsOZ: 'Obchodni zastupce',
    clientsBirthday: 'Dnes slavi narozeniny',
    clientsNameday: 'Dnes ma svatek',
    clientsThisWeek: 'Tento tyden'
  },
  sk: {
    loginPhone: 'Telefonní číslo',
    loginPassword: 'Heslo',
    loginSubmit: 'Prihlasit sa',
    loginForgot: 'Zabudnute heslo?',
    loginForgotInfo: 'Kontaktujte administratora pre reset hesla.',
    loginPending: 'Vas ucet caka na schvalenie adminom. Skuste to neskor.',
    loginError: 'Chyba při přihlášení',
    phoneNotFound: 'Telefonni cislo nebolo najdene',
    wrongPassword: 'Nesprávné heslo',
    changePassword: 'Změnit heslo',
    currentPassword: 'Sucasne heslo',
    newPassword: 'Nové heslo',
    newPasswordRepeat: 'Zopakujte nové heslo',
    passwordChanged: 'Heslo bolo zmenene',
    passwordMismatch: 'Hesla sa nezhoduju',
    passwordTooShort: 'Heslo musi mat aspon 6 znakov',
    logout: 'Odhlasit sa',
    navTasks: 'Ulohy',
    navBoard: 'Nástěnka',
    navCalendar: 'Kalendář',
    navTeam: 'Tim',
    tasksTitle: 'Ulohy',
    filterMine: 'Moje',
    filterAll: 'Vsetky',
    filterByPerson: 'Podla osoby',
    filterByDate: 'Podla terminu',
    addTask: 'Nova uloha',
    taskName: 'Nazov ulohy',
    taskDesc: 'Popis',
    taskAssignee: 'Priradit',
    taskDue: 'Termin',
    taskPriority: 'Priorita',
    priorityNormal: 'Normalna',
    priorityHigh: 'Vysoká',
    priorityUrgent: 'Urgentna',
    statusNew: 'Nova',
    statusProgress: 'V rieseni',
    statusDone: 'Hotovo',
    save: 'Uložit',
    cancel: 'Zrušit',
    delete: 'Zmazat',
    comment: 'Komentář',
    addComment: 'Přidat komentář',
    noTasks: 'Ziadne ulohy',
    allUsers: 'Vsetci',
    changeStatus: 'Změnit stav',
    back: 'Spat',
    boardTitle: 'Nástěnka',
    addPost: 'Novy prispevok',
    postTitle: 'Nadpis',
    postContent: 'Text prispevku',
    postImage: 'URL obrazku (volitelne)',
    postVisibility: 'Viditelnost',
    visAll: 'Vsetci',
    noPosts: 'Ziadne prispevky',
    calendarTitle: 'Marketing kalendar',
    addEvent: 'Nová událost',
    eventTitle: 'Nazov udalosti',
    eventDate: 'Datum',
    eventType: 'Typ',
    eventDesc: 'Popis',
    typeIG: 'Instagram prispevok',
    typeFB: 'Facebook prispevok',
    typeEmail: 'E-mail kampan',
    typeHairdresser: 'Akcia pre kadernikov',
    typeCustomer: 'Akcia pre zakaznikov',
    typeNews: 'Novinky',
    typeDeadline: 'Deadline',
    noEvents: 'Ziadne udalosti',
    teamTitle: 'Tim',
    adminTitle: 'Admin panel',
    pendingUsers: 'Cakajuci na schvalenie',
    manageUsers: 'Sprava pouzivatelov',
    approve: 'Schválit',
    reject: 'Zamietnut',
    role: 'Rola',
    activityLog: 'Log aktivit',
    noPending: 'Ziadni cakajuci pouzivatelia',
    systemSettings: 'Nastavenia systemu',
    telegramCommands: 'Telegram prikazy',
    mon: 'Po', tue: 'Ut', wed: 'St', thu: 'St', fri: 'Pi', sat: 'So', sun: 'Ne',
    months: ['Januar','Februar','Marec','April','Maj','Jun','Jul','August','September','Oktober','November','December'],
    today: 'Dnes',
    assignedToRole: 'Priradeny roli',
    assignedToUser: 'Priradeny pouzivatelovi',
    everyone: 'Vsetci',
    noAccess: 'Nemate pristup k tejto sekcii.',
    editUser: 'Upravit pouzivatela',
    deactivate: 'Deaktivovat',
    activate: 'Aktivovat',
    active: 'Aktivny',
    inactive: 'Neaktivny',
    // Stats
    navStats: 'Pohoda',
    statsUpload: 'Nahrat export z Pohody',
    statsNoData: 'Zatial ziadne data. Nahrajte export z Pohody.',
    statsThisMonth: 'Obrat tento mesiac',
    statsLastMonth: 'Obrat minuly mesiac',
    statsActiveSalons: 'Aktivne salony',
    statsTopProducts: 'Top produkty',
    statsAllOZ: 'Vsetci OZ',
    statsTotalRevenue: 'Celkovy obrat firmy',
    statsTrend: 'Trend',
    statsRevenue: 'Obrat',
    statsQuantity: 'Mnozstvo',
    statsProduct: 'Produkt',
    statsName: 'Meno',
    statsFilterBrand: 'Filter podla znacky',
    statsAllBrands: 'Vsetko',
    statsMonthlyRevenue: 'Mesacne obraty',
    // Clients
    navClients: 'Kadeřníci',
    clientsTitle: 'Kadeřníci a salony',
    clientsSearch: 'Hladat...',
    clientsAdd: 'Přidat kadeřníka',
    clientsImport: 'Importovat z Pohody',
    clientsSendEmail: 'Odoslat email',
    clientsName: 'Salon',
    clientsContact: 'Kontakt',
    clientsCity: 'Mesto',
    clientsOZ: 'Obchodny zastupca',
    clientsBirthday: 'Dnes slavi narodeniny',
    clientsNameday: 'Dnes ma meniny',
    clientsThisWeek: 'Tento tyzden'
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
      office: 'Kancelar',
      warehouse: 'Sklad',
      backoffice: 'Back office',
      sales_cz: 'OZ Cesko',
      sales_sk: 'OZ Slovensko',
      pending: 'Ceka na schvaleni'
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
          title: cmd.title || 'Ukol z Telegramu',
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
        toast('Ukol z Telegramu vytvoren: ' + (cmd.title || ''), 'success');
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
