// src/lib/imagemOptimizer.ts
// Redimensiona/comprime imagens no client-side antes do upload (canvas).
// Regra combinada: largura máxima ~1600px, exportação JPEG ~80%.
// PNG com transparência é mantido (não forçamos JPEG, que destruiria o alpha).

export const LARGURA_MAXIMA_UPLOAD = 1600
export const QUALIDADE_JPEG = 0.8

/**
 * Otimiza a imagem para upload: redimensiona se for maior que 1600px de
 * largura e comprime em JPEG ~80%. Retorna o arquivo otimizado e uma
 * mensagem descritiva do que foi feito (para exibir no admin).
 * Imagens menores ou PNG com transparência são devolvidas como estão (o
 * PocketBase aplica o limite de tamanho já configurado na collection).
 */
export async function otimizarImagem(
  file: File,
  larguraMax = LARGURA_MAXIMA_UPLOAD,
  qualidade = QUALIDADE_JPEG,
): Promise<{ file: File; info: string | null }> {
  const original = await otimizarImagemParaUpload(file, larguraMax, qualidade)
  if (original === file) return { file, info: null }
  const porcentagem = Math.round((1 - original.size / file.size) * 100)
  const kb = (bytes: number) => Math.round(bytes / 1024)
  return {
    file: original,
    info: `Imagem otimizada: ${kb(file.size)} KB → ${kb(original.size)} KB (-${Math.max(0, porcentagem)}%).`,
  }
}

/** Redimensiona a imagem se for maior que 1600px de largura e comprime em JPEG. */
export async function otimizarImagemParaUpload(
  file: File,
  larguraMax = LARGURA_MAXIMA_UPLOAD,
  qualidade = QUALIDADE_JPEG,
): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (typeof document === 'undefined') return file

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler arquivo'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Imagem inválida'))
    el.src = dataUrl
  })

  const precisaRedimensionar = img.naturalWidth > larguraMax
  const temTransparencia =
    file.type === 'image/png' || file.type === 'image/webp'
      ? await detectarTransparencia(img)
      : false

  if (
    !precisaRedimensionar &&
    !temTransparencia &&
    (file.type === 'image/jpeg' || file.type === 'image/webp')
  ) {
    // Já está dentro do tamanho e num formato comprimido — não mexe.
    return file
  }

  const escala = Math.min(1, larguraMax / img.naturalWidth)
  const largura = Math.round(img.naturalWidth * escala)
  const altura = Math.round(img.naturalHeight * escala)

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(img, 0, 0, largura, altura)

  const mime = temTransparencia ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, qualidade))
  if (!blob || blob.size >= file.size) return file

  const extensao = mime === 'image/png' ? 'png' : 'jpg'
  const nomeBase = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
  return new File([blob], `${nomeBase}-otimizada.${extensao}`, { type: mime })
}

/** Detecta se a imagem tem pixels transparentes (para não transformar PNG em JPEG). */
async function detectarTransparencia(img: HTMLImageElement): Promise<boolean> {
  try {
    const canvas = document.createElement('canvas')
    const escala = Math.min(1, 64 / Math.max(img.naturalWidth, img.naturalHeight))
    canvas.width = Math.max(1, Math.round(img.naturalWidth * escala))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * escala))
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return false
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) return true
    }
    return false
  } catch {
    return false
  }
}
