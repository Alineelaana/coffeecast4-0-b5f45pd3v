// src/lib/estudioMotor.ts
// Motor de composição gráfica do Estúdio Criativo IA — CoffeeCast 4.0
// Composição REAL em canvas: fundo cinematográfico dourado, cabeçalho oficial (logo + xícara),
// área de foto dos convidados (elemento gráfico — JAMAIS recriado por IA), placas de nomes,
// título serifado dourado/preto com linhas decorativas, painel de logomarcas dos convidados,
// xícara central, slogan e rodapés "CURTA | INSCREVA-SE | ATIVE O SININHO".
// NUNCA escreve temporada — somente "CoffeeCast 4.0".

export interface EstudioCamada {
  id: string
  nome: string
  tipo:
    | 'fundo'
    | 'cabecalho'
    | 'titulo'
    | 'subtitulo'
    | 'foto'
    | 'placa_nome'
    | 'logos'
    | 'xicara'
    | 'rodape'
  bloqueado: boolean
  x: number // 0..1
  y: number // 0..1
  w: number // 0..1
  h: number // 0..1
  cor?: string
  fonte?: 'serif' | 'sans'
  tamanho?: number // tamanho relativo da fonte
}

export interface EstudioConvidado {
  nome: string
  nomeExibicao?: string
  empresa?: string
  foto?: string // dataURL ou URL absoluta
  logo?: string // dataURL ou URL absoluta
  ordem?: number
}

export interface EstudioCapaInput {
  episodioTitulo?: string
  tituloCapa?: string
  tituloThumbnail?: string
  convidados: EstudioConvidado[]
  templateNome?: string
  templateJson?: { camadas?: EstudioCamada[] } | null
  orientacoes?: string
}

export const RESOLUCOES = {
  base: { w: 1280, h: 720 },
  youtube_hd: { w: 1280, h: 720 },
  full_hd: { w: 1920, h: 1080 },
  tv_4k: { w: 3840, h: 2160 },
} as const

export type ResolucaoId = keyof typeof RESOLUCOES

export const CORES_ESTUDIO = {
  vinho: '#4B1E3F',
  dourado: '#C9971F',
  douradoClaro: '#E8C766',
  champagne: '#F7E9D2',
  marfim: '#FDF8F0',
  preto: '#181513',
  branco: '#FFFFFF',
  rose: '#B05B7A',
}

// ---------- Template Mestre Oficial "CoffeeCast 4.0 — Premium Dourado" ----------
// Referência: capa oficial anexada pela usuária (HISTÓRIAS QUE INSPIRAM).
// Camadas bloqueadas = identidade oficial; camadas editáveis = dados do episódio.
export function templateMestrePremiumDourado(): { nome: string; camadas: EstudioCamada[] } {
  return {
    nome: 'CoffeeCast 4.0 — Premium Dourado',
    camadas: [
      {
        id: 'fundo',
        nome: 'Fundo cinematográfico',
        tipo: 'fundo',
        bloqueado: true,
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: 'cabecalho',
        nome: 'Cabeçalho oficial',
        tipo: 'cabecalho',
        bloqueado: true,
        x: 0.3,
        y: 0.02,
        w: 0.42,
        h: 0.16,
      },
      {
        id: 'titulo',
        nome: 'Título da capa',
        tipo: 'titulo',
        bloqueado: false,
        x: 0.33,
        y: 0.2,
        w: 0.34,
        h: 0.5,
        cor: CORES_ESTUDIO.dourado,
        fonte: 'serif',
        tamanho: 1,
      },
      {
        id: 'subtitulo',
        nome: 'Subtítulo (opcional)',
        tipo: 'subtitulo',
        bloqueado: false,
        x: 0.33,
        y: 0.72,
        w: 0.34,
        h: 0.08,
        cor: CORES_ESTUDIO.vinho,
        fonte: 'sans',
        tamanho: 0.42,
      },
      {
        id: 'foto',
        nome: 'Fotografia dos convidados',
        tipo: 'foto',
        bloqueado: false,
        x: 0.02,
        y: 0.08,
        w: 0.3,
        h: 0.55,
      },
      {
        id: 'placa_nome',
        nome: 'Placas de nomes',
        tipo: 'placa_nome',
        bloqueado: false,
        x: 0.02,
        y: 0.64,
        w: 0.3,
        h: 0.14,
      },
      {
        id: 'logos',
        nome: 'Logomarcas dos convidados',
        tipo: 'logos',
        bloqueado: false,
        x: 0.7,
        y: 0.2,
        w: 0.28,
        h: 0.4,
      },
      {
        id: 'xicara',
        nome: 'Xícara central',
        tipo: 'xicara',
        bloqueado: true,
        x: 0.38,
        y: 0.72,
        w: 0.24,
        h: 0.2,
      },
      {
        id: 'rodape',
        nome: 'Rodapés oficiais',
        tipo: 'rodape',
        bloqueado: true,
        x: 0,
        y: 0.9,
        w: 1,
        h: 0.1,
      },
    ],
  }
}

