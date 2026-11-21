// Serviço comercial da Nine IA — endpoints autenticados (papel master/gerencial/adm)
// do hook `nine_comercial` (Skip Cloud / PocketBase). Contato com leads é SEMPRE
// MANUAL (wa.me / tel: / mailto:) — nunca envio automático.
import pb from '@/lib/pocketbase/client'
import type {
  NineLeadResumo,
  NineLeadDetalhe,
  NineTarefaRecord,
  ContatoStatusComercial,
} from '@/types/database'

export interface NineLeadsContagens {
  aguardando_contato: number
  novos_leads: number
  contatos_agendados: number
  em_atendimento: number
  convertidos: number
  contatos_atrasados: number
}

export interface NineLeadsResposta {
  leads: NineLeadResumo[]
  contagens: NineLeadsContagens
}

export interface NineTarefasResposta {
  tarefas: NineTarefaRecord[]
  contagens: {
    pendentes: number
    hoje: number
    atrasadas: number
    concluidas: number
  }
}

const LEADS_SORTS = ['-created', 'created', '-prioridade', 'data_proximo_retorno'] as const
export type NineLeadsOrdenacao = (typeof LEADS_SORTS)[number]

export const NINE_LEADS_ORDENACOES: Array<{ valor: NineLeadsOrdenacao; rotulo: string }> = [
  { valor: 'created', rotulo: 'Mais antigos' },
  { valor: '-created', rotulo: 'Mais recentes' },
  { valor: '-prioridade', rotulo: 'Maior prioridade' },
  { valor: 'data_proximo_retorno', rotulo: 'Data prevista de retorno' },
]

export const STATUS_COMERCIAIS: Array<{
  valor: ContatoStatusComercial
  rotulo: string
}> = [
  { valor: 'novo_lead', rotulo: 'Novo Lead' },
  { valor: 'aguardando_contato', rotulo: 'Aguardando Contato' },
  { valor: 'contato_agendado', rotulo: 'Contato Agendado' },
  { valor: 'em_atendimento', rotulo: 'Em Atendimento' },
  { valor: 'convertido', rotulo: 'Convertido' },
  { valor: 'encerrado', rotulo: 'Encerrado' },
]

export const ROTULO_STATUS_COMERCIAL: Record<string, string> = STATUS_COMERCIAIS.reduce(
  (acc, s) => {
    acc[s.valor] = s.rotulo
    return acc
  },
  {} as Record<string, string>,
)

export const ROTULO_INTERESSE: Record<string, string> = {
  participar_como_convidado: 'Participar como convidado(a)',
  indicar_convidado: 'Indicar convidado(a)',
  apresentar_empresa: 'Apresentar empresa',
  divulgacao: 'Divulgação',
  parceria: 'Parceria',
  patrocinio: 'Patrocínio',
  estudio: 'Estúdio',
  proposta_comercial: 'Proposta comercial',
  falar_com_equipe: 'Falar com a equipe',
}

export const ROTULO_CANAL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  ligacao: 'Ligação',
  email: 'E-mail',
  nao_informado: 'Não informado',
}

export const LINK_WHATSAPP_ALINE =
  'https://wa.me/5531991297619?text=Venho%20pelo%20CHAT%20do%20site%20do%20Coffeecast4.0%2C%20gostaria%20de%20falar%20com%20a%20Aline'

// Monta link wa.me MANUAL com o número do lead (sem integração, sem envio automático)
export const montarLinkWhatsappLead = (numero: string): string => {
  const digitos = (numero || '').replace(/\D/g, '')
  if (!digitos) return ''
  const comDdi = digitos.startsWith('55') ? digitos : `55${digitos}`
  return `https://wa.me/${comDdi}`
}

export const montarLinkTel = (numero: string): string => {
  const digitos = (numero || '').replace(/[^\d+]/g, '')
  return digitos ? `tel:${digitos}` : ''
}

export const NineComercialService = {
  async listarLeads(
    ordenacao: NineLeadsOrdenacao,
    filtroStatus: string,
  ): Promise<NineLeadsResposta> {
    const sortValido = LEADS_SORTS.indexOf(ordenacao) !== -1 ? ordenacao : '-created'
    const params = new URLSearchParams({ sort: sortValido })
    if (filtroStatus && filtroStatus !== 'todos') params.set('status_comercial', filtroStatus)
    return pb.send<NineLeadsResposta>(`/backend/v1/nine/leads?${params.toString()}`, {
      method: 'GET',
    })
  },

  async detalheLead(id: string): Promise<NineLeadDetalhe> {
    return pb.send<NineLeadDetalhe>(`/backend/v1/nine/leads/${id}`, { method: 'GET' })
  },

  async acaoLead(
    id: string,
    body: Record<string, unknown>,
  ): Promise<{ ok: boolean; id: string; status_comercial?: string }> {
    return pb.send(`/backend/v1/nine/leads/${id}`, { method: 'PATCH', body })
  },

  async resumoIaLead(id: string): Promise<{ resumo_ia: string; salvo: boolean }> {
    return pb.send(`/backend/v1/nine/leads/${id}/resumo-ia`, { method: 'GET' })
  },

  async listarTarefas(): Promise<NineTarefasResposta> {
    return pb.send<NineTarefasResposta>('/backend/v1/nine/tarefas', { method: 'GET' })
  },

  async acaoTarefa(id: string, status: 'pendente' | 'concluida'): Promise<{ ok: boolean }> {
    return pb.send(`/backend/v1/nine/tarefas/${id}`, { method: 'PATCH', body: { status } })
  },
}
