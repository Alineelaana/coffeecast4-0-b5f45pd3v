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

/**
 * Normaliza links de redes sociais colados pelo usuário.
 * Aceita URL completa (com http/https), sem protocolo, arroba ou caminhos adicionais.
 * Retorna uma URL completa segura com https:// ou string vazia se inválido.
 */
export function normalizeSocialUrl(
  network: 'tiktok' | 'facebook' | 'instagram' | 'linkedin',
  input?: string,
): string {
  if (!input) return ''
  let val = input.trim()
  if (!val) return ''

  // Se já começar com http:// ou https://, garante https://
  if (/^https?:\/\//i.test(val)) {
    return val.replace(/^http:\/\//i, 'https://')
  }

  // Remove arrobas iniciais comuns (ex.: @coffeecast4.0)
  val = val.replace(/^@+/, '').trim()
  if (!val) return ''

  // Se o usuário colou o domínio direto (ex.: instagram.com/coffeecast ou www.tiktok.com/@cafe)
  if (
    val.startsWith('instagram.com') ||
    val.startsWith('www.instagram.com') ||
    val.startsWith('tiktok.com') ||
    val.startsWith('www.tiktok.com') ||
    val.startsWith('facebook.com') ||
    val.startsWith('www.facebook.com') ||
    val.startsWith('linkedin.com') ||
    val.startsWith('www.linkedin.com')
  ) {
    return `https://${val}`
  }

  // Se for apenas o handle/nome de usuário
  switch (network) {
    case 'tiktok':
      return `https://www.tiktok.com/@${val.replace(/^@/, '')}`
    case 'facebook':
      return `https://www.facebook.com/${val}`
    case 'instagram':
      return `https://www.instagram.com/${val}`
    case 'linkedin':
      // Se não contiver /company/ ou /in/, padrão company ou perfil direto
      if (val.startsWith('company/') || val.startsWith('in/')) {
        return `https://www.linkedin.com/${val}`
      }
      return `https://www.linkedin.com/company/${val}`
    default:
      return `https://${val}`
  }
}
