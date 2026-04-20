'use client'
import { AnalysisData } from '@/app/page'

function ScoreRing({ score }: { score: number }) {
  const size = 140
  const r = 54
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? '#1a472a' : score >= 50 ? '#d97706' : '#c0392b'

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ}
          style={{
            animation: `dash 1.2s ease-out 0.3s forwards`,
            '--target-offset': offset
          } as any}
        />
      </svg>
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: ${offset}; }
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color }}>
          {score}%
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>match</span>
      </div>
    </div>
  )
}

function TagList({ items, type }: { items: string[], type: 'missing' | 'match' | 'warn' }) {
  if (!items.length) return <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>None found</p>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map(item => (
        <span key={item} className={`tag-${type}`}>{item}</span>
      ))}
    </div>
  )
}

export default function AnalysisResult({
  analysis, onOptimize, onReset, isOptimizing, pageBudget, onPageBudgetChange
}: {
  analysis: AnalysisData
  onOptimize: () => void
  onReset: () => void
  isOptimizing: boolean
  pageBudget: 1 | 2
  onPageBudgetChange: (v: 1 | 2) => void
}) {
  const { matchScore, matchedSkills, missingSkills, experienceGaps, strengths, recommendations, summary, atsKeywords, experienceYears, seniorityLevel, suggestedPages } = analysis

  const scoreLabel = matchScore >= 70 ? '🟢 Strong match' : matchScore >= 50 ? '🟡 Moderate match' : '🔴 Needs work'

  const seniorityLabel: Record<string, string> = {
    junior: 'Junior (0–3 yrs)',
    mid: 'Mid-level (3–10 yrs)',
    senior: 'Senior (10+ yrs)',
    executive: 'Executive',
  }

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 28 }}>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Analysis complete
        </h2>
        <p style={{ color: 'var(--ink-muted)', fontSize: 15, marginTop: 4 }}>
          Here's how your resume matches this job description
        </p>
      </div>

      {/* Score + summary */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <ScoreRing score={matchScore} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 4 }}>Overall ATS Match Score</p>
          <p className="font-display" style={{ fontSize: 19, fontWeight: 700, marginBottom: 10 }}>
            {scoreLabel}
          </p>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7 }}>{summary}</p>
        </div>
      </div>

      {/* Score breakdown bars */}
      {analysis.scoreBreakdown && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Score Breakdown</p>
          {([
            { label: 'Keyword Match', key: 'keywordMatch', weight: '40%' },
            { label: 'Skills Match', key: 'skillsMatch', weight: '25%' },
            { label: 'Experience Relevance', key: 'experienceRelevance', weight: '15%' },
            { label: 'Formatting', key: 'formatting', weight: '10%' },
            { label: 'Action Verbs & Impact', key: 'actionVerbs', weight: '10%' },
          ] as const).map(({ label, key, weight }) => {
            const val: number = analysis.scoreBreakdown[key] ?? 0
            const color = val >= 70 ? 'var(--accent)' : val >= 50 ? '#d97706' : '#c0392b'
            return (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{label} <span style={{ opacity: 0.5 }}>({weight})</span></span>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{val}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: 'var(--border)' }}>
                  <div style={{ height: 6, borderRadius: 4, background: color, width: `${val}%`, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Grid: missing + matched */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--danger)', fontSize: 16 }}>✕</span> Missing Skills
            <span style={{
              marginLeft: 'auto', fontSize: 12, background: 'var(--danger-light)',
              color: 'var(--danger)', borderRadius: 12, padding: '1px 8px'
            }}>{missingSkills.length}</span>
          </p>
          <TagList items={missingSkills} type="missing" />
        </div>
        <div className="card">
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--accent)', fontSize: 16 }}>✓</span> Matched Skills
            <span style={{
              marginLeft: 'auto', fontSize: 12, background: 'var(--accent-light)',
              color: 'var(--accent)', borderRadius: 12, padding: '1px 8px'
            }}>{matchedSkills.length}</span>
          </p>
          <TagList items={matchedSkills} type="match" />
        </div>
      </div>

      {/* ATS Keywords */}
      {atsKeywords && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>🔑 ATS Keywords from Job Description</p>
          {[
            { label: 'Hard Skills', items: atsKeywords.hardSkills, color: '#1a472a', bg: 'var(--accent-light)' },
            { label: 'Soft Skills', items: atsKeywords.softSkills, color: '#1e40af', bg: '#dbeafe' },
            { label: 'Certifications', items: atsKeywords.certifications, color: '#92400e', bg: '#fef3c7' },
            { label: 'Industry Terms', items: atsKeywords.industryTerms, color: '#5b21b6', bg: '#ede9fe' },
          ].filter(cat => cat.items?.length > 0).map(cat => (
            <div key={cat.label} style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {cat.label}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {cat.items.map(item => (
                  <span key={item} style={{
                    fontSize: 12, padding: '3px 10px', borderRadius: 20,
                    background: cat.bg, color: cat.color, fontWeight: 500,
                    border: `1px solid ${cat.color}30`
                  }}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>⭐ Your Strengths</p>
          <TagList items={strengths} type="match" />
        </div>
      )}

      {/* Experience gaps */}
      {experienceGaps.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
            <span style={{ color: 'var(--warn)' }}>△</span> Experience Gaps
          </p>
          <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {experienceGaps.map(g => (
              <li key={g} style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.6 }}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card" style={{ marginBottom: 24, background: 'var(--accent-light)', borderColor: '#b7dfc9' }}>
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: 'var(--accent)' }}>
            💡 Recommendations
          </p>
          <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recommendations.map((r, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--accent-mid)', lineHeight: 1.6 }}>{r}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Page Budget */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>📄 Resume Page Length</p>
        <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 12 }}>
          Auto-detected: <strong style={{ color: 'var(--ink)' }}>{experienceYears} yrs</strong> · {seniorityLabel[seniorityLevel] ?? seniorityLevel}
          {suggestedPages === pageBudget && (
            <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 10, padding: '1px 7px' }}>recommended</span>
          )}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {([1, 2] as const).map(p => (
            <button
              key={p}
              onClick={() => onPageBudgetChange(p)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                border: pageBudget === p ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: pageBudget === p ? 'var(--accent-light)' : 'var(--surface)',
                color: pageBudget === p ? 'var(--accent)' : 'var(--ink-muted)',
              }}
            >
              {p === 1 ? '1 Page' : '2 Pages'}
              <span style={{ display: 'block', fontSize: 10, fontWeight: 400, marginTop: 2, opacity: 0.8 }}>
                {p === 1 ? '0–10 yrs · concise' : '10+ yrs · comprehensive'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onOptimize}
        disabled={isOptimizing}
        style={{
          width: '100%', padding: '16px',
          background: isOptimizing ? 'var(--border)' : 'var(--accent)',
          color: isOptimizing ? 'var(--ink-muted)' : '#fff',
          border: 'none', borderRadius: 12, fontSize: 16,
          fontWeight: 700, cursor: isOptimizing ? 'wait' : 'pointer',
          fontFamily: 'var(--font-display)', letterSpacing: '-0.2px',
          transition: 'all 0.2s ease', marginBottom: 10
        }}
      >
        {isOptimizing ? (
          <>
            ⏳ Generating optimized resume
            <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
          </>
        ) : '✦ Generate Optimized Resume →'}
      </button>
    </div>
  )
}
