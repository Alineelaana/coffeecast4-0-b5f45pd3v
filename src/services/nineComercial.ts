// Inteligência comercial da Nine IA — Painel de Leads (CoffeeCast 4.0).
// Consome os endpoints reais do hook pocketbase/hooks/nine_comercial.js (/backend/v1/nine/*).
// Contato com lead é SEMPRE manual (wa.me / tel: / mailto:) — nunca envio automático.
import pb from '@/lib/pocketbase/client'
import type { NineLeadDetalhe, NineLeadResumo, NineTarefaRecord } from '@/types/database'

// ---------------------------------------------------------------------------
// Rótulos e constantes
// ---------------------------------------------------------------------------
export const LINK_WHATSAPP_ALINE = 'https://wa.me/5531991297619'

export const ROTULO_STATUS_COMERCIAL: Record<string, string> = {
  novo_lead: 'Novo lead',
  aguardando_contato: 'Aguardando contato',
  contato_agendado: 'Contato agendado',
  em_atendimento: 'Em atendimento',
  convertido: 'Convertido',
  encerrado: 'Encerrado',
}

/** Lista de opções (valor + rótulo) derivada do mapa — usada nos selects do painel. */
export const STATUS_COMERCIAIS: { valor: string; rotulo: string }[] = Object.entries(
  ROTULO_STATUS_COMERCIAL,
).map(([valor, rotulo]) => ({ valor, rotulo }))

export const ROTULO_INTERESSE: Record<string, string> = {
  participar_como_convidado: 'Participar como convidado',
  indicar_convidado: 'Indicar convidado',
  apresentar_empresa: 'Apresentar empresa',
  divulgacao: 'Divulgação',
  parceria: 'Parceria',
  patrocinio: 'Patrocínio',
  contratacao: 'Contratação',
  convite: 'Convite',
  estudio: 'Locação / uso do estúdio',
  proposta_comercial: 'Proposta comercial',
  falar_com_equipe: 'Falar com a equipe',
}

export const ROTULO_CANAL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  ligacao: 'Ligação',
  email: 'E-mail',
  nao_informado: 'Não informado',
}

// ---------------------------------------------------------------------------
// Interesses múltiplos (campo JSON `interesses` da coleção contatos)
// ---------------------------------------------------------------------------
export type InteresseModalidade = 'contratacao' | 'patrocinio' | 'parceria' | 'convite'

export const MODALIDADES_COMERCIAIS: { valor: InteresseModalidade; rotulo: string }[] = [
  { valor: 'contratacao', rotulo: 'Contratação' },
  { valor: 'patrocinio', rotulo: 'Patrocínio' },
  { valor: 'parceria', rotulo: 'Parceria' },
  { valor: 'convite', rotulo: 'Convite' },
]

/** Lê o campo JSON `interesses` — aceita string JSON ("[...]") ou array. */
export function parseInteresses(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
      if (typeof parsed === 'string' && parsed) return [parsed]
    } catch {
      // fallback: campo com um único valor solto (ex.: "patrocinio")
      return raw.trim() ? [raw.trim()] : []
    }
  }
  return []
}

/** Mapeia os valores do campo JSON `interesses` para as 4 modalidades comerciais. */
export function interessesParaModalidades(interesses: string[]): InteresseModalidade[] {
  const out: InteresseModalidade[] = []
  if (interesses.includes('contratacao') || interesses.includes('proposta_comercial')) {
    out.push('contratacao')
  }
  if (interesses.includes('patrocinio') || interesses.includes('apresentar_empresa')) {
    out.push('patrocinio')
  }
  if (interesses.includes('parceria') || interesses.includes('divulgacao')) {
    out.push('parceria')
  }
  if (
    interesses.includes('participar_como_convidado') ||
    interesses.includes('indicar_convidado') ||
    interesses.includes('convite')
  ) {
    out.push('convite')
  }
  return out
}

/** Interesses de um lead em valores normalizados (exibe também os fora das 4 modalidades). */
export function interessesDoLead(lead: Pick<NineLeadResumo, 'interesses' | 'interesse'>): string[] {
  const json = parseInteresses(lead.interesses)
  if (json.length > 0) return json
  return lead.interesse ? [lead.interesse] : []
}

/**
 * Filtro por modalidade: um lead com interesses múltiplos aparece em TODOS os
 * filtros correspondentes (ex.: patrocínio + participação → "Patrocínio" e "Convite").
 */
export function leadCumpreModalidades(
  lead: Pick<NineLeadResumo, 'interesses' | 'interesse'>,
  modalidades: InteresseModalidade[],
): boolean {
  if (modalidades.length === 0) return true
  const doLead = interessesParaModalidades(interessesDoLead(lead))
  return modalidades.some((m) => doLead.includes(m))
}

// ---------------------------------------------------------------------------
// Ordenações (valores aceitos pelo hook nine_comercial)
// ---------------------------------------------------------------------------
export type NineLeadsOrdenacao = '-created' | 'created' | '-prioridade' | 'data_proximo_retorno'
export const NINE_LEADS_ORDENACOES: { valor: NineLeadsOrdenacao; rotulo: string }[] = [
  { valor: '-created', rotulo: 'Mais recentes' },
  { valor: 'created', rotulo: 'Mais antigos' },
  { valor: '-prioridade', rotulo: 'Prioridade' },
  { valor: 'data_proximo_retorno', rotulo: 'Retorno agendado' },
]

