import { NextRequest, NextResponse } from 'next/server'
import { groqChat, safeErrorMessage, parseGroqJson } from '@/lib/groq'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { cacheGet, cacheSet, hashKey } from '@/lib/cache'

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

    const cacheKey = hashKey(cvText.slice(0, 4000), jdText.slice(0, 3000))
    const cached = await cacheGet(cacheKey)
    if (cached) return NextResponse.json(cached)

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
  "summary": "<2-3 sentence honest assessment covering fit, key gaps, and what would most improve the score>",
  "atsKeywords": {
    "hardSkills": [<tools, technologies, software, programming languages from JD, up to 12>],
    "softSkills": [<interpersonal and behavioral skills from JD, up to 6>],
    "certifications": [<certifications, licenses, degrees explicitly mentioned in JD, up to 5>],
    "industryTerms": [<domain-specific jargon, methodologies, frameworks from JD, up to 8>]
  },
  "experienceYears": <total years of professional experience parsed from the resume, integer>,
  "seniorityLevel": <"junior" if 0-3 yrs, "mid" if 3-10 yrs, "senior" if 10-20 yrs, "executive" if 20+ yrs or C-suite/VP title>,
  "scoreBreakdown": {
    "keywordMatch": <0-100, % of JD keywords found in resume>,
    "skillsMatch": <0-100, % of required JD skills the candidate has>,
    "experienceRelevance": <0-100, how relevant past experience is to this role>,
    "formatting": <0-100, ATS-parseability and structure quality>,
    "actionVerbs": <0-100, strength of action verbs and quantified achievements>
  }
}`

    const content = await groqChat([{ role: 'user', content: prompt }], { max_tokens: 1500 })
    const parsed = parseGroqJson(content)

    // Schema validation
    if (typeof parsed.matchScore !== 'number' ||
        !Array.isArray(parsed.matchedSkills) ||
        !Array.isArray(parsed.missingSkills)) {
      throw new Error('Unexpected response format. Please try again.')
    }
    if (!parsed.atsKeywords || typeof parsed.atsKeywords !== 'object') {
      parsed.atsKeywords = { hardSkills: [], softSkills: [], certifications: [], industryTerms: [] }
    }
    if (typeof parsed.experienceYears !== 'number') parsed.experienceYears = 0
    if (!parsed.seniorityLevel) parsed.seniorityLevel = 'mid'
    const yrs: number = parsed.experienceYears
    const level: string = parsed.seniorityLevel
    parsed.suggestedPages = (yrs >= 10 || level === 'executive') ? 2 : 1

    // Recompute score from components — never trust AI's own matchScore
    const bd = parsed.scoreBreakdown
    if (bd && typeof bd.keywordMatch === 'number') {
      parsed.matchScore = Math.min(100, Math.max(0, Math.round(
        bd.keywordMatch * 0.40 +
        bd.skillsMatch * 0.25 +
        bd.experienceRelevance * 0.15 +
        bd.formatting * 0.10 +
        bd.actionVerbs * 0.10
      )))
    } else {
      parsed.matchScore = Math.min(100, Math.max(0, Math.round(parsed.matchScore)))
    }

    await cacheSet(cacheKey, parsed)
    return NextResponse.json(parsed)
  } catch (e: any) {
    console.error('Analyze error:', e)
    return NextResponse.json(
      { error: safeErrorMessage(e, 'Analysis failed. Please try again.') },
      { status: 500 }
    )
  }
}
