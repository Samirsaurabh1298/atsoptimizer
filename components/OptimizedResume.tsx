'use client'
import { useState } from 'react'
import { AnalysisData, OptimizeResult } from '@/app/page'

export default function OptimizedResume({
  resume, analysis, onReset, originalScore, optimizeResult, docxResultBase64
}: {
  resume: string
  analysis: AnalysisData
  onReset: () => void
  originalScore: number | null
  optimizeResult: OptimizeResult | null
  docxResultBase64: string | null
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

      {/* Before/After score */}
      {originalScore !== null && (
        <div style={{
          background: 'var(--accent-light)', border: '1px solid #b7dfc9',
          borderRadius: 12, padding: '16px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 2 }}>Before</p>
            <p className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink-muted)' }}>{originalScore}%</p>
          </div>
          <div style={{ fontSize: 22, color: 'var(--accent)', fontWeight: 700 }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 2 }}>Projected after submit</p>
            <p className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>
              ~{Math.min(99, originalScore + Math.min(18, analysis.missingSkills.length * 3))}%
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{
              background: 'var(--accent)', color: '#fff',
              borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 700
            }}>
              +{Math.min(18, analysis.missingSkills.length * 3)} pts est.
            </div>
            <p style={{ fontSize: 10, color: 'var(--ink-muted)' }}>Re-submit to ATS for exact score</p>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'ATS Score', value: `${optimizeResult?.atsMatchScore ?? analysis.matchScore}%` },
          { label: 'Keywords Added', value: `${optimizeResult?.keywordsAdded.length ?? 0}` },
          { label: 'Bullets Fixed', value: `${optimizeResult?.weakBulletsFixed ?? 0}` },
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

      {/* Keywords added + sections modified */}
      {optimizeResult && (optimizeResult.keywordsAdded.length > 0 || optimizeResult.sectionsModified.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {optimizeResult.keywordsAdded.length > 0 && (
            <div className="card">
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Keywords Injected
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {optimizeResult.keywordsAdded.map(k => (
                  <span key={k} className="tag-match" style={{ fontSize: 11 }}>{k}</span>
                ))}
              </div>
            </div>
          )}
          {optimizeResult.sectionsModified.length > 0 && (
            <div className="card">
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sections Modified
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {optimizeResult.sectionsModified.map(s => (
                  <span key={s} style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 20,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    color: 'var(--ink)', fontWeight: 500
                  }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DOCX preserved download — shown prominently when DOCX was uploaded */}
      {docxResultBase64 && (
        <div style={{
          background: 'var(--accent-light)', border: '2px solid var(--accent)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <span style={{ fontSize: 28 }}>📄</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>Your original format is preserved</p>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>Same layout, fonts, and structure — only content was improved</p>
          </div>
          <button
            onClick={() => {
              const bytes = Uint8Array.from(atob(docxResultBase64), c => c.charCodeAt(0))
              const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'optimized-resume.docx'; a.click()
              URL.revokeObjectURL(url)
            }}
            style={{
              padding: '10px 20px', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            ⬇ Download .docx
          </button>
        </div>
      )}

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

      {/* Resume output — only shown for non-DOCX (plain text) results */}
      {!docxResultBase64 && <div className="card">
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
      </div>}

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
