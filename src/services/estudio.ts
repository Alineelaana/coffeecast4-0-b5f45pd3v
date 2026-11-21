// src/services/estudio.ts
// Serviço do Estúdio Criativo IA + Divulgação Inteligente — CoffeeCast 4.0
// ÚNICO serviço de IA do módulo (compartilhado por Roteiros e Estúdio — sem duplicação).
// Chamadas ao agente "CoffeeCast Creative AI" via hooks existentes (segredo GCHAT_GPT no backend).

import pb from '@/lib/pocketbase/client'

export interface DivulgacaoTitulo {
  estilo: string
  titulo: string
  justificativa: string
  palavras_chave: string[]
}

export interface DivulgacaoDados {
  analise?: {
    tema_principal?: string
    temas_secundarios?: string[]
    diferenciais?: string[]
    pontos_interesse?: string[]
    publico_alvo?: string
    mensagens_chave?: string[]
    palavras_chave?: string[]
  }
  titulos?: DivulgacaoTitulo[]
  thumbnails?: { titulo: string; razao?: string }[]
  descricao?: string
  tags?: string
  hashtags?: string
  frases?: { categoria: string; frase: string }[]
  redes?: {
    instagram?: string
    whatsapp?: string
    stories?: string
    reels?: string
    lancamento?: string
    agradecimento?: string
  }
  gancho?: {
    tema_principal?: string
    diferencial?: string
    gancho_emocional?: string
    gancho_informativo?: string
    gancho_curiosidade?: string
    titulo_youtube?: string
    texto_thumbnail?: string
  }
}

export interface DivulgacaoResposta {
  sucesso: boolean
  chatgptAtivo: boolean
  mensagem?: string
  dados?: DivulgacaoDados
}

export interface TemplateProposta {
  nome?: string
  estilo?: string
  paleta?: string
  descricao?: string
  estrutura?: string
  camadas?: {
    nome?: string
    tipo?: string
    bloqueado?: boolean
    x?: number
    y?: number
    w?: number
    h?: number
    cor?: string
    fonte?: string
    tamanho?: number
  }[]
}

async function chamarEstudio(rota: string, corpo: Record<string, unknown>) {
  return pb.send('/backend/v1/estudio/' + rota, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  })
}

/** Analisa o roteiro/ficha e produz o kit de divulgação (títulos, descrição, tags, redes...). */
export async function gerarDivulgacao(payload: {
  episodio_id?: string
  roteiro_id?: string
  titulo_episodio?: string
  subtitulo?: string
  roteiro_texto?: string
  convidados?: { nome?: string; empresa?: string; biografia?: string; tema?: string }[]
  observacoes?: string
  modo?: 'completo' | 'gancho' | 'titulos' | 'thumbnail'
  titulos_existentes?: string[]
}): Promise<DivulgacaoResposta> {
  try {
    return (await chamarEstudio('divulgacao', payload)) as DivulgacaoResposta
  } catch (err) {
    const msg =
      err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : ''
    return {
      sucesso: false,
      chatgptAtivo: true,
      mensagem: msg || 'Não foi possível gerar a divulgação agora. Tente novamente em instantes.',
    }
  }
}

/** Propõe 3 variações de template (Laboratório de Templates IA). */
export async function gerarPropostasTemplate(payload: {
  estilo: string
  paleta?: string
  descricao?: string
  elementos_obrigatorios?: string
}): Promise<{
  sucesso: boolean
  chatgptAtivo: boolean
  mensagem?: string
  dados?: { propostas: TemplateProposta[] }
}> {
  try {
    return (await chamarEstudio('templates', payload)) as {
      sucesso: boolean
      chatgptAtivo: boolean
      mensagem?: string
      dados?: { propostas: TemplateProposta[] }
    }
  } catch (err) {
    const msg =
      err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : ''
    return {
      sucesso: false,
      chatgptAtivo: true,
      mensagem: msg || 'Não foi possível gerar as propostas agora. Tente novamente em instantes.',
    }
  }
}

// ---------- Persistência: templates ----------
export interface CapaTemplateRecord {
  id: string
  nome: string
  estilo: string
  descricao: string
  paleta: string
  formato: string
  template_json: { camadas?: unknown[] } | null
  status: 'ativo' | 'inativo' | 'rascunho'
  bloqueado: boolean
  mestre: boolean
  versao: number
  autor: string
  thumbnail?: string
  created: string
  updated: string
  collectionId?: string
  collectionName?: string
  expand?: Record<string, unknown>
  [key: string]: unknown
}

