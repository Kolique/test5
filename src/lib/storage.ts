import { promises as fs } from 'fs'
import path from 'path'
import { shortId } from './utils'

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads')

export async function ensureUploadDir(subdir: string) {
  const dir = path.join(UPLOAD_ROOT, subdir)
  await fs.mkdir(dir, { recursive: true })
  return dir
}

export function publicUrl(subdir: string, filename: string) {
  return `/uploads/${subdir}/${filename}`
}

export async function saveUpload(
  subdir: string,
  buffer: Buffer,
  ext: string
): Promise<{ filePath: string; url: string; filename: string }> {
  const dir = await ensureUploadDir(subdir)
  const filename = `${shortId()}${ext.startsWith('.') ? ext : `.${ext}`}`
  const filePath = path.join(dir, filename)
  await fs.writeFile(filePath, buffer)
  return { filePath, url: publicUrl(subdir, filename), filename }
}

export async function removeUpload(url: string) {
  if (!url.startsWith('/uploads/')) return
  const p = path.join(process.cwd(), 'public', url)
  try {
    await fs.unlink(p)
  } catch {
    /* ignore */
  }
}

export function localPathFromUrl(url: string) {
  return path.join(process.cwd(), 'public', url)
}
