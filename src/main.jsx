import React from 'react'
import ReactDOM from 'react-dom/client'
import FootballGame from './BanboshFootball.jsx'

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.banbosh.football'

function isAuthorized() {
  const h = location.hostname
  if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local')) return true

  const params = new URLSearchParams(location.search)
  if (params.get('app') === '1') {
    sessionStorage.setItem('banbosh_app', '1')
    return true
  }
  if (sessionStorage.getItem('banbosh_app') === '1') return true

  if (document.referrer && document.referrer.startsWith('android-app://com.banbosh.football')) {
    sessionStorage.setItem('banbosh_app', '1')
    return true
  }

  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true
  if (window.navigator.standalone === true) return true

  return false
}

function renderPlayStoreGate() {
  const root = document.getElementById('root')
  root.innerHTML = `
    <div style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0a0e17;color:#e5e7eb;font-family:Arial,sans-serif;padding:24px;text-align:center;">
      <img src="/icons/icon-192x192.png" style="width:140px;height:140px;border-radius:28px;box-shadow:0 8px 32px rgba(34,211,238,0.4);margin-bottom:24px" alt="Banbosh Football"/>
      <h1 style="margin:0 0 8px;font-size:28px;background:linear-gradient(135deg,#6366f1,#22d3ee 40%,#34d399 70%,#4ade80);-webkit-background-clip:text;background-clip:text;color:transparent;">BANBOSH FOOTBALL</h1>
      <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;max-width:340px;line-height:1.5;">
        Tato hra je k dispozici pouze prostřednictvím oficiální aplikace na Google Play.<br/>
        <span style="font-size:13px;color:#6b7280;">This game is available only through the official Google Play app.</span>
      </p>
      <a href="${PLAY_URL}" style="display:inline-block;background:#22d3ee;color:#0a0e17;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:14px;font-size:16px;box-shadow:0 4px 16px rgba(34,211,238,0.4);">
        Stáhnout na Google Play
      </a>
      <p style="margin-top:32px;font-size:12px;color:#4b5563;">Created by <a href="https://www.banbosh.cz" style="color:#22d3ee;text-decoration:none;">Banbosh Studio</a></p>
    </div>
  `
  const s = document.getElementById('splash')
  if (s) {
    s.style.opacity = 0
    setTimeout(() => s.remove(), 300)
  }
}

if (isAuthorized()) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <FootballGame />
    </React.StrictMode>
  )
  requestAnimationFrame(() => {
    const s = document.getElementById('splash')
    if (!s) return
    s.style.opacity = 0
    setTimeout(() => s.remove(), 500)
  })
} else {
  renderPlayStoreGate()
}
