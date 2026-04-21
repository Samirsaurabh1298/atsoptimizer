const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const TIMEOUT_MS = 55_000
const MAX_RETRIES = 2

// Safe error messages that can be shown to users
const SAFE_MESSAGES = new Set([
  'Request timed out. Please try again.',
  'AI service unavailable. Please try again.',
])

export async function groqChat(
  messages: { role: string; content: string }[],
  opts: { model?: string; max_tokens?: number; temperature?: number } = {}
): Promise<string> {
  let lastError: Error = new Error('AI service unavailable. Please try again.')

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)))

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: opts.model ?? 'llama-3.3-70b-versatile',
          max_tokens: opts.max_tokens ?? 1500,
          temperature: opts.temperature ?? 0,
          messages,
        }),
        signal: controller.signal,
      })
    } catch (e: any) {
      lastError = e.name === 'AbortError'
        ? new Error('Request timed out. Please try again.')
        : new Error('AI service unavailable. Please try again.')
      continue
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) {
      // 429 rate limit — don't retry
      if (response.status === 429) throw new Error('AI service unavailable. Please try again.')
      lastError = new Error('AI service unavailable. Please try again.')
      continue
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content ?? ''
  }

  throw lastError
}

export function safeErrorMessage(e: any, fallback: string): string {
  const msg: string = e?.message ?? ''
  return SAFE_MESSAGES.has(msg) ? msg : fallback
}

export function parseGroqJson(raw: string): any {
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    throw new Error('Unexpected response format. Please try again.')
  }
}
