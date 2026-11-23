/**
 * Helpers defensivos de render para a área de Roteiros.
 *
 * Regra de ouro: a tela de Roteiros NUNCA deve ficar branca. Se um registro do
 * banco vier nulo, com campo fora do formato esperado ou com data inválida,
 * renderizamos um fallback legível em vez de deixar a exceção desmontar a
 * árvore React inteira (tela branca).
 */
import type { ReactNode } from 'react'

/** Fallback textual curto para qualquer texto opcional do banco. */
export function textoOuTraco(valor: unknown, fallback = '—'): string {
  if (typeof valor === 'string') {
    const v = valor.trim()
    if (v) return v
  }
  return fallback
}

/**
 * Data do PocketBase (string ISO ou Date) formatada em BR.
 * Data inválida/nula → fallback, nunca lança.
 */
export function dataOuTraco(valor: unknown, fallback = '—'): string {
  if (typeof valor === 'string' && valor.trim()) {
    const d = new Date(valor)
    if (!Number.isNaN(d.getTime())) {
      try {
        return d.toLocaleDateString('pt-BR')
      } catch {
        return fallback
      }
    }
    return fallback
  }
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    try {
      return valor.toLocaleDateString('pt-BR')
    } catch {
      return fallback
    }
  }
  return fallback
}

/**
 * Garante que um valor que deveria ser lista (ex.: campo JSON de ids
 * vinculados) venha como array real, mesmo se o banco guardar null/string.
 */
export function comoArray<T = unknown>(valor: unknown): T[] {
  if (Array.isArray(valor)) return valor as T[]
  return []
}

/** Nome seguro para exibir: nunca undefined/null direto no JSX. */
export function nomeOuFallback(nome: unknown, fallback = 'Convidado'): string {
  if (typeof nome === 'string' && nome.trim()) return nome.trim()
  return fallback
}

/** Iniciais seguras (máx. 2 letras) para o círculo de avatar. */
export function iniciaisSeguras(nome: unknown, fallback = '??'): string {
  const nomeSeguro = nomeOuFallback(nome, '')
  if (!nomeSeguro) return fallback
  return nomeSeguro.slice(0, 2).toUpperCase()
}

/**
 * Renderiza children apenas se for conteúdo seguro; caso algo lance dentro,
 * devolve um fallback discreto — usado nos blocos de detalhe do modal.
 */
export function renderSeguro(render: () => ReactNode, fallback: ReactNode): ReactNode {
  try {
    return render()
  } catch (err) {
    console.error('[Roteiros] Erro ao renderizar bloco:', err)
    return fallback
  }
}
