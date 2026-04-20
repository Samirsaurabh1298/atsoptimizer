import { NextRequest, NextResponse } from 'next/server'
import { groqChat, safeErrorMessage } from '@/lib/groq'
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
    const { cvText, jdText, analysis, pageBudget } = body
    const pages: 1 | 2 = pageBudget === 2 ? 2 : 1

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
    const recommendations = Array.isArray(analysis?.recommendations)
      ? analysis.recommendations.slice(0, 5).join('\n- ')
      : ''

    const pageRule = pages === 1
      ? 'PAGE LIMIT: ONE page only. Max 550 words. Keep only the last 5 years of experience in detail. Max 3 bullet points per role. Drop older or irrelevant roles entirely. Be ruthlessly concise — no filler sentences.'
      : 'PAGE LIMIT: TWO pages max. Max 900 words. Include all relevant experience with 3–5 bullet points per role. Be comprehensive but avoid padding.'

    const prompt = `You are an expert ATS resume optimizer and professional resume writer. Rewrite the resume below to maximize ATS match score for the target job.

${pageRule}

Missing skills to incorporate: ${missingSkills}

ORIGINAL RESUME:
${cvText.slice(0, 4000)}

TARGET JOB DESCRIPTION:
${jdText.slice(0, 2000)}

Rewriting rules:
1. EXPERIENCE SECTION (most important): For each missing skill, weave it naturally into existing job bullet points as if the candidate used it in that role. For example, if "Docker" is missing and the candidate worked as a backend engineer, add a bullet like "- Containerized microservices using Docker, reducing deployment time by 30%". Match the skill to the most relevant job role. Do NOT create fake job roles — only enhance existing bullet points.
2. SKILLS SECTION: List all matched + missing skills together in a clean comma-separated or categorized format.
3. PROFESSIONAL SUMMARY: Write 3-4 sentences naturally using the top JD keywords and the candidate's real background.
4. Keep all original facts (company names, dates, education, contact) unchanged.
5. Use strong action verbs (Led, Built, Optimized, Designed, Delivered, etc.) and quantify achievements where possible.
6. Follow these recommendations:
- ${recommendations}

Write the complete optimized resume in plain text format using these section headers:
CONTACT INFORMATION
PROFESSIONAL SUMMARY
SKILLS
EXPERIENCE
EDUCATION
CERTIFICATIONS (if applicable)

Rules:
- Plain text only, no markdown, no special characters — dashes (-) for bullet points only
- Output ONLY the resume text, starting with the candidate's name`

    const optimizedResume = await groqChat([{ role: 'user', content: prompt }], { max_tokens: 3000 })

    if (!optimizedResume || optimizedResume.trim().length < 100) {
      throw new Error('Unexpected response format. Please try again.')
    }

    return NextResponse.json({ optimizedResume })
  } catch (e: any) {
    console.error('Optimize error:', e)
    return NextResponse.json(
      { error: safeErrorMessage(e, 'Optimization failed. Please try again.') },
      { status: 500 }
    )
  }
}