/** Número finito ou fallback — nunca deixa undefined/NaN atravessar para o canvas. */
function numeroSeguro(valor: unknown, fallback?: number): number | undefined {
  if (typeof valor === 'number' && isFinite(valor)) return valor
  return fallback
}

// ---------- Carregamento de imagens ----------
// Com TIMEOUT: uma foto/logomarca que falha (404/CORS/rede lenta) NUNCA deixa a
// prévia pendente para sempre — resolve null e a capa é desenhada sem a imagem.
function carregarImagem(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    let resolvido = false
    const concluir = (resultado: HTMLImageElement | null) => {
      if (resolvido) return
      resolvido = true
      clearTimeout(timer)
      img.onload = null
      img.onerror = null
      resolve(resultado)
    }
    const timer = setTimeout(() => concluir(null), 8000)
    img.onload = () => concluir(img)
    img.onerror = () => concluir(null)
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}

// ---------- Desenho de elementos oficiais (bloqueados) ----------
function desenharFundo(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Cenário champagne/dourado com refletores cinematográficos
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#3a2a12')
  g.addColorStop(0.28, '#8a6a2e')
  g.addColorStop(0.55, '#c9a55a')
  g.addColorStop(0.78, '#ecd9b4')
  g.addColorStop(1, '#f6ecd9')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // Refletores (halos superiores esquerdo/direito)
  const halo = (cx: number, cy: number, r: number) => {
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    rg.addColorStop(0, 'rgba(255,231,168,0.95)')
    rg.addColorStop(0.35, 'rgba(240,196,110,0.55)')
    rg.addColorStop(1, 'rgba(240,196,110,0)')
    ctx.fillStyle = rg
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  }
  halo(w * 0.06, h * 0.06, w * 0.16)
  halo(w * 0.94, h * 0.05, w * 0.16)
  halo(w * 0.5, h * 0.02, w * 0.35)

  // Brilhos dourados horizontais (mesa / rack de luz)
  ctx.fillStyle = 'rgba(255,214,130,0.65)'
  ctx.fillRect(0, h * 0.665, w, Math.max(2, h * 0.004))
  ctx.fillStyle = 'rgba(255,224,150,0.5)'
  ctx.fillRect(0, h * 0.695, w, Math.max(1, h * 0.002))

  // Piso inferior em marfim
  const piso = ctx.createLinearGradient(0, h * 0.72, 0, h)
  piso.addColorStop(0, '#f3e5c8')
  piso.addColorStop(1, '#e9d5ae')
  ctx.fillStyle = piso
  ctx.fillRect(0, h * 0.72, w, h * 0.28)
}

