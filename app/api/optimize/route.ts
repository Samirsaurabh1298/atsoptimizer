import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { cvText, jdText, analysis } = await req.json()

    if (!cvText || !jdText) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    const missingSkills = analysis?.missingSkills?.join(', ') || ''
    const recommendations = analysis?.recommendations?.join('\n- ') || ''

    const prompt = `You are an expert ATS resume optimizer and professional resume writer. Rewrite the resume so it scores 95%+ against the job description.

MISSING SKILLS TO INCORPORATE: ${missingSkills}
RECOMMENDATIONS:
- ${recommendations}

ORIGINAL RESUME:
${cvText.slice(0, 4000)}

TARGET JOB DESCRIPTION:
${jdText.slice(0, 2000)}

CRITICAL RULES:
1. Missing skills must appear INSIDE experience and project bullet points — NOT just listed in Skills section
   - Example: if "Agile" is missing, add it to a relevant job bullet: "Led Agile sprint planning for a team of 8..."
   - Example: if "Power BI" is missing, add it to a project: "Built Power BI dashboards to visualize sales data..."
2. Every missing skill must be woven naturally into at least one real experience or project description
3. Keep all original facts — enhance language, never fabricate new roles or companies
4. Use strong action verbs: Led, Architected, Delivered, Optimized, Automated, Streamlined
5. Quantify achievements wherever possible (%, $, team size, time saved)
6. ATS-friendly plain text only — no tables, no columns, dashes (-) for bullets

SECTION HEADERS (use exactly):
CONTACT INFORMATION
PROFESSIONAL SUMMARY
SKILLS
EXPERIENCE
PROJECTS (if any)
EDUCATION
CERTIFICATIONS (if applicable)

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
