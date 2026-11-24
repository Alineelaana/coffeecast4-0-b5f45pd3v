// Painel Comercial de Leads — CoffeeCast 4.0
// Leads captados pela Nine IA no chat do site; contato com o lead é SEMPRE
// manual (wa.me / tel: / mailto:) — nunca envio automático.
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Clock,
  Eye,
  FileText,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  Sparkles,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import LeadsLogicaTela from '@/components/admin/LeadsLogicaTela'
import {
  NineComercialService,
  NINE_LEADS_ORDENACOES,
  NineLeadsOrdenacao,
  STATUS_COMERCIAIS,
  ROTULO_STATUS_COMERCIAL,
  ROTULO_INTERESSE,
  ROTULO_CANAL,
  LINK_WHATSAPP_ALINE,
  MODALIDADES_COMERCIAIS,
  leadCumpreModalidades,
  interessesDoLead,
  interessesParaModalidades,
  montarLinkWhatsappLead,
  montarLinkTel,
  NineLeadsContagens,
  InteresseModalidade,
} from '@/services/nineComercial'
import {
  NineLeadResumo,
  NineLeadDetalhe,
  NineTarefaRecord,
  ContatoStatusComercial,
} from '@/types/database'
import { formatDateTimeBR } from '@/lib/formatters'

// ---------------------------------------------------------------- indicadores

interface Indicador {
  chave: string
  rotulo: string
  valor: number
  destaque?: 'vinho' | 'dourado' | 'atencao'
  filtro: string
  icone: React.ComponentType<{ className?: string }>
}

// `valor` é o placeholder inicial: na renderização cada indicador recebe a
// contagem real do backend (contagens do hook nine_comercial) — nunca estático.
const INDICADORES: Indicador[] = [
  {
    chave: 'aguardando',
    rotulo: 'AGUARDANDO CONTATO',
    valor: 0,
    filtro: 'aguardando_contato',
    icone: Clock,
  },
  {
    chave: 'novos',
    rotulo: 'Novos Leads',
    valor: 0,
    filtro: 'novo_lead',
    icone: Sparkles,
  },
  {
    chave: 'agendados',
    rotulo: 'Contatos Agendados',
    valor: 0,
    filtro: 'contato_agendado',
    icone: CalendarClock,
  },
  {
    chave: 'atendimento',
    rotulo: 'Em Atendimento',
    valor: 0,
    filtro: 'em_atendimento',
    icone: MessageCircle,
  },
  {
    chave: 'convertidos',
    rotulo: 'Convertidos',
    valor: 0,
    filtro: 'convertido',
    icone: Check,
  },
  {
    chave: 'atrasados',
    rotulo: 'Contatos Atrasados',
    valor: 0,
    filtro: '__atrasados',
    icone: AlertTriangle,
  },
]

const CORES_INDICADOR: Record<string, string> = {
  aguardando: 'border-dourado bg-dourado/10 shadow-[0_0_0_1px_rgba(212,175,55,0.35)]',
  novos: 'border-vinho/15 bg-white',
  agendados: 'border-vinho/15 bg-white',
  atendimento: 'border-vinho/15 bg-white',
  convertidos: 'border-emerald-200 bg-emerald-50/60',
  atrasados: 'border-red-300 bg-red-50/70',
}

const COR_VALOR: Record<string, string> = {
  aguardando: 'text-vinho',
  novos: 'text-vinho',
  agendados: 'text-vinho',
  atendimento: 'text-vinho',
  convertidos: 'text-emerald-700',
  atrasados: 'text-red-600',
}

const CORES_STATUS: Record<string, string> = {
  novo_lead: 'bg-vinho/10 text-vinho border-vinho/20',
  aguardando_contato: 'bg-dourado/20 text-[#8a6d10] border-dourado/40',
  contato_agendado: 'bg-blue-50 text-blue-700 border-blue-200',
  em_atendimento: 'bg-amber-50 text-amber-700 border-amber-200',
  convertido: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  encerrado: 'bg-gray-100 text-gray-600 border-gray-200',
}

