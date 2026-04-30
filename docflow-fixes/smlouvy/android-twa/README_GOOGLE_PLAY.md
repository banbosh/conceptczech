# DocFlow — Google Play (TWA)

> 📝 **Popis pro store listing najdete v jediném zdroji pravdy:**
> [`../aso-description.md`](../aso-description.md)
>
> Tento soubor řeší pouze **build + upload** postup.

---

## ✨ Co je nového (verze 1.0.1)
- Android 15 / API 35 target
- Bezpečný `familyInvite` (Firebase Auth token + App Check)
- 2FA QR generované lokálně (secret neopouští zařízení)
- Firestore pravidla v repu
- Opravy XSS v seznamu rodiny

---

## 1️⃣ Požadavky
- Node.js 20+
- JDK 17 (pro bubblewrap build)
- Firebase CLI `npm i -g firebase-tools`
- Bubblewrap `npm i -g @bubblewrap/cli`
- Release keystore `docflow-release.keystore` (z předchozího buildu — NE VYTVÁŘEJTE NOVÝ, jinak Play odmítne upload kvůli nekompatibilnímu podpisu)

## 2️⃣ Deploy webové části (hosting + rules + functions)
```bash
cd smlouvy

# Firestore pravidla
firebase deploy --only firestore:rules --project banbosh-smlouvy

# Cloud Function (familyInvite)
cd functions && npm install && cd ..
firebase functions:secrets:set RESEND_API_KEY --project banbosh-smlouvy
# → vložte skutečný Resend API klíč
firebase deploy --only functions --project banbosh-smlouvy

# Hosting
firebase deploy --only hosting --project banbosh-smlouvy
```

Ověř:
- `https://banbosh-smlouvy.web.app/` → aplikace se načte
- `https://banbosh-smlouvy.web.app/qrcode.min.js` → HTTP 200 (19 KB)
- `https://banbosh-smlouvy.web.app/.well-known/assetlinks.json` → JSON se SHA256 vašeho keystoru
- `https://banbosh.cz/privacy-policy.html` → musí existovat

## 3️⃣ Build Android AAB (Bubblewrap)
```bash
cd smlouvy/android-twa

# update twa-manifest.json je hotový: targetSdk 35, versionCode 2
bubblewrap update --manifest=./twa-manifest.json --skipVersionUpgrade
bubblewrap build
```
Vytvoří `app-release-bundle.aab` v aktuální složce.

Ověř podpis:
```bash
keytool -list -printcert -jarfile app-release-bundle.aab
```

## 4️⃣ Upload do Google Play Console
1. https://play.google.com/console → DocFlow
2. **Release → Production → Create new release**
3. Upload `app-release-bundle.aab`
4. **Release notes** (CS + EN) — viz `../aso-description.md` sekce „Změny oproti 1.0.0"
5. **Next → Review release → Start rollout to Production**

### ⚠️ Před odesláním zkontrolujte v Play Console:
- **Data safety** — viz checklist v `../aso-description.md`
- **Target API level** → musí být **35** (Play to označí zeleně)
- **Declared permissions** → jen INTERNET a POST_NOTIFICATIONS (Android 13+)
- **App content → Target audience** → 18+
- **App content → Privacy policy** → `https://banbosh.cz/privacy-policy.html`

## 5️⃣ Troubleshooting

**„Your app contains a reference to a non-existent activity"**
→ `packageId` v twa-manifest.json neodpovídá tomu, co je v Play Console. Musí být `cz.banbosh.docflow`.

**„Upload was signed with a different key"**
→ Použili jste jiný keystore. Najděte původní `docflow-release.keystore`. Pokud je ztracený, musíte aktivovat Google Play App Signing a požádat Google o reset klíče.

**TWA ukazuje URL bar (adresní řádek)**
→ `assetlinks.json` není nahraný nebo neobsahuje správný SHA256. Viz krok 2.

**CF `familyInvite` vrací 401**
→ Klient neposílá `Authorization: Bearer <idToken>`. Zkontrolujte, že uživatel je přihlášený a že v index.html je nová verze `sendFamilyInvite()`.
