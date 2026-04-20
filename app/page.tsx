'use client'
import { useState } from 'react'
import UploadSection from '@/components/UploadSection'
import AnalysisResult from '@/components/AnalysisResult'
import OptimizedResume from '@/components/OptimizedResume'
import Header from '@/components/Header'

export type AtsKeywords = {
  hardSkills: string[]
  softSkills: string[]
  certifications: string[]
  industryTerms: string[]
}

export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'executive'

export type ScoreBreakdown = {
  keywordMatch: number
  skillsMatch: number
  experienceRelevance: number
  formatting: number
  actionVerbs: number
}

export type AnalysisData = {
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  experienceGaps: string[]
  strengths: string[]
  recommendations: string[]
  summary: string
  atsKeywords: AtsKeywords
  experienceYears: number
  seniorityLevel: SeniorityLevel
  suggestedPages: 1 | 2
  scoreBreakdown: ScoreBreakdown
}

export type Stage = 'upload' | 'analyzing' | 'results' | 'optimizing' | 'optimized'

export default function Home() {
  const [stage, setStage] = useState<Stage>('upload')
  const [cvText, setCvText] = useState('')
  const [jdText, setJdText] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [optimizedResume, setOptimizedResume] = useState('')
  const [error, setError] = useState('')
  const [pageBudget, setPageBudget] = useState<1 | 2>(1)
  const [originalScore, setOriginalScore] = useState<number | null>(null)

  const handleAnalyze = async (cv: string, jd: string) => {
    setCvText(cv)
    setJdText(jd)
    setStage('analyzing')
    setError('')

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText: cv, jdText: jd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setAnalysis(data)
      setOriginalScore(data.matchScore)
      setPageBudget(data.suggestedPages ?? 1)
      setStage('results')
    } catch (e: any) {
      setError(e.message)
      setStage('upload')
    }
  }

  const handleOptimize = async () => {
    setStage('optimizing')
    setError('')
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jdText, analysis, pageBudget }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Optimization failed')
      setOptimizedResume(data.optimizedResume)
      setStage('optimized')
    } catch (e: any) {
      setError(e.message)
      setStage('results')
    }
  }

  const handleReset = () => {
    setStage('upload')
    setCvText('')
    setJdText('')
    setAnalysis(null)
    setOptimizedResume('')
    setError('')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Header onReset={stage !== 'upload' ? handleReset : undefined} />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>
        {error && (
          <div className="fade-up" style={{
            background: 'var(--danger-light)', border: '1px solid #f5c6c0',
            borderRadius: 10, padding: '12px 16px', marginBottom: 24,
            color: 'var(--danger)', fontSize: 14
          }}>
            ⚠ {error}
          </div>
        )}

        {stage === 'upload' && (
          <UploadSection onAnalyze={handleAnalyze} />
        )}

        {stage === 'analyzing' && (
          <AnalyzingState />
        )}

        {(stage === 'results' || stage === 'optimizing') && analysis && (
          <AnalysisResult
            analysis={analysis}
            onOptimize={handleOptimize}
            onReset={handleReset}
            isOptimizing={stage === 'optimizing'}
            pageBudget={pageBudget}
            onPageBudgetChange={setPageBudget}
          />
        )}

        {stage === 'optimized' && analysis && (
          <OptimizedResume
            resume={optimizedResume}
            analysis={analysis}
            onReset={handleReset}
            pageBudget={pageBudget}
            originalScore={originalScore}
          />
        )}
      </main>
    </div>
  )
}

function AnalyzingState() {
  return (
    <div className="fade-up" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--accent-light)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px', fontSize: 28
      }}>
        🔍
      </div>
      <p className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        Analyzing your resume
        <span className="dot" style={{ display: 'inline-block', marginLeft: 2 }}>.</span>
        <span className="dot" style={{ display: 'inline-block' }}>.</span>
        <span className="dot" style={{ display: 'inline-block' }}>.</span>
      </p>
      <p style={{ color: 'var(--ink-muted)', fontSize: 15 }}>
        Comparing skills, keywords, and experience gaps
      </p>
      <div style={{
        marginTop: 32, display: 'flex', flexDirection: 'column', gap: 8,
        maxWidth: 320, margin: '32px auto 0'
      }}>
        {['Parsing your CV...', 'Reading the job description...', 'Running gap analysis...'].map((msg, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', background: 'var(--surface)',
            borderRadius: 8, border: '1px solid var(--border)',
            fontSize: 13, color: 'var(--ink-muted)',
            animationDelay: `${i * 0.5}s`,
            opacity: 0, animation: `fadeUp 0.4s ease ${i * 0.5}s forwards`
          }}>
            <span style={{ color: 'var(--accent)' }}>✓</span> {msg}
          </div>
        ))}
      </div>
    </div>
  )
}
