// Serviço de geração de capas de episódios com IA (ChatGPT/OpenAI) via backend seguro.
// A chave da OpenAI nunca é exposta ao frontend: tudo passa pelo endpoint pb_hooks.
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
 * O backend chama a OpenAI, salva o arquivo no campo 'capa_ia' do episódio e
 * devolve o registro atualizado. Em caso de falha, lança erro com mensagem
 * amigável em português — o chamador decide como exibir.
 */
export async function gerarCapaIa(episodioId: string): Promise<CapaIaResultado> {
  const res = await pb.send<{ sucesso: boolean; mensagem?: string; motor?: string }>(
    '/backend/v1/episodios/capa-ia',
    {
      method: 'POST',
      body: { episodio_id: episodioId },
    },
  )
  return res
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
