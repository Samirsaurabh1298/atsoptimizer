import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
// Use lib path directly to avoid pdf-parse's debug mode that reads test files and hangs in Next.js
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as typeof import('pdf-parse')

export const maxDuration = 30

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 413 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    let text = ''

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      text = buffer.toString('utf-8')
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        const result = await pdfParse(buffer, { max: 5 })
        text = result.text
      } catch {
        text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        if (text.trim().length < 50) {
          return NextResponse.json(
            { error: 'Could not extract text from this PDF. Try a text-based PDF or DOCX file.' },
            { status: 422 }
          )
        }
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Use PDF, DOCX, or TXT.' }, { status: 400 })
    }

    // Clean up extracted text
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (text.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract meaningful text from this file. Try a different format.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text })
  } catch (e: any) {
    console.error('Extract error:', e)
    return NextResponse.json({ error: 'File extraction failed. Try a different file.' }, { status: 500 })
  }
}