export interface CapaEstudioRecord {
  id: string
  episodio_id: string
  roteiro_id: string
  titulo: string
  titulo_thumbnail: string
  template_id: string
  template_nome: string
  convidados: unknown
  arquivo_capa: string
  resolucao: string
  versao: number
  status: 'rascunho' | 'oficial' | 'arquivada'
  dados_ia: unknown
  usuario: string
  oficial: boolean
  created: string
  updated: string
  collectionId?: string
  collectionName?: string
  [key: string]: unknown
}

export function urlArquivoCapa(rec: CapaEstudioRecord | CapaTemplateRecord, campo: string): string {
  const f = rec[campo]
  if (!f) return ''
  try {
    return pb.files.getURL(rec as unknown as Record<string, unknown>, f as string)
  } catch (_) {
    return ''
  }
}

export const EstudioService = {
  templates: {
    listar: (filtros: string[] = [], sort = '-created') =>
      pb.collection('capas_templates').getList(1, 60, {
        filter: filtros.join(' && '),
        sort,
      }) as Promise<{ items: CapaTemplateRecord[]; totalItems: number }>,
    criar: (dados: Partial<CapaTemplateRecord>) =>
      pb.collection('capas_templates').create(dados) as Promise<CapaTemplateRecord>,
    atualizar: (id: string, dados: Partial<CapaTemplateRecord>) =>
      pb.collection('capas_templates').update(id, dados) as Promise<CapaTemplateRecord>,
    remover: (id: string) => pb.collection('capas_templates').delete(id),
  },
  capas: {
    listarPorEpisodio: (episodioId: string, sort = '-created') =>
      pb.collection('capas_estudio').getList(1, 30, {
        filter: `episodio_id = "${episodioId}"`,
        sort,
      }) as Promise<{ items: CapaEstudioRecord[]; totalItems: number }>,
    listar: (filtros: string[] = [], sort = '-created') =>
      pb.collection('capas_estudio').getList(1, 60, {
        filter: filtros.join(' && '),
        sort,
      }) as Promise<{ items: CapaEstudioRecord[]; totalItems: number }>,
    criar: (dados: Partial<CapaEstudioRecord>) =>
      pb.collection('capas_estudio').create(dados) as Promise<CapaEstudioRecord>,
    atualizar: (id: string, dados: Partial<CapaEstudioRecord>) =>
      pb.collection('capas_estudio').update(id, dados) as Promise<CapaEstudioRecord>,
    remover: (id: string) => pb.collection('capas_estudio').delete(id),
    enviarArquivo: (id: string, blob: Blob, nomeArquivo: string) => {
      const fd = new FormData()
      fd.append('arquivo_capa', blob, nomeArquivo)
      return pb.collection('capas_estudio').update(id, fd) as Promise<CapaEstudioRecord>
    },
  },
}

/** Lê o roteiro de um episódio (roteiros_convidados via episodio_id) como texto para a IA. */
export async function montarContextoRoteiro(episodio: Record<string, unknown>) {
  const epId = String(episodio.id || '')
  let fichas: Record<string, unknown>[] = []
  try {
    const res = await pb.collection('roteiros_convidados').getList(1, 20, {
      filter: `episodio_id = "${epId}"`,
      sort: 'created',
    })
    fichas = res.items as unknown as Record<string, unknown>[]
  } catch (_) {
    fichas = []
  }
  const convidados = fichas.map((f) => ({
    nome: String(f.nome_convidado || f.nome || ''),
    empresa: String(f.empresa || f.projeto || ''),
    biografia: String(f.biografia || f.mini_biografia || ''),
    tema: String(f.tema || ''),
  }))
  const partes: string[] = []
  fichas.forEach((f, i) => {
    const pedacos: string[] = []
    Object.keys(f).forEach((k) => {
      if (['id', 'created', 'updated', 'collectionId', 'collectionName', 'expand'].includes(k))
        return
      const v = f[k]
      if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return
      if (typeof v === 'object') return
      pedacos.push(k + ': ' + String(v).slice(0, 600))
    })
    partes.push(`--- FICHA DO CONVIDADO ${i + 1} ---\n` + pedacos.join('\n'))
  })
  return {
    titulo_episodio: String(episodio.titulo || episodio.titulo_episodio || ''),
    subtitulo: String(episodio.subtitulo || ''),
    roteiro_texto: partes.join('\n\n'),
    convidados,
  }
}
