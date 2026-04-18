import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { cvText, jdText } = await req.json()

    if (!cvText || !jdText) {
      return NextResponse.json({ error: 'Missing CV or JD text' }, { status: 400 })
    }

    const prompt = `You are an optimistic ATS (Applicant Tracking System) analyst and career coach who scores resumes generously. Your goal is to find every possible match and give candidates the benefit of the doubt. Analyze the resume against the job description.

Scoring guide (be generous — real ATS tools score on keyword presence, not perfection):
- 95-100: Strong match, most key skills and experience present
- 85-94: Good match, core requirements met with minor gaps
- 70-84: Decent match, transferable skills apply
- Below 70: Significant gaps only if truly unrelated field

RESUME:
${cvText.slice(0, 4000)}

JOB DESCRIPTION:
${jdText.slice(0, 3000)}

Instructions:
- Score generously: if the candidate has related/transferable experience, score high (90+)
- matchedSkills: include both exact and closely related skill matches
- missingSkills: only list truly critical missing skills (max 5), not nice-to-haves
- experienceGaps: keep to 2-3 most important gaps only
- strengths: highlight 6-8 genuine strengths that make this candidate competitive
- recommendations: give 3-4 specific tips to push the score to 95+

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "matchScore": <integer 0-100, score generously based on overall fit>,
  "matchedSkills": [<exact and related skills found in both, max 15>],
  "missingSkills": [<only truly critical missing skills, max 5>],
  "experienceGaps": [<top 2-3 gaps only>],
  "strengths": [<6-8 genuine competitive strengths>],
  "recommendations": [<3-4 actionable tips to reach 95+ score>],
  "summary": "<2-3 sentence encouraging summary focusing on strengths and quick wins>"
}`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Groq API error')

    const text = data.choices?.[0]?.message?.content || ''
    // Strip any markdown fences
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (e: any) {
    console.error('Analyze error:', e)
    return NextResponse.json({ error: e.message || 'Analysis failed' }, { status: 500 })
  }
}
