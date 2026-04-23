'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Link2,
  Copy,
  Check,
  Sparkles,
  Home as HomeIcon,
  RefreshCcw,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import HotspotEditor from './HotspotEditor'

type Hotspot = {
  id: string
  sourceRoomId: string
  targetRoomId: string
  pitch: number
  yaw: number
  label?: string | null
  target: { id: string; name: string }
}

type Room = {
  id: string
  name: string
  order: number
  status: string
  panoramaUrl: string | null
  thumbnailUrl: string | null
  photos: { id: string; url: string; order: number }[]
  hotspots: Hotspot[]
}

type Property = {
  id: string
  slug: string
  title: string
  rooms: Room[]
}

export default function PropertyEditor({ property }: { property: Property }) {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>(property.rooms)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    property.rooms[0]?.id ?? null
  )
  const [addingRoom, setAddingRoom] = useState(false)
  const [editingHotspotsFor, setEditingHotspotsFor] = useState<string | null>(null)

  async function refresh() {
    const res = await fetch(`/api/properties/${property.id}`)
    if (!res.ok) return
    const json = await res.json()
    setRooms(json.rooms)
  }

  // Poll while any room is processing
  useEffect(() => {
    const processing = rooms.some((r) => r.status === 'processing')
    if (!processing) return
    const id = setInterval(refresh, 2000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms.map((r) => r.status).join(',')])

  async function addRoom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = (data.get('name') as string)?.trim()
    if (!name) return
    setAddingRoom(true)
    const res = await fetch(`/api/properties/${property.id}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setAddingRoom(false)
    if (res.ok) {
      const json = await res.json()
      setRooms((r) => [...r, { ...json, photos: [], hotspots: [] }])
      setSelectedRoomId(json.id)
      e.currentTarget.reset()
    }
  }

  async function deleteRoom(roomId: string) {
    if (!confirm('Supprimer cette pièce ?')) return
    const res = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' })
    if (res.ok) {
      setRooms((r) => r.filter((x) => x.id !== roomId))
      if (selectedRoomId === roomId) {
        setSelectedRoomId(rooms.find((r) => r.id !== roomId)?.id ?? null)
      }
    }
  }

  const selected = rooms.find((r) => r.id === selectedRoomId) ?? null

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Rooms sidebar */}
      <aside className="card p-3 h-fit">
        <div className="px-2 py-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Pièces</h2>
          <span className="text-xs text-slate-500">{rooms.length}</span>
        </div>
        <div className="space-y-1">
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoomId(r.id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md flex items-center gap-2 group',
                selectedRoomId === r.id
                  ? 'bg-brand-50 text-brand-800'
                  : 'hover:bg-slate-50 text-slate-700'
              )}
            >
              <div className="h-10 w-10 rounded-md bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {r.thumbnailUrl ? (
                  <img
                    src={r.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <HomeIcon className="h-4 w-4 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-xs flex items-center gap-1">
                  <StatusDot status={r.status} />
                  <span className="text-slate-500">
                    {statusLabel(r.status)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
        <form onSubmit={addRoom} className="mt-2 p-2 border-t border-slate-100">
          <div className="flex gap-2">
            <input
              name="name"
              required
              disabled={addingRoom}
              placeholder="Ex : Salon"
              className="input text-sm py-2"
            />
            <button
              type="submit"
              disabled={addingRoom}
              className="btn-primary px-3 py-2"
            >
              {addingRoom ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </aside>

      {/* Main editor panel */}
      <div className="space-y-6">
        {!selected ? (
          <div className="card p-12 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-brand-500 mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">
              Commencez par ajouter une pièce
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Créez une pièce (salon, cuisine, chambre…) puis ajoutez 4 à 6
              photos.
            </p>
          </div>
        ) : (
          <>
            <RoomPanel
              key={selected.id}
              room={selected}
              onChange={refresh}
              onDelete={() => deleteRoom(selected.id)}
              onEditHotspots={() => setEditingHotspotsFor(selected.id)}
              allRooms={rooms}
            />

            <ShareCard property={property} hasReady={rooms.some((r) => r.status === 'ready')} />
          </>
        )}
      </div>

      {editingHotspotsFor && (
        <HotspotEditor
          room={rooms.find((r) => r.id === editingHotspotsFor)!}
          allRooms={rooms}
          onClose={() => setEditingHotspotsFor(null)}
          onSaved={refresh}
        />
      )}
    </div>
  )
}

function RoomPanel({
  room,
  onChange,
  onDelete,
  onEditHotspots,
  allRooms,
}: {
  room: Room
  onChange: () => void
  onDelete: () => void
  onEditHotspots: () => void
  allRooms: Room[]
}) {
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function upload(files: FileList | File[]) {
    if (!files || files.length === 0) return
    setUploading(true)
    const form = new FormData()
    for (const f of Array.from(files)) form.append('files', f)
    const res = await fetch(`/api/rooms/${room.id}/photos`, {
      method: 'POST',
      body: form,
    })
    setUploading(false)
    if (res.ok) onChange()
  }

  async function deletePhoto(id: string) {
    const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' })
    if (res.ok) onChange()
  }

  async function processPanorama() {
    setProcessing(true)
    const res = await fetch(`/api/rooms/${room.id}/process`, { method: 'POST' })
    setProcessing(false)
    if (res.ok) onChange()
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{room.name}</h2>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
            <StatusDot status={room.status} />
            {statusLabel(room.status)}
            {room.photos.length > 0 && (
              <>
                {' · '}
                {room.photos.length} photos
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {room.status === 'ready' && allRooms.length > 1 && (
            <button onClick={onEditHotspots} className="btn-secondary">
              <MapPin className="h-4 w-4" />
              Hotspots ({room.hotspots.length})
            </button>
          )}
          <button onClick={onDelete} className="btn-ghost" title="Supprimer la pièce">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preview */}
      {room.panoramaUrl && (
        <div className="mb-5 rounded-lg overflow-hidden bg-slate-900 relative aspect-[2/1]">
          <img
            src={room.panoramaUrl}
            alt={room.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
            <span className="text-xs font-medium bg-black/40 backdrop-blur px-2 py-1 rounded">
              Panorama 360° · équirectangulaire
            </span>
            <button
              onClick={processPanorama}
              disabled={processing}
              className="text-xs bg-white/10 backdrop-blur hover:bg-white/20 px-2.5 py-1 rounded flex items-center gap-1"
            >
              <RefreshCcw className="h-3 w-3" />
              Regénérer
            </button>
          </div>
        </div>
      )}

      {/* Photos grid */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files) upload(e.dataTransfer.files)
        }}
        className={cn(
          'rounded-lg border-2 border-dashed p-6 transition',
          dragOver
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-200 bg-slate-50/50'
        )}
      >
        {room.photos.length === 0 ? (
          <div className="text-center py-6">
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-700 font-medium">
              Glissez-déposez 4 à 6 photos de la pièce
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Prenez les photos depuis un même point central en tournant sur
              vous-même (devant, droite, derrière, gauche, etc.).
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-primary mt-4"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Choisir des photos
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {room.photos.map((p, i) => (
                <div
                  key={p.id}
                  className="relative group aspect-square rounded-md overflow-hidden bg-slate-200"
                >
                  <img
                    src={p.url}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {i + 1}
                  </div>
                  <button
                    onClick={() => deletePhoto(p.id)}
                    className="absolute top-1 right-1 bg-red-600 text-white h-6 w-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-md border-2 border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50 flex items-center justify-center text-slate-400 hover:text-brand-600 transition"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </button>
            </div>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {/* Generate panorama */}
      {room.photos.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2 items-center justify-between">
          <div className="text-sm text-slate-600">
            {room.photos.length < 3 ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700">
                <AlertCircle className="h-4 w-4" /> Ajoutez au moins 3 photos pour
                un bon résultat
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-brand-500" />
                L'IA comblera les zones manquantes automatiquement
              </span>
            )}
          </div>
          {room.status !== 'ready' && (
            <button
              onClick={processPanorama}
              disabled={processing || room.photos.length < 2 || room.status === 'processing'}
              className="btn-primary"
            >
              {processing || room.status === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Génération en cours…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Générer le panorama 360°
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ShareCard({
  property,
  hasReady,
}: {
  property: Property
  hasReady: boolean
}) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const tourUrl = `${origin}/tour/${property.slug}`
  const embedCode = `<iframe src="${origin}/embed/${property.slug}" width="100%" height="500" frameborder="0" allowfullscreen style="border-radius:12px;border:1px solid #e2e8f0"></iframe>`

  if (!hasReady) return null

  return (
    <div className="card p-6 bg-gradient-to-br from-brand-50 to-white border-brand-100">
      <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <Link2 className="h-5 w-5 text-brand-600" />
        Partager la visite
      </h2>
      <p className="text-sm text-slate-600 mt-1">
        Utilisez ce lien dans SeLoger, Leboncoin ou votre site d'agence.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="label text-xs">Lien public</label>
          <div className="flex gap-2">
            <input readOnly value={tourUrl} className="input text-sm font-mono" />
            <button
              onClick={() => {
                navigator.clipboard.writeText(tourUrl)
                setCopiedLink(true)
                setTimeout(() => setCopiedLink(false), 2000)
              }}
              className="btn-secondary"
            >
              {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="label text-xs">Code d'intégration (iframe)</label>
          <div className="flex gap-2">
            <textarea
              readOnly
              value={embedCode}
              rows={2}
              className="input text-xs font-mono resize-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(embedCode)
                setCopiedEmbed(true)
                setTimeout(() => setCopiedEmbed(false), 2000)
              }}
              className="btn-secondary self-start"
            >
              {copiedEmbed ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'ready'
      ? 'bg-emerald-500'
      : status === 'processing'
      ? 'bg-amber-500 animate-pulse'
      : status === 'failed'
      ? 'bg-red-500'
      : 'bg-slate-300'
  return <span className={cn('h-2 w-2 rounded-full', color)} />
}

function statusLabel(status: string) {
  return status === 'ready'
    ? 'Panorama prêt'
    : status === 'processing'
    ? 'Génération...'
    : status === 'failed'
    ? 'Échec'
    : 'Pas encore généré'
}
