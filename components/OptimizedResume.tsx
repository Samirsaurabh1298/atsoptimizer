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

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Optimized Resume</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #111; padding: 40px; }
  pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.7; }
  @media print { body { padding: 20px; } button { display: none; } }
</style>
</head>
<body>
<button onclick="window.print()" style="margin-bottom:20px;padding:8px 20px;background:#1a472a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">
  Save as PDF (use Print → Save as PDF)
</button>
<pre>${resume.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`)
    printWindow.document.close()
  }

  const handleDownloadWord = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
    const lines = resume.split('\n')
    const docChildren: any[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        docChildren.push(new Paragraph({ text: '' }))
        continue
      }
      const isHeading = /^[A-Z][A-Z\s]{3,}$/.test(trimmed)
      if (isHeading) {
        docChildren.push(new Paragraph({
          text: trimmed,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 80 },
        }))
      } else if (trimmed.startsWith('- ')) {
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: trimmed.slice(2), size: 22 })],
          bullet: { level: 0 },
        }))
      } else {
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: trimmed, size: 22 })],
          spacing: { after: 40 },
        }))
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children: docChildren }],
    })

    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'optimized-resume.docx'
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
          onClick={handleDownloadPdf}
          style={{
            flex: 1, minWidth: 120, padding: '11px 16px',
            background: 'var(--surface)', color: 'var(--ink)',
            border: '1px solid var(--border)', borderRadius: 10,
            fontSize: 13, fontWeight: 500, cursor: 'pointer'
          }}
        >
          📄 Download PDF
        </button>
        <button
          onClick={handleDownloadWord}
          style={{
            flex: 1, minWidth: 120, padding: '11px 16px',
            background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 500, cursor: 'pointer'
          }}
        >
          📝 Download Word
        </button>
      </div>

      {/* ATS tip banner */}
      <div style={{
        background: 'var(--warn-light)', border: '1px solid #fde68a',
        borderRadius: 10, padding: '12px 16px', marginBottom: 16,
        fontSize: 13, color: 'var(--warn)', lineHeight: 1.6
      }}>
        <strong>ATS tip:</strong> Use the Word (.docx) download for best ATS compatibility — Arial or Calibri 11pt, no tables or columns.
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
