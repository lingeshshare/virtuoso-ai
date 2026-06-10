import Link from 'next/link'
import { Music } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base-900 flex flex-col items-center justify-center text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mb-6 shadow-glow-violet">
        <Music className="w-7 h-7 text-white" />
      </div>
      <h1 className="text-4xl font-black text-white mb-3 tracking-tight">404</h1>
      <p className="text-zinc-400 mb-8">This page doesn&apos;t exist. Maybe it&apos;s still being composed.</p>
      <Link
        href="/dashboard"
        className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
