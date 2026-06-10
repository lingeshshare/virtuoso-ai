import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: {
    default: 'Virtuoso AI — AI Practice Coach for Musicians',
    template: '%s | Virtuoso AI',
  },
  description:
    'Get feedback like a private lesson. Know exactly where you stand. Practice what matters. The AI coach built for serious instrumental musicians.',
  keywords: [
    'music practice',
    'AI music coach',
    'audition preparation',
    'All-State band',
    'music feedback',
    'instrument practice',
  ],
  openGraph: {
    title: 'Virtuoso AI — AI Practice Coach for Musicians',
    description: 'The AI practice coach for serious instrumental musicians.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-base-900 text-white antialiased min-h-screen">{children}</body>
    </html>
  )
}
