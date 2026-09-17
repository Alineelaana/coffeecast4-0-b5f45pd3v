import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import pb from '@/lib/pocketbase/client'
import type { EpisodioRecord, MomentoRecord } from '@/types/database'
import { CoffeeCastLogo } from '@/components/CoffeeCastLogo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Crown,
  Play,
  Lock,
  LogOut,
  ExternalLink,
  Shield,
  ShieldCheck,
  Video,
  FileText,
  Calendar,
  Layers,
  Award,
  ArrowLeft,
  ChevronRight,
  Headphones,
  User,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDateBR, extractYouTubeId, getFileUrl } from '@/lib/formatters'

export default function MembersScreen() {
  const { user, role, logout, isMaster, isGerencial } = useAuth()
  const navigate = useNavigate()

  const [episodios, setEpisodios] = useState<EpisodioRecord[]>([])
  const [momentos, setMomentos] = useState<MomentoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [chatUnreadCount, setChatUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    const fetchChatUnread = async () => {
      try {
        const parts = await pb.collection('chat_participantes').getFullList({
          filter: `user = "${user.id}"`,
          fields: 'conversa,ultima_leitura',
        })
        let total = 0
        for (const p of parts as any[]) {
          let f = `conversa = "${p.conversa}" && remetente != "${user.id}"`
          if (p.ultima_leitura) f += ` && created > "${p.ultima_leitura}"`
          const res = await pb
            .collection('chat_mensagens')
            .getList(1, 1, { filter: f, fields: 'id' })
            .catch(() => ({ totalItems: 0 }))
          total += res.totalItems
        }
        setChatUnreadCount(total)
      } catch (e) {
        console.warn('Erro ao carregar badge do chat na área de membros:', e)
      }
    }
    fetchChatUnread()
    let unsub: (() => void) | undefined
    pb.collection('chat_mensagens')
      .subscribe('*', () => {
        fetchChatUnread()
      })
      .then((u) => {
        unsub = u
      })
      .catch(() => {})
    return () => {
      if (unsub) unsub()
    }
  }, [user?.id])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [epList, momList] = await Promise.all([
          pb.collection('episodios').getFullList<EpisodioRecord>({
            sort: '-numero',
          }),
          pb.collection('momentos').getFullList<MomentoRecord>({
            sort: 'ordem',
          }),
        ])
        setEpisodios(epList)
        setMomentos(momList)
      } catch (err) {
        console.error('Erro ao carregar dados de membros:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    logout()
    toast.info('Sessão encerrada com sucesso.')
    navigate('/')
  }

  const roleBadgeInfo = {
    master: {
      label: 'Categoria Master (Superadmin)',
      color: 'bg-dourado text-vinho border-dourado-dark',
      icon: ShieldCheck,
      description: 'Acesso irrestrito a todas as áreas, gravações e administração.',
    },
    gerencial: {
      label: 'Categoria Gerencial',
      color: 'bg-vinho text-dourado-light border-dourado/40',
      icon: Award,
      description:
        'Acesso total à Área de Membros e gestão operacional (Contatos, Financeiro, Agenda e Convites).',
    },
    ouro: {
      label: 'Categoria Ouro',
      color: 'bg-amber-400/20 text-amber-900 border-amber-400/50',
      icon: Crown,
      description: 'Acesso exclusivo de membro Ouro: conteúdos VIP, gravações e transmissões.',
    },
    prata: {
      label: 'Categoria Prata',
      color: 'bg-slate-200 text-slate-800 border-slate-300',
      icon: Sparkles,
      description: 'Acesso de membro Prata: gravações e acervo oficial CoffeeCast 4.0.',
    },
  }[role || 'prata'] || {
    label: 'Membro Oficial',
    color: 'bg-vinho/10 text-vinho border-vinho/20',
    icon: Sparkles,
    description: 'Acesso à área de membros.',
  }

  const RoleIcon = roleBadgeInfo.icon

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-vinho font-sans flex flex-col">
      {/* CABEÇALHO DA ÁREA DE MEMBROS */}
      <header className="bg-vinho text-white border-b-2 border-dourado shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
              <CoffeeCastLogo className="w-9 h-9" variant="gold" />
              <div>
                <span className="font-serif font-black text-lg text-white leading-none block">
                  CoffeeCast <span className="text-dourado">4.0</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-dourado-light font-medium">
                  Área de Membros VIP
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Se for Master ou Gerencial, tem botão rápido para o Painel Admin */}
            {(isMaster || isGerencial) && (
              <Link to="/admin">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-dourado/60 text-dourado-light hover:bg-vinho-light bg-transparent font-bold text-xs rounded-full px-3 shadow-sm hidden sm:inline-flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-dourado" />
                  Painel Admin
                </Button>
              </Link>
            )}

            {/* Botão do Chat Oficial visível no cabeçalho */}
            <Link to="/chat">
              <Button
                size="sm"
                className="bg-dourado hover:bg-dourado-dark text-vinho font-bold text-xs rounded-full px-3.5 shadow-sm inline-flex items-center gap-1.5 relative"
              >
                <MessageSquare className="w-3.5 h-3.5 text-vinho" />
                <span>Chat</span>
                {chatUnreadCount > 0 && (
                  <Badge className="bg-amber-500 text-white font-bold text-[9px] px-1.5 py-0 rounded-full h-4 min-w-[16px] flex items-center justify-center">
                    {chatUnreadCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Botão Meu Perfil visível no cabeçalho */}
            <Link to="/perfil">
              <Button
                size="sm"
                variant="outline"
                className="border-dourado/60 text-dourado-light hover:bg-vinho-light bg-transparent font-bold text-xs rounded-full px-3 hidden sm:inline-flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-dourado" />
                Meu Perfil
              </Button>
            </Link>

            <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-3">
              <Link
                to="/perfil"
                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
                title="Acessar meu perfil"
              >
                <div className="w-8 h-8 rounded-full bg-dourado/20 border border-dourado text-dourado font-bold flex items-center justify-center text-xs uppercase overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={getFileUrl(user, user.avatar)}
                      alt={user.name || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : user?.name ? (
                    user.name.slice(0, 2)
                  ) : (
                    'MB'
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white leading-tight">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-[10px] text-dourado-light uppercase tracking-wider font-semibold">
                    {role?.toUpperCase()}
                  </p>
                </div>
              </Link>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs border-white/20 text-marfim hover:bg-white/10 bg-transparent rounded-full px-3"
            >
              <LogOut className="w-3.5 h-3.5 mr-1 text-dourado" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* BANNER DE BOAS-VINDAS & CARTÃO DE PERFIL */}
      <section className="bg-gradient-to-r from-vinho-dark via-vinho to-[#36142d] text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-dourado/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-dourado/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-dourado/15 border border-dourado/40 px-3 py-1 rounded-full text-xs font-semibold text-dourado-light">
                <RoleIcon className="w-3.5 h-3.5 text-dourado" />
                <span>{roleBadgeInfo.label}</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-white">
                Bem-vindo(a), {user?.name || 'Membro CoffeeCast'}!
              </h1>
              <p className="text-sm text-marfim/85 max-w-2xl leading-relaxed">
                {roleBadgeInfo.description}
              </p>
            </div>

            {/* Cartão de Categoria / Status */}
            <div className="bg-white/5 border border-white/15 rounded-2xl p-5 backdrop-blur-md max-w-sm w-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-dourado font-bold">
                  Seu Acesso
                </span>
                <Badge
                  className={`text-xs px-2 py-0.5 rounded-full font-bold border ${roleBadgeInfo.color}`}
                >
                  {role?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-marfim/80">
                E-mail autenticado: <strong className="text-white">{user?.email}</strong>
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-dourado-light">
                <Link
                  to="/chat"
                  className="font-bold text-dourado hover:text-white inline-flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Abrir Chat CoffeeCast
                  {chatUnreadCount > 0 && (
                    <Badge className="bg-amber-400 text-vinho font-bold text-[9px] px-1.5 py-0 rounded-full ml-1">
                      {chatUnreadCount}
                    </Badge>
                  )}
                </Link>

                {isMaster || isGerencial ? (
                  <Link
                    to="/admin"
                    className="font-bold underline hover:text-white inline-flex items-center gap-1"
                  >
                    Painel <ChevronRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <Link
                    to="/perfil"
                    className="text-[11px] underline hover:text-white inline-flex items-center gap-1"
                  >
                    Perfil
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL: EPISÓDIOS, BASTIDORES & MATERIAIS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-12">
        {/* MODAL DE VÍDEO EMBED */}
        {selectedVideo && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-vinho-dark rounded-2xl overflow-hidden border-2 border-dourado max-w-4xl w-full shadow-2xl">
              <div className="p-3 bg-vinho flex items-center justify-between text-white border-b border-vinho-light">
                <span className="font-serif font-bold text-sm text-dourado flex items-center gap-2">
                  <Play className="w-4 h-4 fill-dourado" /> Reproduzindo Episódio
                </span>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded"
                >
                  Fechar ✕
                </button>
              </div>
              <div className="aspect-video w-full">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                  title="Vídeo do Episódio"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 1: EPISÓDIOS COMPLETOS & EXCLUSIVOS */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-vinho/10 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-dourado-dark uppercase tracking-wider">
                <Headphones className="w-4 h-4" />
                <span>Acervo Exclusivo</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-vinho">
                Episódios & Gravações do Podcast
              </h2>
            </div>
            <span className="text-xs font-medium text-vinho/70 bg-marfim border border-vinho/15 px-3 py-1 rounded-full self-start">
              {episodios.length} episódios liberados
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-vinho/60">
              Carregando conteúdos da comunidade...
            </div>
          ) : episodios.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-vinho/10 text-xs text-vinho/70">
              Nenhum episódio cadastrado no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {episodios.map((ep) => {
                const ytid = extractYouTubeId(ep.youtube_url)
                return (
                  <div
                    key={ep.id}
                    className="bg-white rounded-2xl border border-vinho/10 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
                  >
                    <div
                      className="relative aspect-video bg-vinho/10 cursor-pointer overflow-hidden"
                      onClick={() => ytid && setSelectedVideo(ytid)}
                    >
                      {ytid ? (
                        <img
                          src={`https://img.youtube.com/vi/${ytid}/hqdefault.jpg`}
                          alt={ep.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-vinho text-dourado font-serif">
                          CoffeeCast 4.0
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                        <div className="w-12 h-12 rounded-full bg-dourado text-vinho flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-vinho ml-0.5" />
                        </div>
                      </div>
                      <Badge className="absolute top-3 left-3 bg-vinho text-dourado font-bold text-xs border border-dourado/40 shadow-sm">
                        Episódio #{ep.numero}
                      </Badge>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-serif font-bold text-base text-vinho line-clamp-2 leading-snug">
                          {ep.titulo}
                        </h3>
                        <p className="text-[11px] text-vinho/60 mt-1">
                          Liberado para categorias Master, Gerencial, Ouro e Prata
                        </p>
                      </div>

                      <div className="pt-3 border-t border-vinho/10 flex items-center justify-between">
                        <button
                          onClick={() => ytid && setSelectedVideo(ytid)}
                          className="text-xs font-bold text-dourado-dark hover:underline inline-flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Assistir Agora
                        </button>

                        <a
                          href={ep.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-vinho/60 hover:text-vinho inline-flex items-center gap-1"
                        >
                          YouTube <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* SEÇÃO 2: NOSSOS MOMENTOS & BASTIDORES */}
        {momentos.length > 0 && (
          <section className="space-y-5">
            <div className="border-b border-vinho/10 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-dourado-dark uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>Galeria Exclusiva</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-vinho">
                Bastidores & Nossos Momentos
              </h2>
              <p className="text-xs text-vinho/70 mt-1">
                Registros especiais dos encontros, convidadas e cafés gravados no estúdio.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {momentos.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-vinho/10 overflow-hidden shadow-xs group"
                >
                  <div className="aspect-square bg-vinho/5 overflow-hidden">
                    <img
                      src={m.imagem}
                      alt={m.legenda || 'Momento CoffeeCast'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {m.legenda && (
                    <div className="p-2.5 text-[11px] text-vinho/80 line-clamp-2 bg-marfim/40">
                      {m.legenda}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO 3: COMUNICADOS E BENEFÍCIOS PARA MEMBROS */}
        <section className="bg-white rounded-2xl border border-vinho/10 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-dourado-dark uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Comunidade CoffeeCast 4.0</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-vinho">
                Novos módulos para as categorias Ouro e Prata
              </h3>
              <p className="text-xs sm:text-sm text-vinho/75 leading-relaxed">
                As permissões das categorias Ouro e Prata estão em constante expansão pela curadoria
                do podcast. Em breve você terá acesso a transcrições em PDF, envio de perguntas
                antecipadas para as convidadas e encontros de networking exclusivos.
              </p>
            </div>

            <Link to="/">
              <Button
                variant="outline"
                className="border-vinho/20 text-vinho hover:bg-vinho/5 text-xs rounded-full px-5"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Voltar à Página Inicial
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* RODAPÉ DA ÁREA DE MEMBROS */}
      <footer className="bg-vinho-dark text-marfim/70 text-xs py-6 border-t border-dourado/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© 2026 CoffeeCast 4.0 — Todos os direitos reservados. Área de Membros Oficial.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/politica/privacidade" className="hover:text-dourado">
              Privacidade
            </Link>
            <Link to="/politica/termos" className="hover:text-dourado">
              Termos de Uso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
