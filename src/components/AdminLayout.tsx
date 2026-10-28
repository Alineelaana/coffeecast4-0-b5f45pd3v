import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import pb from '@/lib/pocketbase/client'
import officialLogo from '@/assets/sem-nome-1350-x-1080-px-1-c4c50.png'
import {
  LayoutDashboard,
  Bell,
  MessageSquare,
  MessagesSquare,
  Tv,
  Users2,
  MessageSquareQuote,
  Camera,
  Inbox,
  DollarSign,
  Clock,
  CalendarDays,
  FileCheck2,
  FileText,
  Globe,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
  ShieldCheck,
  UserCheck,
  User,
  Bot,
  Store,
  ChevronDown,
  Sparkles,
  Activity,
  BookOpen,
  HelpCircle,
  Search,
  BarChart3,
} from 'lucide-react'
import { getFileUrl } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStorefront } from '@/context/StorefrontContext'

export default function AdminLayout() {
  const { user, logout, role, isMaster, isAdm, hasScreenPermission } = useAuth()
  const { stores, activeStore, activeStoreId, setActiveStoreId } = useStorefront()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [ninePendingCount, setNinePendingCount] = useState(0)
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  const [menuSearchQuery, setMenuSearchQuery] = useState('')
  const desktopSearchInputRef = React.useRef<HTMLInputElement>(null)
  const mobileSearchInputRef = React.useRef<HTMLInputElement>(null)

  // Submenu exclusivo Master / Gestão Avançada colapsável
  const isMasterPathActive = [
    '/admin/storefront',
    '/admin/conteudo',
    '/admin/dominio',
    '/admin/integrantes',
    '/admin/politicas',
    '/admin/usuarios',
    '/admin/chat/gestao',
    '/admin/backups',
    '/admin/documentacao',
  ].some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`))

  const [masterSubmenuOpen, setMasterSubmenuOpen] = useState(true)

  // Garante que se o usuário estiver em uma página do submenu Master, o submenu fique aberto
  React.useEffect(() => {
    if (isMasterPathActive) {
      setMasterSubmenuOpen(true)
    }
  }, [location.pathname, isMasterPathActive])

  // Carrega e atualiza badge de pendências (novos roteiros + novos contatos + novos depoimentos)
  const fetchUnreadCount = async () => {
    try {
      const [rotList, depList, contList] = await Promise.all([
        pb
          .collection('roteiros_convidados')
          .getFullList({
            filter: 'status = "pendente" || visualizado = false',
            fields: 'id',
          })
          .catch(() => []),
        pb
          .collection('depoimentos_convidados')
          .getFullList({
            filter: 'status = "pendente" || visualizado = false',
            fields: 'id',
          })
          .catch(() => []),
        pb
          .collection('contatos')
          .getFullList({
            filter: 'status = "novo"',
            fields: 'id',
          })
          .catch(() => []),
      ])

      setUnreadNotificationsCount(rotList.length + depList.length + contList.length)
    } catch (e) {
      console.error('Erro ao buscar notificações não lidas:', e)
    }
  }

  // Carrega badge de conversas da Nine aguardando resposta humana
  const fetchNinePendingCount = async () => {
    try {
      const nineList = await pb
        .collection('nine_conversas')
        .getFullList({
          filter: 'modo_atendimento = "aguardando_humano"',
          fields: 'id',
        })
        .catch(() => [])

      setNinePendingCount(nineList.length)
    } catch (e) {
      console.error('Erro ao buscar pendências da Nine:', e)
    }
  }

  // Carrega total de mensagens de chat não lidas para o usuário autenticado
  const fetchChatUnreadCount = async () => {
    if (!user) return
    try {
      // Buscar participações do usuário
      const participacoes = await pb.collection('chat_participantes').getFullList({
        filter: `user = "${user.id}"`,
        fields: 'conversa,ultima_leitura',
      })
      let totalUnread = 0
      for (const p of participacoes as any[]) {
        let f = `conversa = "${p.conversa}" && remetente != "${user.id}"`
        if (p.ultima_leitura) {
          f += ` && created > "${p.ultima_leitura}"`
        }
        const res = await pb
          .collection('chat_mensagens')
          .getList(1, 1, { filter: f, fields: 'id' })
          .catch(() => ({ totalItems: 0 }))
        totalUnread += res.totalItems
      }
      setChatUnreadCount(totalUnread)
    } catch (err) {
      console.warn('Erro ao carregar contagem de chat não lido:', err)
    }
  }

  React.useEffect(() => {
    fetchUnreadCount()
    fetchNinePendingCount()
    fetchChatUnreadCount()

    let unsubChat: (() => void) | undefined
    pb.collection('chat_mensagens')
      .subscribe('*', () => {
        fetchChatUnreadCount()
      })
      .then((unsub) => {
        unsubChat = unsub
      })
      .catch(() => {})

    let unsubNine: (() => void) | undefined
    pb.collection('nine_conversas')
      .subscribe('*', () => {
        fetchNinePendingCount()
      })
      .then((unsub) => {
        unsubNine = unsub
      })
      .catch(() => {})

    let unsubRot: (() => void) | undefined
    let unsubDep: (() => void) | undefined
    let unsubCont: (() => void) | undefined

    pb.collection('roteiros_convidados')
      .subscribe('*', () => {
        fetchUnreadCount()
      })
      .then((unsub) => {
        unsubRot = unsub
      })
      .catch(() => {})

    pb.collection('depoimentos_convidados')
      .subscribe('*', () => {
        fetchUnreadCount()
      })
      .then((unsub) => {
        unsubDep = unsub
      })
      .catch(() => {})

    pb.collection('contatos')
      .subscribe('*', () => {
        fetchUnreadCount()
      })
      .then((unsub) => {
        unsubCont = unsub
      })
      .catch(() => {})

    return () => {
      if (unsubRot) unsubRot()
      if (unsubDep) unsubDep()
      if (unsubCont) unsubCont()
      if (unsubNine) unsubNine()
      if (unsubChat) unsubChat()
    }
  }, [user?.id])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Comparador alfabético estrito em português (pt-BR, case-insensitive, ignorando acentos)
  const sortAlphabeticallyByLabel = <T extends { label: string }>(items: T[]): T[] => {
    return [...items].sort((a, b) =>
      a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base', numeric: true }),
    )
  }

  // Itens gerais do menu principal (ordenados alfabeticamente para fácil localização)
  const rawMainMenuItems = [
    {
      key: 'agenda',
      label: 'Agenda de Gravação',
      path: '/admin/agenda',
      icon: CalendarDays,
      keywords: ['calendario', 'gravacoes', 'estudio', 'horario', 'data', 'agendamento'],
    },
    {
      key: 'chat',
      label: 'Chat CoffeeCast',
      path: '/admin/chat',
      icon: MessageSquare,
      badgeCount: chatUnreadCount,
      highlight: true,
      keywords: ['mensagens', 'conversa', 'stickers', 'figurinhas', 'grupos', 'comunicacao'],
    },
    {
      key: 'contatos',
      label: 'Contatos & Leads',
      path: '/admin/contatos',
      icon: Inbox,
      keywords: ['leads', 'crm', 'mensagens do site', 'formulario', 'visitantes', 'prospects'],
    },
    {
      key: 'horas',
      label: 'Controle de Horas',
      path: '/admin/horas',
      icon: Clock,
      keywords: [
        'saldo de horas',
        'banco de horas',
        'estudio horas',
        'tempo de gravacao',
        'pacote',
      ],
    },
    {
      key: 'depoimentos',
      label: 'Depoimentos',
      path: '/admin/depoimentos',
      icon: MessageSquareQuote,
      keywords: ['avaliacoes', 'feedbacks', 'depoimento do convidado', 'relatos', 'testemunhos'],
    },
    {
      key: 'episodios',
      label: 'Episódios',
      path: '/admin/episodios',
      icon: Tv,
      keywords: ['videos', 'youtube', 'programacao', 'lancamento', 'podcasts', 'gravados'],
    },
    {
      key: 'financeiro',
      label: 'Financeiro',
      path: '/admin/financeiro',
      icon: DollarSign,
      highlight: true,
      keywords: [
        'dinheiro',
        'custos',
        'receitas',
        'despesas',
        'contas',
        'pagamentos',
        'fluxo de caixa',
        'gastos',
      ],
    },
    {
      key: 'convites',
      label: 'Gerador de Convites',
      path: '/admin/convites',
      icon: FileCheck2,
      badge: 'PDF',
      keywords: ['convite', 'pdf a5', 'convidar convidado', 'arte', 'cartao', 'impressao'],
    },
    {
      key: 'nine',
      label: 'Nine Assistente Virtual',
      path: '/admin/nine',
      icon: Bot,
      badgeCount: ninePendingCount,
      highlight: true,
      keywords: [
        'ia',
        'inteligencia artificial',
        'bot',
        'atendimento',
        'modo humano',
        'prompt',
        'faq',
      ],
    },
    {
      key: 'momentos',
      label: 'Nossos Momentos',
      path: '/admin/momentos',
      icon: Camera,
      keywords: ['fotos', 'galeria', 'carrossel', 'bastidores', 'imagens', 'fotografia'],
    },
    {
      key: 'notificacoes',
      label: 'Notificações',
      path: '/admin/notificacoes',
      icon: Bell,
      badgeCount: unreadNotificationsCount,
      keywords: ['alertas', 'avisos', 'pendencias', 'sino', 'novidades'],
    },
    {
      key: 'roteiros',
      label: 'Roteiros e Apresentações',
      path: '/admin/roteiros',
      icon: FileText,
      keywords: [
        'pauta',
        'perguntas',
        'fichas',
        'apresentacao',
        'pdf',
        'roteiro oficial',
        'entrevista',
      ],
    },
    {
      key: 'relatorios',
      label: 'Relatórios de Engajamento',
      path: '/admin/relatorios',
      icon: BarChart3,
      highlight: true,
      keywords: [
        'relatorio',
        'relatorios',
        'engajamento',
        'metricas',
        'audiencia',
        'graficos',
        'desempenho',
        'estatisticas',
        'leads',
        'acessos',
      ],
    },
    {
      key: 'dashboard',
      label: 'Visão Geral',
      path: '/admin',
      icon: LayoutDashboard,
      exact: true,
      keywords: ['dashboard', 'inicio', 'home', 'painel', 'metricas', 'resumo'],
    },
  ]

  // SUBMENU EXCLUSIVO MASTER / GESTÃO AVANÇADA (ordenado alfabeticamente)
  const rawMasterMenuItems = [
    {
      key: 'dominio',
      label: 'Área do Domínio',
      path: '/admin/dominio',
      icon: Globe,
      badge: 'DNS',
      exact: false,
      keywords: ['dns', 'dominio', 'url', 'site link', 'configuracao de rede', 'cname'],
    },
    {
      key: 'auditoria',
      label: 'Auditoria do Sistema',
      path: '/admin/auditoria',
      icon: Activity,
      badge: 'Segurança',
      exact: false,
      keywords: [
        'logs',
        'seguranca',
        'historico',
        'atividades',
        'rastreamento',
        'eventos',
        'alteracoes',
      ],
    },
    {
      key: 'backups',
      label: 'Backups do Banco',
      path: '/admin/backups',
      icon: ShieldCheck,
      masterOnly: true, // Exclusivo Master para proteção contra perda de dados
      badge: 'Master',
      exact: false,
      keywords: ['backup', 'copia de seguranca', 'dump', 'restaurar', 'exportar banco', 'download'],
    },
    {
      key: 'documentacao',
      label: 'Documentação',
      path: '/admin/documentacao',
      icon: BookOpen,
      badge: 'Dossiê',
      exact: false,
      keywords: ['dossie', 'manual', 'especificacao', 'arquitetura', 'regras', 'docs'],
    },
    {
      key: 'conteudo',
      label: 'Editar Site',
      path: '/admin/conteudo',
      icon: FileText,
      exact: false,
      keywords: [
        'textos',
        'banner',
        'redes sociais',
        'links',
        'rodape',
        'home editavel',
        'conteudo',
      ],
    },
    {
      key: 'chat_gestao',
      label: 'Gestão de Conversas',
      path: '/admin/chat/gestao',
      icon: MessagesSquare,
      masterOnly: true,
      badge: 'Master',
      exact: false,
      keywords: [
        'moderacao',
        'conversas master',
        'apagar mensagens',
        'gerenciar grupos',
        'historico chat',
      ],
    },
    {
      key: 'guia_ajuda',
      label: 'Guia de Ajuda',
      path: '/admin/guia-ajuda',
      icon: HelpCircle,
      badge: 'Ajuda',
      exact: false,
      keywords: ['tutorial', 'primeiro acesso', 'faq', 'manual de uso', 'duvidas', 'botoes'],
    },
    {
      key: 'integrantes',
      label: 'Integrantes',
      path: '/admin/integrantes',
      icon: Users2,
      exact: false,
      keywords: ['equipe', 'apresentadoras', 'membros do time', 'aline lana', 'hosts', 'staff'],
    },
    {
      key: 'politicas',
      label: 'Políticas do Site',
      path: '/admin/politicas',
      icon: ShieldAlert,
      exact: false,
      keywords: ['lgpd', 'privacidade', 'termos de uso', 'juridico', 'cookies'],
    },
    {
      key: 'storefront',
      label: 'Storefront',
      path: '/admin/storefront',
      icon: Store,
      badge: 'Multi-Loja',
      exact: false,
      keywords: ['loja', 'parceiros', 'marcas', 'subdominio', 'multi-tenant', 'canais'],
    },
    {
      key: 'usuarios',
      label: 'Usuários & Permissões',
      path: '/admin/usuarios',
      icon: UserCheck,
      masterOnly: true, // Apenas o Master pode ver e editar usuários & permissões
      exact: false,
      keywords: [
        'acessos',
        'perfis',
        'cargos',
        'bloquear',
        'nova senha',
        'master',
        'adm',
        'gerencial',
      ],
    },
  ]

  // Normalizador de texto para pesquisa (case-insensitive e sem acentos)
  const normalizeSearchTerm = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  // Filtragem dinâmica de itens do menu conforme as permissões do perfil autenticado
  // Aplica ordenação alfabética resiliente (pt-BR, sem acento, case-insensitive)
  const allowedMainMenuItems = sortAlphabeticallyByLabel(
    rawMainMenuItems.filter((item) => hasScreenPermission(item.key)),
  )

  const allowedMasterMenuItems = sortAlphabeticallyByLabel(
    rawMasterMenuItems.filter((item) => {
      if (item.masterOnly && !isMaster) return false
      return hasScreenPermission(item.key)
    }),
  )

  // Filtro de pesquisa de telas em tempo real
  const normalizedQuery = normalizeSearchTerm(menuSearchQuery)
  const isFiltering = normalizedQuery.length > 0

  interface MenuItemDefinition {
    key: string
    label: string
    path: string
    icon: React.ComponentType<{ className?: string }>
    badgeCount?: number
    highlight?: boolean
    badge?: string
    exact?: boolean
    masterOnly?: boolean
    keywords?: string[]
  }

  const matchesSearch = (item: MenuItemDefinition): boolean => {
    if (!isFiltering) return true
    const normLabel = normalizeSearchTerm(item.label)
    if (normLabel.includes(normalizedQuery)) return true
    if (item.badge && normalizeSearchTerm(item.badge).includes(normalizedQuery)) return true
    if (
      item.keywords &&
      item.keywords.some((k) => normalizeSearchTerm(k).includes(normalizedQuery))
    ) {
      return true
    }
    return false
  }

  const filteredMainMenuItems = allowedMainMenuItems.filter((item) => matchesSearch(item))
  const filteredMasterMenuItems = allowedMasterMenuItems.filter((item) => matchesSearch(item))

  const totalFilteredCount = filteredMainMenuItems.length + filteredMasterMenuItems.length
  const hasNoResults = isFiltering && totalFilteredCount === 0

  // Atalho de teclado global: '/' ou 'Ctrl+K' / 'Cmd+K' foca o campo de pesquisa
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)

      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !isInputFocused)) {
        e.preventDefault()
        if (window.innerWidth < 768) {
          setMobileSidebarOpen(true)
          setTimeout(() => mobileSearchInputRef.current?.focus(), 80)
        } else {
          desktopSearchInputRef.current?.focus()
        }
      } else if (e.key === 'Escape' && menuSearchQuery) {
        setMenuSearchQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuSearchQuery])

  // Exibe o submenu "Exclusivo Master" / "Gestão da Loja / Master" se houver itens autorizados
  const showMasterSection = isFiltering
    ? filteredMasterMenuItems.length > 0
    : isMaster || allowedMasterMenuItems.length > 0

  const getPageTitle = () => {
    const allItems = [...allowedMainMenuItems, ...allowedMasterMenuItems]
    const current = allItems.find((m) =>
      m.exact
        ? location.pathname === m.path
        : m.path !== '/admin' && location.pathname.startsWith(m.path),
    )
    return current ? current.label : 'Painel de Controle'
  }

  const roleLabel =
    role === 'master'
      ? 'Master (Superadministrador)'
      : role === 'adm'
        ? 'ADM (Administrador)'
        : role === 'gerencial'
          ? 'Categoria Gerencial'
          : role === 'ouro'
            ? 'Categoria Ouro'
            : 'Categoria Prata'

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col md:flex-row font-sans">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 bg-vinho border-r border-vinho-dark text-marfim shadow-2xl shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Topo da Sidebar com Logo Oficial Clicável */}
        <div className="p-4 border-b border-vinho-light/40">
          <NavLink
            to="/admin"
            end
            className="group flex flex-col items-center text-center p-2 rounded-2xl hover:bg-vinho-light/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-dourado/60"
            title="Ir para a Visão Geral do Painel Administrativo"
            aria-label="Ir para a Visão Geral do Painel Administrativo"
          >
            <img
              src={officialLogo}
              alt="CoffeeCast 4.0 — Painel Administrativo"
              className="h-14 w-auto max-w-[200px] object-contain drop-shadow-[0_3px_10px_rgba(212,175,55,0.35)] transition-transform duration-200 group-hover:scale-105 cursor-pointer"
            />
            <span className="text-[10px] uppercase tracking-widest text-dourado-light font-medium mt-1.5 group-hover:text-white transition-colors">
              Painel Administrativo
            </span>
          </NavLink>
        </div>

        {/* CAMPO DE PESQUISA DE TELAS NO MENU (ACIMA DA LISTA DE ITENS) */}
        <div className="px-4 pt-3.5 pb-2 border-b border-vinho-light/25 bg-vinho-dark/30">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-dourado-light/70 pointer-events-none transition-colors" />
            <input
              ref={desktopSearchInputRef}
              type="text"
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              placeholder="Pesquisar telas... (/)"
              className="w-full bg-vinho-dark/80 text-marfim placeholder:text-marfim/45 text-xs pl-8 pr-7 py-2 rounded-xl border border-dourado/30 focus:outline-none focus:border-dourado focus:ring-2 focus:ring-dourado/30 shadow-inner transition-all"
              aria-label="Pesquisar telas do menu"
            />
            {menuSearchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setMenuSearchQuery('')
                  desktopSearchInputRef.current?.focus()
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-vinho-light text-marfim/80 hover:text-white hover:bg-vinho flex items-center justify-center transition-colors"
                title="Limpar pesquisa (Esc)"
                aria-label="Limpar pesquisa"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            ) : (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-dourado-light/50 border border-dourado/20 px-1 py-0.2 rounded pointer-events-none">
                /
              </span>
            )}
          </div>
          {isFiltering && (
            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-dourado-light/80">
              <span>
                {totalFilteredCount} tela{totalFilteredCount === 1 ? '' : 's'} encontrada
                {totalFilteredCount === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() => setMenuSearchQuery('')}
                className="hover:text-white underline transition-colors"
              >
                Limpar
              </button>
            </div>
          )}
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 coffeecast-scrollbar overflow-y-auto">
          {hasNoResults ? (
            <div className="py-8 px-2 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-vinho-dark/80 border border-dourado/30 flex items-center justify-center mx-auto text-dourado">
                <Search className="w-5 h-5 text-dourado-light/70" />
              </div>
              <p className="text-xs font-semibold text-white">Nenhuma tela encontrada</p>
              <p className="text-[11px] text-marfim/60 max-w-[200px] mx-auto leading-relaxed">
                Nenhum resultado para "{menuSearchQuery}". Tente outro termo (ex: "financeiro",
                "chat", "perfil", "roteiro").
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setMenuSearchQuery('')
                  desktopSearchInputRef.current?.focus()
                }}
                className="text-[11px] h-7 px-3 bg-vinho-light/40 border-dourado/40 text-dourado hover:bg-vinho-light hover:text-white hover:border-dourado mt-2"
              >
                Limpar busca
              </Button>
            </div>
          ) : (
            <>
              {filteredMainMenuItems.length > 0 && (
                <>
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-marfim/60 mb-2">
                    {isFiltering ? 'Telas Encontradas' : 'Gestão Operacional'}
                  </p>

                  {filteredMainMenuItems.map((item) => {
                    const isActive = item.exact
                      ? location.pathname === item.path
                      : location.pathname === item.path ||
                        location.pathname.startsWith(`${item.path}/`)

                    const Icon = item.icon

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                          isActive
                            ? 'bg-vinho-light text-white shadow-md border-l-4 border-dourado pl-3'
                            : 'text-marfim/80 hover:text-white hover:bg-vinho-light/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Icon
                              className={`w-4 h-4 ${isActive ? 'text-dourado' : 'text-marfim/70'}`}
                            />
                            {item.badgeCount && item.badgeCount > 0 ? (
                              <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                            ) : null}
                          </div>
                          <span>{item.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.badgeCount !== undefined && item.badgeCount > 0 && (
                            <Badge className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0 rounded-full shadow-xs">
                              {item.badgeCount}
                            </Badge>
                          )}

                          {item.badge && (
                            <Badge
                              className={`text-[9px] px-1.5 py-0.5 rounded ${
                                isActive
                                  ? 'bg-dourado text-vinho font-bold'
                                  : 'bg-vinho-dark/80 text-dourado-light border border-dourado/30'
                              }`}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </NavLink>
                    )
                  })}
                </>
              )}

              {/* SUBMENU EXCLUSIVO MASTER / GESTÃO AVANÇADA */}
              {showMasterSection && (
                <div
                  className={`${filteredMainMenuItems.length > 0 ? 'pt-4 mt-4 border-t border-vinho-light/40' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => setMasterSubmenuOpen(!masterSubmenuOpen)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isMasterPathActive
                        ? 'bg-vinho-dark/90 text-dourado border border-dourado/40 shadow-xs'
                        : 'text-dourado-light/90 hover:text-dourado hover:bg-vinho-light/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-dourado/20 flex items-center justify-center text-dourado">
                        <Shield className="w-3.5 h-3.5 text-dourado" />
                      </div>
                      <span className="tracking-wide">
                        {isMaster ? 'Exclusivo Master' : 'Gestão do Site & Loja'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-dourado text-vinho font-bold text-[9px] px-1.5 py-0 rounded">
                        {isMaster ? 'Master' : 'ADM'}
                      </Badge>
                      <ChevronDown
                        className={`w-4 h-4 text-dourado transition-transform duration-200 ${
                          masterSubmenuOpen || isFiltering ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Itens do Submenu Colapsável (sempre aberto quando filtrando com resultados) */}
                  {(masterSubmenuOpen || isFiltering) && (
                    <div className="pl-3 pr-1 pt-1.5 space-y-1 border-l-2 border-dourado/30 ml-4 mt-1 transition-all">
                      {filteredMasterMenuItems.map((item) => {
                        const isActive =
                          location.pathname === item.path ||
                          location.pathname.startsWith(`${item.path}/`)
                        const Icon = item.icon

                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                              isActive
                                ? 'bg-vinho-light text-white shadow-xs border-l-3 border-dourado pl-2.5'
                                : 'text-marfim/75 hover:text-white hover:bg-vinho-light/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Icon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isActive ? 'text-dourado' : 'text-dourado-light/70'
                                }`}
                              />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge && (
                              <Badge
                                className={`text-[8px] px-1 py-0 rounded ${
                                  isActive
                                    ? 'bg-dourado text-vinho font-bold'
                                    : 'bg-vinho-dark text-dourado-light border border-dourado/20'
                                }`}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </NavLink>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </nav>

        {/* Rodapé da Sidebar com Usuário Logado, Meu Perfil e Logout */}
        <div className="p-4 border-t border-vinho-light/40 bg-vinho-dark/60">
          <NavLink
            to="/perfil"
            className="flex items-center gap-3 mb-3 p-1.5 -mx-1.5 rounded-xl hover:bg-vinho-light/40 transition-colors group"
            title="Acessar Meu Perfil"
          >
            <div className="w-9 h-9 rounded-full bg-dourado/20 border border-dourado/60 flex items-center justify-center text-dourado font-bold text-xs uppercase overflow-hidden shrink-0">
              {user?.avatar ? (
                <img
                  src={getFileUrl(user, user.avatar)}
                  alt={user.name || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : user?.name ? (
                user.name.slice(0, 2)
              ) : (
                'CC'
              )}
            </div>
            <div className="overflow-hidden flex-1 text-left">
              <p className="text-xs font-bold text-white truncate group-hover:text-dourado transition-colors">
                {user?.name || 'Usuário'}
              </p>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-dourado shrink-0" />
                <span className="text-[10px] text-dourado-light truncate">{roleLabel}</span>
              </div>
            </div>
          </NavLink>

          {/* Links para Meu Perfil + Área de Membros + Site Público */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <NavLink
              to="/perfil"
              className="text-[11px] text-dourado-light hover:text-white flex items-center gap-1.5 transition-colors font-semibold py-1"
            >
              <User className="w-3.5 h-3.5 text-dourado" />
              Meu Perfil & Senha
            </NavLink>

            <NavLink
              to="/admin/guia-ajuda"
              className="text-[11px] text-dourado-light hover:text-white flex items-center gap-1.5 transition-colors font-medium py-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-dourado" />
              Guia de Ajuda
            </NavLink>

            <NavLink
              to="/membros"
              className="text-[11px] text-marfim/80 hover:text-white flex items-center gap-1.5 transition-colors font-medium py-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-dourado" />
              Acessar Área de Membros
            </NavLink>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-marfim/70 hover:text-dourado flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Site Público
              </a>

              <button
                onClick={handleLogout}
                className="text-[11px] text-red-300 hover:text-red-200 flex items-center gap-1 transition-colors font-medium p-1 rounded"
                title="Encerrar sessão"
              >
                <LogOut className="w-3 h-3" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* CABEÇALHO MOBILE ESTILO APP */}
      <header className="md:hidden bg-vinho text-white border-b-2 border-dourado px-4 py-2 flex items-center justify-between sticky top-0 z-40 shadow-md min-h-[56px]">
        <NavLink
          to="/admin"
          end
          className="flex items-center gap-2 group p-1 -ml-1 rounded-xl active:scale-95 transition-transform"
          title="Ir para a Visão Geral do Painel Administrativo"
          aria-label="Ir para a Visão Geral do Painel Administrativo"
        >
          <img
            src={officialLogo}
            alt="CoffeeCast 4.0 — Painel Administrativo"
            className="h-10 w-auto max-w-[150px] object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.35)] cursor-pointer"
          />
        </NavLink>

        <div className="flex items-center gap-2">
          <NavLink
            to="/admin/guia-ajuda"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-vinho-light text-dourado active:scale-95 transition-all"
            aria-label="Guia de Ajuda do Sistema"
            title="Guia de Ajuda & Primeiro Acesso"
          >
            <HelpCircle className="w-5 h-5 text-dourado" />
          </NavLink>

          <NavLink
            to="/admin/notificacoes"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-vinho-light text-marfim relative active:scale-95 transition-all"
            aria-label="Central de Notificações"
          >
            <Bell className="w-5 h-5 text-dourado" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-vinho" />
            )}
          </NavLink>

          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-vinho-light text-marfim hover:bg-vinho-light/80 active:scale-95 transition-all"
            aria-label="Menu administrativo"
          >
            {mobileSidebarOpen ? (
              <X className="w-5 h-5 text-dourado" />
            ) : (
              <Menu className="w-5 h-5 text-dourado" />
            )}
          </button>
        </div>
      </header>
      {/* DRAWER MOBILE DA SIDEBAR ESTILO APP */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
          <div className="w-72 max-w-[85vw] bg-vinho text-marfim h-full flex flex-col p-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-vinho-light/40">
              <NavLink
                to="/admin"
                end
                onClick={() => setMobileSidebarOpen(false)}
                className="group flex flex-col items-start p-1 rounded-xl active:scale-95 transition-transform"
                title="Ir para a Visão Geral do Painel Administrativo"
                aria-label="Ir para a Visão Geral do Painel Administrativo"
              >
                <img
                  src={officialLogo}
                  alt="CoffeeCast 4.0 — Painel Administrativo"
                  className="h-11 w-auto max-w-[160px] object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.35)] cursor-pointer"
                />
                <span className="text-[9px] uppercase tracking-wider text-dourado-light font-medium mt-1">
                  Painel Administrativo
                </span>
              </NavLink>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-marfim/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5 text-dourado" />
              </button>
            </div>

            {/* CAMPO DE PESQUISA DE TELAS NO MOBILE (ACIMA DO MENU) */}
            <div className="pt-3 pb-2 border-b border-vinho-light/25">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-dourado-light/70 pointer-events-none" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder="Pesquisar telas..."
                  className="w-full bg-vinho-dark/80 text-marfim placeholder:text-marfim/45 text-xs pl-8 pr-7 py-2 rounded-xl border border-dourado/30 focus:outline-none focus:border-dourado focus:ring-2 focus:ring-dourado/30 shadow-inner"
                  aria-label="Pesquisar telas do menu"
                />
                {menuSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuSearchQuery('')
                      mobileSearchInputRef.current?.focus()
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-vinho-light text-marfim/80 flex items-center justify-center"
                    title="Limpar pesquisa"
                    aria-label="Limpar pesquisa"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {isFiltering && (
                <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-dourado-light/80">
                  <span>
                    {totalFilteredCount} tela{totalFilteredCount === 1 ? '' : 's'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMenuSearchQuery('')}
                    className="hover:text-white underline"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>

            <nav className="flex-1 py-3 space-y-1 overflow-y-auto">
              {hasNoResults ? (
                <div className="py-6 px-2 text-center space-y-2">
                  <div className="w-9 h-9 rounded-full bg-vinho-dark/80 border border-dourado/30 flex items-center justify-center mx-auto text-dourado">
                    <Search className="w-4 h-4 text-dourado-light/70" />
                  </div>
                  <p className="text-xs font-semibold text-white">Nenhuma tela encontrada</p>
                  <p className="text-[11px] text-marfim/60 max-w-[180px] mx-auto leading-tight">
                    Nenhum resultado para "{menuSearchQuery}".
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMenuSearchQuery('')
                      mobileSearchInputRef.current?.focus()
                    }}
                    className="text-[11px] h-7 px-3 bg-vinho-light/40 border-dourado/40 text-dourado hover:bg-vinho-light hover:text-white mt-1"
                  >
                    Limpar busca
                  </Button>
                </div>
              ) : (
                <>
                  {filteredMainMenuItems.length > 0 && (
                    <>
                      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-marfim/60 mb-1">
                        {isFiltering ? 'Telas Encontradas' : 'Gestão Geral'}
                      </p>

                      {filteredMainMenuItems.map((item) => {
                        const isActive = item.exact
                          ? location.pathname === item.path
                          : location.pathname === item.path ||
                            location.pathname.startsWith(`${item.path}/`)
                        const Icon = item.icon

                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => {
                              setMobileSidebarOpen(false)
                              setMenuSearchQuery('')
                            }}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-all active:scale-[0.98] ${
                              isActive
                                ? 'bg-vinho-light text-white border-l-4 border-dourado shadow-sm font-bold'
                                : 'text-marfim/85 hover:bg-vinho-light/40'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 text-dourado shrink-0" />
                              <span>{item.label}</span>
                            </div>

                            {item.badgeCount !== undefined && item.badgeCount > 0 && (
                              <Badge className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                                {item.badgeCount}
                              </Badge>
                            )}
                          </NavLink>
                        )
                      })}
                    </>
                  )}

                  {/* Submenu Exclusivo Master / Gestão Avançada no Mobile */}
                  {showMasterSection && (
                    <div
                      className={`${filteredMainMenuItems.length > 0 ? 'pt-3 mt-3 border-t border-vinho-light/40' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => setMasterSubmenuOpen(!masterSubmenuOpen)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold min-h-[44px] transition-all ${
                          isMasterPathActive
                            ? 'bg-vinho-dark text-dourado border border-dourado/40 shadow-xs'
                            : 'text-dourado-light hover:bg-vinho-light/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Shield className="w-4 h-4 text-dourado" />
                          <span>{isMaster ? 'Exclusivo Master' : 'Gestão do Site & Loja'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge className="bg-dourado text-vinho font-bold text-[9px] px-1.5 py-0 rounded">
                            {isMaster ? 'Master' : 'ADM'}
                          </Badge>
                          <ChevronDown
                            className={`w-4 h-4 text-dourado transition-transform duration-200 ${
                              masterSubmenuOpen || isFiltering ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {(masterSubmenuOpen || isFiltering) && (
                        <div className="pl-3 pr-1 pt-1.5 space-y-1 border-l-2 border-dourado/30 ml-4 mt-1">
                          {filteredMasterMenuItems.map((item) => {
                            const isActive =
                              location.pathname === item.path ||
                              location.pathname.startsWith(`${item.path}/`)
                            const Icon = item.icon

                            return (
                              <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => {
                                  setMobileSidebarOpen(false)
                                  setMenuSearchQuery('')
                                }}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold min-h-[40px] transition-all ${
                                  isActive
                                    ? 'bg-vinho-light text-white border-l-3 border-dourado pl-2.5 font-bold'
                                    : 'text-marfim/80 hover:bg-vinho-light/40'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <Icon
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      isActive ? 'text-dourado' : 'text-dourado-light/70'
                                    }`}
                                  />
                                  <span className="truncate">{item.label}</span>
                                </div>
                                {item.badge && (
                                  <Badge
                                    className={`text-[8px] px-1.5 py-0 rounded ${
                                      isActive
                                        ? 'bg-dourado text-vinho font-bold'
                                        : 'bg-vinho-dark text-dourado-light border border-dourado/20'
                                    }`}
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                              </NavLink>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </nav>

            <div className="pt-4 border-t border-vinho-light/40 flex items-center justify-between">
              <NavLink
                to="/perfil"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-2 truncate max-w-[150px] p-1 rounded-lg hover:bg-white/5"
                title="Meu Perfil"
              >
                <div className="w-8 h-8 rounded-full bg-dourado/20 border border-dourado/60 flex items-center justify-center text-dourado font-bold text-xs uppercase overflow-hidden shrink-0">
                  {user?.avatar ? (
                    <img
                      src={getFileUrl(user, user.avatar)}
                      alt={user.name || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : user?.name ? (
                    user.name.slice(0, 2)
                  ) : (
                    'CC'
                  )}
                </div>
                <div className="flex flex-col truncate text-left">
                  <span className="text-xs font-bold text-white truncate">
                    {user?.name || 'Usuário'}
                  </span>
                  <span className="text-[10px] text-dourado-light truncate">Meu Perfil</span>
                </div>
              </NavLink>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="text-xs h-10 min-h-[44px] px-3.5 rounded-xl active:scale-95 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </Button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* ÁREA PRINCIPAL DO PAINEL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Desktop */}
        <header className="hidden md:flex bg-white border-b border-vinho/10 px-8 py-4 items-center justify-between sticky top-0 z-30 shadow-xs">
          <div>
            <h1 className="font-serif font-bold text-xl text-vinho">{getPageTitle()}</h1>
            <p className="text-xs text-vinho/60">
              Gerencie todas as facetas e conteúdos do CoffeeCast 4.0
            </p>
          </div>

          {/* SELETOR GLOBAL DE LOJA (VISÍVEL PARA MASTER E ADM AUTORIZADO) */}
          {(isMaster || isAdm) && stores.length > 0 && (
            <div className="flex items-center gap-2 bg-marfim/80 border border-vinho/15 px-3 py-1.5 rounded-2xl shadow-2xs">
              <Store className="w-4 h-4 text-dourado-dark shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-vinho/60 tracking-wider">
                  {isAdm && !isMaster ? 'Sua Loja' : 'Loja Ativa'}
                </span>
                <select
                  value={activeStoreId || ''}
                  onChange={(e) => setActiveStoreId(e.target.value || null)}
                  className="bg-transparent text-xs font-bold text-vinho focus:outline-none cursor-pointer max-w-[190px] truncate"
                  title="Selecione a loja para alternar o contexto de trabalho"
                  disabled={stores.length <= 1}
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id} className="text-vinho bg-white">
                      {s.name} ({s.status === 'active' ? 'Ativa' : 'Inativa'})
                    </option>
                  ))}
                </select>
              </div>
              {activeStore && hasScreenPermission('storefront') && (
                <NavLink
                  to="/admin/storefront"
                  className="text-[11px] text-dourado-dark hover:underline font-bold ml-1"
                  title="Abrir Storefront da loja ativa"
                >
                  Gerenciar
                </NavLink>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* BOTÃO GUIA DE AJUDA & PRIMEIRO ACESSO NO CABEÇALHO (PARA TODOS OS USUÁRIOS) */}
            <NavLink
              to="/admin/guia-ajuda"
              className="text-xs text-vinho hover:text-dourado-dark flex items-center gap-1.5 transition-all font-bold bg-[#D4AF37]/20 border border-[#D4AF37]/50 hover:bg-[#D4AF37]/30 hover:border-[#D4AF37] px-3.5 py-1.5 rounded-full shadow-2xs group"
              title="Guia de Ajuda & Primeiro Acesso: saiba onde clicar e para que serve cada aba e botão"
              aria-label="Abrir Guia de Ajuda do Sistema"
            >
              <HelpCircle className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
              <span className="text-vinho font-bold">Ajuda</span>
              <span className="hidden lg:inline text-[10px] text-vinho/70 font-normal">
                (Primeiro Acesso)
              </span>
            </NavLink>

            <NavLink
              to="/admin/notificacoes"
              className="text-xs text-vinho hover:text-dourado-dark flex items-center gap-1.5 transition-colors font-semibold bg-marfim border border-vinho/15 hover:border-dourado px-3 py-1.5 rounded-full relative"
              title="Central de Notificações"
            >
              <Bell className="w-3.5 h-3.5 text-dourado-dark" />
              <span>Notificações</span>
              {unreadNotificationsCount > 0 && (
                <Badge className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0 rounded-full h-4 min-w-[16px] flex items-center justify-center">
                  {unreadNotificationsCount}
                </Badge>
              )}
            </NavLink>

            <NavLink
              to="/membros"
              className="text-xs text-vinho hover:text-dourado-dark flex items-center gap-1.5 transition-colors font-semibold bg-dourado/15 border border-dourado/30 px-3 py-1.5 rounded-full"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-dourado-dark" />
              Área de Membros
            </NavLink>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-vinho/70 hover:text-dourado-dark flex items-center gap-1.5 transition-colors font-medium border border-vinho/15 px-3 py-1.5 rounded-full"
            >
              <ExternalLink className="w-3.5 h-3.5 text-dourado" />
              Ver Site
            </a>

            <div className="h-5 w-px bg-vinho/10" />

            <NavLink
              to="/perfil"
              className="flex items-center gap-2.5 p-1 -mr-1 rounded-full hover:bg-vinho/5 transition-all group"
              title="Acessar Meu Perfil"
            >
              <div className="w-8 h-8 rounded-full bg-vinho text-dourado font-bold flex items-center justify-center text-xs overflow-hidden border border-dourado/60">
                {user?.avatar ? (
                  <img
                    src={getFileUrl(user, user.avatar)}
                    alt={user.name || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : user?.name ? (
                  user.name[0]
                ) : (
                  'C'
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-vinho leading-none group-hover:text-dourado-dark transition-colors">
                  {user?.name}
                </p>
                <span className="text-[10px] text-dourado-dark font-semibold uppercase">
                  Meu Perfil
                </span>
              </div>
            </NavLink>
          </div>
        </header>

        {/* Conteúdo Dinâmico Renderizado pelas Rotas Admin */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden w-full max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
