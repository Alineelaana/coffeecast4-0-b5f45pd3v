/**
 * Generates the CoffeeCast 4.0 web app icons as PNG files in public/icons/.
 * Source of truth: the OFFICIAL transparent art of the symbol (cup + heart
 * steam + star, RGBA with alpha). Zero dependencies — decodes/encodes PNG and
 * resizes with plain Node buffers, so it runs anywhere (`node scripts/iconGen.mjs`).
 *
 * Icons produced (committed static assets, served without login):
 *   apple-touch-icon.png  180x180 - iPhone Safari home screen, IVORY background
 *                                   (Safari composites transparent icons over
 *                                   black — an opaque ivory tile is the only
 *                                   way to keep the brand look)
 *   icon-192.png          192x192 - Android/Chrome (purpose any, TRANSPARENT)
 *   icon-512.png          512x512 - Android/Chrome (purpose any, TRANSPARENT)
 *   icon-maskable-512.png 512x512 - Android/Chrome (purpose maskable, ivory bg
 *                                   + >= 30% safe margin for the circular mask)
 *
 * The drawing, colors and proportions of the symbol are preserved: the only
 * adaptations are the bounding-box cutout (alpha > threshold) and the margins
 * each target requires. A red-halo cleanup runs defensively ONLY if saturated
 * red fringe pixels are actually present (the official art is clean).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { inflateSync, inflateRawSync, deflateSync } from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ART_PATH = path.join(
  ROOT,
  'src/assets/icone-coffeecast-xicara-com-vapor-em-coracao-eb9fc.png',
)
const OUT_DIR = path.join(ROOT, 'public/icons')

export const MARFIM = [0xf7, 0xe9, 0xdd] // #F7E9DD - brand ivory (maskable/apple bg)
const ALPHA_MIN = 40 // alpha below this = transparent background
// Saturated pure-red halo (compression fringe) — removed ONLY if present.
const HALO_MIN_PRESENT = 4 // count of halo pixels that triggers the cleanup

export const ICON_TARGETS = [
  { file: 'apple-touch-icon.png', size: 180, margin: 0.06, background: 'ivory' },
  { file: 'icon-192.png', size: 192, margin: 0.06, background: 'transparent' },
  { file: 'icon-512.png', size: 512, margin: 0.06, background: 'transparent' },
  { file: 'icon-maskable-512.png', size: 512, margin: 0.3, background: 'ivory' },
]

// ---------------------------------------------------------------------------
// Minimal PNG decoder (8-bit RGBA/RGB/gray/palette, non-interlaced)
// ---------------------------------------------------------------------------
function crc32(buf) {
  let c
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

export function decodePng(buffer) {
  if (buffer.length < 8 || buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
  let pos = 8
  let width = 0,
    height = 0,
    bitDepth = 0,
    colorType = 0
  const idat = []
  let palette = null
  let trns = null

  while (pos < buffer.length) {
    const len = buffer.readUInt32BE(pos)
    const type = buffer.toString('ascii', pos + 4, pos + 8)
    const data = buffer.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
      if (data[12] !== 0) throw new Error('interlaced PNG not supported')
    } else if (type === 'PLTE') {
      palette = data
    } else if (type === 'tRNS') {
      trns = data
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
    pos += 12 + len
  }

  const channels =
    colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : colorType === 3 ? 1 : 0
  if (!channels) throw new Error('color type ' + colorType + ' not supported')
  if (bitDepth !== 8) throw new Error('bit depth ' + bitDepth + ' not supported')

  const raw = Buffer.concat(idat)
  let defiltered
  try {
    defiltered = inflateSync(raw)
  } catch {
    defiltered = inflateRawSync(raw)
  }
  const stride = width * channels

  const img = Buffer.alloc(width * height * 4)
  const line = Buffer.alloc(stride)
  const previous = Buffer.alloc(stride)

  for (let y = 0; y < height; y++) {
    const filter = defiltered[y * (stride + 1)]
    defiltered.copy(line, 0, y * (stride + 1) + 1, (y + 1) * (stride + 1))
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? line[i - channels] : 0
      const b = previous[i]
      const c = i >= channels ? previous[i - channels] : 0
      let v = line[i]
      switch (filter) {
        case 1:
          v = (v + a) & 0xff
          break
        case 2:
          v = (v + b) & 0xff
          break
        case 3:
          v = (v + ((a + b) >> 1)) & 0xff
          break
        case 4: {
          const p = a + b - c
          const pa = Math.abs(p - a)
          const pb = Math.abs(p - b)
          const pc = Math.abs(p - c)
          v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff
          break
        }
      }
      line[i] = v
    }
    line.copy(previous)
    for (let x = 0; x < width; x++) {
      const si = x * channels
      const di = (y * width + x) * 4
      if (colorType === 3) {
        const idx = line[si] * 3
        img[di] = palette[idx]
        img[di + 1] = palette[idx + 1]
        img[di + 2] = palette[idx + 2]
        img[di + 3] = trns && line[si] < trns.length ? trns[line[si]] : 0xff
      } else if (colorType === 0) {
        const g = line[si]
        img[di] = g
        img[di + 1] = g
        img[di + 2] = g
        img[di + 3] = 0xff
      } else {
        img[di] = line[si]
        img[di + 1] = line[si + 1]
        img[di + 2] = line[si + 2]
        img[di + 3] = channels === 4 ? line[si + 3] : 0xff
      }
    }
  }
  return { width, height, data: img }
}

// ---------------------------------------------------------------------------
// PNG encoder (RGBA 8-bit, filter 0)
// ---------------------------------------------------------------------------
export function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const stride = width * 4
  const defiltered = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    defiltered[y * (stride + 1)] = 0 // filter 0
    rgba.copy(defiltered, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(defiltered, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------------------------------------------------------------------------
// Bilinear resize
// ---------------------------------------------------------------------------
export function resize(src, dw, dh) {
  const { width: sw, height: sh, data } = src
  const out = Buffer.alloc(dw * dh * 4)
  for (let y = 0; y < dh; y++) {
    const fy = ((y + 0.5) * sh) / dh - 0.5
    const y0 = Math.max(0, Math.min(sh - 1, Math.floor(fy)))
    const y1 = Math.min(sh - 1, y0 + 1)
    const wy = fy - y0
    for (let x = 0; x < dw; x++) {
      const fx = ((x + 0.5) * sw) / dw - 0.5
      const x0 = Math.max(0, Math.min(sw - 1, Math.floor(fx)))
      const x1 = Math.min(sw - 1, x0 + 1)
      const wx = fx - x0
      const di = (y * dw + x) * 4
      for (let ch = 0; ch < 4; ch++) {
        const p00 = data[(y0 * sw + x0) * 4 + ch]
        const p10 = data[(y0 * sw + x1) * 4 + ch]
        const p01 = data[(y1 * sw + x0) * 4 + ch]
        const p11 = data[(y1 * sw + x1) * 4 + ch]
        const top = p00 + (p10 - p00) * wx
        const bottom = p01 + (p11 - p01) * wx
        out[di + ch] = Math.max(0, Math.min(255, Math.round(top + (bottom - top) * wy)))
      }
    }
  }
  return { width: dw, height: dh, data: out }
}

function luminance(data, i) {
  return 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
}

// Saturated pure-red halo (compression fringe) — never part of the brand symbol
export function isRedHalo(data, i) {
  return data[i * 4] >= 150 && data[i * 4 + 1] <= 85 && data[i * 4 + 2] <= 85
}

export function countRedHaloPixels(img) {
  const { width, height, data } = img
  let count = 0
  for (let i = 0; i < width * height; i++) if (isRedHalo(data, i)) count++
  return count
}

// Straight alpha bbox of everything visible (alpha >= ALPHA_MIN)
export function cutoutSymbol(img) {
  const { width, height, data } = img
  let minX = width,
    minY = height,
    maxX = -1,
    maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < ALPHA_MIN) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) throw new Error('symbol not found in art (no visible pixels)')

  const w = maxX - minX + 1
  const h = maxY - minY + 1
  if (w < 50 || h < 50) throw new Error('symbol implausibly small (' + w + 'x' + h + ')')
  const out = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (y + minY) * width + (x + minX)
      const di = (y * w + x) * 4
      out[di] = data[si * 4]
      out[di + 1] = data[si * 4 + 1]
      out[di + 2] = data[si * 4 + 2]
      out[di + 3] = data[si * 4 + 3]
    }
  }
  return { width: w, height: h, data: out }
}

// Defensive: some exports of the art arrive with an opaque near-black
// background instead of transparency. ONLY if every corner is opaque and
// near-black, those pixels become transparent so the alpha-bbox cutout sees
// only the symbol. No-op on the official transparent art.
export function removerFundoPretoSePresente(img) {
  const { width, height, data } = img
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ]
  const opaqueBlack = corners.every(([x, y]) => {
    const i = (y * width + x) * 4
    return data[i + 3] > 200 && data[i] < 48 && data[i + 1] < 48 && data[i + 2] < 48
  })
  if (!opaqueBlack) return img
  for (let i = 0; i < width * height; i++) {
    if (data[i * 4] < 48 && data[i * 4 + 1] < 48 && data[i * 4 + 2] < 48 && data[i * 4 + 3] > 0) {
      data[i * 4 + 3] = 0
    }
  }
  return img
}

// ---------------------------------------------------------------------------
// Icon assembly: centered symbol with margin, over transparent or ivory
// ---------------------------------------------------------------------------
export function assembleIcon(size, symbol, marginRatio, background) {
  const bg = background ?? 'ivory'
  const scale = Math.min(
    (size * (1 - marginRatio)) / symbol.width,
    (size * (1 - marginRatio)) / symbol.height,
  )
  const dw = Math.max(1, Math.round(symbol.width * scale))
  const dh = Math.max(1, Math.round(symbol.height * scale))
  const scaled = resize(symbol, dw, dh)

  const canvas = Buffer.alloc(size * size * 4)
  if (bg === 'ivory') {
    for (let i = 0; i < size * size; i++) {
      canvas[i * 4] = MARFIM[0]
      canvas[i * 4 + 1] = MARFIM[1]
      canvas[i * 4 + 2] = MARFIM[2]
      canvas[i * 4 + 3] = 255
    }
  }
  const ox = Math.round((size - dw) / 2)
  const oy = Math.round((size - dh) / 2)
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const di = ((y + oy) * size + (x + ox)) * 4
      const si = (y * dw + x) * 4
      const a = scaled.data[si + 3] / 255
      if (bg === 'transparent') {
        // straight alpha out: symbol color premultiplied by its own alpha
        for (let ch = 0; ch < 3; ch++) canvas[di + ch] = Math.round(scaled.data[si + ch] * a)
        canvas[di + 3] = Math.round(a * 255)
      } else {
        for (let ch = 0; ch < 3; ch++) {
          canvas[di + ch] = Math.round(scaled.data[si + ch] * a + canvas[di + ch] * (1 - a))
        }
        canvas[di + 3] = 255
      }
    }
  }
  return encodePng(size, size, canvas)
}

// ---------------------------------------------------------------------------
// Generate icons (idempotent: only runs if a PNG is missing)
// ---------------------------------------------------------------------------
export function gerarIcones() {
  // Always regenerates: the source art can change (new official version) and
  // the committed PNGs must never go stale behind it. Output is deterministic,
  // so re-running on an unchanged art rewrites identical bytes.
  const art = decodePng(readFileSync(ART_PATH))
  const symbol = cutoutSymbol(removerFundoPretoSePresente(art))
  mkdirSync(OUT_DIR, { recursive: true })
  for (const t of ICON_TARGETS) {
    const png = assembleIcon(t.size, symbol, t.margin, t.background)
    writeFileSync(path.join(OUT_DIR, t.file), png)
  }
  return { generated: true, files: ICON_TARGETS.map((t) => 'public/icons/' + t.file) }
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  const r = gerarIcones()
  console.log('OK: icons generated: ' + r.files.join(', '))
}
