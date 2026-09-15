import pb from '@/lib/pocketbase/client'

/**
 * Retorna URL completa de um arquivo armazenado no PocketBase
 */
export function getFileUrl(
  record: { id: string; collectionId?: string; collectionName?: string },
  filename?: string,
  thumb?: string,
): string {
  if (!filename) return ''
  return pb.files.getURL(record, filename, thumb ? { thumb } : undefined)
}

/**
 * Formata valores monetários em BRL (R$ 0,00)
 */
export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

/**
 * Formata datas ISO para padrão brasileiro DD/MM/AAAA
 */
export function formatDateBR(dateString?: string): string {
  if (!dateString) return '-'
  try {
    const parts = dateString.split('T')[0].split(' ')[0].split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dateString
  }
}

/**
 * Extrai o ID do YouTube de URLs comuns (watch?v=, youtu.be, shorts, embed)
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}
