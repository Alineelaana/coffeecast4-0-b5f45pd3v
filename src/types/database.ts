export type UserRole = 'master' | 'adm' | 'gerencial' | 'ouro' | 'prata'

export interface AuditoriaSubPermissions {
  ver_registros?: boolean
  ver_dashboard?: boolean
  ver_alertas?: boolean
  criar_regras?: boolean
  exportar?: boolean
}

export interface AdmPermissions {
  allowedScreens: string[] // Ex.: ['dashboard', 'financeiro', 'horas', 'roteiros', 'storefront', 'auditoria', ...]
  allStores?: boolean // Se verdadeiro, gerencia todas as lojas
  storeIds?: string[] // IDs das lojas autorizadas se allStores for falso
  auditoria?: AuditoriaSubPermissions // Sub-permissões granulares da Auditoria do Sistema
}

export type UserStatus = 'online' | 'offline' | 'em_pausa'

export interface UserRecord {
  id: string
  email: string
  name?: string
  avatar?: string
  bio?: string
  role: UserRole
  ativo: boolean
  status?: UserStatus
  pause_reason?: string
  status_updated?: string
  last_seen?: string
  telefone?: string
  origem?: string
  adm_permissions?: AdmPermissions | null
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
  idade?: number
  profissao?: string
  instagram?: string
  email: string
  telefone?: string
  whatsapp?: string
  motivo?: string
  como_nos_conheceu?: string
  origem?: string
  user?: string
  conversation_id?: string
  notas_comerciais?: string
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
  visitante_email?: string
  visitante_telefone?: string
  user?: string
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

// ==========================================
// STOREFRONT (PLATAFORMA MULTI-LOJAS)
// ==========================================

export interface StoreSectionsToggles {
  integrantes?: boolean
  episodios?: boolean
  depoimentos?: boolean
  banners_inline?: boolean
  missao?: boolean
  manifesto?: boolean
  contato?: boolean
  momentos?: boolean
}

export interface StoreRecord {
  id: string
  name: string
  slug: string
  domain?: string
  status: 'active' | 'inactive'
  tagline?: string
  description?: string
  color_primary?: string
  color_secondary?: string
  color_background?: string
  color_surface?: string
  color_accent?: string
  logo_url?: string
  hero_url?: string
  favicon_url?: string
  font_display?: string
  font_body?: string
  whatsapp_contato?: string
  instagram?: string
  email_contato?: string
  youtube_canal?: string
  hero_title?: string
  hero_subtitle?: string
  hero_tagline_words?: string
  hero_phrase?: string
  mission_text?: string
  vision_text?: string
  values_text?: string
  manifesto_text?: string
  company_name?: string
  sections_toggles?: StoreSectionsToggles
  created: string
  updated: string
}

export interface StoreWithCounts extends StoreRecord {
  counts?: {
    members: number
    episodes: number
    banners: number
    testimonials: number
  }
}

export interface StoreMemberRecord {
  id: string
  store: string
  name: string
  role?: string
  bio?: string
  photo_url?: string
  instagram?: string
  order?: number
  created: string
  updated: string
}

export interface StoreEpisodeRecord {
  id: string
  store: string
  title: string
  description?: string
  youtube_url: string
  publish_date?: string
  cover_url?: string
  order?: number
  status?: 'published' | 'draft'
  created: string
  updated: string
}

export interface StoreBannerRecord {
  id: string
  store: string
  title: string
  image_url: string
  link_url?: string
  position: 'hero' | 'inline'
  active?: boolean
  order?: number
  created: string
  updated: string
}

export interface StoreTestimonialRecord {
  id: string
  store: string
  name: string
  role?: string
  instagram?: string
  message: string
  photo_url?: string
  video_url?: string
  approved?: boolean
  order?: number
  created: string
  updated: string
}

// ==========================================
// CHAT & CONVERSAS COFFEECAST 4.0
// ==========================================

export type ChatConversaTipo = 'privado' | 'geral' | 'grupo'

export interface ChatConversaRecord {
  id: string
  tipo: ChatConversaTipo
  nome?: string
  descricao?: string
  criador?: string
  private_pair?: string
  ultima_mensagem?: string
  ultimo_envio?: string
  created: string
  updated: string
}

export interface ChatParticipanteRecord {
  id: string
  conversa: string
  user: string
  is_admin?: boolean
  ultima_leitura?: string
  created: string
  updated: string
  // expand
  expand?: {
    user?: UserRecord
    conversa?: ChatConversaRecord
  }
}

export interface ChatMensagemRecord {
  id: string
  conversa: string
  remetente: string
  texto: string
  created: string
  updated: string
  // expand
  expand?: {
    remetente?: UserRecord
    conversa?: ChatConversaRecord
  }
}

export interface ChatUserItem {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  bio?: string
  status?: UserStatus
  pause_reason?: string
  last_seen?: string
  status_updated?: string
}

// ==========================================
// AUDITORIA DO SISTEMA
// ==========================================

export type AuditoriaTipoAcao =
  | 'login'
  | 'logout'
  | 'tentativa_login'
  | 'falha_login'
  | 'alteracao_senha'
  | 'criacao'
  | 'edicao'
  | 'exclusao'
  | 'download'
  | 'upload'
  | 'alteracao_permissao'
  | 'criacao_usuario'
  | 'mudanca_nivel'
  | 'acao_administrativa'
  | 'movimentacao_financeira'
  | 'alteracao_site'
  | 'agenda'
  | 'cadastro'
  | 'configuracao'
  | 'chat'
  | 'bloqueio_acesso'
  | 'alteracao_status'
  | 'outro'

export type AuditoriaResultado = 'sucesso' | 'erro' | 'bloqueio'

export interface AuditoriaEventoRecord {
  id: string
  usuario_id?: string
  usuario_email?: string
  usuario_nome?: string
  usuario_role?: string
  loja_id?: string
  loja_nome?: string
  tipo_acao: AuditoriaTipoAcao
  area_sistema: string
  descricao: string
  registro_afetado?: string
  tabela_afetada?: string
  ip?: string
  dispositivo?: string
  navegador?: string
  resultado: AuditoriaResultado
  diff_antes?: Record<string, unknown> | null
  diff_depois?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  suspeito?: boolean
  motivo_suspeito?: string
  created: string
  updated: string
}

export type AlertaPrioridade = 'baixa' | 'media' | 'alta' | 'critica'
export type AlertaStatus = 'novo' | 'visualizado' | 'em_analise' | 'resolvido'

export interface AlertaHistoricoItem {
  status_anterior?: string
  status: AlertaStatus
  alterado_por_id?: string
  alterado_por_nome: string
  data: string
  observacao?: string
}

export interface AuditoriaRegraRecord {
  id: string
  nome: string
  descricao?: string
  evento_monitorado: string
  palavra_chave?: string
  usuarios_monitorados?: string[] | null
  niveis_monitorados?: string[] | null
  lojas_monitoradas?: string[] | null
  areas_monitoradas?: string[] | null
  criterio_disparo?: string
  prioridade: AlertaPrioridade
  destinatarios?: string[] | null
  ativo: boolean
  criado_por?: string
  created: string
  updated: string
}

export interface AuditoriaAlertaRecord {
  id: string
  regra_id?: string
  regra_nome: string
  evento_id?: string
  prioridade: AlertaPrioridade
  status: AlertaStatus
  motivo: string
  detalhes?: string
  usuario_envolvido_id?: string
  usuario_envolvido_nome?: string
  usuario_envolvido_email?: string
  loja_id?: string
  loja_nome?: string
  area_sistema?: string
  link_relacionado?: string
  historico_status?: AlertaHistoricoItem[] | null
  visualizado_por_id?: string
  visualizado_por_nome?: string
  data_visualizacao?: string
  resolvido_por_id?: string
  resolvido_por_nome?: string
  data_resolucao?: string
  resolucao_notas?: string
  created: string
  updated: string
}

export interface AuditoriaFiltros {
  dataInicio?: string
  dataFim?: string
  usuarioId?: string
  role?: string
  lojaId?: string
  area?: string
  tipoAcao?: string
  resultado?: string
  ip?: string
  dispositivo?: string
  busca?: string
  suspeito?: boolean
}

export interface ChatOverviewItem {
  id: string
  tipo: ChatConversaTipo
  nome: string
  descricao?: string
  criador?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: UserRole
  } | null
  participantes: {
    id: string
    user_id: string
    name: string
    email: string
    avatar?: string
    role: UserRole
    status?: UserStatus
    pause_reason?: string
    is_admin?: boolean
  }[]
  total_mensagens: number
  primeira_mensagem?: {
    data: string
    texto: string
  } | null
  ultima_mensagem?: {
    data: string
    texto: string
    remetente_id?: string
    remetente_nome?: string
  } | null
  created: string
  updated: string
}
