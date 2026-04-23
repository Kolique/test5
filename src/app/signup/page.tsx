'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Compass, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const data = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.get('email'),
        password: data.get('password'),
        name: data.get('name'),
        agencyName: data.get('agencyName'),
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Erreur')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex flex-col">
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-900 font-semibold">
          <Compass className="h-6 w-6 text-brand-600" />
          <span>TourVista</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <div className="card p-8 animate-slide-up">
            <h1 className="text-2xl font-semibold text-slate-900">
              Créer un compte agent
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Lancez votre première visite virtuelle en 5 minutes.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prénom & nom</label>
                  <input name="name" required className="input" />
                </div>
                <div>
                  <label className="label">Agence</label>
                  <input name="agencyName" className="input" />
                </div>
              </div>
              <div>
                <label className="label">Email pro</label>
                <input name="email" type="email" required className="input" />
              </div>
              <div>
                <label className="label">Mot de passe</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="input"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Au moins 6 caractères
                </p>
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                  {error}
                </div>
              )}
              <button disabled={loading} type="submit" className="btn-primary w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Créer mon compte
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-600 text-center">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
