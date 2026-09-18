import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { resolveStoreFromEnvironment } from '@/lib/storeResolver'
import { StorefrontService } from '@/services/storefront'
import { getFileUrl, extractYouTubeId, parseInstagramHandle } from '@/lib/formatters'
import type {
  StoreRecord,
  StoreMemberRecord,
  StoreEpisodeRecord,
  StoreBannerRecord,
  StoreTestimonialRecord,
} from '@/types/database'
import {
  Store,
  Play,
  Users,
  MessageSquareQuote,
  Sparkles,
  Instagram,
  Mail,
  Send,
  Target,
  Compass,
  Award,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function StorefrontPage() {
  const { slug } = useParams<{ slug?: string }>()
  const [store, setStore] = useState<StoreRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<StoreMemberRecord[]>([])
  const [episodes, setEpisodes] = useState<StoreEpisodeRecord[]>([])
  const [banners, setBanners] = useState<StoreBannerRecord[]>([])
  const [testimonials, setTestimonials] = useState<StoreTestimonialRecord[]>([])

  // Modal de depoimento público para a loja
  const [showTestimonialModal, setShowTestimonialModal] = useState(false)
  const [tName, setTName] = useState('')
  const [tTipoConvidado, setTTipoConvidado] = useState<'convidado' | 'convidada'>('convidado')
  const [tRole, setTRole] = useState('')
  const [tInstagram, setTInstagram] = useState('')
  const [tMessage, setTMessage] = useState('')
  const [tPhoto, setTPhoto] = useState<File | null>(null)
  const [submittingT, setSubmittingT] = useState(false)

  // Modal de visualização de vídeo do episódio
  const [activeEpisodeVideo, setActiveEpisodeVideo] = useState<{
    id: string
    title: string
  } | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadStore() {
      setLoading(true)
      try {
        let currentStore: StoreRecord | null = null

        if (slug) {
          currentStore = await StorefrontService.getStoreBySlug(slug)
        } else {
          // Tentar resolução por domínio
          const res = await resolveStoreFromEnvironment(
            window.location.pathname,
            window.location.hostname,
          )
          currentStore = res.store
        }

        if (!isMounted) return
        setStore(currentStore)

        if (currentStore && currentStore.id) {
          const [mList, epList, bList, tList] = await Promise.all([
            StorefrontService.getMembers(currentStore.id),
            StorefrontService.getEpisodes(currentStore.id, true),
            StorefrontService.getBanners(currentStore.id, true),
            StorefrontService.getTestimonials(currentStore.id, true),
          ])

          if (!isMounted) return
          setMembers(mList)
          setEpisodes(epList)
          setBanners(bList)
          setTestimonials(tList)
        }
      } catch (err) {
        console.error('Erro ao carregar loja:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadStore()
    return () => {
      isMounted = false
    }
  }, [slug])

  // Aplica cores dinâmicas da loja
  const palette = useMemo(() => {
    return {
      primary: store?.color_primary || '#4A0E17',
      secondary: store?.color_secondary || '#D4AF37',
      background: store?.color_background || '#FAF8F5',
      surface: store?.color_surface || '#2D050B',
      accent: store?.color_accent || '#E5C158',
    }
  }, [store])

  // Toggles de seções da loja
  const toggles = useMemo(() => {
    const raw = store?.sections_toggles || {}
    return {
      integrantes: raw.integrantes !== false,
      episodios: raw.episodios !== false,
      depoimentos: raw.depoimentos !== false,
      banners_inline: raw.banners_inline !== false,
      missao: raw.missao !== false,
      manifesto: raw.manifesto !== false,
      contato: raw.contato !== false,
    }
  }, [store])

  // Banners separados por posição
  const heroBanners = useMemo(() => banners.filter((b) => b.position === 'hero'), [banners])
  const inlineBanners = useMemo(() => banners.filter((b) => b.position === 'inline'), [banners])

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store?.id) return
    if (!tName.trim() || !tMessage.trim()) {
      toast.error('Preencha ao menos seu nome e seu depoimento.')
      return
    }

    setSubmittingT(true)
    try {
      const formData = new FormData()
      formData.append('store', store.id)
      formData.append('name', tName.trim())
      formData.append('tipo_convidado', tTipoConvidado)
      formData.append('role', tRole.trim())
      formData.append('instagram', tInstagram.trim())
      formData.append('message', tMessage.trim())
      formData.append('approved', 'false') // Aguarda aprovação do administrador
      if (tPhoto) {
        formData.append('photo_url', tPhoto)
      }

      await StorefrontService.createTestimonial(formData)
      toast.success('Seu depoimento foi enviado com sucesso e será publicado após aprovação!')
      setShowTestimonialModal(false)
      setTName('')
      setTTipoConvidado('convidado')
      setTRole('')
      setTInstagram('')
      setTMessage('')
      setTPhoto(null)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar depoimento. Tente novamente.')
    } finally {
      setSubmittingT(false)
    }
  }

  // Se estiver carregando
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-serif font-bold text-[#4A0E17]">
          Carregando espaço da loja...
        </h2>
        <p className="text-xs text-[#4A0E17]/70 mt-1">
          Identificando paleta e conteúdos personalizados
        </p>
      </div>
    )
  }

  // Se loja não encontrada ou inativa
  if (!store || store.status === 'inactive') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-[#4A0E17]/10 flex items-center justify-center text-[#4A0E17] mb-5 border border-[#4A0E17]/20">
          <Store className="w-10 h-10 text-[#D4AF37]" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#4A0E17] mb-2">
          {store && store.status === 'inactive'
            ? 'Loja Temporariamente Indisponível'
            : 'Loja Não Encontrada'}
        </h1>
        <p className="text-sm text-[#4A0E17]/70 max-w-md mb-6 leading-relaxed">
          {store && store.status === 'inactive'
            ? 'Esta loja está atualmente em manutenção ou inativa. Volte em breve para conferir as novidades!'
            : 'O endereço ou slug informado não corresponde a nenhuma loja ativa no momento.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#4A0E17] text-white px-5 py-2.5 rounded-full font-bold text-xs hover:bg-[#2D050B] transition-colors shadow-sm"
        >
          Ir para a Página Principal
        </Link>
      </div>
    )
  }

  const logoSrc = store.logo_url ? getFileUrl(store, store.logo_url) : null
  const heroSrc = store.hero_url ? getFileUrl(store, store.hero_url) : null

  // WhatsApp link formatado
  const whatsappDigits = (store.whatsapp_contato || '').replace(/\D/g, '')
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits.startsWith('55') ? whatsappDigits : `55${whatsappDigits}`}`
    : ''

  const instagramHandle = parseInstagramHandle(store.instagram)

  return (
    <div
      className="min-h-screen font-sans flex flex-col selection:bg-amber-500 selection:text-white"
      style={{
        backgroundColor: palette.background,
        color: palette.surface,
      }}
    >
      {/* HEADER DA LOJA */}
      <header
        className="sticky top-0 z-40 border-b shadow-sm backdrop-blur-md transition-all"
        style={{
          backgroundColor: `${palette.surface}F2`,
          borderColor: `${palette.secondary}40`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to={`/loja/${store.slug}`} className="flex items-center gap-3 group">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={store.name}
                className="h-12 w-auto max-w-[180px] object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-serif font-black text-xl shadow-md border"
                style={{
                  backgroundColor: palette.secondary,
                  color: palette.surface,
                  borderColor: `${palette.secondary}80`,
                }}
              >
                {store.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg sm:text-xl text-white tracking-tight leading-tight">
                {store.name}
              </span>
              {store.tagline && (
                <span
                  className="text-[11px] font-medium tracking-wide line-clamp-1"
                  style={{ color: palette.accent }}
                >
                  {store.tagline}
                </span>
              )}
            </div>
          </Link>

          {/* Navegação Rápida */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-white/80">
            {toggles.episodios && episodes.length > 0 && (
              <a
                href="#episodios"
                className="hover:text-white transition-colors"
                style={{ ':hover': { color: palette.secondary } } as any}
              >
                Episódios
              </a>
            )}
            {toggles.integrantes && members.length > 0 && (
              <a href="#integrantes" className="hover:text-white transition-colors">
                Quem Somos
              </a>
            )}
            {toggles.depoimentos && testimonials.length > 0 && (
              <a href="#depoimentos" className="hover:text-white transition-colors">
                Depoimentos
              </a>
            )}
            {toggles.missao && (store.mission_text || store.vision_text || store.values_text) && (
              <a href="#proposito" className="hover:text-white transition-colors">
                Nosso Propósito
              </a>
            )}
            {toggles.contato && (
              <a href="#contato" className="hover:text-white transition-colors">
                Contato
              </a>
            )}
          </nav>

          {/* Ação WhatsApp / Contato */}
          <div className="flex items-center gap-2.5">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-full transition-all shadow-md active:scale-95"
                style={{
                  backgroundColor: palette.secondary,
                  color: palette.surface,
                }}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Falar Conosco</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section
        className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28"
        style={{
          background: `radial-gradient(ellipse at top, ${palette.primary} 0%, ${palette.surface} 100%)`,
          color: '#FAF8F5',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Tagline Words em Small Caps */}
              {store.hero_tagline_words ? (
                <div
                  className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] px-4 py-1.5 rounded-full border shadow-xs"
                  style={{
                    backgroundColor: `${palette.surface}80`,
                    borderColor: `${palette.secondary}60`,
                    color: palette.accent,
                  }}
                >
                  {store.hero_tagline_words}
                </div>
              ) : null}

              {/* Título Principal */}
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                {store.hero_title || store.name}
              </h1>

              {/* Subtítulo */}
              {store.hero_subtitle && (
                <p className="text-base sm:text-lg text-white/85 max-w-2xl leading-relaxed font-normal">
                  {store.hero_subtitle}
                </p>
              )}

              {/* Frase com estilo manuscrito / destaque */}
              {store.hero_phrase && (
                <div className="pt-2">
                  <p
                    className="italic text-lg sm:text-xl font-serif"
                    style={{ color: palette.accent }}
                  >
                    “{store.hero_phrase}”
                  </p>
                </div>
              )}

              {/* Botoes de Ação */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-4">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition-all shadow-lg active:scale-95"
                    style={{
                      backgroundColor: palette.secondary,
                      color: palette.surface,
                    }}
                  >
                    <Send className="w-4 h-4" />
                    Conversar via WhatsApp
                  </a>
                )}

                {toggles.episodios && episodes.length > 0 && (
                  <a
                    href="#episodios"
                    className="inline-flex items-center gap-2 font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition-all border border-white/20 hover:border-white/40 text-white bg-white/5 backdrop-blur-xs"
                  >
                    <Play className="w-4 h-4 text-amber-400" />
                    Ver Episódios ({episodes.length})
                  </a>
                )}
              </div>
            </div>

            {/* Imagem do Hero ou Banner Hero Principal */}
            <div className="lg:col-span-5 flex justify-center">
              <div
                className="relative rounded-3xl overflow-hidden p-2 border shadow-2xl max-w-md w-full"
                style={{
                  backgroundColor: `${palette.surface}90`,
                  borderColor: `${palette.secondary}50`,
                }}
              >
                {heroSrc ? (
                  <img
                    src={heroSrc}
                    alt={store.name}
                    className="w-full h-80 sm:h-96 object-cover rounded-2xl"
                  />
                ) : heroBanners.length > 0 ? (
                  <img
                    src={getFileUrl(heroBanners[0], heroBanners[0].image_url)}
                    alt={heroBanners[0].title}
                    className="w-full h-80 sm:h-96 object-cover rounded-2xl"
                  />
                ) : logoSrc ? (
                  <div className="w-full h-80 sm:h-96 flex flex-col items-center justify-center p-8 bg-black/20 rounded-2xl">
                    <img src={logoSrc} alt={store.name} className="max-h-44 object-contain mb-4" />
                    <span className="text-xs uppercase tracking-widest text-white/60 font-medium">
                      {store.name}
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-80 sm:h-96 flex flex-col items-center justify-center p-8 bg-black/20 rounded-2xl text-center">
                    <Sparkles className="w-12 h-12 mb-3" style={{ color: palette.secondary }} />
                    <h3 className="font-serif font-bold text-xl text-white">{store.name}</h3>
                    <p className="text-xs text-white/70 mt-1 max-w-xs">{store.tagline}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BANNERS INLINE (SE HOUVER) */}
      {toggles.banners_inline && inlineBanners.length > 0 && (
        <section className="py-8 bg-white/50 border-b border-black/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inlineBanners.map((banner) => (
                <div
                  key={banner.id}
                  className="group rounded-2xl overflow-hidden shadow-sm border transition-transform hover:-translate-y-1"
                  style={{ borderColor: `${palette.primary}20` }}
                >
                  <a
                    href={banner.link_url || '#'}
                    target={banner.link_url ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                  >
                    <img
                      src={getFileUrl(banner, banner.image_url)}
                      alt={banner.title}
                      className="w-full h-44 object-cover"
                    />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SEÇÃO EPISÓDIOS */}
      {toggles.episodios && episodes.length > 0 && (
        <section id="episodios" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: palette.secondary }}
              >
                Conteúdo & Podcast
              </div>
              <h2
                className="font-serif text-3xl sm:text-4xl font-black"
                style={{ color: palette.primary }}
              >
                Episódios & Gravações
              </h2>
            </div>
            {store.youtube_canal && (
              <a
                href={store.youtube_canal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full border transition-colors"
                style={{
                  borderColor: `${palette.primary}30`,
                  color: palette.primary,
                }}
              >
                <span>Canal no YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {episodes.map((ep) => {
              const ytId = extractYouTubeId(ep.youtube_url)
              const coverUrl = ep.cover_url
                ? getFileUrl(ep, ep.cover_url)
                : ytId
                  ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                  : null

              return (
                <div
                  key={ep.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border flex flex-col group"
                  style={{ borderColor: `${palette.primary}15` }}
                >
                  <div className="relative aspect-video bg-black/5 overflow-hidden">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={ep.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white">
                        <Play className="w-10 h-10 text-white/50" />
                      </div>
                    )}
                    <button
                      onClick={() => ytId && setActiveEpisodeVideo({ id: ytId, title: ep.title })}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs"
                      aria-label={`Assistir episódio ${ep.title}`}
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: palette.secondary }}
                      >
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </div>
                    </button>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        className="font-serif font-bold text-lg leading-snug line-clamp-2 mb-2 group-hover:text-amber-700 transition-colors"
                        style={{ color: palette.surface }}
                      >
                        {ep.title}
                      </h3>
                      {ep.description && (
                        <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed mb-4">
                          {ep.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                      {ep.publish_date && (
                        <span className="text-[11px] text-zinc-500 font-medium">
                          {new Date(ep.publish_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => ytId && setActiveEpisodeVideo({ id: ytId, title: ep.title })}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 p-0 h-auto"
                      >
                        Assistir Agora →
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* SEÇÃO INTEGRANTES (QUEM SOMOS) */}
      {toggles.integrantes && members.length > 0 && (
        <section
          id="integrantes"
          className="py-20 border-y"
          style={{
            backgroundColor: `${palette.surface}06`,
            borderColor: `${palette.primary}15`,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: palette.secondary }}
              >
                Nossa Equipe
              </div>
              <h2
                className="font-serif text-3xl sm:text-4xl font-black"
                style={{ color: palette.primary }}
              >
                Quem Faz Acontecer
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {members.map((member) => {
                const photoSrc = member.photo_url ? getFileUrl(member, member.photo_url) : null
                const mInsta = parseInstagramHandle(member.instagram)

                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border flex flex-col items-center text-center transition-all hover:shadow-lg"
                    style={{ borderColor: `${palette.primary}15` }}
                  >
                    <div
                      className="w-28 h-28 rounded-2xl overflow-hidden mb-5 border-2 shadow-md relative"
                      style={{ borderColor: palette.secondary }}
                    >
                      {photoSrc ? (
                        <img
                          src={photoSrc}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-bold text-2xl"
                          style={{
                            backgroundColor: `${palette.primary}10`,
                            color: palette.primary,
                          }}
                        >
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <h3
                      className="font-serif font-bold text-lg mb-1"
                      style={{ color: palette.surface }}
                    >
                      {member.name}
                    </h3>
                    {member.role && (
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-full mb-3"
                        style={{
                          backgroundColor: `${palette.secondary}20`,
                          color: palette.primary,
                        }}
                      >
                        {member.role}
                      </span>
                    )}
                    {member.bio && (
                      <p className="text-xs text-zinc-600 leading-relaxed mb-4 line-clamp-4">
                        {member.bio}
                      </p>
                    )}

                    {mInsta && (
                      <a
                        href={mInsta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-pink-600 transition-colors mt-auto font-medium"
                      >
                        <Instagram className="w-3.5 h-3.5 text-pink-600" />
                        <span>{mInsta.username}</span>
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* SEÇÃO PROPÓSITO: MISSÃO, VISÃO E VALORES */}
      {toggles.missao && (store.mission_text || store.vision_text || store.values_text) && (
        <section id="proposito" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div
              className="text-xs font-bold uppercase tracking-wider mb-1"
              style={{ color: palette.secondary }}
            >
              Nosso Propósito
            </div>
            <h2
              className="font-serif text-3xl sm:text-4xl font-black"
              style={{ color: palette.primary }}
            >
              Missão, Visão e Valores
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {store.mission_text && (
              <div
                className="bg-white rounded-3xl p-8 shadow-sm border space-y-4"
                style={{ borderColor: `${palette.primary}15` }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${palette.primary}10`, color: palette.primary }}
                >
                  <Target className="w-6 h-6" style={{ color: palette.secondary }} />
                </div>
                <h3 className="font-serif font-bold text-xl" style={{ color: palette.surface }}>
                  Missão
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  {store.mission_text}
                </p>
              </div>
            )}

            {store.vision_text && (
              <div
                className="bg-white rounded-3xl p-8 shadow-sm border space-y-4"
                style={{ borderColor: `${palette.primary}15` }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${palette.primary}10`, color: palette.primary }}
                >
                  <Compass className="w-6 h-6" style={{ color: palette.secondary }} />
                </div>
                <h3 className="font-serif font-bold text-xl" style={{ color: palette.surface }}>
                  Visão
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  {store.vision_text}
                </p>
              </div>
            )}

            {store.values_text && (
              <div
                className="bg-white rounded-3xl p-8 shadow-sm border space-y-4"
                style={{ borderColor: `${palette.primary}15` }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${palette.primary}10`, color: palette.primary }}
                >
                  <Award className="w-6 h-6" style={{ color: palette.secondary }} />
                </div>
                <h3 className="font-serif font-bold text-xl" style={{ color: palette.surface }}>
                  Valores
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  {store.values_text}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SEÇÃO MANIFESTO */}
      {toggles.manifesto && store.manifesto_text && (
        <section
          className="py-20 text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${palette.surface} 0%, ${palette.primary} 100%)`,
          }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: palette.accent }}
            >
              Nosso Manifesto
            </span>
            <div className="font-serif text-xl sm:text-2xl lg:text-3xl font-medium leading-relaxed italic text-white/95 whitespace-pre-line">
              “{store.manifesto_text}”
            </div>
          </div>
        </section>
      )}

      {/* SEÇÃO DEPOIMENTOS */}
      {toggles.depoimentos && (
        <section id="depoimentos" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: palette.secondary }}
              >
                Experiências
              </div>
              <h2
                className="font-serif text-3xl sm:text-4xl font-black"
                style={{ color: palette.primary }}
              >
                O Que Dizem Sobre Nós
              </h2>
            </div>
            <Button
              type="button"
              onClick={() => setShowTestimonialModal(true)}
              className="font-bold text-xs rounded-full px-5 py-2.5 shadow-sm"
              style={{
                backgroundColor: palette.secondary,
                color: palette.surface,
              }}
            >
              Deixar Depoimento
            </Button>
          </div>

          {testimonials.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-zinc-200 p-8">
              <MessageSquareQuote className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
              <p className="text-sm text-zinc-600 font-medium">
                Seja a primeira pessoa a deixar um depoimento para {store.name}!
              </p>
              <Button
                type="button"
                onClick={() => setShowTestimonialModal(true)}
                variant="outline"
                size="sm"
                className="mt-4 rounded-full text-xs font-bold"
              >
                Enviar Depoimento
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testim) => {
                const photoSrc = testim.photo_url ? getFileUrl(testim, testim.photo_url) : null
                const tInsta = parseInstagramHandle(testim.instagram)

                return (
                  <div
                    key={testim.id}
                    className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border flex flex-col justify-between"
                    style={{ borderColor: `${palette.primary}15` }}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-full overflow-hidden border shrink-0"
                          style={{ borderColor: palette.secondary }}
                        >
                          {photoSrc ? (
                            <img
                              src={photoSrc}
                              alt={testim.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center font-bold text-sm"
                              style={{
                                backgroundColor: `${palette.primary}10`,
                                color: palette.primary,
                              }}
                            >
                              {testim.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h4
                            className="font-serif font-bold text-sm truncate"
                            style={{ color: palette.surface }}
                          >
                            {testim.name}
                          </h4>
                          {testim.role && (
                            <p className="text-[11px] text-zinc-500 truncate">{testim.role}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-zinc-600 italic leading-relaxed">
                        “{testim.message}”
                      </p>
                    </div>

                    {tInsta && (
                      <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
                        <a
                          href={tInsta.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] text-pink-600 font-medium"
                        >
                          <Instagram className="w-3 h-3" />
                          <span>{tInsta.username}</span>
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* SEÇÃO CONTATO */}
      {toggles.contato && (
        <section
          id="contato"
          className="py-16 border-t"
          style={{
            backgroundColor: palette.surface,
            borderColor: `${palette.secondary}40`,
            color: '#FAF8F5',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Entre em Contato com {store.name}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
              Tire dúvidas, proponha parcerias ou agende uma participação no nosso podcast.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-bold text-xs px-5 py-2.5 rounded-full shadow-md transition-all active:scale-95"
                  style={{
                    backgroundColor: palette.secondary,
                    color: palette.surface,
                  }}
                >
                  <Send className="w-4 h-4" />
                  WhatsApp
                </a>
              )}

              {store.email_contato && (
                <a
                  href={`mailto:${store.email_contato}`}
                  className="inline-flex items-center gap-2 font-bold text-xs px-5 py-2.5 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {store.email_contato}
                </a>
              )}

              {instagramHandle && (
                <a
                  href={instagramHandle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-bold text-xs px-5 py-2.5 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors"
                >
                  <Instagram className="w-4 h-4 text-pink-400" />
                  {instagramHandle.username}
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER DA LOJA */}
      <footer
        className="py-8 border-t text-xs"
        style={{
          backgroundColor: '#1A0407',
          borderColor: `${palette.secondary}30`,
          color: 'rgba(255, 255, 255, 0.6)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            {logoSrc && (
              <img
                src={logoSrc}
                alt={store.name}
                className="h-7 w-auto object-contain opacity-80"
              />
            )}
            <p>
              © {new Date().getFullYear()} {store.company_name || store.name}. Todos os direitos
              reservados.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <span>Plataforma Storefront</span>
          </div>
        </div>
      </footer>

      {/* MODAL DE DEPOIMENTO PÚBLICO */}
      {showTestimonialModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-zinc-900 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowTestimonialModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-500"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-zinc-900">
                Deixar um Depoimento
              </h3>
              <p className="text-xs text-zinc-600 mt-1">
                Compartilhe sua experiência com {store.name}. Seu depoimento passará por moderação
                antes de ser publicado.
              </p>
            </div>

            <form onSubmit={handleTestimonialSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 block">
                  Identificação de Gênero *
                </Label>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setTTipoConvidado('convidado')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      tTipoConvidado === 'convidado'
                        ? 'border-zinc-800 bg-zinc-900 text-white shadow-xs'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    Convidado
                  </button>
                  <button
                    type="button"
                    onClick={() => setTTipoConvidado('convidada')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      tTipoConvidado === 'convidada'
                        ? 'border-zinc-800 bg-zinc-900 text-white shadow-xs'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    Convidada
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-zinc-700">
                  {tTipoConvidado === 'convidado' ? 'Nome do Convidado *' : 'Nome da Convidada *'}
                </Label>
                <Input
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  placeholder={
                    tTipoConvidado === 'convidado' ? 'Ex.: Mateus Silva' : 'Ex.: Carolina Mendes'
                  }
                  required
                  className="mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-zinc-700">Cargo / Profissão</Label>
                  <Input
                    value={tRole}
                    onChange={(e) => setTRole(e.target.value)}
                    placeholder="Ex.: Empreendedora"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-zinc-700">Instagram</Label>
                  <Input
                    value={tInstagram}
                    onChange={(e) => setTInstagram(e.target.value)}
                    placeholder="Ex.: @carol"
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-zinc-700">Sua Foto de Perfil</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTPhoto(e.target.files?.[0] || null)}
                  className="mt-1 text-xs file:text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-zinc-700">Seu Depoimento *</Label>
                <Textarea
                  value={tMessage}
                  onChange={(e) => setTMessage(e.target.value)}
                  placeholder="Conte como foi sua experiência..."
                  required
                  rows={4}
                  className="mt-1 text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTestimonialModal(false)}
                  className="text-xs rounded-full"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submittingT}
                  className="text-xs font-bold rounded-full"
                  style={{
                    backgroundColor: palette.secondary,
                    color: palette.surface,
                  }}
                >
                  {submittingT ? 'Enviando...' : 'Enviar Depoimento'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VÍDEO DO EPISÓDIO */}
      {activeEpisodeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative text-white border border-white/10">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <h4 className="font-serif font-bold text-sm text-white truncate max-w-lg">
                {activeEpisodeVideo.title}
              </h4>
              <button
                onClick={() => setActiveEpisodeVideo(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80"
                aria-label="Fechar vídeo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeEpisodeVideo.id}?autoplay=1`}
                title={activeEpisodeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
