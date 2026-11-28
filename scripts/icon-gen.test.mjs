/**
 * Executable test: builds the CoffeeCast 4.0 web-app icons from the OFFICIAL
 * TRANSPARENT art and VERIFIES the committed PNGs have the exact required
 * dimensions, the expected background (transparent for "any" icons, ivory
 * #F7E9DD for maskable/apple) and the symbol present in the middle.
 * Run: node --test scripts/icon-gen.test.mjs
 *
 * Fonte: src/assets/icone-coffeecast-xicara-com-vapor-em-coracao-eb9fc.png
 * (nova arte oficial anexada pelo usuário — xícara rosé com vapor em coração
 * e estrela, fundo transparente).
 *
 * The icons themselves are COMMITTED in public/icons/ by the user running
 * `node scripts/iconGen.mjs` (the builder blocks AI writes to *.png) — this
 * test is the proof that the v0.0.228 mistake (icons pointing to PNGs that
 * never existed) does not repeat.
 *
 * NOTE: the committed PNGs in this repository were generated from the OLD
 * black-background art. After running `node scripts/iconGen.mjs` locally with
 * the new transparent art, this test validates the NEW generation.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  decodePng,
  encodePng,
  resize,
  cutoutSymbol,
  assembleIcon,
  countRedHaloPixels,
  MARFIM,
  ICON_TARGETS,
} from './iconGen.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ART_PATH = path.join(
  ROOT,
  'src/assets/icone-coffeecast-xicara-com-vapor-em-coracao-eb9fc.png',
)
const OUT_DIR = path.join(ROOT, 'public/icons')

const art = decodePng(readFileSync(ART_PATH))
const symbol = cutoutSymbol(removerFundoPretoSePresente(art))

describe('CoffeeCast web app icons', () => {
  it('arte oficial (transparente) decodifica como PNG grande (pode ser retangular)', () => {
    assert.ok(art.width > 400)
    assert.ok(art.height > 400)
    // corners transparent (the art is the symbol over alpha, not over black)
    const at = (x, y) => {
      const i = (y * art.width + x) * 4
      return [art.data[i], art.data[i + 1], art.data[i + 2], art.data[i + 3]]
    }
    assert.ok(at(0, 0)[3] < 40)
    assert.ok(at(art.width - 1, art.height - 1)[3] < 40)
  })

  it('símbolo recortado é menor que a arte e tem conteúdo opaco', () => {
    assert.ok(symbol.width > 100)
    assert.ok(symbol.height > 100)
    assert.ok(symbol.width <= art.width)
    let opaque = 0
    for (let i = 0; i < symbol.width * symbol.height; i++) {
      if (symbol.data[i * 4 + 3] >= 200) opaque++
    }
    assert.ok(opaque > 1000)
  })

  it('arte anexa não tem halo vermelho relevante (limpeza defensiva inativa)', () => {
    assert.ok(countRedHaloPixels(art) < 4)
  })

  for (const t of ICON_TARGETS) {
    it(
      t.file +
        ' existe em public/icons com ' +
        t.size +
        'x' +
        t.size +
        'px, fundo correto e símbolo',
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

        if (t.background === 'transparent') {
          // all 4 corners fully transparent (no black, no ivory residue)
          for (const [x, y] of [
            [2, 2],
            [img.width - 3, 2],
            [2, img.height - 3],
            [img.width - 3, img.height - 3],
          ]) {
            assert.equal(at(x, y)[3], 0, `corner ${x},${y} deve ser alfa 0`)
          }
        } else {
          // all 4 corners = brand ivory, fully opaque (no black background left)
          assert.ok(nearIvory(at(2, 2)))
          assert.ok(nearIvory(at(img.width - 3, 2)))
          assert.ok(nearIvory(at(2, img.height - 3)))
          assert.ok(nearIvory(at(img.width - 3, img.height - 3)))
          assert.equal(at(2, 2)[3], 255)
        }

        // the symbol is drawn in the central band (non-background pixels there)
        let symbolPx = 0
        for (let y = Math.floor(t.size * 0.4); y < Math.floor(t.size * 0.6); y++) {
          for (let x = Math.floor(t.size * 0.35); x < Math.floor(t.size * 0.65); x++) {
            const i = (y * t.size + x) * 4
            const [r, g, b, a] = [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]]
            if (t.background === 'transparent') {
              if (a > 0) symbolPx++
            } else if (
              Math.abs(r - MARFIM[0]) > 24 ||
              Math.abs(g - MARFIM[1]) > 24 ||
              Math.abs(b - MARFIM[2]) > 24
            ) {
              symbolPx++
            }
          }
        }
        assert.ok(symbolPx > 100, 'símbolo deve ocupar a faixa central')
      },
    )
  }

  it('regeneração a partir da arte é determinística (mesmos bytes do arquivo commitado)', () => {
    for (const t of ICON_TARGETS) {
      const committed = readFileSync(path.join(OUT_DIR, t.file))
      const regenerated = assembleIcon(t.size, symbol, t.margin, t.background)
      assert.equal(Buffer.compare(committed, regenerated), 0)
    }
  })

  it('sanidade do pipeline: resize do símbolo para 180px mantém pixels visíveis', () => {
    const scaled = resize(
      symbol,
      168,
      Math.max(1, Math.round((168 * symbol.height) / symbol.width)),
    )
    let visible = 0
    for (let i = 0; i < scaled.width * scaled.height; i++) {
      if (scaled.data[i * 4 + 3] > 0) visible++
    }
    assert.ok(visible > 1000)
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
