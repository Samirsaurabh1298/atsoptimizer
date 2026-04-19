import { NextRequest, NextResponse } from 'next/server'
import { groqChat, safeErrorMessage, parseGroqJson } from '@/lib/groq'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const MAX_TEXT_LEN = 20_000

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed, retryAfter } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const body = await req.json()
    const { cvText, jdText } = body

    if (typeof cvText !== 'string' || typeof jdText !== 'string') {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
    }
    if (cvText.trim().length < 50) {
      return NextResponse.json({ error: 'Resume text is too short.' }, { status: 400 })
    }
    if (jdText.trim().length < 20) {
      return NextResponse.json({ error: 'Job description is too short.' }, { status: 400 })
    }
    if (cvText.length > MAX_TEXT_LEN || jdText.length > MAX_TEXT_LEN) {
      return NextResponse.json({ error: 'Input text is too large.' }, { status: 413 })
    }

    const prompt = `You are a strict ATS (Applicant Tracking System) scoring engine. Score the resume against the job description using this exact weighted formula:

ATS Score = (Keyword Match % × 40) + (Skills Match × 25) + (Experience Relevance × 15) + (Formatting/Parsing Score × 10) + (Action Verbs/Impact × 10)

Scoring each component (0–100 scale before weighting):
- Keyword Match %: What % of the JD's required keywords/tools appear in the resume? Count exact and close synonyms.
- Skills Match: What % of the explicitly listed required skills does the candidate have?
- Experience Relevance: How relevant is the candidate's past experience to this specific role? (years, domain, seniority)
- Formatting/Parsing Score: Is the resume clean, structured, ATS-parseable? (no tables/columns/images implied = high score)
- Action Verbs/Impact: Does the resume use strong action verbs and quantifiable achievements?

Final matchScore = sum of (component_score × weight). Be strict and accurate. Do NOT inflate scores.

RESUME:
${cvText.slice(0, 4000)}

JOB DESCRIPTION:
${jdText.slice(0, 3000)}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "matchScore": <final integer 0-100 using the formula above>,
  "matchedSkills": [<skills/keywords present in BOTH documents, max 15>],
  "missingSkills": [<important JD skills/keywords absent from resume, up to 8>],
  "experienceGaps": [<honest gaps in experience, seniority, or domain, up to 4>],
  "strengths": [<genuine strengths relevant to this role, up to 6>],
  "recommendations": [<specific actions to improve each scoring component, 4-5 items>],
  "summary": "<2-3 sentence honest assessment covering fit, key gaps, and what would most improve the score>"
}`

    const content = await groqChat([{ role: 'user', content: prompt }], { max_tokens: 1500 })
    const parsed = parseGroqJson(content)

    // Schema validation
    if (typeof parsed.matchScore !== 'number' ||
        !Array.isArray(parsed.matchedSkills) ||
        !Array.isArray(parsed.missingSkills)) {
      throw new Error('Unexpected response format. Please try again.')
    }

    parsed.matchScore = Math.min(100, Math.max(0, Math.round(parsed.matchScore)))

    return NextResponse.json(parsed)
  } catch (e: any) {
    console.error('Analyze error:', e)
    return NextResponse.json(
      { error: safeErrorMessage(e, 'Analysis failed. Please try again.') },
      { status: 500 }
    )
  }
}
