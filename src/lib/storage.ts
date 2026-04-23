import { put, del } from '@vercel/blob'
import { shortId } from './utils'

export async function saveUpload(
  subdir: string,
  buffer: Buffer,
  ext: string
): Promise<{ url: string; filename: string }> {
  const filename = `${shortId()}${ext.startsWith('.') ? ext : `.${ext}`}`
  const pathname = `${subdir}/${filename}`.replace(/\/+/g, '/')
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType: guessContentType(ext),
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  })
  return { url: blob.url, filename }
}

export async function removeUpload(url: string) {
  if (!url) return
  try {
    await del(url)
  } catch {
    /* ignore — blob might already be gone */
  }
}

export async function fetchAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok)
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  return Buffer.from(await res.arrayBuffer())
}

function guessContentType(ext: string): string {
  const e = ext.toLowerCase().replace(/^\./, '')
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg'
  if (e === 'png') return 'image/png'
  if (e === 'webp') return 'image/webp'
  return 'application/octet-stream'
}
