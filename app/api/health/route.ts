import { NextResponse } from 'next/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function GET() {
  const key = process.env.GROQ_API_KEY

  if (!key) {
    return NextResponse.json({ status: 'error', reason: 'GROQ_API_KEY is not set' }, { status: 500 })
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 5,
        temperature: 0,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ status: 'error', httpStatus: res.status, groqError: data }, { status: 500 })
    }

    return NextResponse.json({ status: 'ok', model: 'llama-3.3-70b-versatile', keyPrefix: key.slice(0, 8) + '...' })
  } catch (e: any) {
    return NextResponse.json({ status: 'error', reason: e.message }, { status: 500 })
  }
}
