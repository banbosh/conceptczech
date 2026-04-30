# DocFlow 1.0.1 — jak nasadit opravy do Play Store

Všechny opravy jsou ve složce `docflow-fixes/smlouvy/` v této větvi.
**Zkopírujte je do vaší lokální kopie DocFlow** (buď `C:\banbosh\smlouvy-app\` nebo `banbosh-workspace\smlouvy\`) a postupujte podle této příručky.

---

## 🗂 Které soubory se mění

| Akce     | Soubor | Co se změnilo |
|----------|--------|---------------|
| ➕ nový  | `firestore.rules` | Kompletní pravidla (bylo prázdné) |
| 🔄 update | `firebase.json` | Přidán odkaz na rules + functions |
| ➕ nový  | `qrcode.min.js` | Lokální QR generátor (MIT, 20 KB) |
| 🔄 update | `index.html` | Lokální QR pro 2FA, XSS fix, Firebase ID token pro familyInvite |
| 🔄 update | `sw.js` | Cache bump v7 + zařazení qrcode.min.js |
| 🔄 update | `android-twa/twa-manifest.json` | **targetSdkVersion 35**, versionCode 2, minSdk 23 |
| 🔄 update | `android-twa/README_GOOGLE_PLAY.md` | Nové instrukce |
| ➕ nový  | `functions/index.js` | Zabezpečený `familyInvite` |
| ➕ nový  | `functions/package.json` | Závislosti |
| ➕ nový  | `functions/.gitignore` | `node_modules`, `.env` |
| 🔄 update | `aso-description.md` | Sjednocený popis bez neexistujících funkcí |
| 🔄 update | `delete-account.html` | Dvojjazyčně CS + EN |

---

## 1️⃣ Požadavky

Na vašem Windows PC:
- **Node.js 20+** → https://nodejs.org
- **JDK 17** → https://adoptium.net
- **Firebase CLI** → `npm install -g firebase-tools`
- **Bubblewrap CLI** → `npm install -g @bubblewrap/cli`
- **Původní keystore** `docflow-release.keystore` — TEN, KTERÝ JSTE POUŽILI PŘI PRVNÍM BUILDU!
  - Pokud ho máte v `android-twa/` složce, je to v pořádku.
  - Pokud NE, nebudete moct nahrát aktualizaci — viz sekci „Ztracený keystore" níže.

---

## 2️⃣ Zkopírovat opravy

```powershell
# Předpokládám, že originál je na C:\banbosh\smlouvy-app
# a opravy jste stáhli do C:\tmp\docflow-fixes

# Zálohujte stávající (pro jistotu)
xcopy "C:\banbosh\smlouvy-app" "C:\banbosh\smlouvy-app-backup-%date:~-4,4%-%date:~-7,2%-%date:~-10,2%\" /E /I /Y

# Nakopírujte opravy
xcopy "C:\tmp\docflow-fixes\smlouvy\*" "C:\banbosh\smlouvy-app\" /E /Y
```

Ověřte, že v `C:\banbosh\smlouvy-app\` je:
- `firestore.rules` (nový)
- `firebase.json` (s `"firestore"` sekcí)
- `qrcode.min.js` (19 KB)
- `index.html` (větší než předtím)
- `sw.js` (verze v7 nahoře)
- `android-twa\twa-manifest.json` (targetSdkVersion 35)
- `functions\index.js` + `package.json`

---

## 3️⃣ Deploy Firebase (rules + functions + hosting)

```powershell
cd C:\banbosh\smlouvy-app

firebase login
firebase use banbosh-smlouvy

# 3a. Firestore pravidla
firebase deploy --only firestore:rules

# 3b. Cloud Function — nejprve nastavte Resend klíč jako secret
cd functions
npm install
cd ..
firebase functions:secrets:set RESEND_API_KEY
# → otevře se editor, vložte váš skutečný Resend API klíč (re_xxxxxxx...) a uložte

firebase deploy --only functions

# 3c. Hosting (web + service worker + qrcode.min.js)
firebase deploy --only hosting
```

### Kontrola v prohlížeči (ctrl+F5 kvůli starému cache):
- https://banbosh-smlouvy.web.app/ → aplikace se načte, DevTools Console bez chyb
- https://banbosh-smlouvy.web.app/qrcode.min.js → musí vrátit JS (19 KB)
- https://banbosh-smlouvy.web.app/.well-known/assetlinks.json → JSON se SHA256
  - **Pokud vrací 404**, TWA ukáže adresní řádek → viz sekce „Assetlinks" dole

---

## 4️⃣ Build AAB pro Android 15 (API 35)

```powershell
cd C:\banbosh\smlouvy-app\android-twa

# Bubblewrap přegeneruje Gradle projekt s novým targetSdk 35
bubblewrap update --manifest=./twa-manifest.json --skipVersionUpgrade

# Build
bubblewrap build
```

Výstup: `app-release-bundle.aab` ve složce.

Ověřte podpis (musí odpovídat původnímu keystoru):
```powershell
keytool -list -printcert -jarfile app-release-bundle.aab
```

---

## 5️⃣ Upload do Google Play Console

1. Přihlaste se: https://play.google.com/console
2. **DocFlow → Release → Production → Create new release**
3. **Upload** → `app-release-bundle.aab`
4. **Release name**: `1.0.1`
5. **Release notes**:
   - **Čeština:**
     ```
     • Podpora Androidu 15 (API 35)
     • Silnější zabezpečení rodinných pozvánek
     • Generování 2FA QR kódu přímo v zařízení (secret neopouští zařízení)
     • Opravy chyb a zlepšení výkonu
     ```
   - **English (default):**
     ```
     • Android 15 (API 35) support
     • Stronger security for family invites
     • Local 2FA QR generation (secret stays on device)
     • Bug fixes and performance improvements
     ```
6. **Review release** → **Start rollout to Production**

### Data Safety (Dashboard → App content → Data safety)

Ověřte, že je vyplněno:

| Typ              | Collected? | Shared? | Purpose                   | Required? |
|------------------|-----------|---------|---------------------------|-----------|
| Email address    | ✅        | ✅ Resend (pro pozvánky) | Account management + communication | Required |
| Name             | ✅        | ❌      | Personalization           | Optional |
| User IDs (uid)   | ✅        | ❌      | Account management        | Required |
| App activity (contracts) | ✅ | ❌     | App functionality         | Required |
| Device or other IDs | ❌    | ❌      | —                         | — |

- **Data is encrypted in transit**: ✅ Yes (HTTPS)
- **You can request that data be deleted**: ✅ Yes → link `https://banbosh-smlouvy.web.app/delete-account`

### App Content
- **Privacy policy**: `https://banbosh.cz/privacy-policy.html` — ověřte, že opravdu existuje (otevřete v prohlížeči)
- **Target audience**: 18+ (finance kategorie)
- **Ads**: No
- **Content rating**: Everyone (nebo podle dotazníku)

---

## 🆘 Troubleshooting

### „Ztracený keystore"
Pokud nemáte `docflow-release.keystore`, který jste použili při prvním nahrání:

1. V Play Console → **Setup → App signing**
2. Pokud používáte **Play App Signing** (doporučené, defaultní od roku 2021), můžete požádat o reset upload klíče: https://support.google.com/googleplay/android-developer/answer/9842756
3. Pokud NE, musíte buď:
   - Najít původní keystore (obvykle v `android-twa/docflow-release.keystore`)
   - Nebo publikovat úplně novou aplikaci pod jiným package ID — ztratíte všechny stávající uživatele 😱

### `assetlinks.json` vrací 404
Z `twa-manifest.json` zjistěte SHA256:
```powershell
keytool -list -v -keystore docflow-release.keystore -alias docflow-key
```
Vytvořte `smlouvy/.well-known/assetlinks.json`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "cz.banbosh.docflow",
    "sha256_cert_fingerprints": ["AB:CD:EF:..."]
  }
}]
```
A redeploy hosting. Ověřte v prohlížeči.

### CF `familyInvite` vrací 401 „unauthenticated"
Klient neposílá `Authorization: Bearer <idToken>`. Ověřte v DevTools → Network, že na request do `familyInvite` je hlavička `Authorization`. Pokud ne, stará verze `index.html` je stále v cache — smažte site data a nahrajte znovu.

### CF `familyInvite` vrací 403 „inviter-mismatch"
Uživatel se přihlásil pod jedním e-mailem, ale v `user.email` (localStorage) má jiný. Klient odešle `inviterEmail` z localStorage, CF ho porovná s ověřeným tokenem. Oprava: při přihlášení vždy `user.email = fbUser.email`. Už je to správně v nové verzi, ale stará session může mít nekonzistentní stav — odhlaste se a přihlaste znovu.

### Play Console: „Your app targets Android 14 (API level 34) or lower"
Znamená, že `targetSdkVersion` v AAB není 35. Po `bubblewrap update` zkontrolujte `android-twa/app/build.gradle` — musí mít `targetSdk 35` a `compileSdk 35`.

---

## ✅ Checklist před kliknutím na „Submit"

- [ ] `firebase deploy --only firestore:rules` — OK
- [ ] `firebase functions:secrets:set RESEND_API_KEY` — skutečný klíč uložen
- [ ] `firebase deploy --only functions` — familyInvite deployed
- [ ] `firebase deploy --only hosting` — OK
- [ ] `https://banbosh-smlouvy.web.app/qrcode.min.js` → 200
- [ ] `https://banbosh-smlouvy.web.app/.well-known/assetlinks.json` → 200, správný SHA256
- [ ] `https://banbosh.cz/privacy-policy.html` → 200, obsahuje info o Resend sharing
- [ ] AAB build úspěšný, `targetSdk 35`
- [ ] Keystore odpovídá původnímu (stejný SHA256)
- [ ] Data safety formulář vyplněný (viz tabulka výše)
- [ ] Release notes CS + EN
- [ ] Ručně otestováno: přihlášení, přidání smlouvy, rodinná pozvánka, smazání účtu

---

## 📞 Co dělat, když Play Console odmítne aktualizaci

Play review obvykle posílá email s důvodem. Nejčastější:

1. **„Violation of Deceptive Behavior Policy"** — popis slibuje funkci, která nefunguje. V `aso-description.md` už jsou odstraněny „digital signature" a „PDF preview". Zkontrolujte, že jste použili **novou** verzi popisu, ne starou.

2. **„Minimum functionality"** — TWA ukazuje URL bar. Fix: `assetlinks.json` na hostingu.

3. **„Data safety form is incomplete"** — doplňte sdílení email s Resend.

4. **„Target API level"** — po bubblewrap update zkontrolujte `android-twa/app/build.gradle`.

Pokud se zasekne, pošlete mi text odmítnutí z Play Console a vyřešíme to.
