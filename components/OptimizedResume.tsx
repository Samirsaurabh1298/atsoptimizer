'use client'
import { useState } from 'react'
import { AnalysisData } from '@/app/page'

export default function OptimizedResume({
  resume, analysis, onReset
}: {
  resume: string
  analysis: AnalysisData
  onReset: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(resume)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadTxt = () => {
    const blob = new Blob([resume], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'optimized-resume.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadHtml = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Optimized Resume</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; max-width: 800px; margin: 40px auto; color: #111; }
  h1 { font-size: 18pt; margin-bottom: 4px; }
  h2 { font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
  p, li { font-size: 11pt; }
  pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; }
</style>
</head>
<body><pre>${resume.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body>
</html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'optimized-resume.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--accent-light)', border: '1px solid #b7dfc9',
          borderRadius: 20, padding: '4px 14px', marginBottom: 14, fontSize: 12,
          color: 'var(--accent)', fontWeight: 500
        }}>
          ✓ Optimization complete
        </div>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Your ATS-optimized resume
        </h2>
        <p style={{ color: 'var(--ink-muted)', fontSize: 15, marginTop: 4 }}>
          Keywords injected, formatting standardized, ready to submit
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Match Score', value: `${analysis.matchScore}%` },
          { label: 'Skills Added', value: `${analysis.missingSkills.length}` },
          { label: 'ATS Format', value: '✓ Clean' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '14px 12px', textAlign: 'center'
          }}>
            <p className="font-display" style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{value}</p>
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={handleCopy}
          style={{
            flex: 1, minWidth: 120, padding: '11px 16px',
            background: copied ? 'var(--accent-light)' : 'var(--surface)',
            color: copied ? 'var(--accent)' : 'var(--ink)',
            border: `1px solid ${copied ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 10, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy text'}
        </button>
        <button
          onClick={handleDownloadTxt}
          style={{
            flex: 1, minWidth: 120, padding: '11px 16px',
            background: 'var(--surface)', color: 'var(--ink)',
            border: '1px solid var(--border)', borderRadius: 10,
            fontSize: 13, fontWeight: 500, cursor: 'pointer'
          }}
        >
          ⬇ Download .txt
        </button>
        <button
          onClick={handleDownloadHtml}
          style={{
            flex: 1, minWidth: 120, padding: '11px 16px',
            background: 'var(--surface)', color: 'var(--ink)',
            border: '1px solid var(--border)', borderRadius: 10,
            fontSize: 13, fontWeight: 500, cursor: 'pointer'
          }}
        >
          🌐 Download .html
        </button>
      </div>

      {/* ATS tip banner */}
      <div style={{
        background: 'var(--warn-light)', border: '1px solid #fde68a',
        borderRadius: 10, padding: '12px 16px', marginBottom: 16,
        fontSize: 13, color: 'var(--warn)', lineHeight: 1.6
      }}>
        <strong>ATS tip:</strong> Copy this text into a fresh Word document (.docx) using Arial or Calibri 11pt for best ATS compatibility. Avoid tables, columns, and images.
      </div>

      {/* Resume output */}
      <div className="card">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)'
        }}>
          <p style={{ fontSize: 13, fontWeight: 500 }}>Optimized Resume</p>
          <span style={{
            fontSize: 11, background: 'var(--accent-light)', color: 'var(--accent)',
            border: '1px solid #b7dfc9', borderRadius: 12, padding: '2px 10px'
          }}>
            ATS-friendly format
          </span>
        </div>
        <pre className="resume-output" style={{
          maxHeight: 600, overflowY: 'auto',
          padding: '0 4px',
          fontSize: 13, lineHeight: 1.75,
          fontFamily: 'var(--font-body)'
        }}>
          {resume}
        </pre>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          onClick={onReset}
          style={{
            fontSize: 14, color: 'var(--ink-muted)', background: 'none',
            border: 'none', cursor: 'pointer', textDecoration: 'underline'
          }}
        >
          ↩ Optimize another resume
        </button>
      </div>
    </div>
  )
}
