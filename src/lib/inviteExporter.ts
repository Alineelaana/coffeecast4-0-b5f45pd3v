/**
 * Utilitário de renderização gráfica em alta qualidade do Convite CoffeeCast 4.0
 * Formato A5: 148mm x 210mm (proporção 1:1.414).
 * Em 300 DPI aprox: 1748 x 2480 px. Aqui usamos resolução nativa 1480 x 2100 px para nitidez absoluta.
 */
import officialLogoImg from '@/assets/sem-nome-1350-x-1080-px-1-01237.png'

interface RenderInviteOptions {
  nome: string
  tipoConvidado?: 'convidado' | 'convidada'
  dataGravacao: string // YYYY-MM-DD ou formatada
  horario: string
  apresentacao: string
  enderecoGravacao?: string
  linkLocalizacao?: string
  guestPhotoUrl?: string
  companyLogoUrl?: string
}

/**
 * Converte URLs remotas em dataURL com crossOrigin anônimo para evitar tainted canvas
 */
export async function toDataURL(url: string): Promise<string> {
  if (!url) return ''
  if (url.startsWith('data:')) return url
  try {
    const res = await fetch(url, { mode: 'cors' })
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve('')
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.warn('Falha no fetch com cors, tentando carregamento direto da imagem:', err)
    return url
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('URL vazia'))
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      // Se falhar com crossOrigin, tenta sem crossOrigin caso já seja local ou dataUrl
      const fallback = new Image()
      fallback.onload = () => resolve(fallback)
      fallback.onerror = (e) => reject(e)
      fallback.src = src
    }
    img.src = src
  })
}

/**
 * Pré-processa uma imagem para gerar um PNG DataURL estritamente circular com fundo transparente.
 *
 * Por que isso é vital:
 * Em visualizadores de PDF mobile ou ao compartilhar o arquivo via WhatsApp,
 * recortes baseados puramente em CSS (border-radius, clip-path ou mask-image)
 * não são interpretados como no Chromium desktop, provocando bordas cortadas ou fotos vazando.
 *
 * Ao queimar o recorte circular diretamente em um Canvas (context.arc + clip) com o enquadramento
 * facial calibrado (foco a 18% do topo em fotos verticais para não cortar a cabeça), a <img>
 * inserida no DOM de impressão (e no preview) já é fisicamente redonda e transparente por fora.
 */
export async function createCircularGuestPhotoDataUrl(
  imageSource: string | HTMLImageElement,
  size = 512,
): Promise<string> {
  if (!imageSource) return ''

  let img: HTMLImageElement
  if (typeof imageSource === 'string') {
    const dataUrl = await toDataURL(imageSource)
    img = await loadImage(dataUrl)
  } else {
    img = imageSource
  }

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // Limpa o canvas garantindo canal alfa 100% transparente fora do círculo
  ctx.clearRect(0, 0, size, size)

  // Traça o círculo perfeito e define a máscara de recorte
  const radius = size / 2
  ctx.save()
  ctx.beginPath()
  ctx.arc(radius, radius, radius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  // Fundo base escuro vinho sofisticado caso haja alguma área não coberta
  ctx.fillStyle = '#2A0F23'
  ctx.fill()

  // Enquadramento facial calibrado:
  // Se for imagem vertical (altura > largura, típica de retratos), foca a 18% do topo
  // para manter rosto e cabeça inteiros sem cortar.
  // Se for paisagem, centraliza horizontalmente.
  const imgAspect = img.width / img.height
  let sx = 0
  let sy = 0
  let sWidth = img.width
  let sHeight = img.height

  if (imgAspect > 1) {
    // Paisagem: corta as laterais mantendo o centro
    sWidth = img.height
    sx = (img.width - sWidth) / 2
  } else if (imgAspect < 1) {
    // Retrato vertical: foca no terço superior (rosto e ombros do convidado)
    sHeight = img.width
    const maxOffsetY = img.height - sHeight
    sy = Math.min(Math.max(0, (img.height - sHeight) * 0.18), maxOffsetY)
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size)
  ctx.restore()

  return canvas.toDataURL('image/png')
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * Renderiza texto no canvas preservando quebras de linha manuais (\n)
 * e quebrando palavras longas que ultrapassem a largura máxima.
 */
function wrapPreformattedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  // Divide o texto pelas quebras de linha explícitas (\r\n ou \n)
  const paragraphs = text.split(/\r?\n/)
  let currentY = y

  for (let p = 0; p < paragraphs.length; p++) {
    const paragraph = paragraphs[p]

    // Se o parágrafo estiver vazio (linha em branco intencional)
    if (paragraph === '') {
      currentY += lineHeight
      continue
    }

    // Separa mantendo os espaços caso haja múltiplos espaços
    // Regex /(\s+)/ divide preservando os tokens de whitespace
    const tokens = paragraph.split(/(\s+)/)
    let currentLine = ''

    for (let t = 0; t < tokens.length; t++) {
      const token = tokens[t]
      const testLine = currentLine + token
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine.trim().length > 0) {
        ctx.fillText(currentLine, x, currentY)
        // Se o token for apenas whitespace, não inicia a próxima linha com ele
        currentLine = /^\s+$/.test(token) ? '' : token
        currentY += lineHeight
      } else {
        currentLine = testLine
      }
    }

    if (currentLine.length > 0) {
      ctx.fillText(currentLine, x, currentY)
      currentY += lineHeight
    }
  }

  return currentY
}

/**
 * Desenha a logo vetorial oficial do CoffeeCast 4.0 no canvas (fallback)
 */
function drawVectorLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  ctx.translate(cx - size / 2, cy - size / 2)
  const scale = size / 100
  ctx.scale(scale, scale)

  // Gradiente Dourado vibrante e nítido
  const goldGrad = ctx.createLinearGradient(0, 0, 100, 100)
  goldGrad.addColorStop(0, '#FFF2B2')
  goldGrad.addColorStop(0.35, '#F5D061')
  goldGrad.addColorStop(0.7, '#D4AF37')
  goldGrad.addColorStop(1, '#B38612')

  // Círculo pontilhado
  ctx.save()
  ctx.beginPath()
  ctx.arc(50, 50, 46, 0, Math.PI * 2)
  ctx.strokeStyle = goldGrad
  ctx.lineWidth = 2
  ctx.setLineDash([3, 3])
  ctx.globalAlpha = 0.85
  ctx.stroke()
  ctx.restore()

  // Círculo de preenchimento suave
  ctx.save()
  ctx.beginPath()
  ctx.arc(50, 50, 42, 0, Math.PI * 2)
  ctx.fillStyle = '#36142D'
  ctx.globalAlpha = 0.35
  ctx.fill()
  ctx.restore()

  // Estrela brilhante superior com brilho
  ctx.save()
  ctx.shadowColor = '#D4AF37'
  ctx.shadowBlur = 4
  ctx.beginPath()
  ctx.moveTo(50, 11)
  ctx.lineTo(52.2, 17.5)
  ctx.lineTo(59, 20)
  ctx.lineTo(52.2, 22.5)
  ctx.lineTo(50, 29)
  ctx.lineTo(47.8, 22.5)
  ctx.lineTo(41, 20)
  ctx.lineTo(47.8, 17.5)
  ctx.closePath()
  ctx.fillStyle = goldGrad
  ctx.fill()
  ctx.restore()

  // Estrela pequena direita
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(68, 23)
  ctx.lineTo(69.4, 26.5)
  ctx.lineTo(73, 28)
  ctx.lineTo(69.4, 29.5)
  ctx.lineTo(68, 33)
  ctx.lineTo(66.6, 29.5)
  ctx.lineTo(63, 28)
  ctx.lineTo(66.6, 26.5)
  ctx.closePath()
  ctx.fillStyle = goldGrad
  ctx.globalAlpha = 0.95
  ctx.fill()
  ctx.restore()

  // Vapor em forma de coração - dourado vibrante com espessura adequada
  ctx.save()
  ctx.shadowColor = '#D4AF37'
  ctx.shadowBlur = 3
  ctx.beginPath()
  ctx.moveTo(44, 32)
  ctx.bezierCurveTo(41, 28, 35, 29, 35, 34)
  ctx.bezierCurveTo(35, 39, 44, 44, 50, 48)
  ctx.bezierCurveTo(56, 44, 65, 39, 65, 34)
  ctx.bezierCurveTo(65, 29, 59, 28, 56, 32)
  ctx.bezierCurveTo(54, 34, 51, 36, 50, 37)
  ctx.bezierCurveTo(49, 36, 46, 34, 44, 32)
  ctx.strokeStyle = goldGrad
  ctx.lineWidth = 2.8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.restore()

  // Pires da xícara - traço forte e reluzente
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(23, 76)
  ctx.bezierCurveTo(23, 76, 32, 81, 50, 81)
  ctx.bezierCurveTo(68, 81, 77, 76, 77, 76)
  ctx.strokeStyle = goldGrad
  ctx.lineWidth = 3.6
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()

  // Realce superior no pires
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(32, 78)
  ctx.bezierCurveTo(36, 80, 44, 80.8, 50, 80.8)
  ctx.bezierCurveTo(56, 80.8, 64, 80, 68, 78)
  ctx.strokeStyle = '#FFF2B2'
  ctx.lineWidth = 1.4
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()

  // Xícara elegante - bojo vinho profundo com contorno dourado espesso
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(27, 49)
  ctx.bezierCurveTo(27, 66, 35, 75, 50, 75)
  ctx.bezierCurveTo(65, 75, 73, 66, 73, 49)
  ctx.closePath()
  const cupFillGrad = ctx.createLinearGradient(27, 49, 73, 75)
  cupFillGrad.addColorStop(0, '#5A1A3B')
  cupFillGrad.addColorStop(0.5, '#3F122B')
  cupFillGrad.addColorStop(1, '#250B1B')
  ctx.fillStyle = cupFillGrad
  ctx.fill()
  ctx.strokeStyle = goldGrad
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()

  // Friso dourado na borda superior da xícara
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(50, 49, 23, 4, 0, 0, Math.PI * 2)
  ctx.strokeStyle = goldGrad
  ctx.lineWidth = 2.6
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(50, 49, 21.5, 2.8, 0, 0, Math.PI * 2)
  ctx.strokeStyle = '#FFF2B2'
  ctx.lineWidth = 1.2
  ctx.stroke()
  ctx.restore()

  // Asa da xícara - traço forte e nítido
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(72, 52)
  ctx.bezierCurveTo(80, 52, 84, 57, 82, 64)
  ctx.bezierCurveTo(80, 69.5, 74, 71, 69, 68)
  ctx.strokeStyle = goldGrad
  ctx.lineWidth = 3.2
  ctx.lineCap = 'round'
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(73, 54)
  ctx.bezierCurveTo(78, 54, 80.5, 57.5, 79.5, 62)
  ctx.strokeStyle = '#FFF2B2'
  ctx.lineWidth = 1.2
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()

  // Friso interno decorativo
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(37, 57)
  ctx.bezierCurveTo(41, 62, 59, 62, 63, 57)
  ctx.strokeStyle = goldGrad
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()

  ctx.restore()
}

/**
 * Renderiza o convite em um HTMLCanvasElement com altíssima definição (1480 x 2100 px - A5 proporção)
 */
