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
    default: 'Virtuoso AI — Practice Coach for Instrumental Musicians',
    template: '%s | Virtuoso AI',
  },
  description:
    'Get feedback like a private lesson from a conservatory-level coach. Built for band and orchestra students preparing for Region, Area, and All-State auditions.',
  keywords: [
    'instrumental music practice',
    'audition preparation',
    'All-State band',
    'TMEA audition',
    'region band audition',
    'music practice coach',
    'band practice',
    'orchestra practice',
  ],
  openGraph: {
    title: 'Virtuoso AI — Practice Coach for Instrumental Musicians',
    description: 'Feedback like a private lesson. Built for band and orchestra students.',
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
