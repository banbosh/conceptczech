# DocFlow — ASO popis pro Google Play
Aktualizováno: 2026-04-24 (v1.0.1, Android 15 / API 35)

---

## 🇬🇧 ENGLISH

### Short Description (max 80 znaků)
```
Track all your subscriptions, contracts and expenses in one place.
```

### Full Description
```
DocFlow — Contract & Subscription Manager

Never lose track of what you're paying for. DocFlow is your personal manager for every subscription, contract, recurring payment and vehicle obligation — all in one place, always up to date.

📋 WHAT CAN DOCFLOW TRACK?

🎬 Streaming & Software
Netflix, Spotify, Disney+, Adobe CC, Microsoft 365, Dropbox — manage all your digital subscriptions in one list.

📱 Phone & Internet
Mobile plans, internet contracts, data packages — know when they renew and what they cost.

🏠 Utilities & Rent
Electricity, gas, water, rent, housing fees — always know your recurring household costs.

🛡️ Insurance
Life insurance, health insurance, property insurance — track policy renewals so you're never caught without cover.

🚗 Vehicle
• Technical inspection (STK) expiry
• Vehicle insurance expiry
• Motorway vignette renewal
• Car leasing payments
Everything related to your car, in one place.

💳 Finance & Other
Bank fees, loans, gym memberships, and anything else that repeats.

---

📊 SMART DASHBOARD
See your total monthly and yearly spending the moment you open the app. Get automatic warnings before any contract or subscription expires.

🔔 RENEWAL ALERTS
DocFlow notifies you 7 days before anything renews — so you always have time to cancel, renegotiate, or simply renew with confidence.

🌗 DARK, LIGHT & SYSTEM THEME
Full Dark Mode, Light Mode, and a System Theme that automatically follows your device settings.

🔐 SECURE & PRIVATE
Sign in with Google, Apple or e-mail. Family sharing lets you invite up to 5 family members so you can manage contracts together.

📤 CSV EXPORT
Export all your data anytime. Your contracts, your data.

🌍 8 LANGUAGES
English · Czech · German · French · Spanish · Polish · Chinese · Hindi

⚡ KEY FEATURES AT A GLANCE
• Subscriptions, contracts & recurring payments
• Vehicle: STK, insurance, vignette, leasing
• Real-time spending dashboard (monthly + yearly)
• Renewal alerts 7 days in advance
• Smart templates for fast entry
• Dark / Light / System theme
• Family sharing (up to 5 members)
• CSV export
• 8 languages
• Works offline
```

---

## 🇨🇿 ČEŠTINA

### Short Description (max 80 znaků)
```
Sledujte všechna předplatná, smlouvy a výdaje na jednom místě.
```

### Full Description
```
DocFlow — Správce smluv a předplatných

Přestaňte zapomínat, za co platíte. DocFlow je váš osobní správce pro každé předplatné, smlouvu, opakující se platbu i povinnosti spojené s vozidlem — vše na jednom místě, vždy aktuální.

📋 CO VŠE DOCFLOW HLÍDÁ?

🎬 Streaming a software
Netflix, Spotify, Disney+, Adobe CC, Microsoft 365, Dropbox — všechna digitální předplatná přehledně na jednom místě.

📱 Telefon a internet
Mobilní tarify, internetové smlouvy, datové balíčky — víte, kdy se obnovují a co stojí.

🏠 Energie a nájem
Elektřina, plyn, voda, nájem, poplatky za bydlení — vždy přehled o opakujících se výdajích domácnosti.

🛡️ Pojištění
Životní pojištění, zdravotní pojištění, pojištění majetku — hlídejte platnosti pojistek a nikdy nepřijďte o krytí.

🚗 Vozidlo
• Konec platnosti STK
• Konec platnosti pojištění vozidla
• Obnovení dálniční známky
• Splátky leasingu
Vše, co se týká vašeho auta, na jednom místě.

💳 Finance a ostatní
Bankovní poplatky, půjčky, členství v posilovně a cokoli dalšího, co se opakuje.

---

📊 CHYTRÝ DASHBOARD
Hned po otevření aplikace vidíte celkové měsíční a roční výdaje. Automatická upozornění před vypršením smluv.

🔔 UPOZORNĚNÍ NA OBNOVENÍ
DocFlow vás upozorní 7 dní před obnovením čehokoli — takže máte vždy čas zrušit, vyjednat nebo obnovit vědomě.

🌗 TMAVÝ, SVĚTLÝ A SYSTÉMOVÝ MOTIV
Plný tmavý režim, světlý režim a systémový motiv, který automaticky sleduje nastavení vašeho zařízení.

🔐 BEZPEČNÉ A SOUKROMÉ
Přihlášení přes Google, Apple nebo e-mail. Sdílení s rodinou umožňuje pozvat až 5 členů a spravovat smlouvy společně.

📤 EXPORT CSV
Exportujte všechna data kdykoli. Vaše smlouvy, vaše data.

🌍 8 JAZYKŮ
Čeština · Angličtina · Němčina · Francouzština · Španělština · Polština · Čínština · Hindština

⚡ PŘEHLED FUNKCÍ
• Předplatná, smlouvy a opakující se platby
• Vozidlo: STK, pojištění, dálniční známka, leasing
• Dashboard výdajů v reálném čase (měsíční + roční)
• Upozornění na obnovení 7 dní předem
• Chytré šablony pro rychlé zadání
• Tmavý / Světlý / Systémový motiv
• Sdílení s rodinou (až 5 členů)
• Export CSV
• 8 jazyků
• Funguje offline
```

---

## 🔁 Změny oproti 1.0.0 (release notes)
### EN
```
• Android 15 (API 35) support
• Stronger security for family invites
• Local 2FA QR generation (secret stays on device)
• Bug fixes and performance improvements
```
### CS
```
• Podpora Androidu 15 (API 35)
• Silnější zabezpečení rodinných pozvánek
• Generování 2FA QR kódu přímo v zařízení (secret neopouští zařízení)
• Opravy chyb a zlepšení výkonu
```

---

## 📝 Postup v Play Console
1. Store listing → **English (default)** → vlož EN texty
2. Store listing → **Add translation → Czech** → vlož CS texty
3. Release → **Production → Create new release** → upload nový AAB (versionCode ≥ 2)
4. Release notes → vlož obě jazykové verze (viz výše)
5. Data safety → ověř, že je uvedeno:
   - Collected: Email address, Name, Account info, App activity
   - Shared: Email addresses (pro Resend — odesílání pozvánek rodině)
   - Encrypted in transit: Yes
   - Users can request deletion: Yes (viz `delete-account.html`)
6. App content → Target audience: 18+ (finance), Privacy policy: https://banbosh.cz/privacy-policy.html
7. Submit for review

## ⚠️ Co bylo odstraněno z popisu (nebylo v aplikaci implementováno)
- ~~Digital signature~~ — v aplikaci zatím není
- ~~PDF preview in app~~ — v aplikaci zatím není
- ~~Two-factor authentication (2FA)~~ — kód je přítomný, ale vyžaduje **placený Firebase Identity Platform**. Dokud nebude zapnutý, 2FA v popisu nezmiňujeme.

## 🔑 Kontakt
- Developer: BANBOSH Studio
- Email: info@banbosh.cz
- Web: https://banbosh.cz
- Privacy Policy: https://banbosh.cz/privacy-policy.html

## 📐 Požadavky na grafiku
- Telefon screenshoty: 1080 × 1920 nebo 1080 × 2340 (min. 2 ks)
- Feature graphic: 1024 × 500 PNG / JPG
- Ikona: 512 × 512 PNG (máme `icon-512.png`)
