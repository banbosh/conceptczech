import React from 'react'
import ReactDOM from 'react-dom/client'
import FootballGame from './BanboshFootball.jsx'

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
