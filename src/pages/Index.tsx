import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeaderBanner } from '@/components/HeaderBanner'
import { EpisodeModal } from '@/components/EpisodeModal'
import { EpisodeHighlight } from '@/components/EpisodeHighlight'
import { EpisodesCarousel } from '@/components/EpisodesCarousel'
import { MomentsCarousel } from '@/components/MomentsCarousel'
import { TestimonialsCarousel } from '@/components/TestimonialsCarousel'
import { ParticipationForm } from '@/components/ParticipationForm'
import { MembersAreaModal } from '@/components/MembersAreaModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getFileUrl, parseInstagramHandle } from '@/lib/formatters'
import type {
  EpisodioRecord,
  IntegranteRecord,
  DepoimentoRecord,
  MomentoRecord,
  ConteudoSiteRecord,
} from '@/types/database'
import {
  Heart,
  Compass,
  Eye,
  Award,
  Sparkles,
  Quote,
  MessageCircle,
  Instagram,
  ChevronDown,
  ChevronUp,
  Play,
  ExternalLink,
} from 'lucide-react'
import bannerComercialImg from '@/assets/chatgpt-image-15-de-set.de-2026-135749-7d01c.png'

function MemberBio({ biografia }: { biografia?: string }) {
  const [expanded, setExpanded] = useState(false)
  const [canClamp, setCanClamp] = useState(false)
  const textRef = React.useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = textRef.current
    if (!el) return

    const checkOverflow = () => {
      if (!expanded) {
        const isOverflowing = el.scrollHeight > el.clientHeight + 1
        setCanClamp(isOverflowing)
      }
    }

    // Usar requestAnimationFrame para garantir renderização das fontes e layout
    const rafId = requestAnimationFrame(checkOverflow)
    window.addEventListener('resize', checkOverflow)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', checkOverflow)
    }
  }, [biografia, expanded])

  if (!biografia) return null

  return (
    <div className="w-full flex flex-col items-center mt-2">
      <p
        ref={textRef}
        className={`text-xs text-vinho/75 leading-relaxed font-light text-center transition-all duration-300 ${
          expanded ? '' : 'line-clamp-4'
        }`}
      >
        {biografia}
      </p>
      {(canClamp || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="mt-2 inline-flex items-center gap-1 font-serif text-xs font-semibold text-vinho hover:text-dourado-dark transition-colors duration-200 cursor-pointer focus:outline-hidden focus-visible:ring-1 focus-visible:ring-dourado rounded-sm px-1 py-0.5 group/btn"
        >
          <span>{expanded ? 'Ler menos' : 'Ler mais'}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-dourado group-hover/btn:text-dourado-dark transition-transform" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-dourado group-hover/btn:text-dourado-dark transition-transform" />
          )}
        </button>
      )}
    </div>
  )
}

// Fotos padrão de alta qualidade para as integrantes caso ainda não tenham foto no PocketBase
const fallbackIntegrantesPhotos = [
  'https://img.usecurling.com/ppl/512?gender=female&seed=101',
  'https://img.usecurling.com/ppl/512?gender=female&seed=102',
  'https://img.usecurling.com/ppl/512?gender=female&seed=103',
  'https://img.usecurling.com/ppl/512?gender=female&seed=104',
]

const fallbackDepoimentosPhotos = [
  'https://img.usecurling.com/ppl/256?gender=female&seed=201',
  'https://img.usecurling.com/ppl/256?gender=female&seed=202',
  'https://img.usecurling.com/ppl/256?gender=female&seed=203',
  'https://img.usecurling.com/ppl/256?gender=female&seed=204',
]