function desenharXicara(ctx: CanvasRenderingContext2D, cx: number, cy: number, raio: number) {
  // Xícara com pires dourado (ícone vetorial, nunca foto)
  ctx.save()
  // pires
  ctx.strokeStyle = CORES_ESTUDIO.dourado
  ctx.lineWidth = Math.max(2, raio * 0.09)
  ctx.beginPath()
  ctx.ellipse(cx, cy + raio * 0.72, raio * 1.25, raio * 0.3, 0, 0, Math.PI * 2)
  ctx.stroke()
  // corpo
  ctx.lineWidth = Math.max(2, raio * 0.11)
  ctx.beginPath()
  ctx.moveTo(cx - raio * 0.78, cy - raio * 0.35)
  ctx.bezierCurveTo(
    cx - raio * 0.7,
    cy + raio * 0.45,
    cx + raio * 0.7,
    cy + raio * 0.45,
    cx + raio * 0.78,
    cy - raio * 0.35,
  )
  ctx.stroke()
  // alça
  ctx.beginPath()
  ctx.arc(cx + raio * 0.95, cy - raio * 0.05, raio * 0.28, -Math.PI / 2, Math.PI / 2)
  ctx.stroke()
  // vapor/coração
  ctx.beginPath()
  ctx.moveTo(cx, cy - raio * 0.55)
  ctx.bezierCurveTo(
    cx - raio * 0.28,
    cy - raio * 0.95,
    cx - raio * 0.05,
    cy - raio * 1.2,
    cx,
    cy - raio * 0.98,
  )
  ctx.bezierCurveTo(
    cx + raio * 0.05,
    cy - raio * 1.2,
    cx + raio * 0.28,
    cy - raio * 0.95,
    cx,
    cy - raio * 0.55,
  )
  ctx.stroke()
  ctx.restore()
}

function desenharCabecalho(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  // Logomarca estilizada (xícara+coração) + wordmark "CoffeeCast 4.0"
  const raioLogo = h * 0.32
  ctx.save()
  ctx.strokeStyle = CORES_ESTUDIO.preto
  desenharXicara(ctx, x + raioLogo * 1.1, y + h * 0.5, raioLogo)
  // coração preenchido sobre a xícara
  ctx.fillStyle = CORES_ESTUDIO.preto
  const hx = x + raioLogo * 1.1
  const hy = y + h * 0.5 - raioLogo * 1.15
  const hs = raioLogo * 0.34
  ctx.beginPath()
  ctx.moveTo(hx, hy + hs * 0.55)
  ctx.bezierCurveTo(hx - hs * 1.1, hy - hs * 0.5, hx - hs * 0.2, hy - hs * 1.35, hx, hy - hs * 0.5)
  ctx.bezierCurveTo(hx + hs * 0.2, hy - hs * 1.35, hx + hs * 1.1, hy - hs * 0.5, hx, hy + hs * 0.55)
  ctx.fill()
  ctx.strokeStyle = CORES_ESTUDIO.dourado
  ctx.lineWidth = Math.max(2, raioLogo * 0.08)
  ctx.beginPath()
  ctx.moveTo(hx + hs * 0.35, hy - hs * 1.25)
  ctx.lineTo(hx + hs * 0.75, hy - hs * 2.0)
  ctx.stroke()
  ctx.restore()

  // Wordmark
  const textoX = x + raioLogo * 2.4
  ctx.save()
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  const fs = h * 0.46
  ctx.font = `700 ${fs}px "Playfair Display", Georgia, serif`
  const largura4 = ctx.measureText('4.0').width
  ctx.fillStyle = CORES_ESTUDIO.preto
  ctx.fillText('CoffeeCast', textoX, y + h * 0.5)
  ctx.fillStyle = CORES_ESTUDIO.dourado
  ctx.fillText('4.0', textoX + ctx.measureText('CoffeeCast').width + fs * 0.14, y + h * 0.5)
  ctx.restore()
  void largura4
}

