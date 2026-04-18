import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { cvText, jdText, analysis } = await req.json()

    if (!cvText || !jdText) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    const missingSkills = analysis?.missingSkills?.join(', ') || ''
    const recommendations = analysis?.recommendations?.join('\n- ') || ''

    const prompt = `You are an expert ATS resume optimizer and professional resume writer. Your job is to rewrite the following resume to:
1. Naturally incorporate these missing keywords from the job description: ${missingSkills}
2. Use ATS-friendly formatting (no tables, no columns, standard section headings)
3. Keep all original experience and facts — do NOT fabricate anything
4. Use strong action verbs and quantify achievements where possible
5. Follow these specific recommendations: 
- ${recommendations}

ORIGINAL RESUME:
${cvText.slice(0, 4000)}

TARGET JOB DESCRIPTION:
${jdText.slice(0, 2000)}

Write the complete optimized resume in plain text format. Use these standard section headers:
CONTACT INFORMATION
PROFESSIONAL SUMMARY
SKILLS
EXPERIENCE
EDUCATION
CERTIFICATIONS (if applicable)

Rules:
- Plain text only, no markdown, no bullet symbols other than simple dashes (-)  
- Keep the candidate's real information — enhance and expand, never fabricate
- Write a compelling professional summary that incorporates key JD keywords
- In the Skills section, naturally include the missing skills IF they are plausible based on the candidate's background
- Enhance bullet points with stronger language and JD keywords where authentic
- Standard fonts will be applied by the user (Arial/Calibri 11pt)

Output ONLY the resume text, starting with the candidate's name.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Groq API error')

    const optimizedResume = data.choices?.[0]?.message?.content || ''
    return NextResponse.json({ optimizedResume })
  } catch (e: any) {
    console.error('Optimize error:', e)
    return NextResponse.json({ error: e.message || 'Optimization failed' }, { status: 500 })
  }
}
