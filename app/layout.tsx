import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ATS Resume Optimizer',
  description: 'Beat the bots. Land the interview. AI-powered resume optimization.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
