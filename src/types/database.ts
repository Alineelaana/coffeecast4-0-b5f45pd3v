export interface UserRecord {
  id: string
  email: string
  name?: string
  avatar?: string
  role: 'master' | 'ouro' | 'prata'
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

export interface TransacaoRecord {
  id: string
  descricao: string
  tipo: 'gravacao' | 'edicao' | 'equipamento' | 'marketing' | 'outros'
  valor: number
  data_vencimento: string
  situacao: 'quitado' | 'em_aberto'
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
  created: string
  updated: string
}

export interface ConviteRecord {
  id: string
  foto_convidado?: string
  logomarca_empresa?: string
  nome: string
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

export interface PoliticaRecord {
  id: string
  slug: 'privacidade' | 'cookies' | 'termos'
  titulo: string
  conteudo: string
  created: string
  updated: string
}
