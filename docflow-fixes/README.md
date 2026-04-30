# DocFlow 1.0.1 — oprava pro Google Play (Android 15)

Tato složka obsahuje **kompletní sadu oprav** pro DocFlow apku, aby prošla aktualizací na Google Play se zaměřením na **Android 15 (API level 35)**.

**Zdrojové repo:** https://github.com/banbosh/banbosh-workspace/tree/master/smlouvy
**Pracovní větev v tomto repu:** `claude/review-docflow-app-mHH8i` (v adresáři `docflow-fixes/`)

## 📖 Jak na to
Viz **[APPLY.md](./APPLY.md)** — krok za krokem postup od kopírování souborů až po Play Console.

## 🔒 Co se řeší (z bezpečnostního auditu)

| Prioritní | Problém | Oprava |
|-----------|---------|--------|
| 🔴 Critical | `targetSdkVersion: 34` → Play odmítá | → API 35 v `android-twa/twa-manifest.json` |
| 🔴 Critical | Chybí `firestore.rules` | ✅ přidáno, uzamčeno na `request.auth.uid == uid` |
| 🔴 Critical | `familyInvite` CF bez auth = spam relay | ✅ vyžaduje Firebase ID token + App Check + rate limit |
| 🔴 Critical | 2FA QR secret šel na `api.qrserver.com` | ✅ lokální generování pomocí `qrcode.min.js` |
| 🟡 High | XSS v `family-avatar` | ✅ `esc()` na 1. znaku emailu |
| 🟡 High | ASO slibuje „digital signature" + „PDF preview" | ✅ odstraněno z popisu |
| 🟡 Medium | `delete-account.html` pouze anglicky | ✅ dvojjazyčně CS + EN |
| 🟢 Low | `sw.js` nekešoval qrcode lib | ✅ v7 bump, STATIC_ASSETS aktualizován |

## 📦 Struktura

```
docflow-fixes/
├─ README.md                 ← tento soubor
├─ APPLY.md                  ← krok-za-krokem návod
└─ smlouvy/                  ← drop-in nahrazení obsahu smlouvy/ v banbosh-workspace
   ├─ firestore.rules        (nové)
   ├─ firebase.json          (update)
   ├─ qrcode.min.js          (nové, 20 KB, MIT license)
   ├─ index.html             (update — QR, XSS, ID token)
   ├─ sw.js                  (update — cache v7)
   ├─ aso-description.md     (update — sjednoceno)
   ├─ delete-account.html    (update — CS+EN)
   ├─ android-twa/
   │  ├─ twa-manifest.json   (update — targetSdk 35, v1.0.1)
   │  └─ README_GOOGLE_PLAY.md (update — zkrácené instrukce)
   └─ functions/             (nová složka)
      ├─ index.js            (nový — bezpečný familyInvite)
      ├─ package.json        (nové)
      └─ .gitignore          (nové)
```

## ⚠️ Co NENÍ v tomto balíčku (musíte doplnit vy)

1. **`docflow-release.keystore`** — zůstává u vás (nikdy ho nesdílejte veřejně!)
2. **`.well-known/assetlinks.json`** — specifické pro váš keystore (SHA256). Viz APPLY.md sekce „Assetlinks".
3. **Skutečný Resend API klíč** — nastavte přes `firebase functions:secrets:set RESEND_API_KEY` (nikdy necommitujte)
4. **Privacy policy na banbosh.cz** — ověřte, že `https://banbosh.cz/privacy-policy.html` existuje a obsahuje info o Resend sharing

## 🧾 Licence 3. stran
- `qrcode.min.js` — MIT License, © 2012 davidshimjs ([github.com/davidshimjs/qrcodejs](https://github.com/davidshimjs/qrcodejs))
