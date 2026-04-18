'use client'
import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

async function extractText(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    return await file.text()
  }
  // For PDF/DOCX, send to extraction API
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/extract', { method: 'POST', body: formData })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to extract text')
  return data.text
}

function FileDropZone({
  label, icon, accept, value, onChange, hint
}: {
  label: string, icon: React.ReactNode, accept: Record<string, string[]>,
  value: { name: string; text: string } | null,
  onChange: (val: { name: string; text: string } | null) => void,
  hint: string
}) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted[0]) return
    setLoading(true)
    setErr('')
    try {
      const text = await extractText(accepted[0])
      onChange({ name: accepted[0].name, text })
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept, maxFiles: 1, maxSize: 10 * 1024 * 1024
  })

  const filled = !!value

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--ink)' }}>{label}</p>
      <div
        {...getRootProps()}
        className={`drop-zone ${isDragActive ? 'active' : ''} ${filled ? 'filled' : ''}`}
        style={{ padding: '28px 20px', textAlign: 'center', minHeight: 140 }}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div style={{ color: 'var(--ink-muted)', fontSize: 14, textAlign: 'center' }}>
            <div className="spinner" />
            Extracting text...
          </div>
        ) : filled ? (
          <div>
            <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>✅</span>
            <p style={{ fontWeight: 500, fontSize: 14, color: 'var(--accent)' }}>{value!.name}</p>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
              {value!.text.length.toLocaleString()} chars extracted
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); onChange(null) }}
              style={{
                marginTop: 10, fontSize: 12, color: 'var(--danger)',
                background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline'
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>{icon}</span>
            <p style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>
              {isDragActive ? 'Drop it here!' : 'Drop file or click to browse'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>{hint}</p>
          </div>
        )}
        {err && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{err}</p>}
      </div>
    </div>
  )
}

export default function UploadSection({ onAnalyze }: { onAnalyze: (cv: string, jd: string) => void }) {
  const [cv, setCv] = useState<{ name: string; text: string } | null>(null)
  const [jd, setJd] = useState<{ name: string; text: string } | null>(null)
  const [jdText, setJdText] = useState('')
  const [useText, setUseText] = useState(false)

  const canAnalyze = cv && (jd || (useText && jdText.trim().length > 50))

  const handleAnalyze = () => {
    if (!cv) return
    const jobDesc = useText ? jdText : jd?.text || ''
    onAnalyze(cv.text, jobDesc)
  }

  return (
    <div className="fade-up">
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--accent-light)', border: '1px solid #b7dfc9',
          borderRadius: 20, padding: '4px 14px', marginBottom: 20, fontSize: 12,
          color: 'var(--accent-mid)', fontWeight: 500
        }}>
          ✦ AI-Powered · Free to use
        </div>
        <h1 className="font-display" style={{
          fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800,
          lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 16,
          color: 'var(--ink)'
        }}>
          Beat the ATS.<br />
          <span style={{ color: 'var(--accent)' }}>Land the interview.</span>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink-muted)', maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>
          Upload your resume and the job description. Get an instant gap analysis and an AI-optimized, ATS-friendly resume in seconds.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, marginBottom: 36
      }}>
        {[
          { num: '75%', label: 'resumes rejected by ATS' },
          { num: '3×', label: 'more interviews with keywords' },
          { num: '30s', label: 'to analyze & optimize' },
        ].map(({ num, label }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px 12px', textAlign: 'center'
          }}>
            <p className="font-display" style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{num}</p>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Upload cards */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="font-display" style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
          Step 1 — Upload your documents
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FileDropZone
            label="Your Resume / CV"
            icon={<img src="/images/cv.png" alt="CV" style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }} />}
            accept={{ 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] }}
            value={cv}
            onChange={setCv}
            hint="PDF, DOCX, or TXT · Max 10MB"
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Job Description</p>
              <button
                onClick={() => setUseText(!useText)}
                style={{
                  fontSize: 12, color: 'var(--accent)', background: 'none',
                  border: 'none', cursor: 'pointer', textDecoration: 'underline'
                }}
              >
                {useText ? 'Upload file instead' : 'Paste text instead'}
              </button>
            </div>
            {useText ? (
              <textarea
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                placeholder="Paste the full job description here..."
                style={{
                  width: '100%', minHeight: 140, padding: '12px',
                  border: '1.5px solid var(--border-strong)', borderRadius: 12,
                  fontSize: 13, color: 'var(--ink)', background: 'var(--surface)',
                  fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none',
                  lineHeight: 1.6
                }}
              />
            ) : (
              <FileDropZone
                label=""
                icon="📋"
                accept={{ 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] }}
                value={jd}
                onChange={setJd}
                hint="PDF or TXT · Max 10MB"
              />
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!canAnalyze}
        style={{
          width: '100%', padding: '16px',
          background: canAnalyze ? 'var(--accent)' : 'var(--border)',
          color: canAnalyze ? '#fff' : 'var(--ink-muted)',
          border: 'none', borderRadius: 12, fontSize: 16,
          fontWeight: 600, cursor: canAnalyze ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-display)', letterSpacing: '-0.2px',
          transition: 'all 0.2s ease'
        }}
      >
        {canAnalyze ? '✦ Analyze My Resume →' : 'Upload both files to continue'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-faint)', marginTop: 12 }}>
        Your files are processed securely and never stored permanently.
      </p>
    </div>
  )
}
