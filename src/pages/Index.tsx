import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeaderBanner } from '@/components/HeaderBanner'
import { EpisodeModal } from '@/components/EpisodeModal'
import { EpisodesCarousel } from '@/components/EpisodesCarousel'
import { MomentsCarousel } from '@/components/MomentsCarousel'
import { ParticipationForm } from '@/components/ParticipationForm'
import { MembersAreaModal } from '@/components/MembersAreaModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getFileUrl } from '@/lib/formatters'
import type {
  EpisodioRecord,
  IntegranteRecord,
  DepoimentoRecord,
  MomentoRecord,
  ConteudoSiteRecord,
} from '@/types/database'
import { Heart, Compass, Eye, Award, Sparkles, Quote, MessageCircle } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-marfim text-vinho flex flex-col font-sans selection:bg-dourado/30">
      {/* Navbar com âncoras e controle da Área de Membros */}
      <Navbar onOpenMembersModal={() => setMembersModalOpen(true)} />

      {/* SEÇÃO 1: BANNER OFICIAL INTEGRAL E FLUIDO (SEM NADA ESCRITO POR CIMA) */}
      <HeaderBanner />

      {/* SEÇÃO 2: AS QUATRO INTEGRANTES DO COFFEECAST 4.0 */}
      <section
        id="integrantes"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5] relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-vinho bg-vinho/10 px-3.5 py-1 rounded-full border border-vinho/20">
              Equipe Principal
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-vinho">
              Quem Faz o CoffeeCast 4.0
            </h2>
            <p className="text-xs sm:text-sm text-vinho/75">
              Conheça as quatro vozes e corações à frente desse projeto acolhedor e transformador.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrantes.map((member, index) => {
              const photoUrl = member.foto
                ? getFileUrl(member, member.foto)
                : fallbackIntegrantesPhotos[index % fallbackIntegrantesPhotos.length]

              return (
                <div
                  key={member.id || index}
                  className="bg-white rounded-2xl border border-vinho/10 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1"
                >
                  <div className="p-6 flex-1 flex flex-col items-center text-center justify-between space-y-4">
                    <div className="flex flex-col items-center w-full">
                      {/* Avatar circular elegante, menor e proporcional */}
                      <div className="relative mb-5 group-hover:scale-105 transition-transform duration-300">
                        <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full p-1 bg-gradient-to-tr from-dourado/80 via-dourado/30 to-dourado/70 shadow-md ring-1 ring-dourado/40">
                          <div className="w-full h-full rounded-full overflow-hidden bg-vinho/5 border-2 border-white shadow-inner">
                            <img
                              src={photoUrl}
                              alt={member.nome}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                        </div>

                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider text-dourado bg-vinho px-2.5 py-0.5 rounded-full border border-dourado/40 shadow-sm whitespace-nowrap">
                          Integrante #{member.ordem || index + 1}
                        </span>
                      </div>

                      <h3 className="font-serif text-xl font-bold text-vinho group-hover:text-dourado-dark transition-colors mt-2">
                        {member.nome}
                      </h3>
                      <p className="text-xs text-vinho/75 leading-relaxed mt-2.5 line-clamp-4 font-light">
                        {member.biografia}
                      </p>
                    </div>

                    <div className="w-full pt-3 border-t border-vinho/10 flex items-center justify-between text-[11px] text-vinho/60">
                      <span className="italic">CoffeeCast 4.0</span>
                      <Heart className="w-3.5 h-3.5 text-dourado fill-dourado/20" />
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

          {/* Carrossel lateral compacto com botões de navegação e suporte a arraste */}
          <EpisodesCarousel episodios={episodios} onSelectEpisode={handleWatchEpisode} />
        </div>
      </section>

      {/* SEÇÃO 5: FEEDBACKS / DEPOIMENTOS DOS CONVIDADOS */}
      <section
        id="depoimentos"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-vinho/10"
      >
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-dourado-dark bg-dourado/10 px-3.5 py-1 rounded-full border border-dourado/30">
              Vozes que Marcaram
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-vinho">
              Depoimentos & Experiências
            </h2>
            <p className="text-xs sm:text-sm text-vinho/75">
              O que dizem os convidados que já passaram pela nossa mesa ou como foi para nós
              entrevistá-los.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {depoimentos.map((dep, index) => {
              const photoUrl = dep.foto
                ? getFileUrl(dep, dep.foto)
                : fallbackDepoimentosPhotos[index % fallbackDepoimentosPhotos.length]

              return (
                <div
                  key={dep.id || index}
                  className={`rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all ${
                    dep.de_nossa_autoridade
                      ? 'bg-rose-brand/30 border-2 border-dourado'
                      : 'bg-marfim border border-vinho/15'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Quote className="w-8 h-8 text-dourado opacity-80" />
                      {dep.de_nossa_autoridade && (
                        <Badge className="bg-vinho text-dourado text-[10px] font-bold tracking-wide">
                          Visão da Equipe CoffeeCast
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-vinho/85 italic leading-relaxed">
                      "{dep.texto}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-vinho/10 flex items-center gap-3">
                    <img
                      src={photoUrl}
                      alt={dep.nome}
                      className="w-11 h-11 rounded-full object-cover border-2 border-dourado shadow-sm"
                    />
                    <div>
                      <h4 className="font-serif font-bold text-sm text-vinho">{dep.nome}</h4>
                      <span className="text-[11px] text-vinho/60 block">
                        {dep.de_nossa_autoridade ? 'Convidada Homenageada' : 'Convidada do Podcast'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 6: NOSSOS MOMENTOS (CARROSSEL AUTOMÁTICO A CADA 3 SEGUNDOS) */}
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

      {/* SEÇÃO 7: PROPÓSITO DO COFFEECAST 4.0 & FORMULÁRIO DE PARTICIPAÇÃO */}
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

      {/* SEÇÃO 8: CONTATO COMERCIAL DESTACADO */}
      <section
        id="contato"
        className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-vinho/10"
      >
        <div className="max-w-4xl mx-auto bg-marfim border border-vinho/15 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-dourado-dark">
              Atendimento & Patrocínios
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-vinho">
              Quer patrocinar ou sugerir uma pauta comercial?
            </h3>
            <p className="text-xs sm:text-sm text-vinho/75">
              Fale diretamente com nossa gestora de parcerias:{' '}
              <strong>{contatoComercialText}</strong>
            </p>
          </div>

          <a
            href="https://wa.me/5531991297619"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button className="bg-vinho hover:bg-vinho-light text-white font-semibold rounded-full px-6 py-2.5 text-xs sm:text-sm shadow-md flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-dourado" />
              Chamar no WhatsApp
            </Button>
          </a>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Missão */}
            <div className="bg-marfim border border-vinho/15 hover:border-dourado rounded-2xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-vinho/10 text-vinho flex items-center justify-center group-hover:bg-vinho group-hover:text-dourado transition-colors">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-vinho">Nossa Missão</h3>
              <p className="text-sm text-vinho/80 leading-relaxed font-light">"{missaoText}"</p>
            </div>

            {/* Visão */}
            <div className="bg-marfim border border-vinho/15 hover:border-dourado rounded-2xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-dourado/15 text-dourado-dark flex items-center justify-center group-hover:bg-dourado group-hover:text-vinho transition-colors">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-vinho">Nossa Visão</h3>
              <p className="text-sm text-vinho/80 leading-relaxed font-light">"{visaoText}"</p>
            </div>

            {/* Valores */}
            <div className="bg-marfim border border-vinho/15 hover:border-dourado rounded-2xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-rose-brand/30 text-vinho flex items-center justify-center group-hover:bg-vinho group-hover:text-dourado transition-colors">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-vinho">Nossos Valores</h3>
              <p className="text-sm text-vinho/80 leading-relaxed font-light">{valoresText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé com as Políticas, CNPJ e Direitos Reservados */}
      <Footer contatoComercial={contatoComercialText} rodapeCreditos={rodapeCreditosText} />

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
