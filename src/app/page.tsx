import Link from 'next/link'
import { ArrowRight, Mic, BarChart3, Target, Zap, Music, Check } from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Mic,
    title: 'Timestamp-Precise Feedback',
    description:
      'Not "work on articulation" — "at 0:42, tongue motion is delaying note onset. Practice isolated repeated-note exercises at ♩=84."',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    icon: BarChart3,
    title: 'Benchmark-Level Diagnosis',
    description:
      'Know exactly where you stand relative to Region, Area, and All-State standards. No vague scores — real benchmarks.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: Target,
    title: 'Targeted Practice Plans',
    description:
      'Every session ends with a prioritized drill list built directly from your recording — not a generic exercise sheet.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: Zap,
    title: 'Instrument-Specific Intelligence',
    description:
      'Different rubrics for every instrument. Clarinet break crossings. Trumpet slotting. Violin bow pressure. Not one-size-fits-all.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
]

const steps = [
  {
    number: '01',
    title: 'Upload your recording',
    description: 'Drop an audio file or record directly from your device. We accept all standard formats.',
  },
  {
    number: '02',
    title: 'AI analyzes your performance',
    description:
      'Pitch accuracy, dynamics, tempo stability, articulation, tone quality — analyzed with clinician-grade precision.',
  },
  {
    number: '03',
    title: 'Receive actionable coaching',
    description:
      'Get timestamp-specific feedback, level benchmarks compared to Region/All-State standards, and a targeted practice plan.',
  },
]

const instrumentCloud = [
  'Alto Saxophone', 'Clarinet', 'Flute', 'Trumpet', 'Violin',
  'Cello', 'Trombone', 'French Horn', 'Oboe', 'Viola',
  'Euphonium', 'Double Bass', 'Tuba', 'Marimba', 'Bassoon',
  'Tenor Saxophone', 'Piano', 'Snare Drum', 'Vibraphone', 'Timpani',
]

const levels = [
  { label: 'Beginner', color: '#6b7280' },
  { label: 'Intermediate', color: '#60a5fa' },
  { label: 'Advanced', color: '#34d399' },
  { label: 'Region', color: '#fbbf24' },
  { label: 'Area', color: '#fb923c' },
  { label: 'All-State', color: '#a78bfa' },
  { label: 'Conservatory', color: '#f9a8d4' },
  { label: 'Professional', color: '#c4b5fd' },
]

const mockFeedback = [
  {
    time: '0:42',
    type: 'warning' as const,
    text: 'Articulation clarity decreases as tempo increases. Tongue motion is inconsistent.',
    fix: 'Practice repeated-note patterns at ♩=84',
  },
  {
    time: '1:15',
    type: 'critical' as const,
    text: 'Tone thins above high E5 — air support not maintained through the phrase.',
    fix: 'Daily long-tone exercises above the break',
  },
  {
    time: '0:08',
    type: 'positive' as const,
    text: 'Opening phrase shows clean attack and consistent dynamics through the downbeat.',
    fix: null,
  },
]

// ─── Waveform SVG ─────────────────────────────────────────────────────────────