const CORES_PRIORIDADE: Record<string, string> = {
  alta: 'bg-red-100 text-red-700 border-red-200',
  media: 'bg-amber-50 text-amber-700 border-amber-200',
  baixa: 'bg-gray-100 text-gray-600 border-gray-200',
}

const ROTULO_PRIORIDADE: Record<string, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

// ------------------------------------------------------------------- helpers

const tempoAguardando = (dataISO: string): string => {
  const ms = Date.now() - new Date(dataISO).getTime()
  if (!isFinite(ms) || ms < 0) return 'agora'
  const minutos = Math.floor(ms / 60000)
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `${horas} h`
  const dias = Math.floor(horas / 24)
  return `${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

const estaAtrasado = (lead: NineLeadResumo): boolean => {
  const prazo = lead.data_proximo_retorno
  if (!prazo) return false
  if (['convertido', 'encerrado'].includes(lead.status_comercial)) return false
  const hoje = new Date().toISOString().slice(0, 10)
  return prazo < hoje
}

// ------------------------------------------------------------ página / tela

export default function AdminLeadsScreen() {
  const [leads, setLeads] = useState<NineLeadResumo[]>([])
  const [contagens, setContagens] = useState<NineLeadsContagens>({
    aguardando_contato: 0,
    novos_leads: 0,
    contatos_agendados: 0,
    em_atendimento: 0,
    convertidos: 0,
    contatos_atrasados: 0,
  })
  const [tarefas, setTarefas] = useState<NineTarefaRecord[]>([])
  const [contagensTarefas, setContagensTarefas] = useState({
    pendentes: 0,
    hoje: 0,
    atrasadas: 0,
    concluidas: 0,
  })
  const [filtroTarefas, setFiltroTarefas] = useState<
    'todas' | 'pendentes' | 'hoje' | 'atrasadas' | 'concluidas'
  >('pendentes')
  const [ordenacao, setOrdenacao] = useState<NineLeadsOrdenacao>('created')
  const [filtroStatus, setFiltroStatus] = useState('aguardando_contato')
  // Filtro por tipo de interesse (modalidade comercial) — client-side, cumulativo
  // com o filtro de status. Lead com interesses múltiplos aparece em todos.
  const [filtroModalidades, setFiltroModalidades] = useState<InteresseModalidade[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [leadDetalhe, setLeadDetalhe] = useState<NineLeadDetalhe | null>(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [modalAcao, setModalAcao] = useState<
    'registrar' | 'agendar' | 'status' | 'observacao' | null
  >(null)
  const [leadAcao, setLeadAcao] = useState<NineLeadResumo | null>(null)
  const [verConversa, setVerConversa] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const [resLeads, resTarefas] = await Promise.all([
        NineComercialService.listarLeads(ordenacao, filtroStatus),
        NineComercialService.listarTarefas(),
      ])
      setLeads(resLeads.leads || [])
      setContagens(resLeads.contagens)
      setTarefas(resTarefas.tarefas || [])
      setContagensTarefas(resTarefas.contagens)
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status
      if (status === 403) {
        toast.error('Acesso restrito — disponível para perfis Master, Gerencial e Administrativo.')
      } else {
        toast.error('Não foi possível carregar o painel de Leads.')
      }
    } finally {
      setCarregando(false)
    }
  }, [ordenacao, filtroStatus])

  useEffect(() => {
    carregar()
  }, [carregar])

  const leadsAtrasados = useMemo(() => leads.filter(estaAtrasado), [leads])

  // Lista exibida: quando o filtro ativo é "atrasados", filtra localmente
  const leadsExibidos = useMemo(() => {
    let base = filtroStatus === '__atrasados' ? leadsAtrasados : leads
    if (filtroModalidades.length > 0) {
      base = base.filter((l) => leadCumpreModalidades(l, filtroModalidades))
    }
    return base
  }, [leads, leadsAtrasados, filtroStatus, filtroModalidades])

  const tarefasExibidas = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10)
    switch (filtroTarefas) {
      case 'pendentes':
        return tarefas.filter((t) => t.status === 'pendente')
      case 'hoje':
        return tarefas.filter((t) => t.status === 'pendente' && t.prazo === hoje)
      case 'atrasadas':
        return tarefas.filter((t) => t.status === 'pendente' && t.prazo && t.prazo < hoje)
      case 'concluidas':
        return tarefas.filter((t) => t.status === 'concluida')
      default:
        return tarefas
    }
  }, [tarefas, filtroTarefas])

  // ------------------------------------------------------------- ações/leads

  const abrirDetalhe = async (lead: NineLeadResumo) => {
    setCarregandoDetalhe(true)
    setLeadDetalhe(null)
    setVerConversa(false)
    try {
      const d = await NineComercialService.detalheLead(lead.id)
      setLeadDetalhe(d)
    } catch {
      toast.error('Não foi possível carregar os detalhes do lead.')
    } finally {
      setCarregandoDetalhe(false)
    }
  }

  const executarAcao = async (body: Record<string, unknown>, msgOk: string) => {
    if (!leadAcao) return
    setSalvando(true)
    try {
      await NineComercialService.acaoLead(leadAcao.id, body)
      toast.success(msgOk)
      setModalAcao(null)
      setLeadAcao(null)
      await carregar()
      if (leadDetalhe) {
        const d = await NineComercialService.detalheLead(leadAcao.id)
        setLeadDetalhe(d)
      }
    } catch {
      toast.error('Não foi possível salvar a alteração.')
    } finally {
      setSalvando(false)
    }
  }

  const concluirTarefa = async (t: NineTarefaRecord) => {
    try {
      await NineComercialService.acaoTarefa(t.id, 'concluida')
      toast.success('Tarefa concluída.')
      await carregar()
    } catch {
      toast.error('Não foi possível concluir a tarefa.')
    }
  }

  // ------------------------------------------------------------------- forms

  const [formRegistrar, setFormRegistrar] = useState({
    canal: 'whatsapp',
    resultado: '',
    observacoes: '',
    status_resultante: 'contato_agendado',
  })
  const [formAgendar, setFormAgendar] = useState({ data: '', observacao: '' })
  const [formStatus, setFormStatus] = useState<ContatoStatusComercial>('novo_lead')
  const [formObservacao, setFormObservacao] = useState('')

  const abrirAcao = (
    lead: NineLeadResumo,
    acao: 'registrar' | 'agendar' | 'status' | 'observacao',
  ) => {
    setLeadAcao(lead)
    setFormStatus((lead.status_comercial as ContatoStatusComercial) || 'novo_lead')
    setFormObservacao('')
    setFormAgendar({ data: '', observacao: '' })
    setFormRegistrar({
      canal:
        lead.canal_preferido && lead.canal_preferido !== 'nao_informado'
          ? lead.canal_preferido
          : 'whatsapp',
      resultado: '',
      observacoes: '',
      status_resultante: 'contato_agendado',
    })
    setModalAcao(acao)
  }

  // --------------------------------------------------------------- render UI

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-vinho">
            <Target className="h-6 w-6 text-dourado" />
            Painel Comercial de Leads
          </h2>
          <p className="text-xs text-vinho/70">
            Leads captados pela Nine IA no chat do site — contato sempre manual (WhatsApp, ligação
            ou e-mail), sem envio automático.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LeadsLogicaTela />
          <Button variant="outline" size="sm" onClick={carregar} disabled={carregando}>
            <RefreshCw className={cn('mr-2 h-4 w-4', carregando && 'animate-spin')} />
            Atualizar
            <span className="hidden sm:inline">&nbsp;(tempo real)</span>
          </Button>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {INDICADORES.map((ind) => {
          const ativo = filtroStatus === ind.filtro
          const Icone = ind.icone
          const valor =
            ind.filtro === '__atrasados'
              ? contagens.contatos_atrasados || leadsAtrasados.length
              : (contagens as unknown as Record<string, number>)[
                  {
                    aguardando: 'aguardando_contato',
                    novos: 'novos_leads',
                    agendados: 'contatos_agendados',
                    atendimento: 'em_atendimento',
                    convertidos: 'convertidos',
                  }[ind.chave] || ind.chave
                ]
          return (
            <button
              key={ind.chave}
              type="button"
              onClick={() => setFiltroStatus(ind.filtro)}
              className={cn(
                'rounded-xl border p-4 text-left transition-all hover:shadow-md',
                CORES_INDICADOR[ind.chave],
                ativo && 'ring-2 ring-dourado',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-[10px] font-bold tracking-wider uppercase',
                    ind.chave === 'aguardando' ? 'text-vinho' : 'text-vinho/60',
                  )}
                >
                  {ind.rotulo}
                </span>
                <Icone className="h-4 w-4 text-dourado" />
              </div>
              <div className={cn('mt-2 text-3xl font-bold font-serif', COR_VALOR[ind.chave])}>
                {valor}
              </div>
            </button>
          )
        })}
      </div>

      {/* Ordenação */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase text-vinho/60">Ordenar por:</span>
        {NINE_LEADS_ORDENACOES.map((o) => (
          <Button
            key={o.valor}
            size="sm"
            variant={ordenacao === o.valor ? 'default' : 'outline'}
            onClick={() => setOrdenacao(o.valor)}
            className={cn(
              'min-h-[36px] px-3 text-xs break-words whitespace-normal',
              ordenacao === o.valor && 'bg-vinho text-white hover:bg-vinho-dark',
            )}
          >
            {o.rotulo}
          </Button>
        ))}
      </div>

      {/* Filtro por tipo de interesse (modalidade comercial) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase text-vinho/60">Tipo de interesse:</span>
        {MODALIDADES_COMERCIAIS.map((m) => {
          const ativo = filtroModalidades.includes(m.valor)
          return (
            <Button
              key={m.valor}
              size="sm"
              variant={ativo ? 'default' : 'outline'}
              onClick={() =>
                setFiltroModalidades((atual) =>
                  atual.includes(m.valor)
                    ? atual.filter((v) => v !== m.valor)
                    : [...atual, m.valor],
                )
              }
              className={cn(
                'min-h-[36px] px-3 text-xs break-words whitespace-normal',
                ativo && 'bg-vinho text-white hover:bg-vinho-dark',
              )}
            >
              {m.rotulo}
            </Button>
          )
        })}
        {filtroModalidades.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFiltroModalidades([])}
            className="text-vinho/60"
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Lista de leads */}
      {carregando ? (
        <div className="flex items-center justify-center rounded-xl border border-vinho/10 bg-white p-10 text-sm text-vinho/60">
          Carregando leads…
        </div>
      ) : leadsExibidos.length === 0 ? (
        <div className="rounded-xl border border-vinho/10 bg-white p-10 text-center text-sm text-vinho/60">
          Nenhum lead encontrado para este filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {leadsExibidos.map((lead) => {
            const atrasado = estaAtrasado(lead)
            const numeroLead = lead.whatsapp || lead.telefone || ''
            return (
              <div
                key={lead.id}
                className={cn(
                  'rounded-xl border bg-white p-4 transition-shadow hover:shadow-md',
                  atrasado ? 'border-red-300 ring-1 ring-red-200' : 'border-vinho/10',
                )}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  {/* Dados do lead */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif text-base font-bold text-vinho">
                        {lead.nome_completo || 'Lead sem nome'}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px]', CORES_STATUS[lead.status_comercial])}
                      >
                        {ROTULO_STATUS_COMERCIAL[lead.status_comercial] || lead.status_comercial}
                      </Badge>
                      {lead.prioridade && lead.prioridade !== '' && (
                        <Badge
                          variant="outline"
                          className={cn('text-[10px]', CORES_PRIORIDADE[lead.prioridade])}
                        >
                          Prioridade {ROTULO_PRIORIDADE[lead.prioridade] || lead.prioridade}
                        </Badge>
                      )}
                      {atrasado && (
                        <Badge
                          variant="outline"
                          className="border-red-300 bg-red-50 text-[10px] text-red-700"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Retorno atrasado
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-vinho/80">
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        <span>
                          <strong>Telefone:</strong> {numeroLead || '—'}
                        </span>
                        <span>
                          <strong>E-mail:</strong> {lead.email || '—'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        <span>
                          <strong>Interesse:</strong>{' '}
                          {lead.interesse
                            ? ROTULO_INTERESSE[lead.interesse] || lead.interesse
                            : '—'}
                        </span>
                        <span>
                          <strong>Canal:</strong>{' '}
                          {ROTULO_CANAL[lead.canal_preferido] || 'Não informado'}
                        </span>
                      </div>
                      {(() => {
                        const inters = interessesDoLead(lead)
                        if (inters.length === 0) return null
                        const modalidades = interessesParaModalidades(inters)
                        return (
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span className="text-[10px] font-bold uppercase text-vinho/50">
                              Modalidades:
                            </span>
                            {modalidades.map((m) => (
                              <Badge
                                key={m}
                                variant="outline"
                                className="border-dourado/50 bg-dourado/10 text-[10px] text-[#8a6d10]"
                              >
                                {MODALIDADES_COMERCIAIS.find((x) => x.valor === m)?.rotulo || m}
                              </Badge>
                            ))}
                            {inters
                              .filter(
                                (i) =>
                                  !['contratacao', 'patrocinio', 'parceria', 'convite'].includes(i),
                              )
                              .filter(
                                (i) =>
                                  !(
                                    (i === 'proposta_comercial' &&
                                      modalidades.includes('contratacao')) ||
                                    (i === 'apresentar_empresa' &&
                                      modalidades.includes('patrocinio')) ||
                                    (i === 'divulgacao' && modalidades.includes('parceria')) ||
                                    ((i === 'participar_como_convidado' ||
                                      i === 'indicar_convidado') &&
                                      modalidades.includes('convite'))
                                  ),
                              )
                              .map((i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="border-vinho/20 bg-white text-[10px] text-vinho/70"
                                >
                                  {ROTULO_INTERESSE[i] || i}
                                </Badge>
                              ))}
                          </div>
                        )
                      })()}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        <span>
                          <strong>Entrada:</strong> {formatDateTimeBR(lead.created)}
                        </span>
                        <span>
                          <strong>Aguardando:</strong> {tempoAguardando(lead.created)}
                        </span>
                        <span>
                          <strong>Responsável:</strong> {lead.responsavel || '—'}
                        </span>
                      </div>
                      {lead.data_proximo_retorno && (
                        <div>
                          <strong>Próximo retorno:</strong> {lead.data_proximo_retorno}
                          {lead.proxima_acao ? ` — ${lead.proxima_acao}` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações rápidas */}
                  <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      title="Ver conversa com a Nine"
                      onClick={() => {
                        abrirDetalhe(lead)
                        setVerConversa(true)
                      }}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" /> Ver Conversa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      title="Ver resumo IA do atendimento"
                      onClick={async () => {
                        setLeadAcao(lead)
                        setCarregandoDetalhe(true)
                        try {
                          const r = await NineComercialService.resumoIaLead(lead.id)
                          setLeadDetalhe({
                            lead,
                            mensagens: [],
                            tarefas: [],
                            resumo_ia: r.resumo_ia,
                          } as unknown as NineLeadDetalhe)
                        } catch {
                          toast.error('Não foi possível gerar o resumo IA.')
                        } finally {
                          setCarregandoDetalhe(false)
                        }
                        setVerConversa(false)
                      }}
                    >
                      <Sparkles className="mr-1 h-3.5 w-3.5" /> Ver Resumo
                    </Button>
                    {montarLinkWhatsappLead(numeroLead) ? (
                      <a
                        href={montarLinkWhatsappLead(numeroLead)}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir WhatsApp (envio manual)"
                      >
                        <Button size="sm" variant="outline" className="text-emerald-700">
                          <MessageCircle className="mr-1 h-3.5 w-3.5" /> WhatsApp
                        </Button>
                      </a>
                    ) : null}
                    {montarLinkTel(numeroLead) ? (
                      <a href={montarLinkTel(numeroLead)} title="Ligar">
                        <Button size="sm" variant="outline">
                          <Phone className="mr-1 h-3.5 w-3.5" /> Ligar
                        </Button>
                      </a>
                    ) : null}
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} title="Enviar e-mail">
                        <Button size="sm" variant="outline">
                          <Send className="mr-1 h-3.5 w-3.5" /> E-mail
                        </Button>
                      </a>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirAcao(lead, 'registrar')}
                    >
                      Registrar Contato
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => abrirAcao(lead, 'agendar')}>
                      Agendar Retorno
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => abrirAcao(lead, 'status')}>
                      Alterar Status
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirAcao(lead, 'observacao')}
                    >
                      Adicionar Observação
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tarefas de retorno */}
      <div className="rounded-xl border border-vinho/10 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-vinho/10 p-4">
          <h3 className="font-serif text-lg font-bold text-vinho">Tarefas de Retorno</h3>
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                ['pendentes', `Pendentes (${contagensTarefas.pendentes})`],
                ['hoje', `Hoje (${contagensTarefas.hoje})`],
                ['atrasadas', `Atrasadas (${contagensTarefas.atrasadas})`],
                ['concluidas', `Concluídas (${contagensTarefas.concluidas})`],
                ['todas', 'Todas'],
              ] as const
            ).map(([valor, rotulo]) => (
              <Button
                key={valor}
                size="sm"
                variant={filtroTarefas === valor ? 'default' : 'ghost'}
                onClick={() => setFiltroTarefas(valor)}
                className={cn(filtroTarefas === valor && 'bg-vinho text-white hover:bg-vinho-dark')}
              >
                {rotulo}
              </Button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-vinho/5">
          {tarefasExibidas.length === 0 ? (
            <div className="p-6 text-center text-sm text-vinho/60">Nenhuma tarefa nesta lista.</div>
          ) : (
            tarefasExibidas.map((t) => {
              const hoje = new Date().toISOString().slice(0, 10)
              const atrasada = t.status === 'pendente' && t.prazo && t.prazo < hoje
              return (
                <div
                  key={t.id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-vinho">{t.titulo}</span>
                      {atrasada && (
                        <Badge
                          variant="outline"
                          className="border-red-300 bg-red-50 text-[10px] text-red-700"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" /> Atrasada
                        </Badge>
                      )}
                      {t.prazo && (
                        <Badge variant="outline" className="text-[10px]">
                          Prazo: {t.prazo}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-vinho/70">
                      {t.nome ? `${t.nome} · ` : ''}
                      {t.motivo || ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-vinho/60">{t.responsavel || '—'}</span>
                    {t.status === 'pendente' ? (
                      <Button size="sm" variant="outline" onClick={() => concluirTarefa(t)}>
                        <Check className="mr-1 h-3.5 w-3.5" /> Concluir
                      </Button>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        Concluída
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ------------------------------ Modal: detalhe / conversa / resumo */}
      <Dialog
        open={!!leadDetalhe || carregandoDetalhe}
        onOpenChange={(o) => {
          if (!o) {
            setLeadDetalhe(null)
            setCarregandoDetalhe(false)
          }
        }}
      >
        <DialogContent className="max-h-[85dvh] max-w-[calc(100vw-1.5rem)] sm:max-w-2xl overflow-y-auto bg-marfim">
          <DialogHeader>
            <DialogTitle className="font-serif text-vinho">
              {leadDetalhe ? leadDetalhe.lead.nome_completo : 'Carregando…'}
            </DialogTitle>
            <DialogDescription>
              {verConversa ? 'Histórico da conversa com a Nine IA' : 'Resumo IA do atendimento'}
            </DialogDescription>
          </DialogHeader>
          {carregandoDetalhe ? (
            <div className="p-6 text-center text-sm text-vinho/60">Carregando…</div>
          ) : leadDetalhe && verConversa ? (
            <div className="space-y-2">
              {leadDetalhe.mensagens.length === 0 ? (
                <p className="text-sm text-vinho/60">Nenhuma mensagem registrada nesta conversa.</p>
              ) : (
                leadDetalhe.mensagens.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                      m.remetente === 'nine'
                        ? 'bg-vinho text-marfim'
                        : 'ml-auto bg-dourado/20 text-vinho',
                    )}
                  >
                    <div className="mb-0.5 text-[10px] font-bold opacity-70">
                      {m.remetente === 'nine' ? 'Nine IA' : m.remetente_nome || 'Visitante'} ·{' '}
                      {formatDateTimeBR(m.created)}
                    </div>
                    {m.conteudo}
                  </div>
                ))
              )}
            </div>
          ) : leadDetalhe ? (
            <div className="whitespace-pre-wrap rounded-lg border border-dourado/40 bg-dourado/10 p-4 text-sm text-vinho">
              {leadDetalhe.lead.resumo_ia || 'Sem resumo ainda — gere em "Ver Resumo".'}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------- Modal: registrar contato */}
      <Dialog
        open={modalAcao === 'registrar'}
        onOpenChange={(o) => {
          if (!o) {
            setModalAcao(null)
            setLeadAcao(null)
          }
        }}
      >
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg bg-marfim">
          <DialogHeader>
            <DialogTitle className="font-serif text-vinho">Registrar Contato</DialogTitle>
            <DialogDescription>
              {leadAcao?.nome_completo} — registre o contato manual que você acabou de fazer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-vinho">Canal</label>
              <Select
                value={formRegistrar.canal}
                onValueChange={(v) => setFormRegistrar({ ...formRegistrar, canal: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="ligacao">Ligação</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-vinho">Resultado</label>
              <textarea
                className="w-full rounded-lg border border-vinho/20 bg-white p-2 text-sm"
                rows={3}
                value={formRegistrar.resultado}
                onChange={(e) => setFormRegistrar({ ...formRegistrar, resultado: e.target.value })}
                placeholder="Como foi o contato? (obrigatório)"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-vinho">Observações</label>
              <textarea
                className="w-full rounded-lg border border-vinho/20 bg-white p-2 text-sm"
                rows={2}
                value={formRegistrar.observacoes}
                onChange={(e) =>
                  setFormRegistrar({ ...formRegistrar, observacoes: e.target.value })
                }
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-vinho">Novo status</label>
              <Select
                value={formRegistrar.status_resultante}
                onValueChange={(v) => setFormRegistrar({ ...formRegistrar, status_resultante: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_COMERCIAIS.filter((s) => s.valor !== 'novo_lead').map((s) => (
                    <SelectItem key={s.valor} value={s.valor}>
                      {s.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-vinho text-white hover:bg-vinho-dark"
              disabled={salvando || !formRegistrar.resultado.trim()}
              onClick={() =>
                executarAcao(
                  {
                    acao: 'registrar_contato',
                    canal: formRegistrar.canal,
                    resultado: formRegistrar.resultado,
                    observacoes: formRegistrar.observacoes,
                    status: formRegistrar.status_resultante,
                  },
                  'Contato registrado.',
                )
              }
            >
              <FileText className="mr-2 h-4 w-4" />
              {salvando ? 'Salvando…' : 'Registrar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------- Modal: agendar retorno */}
      <Dialog
        open={modalAcao === 'agendar'}
        onOpenChange={(o) => {
          if (!o) {
            setModalAcao(null)
            setLeadAcao(null)
          }
        }}
      >
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md bg-marfim">
          <DialogHeader>
            <DialogTitle className="font-serif text-vinho">Agendar Retorno</DialogTitle>
            <DialogDescription>
              {leadAcao?.nome_completo} — cria ou atualiza a tarefa de retorno (sem duplicar).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-vinho">Data prevista</label>
              <input
                type="date"
                className="w-full rounded-lg border border-vinho/20 bg-white p-2 text-sm"
                value={formAgendar.data}
                onChange={(e) => setFormAgendar({ ...formAgendar, data: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-vinho">Observação</label>
              <textarea
                className="w-full rounded-lg border border-vinho/20 bg-white p-2 text-sm"
                rows={2}
                value={formAgendar.observacao}
                onChange={(e) => setFormAgendar({ ...formAgendar, observacao: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <Button
              className="w-full bg-vinho text-white hover:bg-vinho-dark"
              disabled={salvando || !formAgendar.data}
              onClick={() =>
                executarAcao(
                  {
                    acao: 'agendar_retorno',
                    data: formAgendar.data,
                    observacao: formAgendar.observacao,
                  },
                  'Retorno agendado — tarefa de retorno atualizada.',
                )
              }
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              {salvando ? 'Agendando…' : 'Agendar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --------------------------------------------- Modal: alterar status */}
      <Dialog
        open={modalAcao === 'status'}
        onOpenChange={(o) => {
          if (!o) {
            setModalAcao(null)
            setLeadAcao(null)
          }
        }}
      >
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md bg-marfim">
          <DialogHeader>
            <DialogTitle className="font-serif text-vinho">Alterar Status</DialogTitle>
            <DialogDescription>
              {leadAcao?.nome_completo} — o status só muda por ação real da equipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={formStatus}
              onValueChange={(v) => setFormStatus(v as ContatoStatusComercial)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_COMERCIAIS.map((s) => (
                  <SelectItem key={s.valor} value={s.valor}>
                    {s.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full bg-vinho text-white hover:bg-vinho-dark"
              disabled={salvando}
              onClick={() =>
                executarAcao({ acao: 'alterar_status', status: formStatus }, 'Status alterado.')
              }
            >
              {salvando ? 'Salvando…' : 'Salvar status'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------ Modal: adicionar observação */}
      <Dialog
        open={modalAcao === 'observacao'}
        onOpenChange={(o) => {
          if (!o) {
            setModalAcao(null)
            setLeadAcao(null)
          }
        }}
      >
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md bg-marfim">
          <DialogHeader>
            <DialogTitle className="font-serif text-vinho">Adicionar Observação</DialogTitle>
            <DialogDescription>{leadAcao?.nome_completo}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              className="w-full rounded-lg border border-vinho/20 bg-white p-2 text-sm"
              rows={3}
              value={formObservacao}
              onChange={(e) => setFormObservacao(e.target.value)}
              placeholder="Observação interna sobre este lead…"
            />
            <Button
              className="w-full bg-vinho text-white hover:bg-vinho-dark"
              disabled={salvando || !formObservacao.trim()}
              onClick={() =>
                executarAcao(
                  { acao: 'adicionar_observacao', observacao: formObservacao },
                  'Observação adicionada.',
                )
              }
            >
              {salvando ? 'Salvando…' : 'Salvar observação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rodapé: link oficial da Aline (manual) */}
      <div className="rounded-xl border border-dourado/40 bg-dourado/10 p-4 text-xs text-vinho">
        <strong>Atendimento humano:</strong> quando a Nine não souber responder, o visitante recebe
        o link oficial da Aline —{' '}
        <a className="underline" href={LINK_WHATSAPP_ALINE} target="_blank" rel="noreferrer">
          wa.me/5531991297619
        </a>{' '}
        (abre o WhatsApp manualmente; sem envio automático).
      </div>
    </div>
  )
}
