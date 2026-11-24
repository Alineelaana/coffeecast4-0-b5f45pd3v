// Serviço de registro de visualização de episódio (página pública /episodio/:id).
// Chama o hook de backend episodio_visualizacao.js (POST /backend/v1/episodios/visualizacao).
//
// Antidupla-contagem no navegador: um carimbo por episódio é guardado em sessionStorage
// enquanto a aba vive — recarregar a página (F5) NÃO repete o carimbo, mas abrir o
// episódio de novo em outra visita/aba conta normalmente (com janela de 30s no servidor).

import pb from '@/lib/pocketbase/client'

const CHAVE_SESSAO = 'cc4_visualizacoes_episodio'

function carimbosDaSessao(): Record<string, string> {
  try {
    const bruto = sessionStorage.getItem(CHAVE_SESSAO)
    if (!bruto) return {}
    const parsed = JSON.parse(bruto) as Record<string, string>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function salvarCarimbos(mapa: Record<string, string>) {
  try {
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(mapa))
  } catch {
    // sessionStorage indisponível (modo privado etc.) — segue sem persistir
  }
}

/**
 * Registra uma visualização (idempotente por aba): retorna true apenas na PRIMEIRA
 * chamada bem-sucedida por episódio naquela aba do navegador.
 */
export async function registrarVisualizacao(episodioId: string): Promise<boolean> {
  if (!episodioId) return false

  const carimbos = carimbosDaSessao()
  if (carimbos[episodioId]) {
    // Já contabilizamos este episódio nesta aba — não repete (evita dupla contagem no refresh)
    return false
  }

  const carimbo = String(Date.now())
  try {
    const res = await pb.send('/backend/v1/episodios/visualizacao', {
      method: 'POST',
      body: { episodio_id: episodioId, carimbo },
    })
    if (res && (res as { sucesso?: boolean }).sucesso) {
      carimbos[episodioId] = carimbo
      salvarCarimbos(carimbos)
      return (res as { contabilizado?: boolean }).contabilizado === true
    }
    return false
  } catch {
    // Falha silenciosa: a contagem nunca deve quebrar a abertura da página
    return false
  }
}
