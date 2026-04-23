'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    pannellum: any
  }
}

export type ViewerHotspot = {
  pitch: number
  yaw: number
  label?: string
  onClick?: () => void
}

type Props = {
  imageUrl: string
  hotspots?: ViewerHotspot[]
  autoLoad?: boolean
  autoRotate?: number
  onReady?: () => void
  onClickAt?: (pitch: number, yaw: number) => void
  showControls?: boolean
  pitch?: number
  yaw?: number
  hfov?: number
}

let pannellumLoader: Promise<void> | null = null

function loadPannellum(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.pannellum) return Promise.resolve()
  if (pannellumLoader) return pannellumLoader

  pannellumLoader = new Promise<void>((resolve, reject) => {
    // CSS
    const cssId = 'pannellum-css'
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link')
      link.id = cssId
      link.rel = 'stylesheet'
      link.href =
        'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css'
      document.head.appendChild(link)
    }
    // JS
    const scriptId = 'pannellum-js'
    if (document.getElementById(scriptId)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = scriptId
    script.src =
      'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('Failed to load Pannellum'))
    document.body.appendChild(script)
  })
  return pannellumLoader
}

export default function PanoramaViewer({
  imageUrl,
  hotspots = [],
  autoLoad = true,
  autoRotate = 0,
  onReady,
  onClickAt,
  showControls = true,
  pitch = 0,
  yaw = 0,
  hfov = 100,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await loadPannellum()
      if (cancelled || !ref.current) return

      if (viewerRef.current) {
        try {
          viewerRef.current.destroy()
        } catch {}
        viewerRef.current = null
      }

      const cfg: any = {
        type: 'equirectangular',
        panorama: imageUrl,
        autoLoad,
        autoRotate,
        showControls,
        showFullscreenCtrl: showControls,
        showZoomCtrl: showControls,
        mouseZoom: true,
        pitch,
        yaw,
        hfov,
        minHfov: 50,
        maxHfov: 120,
        compass: false,
        hotSpots: hotspots.map((h, i) => ({
          pitch: h.pitch,
          yaw: h.yaw,
          type: 'custom',
          cssClass: 'custom-hotspot',
          createTooltipFunc: (el: HTMLDivElement) => {
            if (h.label) {
              const label = document.createElement('div')
              label.className = 'hotspot-label'
              label.textContent = h.label
              el.appendChild(label)
            }
          },
          clickHandlerFunc: () => h.onClick?.(),
        })),
      }

      viewerRef.current = window.pannellum.viewer(ref.current, cfg)
      viewerRef.current.on('load', () => onReady?.())

      if (onClickAt && ref.current) {
        const handler = (e: MouseEvent | TouchEvent) => {
          if (!viewerRef.current) return
          try {
            let clientX: number, clientY: number
            if ('touches' in e && e.touches.length > 0) {
              clientX = e.touches[0].clientX
              clientY = e.touches[0].clientY
            } else if ('clientX' in e) {
              clientX = (e as MouseEvent).clientX
              clientY = (e as MouseEvent).clientY
            } else return
            const coords = viewerRef.current.mouseEventToCoords({
              clientX,
              clientY,
            })
            if (coords) onClickAt(coords[0], coords[1])
          } catch {}
        }
        ref.current.addEventListener('click', handler as EventListener)
        ;(ref.current as any).__clickHandler = handler
      }
    })()

    return () => {
      cancelled = true
      if (ref.current && (ref.current as any).__clickHandler) {
        ref.current.removeEventListener(
          'click',
          (ref.current as any).__clickHandler
        )
      }
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy()
        } catch {}
        viewerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, JSON.stringify(hotspots.map((h) => [h.pitch, h.yaw, h.label]))])

  return <div ref={ref} className="w-full h-full min-h-[300px]" />
}
