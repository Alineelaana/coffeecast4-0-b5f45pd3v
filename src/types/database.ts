export type UserRole = 'master' | 'gerencial' | 'ouro' | 'prata'

export interface UserRecord {
  id: string
  email: string
  name?: string
  avatar?: string
  role: UserRole
  ativo: boolean
  created: string
  updated: string
}

export interface EpisodioRecord {
  id: string
  numero: number
  titulo: string
  youtube_url: string
  created: string
  updated: string
}

export interface IntegranteRecord {
  id: string
  nome: string
  biografia: string
  ordem?: number
  foto?: string
  instagram?: string
  link_episodio?: string
  created: string
  updated: string
}

export interface DepoimentoRecord {
  id: string
  nome: string
  texto: string
  de_nossa_autoridade?: boolean
  ordem?: number
  foto?: string
  instagram?: string
  link_episodio?: string
  created: string
  updated: string
}

export type DepoimentoConvidadoStatus = 'pendente' | 'aprovada' | 'oculta'

export interface DepoimentoConvidadoRecord {
  id: string
  nome: string
  empresa?: string
  instagram: string
  texto: string
  foto: string
  autoriza_publicacao: boolean
  status: DepoimentoConvidadoStatus
  visualizado?: boolean
  created: string
  updated: string
}

export interface MomentoRecord {
  id: string
  legenda?: string
  ordem?: number
  imagem: string
  created: string
  updated: string
}

export interface ContatoRecord {
  id: string
  nome_completo: string
  idade: number
  profissao: string
  instagram: string
  email: string
  telefone: string
  whatsapp: string
  motivo: string
  como_nos_conheceu: string
  status: 'novo' | 'visualizado' | 'contatado'
  created: string
  updated: string
}

export type TransacaoMovimentacao = 'receita' | 'despesa'
export type TransacaoOrigem = 'manual' | 'horas_compradas'

export interface DivisaoIntegranteItem {
  nome: string
  valor: number
  pago?: boolean
}

export type DivisaoIntegrantes = Record<string, number> | DivisaoIntegranteItem[]

export interface TransacaoRecord {
  id: string
  descricao: string
  tipo:
    | 'gravacao'
    | 'edicao'
    | 'equipamento'
    | 'marketing'
    | 'outros'
    | 'participacao_convidado'
    | 'entrevista'
    | 'monetizacao_youtube'
    | 'monetizacao_instagram'
    | 'monetizacao_tiktok'
    | 'monetizacao'
  valor: number
  data_vencimento: string
  situacao: 'quitado' | 'em_aberto'
  tipo_movimentacao?: TransacaoMovimentacao
  origem?: TransacaoOrigem
  horas_compradas_id?: string
  divisao_integrantes?: Record<string, number> | null
  created: string
  updated: string
}

export interface AgendaRecord {
  id: string
  data_agendamento?: string
  titulo: string
  roteiro?: string
  data_gravacao?: string
  data_postagem?: string
  tem_convidado?: boolean
  nome_convidado?: string
  biografia_convidado?: string
  empresa?: string
  patrocinado?: boolean
  patrocinadores?: string
  imagens?: string | string[]
  horas_utilizadas?: number
  created: string
  updated: string
}

export interface HorasCompradasRecord {
  id: string
  data: string
  quantidade_horas: number
  descricao: string
  situacao: 'paga' | 'em_aberto'
  valor?: number
  observacoes?: string
  created: string
  updated: string
}

export interface ConviteRecord {
  id: string
  foto_convidado?: string
  logomarca_empresa?: string
  nome: string
  tipo_convidado?: 'convidado' | 'convidada'
  data_gravacao: string
  horario: string
  apresentacao: string
  created: string
  updated: string
}

export interface ConteudoSiteRecord {
  id: string
  chave: string
  valor: string
  created: string
  updated: string
}

export interface SocialLinks {
  tiktok?: string
  facebook?: string
  instagram?: string
  linkedin?: string
}

export interface SiteDomainConfig {
  dominioPersonalizado: string
  status: 'pendente_dns' | 'aguardando_propagacao' | 'ativo'
  redirecionarWww: boolean
  aliases: string
  ativadoSuporte: boolean
  dataSolicitacao?: string
}

export interface PoliticaRecord {
  id: string
  slug: 'privacidade' | 'cookies' | 'termos'
  titulo: string
  conteudo: string
  created: string
  updated: string
}

export type RoteiroConvidadoStatus = 'pendente' | 'lida' | 'arquivada'

export interface RoteiroConvidadoRecord {
  id: string
  nome: string
  data_nascimento: string
  estado_civil: string
  tem_conjuge?: boolean
  nome_conjuge?: string
  tem_filhos?: boolean
  quantidade_filhos?: string
  nomes_filhos?: string
  tem_empresa?: boolean
  nome_empresa?: string
  sobre_empresa?: string
  tema_enfatizar?: string
  tem_tema_sensivel?: boolean
  tema_sensivel_detalhes?: string
  biografia?: string
  foto: string
  logomarca?: string
  autorizacao_imagem: boolean
  status: RoteiroConvidadoStatus
  visualizado?: boolean
  roteiro_final_texto?: string
  roteiro_final_arquivo?: string
  created: string
  updated: string
}

export type NineModoAtendimento = 'automatico' | 'aguardando_humano' | 'humano_respondendo'

export interface NineConfigRecord {
  id: string
  chave: string
  atendimento_automatico: boolean
  prompt_sistema: string
  prompt_livre?: string
  base_conhecimento: string
  observacoes?: string
  created: string
  updated: string
}

export interface NineConversaRecord {
  id: string
  conversation_id: string
  visitante_nome?: string
  modo_atendimento: NineModoAtendimento
  ultima_mensagem?: string
  ultimo_remetente?: 'visitante' | 'nine' | 'humano'
  data_ultima_mensagem?: string
  total_mensagens?: number
  atendente_humano_nome?: string
  created: string
  updated: string
}

export interface NineMensagemRecord {
  id: string
  conversation_id: string
  remetente: 'visitante' | 'nine' | 'humano'
  remetente_nome?: string
  conteudo: string
  created: string
  updated: string
}

export type NineConhecimentoTipo = 'faq' | 'institucional' | 'orientacao'

export interface NineConhecimentoRecord {
  id: string
  tipo: NineConhecimentoTipo
  titulo: string
  conteudo: string
  categoria?: string
  ativo: boolean
  ordem?: number
  created: string
  updated: string
}
