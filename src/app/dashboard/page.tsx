import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { Plus, Eye, Home, Image as ImageIcon } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const user = await requireUser()

  const properties = await prisma.property.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      rooms: {
        select: { id: true, status: true, thumbnailUrl: true },
      },
    },
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Mes biens</h1>
          <p className="text-sm text-slate-500 mt-1">
            Créez et partagez des visites 360° professionnelles.
          </p>
        </div>
        <Link href="/dashboard/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nouveau bien
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 mb-4">
            <Home className="h-7 w-7 text-brand-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            Créez votre premier bien
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Uploadez quelques photos de chaque pièce et obtenez une visite
            virtuelle 360° prête à partager.
          </p>
          <Link href="/dashboard/new" className="btn-primary mt-6">
            <Plus className="h-4 w-4" />
            Créer un bien
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => {
            const firstThumb = p.rooms.find((r) => r.thumbnailUrl)?.thumbnailUrl
            const readyCount = p.rooms.filter((r) => r.status === 'ready').length
            return (
              <Link
                key={p.id}
                href={`/dashboard/properties/${p.id}`}
                className="card overflow-hidden hover:shadow-md transition group"
              >
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {firstThumb ? (
                    <img
                      src={firstThumb}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 badge bg-white/90 text-slate-700 shadow-sm">
                    {readyCount}/{p.rooms.length} pièces
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-slate-900 truncate">{p.title}</h3>
                  {p.address && (
                    <p className="text-sm text-slate-500 truncate mt-0.5">
                      {p.address}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Modifié le {formatDate(p.updatedAt)}</span>
                    <span className="inline-flex items-center gap-1 text-brand-600 group-hover:text-brand-700 font-medium">
                      <Eye className="h-3 w-3" /> Ouvrir
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