function desenharOndasSonoras(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  largura: number,
  cor: string,
) {
  const n = 42
  const passo = largura / n
  ctx.save()
  ctx.fillStyle = cor
  for (let i = 0; i < n; i++) {
    const centro = Math.abs(i - n / 2) / (n / 2)
    const altura = Math.max(2, (1 - centro) * largura * 0.055 + Math.sin(i * 1.7) * largura * 0.012)
    ctx.fillRect(cx - largura / 2 + i * passo, cy - altura / 2, Math.max(1.5, passo * 0.35), altura)
  }
  ctx.restore()
}

function desenharLinhaDecorativa(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  meiaLargura: number,
  cor: string,
) {
  ctx.save()
  ctx.strokeStyle = cor
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - meiaLargura, cy)
  ctx.lineTo(cx - meiaLargura * 0.18, cy)
  ctx.moveTo(cx + meiaLargura * 0.18, cy)
  ctx.lineTo(cx + meiaLargura, cy)
  ctx.stroke()
  // losango central
  ctx.fillStyle = cor
  ctx.beginPath()
  ctx.moveTo(cx, cy - 6)
  ctx.lineTo(cx + 10, cy)
  ctx.lineTo(cx, cy + 6)
  ctx.lineTo(cx - 10, cy)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function desenharPlacaNome(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  nome: string,
) {
  ctx.save()
  const r = h * 0.28
  // fundo preto com borda dourada
  ctx.fillStyle = 'rgba(14,10,8,0.94)'
  ctx.strokeStyle = CORES_ESTUDIO.dourado
  ctx.lineWidth = Math.max(2, h * 0.06)
  ctx.beginPath()
  const x2 = x + w
  const y2 = y + h
  ctx.moveTo(x + r, y)
  ctx.lineTo(x2 - r, y)
  ctx.quadraticCurveTo(x2, y, x2, y + r)
  ctx.lineTo(x2, y2 - r)
  ctx.quadraticCurveTo(x2, y2, x2 - r, y2)
  ctx.lineTo(x + r, y2)
  ctx.quadraticCurveTo(x, y2, x, y2 - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // nome em branco, maiúsculas, até 2 linhas
  ctx.fillStyle = CORES_ESTUDIO.branco
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const palavras = nome.toUpperCase().split(/\s+/)
  const linhas: string[] = []
  let atual = ''
  for (const p of palavras) {
    const teste = atual ? atual + ' ' + p : p
    if (ctx.measureText(teste).width > w * 0.86 && atual) {
      linhas.push(atual)
      atual = p
    } else {
      atual = teste
    }
  }
  if (atual) linhas.push(atual)
  const duas = linhas.slice(0, 2)
  const fs = Math.min(h * 0.34, ((w * 0.86) / Math.max(6, ...duas.map((l) => l.length))) * 1.55)
  ctx.font = `600 ${fs}px "Playfair Display", Georgia, serif`
  if (duas.length === 1) {
    ctx.fillText(duas[0], x + w / 2, y + h / 2)
  } else {
    ctx.fillText(duas[0], x + w / 2, y + h * 0.3)
    ctx.fillText(duas[1], x + w / 2, y + h * 0.7)
  }
  ctx.restore()
}

function desenharRodape(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  const cy = h * 0.945
  // Slogan esquerdo
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  const fsSlogan = h * 0.042
  ctx.font = `italic 600 ${fsSlogan}px "Playfair Display", Georgia, serif`
  ctx.fillStyle = CORES_ESTUDIO.vinho
  ctx.fillText('Mais que conversas,', w * 0.035, cy - fsSlogan * 0.55)
  ctx.font = `600 ${fsSlogan * 0.82}px "Playfair Display", Georgia, sans-serif`
  ctx.fillStyle = CORES_ESTUDIO.dourado
  ctx.fillText('HISTÓRIAS QUE TRANSFORMAM', w * 0.035, cy + fsSlogan * 0.75)

  // Rodapé direito: CURTA | INSCREVA-SE | ATIVE O SININHO
  ctx.textAlign = 'center'
  ctx.font = `700 ${h * 0.032}px "Playfair Display", Georgia, sans-serif`
  ctx.fillStyle = CORES_ESTUDIO.branco
  const itens = ['CURTA', 'INSCREVA-SE', 'ATIVE O SININHO']
  const zonaX = w * 0.68
  const passo = w * 0.105
  itens.forEach((t, i) => {
    const tx = zonaX + i * passo
    ctx.fillText(t, tx, cy + h * 0.032)
  })
  // divisórias verticais
  ctx.strokeStyle = 'rgba(24,21,19,0.55)'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 2; i++) {
    const dx = zonaX + passo * (i + 0.5) - passo * 0.14
    ctx.beginPath()
    ctx.moveTo(dx, cy - h * 0.012)
    ctx.lineTo(dx, cy + h * 0.058)
    ctx.stroke()
  }
  // ícones vetoriais (polegar, play, sininho)
  const iconeCor = CORES_ESTUDIO.preto
  const iy = cy - h * 0.022
  // polegar
  ctx.fillStyle = iconeCor
  ctx.fillRect(zonaX - 9, iy - 12, 6, 14)
  ctx.beginPath()
  ctx.moveTo(zonaX - 3, iy + 2)
  ctx.lineTo(zonaX + 6, iy + 4)
  ctx.lineTo(zonaX + 10, iy + 2)
  ctx.lineTo(zonaX + 8, iy - 8)
  ctx.lineTo(zonaX + 2, iy - 9)
  ctx.closePath()
  ctx.fill()
  // play (YouTube)
  const py = zonaX + passo
  ctx.beginPath()
  ctx.roundRect(py - 11, iy - 10, 22, 16, 4)
  ctx.fill()
  ctx.fillStyle = CORES_ESTUDIO.branco
  ctx.beginPath()
  ctx.moveTo(py - 3, iy - 5)
  ctx.lineTo(py + 4, iy - 2)
  ctx.lineTo(py - 3, iy + 1)
  ctx.closePath()
  ctx.fill()
  // sininho
  ctx.fillStyle = iconeCor
  const by = zonaX + passo * 2
  ctx.beginPath()
  ctx.arc(by, iy - 2, 7, Math.PI, 0)
  ctx.lineTo(by + 8, iy + 5)
  ctx.lineTo(by - 8, iy + 5)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.arc(by, iy + 8, 3, 0, Math.PI)
  ctx.fill()
  ctx.restore()
}

