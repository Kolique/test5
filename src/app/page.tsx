import Link from 'next/link'
import {
  Compass,
  ArrowRight,
  Upload,
  Sparkles,
  Share2,
  Smartphone,
  Zap,
  Check,
  Building2,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'

export default async function HomePage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-slate-900">
            <Compass className="h-6 w-6 text-brand-600" />
            <span>TourVista</span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="btn-primary">
                Mon espace <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">
                  Connexion
                </Link>
                <Link href="/signup" className="btn-primary">
                  Créer un compte
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 via-white to-white pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-[500px] w-[900px] bg-brand-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <div className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1 rounded-full mb-6 border border-brand-100">
            <Sparkles className="h-3 w-3" /> Visites 360° propulsées par l'IA
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight max-w-3xl mx-auto">
            Transformez vos photos en{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              visites 360°
            </span>{' '}
            immersives
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            Quelques photos prises au smartphone, une génération automatique
            d'un panorama interactif, un lien à intégrer partout. Conçu pour les
            agents immobiliers, sans compétences techniques.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup" className="btn-primary text-base px-6 py-3">
              Essayer gratuitement <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn-secondary text-base px-6 py-3">
              J'ai déjà un compte
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> Sans carte
              bancaire
            </span>
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> Compatible
              SeLoger & Leboncoin
            </span>
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> 100 % mobile
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900">
              Trois étapes suffisent
            </h2>
            <p className="mt-3 text-slate-600">
              De la prise de photos à la publication, aucune expertise requise.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Upload,
                step: '1',
                title: 'Photographiez',
                body: "Prenez 4 à 6 photos par pièce avec votre smartphone, depuis un point central en tournant sur vous-même.",
              },
              {
                icon: Sparkles,
                step: '2',
                title: 'Assemblez automatiquement',
                body: "Notre moteur assemble vos photos en panorama 360° et complète les zones manquantes avec de l'IA.",
              },
              {
                icon: Share2,
                step: '3',
                title: 'Partagez partout',
                body: "Obtenez un lien et un code iframe à coller dans vos annonces SeLoger, Leboncoin, site d'agence…",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="card p-6 relative hover:shadow-md transition"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="absolute top-6 right-6 text-5xl font-bold text-slate-100 leading-none select-none">
                  {s.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Vos annonces transformées, vos visites accélérées
            </h2>
            <p className="mt-3 text-slate-600">
              Les annonces avec visite virtuelle génèrent jusqu'à 3 fois plus de
              contacts qualifiés. TourVista rend ces visites accessibles à toute
              agence.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                {
                  icon: Zap,
                  title: 'Rapide',
                  desc: 'Panorama généré en quelques secondes après upload.',
                },
                {
                  icon: Smartphone,
                  title: 'Mobile-first',
                  desc: 'Une expérience fluide sur smartphone, où vos acheteurs regardent leurs annonces.',
                },
                {
                  icon: Building2,
                  title: 'Multi-pièces',
                  desc: 'Reliez toutes les pièces avec des hotspots cliquables — comme une vraie visite.',
                },
              ].map((f) => (
                <li key={f.title} className="flex gap-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {f.title}
                    </div>
                    <div className="text-sm text-slate-600">{f.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 relative">
              <svg
                viewBox="0 0 400 300"
                className="absolute inset-0 w-full h-full opacity-40"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="g" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity=".4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="200" cy="150" r="160" fill="url(#g)" />
                {Array.from({ length: 12 }).map((_, i) => {
                  const a = (i / 12) * Math.PI * 2
                  return (
                    <line
                      key={i}
                      x1={200}
                      y1={150}
                      x2={200 + Math.cos(a) * 170}
                      y2={150 + Math.sin(a) * 170}
                      stroke="white"
                      strokeOpacity=".08"
                    />
                  )
                })}
                {Array.from({ length: 5 }).map((_, i) => (
                  <circle
                    key={i}
                    cx={200}
                    cy={150}
                    r={30 + i * 30}
                    fill="none"
                    stroke="white"
                    strokeOpacity=".12"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white/90">
                  <Compass className="h-12 w-12 mx-auto opacity-80" />
                  <div className="mt-3 text-sm font-medium">
                    Aperçu du viewer 360°
                  </div>
                  <div className="text-xs text-white/60 mt-1">
                    Glissez pour explorer
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg border border-slate-200 p-3 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  IA de complétion
                </div>
                <div className="text-[10px] text-slate-500">
                  Zones manquantes comblées
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold">
            Prêt à passer à la visite 360° ?
          </h2>
          <p className="mt-3 text-slate-300">
            Créez votre premier bien en quelques minutes.
          </p>
          <Link
            href="/signup"
            className="btn-primary mt-8 text-base px-6 py-3 bg-white text-slate-900 hover:bg-slate-100"
          >
            Commencer gratuitement <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="py-8 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4" />
            <span>TourVista — Visites virtuelles 360°</span>
          </div>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  )
}
