import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MembersAreaModal } from '@/components/MembersAreaModal'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { getFileUrl, formatDateBR } from '@/lib/formatters'
import { getCapaIaUrl } from '@/services/openaiCapa'
import type { EpisodioRecord } from '@/types/database'
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Mic,
  Music2,
  Youtube,
  SearchX,
  Coffee,
  User,
} from 'lucide-react'

/**
 * Página individual de episódio — rota pública /episodio/:id
 * Todos os campos extras (descrição, convidados, biografia, data, foto) são opcionais:
 * episódios sem essas informações abrem normalmente, sem quebrar o layout.
 */
export default function EpisodioScreen() {
  const { id } = useParams<{ id: string }>()
  const [episodio, setEpisodio] = useState<EpisodioRecord | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [membersModalOpen, setMembersModalOpen] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      if (!id) {
        setNaoEncontrado(true)
        setCarregando(false)
        return
      }
      setCarregando(true)
      setNaoEncontrado(false)
      try {
        const ep = await pb.collection('episodios').getOne<EpisodioRecord>(id)
        if (cancelado) return
        // Só episódios publicados ficam visíveis publicamente
        if (ep.status && ep.status !== 'publicado') {
          setNaoEncontrado(true)
        } else {
          setEpisodio(ep)
        }
      } catch {
        if (!cancelado) setNaoEncontrado(true)
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [id])

  const spotifyUrl = episodio?.link_spotify?.trim() ? episodio.link_spotify.trim() : ''
  const youtubeUrl = episodio?.link_youtube?.trim() ? episodio.link_youtube.trim() : ''
  const capaUrl = episodio
    ? getCapaIaUrl(episodio) || getFileUrl(episodio, episodio.foto_convidados)
    : ''
  const dataExibicao = episodio ? formatDateBR(episodio.data_episodio || episodio.created) : ''
  const convidados = episodio?.convidados?.trim() || ''
  const biografia = episodio?.biografia_convidados?.trim() || ''
  const descricao = episodio?.descricao?.trim() || ''

  // SEO dinâmico: título da aba e metas Open Graph por episódio
  useEffect(() => {
    if (!episodio) return

    const convidadoSeo = convidados ? ` — com ${convidados}` : ''
    document.title = `#${episodio.numero} — ${episodio.titulo}${convidadoSeo} | CoffeeCast 4.0`

    const descricaoSeo =
      descricao ||
      `Episódio #${episodio.numero} do CoffeeCast 4.0: ${episodio.titulo}. Mais que conversas, histórias que transformam.`

    const imagemAbsoluta = capaUrl
      ? capaUrl.startsWith('http')
        ? capaUrl
        : `${window.location.origin}${capaUrl}`
      : `${window.location.origin}/og-image.png`

    const metas: Array<[string, string, string]> = [
      ['name', 'description', descricaoSeo],
      ['property', 'og:title', document.title],
      ['property', 'og:description', descricaoSeo],
      ['property', 'og:image', imagemAbsoluta],
    ]

    const criados: HTMLMetaElement[] = []
    metas.forEach(([attr, chave, conteudo]) => {
      let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${chave}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attr, chave)
        document.head.appendChild(tag)
        criados.push(tag)
      }
      tag.setAttribute('content', conteudo)
    })

    return () => {
      criados.forEach((tag) => tag.remove())
    }
  }, [episodio, convidados, descricao, capaUrl])

  return (
    <div className="min-h-screen bg-marfim text-vinho flex flex-col font-sans selection:bg-dourado/30">
      <Navbar onOpenMembersModal={() => setMembersModalOpen(true)} />

      <main className="flex-1 pt-32 sm:pt-24 md:pt-28 pb-16 sm:pb-24">
        {/* Estado de carregamento */}
        {carregando && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
            <div className="inline-flex items-center gap-3 text-vinho/70">
              <Coffee className="w-6 h-6 text-dourado animate-pulse" />
              <span className="text-sm font-medium">
                Preparando o café e carregando o episódio…
              </span>
            </div>
          </section>
        )}

        {/* Episódio não encontrado ou não publicado */}
        {!carregando && naoEncontrado && (
          <section className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <div className="rounded-3xl bg-white border-2 border-dourado/40 shadow-xl p-8 sm:p-12 space-y-5">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-vinho/10 border border-dourado/40 flex items-center justify-center">
                <SearchX className="w-8 h-8 text-dourado" />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-vinho">
                Episódio não encontrado
              </h1>
              <p className="text-sm sm:text-base text-vinho/70 leading-relaxed max-w-md mx-auto">
                O episódio que você procura não existe, foi movido ou ainda não foi publicado.
                Confira todos os episódios disponíveis na nossa página inicial.
              </p>
              <div className="pt-2">
                <Link to="/#episodios">
                  <Button className="min-h-[44px] px-6 bg-vinho hover:bg-vinho-dark text-white font-bold text-sm rounded-xl shadow-md inline-flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4 text-dourado" />
                    Voltar para os episódios
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Episódio carregado */}
        {!carregando && episodio && (
          <>
            {/* Hero vinho com brilho dourado */}
            <section className="relative px-4 sm:px-6 lg:px-8 py-10 sm:py-14 bg-gradient-to-b from-[#36142d] via-vinho to-[#36142d] text-marfim overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-dourado/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-brand/15 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-4xl mx-auto relative z-10 space-y-6">
                {/* Voltar */}
                <div>
                  <Link
                    to="/#episodios"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-marfim/80 hover:text-dourado transition-colors bg-white/10 hover:bg-white/15 px-3.5 py-2 min-h-[36px] rounded-full border border-dourado/30 backdrop-blur-xs shadow-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-dourado" />
                    Voltar para os episódios
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8 items-start">
                  {/* Capa do episódio (IA, foto dos convidados ou placeholder elegante) */}
                  <div className="md:col-span-2 w-full">
                    {capaUrl ? (
                      <img
                        src={capaUrl}
                        alt={`Capa do episódio #${episodio.numero} — ${episodio.titulo}`}
                        className="w-full aspect-square object-cover rounded-3xl border-2 border-dourado/50 shadow-2xl"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-3xl border-2 border-dourado/40 bg-gradient-to-br from-[#4b1e3f] via-[#2a0e24] to-[#38142e] shadow-2xl flex flex-col items-center justify-center gap-3 text-dourado/80">
                        <Coffee className="w-10 h-10 text-dourado" />
                        <span className="font-serif text-lg font-bold text-marfim/80 text-center px-4">
                          CoffeeCast 4.0
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Informações principais */}
                  <div className="md:col-span-3 space-y-4 sm:space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dourado/20 border border-dourado/40 text-dourado text-xs sm:text-sm font-bold tracking-wide shadow-xs">
                        <Sparkles className="w-4 h-4 text-dourado shrink-0" />
                        Episódio #{episodio.numero}
                      </span>
                      {dataExibicao && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-dourado/30 text-marfim/85 text-xs sm:text-sm font-medium">
                          <Calendar className="w-3.5 h-3.5 text-dourado shrink-0" />
                          {dataExibicao}
                        </span>
                      )}
                    </div>

                    <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight break-words">
                      {episodio.titulo}
                    </h1>

                    {descricao ? (
                      <p className="text-sm sm:text-base text-marfim/85 leading-relaxed font-light whitespace-pre-line break-words">
                        {descricao}
                      </p>
                    ) : (
                      <p className="text-sm sm:text-base text-marfim/60 leading-relaxed font-light italic">
                        "Mais que conversas, histórias que transformam."
                      </p>
                    )}

                    {/* Convidados do episódio (opcional) */}
                    {convidados && (
                      <div className="flex items-start gap-2.5 bg-white/5 border border-dourado/25 rounded-2xl p-3.5 backdrop-blur-xs">
                        <div className="w-9 h-9 rounded-xl bg-dourado/20 border border-dourado/40 flex items-center justify-center shrink-0 text-dourado">
                          <User className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-dourado block">
                            {/[,;]|\be\b|\be\b/i.test(convidados) ? 'Convidados' : 'Convidada(o)'}
                          </span>
                          <p className="text-xs sm:text-sm text-white font-medium leading-snug break-words">
                            {convidados}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Botões de plataformas — só quando o episódio tem o link */}
                    {(spotifyUrl || youtubeUrl) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {spotifyUrl && (
                          <a
                            href={spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-[#0b2e17] font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] no-underline cursor-pointer"
                          >
                            <Music2 className="w-4 h-4 shrink-0" />
                            <span>Ouvir no Spotify</span>
                          </a>
                        )}
                        {youtubeUrl && (
                          <a
                            href={youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#e60000] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] no-underline cursor-pointer"
                          >
                            <Youtube className="w-4 h-4 fill-white text-transparent shrink-0" />
                            <span>Assistir no YouTube</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Biografia dos convidados (opcional) */}
            {biografia && (
              <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 sm:mt-8 relative z-20">
                <div className="bg-white rounded-3xl border-2 border-dourado/50 shadow-xl p-6 sm:p-8 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vinho to-vinho-dark text-dourado flex items-center justify-center shadow-md shrink-0">
                      <Mic className="w-5 h-5 text-dourado" />
                    </div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-vinho">
                      Sobre os convidados
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-vinho/80 leading-relaxed whitespace-pre-line break-words">
                    {biografia}
                  </p>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />

      <MembersAreaModal open={membersModalOpen} onOpenChange={setMembersModalOpen} />
    </div>
  )
}