function WaveformVisual() {
  const bars = [
    0.3, 0.5, 0.7, 0.9, 0.6, 0.4, 0.8, 1.0, 0.7, 0.5, 0.9, 0.6, 0.4, 0.7, 0.8,
    0.5, 0.9, 0.7, 0.3, 0.6, 0.8, 1.0, 0.7, 0.5, 0.4, 0.6, 0.9, 0.7, 0.5, 0.8,
    0.6, 0.4, 0.7, 0.9, 0.5, 0.8, 0.6, 0.4, 0.7, 0.5, 0.9, 0.6, 0.4, 0.8, 0.5,
  ]
  return (
    <div className="flex items-center justify-center gap-[3px] h-16 opacity-50">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-violet-600 to-violet-400"
          style={{
            height: `${h * 100}%`,
            animationDelay: `${i * 33}ms`,
            animation: 'waveform 1.2s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/[0.05] bg-[#050508]/80 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">Virtuoso AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="#how-it-works"
            className="hidden sm:block text-sm text-zinc-400 hover:text-white transition-colors"
          >
            How it works
          </Link>
          <Link
            href="/onboarding"
            className="text-sm px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 transition-all font-semibold shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 px-6 flex flex-col items-center text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none">
          <div className="absolute inset-0 bg-violet-600/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-purple-500/6 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/8 text-violet-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse-dot" />
            AI coaching for serious musicians
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.04em] leading-[0.9] mb-6">
            Practice with
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-violet-500 glow-text">
              purpose.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed font-light">
            Upload a recording. Get feedback like a private lesson.
            Know exactly what to fix, why it matters, and how to practice it.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              href="/onboarding"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-base shadow-[0_0_40px_rgba(124,58,237,0.35)] hover:shadow-[0_0_60px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Start practicing free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-4 rounded-2xl border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white transition-all font-medium text-base"
            >
              See how it works
            </Link>
          </div>

          {/* Mock Feedback Preview Card */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508] z-10 pointer-events-none" />
            <div className="rounded-2xl border border-border-strong bg-surface-DEFAULT shadow-[0_0_80px_rgba(0,0,0,0.6)] text-left overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-DEFAULT bg-base-800">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">Alto Saxophone</span>
                  <span className="text-xs text-zinc-500">·</span>
                  <span className="text-xs text-zinc-400">All-State Excerpt · 4:32</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[10px] font-medium">
                    Region Level
                  </span>
                  <span className="text-sm font-bold text-violet-300">74/100</span>
                </div>
              </div>

              {/* Waveform */}
              <div className="px-5 py-3 border-b border-border-subtle">
                <WaveformVisual />
              </div>

              {/* Feedback points */}
              <div className="p-4 space-y-2.5">
                {mockFeedback.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-base-800/60 border border-border-subtle">
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        item.type === 'positive'
                          ? 'bg-emerald-400'
                          : item.type === 'warning'
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono font-semibold text-violet-300">{item.time}</span>
                        <span className="text-xs text-zinc-300">{item.text}</span>
                      </div>
                      {item.fix && (
                        <p className="text-[10px] text-zinc-500">
                          Fix: {item.fix}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              From recording to breakthrough
            </h2>
            <p className="text-zinc-400 text-base max-w-lg mx-auto">
              Three steps. Clinician-level feedback. Zero guesswork.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-[calc(100%_-_1rem)] w-8 h-px bg-gradient-to-r from-violet-500/40 to-transparent z-10" />
                )}
                <div className="p-6 rounded-2xl bg-surface-DEFAULT border border-border-DEFAULT hover:border-border-strong transition-colors">
                  <div className="text-3xl font-black text-violet-500/30 mb-4 tracking-tighter font-mono">
                    {step.number}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-base-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Feedback that actually teaches
            </h2>
            <p className="text-zinc-400 text-base max-w-lg mx-auto">
              Not a score. Not generic advice. Specific, actionable coaching for your instrument.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  className={`p-6 rounded-2xl border bg-surface-DEFAULT transition-all hover:-translate-y-0.5 ${f.border}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.bg}`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Benchmark Levels ──────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Know exactly where you stand
            </h2>
            <p className="text-zinc-400 text-base max-w-lg mx-auto">
              Every analysis estimates your performance level on a scale from Beginner to Professional.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {levels.map((level) => (
              <div
                key={level.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border-DEFAULT bg-surface-DEFAULT text-sm font-medium text-zinc-300"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: level.color }} />
                {level.label}
              </div>
            ))}
          </div>

          {/* Gap analysis preview */}
          <div className="mt-10 p-6 rounded-2xl bg-surface-DEFAULT border border-border-DEFAULT max-w-lg mx-auto">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Sample Gap Analysis</p>
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <div className="text-xs text-zinc-500 mb-1">Current</div>
                <div className="text-lg font-bold text-amber-400">Region</div>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-600" />
              <div className="text-center">
                <div className="text-xs text-zinc-500 mb-1">Target</div>
                <div className="text-lg font-bold text-violet-400">All-State</div>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Tone Quality', delta: '+8', urgency: 'high' },
                { label: 'Articulation', delta: '+6', urgency: 'high' },
                { label: 'Musicality', delta: '+12', urgency: 'medium' },
              ].map((gap) => (
                <div key={gap.label} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">{gap.label}</span>
                  <span className={`text-sm font-bold ${gap.urgency === 'high' ? 'text-rose-400' : 'text-amber-400'}`}>
                    {gap.delta} points needed
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Instruments ───────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-base-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-6">
            Built for serious players
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {instrumentCloud.map((name) => (
              <span
                key={name}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 border border-border-DEFAULT bg-surface-DEFAULT hover:border-violet-500/30 hover:text-zinc-200 transition-all"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Better ────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Not a tuner. Not a metronome. A{' '}
                <span className="text-gradient-violet">coach.</span>
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Every tool you have tells you what happened. Virtuoso AI tells you why it happened, what it costs you at auditions, and exactly how to fix it before your next session.
              </p>
              <ul className="space-y-3">
                {[
                  'Clinician-level feedback — not generic scores',
                  'Timestamp-specific: know exactly where to focus',
                  'Benchmark against Region, Area, and All-State',
                  'Personalized practice drills from your recording',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-rose-500/8 border border-rose-500/15">
                <p className="text-xs font-semibold text-rose-400 mb-1">Bad feedback</p>
                <p className="text-sm text-zinc-400 italic">"Work on tone."</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                <p className="text-xs font-semibold text-emerald-400 mb-1">Virtuoso AI feedback</p>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  "From 0:42–0:51, articulation clarity decreases as tempo increases. Tongue motion appears inefficient, causing delayed note starts. Practice repeated-note exercises at ♩=84 before increasing tempo."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-600/8 rounded-3xl blur-[60px] pointer-events-none" />
            <div className="relative p-12 rounded-3xl border border-border-DEFAULT bg-surface-DEFAULT">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Ready to practice smarter?
              </h2>
              <p className="text-zinc-400 mb-8">
                Select your instrument. Set your target level. Upload your first recording.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-base shadow-[0_0_40px_rgba(124,58,237,0.3)] hover:shadow-[0_0_60px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5"
              >
                Start free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-zinc-600 mt-4">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-border-DEFAULT px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Music className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Virtuoso AI</span>
          </div>
          <p className="text-xs text-zinc-600">
            Built for Region, Area, and All-State candidates. Not for casual hobbyists.
          </p>
        </div>
      </footer>
    </div>
  )
}