// ---------- Composição principal ----------
export interface ComposicaoResultado {
  dataUrl: string
  largura: number
  altura: number
  avisos: string[]
}

export async function comporCapa(
  input: EstudioCapaInput,
  resolucao: ResolucaoId = 'base',
): Promise<ComposicaoResultado> {
  const dim = RESOLUCOES[resolucao]
  const canvas = document.createElement('canvas')
  canvas.width = dim.w
  canvas.height = dim.h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível neste navegador.')

  const avisos: string[] = []
  // Camadas do banco mescladas com as coordenadas oficiais do Template Mestre:
  // registros antigos podem ter sido salvos sem x/y/w/h — sem isso o canvas recebe
  // NaN e silenciosamente não desenha a camada (prévia "eterna" com fundo vazio).
  const oficiais = templateMestrePremiumDourado().camadas
  const brutas =
    input.templateJson && Array.isArray(input.templateJson.camadas)
      ? input.templateJson.camadas
      : []
  const camadas: EstudioCamada[] = oficiais.map((oficial) => {
    const doBanco = brutas.find((c) => c.tipo === oficial.tipo)
    if (!doBanco) return oficial
    return {
      ...oficial,
      ...doBanco,
      x: numeroSeguro(doBanco.x, oficial.x) as number,
      y: numeroSeguro(doBanco.y, oficial.y) as number,
      w: numeroSeguro(doBanco.w, oficial.w) as number,
      h: numeroSeguro(doBanco.h, oficial.h) as number,
      tamanho: numeroSeguro(doBanco.tamanho, oficial.tamanho),
    }
  })

  const get = (tipo: EstudioCamada['tipo']): EstudioCamada | undefined =>
    camadas.find((c) => c.tipo === tipo)

  const esc = dim.w / 1280 // fator de escala de detalhes finos
  const fFoto = get('foto')
  const fPlaca = get('placa_nome')
  const fLogos = get('logos')
  const fTitulo = get('titulo')

  // 1) Fundo (bloqueado)
  desenharFundo(ctx, dim.w, dim.h)

  // 2) Cabeçalho oficial
  const fCab = get('cabecalho')
  if (fCab) desenharCabecalho(ctx, fCab.x * dim.w, fCab.y * dim.h, fCab.w * dim.w, fCab.h * dim.h)

  // 3) Fotografia dos convidados — elemento gráfico ORIGINAL (nunca recriado)
  const fotos = input.convidados.filter((c) => c.foto).slice(0, 3)
  const imgsFoto: HTMLImageElement[] = []
  for (const c of fotos) {
    const im = await carregarImagem(c.foto as string)
    if (im) imgsFoto.push(im)
  }
  if (fFoto) {
    const zx = fFoto.x * dim.w
    const zy = fFoto.y * dim.h
    const zw = fFoto.w * dim.w
    const zh = fFoto.h * dim.h
    if (imgsFoto.length === 1) {
      desenharFotoEmoldurada(ctx, imgsFoto[0], zx, zy, zw, zh)
    } else if (imgsFoto.length === 2) {
      const gap = 10 * esc
      desenharFotoEmoldurada(ctx, imgsFoto[0], zx, zy, (zw - gap) / 2, zh)
      desenharFotoEmoldurada(ctx, imgsFoto[1], zx + (zw + gap) / 2, zy, (zw - gap) / 2, zh)
    } else if (imgsFoto.length >= 3) {
      const gap = 8 * esc
      desenharFotoEmoldurada(ctx, imgsFoto[0], zx, zy, (zw - gap * 2) / 3, zh)
      desenharFotoEmoldurada(ctx, imgsFoto[1], zx + (zw + gap) / 3, zy, (zw - gap * 2) / 3, zh)
      desenharFotoEmoldurada(
        ctx,
        imgsFoto[2],
        zx + (2 * (zw + gap)) / 3,
        zy,
        (zw - gap * 2) / 3,
        zh,
      )
    }
    if (input.convidados.some((c) => c.foto) && imgsFoto.length === 0) {
      avisos.push('Não foi possível carregar as fotografias — capa gerada sem foto.')
    }
  }

  // 4) Placas de nomes
  if (fPlaca) {
    const nomes = input.convidados.slice(0, 3)
    const zw = fPlaca.w * dim.w
    const zh = fPlaca.h * dim.h
    const gap = 8 * esc
    nomes.forEach((c, i) => {
      const nomeExib = (c.nomeExibicao || c.nome || '').trim() || 'CONVIDADO'
      const larguraPlaca = nomes.length === 1 ? zw : (zw - gap * (nomes.length - 1)) / nomes.length
      desenharPlacaNome(
        ctx,
        fPlaca.x * dim.w + i * (larguraPlaca + gap),
        fPlaca.y * dim.h,
        larguraPlaca,
        zh,
        nomeExib,
      )
    })
  }

  // 5) Logomarcas dos convidados — originais, preservando cores e transparência
  if (fLogos) {
    const logos = input.convidados.filter((c) => c.logo).slice(0, 4)
    const imgsLogo: HTMLImageElement[] = []
    for (const c of logos) {
      const im = await carregarImagem(c.logo as string)
      if (im) imgsLogo.push(im)
    }
    if (imgsLogo.length) {
      const zx = fLogos.x * dim.w
      const zy = fLogos.y * dim.h
      const zw = fLogos.w * dim.w
      const zh = fLogos.h * dim.h
      // painel de destaque translúcido
      ctx.save()
      ctx.fillStyle = 'rgba(253,248,240,0.72)'
      ctx.strokeStyle = 'rgba(201,151,31,0.6)'
      ctx.lineWidth = 2 * esc
      ctx.beginPath()
      ctx.roundRect(zx - 14 * esc, zy - 14 * esc, zw + 28 * esc, zh + 28 * esc, 18 * esc)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
      const n = imgsLogo.length
      const cellH = zh / n
      imgsLogo.forEach((im, i) => {
        const maxW = zw
        const maxH = cellH * 0.82
        const r = Math.min(maxW / im.width, maxH / im.height)
        const dw = im.width * r
        const dh = im.height * r
        ctx.drawImage(im, zx + (zw - dw) / 2, zy + cellH * i + (cellH - dh) / 2, dw, dh)
      })
      if (logos.length !== imgsLogo.length) {
        avisos.push('Uma ou mais logomarcas não puderam ser carregadas.')
      }
    }
  }

  // 6) Título da capa (serifado dourado/preto com linhas decorativas)
  if (fTitulo) {
    const bruto = (input.tituloCapa || input.tituloThumbnail || input.episodioTitulo || '').trim()
    if (bruto) {
      // ajuste automático: quebra em até 3 linhas, caixa alta para máximo impacto
      const palavras = bruto.toUpperCase().split(/\s+/)
      const linhas: string[] = []
      let atual = ''
      const larguraMax = fTitulo.w * dim.w * 0.94
      const fsBase = (fTitulo.tamanho ?? 1) * dim.h * 0.13
      ctx.font = `700 ${fsBase}px "Playfair Display", Georgia, serif`
      for (const p of palavras) {
        const teste = atual ? atual + ' ' + p : p
        if (ctx.measureText(teste).width > larguraMax && atual) {
          linhas.push(atual)
          atual = p
        } else {
          atual = teste
        }
      }
      if (atual) linhas.push(atual)
      const usar = linhas.slice(0, 3)
      const fsAjustada = Math.min(
        fsBase,
        (larguraMax / Math.max(8, ...usar.map((l) => l.length))) * 1.9,
      )
      const cx = (fTitulo.x + fTitulo.w / 2) * dim.w
      let cy = fTitulo.y * dim.h + fsAjustada * 0.7
      const desloc = (fTitulo.h * dim.h - usar.length * fsAjustada * 1.12) / 2
      cy = Math.max(
        fTitulo.y * dim.h + fsAjustada * 0.8,
        fTitulo.y * dim.h + desloc + fsAjustada * 0.8,
      )
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const mostrarDeco = usar.length <= 2
      if (mostrarDeco) {
        desenharOndasSonoras(
          ctx,
          cx,
          cy - fsAjustada * 0.95,
          fTitulo.w * dim.w * 0.8,
          CORES_ESTUDIO.preto,
        )
      }
      usar.forEach((l, i) => {
        ctx.font = `700 ${fsAjustada}px "Playfair Display", Georgia, serif`
        ctx.fillStyle = i % 2 === 0 ? CORES_ESTUDIO.dourado : CORES_ESTUDIO.preto
        ctx.fillText(l, cx, cy + i * fsAjustada * 1.12)
      })
      if (mostrarDeco) {
        desenharOndasSonoras(
          ctx,
          cx,
          cy + usar.length * fsAjustada * 1.12,
          fTitulo.w * dim.w * 0.8,
          CORES_ESTUDIO.preto,
        )
      }
      if (linhas.length > 3) {
        avisos.push('O título foi reduzido para caber em até 3 linhas.')
      }
    }
  }

  // 7) Subtítulo opcional
  const fSub = get('subtitulo')
  const subtitulo = (input as { subtituloCapa?: string }).subtituloCapa
  if (fSub && subtitulo && subtitulo.trim()) {
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const fs = (fSub.tamanho ?? 0.42) * dim.h * 0.16
    ctx.font = `500 ${fs}px "Playfair Display", Georgia, serif`
    ctx.fillStyle = fSub.cor || CORES_ESTUDIO.vinho
    ctx.fillText(subtitulo.trim().toUpperCase(), (fSub.x + fSub.w / 2) * dim.w, fSub.y * dim.h)
    ctx.restore()
  }

  // 8) Xícara central (bloqueada)
  const fXic = get('xicara')
  if (fXic) {
    desenharXicara(
      ctx,
      (fXic.x + fXic.w / 2) * dim.w,
      fXic.y * dim.h + fXic.h * dim.h * 0.35,
      fXic.h * dim.h * 0.42,
    )
  }

  // 9) Rodapés oficiais (bloqueados)
  desenharRodape(ctx, dim.w, dim.h)

  return { dataUrl: canvas.toDataURL('image/png'), largura: dim.w, altura: dim.h, avisos }
}

