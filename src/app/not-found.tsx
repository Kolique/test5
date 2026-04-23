import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <Compass className="h-12 w-12 text-slate-400 mx-auto" />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          La page ou la visite que vous cherchez n'existe pas ou a été
          supprimée.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
