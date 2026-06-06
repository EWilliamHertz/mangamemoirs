'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen, Sparkles, Film, Layers, Zap, Shield, Globe,
  ChevronRight, Check, Star
} from 'lucide-react';

const FEATURES = [
  { icon: BookOpen, title: 'Memoir & PDF Upload', desc: 'Upload your life story as a PDF, paste text, or type directly. We extract every passage intelligently.' },
  { icon: Sparkles, title: 'AI Scene Breakdown', desc: 'GPT-4o reads your story and breaks it into cinematic scenes with mood, characters, and visual direction.' },
  { icon: Film, title: 'Manga Panel Generation', desc: 'DALL·E 3 renders each scene in your chosen style — Shonen, Shojo, Seinen, Ghibli, Cyberpunk and more.' },
  { icon: Layers, title: 'Anime Clip Generation', desc: 'Generate fluid 5-second animated clips per scene using the latest AI video models.' },
  { icon: Globe, title: 'Reference Library', desc: 'Upload reference images, PDFs, text snippets and video clips to guide the AI\'s visual direction.' },
  { icon: Shield, title: 'Scene-by-Scene Review', desc: 'Review, edit, and regenerate every panel before assembling your final storyboard. Full creative control.' },
];

const PANELS = [
  { style: 'Shonen', color: 'from-orange-500/20 to-red-500/20', label: '少年' },
  { style: 'Shojo', color: 'from-pink-500/20 to-rose-500/20', label: '少女' },
  { style: 'Cyberpunk', color: 'from-plasma/20 to-blue-500/20', label: 'サイバー' },
  { style: 'Ghibli', color: 'from-jade/20 to-teal-500/20', label: '自然' },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    credits: '8',
    color: 'border-white/10',
    badge: '',
    perks: ['3 manga panels', '1 anime clip (5s)', 'PDF & text upload', '1 reference slot', 'Basic styles'],
    cta: 'Get Started',
    href: '/sign-up',
  },
  {
    name: 'Creator',
    price: '$14.99',
    credits: '75',
    color: 'border-plasma/50',
    badge: 'Most Popular',
    perks: ['75 credits', '37 manga panels OR', '15 anime clips (5s)', 'All art styles', 'Unlimited references', 'Priority generation'],
    cta: 'Get Creator',
    href: '/sign-up',
  },
  {
    name: 'Studio',
    price: '$39.99',
    credits: '250',
    color: 'border-bloom/50',
    badge: 'Best Value',
    perks: ['250 credits', '125 panels OR', '50 anime clips (5s)', 'Commercial license', 'API access (soon)', 'Dedicated support'],
    cta: 'Get Studio',
    href: '/sign-up',
  },
];

