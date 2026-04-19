import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error. Please contact support.' },
      { status: 503 }
    )
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
