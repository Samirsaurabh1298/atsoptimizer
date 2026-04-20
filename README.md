# ATS Optimizer

> Upload your resume + job description. Get an instant ATS match score, gap analysis, and a fully optimized resume in seconds.

Live demo: [localhost:3001](http://localhost:3001)

---

## What it does

1. **Upload** your resume (PDF / DOCX / TXT) and a job description
2. **Analyze** — get a weighted ATS match score, matched/missing skills, score breakdown, ATS keywords by category, experience gaps, and seniority detection
3. **Optimize** — generate an ATS-friendly rewrite with keywords injected naturally into your existing bullet points
4. **Download** — PDF, Word (.docx), or LaTeX (.tex) for Overleaf

---

## Features

| Feature | Details |
|---|---|
| ATS Match Score | Weighted formula: Keyword Match 40% + Skills 25% + Experience 15% + Formatting 10% + Action Verbs 10% |
| Score Breakdown | Visual bars for each of the 5 scoring components |
| ATS Keywords | Extracted from JD, categorised into Hard Skills / Soft Skills / Certifications / Industry Terms |
| Page Budget | Auto-detects experience years + seniority; recommends 1-page or 2-page resume |
| Score Consistency | `temperature: 0` + deterministic formula recomputation + Redis/memory cache |
| Retry Logic | 2 retries with exponential backoff on AI failures |
| Rate Limiting | Per-IP rate limiting on all API routes |
| Downloads | PDF (jsPDF), Word (docx), LaTeX (Overleaf-ready) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| AI | Groq API — `llama-3.3-70b-versatile` |
| Cache | Upstash Redis (falls back to in-memory) |
| File Parsing | mammoth (DOCX), pdf-parse (PDF) |
| PDF Generation | jsPDF |
| Word Generation | docx |
| Deployment | Vercel |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Samirsaurabh1298/atsoptimizer.git
cd ats-optimizer
npm install
```

### 2. Set environment variables

Create `.env.local`:

```env
# Required
GROQ_API_KEY=your_groq_api_key

# Optional — activates persistent Redis cache (recommended for production)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

Get your Groq API key free at: [console.groq.com](https://console.groq.com)

Get your Upstash Redis credentials free at: [upstash.com](https://upstash.com) (10k requests/day free)

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect the GitHub repo at [vercel.com/new](https://vercel.com/new) and add environment variables in Project → Settings → Environment Variables.

> **Note:** Vercel free tier has a 10s function timeout. Complex resumes may hit this limit. Upgrade to Pro (60s timeout) if needed.

---

## Project Structure

```
ats-optimizer/
├── app/
│   ├── page.tsx                 # Main app state + flow
│   ├── globals.css              # Design system + animations
│   └── api/
│       ├── analyze/route.ts     # ATS scoring + keyword extraction
│       ├── optimize/route.ts    # Resume rewriting
│       ├── extract/route.ts     # PDF/DOCX text extraction
│       └── latex/route.ts       # LaTeX generation
├── components/
│   ├── Header.tsx
│   ├── UploadSection.tsx
│   ├── AnalysisResult.tsx       # Score ring, breakdown bars, keywords, page budget toggle
│   └── OptimizedResume.tsx      # Output + before/after + downloads
└── lib/
    ├── groq.ts                  # Groq API client with retry logic
    ├── cache.ts                 # Redis + in-memory cache
    └── rateLimit.ts             # Per-IP rate limiter
```

---

## API Routes

### `POST /api/extract`
Extracts plain text from uploaded file.
- Input: `FormData` with `file` (PDF / DOCX / TXT)
- Output: `{ text: string }`

### `POST /api/analyze`
Runs ATS gap analysis. Results are cached for 1 hour.
- Input: `{ cvText, jdText }`
- Output: `{ matchScore, matchedSkills, missingSkills, experienceGaps, strengths, recommendations, summary, atsKeywords, scoreBreakdown, experienceYears, seniorityLevel, suggestedPages }`

### `POST /api/optimize`
Generates ATS-optimized resume with page budget enforcement.
- Input: `{ cvText, jdText, analysis, pageBudget }`
- Output: `{ optimizedResume: string }`

### `POST /api/latex`
Converts plain text resume to LaTeX format.
- Input: `{ resumeText: string }`
- Output: `.tex` file

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key for LLaMA inference |
| `UPSTASH_REDIS_REST_URL` | No | Activates persistent Redis cache |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis auth token |

---

## Cost Estimate (Groq API)

Groq's free tier covers most personal usage. Paid tier:

| Action | Tokens | Cost |
|---|---|---|
| Analyze | ~4,500 | ~$0.0009 |
| Optimize | ~6,000 | ~$0.0012 |
| Per full session | ~10,500 | ~$0.002 |

At 100 users/day ≈ $0.20/day → ~$6/month.

---

## Known Limitations

- **Scanned/image PDFs** — text extraction will fail; advise users to use text-based PDFs or DOCX
- **Score is an estimate** — AI scoring has inherent variance even at `temperature: 0`; treat scores as directional, not absolute
- **Projected improvement** — the "+X pts" after optimization is an estimate based on skills added, not a re-score

---

## Roadmap

- [ ] Supabase auth + scan history per user
- [ ] Multi-JD comparison (one resume vs multiple jobs)
- [ ] Weak bullet detector (flag "responsible for", "helped with")
- [ ] Cover letter generator
- [ ] Industry-specific keyword database (Tech / Finance / Healthcare)
- [ ] LinkedIn URL → auto-fetch job description

---

## License

MIT — free to use and modify.

---

*Built by Saurabh Samir · April 2026*
