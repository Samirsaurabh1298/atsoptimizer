'use client'
import { useEffect, useState } from 'react'

export default function Header({ onReset }: { onReset?: () => void }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      setDark(true)
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: 900, margin: '0 auto',
        padding: '0 20px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="font-display" style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px', lineHeight: 1 }}>
            <span style={{ color: 'var(--accent)' }}>ATS</span><span style={{ color: 'var(--ink)' }}>Optimizer</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={toggleTheme}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 40, height: 40, borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--surface-3)',
              cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {onReset && (
            <button
              onClick={onReset}
              style={{
                fontSize: 13, color: 'var(--ink-muted)',
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              }}
            >
              ↩ Start over
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
