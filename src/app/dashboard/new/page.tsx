'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NewPropertyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const data = new FormData(e.currentTarget)
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.get('title'),
        address: data.get('address'),
        description: data.get('description'),
        price: data.get('price'),
        surface: data.get('surface'),
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Erreur')
      setLoading(false)
      return
    }
    router.push(`/dashboard/properties/${json.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      <div className="card p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Nouveau bien</h1>
        <p className="text-sm text-slate-500 mt-1">
          Remplissez les infos principales, vous pourrez ajouter les pièces juste
          après.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Titre de l'annonce *</label>
            <input
              name="title"
              required
              className="input"
              placeholder="Bel appartement 3 pièces à Bordeaux"
            />
          </div>
          <div>
            <label className="label">Adresse</label>
            <input
              name="address"
              className="input"
              placeholder="12 rue des Lilas, 33000 Bordeaux"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prix</label>
              <input name="price" className="input" placeholder="345 000 €" />
            </div>
            <div>
              <label className="label">Surface</label>
              <input name="surface" className="input" placeholder="75 m²" />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              rows={4}
              className="input resize-none"
              placeholder="Informations complémentaires sur le bien..."
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Créer le bien
          </button>
        </form>
      </div>
    </div>
  )
}
