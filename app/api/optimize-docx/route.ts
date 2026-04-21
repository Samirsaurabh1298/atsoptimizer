import { NextRequest, NextResponse } from 'next/server'
import { groqChat, safeErrorMessage, parseGroqJson } from '@/lib/groq'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { parseDocxParagraphs, applyDocxModifications } from '@/lib/docxPreserver'

export const maxDuration = 60

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
    const { docxBase64, jdText, analysis } = body

    if (typeof docxBase64 !== 'string' || typeof jdText !== 'string') {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
    }

    const buffer = Buffer.from(docxBase64, 'base64')
    const paragraphs = await parseDocxParagraphs(buffer)

    const missingSkills = Array.isArray(analysis?.missingSkills)
      ? analysis.missingSkills.slice(0, 10).join(', ')
      : ''

    // Send only non-empty paragraphs to save tokens
    const relevant = paragraphs.filter(p => !p.isEmpty && p.text.trim().length > 5)
    const paraList = relevant.map(p =>
      `[${p.index}] ${p.isBullet ? '(bullet) ' : ''}${p.text}`
    ).join('\n')

    const prompt = `You are a resume diff editor. Your ONLY job is to improve specific lines of this resume to better match the job description. You must NOT change structure, section order, or formatting — only improve text content.

MISSING SKILLS TO ADD: ${missingSkills}

RESUME PARAGRAPHS (index: text):
${paraList.slice(0, 6000)}

JOB DESCRIPTION:
${jdText.slice(0, 2000)}

RULES:
- Only modify bullet points and summary/skills text — never modify names, dates, company names, contact info, section headers
- Replace weak verbs ("responsible for", "worked on", "helped") with strong action verbs
- Inject missing skills naturally where contextually relevant
- Quantify achievements where original already has numbers (enhance, don't invent)
- Change as few paragraphs as possible — only what genuinely improves ATS match

Return ONLY valid JSON (no markdown):
{
  "modifications": [{ "index": <paragraph index number>, "newText": "<improved text>" }],
  "keywordsAdded": [<keywords injected, max 12>],
  "sectionsModified": [<section names changed>],
  "weakBulletsFixed": <count>,
  "atsMatchScore": <estimated score 0-100 after changes>
}`

    const content = await groqChat([{ role: 'user', content: prompt }], {
      max_tokens: 2000,
      temperature: 0.1,
    })

    const parsed = parseGroqJson(content)

    if (!Array.isArray(parsed.modifications)) {
      throw new Error('Unexpected response format. Please try again.')
    }

    const patchedBuffer = await applyDocxModifications(buffer, parsed.modifications)
    const patchedBase64 = patchedBuffer.toString('base64')

    return NextResponse.json({
      docxBase64: patchedBase64,
      keywordsAdded: parsed.keywordsAdded ?? [],
      sectionsModified: parsed.sectionsModified ?? [],
      weakBulletsFixed: parsed.weakBulletsFixed ?? 0,
      atsMatchScore: Math.min(100, Math.max(0, Math.round(parsed.atsMatchScore ?? 0))),
      modificationsCount: parsed.modifications.length,
    })
  } catch (e: any) {
    console.error('Optimize-docx error:', e)
    return NextResponse.json(
      { error: safeErrorMessage(e, 'DOCX optimization failed. Please try again.') },
      { status: 500 }
    )
  }
}
