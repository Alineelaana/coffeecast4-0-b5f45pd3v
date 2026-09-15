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
/**
 * Converte qualquer representação de data (ISO com T ou espaço, timestamp PocketBase, YYYY-MM-DD, etc.)
 * para o formato estrito YYYY-MM-DD exigido por inputs HTML `<input type="date" />`.
 */
export function toInputDate(val?: string | null): string {
  if (!val) return ''
  const trimmed = String(val).trim()
  if (!trimmed) return ''

  // 1. Tenta extrair diretamente YYYY-MM-DD caso comece com padrão de 4 dígitos
  // Exemplos suportados: "2025-01-15 00:00:00.000Z", "2025-01-15T14:30:00Z", "2025-01-15"
  const directMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (directMatch) {
    return `${directMatch[1]}-${directMatch[2]}-${directMatch[3]}`
  }

  // 2. Se for formato brasileiro DD/MM/AAAA ou DD-MM-AAAA
  const brMatch = trimmed.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/)
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`
  }

  // 3. Fallback via parse do Date object
  try {
    const d = new Date(trimmed)
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  } catch {
    // ignora erro e retorna vazio
  }

  return ''
}

/**
 * Formata datas ISO para padrão brasileiro DD/MM/AAAA
 */
export function formatDateBR(dateString?: string): string {
  if (!dateString) return '-'
  try {
    const inputDate = toInputDate(dateString)
    if (inputDate) {
      const [y, m, d] = inputDate.split('-')
      return `${d}/${m}/${y}`
    }
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dateString
  }
}

/**
 * Extrai e normaliza username e link de perfil do Instagram a partir de @usuario, usuario ou URL completa.
 */
export function parseInstagramHandle(raw?: string): { username: string; url: string } | null {
  if (!raw) return null
  let val = raw.trim()
  if (!val) return null

  // Tratar caso o usuário cole uma URL completa como https://instagram.com/usuario ou instagram.com/usuario
  try {
    if (val.startsWith('http://') || val.startsWith('https://')) {
      const parsed = new URL(val)
      const pathParts = parsed.pathname.split('/').filter(Boolean)
      if (pathParts.length > 0) {
        val = pathParts[0]
      }
    } else if (val.includes('instagram.com/')) {
      const after = val.split('instagram.com/')[1] || ''
      const pathParts = after.split(/[/?#]/).filter(Boolean)
      if (pathParts.length > 0) {
        val = pathParts[0]
      }
    }
  } catch {
    // ignora falhas de parse de URL
  }

  // Remove arrobas, barras, espaços e caracteres indesejados
  const cleanUsername = val.replace(/^@+/, '').replace(/\/.*$/, '').trim()
  if (!cleanUsername) return null

  return {
    username: `@${cleanUsername}`,
    url: `https://instagram.com/${cleanUsername}`,
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
