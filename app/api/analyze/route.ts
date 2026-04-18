import { NextRequest, NextResponse } from 'next/server'

const STOP_WORDS = new Set([
  'the','and','or','but','in','on','at','to','for','of','with','that','this',
  'will','have','from','they','been','were','their','about','which','would',
  'could','should','your','into','more','also','such','than','when','what',
  'team','work','able','must','good','both','need','over','well','very','some',
  'each','most','other','time','year','strong','excellent','ability','you',
  'our','are','not','all','any','can','has','its','was','new','use','how',
  'who','may','one','two','per','day','end','job','role','plus','high','help',
  'make','take','join','get','set','put','run','own','key','top','via','etc',
  'including','required','preferred','candidate','position','experience','skills',
])

const TECH_SKILLS = [
  'python','java','javascript','typescript','react','angular','vue','node','express',
  'sql','mysql','postgresql','mongodb','redis','aws','azure','gcp','docker','kubernetes',
  'git','linux','html','css','rest','api','graphql','django','flask','spring','tensorflow',
  'pytorch','machine learning','deep learning','data science','agile','scrum','devops',
  'ci/cd','jenkins','terraform','excel','power bi','tableau','powerpoint','sap','salesforce',
  'jira','confluence','figma','photoshop','android','ios','swift','kotlin','php','ruby',
  'scala','hadoop','spark','kafka','elasticsearch','microservices','blockchain','nlp',
  'computer vision','cloud','artificial intelligence','data analysis','data engineering',
]

const ACTION_VERBS = [
  'led','managed','developed','built','designed','implemented','created','launched',
  'delivered','achieved','improved','increased','reduced','optimized','automated',
  'streamlined','collaborated','coordinated','executed','established','transformed',
  'spearheaded','architected','engineered','deployed','migrated','integrated',
  'mentored','trained','negotiated','generated','drove','accelerated','scaled',
]

const SECTION_HEADERS = [
  'experience','education','skills','summary','objective','projects',
  'certifications','achievements','awards','publications','contact',
]

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9#+.\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w))
}

// Component 1: Keyword Match (40%)
function keywordMatchScore(cvText: string, jdText: string): number {
  const jdUnique = [...new Set(tokenize(jdText))]
  const cvLower = cvText.toLowerCase()
  let matched = 0
  for (const token of jdUnique) {
    if (cvLower.includes(token)) matched++
  }
  return matched / Math.max(jdUnique.length, 1)
}

// Component 2: Skills Match (25%)
function skillsMatchScore(cvText: string, jdText: string): number {
  const jdLower = jdText.toLowerCase()
  const cvLower = cvText.toLowerCase()
  const skillsInJD = TECH_SKILLS.filter(s => jdLower.includes(s))
  if (skillsInJD.length === 0) return 0.75 // no specific skills required → neutral
  const matched = skillsInJD.filter(s => cvLower.includes(s)).length
  return matched / skillsInJD.length
}

// Component 3: Experience Relevance (15%)
function experienceRelevanceScore(cvText: string, jdText: string): number {
  const cvLower = cvText.toLowerCase()
  const jdLower = jdText.toLowerCase()

  // Check for years of experience match
  const jdYearsMatch = jdLower.match(/(\d+)\+?\s*years?/)
  let yearsScore = 0.7
  if (jdYearsMatch) {
    const requiredYears = parseInt(jdYearsMatch[1])
    const cvYearsMatches = [...cvLower.matchAll(/(\d+)\+?\s*years?/g)]
    const maxCvYears = cvYearsMatches.reduce((max, m) => Math.max(max, parseInt(m[1])), 0)
    yearsScore = maxCvYears >= requiredYears ? 1.0 : maxCvYears / Math.max(requiredYears, 1)
  }

  // Check JD nouns/domain terms in CV (industry relevance)
  const jdWords = tokenize(jdText)
  const jdDomain = [...new Set(jdWords)].filter(w => w.length > 5)
  const domainMatched = jdDomain.filter(w => cvLower.includes(w)).length
  const domainScore = domainMatched / Math.max(jdDomain.length, 1)

  return (yearsScore * 0.4) + (domainScore * 0.6)
}

// Component 4: Formatting / Parsing Score (10%)
function formattingScore(cvText: string): number {
  const cvLower = cvText.toLowerCase()
  const foundSections = SECTION_HEADERS.filter(s => cvLower.includes(s)).length
  const sectionScore = Math.min(foundSections / 5, 1) // expect at least 5 sections

  // Penalise if text is very short (likely parse failure)
  const lengthScore = cvText.length > 500 ? 1.0 : cvText.length / 500

  // Penalise excessive special characters (tables, columns)
  const specialCharRatio = (cvText.match(/[|\\{}[\]<>]/g) || []).length / cvText.length
  const cleanScore = specialCharRatio < 0.01 ? 1.0 : Math.max(0, 1 - specialCharRatio * 50)

  return (sectionScore * 0.5) + (lengthScore * 0.3) + (cleanScore * 0.2)
}

// Component 5: Action Verbs / Impact (10%)
function actionVerbScore(cvText: string): number {
  const cvLower = cvText.toLowerCase()
  const found = ACTION_VERBS.filter(v => cvLower.includes(v)).length
  // Expect at least 8 action verbs for a strong resume
  return Math.min(found / 8, 1)
}

function calculateATSScore(cvText: string, jdText: string): number {
  const kw   = keywordMatchScore(cvText, jdText)       // 40%
  const sk   = skillsMatchScore(cvText, jdText)         // 25%
  const exp  = experienceRelevanceScore(cvText, jdText) // 15%
  const fmt  = formattingScore(cvText)                  // 10%
  const act  = actionVerbScore(cvText)                  // 10%

  const weighted = (kw * 0.40) + (sk * 0.25) + (exp * 0.15) + (fmt * 0.10) + (act * 0.10)
  return Math.min(Math.max(Math.round(weighted * 100), 10), 99)
}

export async function POST(req: NextRequest) {
  try {
    const { cvText, jdText } = await req.json()

    if (!cvText || !jdText) {
      return NextResponse.json({ error: 'Missing CV or JD text' }, { status: 400 })
    }

    const realScore = calculateATSScore(cvText, jdText)

    const prompt = `You are an ATS analyst. Analyze the resume against the job description.
The ATS match score has been calculated as ${realScore}% using weighted scoring:
- Keyword Match (40%), Skills Match (25%), Experience Relevance (15%), Formatting (10%), Action Verbs (10%)
Do NOT change the matchScore — always return exactly ${realScore}.

RESUME:
${cvText.slice(0, 4000)}

JOB DESCRIPTION:
${jdText.slice(0, 3000)}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "matchScore": ${realScore},
  "matchedSkills": [<skills/technologies found in both CV and JD, max 15>],
  "missingSkills": [<important skills in JD missing from CV, max 5>],
  "experienceGaps": [<top 2-3 experience gaps>],
  "strengths": [<6-8 genuine strengths relevant to this role>],
  "recommendations": [<3-4 specific actionable tips to improve the score>],
  "summary": "<2-3 sentence honest summary of the match and main gaps>"
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
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean)

    // Always enforce the real calculated score
    parsed.matchScore = realScore

    return NextResponse.json(parsed)
  } catch (e: any) {
    console.error('Analyze error:', e)
    return NextResponse.json({ error: e.message || 'Analysis failed' }, { status: 500 })
  }
}