export async function renderInviteToCanvas(
  options: RenderInviteOptions,
): Promise<HTMLCanvasElement> {
  const width = 1480
  const height = 2100
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Falha ao obter contexto 2D do Canvas')
  }

  // Espera que as fontes estejam prontas no documento
  if ('fonts' in document) {
    try {
      await (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready
    } catch {
      // Ignora erro de fontes
    }
  }

  // Pré-carrega imagens com dataURL para garantir ausência de tainted canvas
  let guestImg: HTMLImageElement | null = null
  let companyImg: HTMLImageElement | null = null
  let brandLogoImg: HTMLImageElement | null = null

  // Pré-carrega logo oficial do CoffeeCast 4.0
  try {
    brandLogoImg = await loadImage(officialLogoImg)
  } catch (e) {
    console.warn('Falha ao carregar logo oficial da CoffeeCast 4.0:', e)
  }

  const guestUrl = options.guestPhotoUrl || 'https://img.usecurling.com/ppl/256?gender=female'
  try {
    // Gera PNG pré-recortado circularmente em alta resolução (1024x1024) com enquadramento facial calibrado
    const circularGuestPng = await createCircularGuestPhotoDataUrl(guestUrl, 1024)
    if (circularGuestPng) {
      guestImg = await loadImage(circularGuestPng)
    } else {
      const dataUrl = await toDataURL(guestUrl)
      guestImg = await loadImage(dataUrl)
    }
  } catch (e) {
    console.warn('Erro ao carregar foto do convidado para o canvas:', e)
  }

  if (options.companyLogoUrl) {
    try {
      const dataUrl = await toDataURL(options.companyLogoUrl)
      companyImg = await loadImage(dataUrl)
    } catch (e) {
      console.warn('Erro ao carregar logo da empresa para o canvas:', e)
    }
  }

  // 1. FUNDO PRINCIPAL - Gradiente Vinho Luxuoso
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
  bgGrad.addColorStop(0, '#4B1E3F')
  bgGrad.addColorStop(0.35, '#36142D')
  bgGrad.addColorStop(0.7, '#2A0F23')
  bgGrad.addColorStop(1, '#4B1E3F')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // Texturas radiais de iluminação dourada e vinho sutil
  const radialLight1 = ctx.createRadialGradient(
    width * 0.85,
    height * 0.15,
    10,
    width * 0.85,
    height * 0.15,
    600,
  )
  radialLight1.addColorStop(0, 'rgba(212, 175, 55, 0.18)')
  radialLight1.addColorStop(1, 'rgba(212, 175, 55, 0)')
  ctx.fillStyle = radialLight1
  ctx.fillRect(0, 0, width, height)

  const radialLight2 = ctx.createRadialGradient(
    width * 0.15,
    height * 0.85,
    10,
    width * 0.15,
    height * 0.85,
    700,
  )
  radialLight2.addColorStop(0, 'rgba(200, 142, 155, 0.12)')
  radialLight2.addColorStop(1, 'rgba(200, 142, 155, 0)')
  ctx.fillStyle = radialLight2
  ctx.fillRect(0, 0, width, height)

  // 2. BORDAS DECORATIVAS DOURADAS
  // Borda externa
  ctx.save()
  roundRect(ctx, 40, 40, width - 80, height - 80, 36)
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 4
  ctx.globalAlpha = 0.7
  ctx.stroke()
  ctx.restore()

  // Borda interna fina
  ctx.save()
  roundRect(ctx, 60, 60, width - 120, height - 120, 28)
  ctx.strokeStyle = '#F3E5AB'
  ctx.lineWidth = 1.5
  ctx.globalAlpha = 0.35
  ctx.stroke()
  ctx.restore()

  // Ornamentos nos cantos (estrelas de 4 pontas douradas)
  const drawCornerStar = (x: number, y: number) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.fillStyle = '#D4AF37'
    ctx.beginPath()
    ctx.moveTo(0, -12)
    ctx.lineTo(3, -3)
    ctx.lineTo(12, 0)
    ctx.lineTo(3, 3)
    ctx.lineTo(0, 12)
    ctx.lineTo(-3, 3)
    ctx.lineTo(-12, 0)
    ctx.lineTo(-3, -3)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  drawCornerStar(60, 60)
  drawCornerStar(width - 60, 60)
  drawCornerStar(60, height - 60)
  drawCornerStar(width - 60, height - 60)

  // 3. CABEÇALHO DO CONVITE (Logo discreta no topo para dar total protagonismo à foto do convidado)
  const topY = 125
  ctx.textAlign = 'center'

  if (brandLogoImg) {
    // Versão compacta e elegante da logo da marca no topo
    const logoMaxW = 320
    const logoMaxH = 120
    const logoRatio = brandLogoImg.width / brandLogoImg.height
    let logoDrawW = logoMaxW
    let logoDrawH = logoDrawW / logoRatio
    if (logoDrawH > logoMaxH) {
      logoDrawH = logoMaxH
      logoDrawW = logoDrawH * logoRatio
    }
    const logoX = (width - logoDrawW) / 2
    const logoY = topY - 35

    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 4
    ctx.drawImage(brandLogoImg, logoX, logoY, logoDrawW, logoDrawH)
    ctx.restore()
  } else {
    // Fallback vetorial compacto caso a imagem da logo não carregue
    drawVectorLogo(ctx, width / 2, topY + 10, 85)
    ctx.save()
    ctx.font = 'bold 36px "Playfair Display", Georgia, serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('CoffeeCast ', width / 2 - 32, topY + 80)
    ctx.font = '900 36px "Playfair Display", Georgia, serif'
    ctx.fillStyle = '#D4AF37'
    ctx.fillText('4.0', width / 2 + 82, topY + 80)
    ctx.restore()
  }

  // Subtítulo dourado refinado
  ctx.save()
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif'
  ctx.letterSpacing = '5px'
  ctx.fillStyle = '#F3E5AB'
  ctx.fillText('CONVITE OFICIAL DE PARTICIPAÇÃO', width / 2, topY + 125)
  ctx.restore()

  // 4. CARD CENTRAL (Moldura com foto em destaque absoluto, nome e apresentação)
  const cardX = 130
  const cardY = topY + 160
  const cardW = width - 260
  const hasExtraLocation = Boolean(
    options.enderecoGravacao?.trim() || options.linkLocalizacao?.trim(),
  )
  const cardH = 1260

  ctx.save()
  // Fundo do card
  roundRect(ctx, cardX, cardY, cardW, cardH, 36)
  ctx.fillStyle = 'rgba(42, 15, 35, 0.88)'
  ctx.fill()
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 2.5
  ctx.globalAlpha = 0.55
  ctx.stroke()
  ctx.restore()

  // Se tiver logomarca da empresa no topo do card
  if (companyImg) {
    ctx.save()
    const logoMaxW = 160
    const logoMaxH = 80
    const scale = Math.min(logoMaxW / companyImg.width, logoMaxH / companyImg.height, 1)
    const dw = companyImg.width * scale
    const dh = companyImg.height * scale
    const lx = cardX + cardW - dw - 50
    const ly = cardY + 50

    // Fundo branco suave para a logo da empresa
    roundRect(ctx, lx - 12, ly - 12, dw + 24, dh + 24, 16)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.strokeStyle = '#D4AF37'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.drawImage(companyImg, lx, ly, dw, dh)
    ctx.restore()
  }

  // FOTO DO CONVIDADO(A) - PROTAGONISTA DO CONVITE (MEDALHÃO NOBRE COM BORDA DUPLA DOURADA E HALO)
  const photoSize = 390
  const photoCx = width / 2
  const photoCy = cardY + 235

  // Halo dourado suave atrás da foto para criar profundidade e prestígio
  ctx.save()
  const photoHalo = ctx.createRadialGradient(
    photoCx,
    photoCy,
    photoSize / 2 - 20,
    photoCx,
    photoCy,
    photoSize / 2 + 50,
  )
  photoHalo.addColorStop(0, 'rgba(212, 175, 55, 0.4)')
  photoHalo.addColorStop(0.7, 'rgba(212, 175, 55, 0.12)')
  photoHalo.addColorStop(1, 'rgba(212, 175, 55, 0)')
  ctx.fillStyle = photoHalo
  ctx.beginPath()
  ctx.arc(photoCx, photoCy, photoSize / 2 + 50, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Borda externa sólida decorativa (primeiro anel dourado largo)
  ctx.save()
  const goldRingGrad = ctx.createLinearGradient(
    photoCx - photoSize / 2,
    photoCy - photoSize / 2,
    photoCx + photoSize / 2,
    photoCy + photoSize / 2,
  )
  goldRingGrad.addColorStop(0, '#FFF2B2')
  goldRingGrad.addColorStop(0.4, '#F5D061')
  goldRingGrad.addColorStop(0.8, '#D4AF37')
  goldRingGrad.addColorStop(1, '#996515')

  // Sombra profunda sob o medalhão
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 8

  ctx.beginPath()
  ctx.arc(photoCx, photoCy, photoSize / 2 + 10, 0, Math.PI * 2)
  ctx.strokeStyle = goldRingGrad
  ctx.lineWidth = 8
  ctx.stroke()
  ctx.restore()

  // Anel intermediário escuro para separar os frisos dourados
  ctx.save()
  ctx.beginPath()
  ctx.arc(photoCx, photoCy, photoSize / 2 + 4, 0, Math.PI * 2)
  ctx.strokeStyle = '#2A0F23'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.restore()

  // Anel dourado interno fino
  ctx.save()
  ctx.beginPath()
  ctx.arc(photoCx, photoCy, photoSize / 2 + 1, 0, Math.PI * 2)
  ctx.strokeStyle = '#FFF2B2'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()

  // Imagem do convidado com recorte circular estrito (nada fora do círculo)
  if (guestImg) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(photoCx, photoCy, photoSize / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    // Fundo base escuro dentro do círculo para preenchimento consistente
    ctx.fillStyle = '#2A0F23'
    ctx.fill()

    // Se a imagem já foi pré-recortada circularmente pelo utilitário createCircularGuestPhotoDataUrl (1:1),
    // desenha diretamente preenchendo o diâmetro com nitidez absoluta.
    // Caso contrário (fallback), recalcula as proporções mantendo a centralização/enquadramento superior.
    const imgAspect = guestImg.width / guestImg.height
    let sx = 0
    let sy = 0
    let sWidth = guestImg.width
    let sHeight = guestImg.height

    if (Math.abs(imgAspect - 1) > 0.02) {
      if (imgAspect > 1) {
        // Foto paisagem (mais larga que alta): recorta as laterais mantendo o centro
        sWidth = guestImg.height
        sx = (guestImg.width - sWidth) / 2
      } else if (imgAspect < 1) {
        // Foto retrato vertical: focar no terço superior (rosto e ombros do convidado) para não cortar a cabeça
        sHeight = guestImg.width
        const maxOffsetY = guestImg.height - sHeight
        sy = Math.min(Math.max(0, (guestImg.height - sHeight) * 0.18), maxOffsetY)
      }
    }

    ctx.drawImage(
      guestImg,
      sx,
      sy,
      sWidth,
      sHeight,
      photoCx - photoSize / 2,
      photoCy - photoSize / 2,
      photoSize,
      photoSize,
    )
    ctx.restore()
  } else {
    // Fallback elegante caso a foto falhe no carregamento
    ctx.save()
    ctx.beginPath()
    ctx.arc(photoCx, photoCy, photoSize / 2, 0, Math.PI * 2)
    ctx.fillStyle = '#4B1E3F'
    ctx.fill()
    ctx.font = 'bold 96px "Playfair Display", Georgia, serif'
    ctx.fillStyle = '#D4AF37'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const initials = (options.nome || 'C')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase()
    ctx.fillText(initials || 'C', photoCx, photoCy)
    ctx.restore()
  }

  // Brilho/estrelinha dourada sobre o medalhão (canto inferior direito) - sem fundo escuro ou quadrado
  ctx.save()
  const starX = photoCx + photoSize / 2 - 24
  const starY = photoCy + photoSize / 2 - 24

  // Halo dourado sutil de brilho atrás da estrela para contraste nobre
  const starGlow = ctx.createRadialGradient(starX, starY, 2, starX, starY, 26)
  starGlow.addColorStop(0, 'rgba(255, 242, 178, 0.45)')
  starGlow.addColorStop(0.5, 'rgba(212, 175, 55, 0.25)')
  starGlow.addColorStop(1, 'rgba(212, 175, 55, 0)')
  ctx.fillStyle = starGlow
  ctx.beginPath()
  ctx.arc(starX, starY, 26, 0, Math.PI * 2)
  ctx.fill()

  // Estrela principal de 4 pontas dourada com brilho
  ctx.save()
  ctx.translate(starX, starY)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2

  // Estrela principal
  const starGrad = ctx.createLinearGradient(-18, -18, 18, 18)
  starGrad.addColorStop(0, '#FFFFFF')
  starGrad.addColorStop(0.3, '#FFF2B2')
  starGrad.addColorStop(0.7, '#D4AF37')
  starGrad.addColorStop(1, '#B38612')
  ctx.fillStyle = starGrad

  ctx.beginPath()
  ctx.moveTo(0, -22)
  ctx.lineTo(5.5, -5.5)
  ctx.lineTo(22, 0)
  ctx.lineTo(5.5, 5.5)
  ctx.lineTo(0, 22)
  ctx.lineTo(-5.5, 5.5)
  ctx.lineTo(-22, 0)
  ctx.lineTo(-5.5, -5.5)
  ctx.closePath()
  ctx.fill()

  // Estrela menor auxiliar brilhando ao lado (estilo Sparkles)
  ctx.beginPath()
  ctx.moveTo(13, -13 - 9)
  ctx.lineTo(13 + 2.5, -13 - 2.5)
  ctx.lineTo(13 + 9, -13)
  ctx.lineTo(13 + 2.5, -13 + 2.5)
  ctx.lineTo(13, -13 + 9)
  ctx.lineTo(13 - 2.5, -13 + 2.5)
  ctx.lineTo(13 - 9, -13)
  ctx.lineTo(13 - 2.5, -13 - 2.5)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
  ctx.restore()

  // Rótulo de Convidado(a) de Honra ajustado por gênero
  const honorLabel =
    options.tipoConvidado === 'convidada'
      ? 'CONVIDADA DE HONRA'
      : options.tipoConvidado === 'convidado'
        ? 'CONVIDADO DE HONRA'
        : 'CONVIDADO(A) DE HONRA'

  ctx.save()
  ctx.font = '700 23px "Plus Jakarta Sans", sans-serif'
  ctx.letterSpacing = '5px'
  ctx.fillStyle = '#D4AF37'
  ctx.textAlign = 'center'
  ctx.fillText(honorLabel, width / 2, photoCy + photoSize / 2 + 65)
  ctx.restore()

  // Nome do Convidado em Grande Destaque Tipográfico
  ctx.save()
  ctx.font = 'bold 64px "Playfair Display", Georgia, serif'
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 3
  ctx.fillText(options.nome || 'Convidado Especial', width / 2, photoCy + photoSize / 2 + 140)
  ctx.restore()

  // Linha dourada decorativa abaixo do nome
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(width / 2 - 160, photoCy + photoSize / 2 + 175)
  ctx.lineTo(width / 2 + 160, photoCy + photoSize / 2 + 175)
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 2
  ctx.stroke()
  // Ponto central
  ctx.beginPath()
  ctx.arc(width / 2, photoCy + photoSize / 2 + 175, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#D4AF37'
  ctx.fill()
  ctx.restore()

  // Texto de Apresentação (itálico com aspas, preservando quebras de linha e espaçamentos)
  ctx.save()
  const rawText = (options.apresentacao || '').trim()
  const lineBreaks = rawText.split(/\r?\n/).length
  const rawLen = rawText.length

  // Tipografia adaptativa para o canvas do JPEG caso o texto seja longo
  let fontSize = 28
  let lineHeight = 42
  if (rawLen > 380 || lineBreaks > 7) {
    fontSize = 21
    lineHeight = 31
  } else if (rawLen > 250 || lineBreaks > 4) {
    fontSize = 24
    lineHeight = 36
  }

  ctx.font = `italic 300 ${fontSize}px "Plus Jakarta Sans", Georgia, serif`
  ctx.fillStyle = 'rgba(250, 248, 245, 0.92)'
  ctx.textAlign = 'center'
  const textQuote = `"${rawText}"`
  const textStartY = photoCy + photoSize / 2 + 220
  wrapPreformattedText(ctx, textQuote, width / 2, textStartY, cardW - 160, lineHeight)
  ctx.restore()

  // BLOCOS INFORMATIVOS DE GRAVAÇÃO (Data e Horário)
  const infoBoxH = hasExtraLocation ? 100 : 130
  const infoBoxY = hasExtraLocation ? cardY + cardH - 300 : cardY + cardH - 210
  const infoBoxW = (cardW - 140) / 2

  // Caixa 1: Data
  ctx.save()
  roundRect(ctx, cardX + 50, infoBoxY, infoBoxW, infoBoxH, 18)
  ctx.fillStyle = 'rgba(75, 30, 63, 0.85)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.font = '700 16px "Plus Jakarta Sans", sans-serif'
  ctx.letterSpacing = '2px'
  ctx.fillStyle = '#D4AF37'
  ctx.fillText('DATA DA GRAVAÇÃO', cardX + 50 + infoBoxW / 2, infoBoxY + 36)

  ctx.font = 'bold 28px "Playfair Display", Georgia, serif'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(options.dataGravacao, cardX + 50 + infoBoxW / 2, infoBoxY + 76)
  ctx.restore()

  // Caixa 2: Horário
  ctx.save()
  roundRect(ctx, cardX + 90 + infoBoxW, infoBoxY, infoBoxW, infoBoxH, 18)
  ctx.fillStyle = 'rgba(75, 30, 63, 0.85)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.font = '700 16px "Plus Jakarta Sans", sans-serif'
  ctx.letterSpacing = '2px'
  ctx.fillStyle = '#D4AF37'
  ctx.fillText('HORÁRIO MARCADO', cardX + 90 + infoBoxW + infoBoxW / 2, infoBoxY + 36)

  ctx.font = 'bold 28px "Playfair Display", Georgia, serif'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(options.horario || '14:00', cardX + 90 + infoBoxW + infoBoxW / 2, infoBoxY + 76)
  ctx.restore()

  // BLOCO DE ENDEREÇO DA GRAVAÇÃO E LOCALIZAÇÃO (SE INFORMADOS)
  if (hasExtraLocation) {
    const locBoxY = infoBoxY + infoBoxH + 16
    const locBoxW = cardW - 100
    const hasAddress = Boolean(options.enderecoGravacao?.trim())
    const hasLink = Boolean(options.linkLocalizacao?.trim())
    const locBoxH = hasAddress && hasLink ? 150 : 100

    ctx.save()
    roundRect(ctx, cardX + 50, locBoxY, locBoxW, locBoxH, 18)
    ctx.fillStyle = 'rgba(42, 15, 35, 0.92)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    let curY = locBoxY + 32
    if (hasAddress) {
      ctx.textAlign = 'center'
      ctx.font = '700 15px "Plus Jakarta Sans", sans-serif'
      ctx.letterSpacing = '1.5px'
      ctx.fillStyle = '#D4AF37'
      ctx.fillText('ENDEREÇO DA GRAVAÇÃO:', width / 2, curY)
      curY += 26

      ctx.font = '400 18px "Plus Jakarta Sans", sans-serif'
      ctx.fillStyle = '#FAF8F5'
      const endLine = options.enderecoGravacao!.trim()
      ctx.fillText(endLine, width / 2, curY)
      curY += 32
    }

    if (hasLink) {
      ctx.textAlign = 'center'
      ctx.font = '700 15px "Plus Jakarta Sans", sans-serif'
      ctx.letterSpacing = '1px'
      ctx.fillStyle = '#F3E5AB'
      ctx.fillText('📍 LOCALIZAÇÃO: Ver no Google Maps (link interativo no PDF)', width / 2, curY)
    }
    ctx.restore()
  }

  // 5. RODAPÉ DO CONVITE
  const footerY = height - 160
  ctx.save()
  ctx.textAlign = 'center'
  ctx.font = 'italic 24px "Playfair Display", Georgia, serif'
  ctx.fillStyle = '#F3E5AB'
  ctx.fillText('"Aqui o café pode até esfriar, mas o papo nunca! ☕️"', width / 2, footerY)

  ctx.font = '700 18px "Plus Jakarta Sans", sans-serif'
  ctx.letterSpacing = '3px'
  ctx.fillStyle = 'rgba(250, 248, 245, 0.65)'
  ctx.fillText('EQUIPE COFFEECAST 4.0 • ALINE LANA', width / 2, footerY + 45)
  ctx.restore()

  return canvas
}

/**
 * Dispara o download imediato de um Canvas como JPEG com alta compressão de qualidade (0.95)
 */
export function downloadCanvasAsJpeg(canvas: HTMLCanvasElement, filename: string) {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
  const link = document.createElement('a')
  link.download =
    filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? filename : `${filename}.jpg`
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Utilitário para geração de slug seguro no nome de arquivo de convite
 */
export function buildInvitePdfFileName(nome: string): string {
  const safeGuestSlug =
    (nome || 'convidado')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'convidado'

  return `convite_coffeecast_${safeGuestSlug}.pdf`
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export interface BuildInvitePdfHtmlOptions {
  nome: string
  tipoConvidado?: 'convidado' | 'convidada'
  dataGravacao: string
  horario: string
  apresentacao: string
  enderecoGravacao?: string
  linkLocalizacao?: string
  guestPhotoDataUrl?: string
  companyLogoDataUrl?: string
}

/**
 * Monta o documento HTML completo com CSS @page A5 portrait oficial (148mm x 210mm)
 * com margens zero e fidelidade gráfica total para gerar o PDF em janela dedicada.
 */
export function buildInvitePdfHtml(options: BuildInvitePdfHtmlOptions): string {
  const guestPhoto = options.guestPhotoDataUrl || 'https://img.usecurling.com/ppl/256?gender=female'
  const isConvidado = options.tipoConvidado === 'convidado'
  const isConvidada = options.tipoConvidado === 'convidada'
  const honorLabel = isConvidada
    ? 'Convidada de Honra'
    : isConvidado
      ? 'Convidado de Honra'
      : 'Convidado(a) de Honra'

  const safeNome = escapeHtml(options.nome || 'Convidado(a) Especial')
  const safeData = escapeHtml(options.dataGravacao)
  const safeHorario = escapeHtml(options.horario || '14:00')
  const safeApresentacao = escapeHtml(options.apresentacao || '')
  const safeEndereco = escapeHtml(options.enderecoGravacao?.trim() || '')
  const safeLink = escapeHtml(options.linkLocalizacao?.trim() || '')

  const rawLen = (options.apresentacao || '').length
  const lineCount = (options.apresentacao || '').split(/\r?\n/).length

  let fontSize = '8.8pt'
  let lineHeight = '1.35'
  let marginY = '2mm auto 3mm auto'
  if (rawLen > 400 || lineCount > 7) {
    fontSize = '6.8pt'
    lineHeight = '1.2'
    marginY = '1mm auto 1.5mm auto'
  } else if (rawLen > 280 || lineCount > 5) {
    fontSize = '7.5pt'
    lineHeight = '1.25'
    marginY = '1.2mm auto 2mm auto'
  } else if (rawLen > 180 || lineCount > 3) {
    fontSize = '8.2pt'
    lineHeight = '1.3'
    marginY = '1.5mm auto 2.5mm auto'
  }

  const hasExtraLocation = Boolean(safeEndereco || safeLink)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Convite Oficial - ${safeNome}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: 148mm 210mm;
      margin: 0;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 148mm;
      height: 210mm;
      max-width: 148mm;
      max-height: 210mm;
      overflow: hidden;
      background: #4B1E3F;
      color: #FAF8F5;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* BARRA SUPERIOR DE AÇÕES NA VISUALIZAÇÃO INTERATIVA EM TELA */
    .screen-actions-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 99999;
      background: #36142D;
      color: #FAF8F5;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 2px solid #D4AF37;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .screen-actions-bar .info {
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .screen-actions-bar .btn-print {
      background: #D4AF37;
      color: #4B1E3F;
      border: none;
      font-weight: 700;
      font-size: 13px;
      padding: 8px 18px;
      border-radius: 9999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: transform 0.15s ease, background 0.15s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }

    .screen-actions-bar .btn-print:hover {
      background: #E5C358;
      transform: scale(1.02);
    }

    .screen-actions-bar .btn-close {
      background: rgba(255,255,255,0.15);
      color: #FAF8F5;
      border: 1px solid rgba(255,255,255,0.25);
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 9999px;
      cursor: pointer;
    }

    .screen-tip {
      font-size: 11px;
      color: #F3E5AB;
      margin-left: 6px;
    }

    @media print {
      .screen-actions-bar {
        display: none !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #4B1E3F !important;
        width: 148mm !important;
        height: 210mm !important;
        max-width: 148mm !important;
        max-height: 210mm !important;
        overflow: hidden !important;
      }
      .page-container {
        margin-top: 0 !important;
        box-shadow: none !important;
      }
    }

    @media screen {
      body {
        background: #1F0B18;
        padding: 64px 0 24px 0;
        min-height: 100vh;
        width: 100vw;
        max-width: none;
        max-height: none;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    }

    .page-container {
      width: 148mm;
      height: 210mm;
      max-width: 148mm;
      max-height: 210mm;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      background: linear-gradient(180deg, #4B1E3F 0%, #36142D 35%, #2A0F23 70%, #4B1E3F 100%);
      color: #FAF8F5;
      padding: 8mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: avoid;
      break-after: avoid;
      box-shadow: 0 12px 36px rgba(0,0,0,0.6);
    }

    /* Bordas decorativas douradas */
    .border-outer {
      position: absolute;
      top: 3.5mm;
      left: 3.5mm;
      right: 3.5mm;
      bottom: 3.5mm;
      border: 1.6px solid rgba(212, 175, 55, 0.65);
      border-radius: 8mm;
      pointer-events: none;
    }

    .border-inner {
      position: absolute;
      top: 5.5mm;
      left: 5.5mm;
      right: 5.5mm;
      bottom: 5.5mm;
      border: 0.8px solid rgba(212, 175, 55, 0.3);
      border-radius: 6mm;
      pointer-events: none;
    }

    /* Cabeçalho */
    .header-block {
      text-align: center;
      position: relative;
      z-index: 10;
      margin-top: 1mm;
      margin-bottom: 1mm;
    }

    .header-logo {
      width: 32mm;
      max-height: 14mm;
      object-fit: contain;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
      display: block;
      margin: 0 auto 0.8mm auto;
    }

    .header-subtitle {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: #F3E5AB;
      font-weight: 700;
      margin: 0.5mm 0 0 0;
    }

    /* Card Central */
    .card-block {
      background-color: rgba(42, 15, 35, 0.88);
      border: 1px solid rgba(212, 175, 55, 0.45);
      border-radius: 6mm;
      padding: 4mm 4.5mm;
      position: relative;
      z-index: 10;
      text-align: center;
      margin: 1mm 0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
    }

    .company-logo-badge {
      position: absolute;
      top: 3mm;
      right: 3.5mm;
      z-index: 20;
    }

    .company-logo-badge img {
      height: 8.5mm;
      max-width: 26mm;
      object-fit: contain;
      border-radius: 2mm;
      background-color: #FFFFFF;
      padding: 0.8mm;
      border: 0.8px solid rgba(212, 175, 55, 0.5);
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }

    /* Foto circular do convidado */
    .photo-wrapper {
      display: flex;
      justify-content: center;
      margin-bottom: 2mm;
      padding-top: 1mm;
      overflow: visible;
    }

    .photo-frame {
      position: relative;
      width: 44mm;
      height: 44mm;
      min-width: 44mm;
      min-height: 44mm;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: visible;
      flex-shrink: 0;
    }

    .photo-gold-ring {
      position: relative;
      width: 40mm;
      height: 40mm;
      min-width: 40mm;
      min-height: 40mm;
      max-width: 40mm;
      max-height: 40mm;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFF2B2 0%, #D4AF37 50%, #B38612 100%);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
      padding: 1.2mm;
      box-sizing: border-box;
      overflow: hidden;
      flex-shrink: 0;
      -webkit-mask-image: -webkit-radial-gradient(circle, white 100%, black 100%);
      mask-image: radial-gradient(circle, white 100%, black 100%);
    }

    .photo-dark-ring {
      width: 100%;
      height: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      background-color: #2A0F23;
      padding: 1mm;
      box-sizing: border-box;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      -webkit-mask-image: -webkit-radial-gradient(circle, white 100%, black 100%);
      mask-image: radial-gradient(circle, white 100%, black 100%);
    }

    .photo-img {
      width: 100%;
      height: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      object-fit: cover;
      object-position: 50% 18%;
      border: 1.2px solid rgba(212, 175, 55, 0.85);
      display: block;
      box-sizing: border-box;
      flex-shrink: 0;
      background-color: transparent;
    }

    .photo-star {
      position: absolute;
      bottom: 0.8mm;
      right: 0.8mm;
      background: transparent !important;
      border: none !important;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7));
      z-index: 10;
    }

    /* Títulos */
    .guest-label {
      font-size: 7.5pt;
      color: #F3E5AB;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 2px;
      display: block;
    }

    .guest-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 17pt;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0.8mm 0 0 0;
      line-height: 1.15;
      letter-spacing: -0.2px;
    }

    .separator-line {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2mm;
      margin: 1.5mm auto;
      max-width: 40mm;
    }

    .separator-line .bar {
      height: 1px;
      flex: 1;
      background-color: rgba(212, 175, 55, 0.8);
    }

    .separator-line .dot {
      width: 1.6mm;
      height: 1.6mm;
      border-radius: 50%;
      background-color: #D4AF37;
    }

    .presentation-text {
      font-size: ${fontSize};
      line-height: ${lineHeight};
      color: rgba(250, 248, 245, 0.95);
      font-weight: 300;
      font-style: italic;
      margin: ${marginY};
      max-width: 116mm;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: break-word;
      text-align: center;
    }

    /* Informações de Gravação */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.5mm;
      padding-top: 2.5mm;
      border-top: 0.8px solid rgba(212, 175, 55, 0.35);
    }

    .info-card {
      background-color: rgba(75, 30, 63, 0.75);
      padding: 2mm 2.5mm;
      border-radius: 2.5mm;
      border: 0.8px solid rgba(212, 175, 55, 0.25);
      text-align: center;
    }

    .info-card-label {
      font-size: 6.5pt;
      color: #D4AF37;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 1px;
      display: block;
      margin-bottom: 0.6mm;
    }

    .info-card-value {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 9.5pt;
      font-weight: 700;
      color: #FFFFFF;
      display: block;
    }

    /* Bloco de Localização e Endereço */
    .location-box {
      margin-top: 2.5mm;
      background-color: rgba(75, 30, 63, 0.85);
      padding: 2.5mm 3mm;
      border-radius: 2.5mm;
      border: 0.8px solid rgba(212, 175, 55, 0.35);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .location-address-label {
      font-size: 6.5pt;
      color: #D4AF37;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 1px;
      display: block;
      margin-bottom: 0.6mm;
      text-align: center;
    }

    .location-address-value {
      font-size: 8pt;
      color: #FFFFFF;
      line-height: 1.3;
      display: block;
      text-align: center;
    }

    .location-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 1.4mm 4mm;
      background-color: rgba(212, 175, 55, 0.22);
      border: 0.9px solid #D4AF37;
      border-radius: 2mm;
      color: #FFF2B2 !important;
      font-size: 7.5pt;
      font-weight: 700;
      text-decoration: none !important;
      letter-spacing: 0.4px;
      margin: 0 auto;
    }

    /* Rodapé */
    .footer-block {
      text-align: center;
      position: relative;
      z-index: 10;
      margin-bottom: 1.5mm;
      margin-top: 1mm;
    }

    .footer-quote {
      font-size: 8.5pt;
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      color: #F3E5AB;
      margin: 0 0 1mm 0;
    }

    .footer-brand {
      font-size: 7pt;
      color: rgba(250, 248, 245, 0.7);
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 600;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="screen-actions-bar">
    <div class="info">
      <strong style="color:#D4AF37;">CoffeeCast 4.0</strong>
      <span>•</span>
      <span>Convite Oficial de <strong>${safeNome}</strong></span>
      <span class="screen-tip">(Formato A5 • Ative "Gráficos de segundo plano" para salvar)</span>
    </div>
    <div style="display:flex; align-items:center; gap:8px;">
      <button class="btn-print" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        <span>Salvar PDF / Imprimir</span>
      </button>
      <button class="btn-close" onclick="window.close()">Fechar</button>
    </div>
  </div>

  <div class="page-container">
    <div class="border-outer"></div>
    <div class="border-inner"></div>

    <!-- Cabeçalho -->
    <div class="header-block">
      <img src="${officialLogoImg}" alt="CoffeeCast 4.0" class="header-logo" />
      <p class="header-subtitle">Convite Oficial de Participação</p>
    </div>

    <!-- Card Central -->
    <div class="card-block">
      ${
        options.companyLogoDataUrl
          ? `<div class="company-logo-badge"><img src="${options.companyLogoDataUrl}" alt="Empresa Convidada" /></div>`
          : ''
      }

      <!-- Foto da pessoa convidada com medalhão de anéis dourados -->
      <div class="photo-wrapper">
        <div class="photo-frame">
          <div class="photo-gold-ring">
            <div class="photo-dark-ring">
              <img src="${guestPhoto}" alt="${safeNome}" class="photo-img" />
            </div>
          </div>
          <!-- Estrela dourada no canto sem fundo quadrado -->
          <div class="photo-star">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#D4AF37" stroke="#FFF2B2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Rótulo e Nome -->
      <div style="margin-bottom: 1.2mm;">
        <span class="guest-label">${honorLabel}</span>
        <h2 class="guest-name">${safeNome}</h2>
      </div>

      <!-- Linha divisória -->
      <div class="separator-line">
        <div class="bar"></div>
        <div class="dot"></div>
        <div class="bar"></div>
      </div>

      <!-- Texto de Apresentação -->
      <p class="presentation-text">"${safeApresentacao}"</p>

      <!-- Informações de Gravação -->
      <div class="info-grid">
        <div class="info-card">
          <span class="info-card-label">Data da Gravação</span>
          <span class="info-card-value">${safeData}</span>
        </div>
        <div class="info-card">
          <span class="info-card-label">Horário Marcado</span>
          <span class="info-card-value">${safeHorario}</span>
        </div>
      </div>

      <!-- Endereço e Localização -->
      ${
        hasExtraLocation
          ? `
      <div class="location-box">
        ${
          safeEndereco
            ? `
        <div style="margin-bottom: ${safeLink ? '1.8mm' : '0'}; width: 100%;">
          <span class="location-address-label">Endereço da gravação:</span>
          <span class="location-address-value">${safeEndereco}</span>
        </div>`
            : ''
        }

        ${
          safeLink
            ? `
        <div style="padding-top: ${safeEndereco ? '1.8mm' : '0'}; border-top: ${safeEndereco ? '0.6px solid rgba(212, 175, 55, 0.25)' : 'none'}; width: 100%; display: flex; flex-direction: column; align-items: center;">
          <span class="location-address-label">Localização</span>
          <a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="location-btn">
            📍 Ver no Google Maps
          </a>
        </div>`
            : ''
        }
      </div>`
          : ''
      }
    </div>

    <!-- Rodapé -->
    <div class="footer-block">
      <p class="footer-quote">"Aqui o café pode até esfriar, mas o papo nunca! ☕️"</p>
      <p class="footer-brand">Equipe CoffeeCast 4.0 • Aline Lana</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Dispara o download/impressão em PDF do convite através de uma janela dedicada limpa,
 * com CSS @page A5 portrait oficial (148 x 210 mm) e suporte a fallback de janela/impressão direta.
 */
export async function downloadInvitePdf(options: BuildInvitePdfHtmlOptions): Promise<void> {
  const fileName = buildInvitePdfFileName(options.nome)
  const htmlContent = buildInvitePdfHtml(options)

  const printWindow = window.open(
    '',
    '_blank',
    'width=750,height=960,menubar=no,toolbar=no,location=no,status=no',
  )
  if (!printWindow) {
    throw new Error('Abertura de nova janela bloqueada pelo navegador.')
  }

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Define o título do documento para sugestão do nome do PDF ao salvar
  printWindow.document.title = fileName.replace(/\.pdf$/i, '')

  // Aguarda fontes e imagens renderizarem antes de invocar print
  await new Promise((resolve) => {
    let resolved = false
    const finish = () => {
      if (!resolved) {
        resolved = true
        resolve(true)
      }
    }

    printWindow.onload = () => {
      setTimeout(finish, 250)
    }

    setTimeout(finish, 800)
  })

  try {
    printWindow.focus()
    printWindow.print()
  } catch (err) {
    console.warn('Falha ao abrir diálogo de impressão da janela do PDF de convite:', err)
  }
}
