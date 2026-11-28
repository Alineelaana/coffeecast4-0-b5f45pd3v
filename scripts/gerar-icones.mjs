/**
 * Gera os ícones do CoffeeCast 4.0 a partir da arte oficial anexada pelo usuário
 * (xícara rosé/dourada com vapor em forma de coração e estrela, sobre fundo preto).
 *
 * - Isola APENAS o símbolo (xícara + vapor/coração + estrela) via flood-fill a partir
 *   do centro da xícara: descarta o fundo preto, o wordmark "CoffeeCast4.0" e o halo vermelho.
 * - Aplica fundo marfim da marca (#FAF6EF).
 * - Saídas (assets estáticos, carregam sem login):
 *   public/icons/apple-touch-icon.png  (180x180)  — iPhone / Safari "Adicionar à Tela de Início"
 *   public/icons/icon-192.png          (192x192)  — Android / Chrome (purpose any)
 *   public/icons/icon-512.png          (512x512)  — Android / Chrome (purpose any)
 *   public/icons/icon-maskable-512.png (512x512)  — Android / Chrome (purpose maskable, margem segura)
 *
 * Uso: node scripts/gerar-icones.mjs — roda automaticamente no build (script "build").
 * Os PNGs gerados ficam commitados em public/icons/ (o build só regenera se faltarem).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { inflateSync, inflateRawSync, deflateSync } from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CAMINHO_ARTE = path.join(ROOT, 'src/assets/chatgpt-image-16-de-set.de-2026-190040-7894e.png')
const OUT_DIR = path.join(ROOT, 'public/icons')

const MARFIM = [0xfa, 0xf6, 0xef] // ~#FAF6EF — marfim da marca
const LIMIAR_FUNDO = 30 // brilho abaixo disso = fundo preto
const ALVOs = [
  { arquivo: 'apple-touch-icon.png', tamanho: 180, margem: 0.06 },
  { arquivo: 'icon-192.png', tamanho: 192, margem: 0.06 },
  { arquivo: 'icon-512.png', tamanho: 512, margem: 0.06 },
  { arquivo: 'icon-maskable-512.png', tamanho: 512, margem: 0.42 },
]

// ---------------------------------------------------------------------------
// Decodificador PNG minimalista (8-bit RGBA/RGB, sem entrelaçamento, filtros 0..4)
// ---------------------------------------------------------------------------
function crc32(buf) {
  let c
  const tabela = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tabela[n] = c
  }
  let crc = 0xffffffff
  for (const byte of buf) crc = tabela[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(tipo, dados) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(dados.length, 0)
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corpo), 0)
  return Buffer.concat([len, corpo, crc])
}

function decodificarPng(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('Arte não é um PNG')
  let pos = 8
  let largura = 0,
    altura = 0,
    bitDepth = 0,
    colorType = 0
  const idat = []

  while (pos < buffer.length) {
    const len = buffer.readUInt32BE(pos)
    const tipo = buffer.toString('ascii', pos + 4, pos + 8)
    const dados = buffer.subarray(pos + 8, pos + 8 + len)
    if (tipo === 'IHDR') {
      largura = dados.readUInt32BE(0)
      altura = dados.readUInt32BE(4)
      bitDepth = dados[8]
      colorType = dados[9]
      if (dados[12] !== 0) throw new Error('PNG entrelaçado não suportado')
    } else if (tipo === 'IDAT') {
      idat.push(dados)
    } else if (tipo === 'IEND') {
      break
    }
    pos += 12 + len
  }

  if (bitDepth !== 8) throw new Error(`Bit depth ${bitDepth} não suportado`)
  const canais = colorType === 6 ? 4 : colorType === 2 ? 3 : 0
  if (!canais) throw new Error(`Color type ${colorType} não suportado`)

  const raw = Buffer.concat(idat)
  let bruto
  try {
    bruto = inflateSync(raw)
  } catch {
    bruto = inflateRawSync(raw)
  }
  const stride = largura * canais

  const img = Buffer.alloc(largura * altura * 4)
  const linha = Buffer.alloc(stride)
  const anterior = Buffer.alloc(stride)

  for (let y = 0; y < altura; y++) {
    const filtro = bruto[y * (stride + 1)]
    bruto.copy(linha, 0, y * (stride + 1) + 1, (y + 1) * (stride + 1))
    for (let i = 0; i < stride; i++) {
      const a = i >= canais ? linha[i - canais] : 0
      const b = anterior[i]
      const c = i >= canais ? anterior[i - canais] : 0
      let v = linha[i]
      switch (filtro) {
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
      linha[i] = v
    }
    linha.copy(anterior)
    for (let x = 0; x < largura; x++) {
      const si = x * canais
      const di = (y * largura + x) * 4
      img[di] = linha[si]
      img[di + 1] = linha[si + 1]
      img[di + 2] = linha[si + 2]
      img[di + 3] = canais === 4 ? linha[si + 3] : 0xff
    }
  }
  return { largura, altura, data: img }
}

// ---------------------------------------------------------------------------
// Codificador PNG (RGBA 8-bit, filtro 0)
// ---------------------------------------------------------------------------
function codificarPng(largura, altura, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(largura, 0)
  ihdr.writeUInt32BE(altura, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const stride = largura * 4
  const bruto = Buffer.alloc((stride + 1) * altura)
  for (let y = 0; y < altura; y++) {
    bruto[y * (stride + 1)] = 0 // filtro 0
    rgba.copy(bruto, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(bruto, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------------------------------------------------------------------------
// Redimensionamento bilinear
// ---------------------------------------------------------------------------
function redimensionar(src, dw, dh) {
  const { largura: sw, altura: sh, data } = src
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
        const topo = p00 + (p10 - p00) * wx
        const base = p01 + (p11 - p01) * wx
        out[di + ch] = Math.max(0, Math.min(255, Math.round(topo + (base - topo) * wy)))
      }
    }
  }
  return { largura: dw, altura: dh, data: out }
}

function brilhoPixel(data, i) {
  return 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
}

// Fundo = preto (ou quase) OU halo vermelho saturado da arte
function ehFundo(data, i) {
  const r = data[i * 4]
  const g = data[i * 4 + 1]
  const b = data[i * 4 + 2]
  if (brilhoPixel(data, i) <= LIMIAR_FUNDO) return true
  return r >= 150 && g <= 85 && b <= 85
}

// ---------------------------------------------------------------------------
// Recorte do símbolo: flood-fill 8-conectado a partir do centro da xícara.
// Mantém somente o componente conectado (xícara + vapor/coração + estrela),
// descartando fundo, wordmark e halos soltos. Bordas ganham anti-aliasing.
// ---------------------------------------------------------------------------
function recortarSimbolo(img) {
  const { largura, altura, data } = img
  const n = largura * altura
  const dentro = new Uint8Array(n)
  const pilha = new Int32Array(n)
  let topo = 0

  // semente: pixel de símbolo mais próximo do centro da xícara (~55% da altura)
  const cx = Math.floor(largura / 2)
  const cy = Math.floor(altura * 0.55)
  let semente = -1
  let melhorDist = Infinity
  for (let y = Math.floor(altura * 0.3); y < Math.floor(altura * 0.8); y++) {
    for (let x = Math.floor(largura * 0.2); x < Math.floor(largura * 0.8); x++) {
      const i = y * largura + x
      if (ehFundo(data, i)) continue
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy)
      if (d < melhorDist) {
        melhorDist = d
        semente = i
      }
    }
  }
  if (semente < 0) throw new Error('Símbolo não encontrado na arte')

  dentro[semente] = 1
  pilha[topo++] = semente
  while (topo > 0) {
    const i = pilha[--topo]
    const x = i % largura
    const y = (i - x) / largura
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= largura || ny >= altura) continue
        const ni = ny * largura + nx
        if (dentro[ni]) continue
        if (ehFundo(data, ni)) continue
        dentro[ni] = 1
        pilha[topo++] = ni
      }
    }
  }

  // bounding box do componente
  let minX = largura,
    minY = altura,
    maxX = 0,
    maxY = 0
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      if (!dentro[y * largura + x]) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  const w = maxX - minX + 1
  const h = maxY - minY + 1

  const out = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (y + minY) * largura + (x + minX)
      const di = (y * w + x) * 4
      out[di] = data[si * 4]
      out[di + 1] = data[si * 4 + 1]
      out[di + 2] = data[si * 4 + 2]
      out[di + 3] = dentro[si] ? 255 : 0
      // anti-aliasing: vizinho de fronteira fica levemente translúcido
      if (dentro[si]) {
        const borda =
          (x > 0 && !dentro[si - 1]) ||
          (x < w - 1 && !dentro[si + 1]) ||
          (y > 0 && !dentro[si - largura]) ||
          (y < h - 1 && !dentro[si + largura])
        if (borda) out[di + 3] = 216
      }
    }
  }
  return { largura: w, altura: h, data: out }
}

// ---------------------------------------------------------------------------
// Montagem do ícone: símbolo centralizado com margem sobre fundo marfim
// ---------------------------------------------------------------------------
function montarIcone(tamanho, simbolo, margemRatio) {
  const escala = Math.min(
    (tamanho * (1 - margemRatio)) / simbolo.largura,
    (tamanho * (1 - margemRatio)) / simbolo.altura,
  )
  const dw = Math.max(1, Math.round(simbolo.largura * escala))
  const dh = Math.max(1, Math.round(simbolo.altura * escala))
  const escalado = redimensionar(simbolo, dw, dh)

  const tela = Buffer.alloc(tamanho * tamanho * 4)
  for (let i = 0; i < tamanho * tamanho; i++) {
    tela[i * 4] = MARFIM[0]
    tela[i * 4 + 1] = MARFIM[1]
    tela[i * 4 + 2] = MARFIM[2]
    tela[i * 4 + 3] = 255
  }
  const ox = Math.round((tamanho - dw) / 2)
  const oy = Math.round((tamanho - dh) / 2)
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const di = ((y + oy) * tamanho + (x + ox)) * 4
      const si = (y * dw + x) * 4
      const a = escalado.data[si + 3] / 255
      for (let ch = 0; ch < 3; ch++) {
        tela[di + ch] = Math.round(escalado.data[si + ch] * a + tela[di + ch] * (1 - a))
      }
      tela[di + 3] = 255
    }
  }
  return codificarPng(tamanho, tamanho, tela)
}

// ---------------------------------------------------------------------------
// Main — gera os ícones (idempotente: só roda se algum PNG estiver faltando)
// ---------------------------------------------------------------------------
const alvos = [
  { arquivo: 'apple-touch-icon.png', tamanho: 180, margem: 0.06 },
  { arquivo: 'icon-192.png', tamanho: 192, margem: 0.06 },
  { arquivo: 'icon-512.png', tamanho: 512, margem: 0.06 },
  { arquivo: 'icon-maskable-512.png', tamanho: 512, margem: 0.3 },
]

const faltando = alvos.some((alvo) => !existsSync(path.join(OUT_DIR, alvo.arquivo)))
if (!faltando) {
  console.log('Ícones do CoffeeCast 4.0 já existem em public/icons/ — nada a fazer.')
} else {
  const arte = decodificarPng(readFileSync(CAMINHO_ARTE))
  const simbolo = recortarSimbolo(arte)
  mkdirSync(OUT_DIR, { recursive: true })
  for (const alvo of alvos) {
    const png = montarIcone(alvo.tamanho, simbolo, alvo.margem)
    writeFileSync(path.join(OUT_DIR, alvo.arquivo), png)
    console.log(`ícone gerado: public/icons/${alvo.arquivo} (${alvo.tamanho}x${alvo.tamanho})`)
  }
  console.log('OK: ícones do CoffeeCast 4.0 gerados.')
}
