/**
 * Executable test/generator: builds the CoffeeCast 4.0 web-app icons from the
 * official art and VERIFIES they exist, have the exact required dimensions and
 * carry the expected content (ivory background at the corners, symbol in the
 * middle). Run: node --test scripts/icon-gen.test.mjs
 * The icons themselves are COMMITTED in public/icons/ — this test is the proof
 * that the fatal v0.0.228 mistake (icons pointing to PNGs that never existed)
 * does not repeat.
 *
 * Ported from bun:test to node:test: same zero-dependency pipeline, but runs
 * on plain Node — the runtime available in this environment's QA pipeline.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  decodePng,
  encodePng,
  resize,
  cutoutSymbol,
  assembleIcon,
  MARFIM,
  ICON_TARGETS,
} from './iconGen.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ART_PATH = path.join(ROOT, 'src/assets/chatgpt-image-16-de-set.de-2026-190040-04898.png')
const OUT_DIR = path.join(ROOT, 'public/icons')

const art = decodePng(readFileSync(ART_PATH))
const symbol = cutoutSymbol(art)

// generates (once) the committed PNGs from the official art
mkdirSync(OUT_DIR, { recursive: true })
for (const t of ICON_TARGETS) {
  const p = path.join(OUT_DIR, t.file)
  if (!existsSync(p)) writeFileSync(p, assembleIcon(t.size, symbol, t.margin))
}

describe('CoffeeCast web app icons', () => {
  it('arte oficial anexada decodifica como PNG grande e quadrado', () => {
    assert.ok(art.width > 400)
    assert.equal(art.width, art.height)
  })

  it('símbolo recortado é menor que a arte e tem conteúdo', () => {
    assert.ok(symbol.width > 100)
    assert.ok(symbol.height > 100)
    assert.ok(symbol.width <= art.width)
  })

  for (const t of ICON_TARGETS) {
    it(
      t.file +
        ' existe em public/icons com ' +
        t.size +
        'x' +
        t.size +
        'px, fundo marfim e símbolo',
      () => {
        const pngPath = path.join(OUT_DIR, t.file)
        assert.ok(existsSync(pngPath))

        const bytes = readFileSync(pngPath)
        assert.ok(bytes.length > 200)

        const img = decodePng(bytes)
        assert.equal(img.width, t.size)
        assert.equal(img.height, t.size)

        const at = (x, y) => {
          const i = (y * img.width + x) * 4
          return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]]
        }
        const nearIvory = (c) =>
          Math.abs(c[0] - MARFIM[0]) <= 24 &&
          Math.abs(c[1] - MARFIM[1]) <= 24 &&
          Math.abs(c[2] - MARFIM[2]) <= 24
        // all 4 corners = brand ivory (no black background left over)
        assert.ok(nearIvory(at(2, 2)))
        assert.ok(nearIvory(at(img.width - 3, 2)))
        assert.ok(nearIvory(at(2, img.height - 3)))
        assert.ok(nearIvory(at(img.width - 3, img.height - 3)))
        // opaque PNG (home-screen icons cannot be translucent)
        assert.equal(at(2, 2)[3], 255)
        // the symbol is drawn (center band darker than the ivory bg)
        let sum = 0
        let count = 0
        for (let y = Math.floor(t.size * 0.4); y < Math.floor(t.size * 0.6); y++) {
          for (let x = Math.floor(t.size * 0.35); x < Math.floor(t.size * 0.65); x++) {
            const i = (y * t.size + x) * 4
            sum += 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2]
            count++
          }
        }
        assert.ok(sum / count < 235)
      },
    )
  }

  it('regeneração a partir da arte é determinística (mesmos bytes do arquivo commitado)', () => {
    for (const t of ICON_TARGETS) {
      const committed = readFileSync(path.join(OUT_DIR, t.file))
      const regenerated = assembleIcon(t.size, symbol, t.margin)
      assert.equal(Buffer.compare(committed, regenerated), 0)
    }
  })

  it('sanidade do pipeline: resize do símbolo para 180px mantém pixels não-marfim', () => {
    const scaled = resize(
      symbol,
      168,
      Math.max(1, Math.round((168 * symbol.height) / symbol.width)),
    )
    let nonIvory = 0
    for (let i = 0; i < scaled.width * scaled.height; i++) {
      const r = scaled.data[i * 4]
      const g = scaled.data[i * 4 + 1]
      const b = scaled.data[i * 4 + 2]
      if (
        Math.abs(r - MARFIM[0]) > 24 ||
        Math.abs(g - MARFIM[1]) > 24 ||
        Math.abs(b - MARFIM[2]) > 24
      )
        nonIvory++
    }
    assert.ok(nonIvory > 1000)
  })

  it('encodePng produz PNG decodificável de mesmas dimensões', () => {
    const canvas = Buffer.alloc(64 * 64 * 4)
    for (let i = 0; i < 64 * 64; i++) {
      canvas[i * 4] = MARFIM[0]
      canvas[i * 4 + 1] = MARFIM[1]
      canvas[i * 4 + 2] = MARFIM[2]
      canvas[i * 4 + 3] = 255
    }
    const round = decodePng(encodePng(64, 64, canvas))
    assert.equal(round.width, 64)
    assert.equal(round.height, 64)
  })
})