export default function Index() {
  const [episodios, setEpisodios] = useState<EpisodioRecord[]>([])
  const [integrantes, setIntegrantes] = useState<IntegranteRecord[]>([])
  const [depoimentos, setDepoimentos] = useState<DepoimentoRecord[]>([])
  const [momentos, setMomentos] = useState<MomentoRecord[]>([])
  const [conteudo, setConteudo] = useState<Record<string, string>>({})

  const [selectedEpisode, setSelectedEpisode] = useState<EpisodioRecord | null>(null)
  const [episodeModalOpen, setEpisodeModalOpen] = useState(false)
  const [membersModalOpen, setMembersModalOpen] = useState(false)

  // Atualização dos episódios em tempo real (ou recarregamento)
  const fetchEpisodios = async () => {
    try {
      const epList = await pb
        .collection('episodios')
        .getFullList<EpisodioRecord>({ sort: 'numero' })
      setEpisodios(epList)
    } catch (err) {
      console.error('Erro ao recarregar episódios:', err)
    }
  }

  // Carregar dados dinâmicos do PocketBase
  useEffect(() => {
    async function fetchData() {
      try {
        const [epList, intList, depList, momList, contList] = await Promise.all([
          pb
            .collection('episodios')
            .getFullList<EpisodioRecord>({ sort: 'numero' })
            .catch(() => []),
          pb
            .collection('integrantes')
            .getFullList<IntegranteRecord>({ sort: 'ordem' })
            .catch(() => []),
          pb
            .collection('depoimentos')
            .getFullList<DepoimentoRecord>({ sort: 'ordem' })
            .catch(() => []),
          pb
            .collection('momentos')
            .getFullList<MomentoRecord>({ sort: 'ordem' })
            .catch(() => []),
          pb
            .collection('conteudo_site')
            .getFullList<ConteudoSiteRecord>()
            .catch(() => []),
        ])

        setEpisodios(epList)
        setIntegrantes(intList)
        setDepoimentos(depList)
        setMomentos(momList)

        const map: Record<string, string> = {}
        contList.forEach((item) => {
          map[item.chave] = item.valor
        })
        setConteudo(map)
      } catch (err) {
        console.error('Erro ao carregar dados do PocketBase:', err)
      }
    }

    fetchData()
  }, [])

  // Inscrição em tempo real para episódios e conteúdos do site
  useEffect(() => {
    let unsubEp: (() => void) | undefined
    let unsubCont: (() => void) | undefined

    pb.collection('episodios')
      .subscribe('*', () => {
        fetchEpisodios()
      })
      .then((unsub) => {
        unsubEp = unsub
      })
      .catch(() => {})

    pb.collection('conteudo_site')
      .subscribe<ConteudoSiteRecord>('*', (e) => {
        if (e.record && e.record.chave) {
          const chave = e.record.chave
          const valor = e.record.valor
          setConteudo((prev) => ({
            ...prev,
            [chave]: valor,
          }))
        }
      })
      .then((unsub) => {
        unsubCont = unsub
      })
      .catch(() => {})

    return () => {
      if (unsubEp) unsubEp()
      if (unsubCont) unsubCont()
    }
  }, [])

  // Episódio mais recente: maior número, e em empate mais recente por created
  const latestEpisode: EpisodioRecord | null = React.useMemo(() => {
    if (!episodios || episodios.length === 0) return null
    const sorted = [...episodios].sort((a, b) => {
      if (b.numero !== a.numero) {
        return b.numero - a.numero
      }
      return new Date(b.created).getTime() - new Date(a.created).getTime()
    })
    return sorted[0] || null
  }, [episodios])

  const handleWatchEpisode = (ep: EpisodioRecord) => {
    setSelectedEpisode(ep)
    setEpisodeModalOpen(true)
  }

  // Textos literais exigidos com fallback
  const missaoText =
    conteudo.missao ||
    'Criar um espaço de conversas autênticas, leves e inspiradoras, onde histórias, experiências e diferentes perspectivas possam gerar conexão, conhecimento, reflexão e transformação.'

  const visaoText =
    conteudo.visao ||
    'Tornar o CoffeeCast 4.0 uma marca de conteúdo reconhecida por dar voz a histórias que inspiram, aproximar pessoas e transformar boas conversas em experiências que permanecem.'

  const valoresText =
    conteudo.valores ||
    'Autenticidade, respeito, conexão, acolhimento, diversidade de ideias, inspiração, aprendizado, leveza, propósito e valorização das histórias e das pessoas.'

  const propositoText =
    conteudo.proposito ||
    'Criar conversas com significado, valorizar histórias humanas e transformar encontros em conteúdo que permanece. No CoffeeCast 4.0, cada voz encontra acolhimento para inspirar novas possibilidades.'

  const contatoComercialText =
    conteudo.contato_comercial || 'Aline Lana / WhatsApp: (31) 99129-7619'

  const formTituloText =
    conteudo.form_titulo ||
    'Preencha o formulário se você tem interesse em participar do nosso podcast.'

  const formSucessoText =
    conteudo.form_sucesso_msg ||
    'Obrigada pelo seu contato! Nossa equipe retornará o mais breve possível, porque aqui o café pode até esfriar, mas o papo nunca! ☕️'

  const rodapeCreditosText =
    conteudo.rodape_creditos ||
    'Site criado e gerenciado por SAF TECNOLOGIA E GESTAO LTDA — CNPJ 65.768.215/0001-00'

  const periodicidadeEpisodiosText =
    conteudo.periodicidade_episodios ||
    'Todo sábado às 10h sai um episódio novo no canal do YouTube!'

  const socialLinksData = {
    tiktok: conteudo.social_tiktok,
    facebook: conteudo.social_facebook,
    instagram: conteudo.social_instagram,
    linkedin: conteudo.social_linkedin,
  }

  return (
    <div className="min-h-screen bg-marfim text-vinho flex flex-col font-sans selection:bg-dourado/30">
      {/* Navbar com âncoras e controle da Área de Membros */}
      <Navbar onOpenMembersModal={() => setMembersModalOpen(true)} />

      {/* SEÇÃO 1: BANNER OFICIAL INTEGRAL E FLUIDO (SEM NADA ESCRITO POR CIMA) */}
      <HeaderBanner />

      {/* SEÇÃO 2: AS QUATRO INTEGRANTES DO COFFEECAST 4.0 */}
      <section
        id="integrantes"
        className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5] relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-vinho bg-vinho/10 px-3.5 py-1 rounded-full border border-vinho/20">
              Equipe Principal
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-vinho">
              Quem Faz o CoffeeCast 4.0
            </h2>
            <p className="text-xs sm:text-sm text-vinho/75">
              Conheça as quatro vozes e corações à frente desse projeto acolhedor e transformador.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {integrantes.map((member, index) => {
              const photoUrl = member.foto
                ? getFileUrl(member, member.foto)
                : fallbackIntegrantesPhotos[index % fallbackIntegrantesPhotos.length]
              const hasInterviewLink = Boolean(member.link_episodio && member.link_episodio.trim())

              const photoElement = (
                <div
                  className={`w-28 h-28 xs:w-32 xs:h-32 sm:w-40 sm:h-40 rounded-full p-1 bg-gradient-to-tr from-dourado/80 via-dourado/30 to-dourado/70 shadow-md ring-1 ring-dourado/40 transition-all duration-300 ${
                    hasInterviewLink
                      ? 'group-hover/photo:ring-2 group-hover/photo:ring-dourado group-hover/photo:shadow-lg group-hover/photo:from-dourado group-hover/photo:to-dourado-dark'
                      : ''
                  }`}
                >
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-vinho/5 border-2 border-white shadow-inner">
                    <img
                      src={photoUrl}
                      alt={member.nome}
                      className={`w-full h-full object-cover object-top transition-transform duration-500 ${
                        hasInterviewLink ? 'group-hover/photo:scale-108' : ''
                      }`}
                      loading="lazy"
                    />
                    {hasInterviewLink && (
                      <div className="absolute inset-0 bg-vinho/30 opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-vinho/90 text-dourado flex items-center justify-center shadow-md transform scale-90 group-hover/photo:scale-100 transition-transform duration-300">
                          <Play className="w-4 h-4 fill-dourado ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )

              return (
                <div
                  key={member.id || index}
                  className="bg-white rounded-2xl border border-vinho/10 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1"
                >
                  <div className="p-5 sm:p-6 flex-1 flex flex-col items-center text-center justify-between space-y-3 sm:space-y-4">
                    <div className="flex flex-col items-center w-full">
                      {/* Avatar circular elegante */}
                      <div className="relative mb-3 sm:mb-4 group-hover:scale-105 transition-transform duration-300">
                        {hasInterviewLink ? (
                          <a
                            href={member.link_episodio}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Assistir entrevista de ${member.nome} no YouTube`}
                            className="block group/photo cursor-pointer rounded-full focus:outline-hidden focus-visible:ring-2 focus-visible:ring-dourado"
                          >
                            {photoElement}
                          </a>
                        ) : (
                          photoElement
                        )}
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-bold text-vinho group-hover:text-dourado-dark transition-colors mt-1 sm:mt-2">
                        {member.nome}
                      </h3>
                      <MemberBio biografia={member.biografia} />

                      {(() => {
                        const insta = parseInstagramHandle(member.instagram)
                        if (!insta) return null
                        return (
                          <div className="mt-3 pt-2.5 border-t border-vinho/10 w-full flex justify-center">
                            <a
                              href={insta.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Perfil no Instagram: ${insta.username}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-vinho bg-marfim/80 border border-vinho/15 hover:border-dourado hover:text-dourado-dark hover:bg-white active:scale-95 shadow-2xs transition-all duration-200 no-underline group/insta min-h-[38px]"
                            >
                              <Instagram className="w-4 h-4 text-dourado group-hover/insta:text-dourado-dark transition-colors shrink-0" />
                              <span>{insta.username}</span>
                            </a>
                          </div>
                        )
                      })()}

                      {hasInterviewLink && (
                        <div className="mt-2.5 w-full flex justify-center">
                          <a
                            href={member.link_episodio}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Assistir entrevista de ${member.nome} no YouTube`}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold text-vinho bg-linear-to-r from-dourado/20 via-dourado/30 to-dourado/20 hover:from-dourado/35 hover:to-dourado/45 border border-dourado/50 hover:border-dourado text-vinho hover:text-vinho-dark active:scale-95 shadow-xs transition-all duration-200 no-underline min-h-[44px] group/interview"
                          >
                            <Play className="w-3.5 h-3.5 text-vinho fill-vinho/80 group-hover/interview:scale-110 transition-transform shrink-0" />
                            <span>Clique para conhecer mais sobre ela ✨</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: EPISÓDIOS & BOTÃO "CLIQUE AQUI PARA ASSISTIR" (CARROSSEL HORIZONTAL COMPACTO) */}
      <section
        id="episodios"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-vinho text-marfim relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-dourado/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-brand/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-dourado bg-dourado/20 px-3.5 py-1 rounded-full border border-dourado/40">
              Assista no YouTube
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Nossos Episódios
            </h2>
            <p className="text-xs sm:text-sm text-marfim/80">
              Assista na íntegra aos bate-papos gravados com carinho, reflexões e cafés especiais.
              Navegue lateralmente para escolher o seu episódio favorito.
            </p>
          </div>

          {/* ÁREA DE DESTAQUE DE EPISÓDIOS: Contador no ar + Periodicidade editável + Botão do último episódio */}
          <EpisodeHighlight
            totalCount={episodios.length}
            periodicidadeTexto={periodicidadeEpisodiosText}
            latestEpisode={latestEpisode}
            onWatchEpisode={handleWatchEpisode}
          />

          {/* Carrossel lateral compacto com botões de navegação e suporte a arraste */}
          <EpisodesCarousel episodios={episodios} onSelectEpisode={handleWatchEpisode} />
        </div>
      </section>

      {/* SEÇÃO 5: FEEDBACKS / DEPOIMENTOS DOS CONVIDADOS (CARROSSEL HORIZONTAL) */}
      <section
        id="depoimentos"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-vinho/10"
      >
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-dourado-dark bg-dourado/10 px-3.5 py-1 rounded-full border border-dourado/30">
              Vozes que Marcaram
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-vinho">
              Depoimentos & Experiências
            </h2>
            <p className="text-xs sm:text-sm text-vinho/75">
              O que dizem os convidados que já passaram pela nossa mesa ou como foi para nós
              entrevistá-los. Navegue lateralmente para ler as histórias.
            </p>
          </div>

          {/* Carrossel lateral de depoimentos */}
          <TestimonialsCarousel
            depoimentos={depoimentos}
            fallbackPhotos={fallbackDepoimentosPhotos}
          />
        </div>
      </section>

      {/* SEÇÃO 6: PROPÓSITO DO COFFEECAST 4.0 & FORMULÁRIO DE PARTICIPAÇÃO */}
      <section
        id="participar"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5] relative overflow-hidden"
      >
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Card com o Propósito do CoffeeCast 4.0 */}
          <div className="bg-vinho border-2 border-dourado/60 text-marfim rounded-3xl p-8 sm:p-12 shadow-xl text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-dourado/10 rounded-full blur-2xl pointer-events-none" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dourado/20 border border-dourado/40 text-dourado text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>O Nosso Propósito</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white max-w-2xl mx-auto leading-snug">
              O Porquê do CoffeeCast 4.0 Existir
            </h2>
            <p className="text-sm sm:text-base text-marfim/90 max-w-2xl mx-auto leading-relaxed font-light">
              {propositoText}
            </p>
          </div>

          {/* Formulário oficial para participação de novos convidados */}
          <ParticipationForm titulo={formTituloText} sucessoMsg={formSucessoText} />
        </div>
      </section>

      {/* SEÇÃO 7: ATENDIMENTO & PATROCÍNIOS / CONTATO COMERCIAL */}
      <section
        id="contato"
        className="w-full bg-[#1e0a1b] border-t border-vinho/10 relative overflow-hidden"
      >
        {/* Banner full-bleed (de borda a borda, sem limites de largura / 100% da viewport) */}
        <div className="w-full relative">
          <a
            href="https://api.whatsapp.com/send/?phone=5531991297619&text&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar com a nossa equipe no WhatsApp sobre patrocínio ou pauta comercial do CoffeeCast 4.0: Aline Lana (31) 99129-7619"
            className="block w-full focus:outline-hidden focus-visible:ring-2 focus-visible:ring-dourado focus-visible:ring-offset-2 focus-visible:ring-offset-vinho cursor-pointer"
          >
            <img
              src={bannerComercialImg}
              alt="CoffeeCast 4.0 - Atendimento & Patrocínios: Quer patrocinar ou sugerir uma pauta comercial? Fale com nossa equipe e descubra como a sua marca pode fazer parte de conversas que inspiram, conectam e geram resultados. Mais visibilidade, conexão com pessoas reais, posicionamento estratégico, associação a conteúdo de valor. Fale com a gente no WhatsApp."
              className="w-full h-auto block transition-opacity duration-300 hover:opacity-95"
              loading="eager"
            />
          </a>
        </div>

        {/* Botão de toque para mobile reforçando o link direto do WhatsApp (altura ≥ 50px) */}
        <div className="px-4 py-4 sm:hidden flex justify-center bg-[#1e0a1b]">
          <a
            href="https://api.whatsapp.com/send/?phone=5531991297619&text&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar no WhatsApp com o CoffeeCast 4.0"
            className="w-full min-h-[50px] px-6 py-3 gold-gradient hover:opacity-95 text-[#2A0F23] font-bold text-base rounded-full shadow-[0_4px_16px_rgba(212,175,55,0.35)] flex items-center justify-center gap-2 border border-[#FFF2B2] cursor-pointer no-underline active:scale-95 transition-all"
          >
            <MessageCircle className="w-5 h-5 text-[#2A0F23] shrink-0 fill-[#2A0F23]/20" />
            <span>Falar no WhatsApp</span>
            <ExternalLink className="w-4 h-4 text-[#2A0F23]/70 shrink-0 ml-0.5" />
          </a>
        </div>
      </section>

      {/* SEÇÃO 8: NOSSOS MOMENTOS (CARROSSEL AUTOMÁTICO A CADA 3 SEGUNDOS) */}
      <section
        id="momentos"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-vinho-dark text-marfim relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-dourado bg-dourado/20 px-3.5 py-1 rounded-full border border-dourado/40">
              Galeria de Histórias
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Nossos Momentos
            </h2>
            <p className="text-xs sm:text-sm text-marfim/80">
              Registros inesquecíveis das nossas gravações, bastidores e cumplicidade.
            </p>
          </div>

          {/* Carrossel avançando a cada 3 segundos */}
          <MomentsCarousel momentos={momentos} />
        </div>
      </section>

      {/* SEÇÃO 9: MISSÃO, VISÃO & VALORES (ÚLTIMA SEÇÃO DE CONTEÚDO, LOGO ACIMA DO RODAPÉ) */}
      <section id="missao" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-vinho/10">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-dourado-dark bg-dourado/10 px-3.5 py-1 rounded-full border border-dourado/30">
              Nossa Essência
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-vinho">
              Missão, Visão & Valores
            </h2>
            <p className="text-xs sm:text-sm text-vinho/70">
              O que nos move a cada gravação e guia cada palavra dita em nossa mesa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            {/* Missão */}
            <div className="bg-marfim border border-vinho/15 hover:border-dourado rounded-2xl p-5 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col space-y-3 sm:space-y-4 group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-vinho/10 text-vinho flex items-center justify-center group-hover:bg-vinho group-hover:text-dourado transition-colors">
                <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-vinho">Nossa Missão</h3>
              <p className="text-xs sm:text-sm text-vinho/80 leading-relaxed font-light">
                "{missaoText}"
              </p>
            </div>

            {/* Visão */}
            <div className="bg-marfim border border-vinho/15 hover:border-dourado rounded-2xl p-5 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col space-y-3 sm:space-y-4 group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-dourado/15 text-dourado-dark flex items-center justify-center group-hover:bg-dourado group-hover:text-vinho transition-colors">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-vinho">Nossa Visão</h3>
              <p className="text-xs sm:text-sm text-vinho/80 leading-relaxed font-light">
                "{visaoText}"
              </p>
            </div>

            {/* Valores */}
            <div className="bg-marfim border border-vinho/15 hover:border-dourado rounded-2xl p-5 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col space-y-3 sm:space-y-4 group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-rose-brand/30 text-vinho flex items-center justify-center group-hover:bg-vinho group-hover:text-dourado transition-colors">
                <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-vinho">Nossos Valores</h3>
              <p className="text-xs sm:text-sm text-vinho/80 leading-relaxed font-light">
                {valoresText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé com as Políticas, CNPJ e Direitos Reservados */}
      <Footer
        contatoComercial={contatoComercialText}
        rodapeCreditos={rodapeCreditosText}
        socialLinks={socialLinksData}
      />

      {/* Modais auxiliares */}
      <EpisodeModal
        open={episodeModalOpen}
        onOpenChange={setEpisodeModalOpen}
        episode={selectedEpisode}
      />
      <MembersAreaModal open={membersModalOpen} onOpenChange={setMembersModalOpen} />
    </div>
  )
}