// ---------------------------------------------------------------------------
// Formatos de resposta dos hooks
// ---------------------------------------------------------------------------
export interface NineLeadsContagens {
  aguardando_contato: number
  novos_leads: number
  contatos_agendados: number
  em_atendimento: number
  convertidos: number
  contatos_atrasados: number
}

export interface NineTarefasContagens {
  pendentes: number
  hoje: number
  atrasadas: number
  concluidas: number
}

export interface NineLeadsResposta {
  leads: NineLeadResumo[]
  contagens: NineLeadsContagens
}

export interface NineTarefasResposta {
  tarefas: NineTarefaRecord[]
  contagens: NineTarefasContagens
}

const CONTAGENS_VAZIAS: NineLeadsContagens = {
  aguardando_contato: 0,
  novos_leads: 0,
  contatos_agendados: 0,
  em_atendimento: 0,
  convertidos: 0,
  contatos_atrasados: 0,
}

// ---------------------------------------------------------------------------
// Serviço
// ---------------------------------------------------------------------------
export class NineComercialService {
  /** Lista de leads com contagens (interesses normalizados em array). */
  static async listarLeads(
    ordenacao: NineLeadsOrdenacao = '-created',
    statusComercial: string = 'todos',
  ): Promise<NineLeadsResposta> {
    const params = new URLSearchParams({ sort: ordenacao })
    if (statusComercial && statusComercial !== 'todos') {
      params.set('status_comercial', statusComercial)
    }
    const data = await pb.send<NineLeadsResposta>(`/backend/v1/nine/leads?${params.toString()}`, {
      method: 'GET',
    })
    const leads = (data?.leads ?? []).map((l) => ({
      ...l,
      interesses: parseInteresses((l as { interesses?: unknown }).interesses),
    })) as NineLeadResumo[]
    return { leads, contagens: data?.contagens ?? CONTAGENS_VAZIAS }
  }

  /** Detalhe de um lead (conversa da Nine, histórico, tarefas). */
  static async detalheLead(id: string): Promise<NineLeadDetalhe> {
    const d = await pb.send<NineLeadDetalhe>(`/backend/v1/nine/leads/${id}`, { method: 'GET' })
    if (d && d.lead) {
      d.lead = {
        ...d.lead,
        interesses: parseInteresses((d.lead as { interesses?: unknown }).interesses),
      }
    }
    return d
  }

  static async listarTarefas(): Promise<NineTarefasResposta> {
    const data = await pb.send<Partial<NineTarefasResposta>>('/backend/v1/nine/tarefas', {
      method: 'GET',
    })
    return {
      tarefas: data?.tarefas ?? [],
      contagens: data?.contagens ?? { pendentes: 0, hoje: 0, atrasadas: 0, concluidas: 0 },
    }
  }

  /**
   * Ação rápida sobre o lead (PATCH). O hook aceita: registrar_contato,
   * agendar_retorno, alterar_status, observacao, definir_prioridade.
   * "adicionar_observacao" (usado pelas dialogs) é traduzido para "observacao".
   */
  static async acaoLead(id: string, body: Record<string, unknown>): Promise<void> {
    const payload: Record<string, unknown> = { ...body }
    if (payload.acao === 'adicionar_observacao') {
      payload.acao = 'observacao'
      if (!payload.observacoes && payload.texto) payload.observacoes = payload.texto
      if (!payload.observacoes && payload.observacao) payload.observacoes = payload.observacao
      delete payload.texto
      delete payload.observacao
    }
    await pb.send(`/backend/v1/nine/leads/${id}`, { method: 'PATCH', body: payload })
  }

  static async acaoTarefa(id: string, status: 'pendente' | 'concluida'): Promise<void> {
    await pb.send(`/backend/v1/nine/tarefas/${id}`, { method: 'PATCH', body: { status } })
  }

  /** Resumo comercial automático via IA (gerado no backend a partir da conversa real). */
  static async resumoIaLead(id: string): Promise<{ resumo_ia: string; salvo: boolean }> {
    return pb.send<{ resumo_ia: string; salvo: boolean }>(
      `/backend/v1/nine/leads/${id}/resumo-ia`,
      { method: 'GET' },
    )
  }
}

// ---------------------------------------------------------------------------
// Helpers de exibição
// ---------------------------------------------------------------------------
export function rotuloInteresse(v: string): string {
  return ROTULO_INTERESSE[v] ?? v
}

export function rotuloStatusComercial(v: string): string {
  return ROTULO_STATUS_COMERCIAL[v] ?? v
}

/** Link wa.me com mensagem pré-preenchida — abertura manual pelo usuário. */
export function montarLinkWhatsappLead(telefone: string, mensagem?: string): string {
  const digitos = telefone.replace(/\D/g, '')
  if (!digitos) return ''
  const base = `https://wa.me/55${digitos}`
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base
}

export function montarLinkTel(telefone: string): string {
  const digitos = telefone.replace(/\D/g, '')
  return digitos ? `tel:+55${digitos}` : ''
}