function desenharFotoEmoldurada(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save()
  // moldura dourada
  ctx.strokeStyle = CORES_ESTUDIO.dourado
  ctx.lineWidth = Math.max(3, w * 0.012)
  ctx.strokeRect(x - 4, y - 4, w + 8, h + 8)
  // recorte proporcional (cover) — preserva a foto original inteira em proporção
  const r = Math.max(w / img.width, h / img.height)
  const dw = img.width * r
  const dh = img.height * r
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}

// ---------- Exportação / download ----------
export function baixarDataUrl(dataUrl: string, nomeArquivo: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function nomeArquivoCapa(prefixo: string, extensao: string) {
  const limpo = prefixo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60)
  const data = new Date().toISOString().slice(0, 10)
  return `coffeecast-40-${limpo || 'capa'}-${data}.${extensao}`
}

export async function exportarCapa(
  input: EstudioCapaInput,
  resolucao: ResolucaoId,
  formato: 'png' | 'jpg',
): Promise<{ dataUrl: string; nome: string; redimensionado: boolean }> {
  const res = await comporCapa(input, resolucao)
  let dataUrl = res.dataUrl
  let redimensionado = resolucao === 'tv_4k'
  if (formato === 'jpg') {
    const canvas = document.createElement('canvas')
    canvas.width = res.largura
    canvas.height = res.altura
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const img = await carregarImagem(dataUrl)
      if (img) {
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      }
    }
  }
  return {
    dataUrl,
    nome: nomeArquivoCapa(input.tituloCapa || input.episodioTitulo || 'capa', formato),
    redimensionado,
  }
}