const STEPS = [
  { n: '01', title: 'Upload Your Story', desc: 'Drop in a PDF memoir, paste text, or type your story. Add reference images to shape the visual style.' },
  { n: '02', title: 'AI Breaks It Into Scenes', desc: 'Our AI reads your story and creates a cinematic scene breakdown with moods, characters, and visual prompts.' },
  { n: '03', title: 'Review & Generate', desc: 'Edit any scene, choose your manga style, then generate panels and clips. Assemble your final storyboard.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink text-white overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-ink/80 backdrop-blur-xl border-b border-white/5">
        <span className="text-xl font-bold gradient-text">🎴 Ouriye</span>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link href="/sign-up" className="text-sm bg-plasma hover:bg-plasma-light transition-colors px-4 py-2 rounded-xl font-medium btn-glow">
            Start Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-plasma/5 rounded-full blur-3xl" />

        {/* Floating manga panel previews */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {PANELS.map((p, i) => (
            <motion.div
              key={p.style}
              className={`absolute manga-border rounded-xl bg-gradient-to-br ${p.color} backdrop-blur-sm p-3 w-32 h-40`}
              style={{
                top: `${15 + i * 18}%`,
                left: i < 2 ? `${3 + i * 5}%` : 'auto',
                right: i >= 2 ? `${3 + (i - 2) * 5}%` : 'auto',
              }}
              animate={{ y: [0, -16, 0], rotate: [i % 2 === 0 ? -3 : 3, i % 2 === 0 ? 3 : -3, i % 2 === 0 ? -3 : 3] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="text-2xl mb-2">{p.label}</div>
              <div className="text-xs text-white/40 font-mono">{p.style}</div>
              <div className="mt-2 space-y-1">
                {[70, 50, 85].map((w, j) => (
                  <div key={j} className="h-1.5 rounded bg-white/10" style={{ width: `${w}%` }} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block text-xs font-semibold tracking-widest text-plasma-light bg-plasma/10 border border-plasma/20 px-4 py-1.5 rounded-full mb-8">
              AI-POWERED MANGA STUDIO
            </span>

            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
              Turn Your Story Into{' '}
              <span className="gradient-text">Manga & Anime</span>
            </h1>

            <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload your memoir, paste a story, or write from scratch.
              Our AI breaks it into cinematic scenes, generates stunning manga panels,
              and assembles an anime storyboard — scene by scene.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="flex items-center gap-2 bg-plasma hover:bg-plasma-light text-white font-bold text-lg px-8 py-4 rounded-2xl btn-glow transition-all"
              >
                Start Free — 3 Panels + 1 Clip
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/sign-in"
                className="flex items-center gap-2 text-white/70 hover:text-white border border-white/10 hover:border-white/30 px-8 py-4 rounded-2xl transition-all"
              >
                Sign In
              </Link>
            </div>

            <p className="mt-6 text-sm text-white/30">No credit card required · 8 free credits on signup</p>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">How It Works</h2>
            <p className="text-white/50 text-lg">From raw story to finished storyboard in minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                className="relative p-6 rounded-2xl bg-panel border border-white/5"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="text-5xl font-black text-plasma/30 mb-4 font-mono">{s.n}</div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 bg-void speed-lines">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Everything You Need</h2>
            <p className="text-white/50 text-lg">A full manga production studio, powered by AI.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="p-6 rounded-2xl bg-panel border border-white/5 panel-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="w-12 h-12 rounded-xl bg-plasma/10 border border-plasma/20 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-plasma-light" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Simple Credit Pricing</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              1 panel = 2 credits · 1 anime clip (5s) = 10 credits. Buy once, use anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING.map((p, i) => (
              <motion.div
                key={p.name}
                className={`relative p-6 rounded-2xl bg-panel border ${p.color} flex flex-col`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-plasma px-3 py-1 rounded-full">
                    {p.badge}
                  </span>
                )}
                <div className="mb-6">
                  <p className="text-white/50 text-sm mb-1">{p.name}</p>
                  <p className="text-4xl font-black mb-1">{p.price}</p>
                  <p className="text-plasma-light text-sm font-semibold">{p.credits} credits</p>
                </div>
                <ul className="space-y-2 mb-8 flex-1">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-white/70">
                      <Check className="w-4 h-4 text-jade mt-0.5 shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className={`w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${
                    i === 1
                      ? 'bg-plasma hover:bg-plasma-light text-white btn-glow'
                      : 'bg-surface hover:bg-white/10 text-white border border-white/10'
                  }`}
                >
                  {p.cta}
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-white/30 text-sm mt-8">
            Credits never expire · Email ewilliamhe@gmail.com to top up · No subscription
          </p>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-plasma/20 to-bloom/20 border border-plasma/20 p-12 relative overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
          <Sparkles className="w-12 h-12 text-solar mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black mb-4">Your story deserves to be seen.</h2>
          <p className="text-white/60 text-lg mb-8">
            Join creators turning memoirs, novels, and ideas into manga masterpieces.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-white text-ink font-black text-lg px-10 py-4 rounded-2xl hover:bg-white/90 transition-all"
          >
            <Star className="w-5 h-5 text-solar" />
            Start Creating Free
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-6 text-center text-white/30 text-sm">
        <p className="text-xl font-bold gradient-text mb-4">🎴 Ouriye</p>
        <div className="flex items-center justify-center gap-6 mb-4">
          <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
          <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
          <a href="https://github.com/EWilliamHertz/mangamemoirs" className="hover:text-white/60 transition-colors">GitHub</a>
        </div>
        <p>© 2026 Ouriye. Built with AI, for storytellers.</p>
      </footer>
    </div>
  );
}
