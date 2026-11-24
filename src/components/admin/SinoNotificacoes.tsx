// src/components/admin/SinoNotificacoes.tsx
// Sino de notificações acionáveis do painel administrativo.
// Desktop: sino com dropdown acionável no Topbar (vinho/dourado, identidade visual preservada).
// Mobile: o link já existente para /admin/notificacoes continua — o dropdown é apenas
// um reforço; badge e navegação funcionam nas duas plataformas.
// Dados reais da collection "notificacoes" (criadas pelos hooks de sistema em
// pocketbase/hooks/notificacoes_hooks.js): lead novo, roteiro aguardando aprovação,
// gravação marcada para < 48h. Ao clicar em um item: navega para a tela relacionada
// e marca a notificação como lida (persistido no PocketBase).

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, Target, FileText, CalendarDays, Check, CheckCheck } from 'lucide-react'

// Rótulos por tipo de notificação (alinhados ao hook de sistema)
const ROTULO_TIPO: Record<string, { label: string; path: string }> = {
  lead: { label: 'Lead — Painel Comercial', path: '/admin/leads' },
  roteiro: { label: 'Roteiro — Aguardando aprovação', path: '/admin/roteiros' },
  gravacao: { label: 'Gravação — Agenda', path: '/admin/agenda' },
}

interface NotificacaoRecord {
  id: string
  tipo: 'lead' | 'roteiro' | 'gravacao'
  titulo: string
  mensagem: string
  referencia_tipo?: string
  referencia_id?: string
  lida: boolean
  created: string
}