export function dataUrlParaBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',')
  const mime = meta.match(/:(.*?);/)?.[1] || 'image/png'
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

// ---------- Templates iniciais do Laboratório ----------
export const ESTILOS_TEMPLATE = [
  'Premium Dourado',
  'Black Gold',
  'Minimalista',
  'Cinematográfico',
  'Corporativo',
  'Moderno',
  'Tecnológico',
  'Editorial',
  'Luxo Contemporâneo',
  'Personalizado',
] as const

export function camadasAPartirDeProposta(proposta: {
  nome?: string
  camadas?: Partial<EstudioCamada>[]
}): { nome: string; camadas: EstudioCamada[] } {
  const base = templateMestrePremiumDourado()
  if (!proposta.camadas || !proposta.camadas.length) return base
  const camadas = proposta.camadas.map((c, i) => ({
    id: c.id || `camada_${i}`,
    nome: c.nome || `Camada ${i + 1}`,
    tipo: (c.tipo as EstudioCamada['tipo']) || 'titulo',
    bloqueado: !!c.bloqueado,
    x: typeof c.x === 'number' ? c.x : 0.1,
    y: typeof c.y === 'number' ? c.y : 0.1,
    w: typeof c.w === 'number' ? c.w : 0.3,
    h: typeof c.h === 'number' ? c.h : 0.1,
    cor: c.cor,
    fonte: c.fonte,
    tamanho: c.tamanho,
  }))
  return { nome: proposta.nome || base.nome, camadas }
}
