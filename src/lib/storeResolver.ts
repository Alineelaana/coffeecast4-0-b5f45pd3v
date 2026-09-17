import { StorefrontService } from '@/services/storefront'
import type { StoreRecord } from '@/types/database'

// Domínios principais do projeto base CoffeeCast 4.0
const MAIN_HOSTNAMES = [
  'inicio-do-projeto-df3d5.goskip.app',
  'inicio-do-projeto-df3d5--preview.goskip.app',
  'localhost',
  '127.0.0.1',
]

/**
 * Verifica se um hostname é o domínio principal do CoffeeCast ou um domínio customizado apontando para uma loja.
 */
export function isMainPlatformHostname(hostname: string): boolean {
  const clean = hostname.trim().toLowerCase().split(':')[0]
  if (MAIN_HOSTNAMES.includes(clean)) return true
  if (clean.endsWith('.goskip.app') || clean.endsWith('.goskip.dev')) return true
  return false
}

/**
 * Resolução de loja:
 * 1. Se path começa com /loja/:slug -> busca por slug
 * 2. Se hostname for diferente dos domínios da plataforma base -> busca por domain
 * 3. Caso contrário -> null (CoffeeCast original)
 */
export async function resolveStoreFromEnvironment(
  pathname: string,
  hostname: string,
): Promise<{
  store: StoreRecord | null
  source: 'slug' | 'domain' | 'none'
  slugOrDomain?: string
}> {
  const cleanHost = hostname.trim().toLowerCase().split(':')[0]

  // (1) Resolução por slug (/loja/<slug>)
  const match = pathname.match(/^\/loja\/([^/?#]+)/i)
  if (match && match[1]) {
    const slug = match[1].toLowerCase()
    const store = await StorefrontService.getStoreBySlug(slug)
    return { store, source: 'slug', slugOrDomain: slug }
  }

  // (2) Resolução por domínio próprio
  if (!isMainPlatformHostname(cleanHost)) {
    const store = await StorefrontService.getStoreByDomain(cleanHost)
    if (store) {
      return { store, source: 'domain', slugOrDomain: cleanHost }
    }
    // Pode tentar buscar sem www ou com www se não achar
    const altDomain = cleanHost.startsWith('www.') ? cleanHost.slice(4) : `www.${cleanHost}`
    const altStore = await StorefrontService.getStoreByDomain(altDomain)
    if (altStore) {
      return { store: altStore, source: 'domain', slugOrDomain: altDomain }
    }
  }

  return { store: null, source: 'none' }
}
