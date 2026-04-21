import { NextRequest, NextResponse } from 'next/server'
import { groqChat, safeErrorMessage, parseGroqJson } from '@/lib/groq'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export const maxDuration = 60

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
    const { cvText, jdText, analysis } = body

    if (typeof cvText !== 'string' || typeof jdText !== 'string') {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
    }
    if (cvText.trim().length < 50 || jdText.trim().length < 20) {
      return NextResponse.json({ error: 'Input text is too short.' }, { status: 400 })
    }
    if (cvText.length > MAX_TEXT_LEN || jdText.length > MAX_TEXT_LEN) {
      return NextResponse.json({ error: 'Input text is too large.' }, { status: 413 })
    }

    const missingSkills = Array.isArray(analysis?.missingSkills)
      ? analysis.missingSkills.slice(0, 10).join(', ')
      : ''

    const prompt = `You are a resume optimization engine — a "diff editor", NOT a writer.

Your task is to MODIFY the existing resume to better match the job description.
DO NOT rewrite from scratch. Minimize changes. Maximize ATS relevance.

STRICT RULES:
- Preserve EXACT section order, headings, bullet style, and formatting
- Do NOT add or remove sections
- Do NOT change company names, dates, education, or contact info
- ONLY edit bullet point content and skills list
- Think like a diff editor — change as little as possible

ALLOWED CHANGES:
- Inject JD keywords naturally into existing bullet points
- Add missing skills (${missingSkills}) into the skills section
- Rewrite weak bullets using strong action verbs + quantified impact
- Remove filler words ("responsible for", "helped with", "worked on")
- Replace passive language with active achievements

ORIGINAL RESUME:
${cvText.slice(0, 4000)}

JOB DESCRIPTION:
${jdText.slice(0, 2000)}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "optimizedResume": "<the full modified resume as plain text, preserving all original formatting and structure>",
  "atsMatchScore": <estimated ATS match score 0-100 after optimization>,
  "keywordsAdded": [<list of JD keywords injected into the resume, max 12>],
  "sectionsModified": [<list of section names that were changed, e.g. "EXPERIENCE", "SKILLS">],
  "weakBulletsFixed": <count of bullet points improved>
}`

    const content = await groqChat([{ role: 'user', content: prompt }], {
      max_tokens: 2500,
      temperature: 0.2,
      model: 'llama-3.1-8b-instant',
    })

    const parsed = parseGroqJson(content)

    if (typeof parsed.optimizedResume !== 'string' || parsed.optimizedResume.trim().length < 100) {
      throw new Error('Unexpected response format. Please try again.')
    }

    parsed.atsMatchScore = Math.min(100, Math.max(0, Math.round(parsed.atsMatchScore ?? 0)))
    if (!Array.isArray(parsed.keywordsAdded)) parsed.keywordsAdded = []
    if (!Array.isArray(parsed.sectionsModified)) parsed.sectionsModified = []
    if (typeof parsed.weakBulletsFixed !== 'number') parsed.weakBulletsFixed = 0

    return NextResponse.json(parsed)
  } catch (e: any) {
    console.error('Optimize error:', e)
    return NextResponse.json(
      { error: safeErrorMessage(e, 'Optimization failed. Please try again.') },
      { status: 500 }
    )
  }
}
