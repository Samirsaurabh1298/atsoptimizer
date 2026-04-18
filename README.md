# 🎯 ATS Resume Optimizer

> Beat the bots. Land the interview. AI-powered resume optimization using Claude AI.

## What it does

1. **Upload** your resume (PDF/DOCX/TXT) + job description
2. **Analyze** — get an instant ATS match score, missing skills, and gap analysis
3. **Optimize** — generate an ATS-friendly resume with keywords injected naturally
4. **Download** — copy or download your optimized resume

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI**: Claude API (claude-sonnet-4-20250514)
- **Styling**: Tailwind CSS + custom CSS variables
- **File parsing**: mammoth (DOCX), pdf-parse (PDF)
- **Deployment**: Vercel (recommended)

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo>
cd ats-optimizer
npm install
```

### 2. Add your API key

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your key at: https://console.anthropic.com

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000

---

## Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
npm i -g vercel
vercel
```

### Option B — GitHub + Vercel Dashboard

1. Push this repo to GitHub
2. Go to https://vercel.com/new
3. Import your repo
4. Add environment variable: `ANTHROPIC_API_KEY` = your key
5. Deploy ✓

> **Important**: Set `ANTHROPIC_API_KEY` in Vercel Dashboard → Project → Settings → Environment Variables

---

## Project Structure

```
ats-optimizer/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main app logic + state
│   ├── globals.css         # Design system + animations
│   └── api/
│       ├── analyze/        # Gap analysis via Claude
│       │   └── route.ts
│       ├── optimize/       # Resume rewriting via Claude
│       │   └── route.ts
│       └── extract/        # File text extraction
│           └── route.ts
├── components/
│   ├── Header.tsx          # Top nav
│   ├── UploadSection.tsx   # Drag & drop upload UI
│   ├── AnalysisResult.tsx  # Score ring + gap cards
│   └── OptimizedResume.tsx # Output + download
├── .env.local.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## API Routes

### `POST /api/extract`
Extracts plain text from uploaded PDF/DOCX/TXT files.
- Input: `FormData` with `file`
- Output: `{ text: string }`

### `POST /api/analyze`
Runs ATS gap analysis using Claude.
- Input: `{ cvText, jdText }`
- Output: `{ matchScore, matchedSkills, missingSkills, experienceGaps, strengths, recommendations, summary }`

### `POST /api/optimize`
Generates ATS-optimized resume using Claude.
- Input: `{ cvText, jdText, analysis }`
- Output: `{ optimizedResume: string }`

---

## Cost Estimate (Claude API)

| Action | Tokens used | Approx cost |
|--------|-------------|-------------|
| Analyze | ~3,000 | ~$0.009 |
| Optimize | ~5,000 | ~$0.015 |
| **Per full scan** | ~8,000 | **~$0.024** |

At 100 users/day = ~$2.40/day → ~$72/month. Very manageable.

---

## Limitations & Known Issues

- **Image-based PDFs** (scanned documents) won't extract properly — advise users to use text-based PDFs or DOCX
- **Vercel function timeout** is 10s on free tier — analysis usually completes within 8-9s, but complex resumes may timeout. Upgrade to Pro ($20/mo) for 60s timeout if needed.
- **File size**: Max 10MB per file (configurable in `next.config.js`)

---

## Roadmap

- [ ] Word (.docx) download using docx npm package
- [ ] Multi-JD comparison (compare one resume against multiple jobs)
- [ ] Cover letter generator
- [ ] ATS simulator (score before/after)
- [ ] Supabase auth + scan history
- [ ] Rate limiting per IP

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key |

---

## License

MIT — free to use and modify.

---

*Built for job seekers · April 2026*