export default function SinoNotificacoes() {
  const navigate = useNavigate()
  const [items, setItems] = useState<NotificacaoRecord[]>([])
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // ---------- carregar notificações reais ----------
  const carregar = useCallback(async () => {
    try {
      const lista = await pb.collection('notificacoes').getList(1, 25, {
        sort: '-created',
      })
      setItems(lista.items as unknown as NotificacaoRecord[])
    } catch (e) {
      console.warn('[SinoNotificacoes] Erro ao carregar notificações:', e)
    }
  }, [])

  useEffect(() => {
    carregar()

    // Realtime: badge atualiza na hora que um novo lead/roteiro/gravação entra
    let unsub: (() => void) | undefined
    pb.collection('notificacoes')
      .subscribe('*', () => {
        carregar()
      })
      .then((u) => {
        unsub = u
      })
      .catch(() => {})

    // Refresh quando a janela volta ao foco (garante sincronia após voltar ao painel)
    const onFocus = () => carregar()
    window.addEventListener('focus', onFocus)

    return () => {
      if (unsub) unsub()
      window.removeEventListener('focus', onFocus)
    }
  }, [carregar])

  // Contagem de não lidas (sempre visível no badge do sino)
  const naoLidas = items.filter((n) => !n.lida).length

  // ---------- fechar dropdown ao clicar fora / escapar ----------
  useEffect(() => {
    if (!aberto) return
    const onClickFora = (ev: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(ev.target as Node)) {
        setAberto(false)
      }
    }
    const onEscape = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', onClickFora)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickFora)
      document.removeEventListener('keydown', onEscape)
    }
  }, [aberto])

  // ---------- ações ----------
  const marcarComoLida = async (id: string) => {
    try {
      await pb.collection('notificacoes').update(id, { lida: true })
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
    } catch (e) {
      console.warn('[SinoNotificacoes] Erro ao marcar como lida:', e)
    }
  }

  const marcarTodasComoLidas = async () => {
    const naoLidasItems = items.filter((n) => !n.lida)
    naoLidasItems.forEach((n) => {
      // marca em paralelo, sem bloquear o dropdown
      pb.collection('notificacoes')
        .update(n.id, { lida: true })
        .catch(() => {})
    })
    setItems((prev) => prev.map((n) => ({ ...n, lida: true })))
  }

  const irParaDestino = (item: NotificacaoRecord) => {
    const destino = ROTULO_TIPO[item.tipo]?.path || '/admin/notificacoes'
    setAberto(false)
    if (!item.lida) marcarComoLida(item.id)
    navigate(destino)
  }

  const formatarQuando = (iso: string) => {
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return ''
      const hoje = new Date()
      const mesmoDia = d.toDateString() === hoje.toDateString()
      const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      if (mesmoDia) return `Hoje, ${hora}`
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  // ---------- ícone por tipo ----------
  const IconeTipo = ({ tipo }: { tipo: string }) => {
    if (tipo === 'lead') return <Target className="w-4 h-4 text-dourado-dark" />
    if (tipo === 'roteiro') return <FileText className="w-4 h-4 text-dourado-dark" />
    if (tipo === 'gravacao') return <CalendarDays className="w-4 h-4 text-dourado-dark" />
    return <Bell className="w-4 h-4 text-dourado-dark" />
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Gatilho: sino com badge de não lidas — mantém o padrão de pill do Topbar */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="text-xs text-vinho hover:text-dourado-dark flex items-center gap-1.5 transition-colors font-semibold bg-marfim border border-vinho/15 hover:border-dourado px-3 py-1.5 rounded-full relative"
        title="Notificações acionáveis (leads, roteiros e gravações)"
        aria-label="Notificações do painel"
        aria-expanded={aberto}
      >
        <Bell className="w-3.5 h-3.5 text-dourado-dark" />
        <span className="hidden lg:inline">Notificações</span>
        {naoLidas > 0 && (
          <Badge className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0 rounded-full h-4 min-w-[16px] flex items-center justify-center">
            {naoLidas > 99 ? '99+' : naoLidas}
          </Badge>
        )}
      </button>

      {/* Dropdown acionável */}
      {aberto && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-[360px] sm:max-w-[400px] bg-white border border-vinho/15 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Cabeçalho do dropdown */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-vinho text-white border-b border-dourado/40">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-dourado" />
              <span className="text-xs font-bold">Notificações</span>
              {naoLidas > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0 rounded-full h-4">
                  {naoLidas} nova{naoLidas > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={marcarTodasComoLidas}
              disabled={naoLidas === 0}
              className="text-[11px] font-semibold text-dourado hover:text-dourado-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Marcar todas como lidas"
            >
              <CheckCheck className="w-3.5 h-3.5 inline mr-1" />
              Marcar todas
            </button>
          </div>

          {/* Lista acionável */}
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-vinho/60">
                Sem notificações por enquanto — novidades de leads, roteiros e gravações aparecem
                aqui automaticamente.
              </div>
            ) : (
              items.map((item) => {
                const rot = ROTULO_TIPO[item.tipo] || { label: 'Notificação', path: '/admin' }
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => irParaDestino(item)}
                    className={`w-full text-left px-4 py-3 border-b border-vinho/5 last:border-b-0 hover:bg-marfim/70 transition-colors group ${
                      item.lida ? 'opacity-70' : 'bg-dourado/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-vinho/5 border border-vinho/10 flex items-center justify-center mt-0.5">
                        <IconeTipo tipo={item.tipo} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-dourado-dark">
                            {rot.label}
                          </span>
                          {!item.lida && (
                            <span className="w-2 h-2 bg-amber-500 rounded-full ring-2 ring-amber-200 shrink-0" />
                          )}
                        </div>
                        <p className="text-sm font-bold text-vinho leading-snug truncate group-hover:text-dourado-dark transition-colors">
                          {item.titulo}
                        </p>
                        <p className="text-xs text-vinho/70 line-clamp-2 mt-0.5">{item.mensagem}</p>
                        <p className="text-[10px] text-vinho/40 mt-1">
                          {formatarQuando(item.created)}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Rodapé: abrir central completa */}
          <div className="px-4 py-2.5 bg-marfim border-t border-vinho/10">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-vinho hover:text-dourado-dark hover:bg-vinho/5 min-h-[36px] justify-center"
              onClick={() => {
                setAberto(false)
                navigate('/admin/notificacoes')
              }}
            >
              <Bell className="w-3.5 h-3.5 mr-1.5 text-dourado-dark" />
              Ver todas na Central de Notificações
              {naoLidas > 0 && (
                <Check
                  className="w-3 h-3 ml-1 text-dourado-dark"
                  aria-label={`${naoLidas} não lidas`}
                />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
