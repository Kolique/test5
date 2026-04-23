'use client'

import { useEffect, useState } from 'react'
import PanoramaViewer from './PanoramaViewer'
import { ChevronLeft, ChevronRight, Maximize2, MapPin, DoorOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

type Hotspot = {
  id: string
  targetRoomId: string
  pitch: number
  yaw: number
  target: { id: string; name: string }
}

type Room = {
  id: string
  name: string
  panoramaUrl: string
  thumbnailUrl: string | null
  hotspots: Hotspot[]
}

type Property = {
  id: string
  title: string
  address: string | null
  price: string | null
  surface: string | null
  rooms: Room[]
  user: { name: string | null; agencyName: string | null }
}

export default function TourViewer({
  property,
  embed = false,
}: {
  property: Property
  embed?: boolean
}) {
  const [currentId, setCurrentId] = useState<string>(property.rooms[0]?.id)
  const [showRooms, setShowRooms] = useState(false)
  const current = property.rooms.find((r) => r.id === currentId) ?? property.rooms[0]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextRoom()
      if (e.key === 'ArrowLeft') prevRoom()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function nextRoom() {
    const idx = property.rooms.findIndex((r) => r.id === currentId)
    const next = property.rooms[(idx + 1) % property.rooms.length]
    if (next) setCurrentId(next.id)
  }
  function prevRoom() {
    const idx = property.rooms.findIndex((r) => r.id === currentId)
    const next =
      property.rooms[(idx - 1 + property.rooms.length) % property.rooms.length]
    if (next) setCurrentId(next.id)
  }

  function toggleFullscreen() {
    const el = document.documentElement
    if (!document.fullscreenElement) el.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  if (!current) {
    return (
      <div className="flex items-center justify-center h-full text-white/80">
        Aucune pièce disponible.
      </div>
    )
  }

  const hotspots = current.hotspots.map((h) => ({
    pitch: h.pitch,
    yaw: h.yaw,
    label: h.target.name,
    onClick: () => setCurrentId(h.targetRoomId),
  }))

  return (
    <div className="relative h-full w-full bg-black overflow-hidden select-none">
      <PanoramaViewer
        imageUrl={current.panoramaUrl}
        hotspots={hotspots}
        showControls={false}
        autoRotate={-1}
      />

      {/* Top overlay: title */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-white text-sm sm:text-base font-semibold truncate drop-shadow">
              {property.title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-white/80 text-xs sm:text-sm truncate flex items-center gap-1">
                <DoorOpen className="h-3.5 w-3.5" /> {current.name}
              </span>
              {property.price && (
                <span className="hidden sm:inline text-white/80 text-xs">
                  · {property.price}
                </span>
              )}
              {property.surface && (
                <span className="hidden sm:inline text-white/80 text-xs">
                  · {property.surface}
                </span>
              )}
            </div>
          </div>
          {!embed && property.user.agencyName && (
            <div className="hidden sm:block text-right text-white/80 text-xs">
              <div>{property.user.agencyName}</div>
            </div>
          )}
        </div>
      </div>

      {/* Room navigation */}
      {property.rooms.length > 1 && (
        <>
          <button
            onClick={prevRoom}
            aria-label="Pièce précédente"
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur text-white flex items-center justify-center transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextRoom}
            aria-label="Pièce suivante"
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur text-white flex items-center justify-center transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setShowRooms((s) => !s)}
            className="bg-white/10 hover:bg-white/20 backdrop-blur text-white text-xs sm:text-sm px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <MapPin className="h-3.5 w-3.5" />
            {property.rooms.length} pièces
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-white/60 text-xs px-2 py-1.5 bg-white/5 rounded">
              <span>Faites glisser pour regarder autour</span>
            </div>
            <button
              onClick={toggleFullscreen}
              aria-label="Plein écran"
              className="bg-white/10 hover:bg-white/20 backdrop-blur text-white p-2 rounded-lg transition"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Thumbnails / rooms list */}
        {showRooms && (
          <div className="mt-3 overflow-x-auto pb-1 animate-slide-up">
            <div className="flex gap-2">
              {property.rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setCurrentId(r.id)
                    setShowRooms(false)
                  }}
                  className={cn(
                    'flex-shrink-0 rounded-lg overflow-hidden border-2 transition',
                    r.id === currentId
                      ? 'border-brand-500 ring-2 ring-brand-500/40'
                      : 'border-white/20 hover:border-white/60'
                  )}
                >
                  <div className="w-28 h-16 bg-slate-800 relative">
                    {r.thumbnailUrl && (
                      <img
                        src={r.thumbnailUrl}
                        alt={r.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1">
                      <span className="text-[10px] text-white font-medium truncate block">
                        {r.name}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
