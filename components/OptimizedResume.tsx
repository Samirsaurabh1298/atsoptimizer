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

  // Section headers are ALL CAPS short lines (e.g. EXPERIENCE, SKILLS)
  const isSectionHeader = (line: string) =>
    /^[A-Z][A-Z\s\/]{2,}$/.test(line.trim()) && line.trim().length < 40

  const handleDownloadPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    let y = 20
    const pageHeight = 277

    for (const rawLine of resume.split('\n')) {
      const isHeader = isSectionHeader(rawLine)
      const fontSize = isHeader ? 12 : 11
      const lineHeight = isHeader ? 7 : 6
      doc.setFont('helvetica', isHeader ? 'bold' : 'normal')
      doc.setFontSize(fontSize)
      const wrapped = doc.splitTextToSize(rawLine || ' ', 180)
      for (const line of wrapped) {
        if (y + lineHeight > pageHeight) { doc.addPage(); y = 20 }
        doc.text(line, 15, y)
        y += lineHeight
      }
    }
    doc.save('optimized-resume.pdf')
  }

  const handleDownloadDocx = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = await import('docx')
    const paragraphs = resume.split('\n').map(line => {
      const header = isSectionHeader(line)
      return new Paragraph({
        heading: header ? HeadingLevel.HEADING_2 : undefined,
        border: header ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: '333333', space: 4 } } : undefined,
        children: [new TextRun({
          text: line,
          font: 'Arial',
          size: header ? 24 : 22,
          bold: header,
        })],
      })
    })
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'optimized-resume.docx'
    a.click()
    URL.revokeObjectURL(url)
  }

  const [latexLoading, setLatexLoading] = useState(false)

  const handleDownloadLatex = async () => {
    setLatexLoading(true)
    try {
      const res = await fetch('/api/latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resume }),
      })
      if (!res.ok) throw new Error('Failed to generate LaTeX')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'optimized-resume.tex'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLatexLoading(false)
    }
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
          ⬇ Download PDF
        </button>
        <button
          onClick={handleDownloadDocx}
          style={{
            flex: 1, minWidth: 120, padding: '11px 16px',
            background: 'var(--surface)', color: 'var(--ink)',
            border: '1px solid var(--border)', borderRadius: 10,
            fontSize: 13, fontWeight: 500, cursor: 'pointer'
          }}
        >
          📄 Download Word
        </button>
        <button
          onClick={handleDownloadLatex}
          disabled={latexLoading}
          style={{
            flex: 1, minWidth: 120, padding: '11px 16px',
            background: latexLoading ? 'var(--accent-light)' : 'var(--surface)',
            color: latexLoading ? 'var(--accent)' : 'var(--ink)',
            border: '1px solid var(--border)', borderRadius: 10,
            fontSize: 13, fontWeight: 500,
            cursor: latexLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
          }}
        >
          {latexLoading ? '⏳ Generating...' : '🧪 Download LaTeX'}
        </button>
      </div>

      {/* LaTeX info */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 14px', marginBottom: 12,
        fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.6
      }}>
        <strong style={{ color: 'var(--ink)' }}>LaTeX tip:</strong> Download the <code>.tex</code> file → upload to{' '}
        <strong>Overleaf.com</strong> (free) → click Compile → download your beautifully formatted PDF.
      </div>

      {/* ATS tip banner */}
      <div style={{
        background: 'var(--warn-light)', border: '1px solid #fde68a',
        borderRadius: 10, padding: '12px 16px', marginBottom: 16,
        fontSize: 13, color: 'var(--warn)', lineHeight: 1.6
      }}>
        <strong>ATS tip:</strong> Download as Word (.docx) to edit further, or PDF to submit directly. Both use Arial 11pt for maximum ATS compatibility.
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
