import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { formatDateBR, getFileUrl } from '@/lib/formatters'
import type {
  DepoimentoConvidadoRecord,
  ContatoRecord,
  RoteiroConvidadoRecord,
} from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  MessageSquareQuote,
  FileText,
  Inbox,
  CheckCircle2,
  ExternalLink,
  Clock,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

export interface NotificationItem {
  id: string
  origem: 'depoimento' | 'contato' | 'roteiro'
  titulo: string
  subtitulo: string
  resumo: string
  data: string
  lida: boolean
  statusOriginal: string
  targetPath: string
  recordId: string
  foto?: string
  rawRecord: DepoimentoConvidadoRecord | ContatoRecord | RoteiroConvidadoRecord
}

export default function AdminNotificacoesScreen() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroOrigem, setFiltroOrigem] = useState<'todos' | 'roteiro' | 'depoimento' | 'contato'>(
    'todos',
  )
  const [filtroLidas, setFiltroLidas] = useState<'todos' | 'nao_lidas' | 'lidas'>('nao_lidas')

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const [rotList, depList, contList] = await Promise.all([
        pb
          .collection('roteiros_convidados')
          .getFullList<RoteiroConvidadoRecord>({ sort: '-created' })
          .catch(() => []),
        pb
          .collection('depoimentos_convidados')
          .getFullList<DepoimentoConvidadoRecord>({ sort: '-created' })
          .catch(() => []),
        pb
          .collection('contatos')
          .getFullList<ContatoRecord>({ sort: '-created' })
          .catch(() => []),
      ])

      const list: NotificationItem[] = []

      // Roteiros dos convidados
      rotList.forEach((rot) => {
        list.push({
          id: `rot_${rot.id}`,
          origem: 'roteiro',
          titulo: `Roteiro de ${rot.nome}`,
          subtitulo:
            rot.tem_empresa && rot.nome_empresa
              ? `Empresa: ${rot.nome_empresa}`
              : `Nasc.: ${rot.data_nascimento} (${rot.estado_civil})`,
          resumo: rot.tema_enfatizar || rot.biografia || 'Respostas enviadas pelo convidado.',
          data: rot.created,
          lida: Boolean(rot.visualizado || rot.status !== 'pendente'),
          statusOriginal: rot.status,
          targetPath: '/admin/roteiros',
          recordId: rot.id,
          foto: rot.foto ? getFileUrl(rot, rot.foto, '100x100') : undefined,
          rawRecord: rot,
        })
      })

      // Depoimentos dos convidados
      depList.forEach((dep) => {
        list.push({
          id: `dep_${dep.id}`,
          origem: 'depoimento',
          titulo: `Depoimento de ${dep.nome}`,
          subtitulo: dep.empresa ? `Empresa: ${dep.empresa}` : `Instagram: ${dep.instagram}`,
          resumo: dep.texto,
          data: dep.created,
          lida: Boolean(dep.visualizado || dep.status !== 'pendente'),
          statusOriginal: dep.status,
          targetPath: '/admin/depoimentos',
          recordId: dep.id,
          foto: dep.foto ? getFileUrl(dep, dep.foto, '100x100') : undefined,
          rawRecord: dep,
        })
      })

      // Mensagens de Contato / Propostas de Participação
      contList.forEach((c) => {
        list.push({
          id: `cont_${c.id}`,
          origem: 'contato',
          titulo: `Proposta de ${c.nome_completo}`,
          subtitulo: `${c.profissao} (${c.idade} anos) — ${c.instagram}`,
          resumo: c.motivo,
          data: c.created,
          lida: c.status !== 'novo',
          statusOriginal: c.status,
          targetPath: '/admin/contatos',
          recordId: c.id,
          rawRecord: c,
        })
      })

      // Ordenar por data decrescente
      list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

      setNotifications(list)
    } catch (err) {
      console.error('Erro ao carregar notificações:', err)
      toast.error('Erro ao carregar notificações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  // Subscriptions em tempo real
  useEffect(() => {
    let unsubRot: (() => void) | undefined
    let unsubDep: (() => void) | undefined
    let unsubCont: (() => void) | undefined

    pb.collection('roteiros_convidados')
      .subscribe('*', () => {
        loadNotifications()
      })
      .then((unsub) => {
        unsubRot = unsub
      })
      .catch(() => {})

    pb.collection('depoimentos_convidados')
      .subscribe('*', () => {
        loadNotifications()
      })
      .then((unsub) => {
        unsubDep = unsub
      })
      .catch(() => {})

    pb.collection('contatos')
      .subscribe('*', () => {
        loadNotifications()
      })
      .then((unsub) => {
        unsubCont = unsub
      })
      .catch(() => {})

    return () => {
      if (unsubRot) unsubRot()
      if (unsubDep) unsubDep()
      if (unsubCont) unsubCont()
    }
  }, [])

  // Marcar como lida
  const handleMarcarComoLida = async (item: NotificationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    try {
      if (item.origem === 'roteiro') {
        await pb.collection('roteiros_convidados').update(item.recordId, {
          visualizado: true,
        })
      } else if (item.origem === 'depoimento') {
        await pb.collection('depoimentos_convidados').update(item.recordId, {
          visualizado: true,
        })
      } else {
        await pb.collection('contatos').update(item.recordId, {
          status: 'visualizado',
        })
      }

      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, lida: true } : n)))
      toast.success('Notificação marcada como lida!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar status da notificação.')
    }
  }

  // Marcar todas como lidas
  const handleMarcarTodasComoLidas = async () => {
    const naoLidas = notifications.filter((n) => !n.lida)
    if (naoLidas.length === 0) return

    try {
      await Promise.all(
        naoLidas.map((item) => {
          if (item.origem === 'roteiro') {
            return pb
              .collection('roteiros_convidados')
              .update(item.recordId, { visualizado: true })
              .catch(() => {})
          } else if (item.origem === 'depoimento') {
            return pb
              .collection('depoimentos_convidados')
              .update(item.recordId, { visualizado: true })
              .catch(() => {})
          } else {
            return pb
              .collection('contatos')
              .update(item.recordId, { status: 'visualizado' })
              .catch(() => {})
          }
        }),
      )

      setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })))
      toast.success('Todas as notificações foram marcadas como lidas!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao marcar todas como lidas.')
    }
  }

  // Clicar e navegar para a tela correspondente
  const handleAbrirDestino = async (item: NotificationItem) => {
    if (!item.lida) {
      // Marca como lida em background
      if (item.origem === 'roteiro') {
        pb.collection('roteiros_convidados')
          .update(item.recordId, { visualizado: true })
          .catch(() => {})
      } else if (item.origem === 'depoimento') {
        pb.collection('depoimentos_convidados')
          .update(item.recordId, { visualizado: true })
          .catch(() => {})
      } else {
        pb.collection('contatos')
          .update(item.recordId, { status: 'visualizado' })
          .catch(() => {})
      }
    }
    navigate(item.targetPath)
  }

  // Filtragem
  const filtered = notifications.filter((item) => {
    if (filtroOrigem !== 'todos' && item.origem !== filtroOrigem) return false
    if (filtroLidas === 'nao_lidas' && item.lida) return false
    if (filtroLidas === 'lidas' && !item.lida) return false
    return true
  })

  const totalNaoLidas = notifications.filter((n) => !n.lida).length
  const naoLidasRot = notifications.filter((n) => !n.lida && n.origem === 'roteiro').length
  const naoLidasDep = notifications.filter((n) => !n.lida && n.origem === 'depoimento').length
  const naoLidasCont = notifications.filter((n) => !n.lida && n.origem === 'contato').length

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">
              Central de Notificações
            </h2>
            {totalNaoLidas > 0 && (
              <Badge className="bg-amber-500 text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
                {totalNaoLidas} pendente{totalNaoLidas > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-xs text-vinho/70 mt-0.5">
            Novos depoimentos enviados e propostas de contato preenchidas no site do CoffeeCast 4.0.
          </p>
        </div>

        {totalNaoLidas > 0 && (
          <Button
            onClick={handleMarcarTodasComoLidas}
            variant="outline"
            className="w-full sm:w-auto border-vinho/20 text-vinho hover:bg-vinho hover:text-white text-xs font-semibold rounded-xl min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Contadores e Filtros Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div
          onClick={() => {
            setFiltroOrigem('todos')
            setFiltroLidas('nao_lidas')
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroOrigem === 'todos' && filtroLidas === 'nao_lidas'
              ? 'bg-vinho text-white border-vinho shadow-md'
              : 'bg-white text-vinho border-vinho/10 hover:border-dourado/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Todas Pendências
            </span>
            <Bell className="w-4 h-4 text-dourado" />
          </div>
          <p className="text-2xl font-serif font-bold mt-2">{totalNaoLidas}</p>
          <span className="text-[11px] opacity-75">Aguardando visualização ou ação</span>
        </div>

        <div
          onClick={() => {
            setFiltroOrigem('roteiro')
            setFiltroLidas('nao_lidas')
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroOrigem === 'roteiro' && filtroLidas === 'nao_lidas'
              ? 'bg-vinho text-white border-vinho shadow-md'
              : 'bg-white text-vinho border-vinho/10 hover:border-dourado/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Novos Roteiros
            </span>
            <FileText className="w-4 h-4 text-dourado" />
          </div>
          <p className="text-2xl font-serif font-bold mt-2">{naoLidasRot}</p>
          <span className="text-[11px] opacity-75">Preenchidos para o episódio</span>
        </div>

        <div
          onClick={() => {
            setFiltroOrigem('depoimento')
            setFiltroLidas('nao_lidas')
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroOrigem === 'depoimento' && filtroLidas === 'nao_lidas'
              ? 'bg-vinho text-white border-vinho shadow-md'
              : 'bg-white text-vinho border-vinho/10 hover:border-dourado/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Novos Depoimentos
            </span>
            <MessageSquareQuote className="w-4 h-4 text-dourado" />
          </div>
          <p className="text-2xl font-serif font-bold mt-2">{naoLidasDep}</p>
          <span className="text-[11px] opacity-75">Enviados por convidados no site</span>
        </div>

        <div
          onClick={() => {
            setFiltroOrigem('contato')
            setFiltroLidas('nao_lidas')
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroOrigem === 'contato' && filtroLidas === 'nao_lidas'
              ? 'bg-vinho text-white border-vinho shadow-md'
              : 'bg-white text-vinho border-vinho/10 hover:border-dourado/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Contatos / Leads
            </span>
            <Inbox className="w-4 h-4 text-dourado" />
          </div>
          <p className="text-2xl font-serif font-bold mt-2">{naoLidasCont}</p>
          <span className="text-[11px] opacity-75">Formulário de participação</span>
        </div>
      </div>

      {/* Barra de Filtros refinados */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-vinho/10 shadow-xs">
        {/* Origem */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFiltroOrigem('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filtroOrigem === 'todos' ? 'bg-vinho text-white' : 'text-vinho/70 hover:bg-vinho/5'
            }`}
          >
            Todas as Origens
          </button>
          <button
            onClick={() => setFiltroOrigem('roteiro')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filtroOrigem === 'roteiro' ? 'bg-vinho text-white' : 'text-vinho/70 hover:bg-vinho/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-dourado shrink-0" />
            <span>Roteiros</span>
          </button>
          <button
            onClick={() => setFiltroOrigem('depoimento')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filtroOrigem === 'depoimento'
                ? 'bg-vinho text-white'
                : 'text-vinho/70 hover:bg-vinho/5'
            }`}
          >
            <MessageSquareQuote className="w-3.5 h-3.5 text-dourado shrink-0" />
            <span>Depoimentos</span>
          </button>
          <button
            onClick={() => setFiltroOrigem('contato')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filtroOrigem === 'contato' ? 'bg-vinho text-white' : 'text-vinho/70 hover:bg-vinho/5'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 text-dourado shrink-0" />
            <span>Contatos</span>
          </button>
        </div>

        {/* Lidas / Não Lidas */}
        <div className="flex items-center gap-1.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-vinho/10">
          <button
            onClick={() => setFiltroLidas('nao_lidas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filtroLidas === 'nao_lidas'
                ? 'bg-amber-600 text-white'
                : 'text-vinho/70 hover:bg-vinho/5'
            }`}
          >
            Pendentes ({totalNaoLidas})
          </button>
          <button
            onClick={() => setFiltroLidas('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filtroLidas === 'todos'
                ? 'bg-vinho/10 text-vinho font-bold'
                : 'text-vinho/70 hover:bg-vinho/5'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFiltroLidas('lidas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filtroLidas === 'lidas'
                ? 'bg-vinho/10 text-vinho font-bold'
                : 'text-vinho/70 hover:bg-vinho/5'
            }`}
          >
            Já Lidas
          </button>
        </div>
      </div>

      {/* Listagem de Notificações */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-12 text-center text-xs text-vinho/60">
            Carregando central de notificações...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-vinho">Nenhuma notificação encontrada</h3>
            <p className="text-xs text-vinho/60">
              Tudo em dia! Nenhuma pendência para o filtro selecionado.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isRoteiro = item.origem === 'roteiro'
            const isDepoimento = item.origem === 'depoimento'
            return (
              <div
                key={item.id}
                onClick={() => handleAbrirDestino(item)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group shadow-xs hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  !item.lida
                    ? 'bg-white border-dourado/60 ring-1 ring-dourado/30'
                    : 'bg-white/70 border-vinho/10 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Lado esquerdo: ícone/avatar e informações */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Ícone de origem ou foto */}
                  <div className="relative shrink-0">
                    {item.foto ? (
                      <img
                        src={item.foto}
                        alt={item.titulo}
                        className="w-11 h-11 rounded-full object-cover border-2 border-dourado"
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center ${
                          isRoteiro
                            ? 'bg-vinho text-dourado border border-dourado/40'
                            : isDepoimento
                              ? 'bg-dourado/20 text-vinho border border-dourado/40'
                              : 'bg-vinho/10 text-vinho border border-vinho/20'
                        }`}
                      >
                        {isRoteiro ? (
                          <FileText className="w-5 h-5 text-dourado" />
                        ) : isDepoimento ? (
                          <MessageSquareQuote className="w-5 h-5 text-dourado-dark" />
                        ) : (
                          <Inbox className="w-5 h-5 text-vinho" />
                        )}
                      </div>
                    )}

                    {!item.lida && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white ring-1 ring-amber-400" />
                    )}
                  </div>

                  {/* Informações textuais */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isRoteiro
                            ? 'bg-vinho text-white'
                            : isDepoimento
                              ? 'bg-dourado/20 text-vinho border border-dourado/40'
                              : 'bg-vinho/10 text-vinho border border-vinho/20'
                        }`}
                      >
                        {isRoteiro
                          ? 'Roteiro de Episódio'
                          : isDepoimento
                            ? 'Depoimento'
                            : 'Contato / Proposta'}
                      </Badge>

                      {!item.lida && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold">
                          Novo
                        </Badge>
                      )}

                      <span className="text-[11px] text-vinho/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateBR(item.data)}
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-sm sm:text-base text-vinho leading-tight group-hover:text-dourado-dark transition-colors">
                      {item.titulo}
                    </h4>

                    <p className="text-xs text-vinho/70 font-medium">{item.subtitulo}</p>

                    <p className="text-xs text-vinho/80 italic bg-marfim/60 p-2.5 rounded-xl border border-vinho/10 line-clamp-2 mt-1">
                      "{item.resumo}"
                    </p>
                  </div>
                </div>

                {/* Lado direito: Ações */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-vinho/5 shrink-0">
                  {!item.lida && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleMarcarComoLida(item, e)}
                      className="text-xs h-9 text-vinho/70 hover:text-vinho hover:bg-vinho/10 min-h-[36px]"
                      title="Marcar como lida"
                    >
                      <Check className="w-3.5 h-3.5 mr-1 text-dourado-dark" />
                      Marcar lida
                    </Button>
                  )}

                  <Button
                    size="sm"
                    className="bg-vinho hover:bg-vinho-light text-white text-xs font-semibold h-9 rounded-xl px-3.5 min-h-[36px] flex items-center gap-1.5 group-hover:scale-102 transition-transform"
                  >
                    <span>
                      {isRoteiro
                        ? 'Ver Roteiros'
                        : isDepoimento
                          ? 'Ver Depoimentos'
                          : 'Ver Contato'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-dourado" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
