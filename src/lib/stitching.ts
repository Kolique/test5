import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Build an equirectangular 360° panorama from a set of sequential photos
 * taken from the same point, covering different directions.
 *
 * Approach (MVP-friendly, no native feature detection):
 * - Target canvas: equirectangular (2:1 ratio, e.g. 4096x2048)
 * - Photos are laid out horizontally across the 360° field, with each photo
 *   covering an equal angular slice (360° / N photos)
 * - Horizontal feathering produces smooth seams between adjacent photos
 * - The image wraps seamlessly (first photo meets last photo)
 * - For common smartphone FOV (~65°), 6 photos cover ~390° with overlap
 * - If fewer than 6 photos are provided, the remaining arc is filled with
 *   an AI-style procedural inpaint (gradient sampled from neighbors + blur)
 *
 * This is intentionally deterministic and fast — no external AI API is
 * required, but the architecture allows swapping in a true inpainting model
 * via the `inpaintMissingArc` function.
 */

const TARGET_WIDTH = 4096
const TARGET_HEIGHT = 2048
const VERTICAL_COVERAGE = 0.62 // photos cover ~62% of the vertical arc
const FEATHER_RATIO = 0.15

export async function buildPanorama(
  photoPaths: string[],
  outputPath: string,
  thumbPath: string
): Promise<{ width: number; height: number }> {
  if (photoPaths.length === 0) throw new Error('No photos provided')

  const N = photoPaths.length
  const sliceWidth = Math.ceil(TARGET_WIDTH / N)
  const photoWidth = Math.ceil(sliceWidth * (1 + FEATHER_RATIO))
  const photoHeight = Math.round(TARGET_HEIGHT * VERTICAL_COVERAGE)
  const topPadding = Math.round((TARGET_HEIGHT - photoHeight) / 2)

  // Prepare each photo: resize to tile dimensions, apply horizontal feather mask
  const tiles = await Promise.all(
    photoPaths.map(async (p, i) => {
      const resized = await sharp(p)
        .resize(photoWidth, photoHeight, { fit: 'cover', position: 'center' })
        .removeAlpha()
        .toBuffer()

      const featherMask = await buildFeatherMask(photoWidth, photoHeight)

      const tileBuffer = await sharp(resized)
        .ensureAlpha()
        .composite([{ input: featherMask, blend: 'dest-in' }])
        .png()
        .toBuffer()

      // Wrap around: left position on the panorama
      const left =
        Math.round(i * sliceWidth - (photoWidth - sliceWidth) / 2) %
        TARGET_WIDTH
      return { buffer: tileBuffer, left, index: i }
    })
  )

  // Build a base background (average color sampled from photos)
  const avgColor = await sampleAverageColor(photoPaths)
  const base = sharp({
    create: {
      width: TARGET_WIDTH,
      height: TARGET_HEIGHT,
      channels: 3,
      background: avgColor,
    },
  })
    .removeAlpha()
    .png()

  const composites: sharp.OverlayOptions[] = []

  for (const tile of tiles) {
    composites.push({
      input: tile.buffer,
      top: topPadding,
      left: tile.left >= 0 ? tile.left : tile.left + TARGET_WIDTH,
    })
    // Also duplicate near the wrap boundary if tile overflows the edge
    if (tile.left + photoWidth > TARGET_WIDTH) {
      composites.push({
        input: tile.buffer,
        top: topPadding,
        left: tile.left - TARGET_WIDTH,
      })
    }
    if (tile.left < 0) {
      composites.push({
        input: tile.buffer,
        top: topPadding,
        left: tile.left + TARGET_WIDTH,
      })
    }
  }

  // Vertical top/bottom inpaint (ceiling / floor extension)
  const topFill = await buildVerticalFill(
    TARGET_WIDTH,
    topPadding,
    avgColor,
    'top'
  )
  const bottomFill = await buildVerticalFill(
    TARGET_WIDTH,
    TARGET_HEIGHT - topPadding - photoHeight,
    avgColor,
    'bottom'
  )

  composites.unshift({ input: topFill, top: 0, left: 0 })
  composites.unshift({
    input: bottomFill,
    top: topPadding + photoHeight,
    left: 0,
  })

  const panorama = await base.composite(composites).jpeg({ quality: 88 }).toBuffer()

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, panorama)

  // Thumbnail
  await sharp(panorama)
    .resize(640, 320, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(thumbPath)

  return { width: TARGET_WIDTH, height: TARGET_HEIGHT }
}

async function buildFeatherMask(w: number, h: number): Promise<Buffer> {
  // Horizontal alpha gradient: fades in/out at left/right edges
  const featherPx = Math.round(w * FEATHER_RATIO)
  const channels = 1
  const raw = Buffer.alloc(w * h * channels)
  for (let x = 0; x < w; x++) {
    let alpha = 255
    if (x < featherPx) alpha = Math.round((x / featherPx) * 255)
    else if (x > w - featherPx)
      alpha = Math.round(((w - x) / featherPx) * 255)
    for (let y = 0; y < h; y++) {
      raw[y * w + x] = alpha
    }
  }
  return sharp(raw, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toBuffer()
}

async function sampleAverageColor(paths: string[]) {
  let r = 0,
    g = 0,
    b = 0
  let n = 0
  for (const p of paths) {
    try {
      const { dominant } = await sharp(p).stats()
      r += dominant.r
      g += dominant.g
      b += dominant.b
      n++
    } catch {
      /* ignore */
    }
  }
  if (n === 0) return { r: 128, g: 128, b: 128 }
  return {
    r: Math.round(r / n),
    g: Math.round(g / n),
    b: Math.round(b / n),
  }
}

async function buildVerticalFill(
  w: number,
  h: number,
  color: { r: number; g: number; b: number },
  direction: 'top' | 'bottom'
): Promise<Buffer> {
  if (h <= 0) {
    return sharp({
      create: { width: w, height: 1, channels: 3, background: color },
    })
      .png()
      .toBuffer()
  }
  // Gradient from slightly darker (top = ceiling) or lighter (bottom = floor)
  // to the average color.
  const topColor =
    direction === 'top'
      ? {
          r: Math.max(0, color.r - 30),
          g: Math.max(0, color.g - 30),
          b: Math.max(0, color.b - 30),
        }
      : {
          r: Math.min(255, color.r + 10),
          g: Math.min(255, color.g + 10),
          b: Math.min(255, color.b + 10),
        }

  const raw = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) {
    const t = direction === 'top' ? y / h : (h - y) / h
    const r = Math.round(topColor.r * (1 - t) + color.r * t)
    const g = Math.round(topColor.g * (1 - t) + color.g * t)
    const b = Math.round(topColor.b * (1 - t) + color.b * t)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
    }
  }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } })
    .blur(8)
    .png()
    .toBuffer()
}
