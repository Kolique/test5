'use client'

import { useState } from 'react'
import { X, Plus, Trash2, MapPin, Check, ArrowRight } from 'lucide-react'
import PanoramaViewer from './PanoramaViewer'

type Room = {
  id: string
  name: string
  panoramaUrl: string | null
  hotspots: {
    id: string
    sourceRoomId: string
    targetRoomId: string
    pitch: number
    yaw: number
    label?: string | null
    target: { id: string; name: string }
  }[]
}

export default function HotspotEditor({
  room,
  allRooms,
  onClose,
  onSaved,
}: {
  room: Room
  allRooms: Room[]
  onClose: () => void
  onSaved: () => void
}) {
  const [hotspots, setHotspots] = useState(room.hotspots)
  const [pending, setPending] = useState<{ pitch: number; yaw: number } | null>(
    null
  )
  const [targetId, setTargetId] = useState<string>(
    allRooms.find((r) => r.id !== room.id)?.id || ''
  )
  const [saving, setSaving] = useState(false)

  const otherRooms = allRooms.filter((r) => r.id !== room.id && r.panoramaUrl)

  async function addHotspot() {
    if (!pending || !targetId) return
    setSaving(true)
    const res = await fetch(`/api/rooms/${room.id}/hotspots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetRoomId: targetId,
        pitch: pending.pitch,
        yaw: pending.yaw,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const json = await res.json()
      setHotspots((h) => [...h, json])
      setPending(null)
      onSaved()
    }
  }

  async function deleteHotspot(id: string) {
    const res = await fetch(`/api/hotspots/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setHotspots((h) => h.filter((x) => x.id !== id))
      onSaved()
    }
  }

  if (!room.panoramaUrl) return null

  const viewerHotspots = [
    ...hotspots.map((h) => ({
      pitch: h.pitch,
      yaw: h.yaw,
      label: h.target.name,
    })),
    ...(pending
      ? [{ pitch: pending.pitch, yaw: pending.yaw, label: 'Nouveau point' }]
      : []),
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" />
              Hotspots — {room.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cliquez dans le panorama pour placer un point de navigation.
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          <div className="flex-1 relative bg-slate-900 min-h-[300px]">
            <PanoramaViewer
              imageUrl={room.panoramaUrl}
              hotspots={viewerHotspots}
              onClickAt={(pitch, yaw) => setPending({ pitch, yaw })}
              showControls={true}
            />
          </div>
          <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col overflow-y-auto">
            {otherRooms.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-600">
                  Ajoutez d'autres pièces avec panoramas prêts pour créer des
                  connexions.
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    Ajouter un hotspot
                  </h3>
                  {pending ? (
                    <div className="space-y-3">
                      <div className="text-xs text-slate-600 bg-white rounded-md p-2 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span>Position choisie</span>
                          <button
                            onClick={() => setPending(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="font-mono text-[10px] mt-1 text-slate-500">
                          pitch: {pending.pitch.toFixed(1)}° yaw:{' '}
                          {pending.yaw.toFixed(1)}°
                        </div>
                      </div>
                      <div>
                        <label className="label text-xs">Pièce de destination</label>
                        <select
                          value={targetId}
                          onChange={(e) => setTargetId(e.target.value)}
                          className="input text-sm"
                        >
                          {otherRooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={addHotspot}
                        disabled={saving || !targetId}
                        className="btn-primary w-full"
                      >
                        <Check className="h-4 w-4" /> Valider le hotspot
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Cliquez dans la vue 360° à l'endroit où l'on doit pouvoir
                      accéder à une autre pièce.
                    </p>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    Hotspots existants
                  </h3>
                  {hotspots.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Aucun hotspot pour l'instant.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {hotspots.map((h) => (
                        <li
                          key={h.id}
                          className="flex items-center gap-2 p-2 rounded-md bg-slate-50"
                        >
                          <MapPin className="h-3.5 w-3.5 text-brand-600 flex-shrink-0" />
                          <span className="text-sm text-slate-900 flex-1 flex items-center gap-1 truncate">
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            {h.target.name}
                          </span>
                          <button
                            onClick={() => deleteHotspot(h.id)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
