// Serviço de geração de capas de episódios com IA (ChatGPT/OpenAI) via backend seguro.
// A chave da OpenAI nunca é exposta ao frontend: tudo passa pelo endpoint pb_hooks.
// Contrato usado pela tela de Episódios: gerarCapaIA({ episodio_id }) + getCapaIaUrl(ep).
import pb from '@/lib/pocketbase/client'
import type { EpisodioRecord } from '@/types/database'

export interface CapaIaResultado {
  sucesso: boolean
  mensagem?: string
  motor?: string
  episodio?: EpisodioRecord
}

/**
 * Gera (ou regenera) a capa de um episódio com IA.
 * Nunca lança exceção: em qualquer falha (chave ausente, timeout, instabilidade da
 * OpenAI) devolve { sucesso: false, mensagem amigável } para o fallback silencioso —
 * a capa anterior do episódio é mantida pelo backend.
 */
export async function gerarCapaIA(args: { episodio_id: string }): Promise<CapaIaResultado> {
  try {
    const res = await pb.send<CapaIaResultado & { error?: string }>(
      '/backend/v1/episodios/capa-ia',
      {
        method: 'POST',
        body: { episodio_id: args.episodio_id },
      },
    )
    if (res && res.sucesso) {
      return { sucesso: true, mensagem: res.mensagem, motor: res.motor }
    }
    return {
      sucesso: false,
      mensagem:
        res?.mensagem ||
        res?.error ||
        'Não foi possível gerar a capa com IA neste momento. A capa atual foi mantida.',
    }
  } catch (err) {
    return { sucesso: false, mensagem: mensagemErroCapaIa(err) }
  }
}

/** Compatibilidade: assinatura antiga com o id direto. */
export async function gerarCapaIa(episodioId: string): Promise<CapaIaResultado> {
  return gerarCapaIA({ episodio_id: episodioId })
}

/** URL completa da capa IA do episódio ('' quando o episódio ainda não tem capa IA). */
export function getCapaIaUrl(ep?: EpisodioRecord | null): string {
  if (!ep || !ep.capa_ia) return ''
  try {
    return pb.files.getURL(ep, ep.capa_ia)
  } catch {
    return ''
  }
}

/** Extrai mensagem amigável em português de qualquer erro do endpoint de capa. */
export function mensagemErroCapaIa(err: unknown): string {
  if (err && typeof err === 'object') {
    const anyErr = err as {
      response?: { message?: string; data?: { error?: string } }
      message?: string
    }
    const msg = anyErr.response?.data?.error || anyErr.response?.message || anyErr.message || ''
    if (msg) return msg
  }
  return 'Não foi possível gerar a capa com IA neste momento. Tente novamente em instantes.'
}
