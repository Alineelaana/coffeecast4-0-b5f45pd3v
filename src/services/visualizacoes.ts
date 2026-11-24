// Serviço de registro de visualização de episódio (página pública /episodio/:id).
// Chama o hook de backend episodio_visualizacao.js (POST /backend/v1/episodios/visualizacao).
//
// Antidupla-contagem no navegador: o guarda vive APENAS na memória deste módulo
// (um carregamento da página = um módulo novo = guarda zerado). Cada carregamento
// efetivo da página conta sempre — recarregar (F5) AUMENTA o contador, de propósito.
// O guarda existe só para o duplo-invocação do effect no React (StrictMode /
// re-render): a segunda chamada do MESMO carregamento não repete a contagem.

import pb from '@/lib/pocketbase/client'

// Ids de episódio já contabilizados NESTE carregamento da página (em memória, volátil).
const jaContabilizadosNesteCarregamento = new Set<string>()

/**
 * Registra uma visualização (uma por carregamento efetivo da página): retorna true
 * apenas na PRIMEIRA chamada bem-sucedida por episódio dentro deste carregamento —
 * recarregar a página (F5) recomeça do zero e conta de novo, por design.
 */
export async function registrarVisualizacao(episodioId: string): Promise<boolean> {
  if (!episodioId) return false

  if (jaContabilizadosNesteCarregamento.has(episodioId)) {
    // Já contabilizado neste mesmo carregamento (duplo effect do React) — não repete
    return false
  }

  try {
    const res = await pb.send('/backend/v1/episodios/visualizacao', {
      method: 'POST',
      body: { episodio_id: episodioId },
    })
    if (res && (res as { sucesso?: boolean }).sucesso) {
      jaContabilizadosNesteCarregamento.add(episodioId)
      return (res as { contabilizado?: boolean }).contabilizado === true
    }
    return false
  } catch {
    // Falha silenciosa: a contagem nunca deve quebrar a abertura da página
    return false
  }
}
