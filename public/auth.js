/* ============================================================
   AUTH MODULE — Phone + Password login via team_members lookup
   ============================================================ */
const Auth = (() => {
  let currentUser = null;
  let currentProfile = null;

  const ADMIN_EMAILS = ['knobloch.petr@gmail.com', 'info@banbosh.cz'];

  function isAdmin(profile) {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    if (profile.email && profile.email.endsWith('@conceptczech.cz')) return true;
    if (profile.email && ADMIN_EMAILS.includes(profile.email)) return true;
    return false;
  }

  function normalizePhone(phone) {
    // Zachovat + na začátku, odstranit mezery a pomlčky
    const stripped = phone.replace(/[\s\-]/g, '');
    return stripped;
  }

  async function loginWithPhone(phone, password) {
    const normalized = normalizePhone(phone);

    // Look up email by phone in team_members
    const snap = await db.collection('team_members')
      .where('phone', '==', normalized)
      .limit(1)
      .get();

    if (snap.empty) {
      throw { code: 'phone-not-found', message: 'Telefonní číslo nebylo nalezeno' };
    }

    const memberDoc = snap.docs[0];
    const email = memberDoc.data().email;

    if (!email) {
      throw { code: 'no-email', message: 'Ucet nema prirazeny email' };
    }

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw { code: 'wrong-password', message: 'Nespravne heslo' };
      }
      if (err.code === 'auth/user-not-found') {
        throw { code: 'user-not-found', message: 'Uzivatel nenalezen v systemu' };
      }
      if (err.code === 'auth/too-many-requests') {
        throw { code: 'too-many-requests', message: 'Prilis mnoho pokusu. Zkuste to pozdeji.' };
      }
      throw err;
    }
  }

  async function changePassword(currentPassword, newPassword) {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw { code: 'no-user', message: 'Uzivatel neni prihlasen' };
    }

    // Re-authenticate
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    try {
      await user.reauthenticateWithCredential(credential);
    } catch (err) {
      throw { code: 'wrong-password', message: 'Soucasne heslo je nespravne' };
    }

    await user.updatePassword(newPassword);
  }

  async function logout() {
    await auth.signOut();
    currentUser = null;
    currentProfile = null;
  }

  async function ensureUserProfile(user) {
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();

    if (snap.exists) {
      currentProfile = { id: user.uid, ...snap.data() };
      // Auto-approve admin domain
      const isAdminUser = (user.email && user.email.endsWith('@conceptczech.cz')) || (user.email && ADMIN_EMAILS.includes(user.email));
      if (isAdminUser && !currentProfile.approved) {
        await ref.update({ approved: true, role: 'admin' });
        currentProfile.approved = true;
        currentProfile.role = 'admin';
      }
      return currentProfile;
    }

    // New user — create profile
    const isAdminDomain = user.email && user.email.endsWith('@conceptczech.cz');
    const isAdminEmail = user.email && ADMIN_EMAILS.includes(user.email);
    const isAdminUser = isAdminDomain || isAdminEmail;
    const profile = {
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role: isAdminUser ? 'admin' : 'pending',
      approved: isAdminUser,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      phone: '',
      notifyEmail: true,
      notifySMS: false
    };

    await ref.set(profile);
    currentProfile = { id: user.uid, ...profile };
    return currentProfile;
  }

  function onAuthStateChanged(callback) {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        currentUser = user;
        const profile = await ensureUserProfile(user);
        callback(user, profile);
      } else {
        currentUser = null;
        currentProfile = null;
        callback(null, null);
      }
    });
  }

  function getUser() { return currentUser; }
  function getProfile() { return currentProfile; }

  function updateProfile(data) {
    currentProfile = { ...currentProfile, ...data };
  }

  return {
    loginWithPhone,
    changePassword,
    logout,
    onAuthStateChanged,
    getUser,
    getProfile,
    updateProfile,
    isAdmin
  };
})();
