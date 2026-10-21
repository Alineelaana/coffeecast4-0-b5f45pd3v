import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Printer,
  Sparkles,
  ShieldCheck,
  Store,
  Bot,
  DollarSign,
  CalendarDays,
  FileText,
  Clock,
  Users,
  Eye,
  CheckCircle2,
  Lock,
  MessageSquare,
  Award,
  Globe,
  Settings,
  Mail,
  Video,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Bookmark,
  Share2,
  Download,
  Building2,
  Zap,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import officialLogo from '@/assets/sem-nome-1350-x-1080-px-1-c4c50.png'
import bannerImg from '@/assets/whatsapp-image-2026-09-14-at-22.43.57-19091.jpeg'
import { useAuth } from '@/context/AuthContext'

export default function DocumentacaoScreen() {
  const { user, isMaster } = useAuth()
  const [activeSection, setActiveSection] = useState('intro')

  const handlePrint = () => {
    window.print()
  }

  const scrollTo = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C1820] font-sans antialiased selection:bg-[#D4AF37]/30 selection:text-[#4B1E3F]">
      {/* BARRA SUPERIOR DE AÇÕES (OCULTA NA IMPRESSÃO) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#4B1E3F]/10 px-4 sm:px-8 py-3.5 print:hidden shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="group flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 rounded-lg p-0.5"
              title="Ir para o site CoffeeCast 4.0"
            >
              <img
                src={officialLogo}
                alt="CoffeeCast 4.0"
                className="h-9 sm:h-10 w-auto object-contain drop-shadow-[0_2px_6px_rgba(212,175,55,0.25)] transition-transform duration-200 group-hover:scale-105"
              />
            </Link>
            <span className="text-[#4B1E3F]/30">/</span>
            <Link
              to="/admin"
              className="font-serif font-bold text-xs sm:text-sm text-[#4B1E3F] hover:text-[#D4AF37] transition-colors"
            >
              Painel Admin
            </Link>
            <span className="text-[#4B1E3F]/30 hidden sm:inline">/</span>
            <span className="text-xs font-semibold text-[#4B1E3F]/70 hidden sm:inline">
              Documentação Oficial
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-[#4B1E3F]/25 text-[#4B1E3F] hover:bg-[#4B1E3F]/5 font-semibold text-xs rounded-full px-4 min-h-[38px] flex items-center gap-2 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Imprimir / Salvar PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>

            {isMaster && (
              <Badge className="bg-[#D4AF37] text-[#4B1E3F] border border-[#D4AF37] font-bold text-[11px] px-2.5 py-1">
                Acesso Master
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* CONTAINER PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12">
        {/* ========================================================
            CAPA INSTITUCIONAL DO DOCUMENTO
            ======================================================== */}
        <section className="bg-gradient-to-br from-[#4B1E3F] via-[#3E1633] to-[#2B0E23] text-[#FAF8F5] rounded-3xl p-8 sm:p-14 border-2 border-[#D4AF37]/50 shadow-2xl relative overflow-hidden print:rounded-none print:shadow-none print:border-none print:p-8 print:bg-white print:text-[#2C1820] print:break-after-page">
          {/* Brilhos decorativos no fundo */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none print:hidden" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C88E9B]/10 rounded-full blur-2xl pointer-events-none print:hidden" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            {/* Banner oficial wide com a arte do CoffeeCast 4.0 */}
            <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-2xl bg-[#1b0816] print:border-[#4B1E3F]/30">
              <img
                src={bannerImg}
                alt="CoffeeCast 4.0 - Mais que conversas, histórias que transformam"
                className="w-full h-auto object-contain block"
              />
            </div>

            {/* Logo Oficial quadrada com wordmark em destaque luxuoso */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-[#D4AF37]/40 via-amber-300/30 to-[#D4AF37]/40 rounded-3xl blur-md transition-all group-hover:blur-lg print:hidden" />
                <div className="relative p-4 sm:p-5 bg-[#2B0E23]/90 print:bg-transparent rounded-2xl border-2 border-[#D4AF37]/60 shadow-2xl backdrop-blur-md print:border-[#4B1E3F]/30 print:shadow-none flex items-center justify-center">
                  <img
                    src={officialLogo}
                    alt="CoffeeCast 4.0 — Logo Oficial"
                    className="h-24 sm:h-32 md:h-36 w-auto max-w-[260px] sm:max-w-[320px] object-contain drop-shadow-[0_4px_16px_rgba(212,175,55,0.4)] transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] print:text-[#4B1E3F] text-xs font-bold uppercase tracking-widest shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              Documento Oficial de Apresentação & Vendas
            </div>

            <div className="space-y-3 max-w-3xl">
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-white print:text-[#4B1E3F] tracking-tight leading-tight">
                Documentação do Sistema
              </h1>
              <p className="font-serif italic text-lg sm:text-2xl text-[#D4AF37] print:text-[#853C73] font-light">
                “Mais que conversas, histórias que transformam”
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#FAF8F5]/85 print:text-[#2C1820]/80 max-w-2xl leading-relaxed font-light">
              Guia completo e autoexplicativo cobrindo o site público, a assistente virtual Nine com
              inteligência artificial, o painel administrativo integrado e o ecossistema Multi-Lojas
              (Storefronts) para monetização e escala.
            </p>

            <div className="pt-6 border-t border-white/15 print:border-[#4B1E3F]/20 w-full max-w-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#FAF8F5]/70 print:text-[#2C1820]/70 font-mono">
              <div>
                <strong>Versão do Produto:</strong> CoffeeCast 4.0 Pro
              </div>
              <div>
                <strong>Mantenedora:</strong> SAF TECNOLOGIA E GESTAO LTDA
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            SUMÁRIO EXECUTIVO (NAVEGAÇÃO RÁPIDA)
            ======================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#4B1E3F]/10 shadow-xs print:shadow-none print:border-none print:break-after-page">
          <div className="flex items-center gap-3 border-b border-[#4B1E3F]/10 pb-4 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[#4B1E3F]/10 text-[#4B1E3F] flex items-center justify-center font-bold">
              <Bookmark className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#4B1E3F]">
                Sumário Executivo do Documento
              </h2>
              <p className="text-xs text-[#4B1E3F]/70">
                Guia estruturado para apresentação comercial e treinamento de equipe
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => scrollTo('sec-intro')}
              className="text-left p-3.5 rounded-xl border border-[#4B1E3F]/10 hover:border-[#D4AF37] hover:bg-[#FAF8F5] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#4B1E3F] text-white flex items-center justify-center font-bold text-[11px]">
                  1
                </span>
                <span className="text-[#4B1E3F] group-hover:text-[#4B1E3F] font-bold">
                  Introdução & Proposta de Valor Comercial
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => scrollTo('sec-site')}
              className="text-left p-3.5 rounded-xl border border-[#4B1E3F]/10 hover:border-[#D4AF37] hover:bg-[#FAF8F5] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#4B1E3F] text-white flex items-center justify-center font-bold text-[11px]">
                  2
                </span>
                <span className="text-[#4B1E3F] group-hover:text-[#4B1E3F] font-bold">
                  O Site Público & Acolhimento de Visitantes
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => scrollTo('sec-admin')}
              className="text-left p-3.5 rounded-xl border border-[#4B1E3F]/10 hover:border-[#D4AF37] hover:bg-[#FAF8F5] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#4B1E3F] text-white flex items-center justify-center font-bold text-[11px]">
                  3
                </span>
                <span className="text-[#4B1E3F] group-hover:text-[#4B1E3F] font-bold">
                  Área Administrativa & Abas de Gestão
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => scrollTo('sec-master')}
              className="text-left p-3.5 rounded-xl border border-[#4B1E3F]/10 hover:border-[#D4AF37] hover:bg-[#FAF8F5] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#D4AF37] text-[#4B1E3F] flex items-center justify-center font-bold text-[11px]">
                  4
                </span>
                <span className="text-[#4B1E3F] group-hover:text-[#4B1E3F] font-bold">
                  Abas Exclusivas do Nível Master (Storefronts & Domínio)
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => scrollTo('sec-roles')}
              className="text-left p-3.5 rounded-xl border border-[#4B1E3F]/10 hover:border-[#D4AF37] hover:bg-[#FAF8F5] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#4B1E3F] text-white flex items-center justify-center font-bold text-[11px]">
                  5
                </span>
                <span className="text-[#4B1E3F] group-hover:text-[#4B1E3F] font-bold">
                  Níveis de Usuário & Permissões Granulares
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => scrollTo('sec-security')}
              className="text-left p-3.5 rounded-xl border border-[#4B1E3F]/10 hover:border-[#D4AF37] hover:bg-[#FAF8F5] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#4B1E3F] text-white flex items-center justify-center font-bold text-[11px]">
                  6
                </span>
                <span className="text-[#4B1E3F] group-hover:text-[#4B1E3F] font-bold">
                  Segurança, Auditoria & Proteção Antifraude
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => scrollTo('sec-sales')}
              className="text-left p-3.5 rounded-xl border border-[#4B1E3F]/10 hover:border-[#D4AF37] hover:bg-[#FAF8F5] transition-all flex items-center justify-between group md:col-span-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#4B1E3F] text-[#D4AF37] flex items-center justify-center font-bold text-[11px]">
                  7
                </span>
                <span className="text-[#4B1E3F] font-bold">
                  Encerramento & Pitch de Vendas da Plataforma
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 1: INTRODUÇÃO & PROPOSTA DE VALOR
            ======================================================== */}
        <section
          id="sec-intro"
          className="bg-white rounded-3xl p-6 sm:p-10 border border-[#4B1E3F]/10 shadow-sm space-y-6 print:shadow-none print:border-none print:break-before-page"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#4B1E3F] text-[#D4AF37] flex items-center justify-center font-serif font-black text-sm">
              01
            </span>
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#4B1E3F]">
                1. Introdução — O Que É a Plataforma CoffeeCast 4.0
              </h2>
              <p className="text-xs text-[#4B1E3F]/70">
                A tecnologia definitiva para monetizar ecossistemas de podcasts e marcas de conteúdo
              </p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-[#2C1820]/80 space-y-4 leading-relaxed">
            <p>
              O <strong>CoffeeCast 4.0</strong> nasceu como o ambiente oficial do aclamado podcast
              de entrevistas e desenvolvimento humano, mas evoluiu estruturalmente para se tornar
              uma <strong>solução completa de tecnologia (SaaS) comercializável</strong> para
              terceiros, criadores, produtoras audiovisuais e redes de franquias.
            </p>
            <p>
              Ao adquirir a plataforma, o cliente não recebe apenas um site institucional bonito:
              ele adquire uma <strong>operação de mídia digital de ponta a ponta</strong>. A
              plataforma permite criar e hospedar múltiplos podcasts ou projetos simultâneos
              (Storefront Multi-Lojas), cada um com seu próprio domínio ou subdiretório, paleta de
              cores, logomarcas, episódios e identidade visual 100% personalizada.
            </p>
          </div>

          {/* 4 Pilares de Diferenciação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#4B1E3F]/10 text-[#4B1E3F] flex items-center justify-center">
                <Store className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#4B1E3F]">Multi-Lojas Ilimitado</h4>
              <p className="text-xs text-[#4B1E3F]/70 leading-snug">
                Crie dezenas de lojas e podcasts na mesma instalação com identidade e conteúdos
                isolados.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#4B1E3F]/10 text-[#4B1E3F] flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#4B1E3F]">Nine — IA Nativa 24h</h4>
              <p className="text-xs text-[#4B1E3F]/70 leading-snug">
                Atendimento inteligente que tira dúvidas, coleta WhatsApp e cadastra novos membros
                no piloto automático.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#4B1E3F]/10 text-[#4B1E3F] flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#4B1E3F]">
                Gestão Financeira & Horas
              </h4>
              <p className="text-xs text-[#4B1E3F]/70 leading-snug">
                Rateio entre integrantes, controle de banco de horas do estúdio e saldo atualizado
                em tempo real.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#4B1E3F]/10 text-[#4B1E3F] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#4B1E3F]">
                Auditoria & Antifraude
              </h4>
              <p className="text-xs text-[#4B1E3F]/70 leading-snug">
                Histórico imutável de quem alterou o quê, quando e onde, com visualização do
                antes/depois.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 2: O SITE PÚBLICO
            ======================================================== */}
        <section
          id="sec-site"
          className="bg-white rounded-3xl p-6 sm:p-10 border border-[#4B1E3F]/10 shadow-sm space-y-6 print:shadow-none print:border-none print:break-before-page"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#4B1E3F] text-[#D4AF37] flex items-center justify-center font-serif font-black text-sm">
              02
            </span>
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#4B1E3F]">
                2. O Site Público — Páginas, Portais & Acolhimento
              </h2>
              <p className="text-xs text-[#4B1E3F]/70">
                Experiência de navegação premium focada em engajamento, credibilidade e conversão
              </p>
            </div>
          </div>

          <div className="space-y-5 text-xs sm:text-sm text-[#2C1820]/80 leading-relaxed">
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/60 space-y-3">
              <h3 className="font-serif font-bold text-base text-[#4B1E3F] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#D4AF37]" />
                Página Inicial (Home) — A Vitrine Oficial
              </h3>
              <p>
                Construída com tipografia serifada de alto padrão e contraste refinado, a Home é
                dividida em blocos estratégicos que conduzem o visitante por toda a jornada do
                podcast:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#4B1E3F]/85">
                <li>
                  <strong>Hero com Identidade da Marca:</strong> Apresentação impactante do
                  propósito, chamada para ouvir e assistir, e atalho rápido para o último episódio
                  lançado.
                </li>
                <li>
                  <strong>Episódios & Integração YouTube:</strong> Carrossel intuitivo com modal de
                  reprodução de vídeo, exibindo numeração oficial e títulos das gravações.
                </li>
                <li>
                  <strong>Equipe Principal (Integrantes):</strong> Cards elegantes com biografia,
                  foto oficial, @ do Instagram com link direto e vídeo de entrevista vinculado.
                </li>
                <li>
                  <strong>Depoimentos de Autoridade:</strong> Relatos reais de quem já sentou na
                  mesa do podcast e teve sua vida impactada, com foto e validação.
                </li>
                <li>
                  <strong>Formulário de Participação ("Quero Participar"):</strong> Canal aberto
                  para novos talentos, empresários e convidados enviarem suas propostas.
                </li>
                <li>
                  <strong>Nossos Momentos:</strong> Carrossel fotográfico rotativo automático a cada
                  3 segundos, retratando bastidores, risadas e aconchego.
                </li>
                <li>
                  <strong>Rodapé Institucional:</strong> Links sociais com formatação e normalização
                  inteligente, atalhos para termos legais e menção expressa à mantenedora{' '}
                  <code>SAF TECNOLOGIA E GESTAO LTDA</code>.
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-[#4B1E3F]/10 rounded-2xl p-4 bg-[#FAF8F5]/60 space-y-2">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                  Página de Depoimento (/depoimento)
                </h4>
                <p className="text-xs text-[#4B1E3F]/75">
                  Canal simples para convidados enviarem seu depoimento e foto pessoal. O conteúdo
                  não é publicado imediatamente: fica armazenado na moderação do painel para
                  aprovação prévia.
                </p>
              </div>

              <div className="border border-[#4B1E3F]/10 rounded-2xl p-4 bg-[#FAF8F5]/60 space-y-2">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D4AF37]" />
                  Portal do Convidado (/convidado)
                </h4>
                <p className="text-xs text-[#4B1E3F]/75">
                  Ambiente de acolhimento para o convidado da semana. Contém 3 cartões práticos:
                  enviar depoimento, preencher o formulário de roteiro prévio e botão direto de
                  WhatsApp com a produção.
                </p>
              </div>

              <div className="border border-[#4B1E3F]/10 rounded-2xl p-4 bg-[#FAF8F5]/60 space-y-2">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#D4AF37]" />
                  Formulário de Roteiro Inteligente (/roteiro)
                </h4>
                <p className="text-xs text-[#4B1E3F]/75">
                  Formulário detalhado onde o convidado informa biografia, empresa, temas que deseja
                  enfatizar e tópicos delicados a evitar. O resultado alimenta a IA Nine para
                  estruturar a pauta.
                </p>
              </div>

              <div className="border border-[#4B1E3F]/10 rounded-2xl p-4 bg-[#FAF8F5]/60 space-y-2">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#D4AF37]" />
                  Área de Membros & Recuperação de Senha
                </h4>
                <p className="text-xs text-[#4B1E3F]/75">
                  Autenticação segura via e-mail e senha. Permite que membros Prata e Ouro acessem
                  seu perfil e conversem no Chat Interno. Conta com recuperação de senha por e-mail
                  transacional.
                </p>
              </div>
            </div>

            {/* Destaque da Nine */}
            <div className="bg-gradient-to-r from-[#4B1E3F] to-[#2B0E23] text-white p-6 rounded-2xl border-2 border-[#D4AF37]/50 shadow-md flex flex-col md:flex-row items-center justify-between gap-5 print:bg-[#FAF8F5] print:text-[#4B1E3F] print:border-[#4B1E3F]/20">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#D4AF37]/25 text-[#D4AF37] font-bold text-xs uppercase tracking-wider">
                  <Bot className="w-3.5 h-3.5" />
                  Destaque Tecnológico Exclusivo
                </div>
                <h3 className="font-serif text-xl font-bold text-white print:text-[#4B1E3F]">
                  Nine — A Assistente Virtual Flutuante com IA
                </h3>
                <p className="text-xs text-white/80 print:text-[#4B1E3F]/80 max-w-xl leading-relaxed">
                  Disponível 24 horas por dia no canto inferior direito do site, a Nine atende
                  visitantes de forma acolhedora, tira dúvidas sobre o projeto e os episódios,
                  coleta dados de contato e{' '}
                  <strong>cadastra automaticamente o usuário como membro Prata</strong>, enviando o
                  lead direto para a equipe de vendas.
                </p>
              </div>
              <div className="shrink-0 text-center">
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] mx-auto flex items-center justify-center text-2xl shadow-inner">
                  ✨
                </div>
                <span className="text-[11px] font-mono text-[#D4AF37] mt-1 block">
                  Atendimento 24/7
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 3: ÁREA ADMINISTRATIVA (TODAS AS ABAS)
            ======================================================== */}
        <section
          id="sec-admin"
          className="bg-white rounded-3xl p-6 sm:p-10 border border-[#4B1E3F]/10 shadow-sm space-y-8 print:shadow-none print:border-none print:break-before-page"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#4B1E3F] text-[#D4AF37] flex items-center justify-center font-serif font-black text-sm">
              03
            </span>
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#4B1E3F]">
                3. Área Administrativa — O Coração da Operação
              </h2>
              <p className="text-xs text-[#4B1E3F]/70">
                Detalhamento exato de cada aba e tela do painel de controle
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Visão Geral */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Visão Geral (Dashboard)
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Painel gerencial exibindo métricas de episódios no ar, novos contatos pendentes,
                despesas a quitar, gravações agendadas e saldo de horas do estúdio. Conta com
                gráfico de custos por categoria e atalhos rápidos.
              </p>
            </div>

            {/* Notificações */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Central de Notificações
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin/notificacoes
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Reúne em um só lugar novos roteiros enviados, depoimentos para aprovação e contatos
                do site. Permite filtrar por tipo e status, além de marcar todos como lidos em um
                único clique.
              </p>
            </div>

            {/* Nine Assistente Virtual */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Nine Assistente Virtual
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin/nine
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Controle integral da inteligência artificial: ajuste do prompt de personalidade,
                Base de Conhecimento (perguntas frequentes, dados da empresa), Prompt Livre com
                diretrizes personalizadas e histórico de chats com <em>Modo Humano</em> para assumir
                a conversa ao vivo.
              </p>
            </div>

            {/* Financeiro */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Financeiro & Divisão de Valores
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin/financeiro
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Gestão completa de receitas e despesas por categoria, sincronização automática com
                compras de horas, relatórios de fluxo de caixa e ferramenta exclusiva para{' '}
                <strong>divisão e rateio de receitas entre as apresentadoras</strong>.
              </p>
            </div>

            {/* Controle de Horas */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Controle de Horas (Estúdio)
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin/horas
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Gestão dos pacotes de horas contratadas no estúdio parceiro. Card destacado em
                dourado informando saldo restante, alerta de saldo baixo/negativo e barra de
                progresso do consumo real pelas gravações.
              </p>
            </div>

            {/* Agenda */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Agenda & Planejamento
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin/agenda
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Cronograma com visão em Calendário Visual Interativo ou Lista Completa (filtros por
                gravações passadas, futuras ou período). Registra convidados, patrocinadores, horas
                gastas no estúdio e anexo de fotos.
              </p>
            </div>

            {/* Roteiros e Apresentações */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Roteiros e Apresentações
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin/roteiros
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Visualização das respostas dos convidados. Integração com a IA Nine para{' '}
                <strong>gerar sugestões automáticas de roteiro com perguntas chave</strong>, além de
                campo para salvar o texto aprovado e o arquivo final.
              </p>
            </div>

            {/* Convites Premium */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Gerador de Convites Premium
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin/convites
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Criação de convites oficiais luxuosos com foto do homenageado, data, hora, logotipo
                da empresa e texto de apresentação. Exportação instantânea em imagem{' '}
                <strong>JPEG em alta resolução</strong> ou documento <strong>PDF</strong>.
              </p>
            </div>

            {/* Contatos e Leads */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Contatos e Leads Comerciais
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin/contatos
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                CRM de propostas recebidas pelo site e identificadas pela Nine no chat. Distinção
                visual dos leads da Nine, atalho de clique único para abrir WhatsApp, anotações de
                negociação e status de contato.
              </p>
            </div>

            {/* Episódios */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Gestão de Episódios
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin/episodios
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Cadastro, numeração e atualização dos episódios exibidos no carrossel da Home.
                Suporte direto a links de vídeos tradicionais e Shorts do YouTube.
              </p>
            </div>

            {/* Nossos Momentos */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Nossos Momentos (Carrossel)
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin/momentos
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Galeria de fotos com legendas e ordenação personalizada. Os registros são exibidos
                no carrossel dinâmico da Home, com botões para subir ou descer a posição de cada
                imagem.
              </p>
            </div>

            {/* Depoimentos */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Depoimentos & Moderação
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin/depoimentos
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Separação entre depoimentos publicados e recebidos do site. Moderação com aprovação
                em 1 clique, opção de manter oculto e ferramenta de{' '}
                <strong>download da foto original do convidado</strong> em alta definição.
              </p>
            </div>

            {/* Chat Interno */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Chat Interno em Tempo Real
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin/chat
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Mensageria corporativa segura via WebSocket: conversas privadas 1 a 1, canal Geral
                aberto a todos os membros e criação de Grupos com foto. Envio de figurinhas
                temáticas do CoffeeCast, reações com emojis e indicador de status (Online/Offline/Em
                pausa).
              </p>
            </div>

            {/* Auditoria do Sistema */}
            <div className="border border-[#4B1E3F]/10 rounded-2xl p-5 bg-[#FAF8F5]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Auditoria do Sistema & Segurança
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  /admin/auditoria
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Trilha imutável de logs de todas as ações de usuários, comparador visual de
                alterações (antes/depois), monitoramento de comportamento suspeito, central de
                regras de alerta e exportação completa para planilha CSV.
              </p>
            </div>

            {/* Guia de Ajuda & Primeiro Acesso */}
            <div className="border-2 border-[#D4AF37]/50 rounded-2xl p-5 bg-[#D4AF37]/5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
                  Guia de Ajuda & Primeiro Acesso
                </h4>
                <Badge className="bg-[#D4AF37] text-[#4B1E3F] font-bold text-[10px]">
                  /guia-ajuda
                </Badge>
              </div>
              <p className="text-[#4B1E3F]/80 leading-relaxed">
                Manual interativo e autoexplicativo voltado a novos e recorrentes usuários. Explica
                onde clicar e para que serve cada aba do menu lateral e cada botão das principais
                telas, com filtros por perfil (Master, ADM, Gerencial, Ouro e Prata), botão
                "Imprimir / Salvar PDF" e atalho permanente no cabeçalho superior do sistema.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 4: ABAS EXCLUSIVAS DO MASTER
            ======================================================== */}
        <section
          id="sec-master"
          className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-[#D4AF37]/50 shadow-md space-y-8 print:shadow-none print:border-none print:break-before-page"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap border-b border-[#4B1E3F]/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#4B1E3F] flex items-center justify-center font-serif font-black text-sm">
                04
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#4B1E3F]">
                    4. Abas Exclusivas do Nível Master
                  </h2>
                  <Badge className="bg-[#D4AF37] text-[#4B1E3F] font-bold text-[10px]">
                    Submenu Soberano
                  </Badge>
                </div>
                <p className="text-xs text-[#4B1E3F]/70">
                  Ferramentas estratégicas para revenda, governança e gestão multi-tenancy
                </p>
              </div>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-[#2C1820]/80">
            <p>
              O submenu <strong>"Exclusivo Master"</strong> é acessível estritamente pelo
              Superadministrador da plataforma. Ele confere soberania total para gerenciar lojas,
              cadastrar domínios personalizados, definir permissões e auditar todas as comunicações.
            </p>
          </div>

          <div className="space-y-4">
            {/* Storefront */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#D4AF37]" />
                  Storefront — Plataforma Multi-Lojas Ilimitada (/admin/storefront)
                </h4>
                <Badge className="bg-[#4B1E3F] text-[#D4AF37] text-[10px]">Super Recurso</Badge>
              </div>
              <p className="text-xs text-[#4B1E3F]/80 leading-relaxed">
                Permite criar e gerenciar múltiplos podcasts ou lojas parceiras no mesmo sistema.
                Cada loja possui paleta de cores própria (5 tons customizados), logotipo, favicon,
                banners e dados isolados. O Master pode alternar entre lojas usando o{' '}
                <strong>Seletor Global de Loja</strong> no topo do painel. Cada loja fica disponível
                publicamente no caminho <code>/loja/slug-da-loja</code> ou apontada para um domínio
                próprio.
              </p>
            </div>

            {/* Domínio */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/15 space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#D4AF37]" />
                Área do Domínio (/admin/dominio)
              </h4>
              <p className="text-xs text-[#4B1E3F]/80 leading-relaxed">
                Interface com instruções detalhadas de apontamento DNS para colocar o site no
                domínio corporativo do cliente (ex.: Registro.br, GoDaddy, Hostinger ou Cloudflare).
                Inclui tabelas de registros CNAME e A, verificação de propagação e status em tempo
                real.
              </p>
            </div>

            {/* Usuários e Permissões */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/15 space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D4AF37]" />
                Usuários & Permissões Granulares (/admin/usuarios)
              </h4>
              <p className="text-xs text-[#4B1E3F]/80 leading-relaxed">
                Gestão central de todos os operadores da plataforma. Exibe em tempo real o{' '}
                <strong>dia e horário do último acesso (login) de cada usuário</strong> tanto em
                computador quanto em dispositivos móveis no padrão brasileiro "DD/MM/AAAA às HH:mm"
                (ou "Nunca acessou"). Permite ao Master configurar{' '}
                <strong>permissões granulares para cada ADM</strong>, decidindo tela por tela o que
                ele pode visualizar ou operar, além de restringir seu acesso a lojas específicas do
                Storefront. Inclui <strong>tempo de inatividade individual configurável</strong>{' '}
                (logout automático após X minutos sem interação, padrão de 10 min) e a opção{' '}
                <strong>"Criar nova senha no próximo login"</strong> com tela dedicada de
                redefinição e ícone de olho para visualização.
              </p>
            </div>

            {/* Editar Conteúdos */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/15 space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#D4AF37]" />
                Editar Site & Redes Sociais (/admin/conteudo)
              </h4>
              <p className="text-xs text-[#4B1E3F]/80 leading-relaxed">
                Personalização dos textos institucionais da Home (Missão, Visão, Valores, Propósito
                e Contato Comercial), aviso de frequência de episódios e normalização automática dos
                links de redes sociais do rodapé (Instagram, TikTok, Facebook e LinkedIn).
              </p>
            </div>

            {/* Integrantes */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/15 space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#D4AF37]" />
                Equipe Principal (Integrantes) (/admin/integrantes)
              </h4>
              <p className="text-xs text-[#4B1E3F]/80 leading-relaxed">
                Cadastro e ordenação das quatro vozes principais do podcast, com biografias
                oficiais, links clicáveis de redes sociais e atalho para o vídeo de entrevista
                vinculada.
              </p>
            </div>

            {/* Políticas */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/15 space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                Políticas do Site (/admin/politicas)
              </h4>
              <p className="text-xs text-[#4B1E3F]/80 leading-relaxed">
                Edição dos textos legais em conformidade com a LGPD: Política de Privacidade,
                Política de Cookies e Termos de Uso.
              </p>
            </div>

            {/* Gestão de Conversas */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/15 space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#4B1E3F] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                Gestão Soberana de Conversas (/admin/conversas)
              </h4>
              <p className="text-xs text-[#4B1E3F]/80 leading-relaxed">
                Painel exclusivo para o Master auditar todos os diálogos ocorridos no Chat Interno
                (canais gerais, privados ou grupos). Permite excluir mensagens impróprias ou remover
                conversas completas para resguardar a integridade institucional.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 5: NÍVEIS DE USUÁRIO E PERMISSÕES
            ======================================================== */}
        <section
          id="sec-roles"
          className="bg-white rounded-3xl p-6 sm:p-10 border border-[#4B1E3F]/10 shadow-sm space-y-6 print:shadow-none print:border-none print:break-before-page"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#4B1E3F] text-[#D4AF37] flex items-center justify-center font-serif font-black text-sm">
              05
            </span>
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#4B1E3F]">
                5. Níveis de Usuário & Permissões Granulares
              </h2>
              <p className="text-xs text-[#4B1E3F]/70">
                Hierarquia corporativa pensada para proteção de dados e revenda a clientes
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#4B1E3F]/10 rounded-2xl overflow-hidden">
              <thead className="bg-[#FAF8F5] border-b border-[#4B1E3F]/10 text-[#4B1E3F] font-serif font-bold">
                <tr>
                  <th className="p-3.5">Nível</th>
                  <th className="p-3.5">Escopo de Acesso</th>
                  <th className="p-3.5">Destinação Comercial / Papel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4B1E3F]/5 text-[#4B1E3F]/80">
                <tr className="hover:bg-[#FAF8F5]/50">
                  <td className="p-3.5 font-bold text-[#4B1E3F]">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#4B1E3F] border border-[#D4AF37]/40">
                      Master
                    </span>
                  </td>
                  <td className="p-3.5">
                    Acesso soberano e irrestrito. Cria lojas, edita configurações de domínio,
                    gerencia permissões e visualiza auditoria geral.
                  </td>
                  <td className="p-3.5">Dono do produto ou operador geral da infraestrutura.</td>
                </tr>

                <tr className="hover:bg-[#FAF8F5]/50">
                  <td className="p-3.5 font-bold text-[#4B1E3F]">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#4B1E3F]/10 text-[#4B1E3F]">
                      ADM (Administrador)
                    </span>
                  </td>
                  <td className="p-3.5">
                    <strong>Acesso modular e granular.</strong> O Master decide quais telas cada ADM
                    pode ver e operar, além de atribuir quais lojas do Storefront ele gerencia.
                  </td>
                  <td className="p-3.5">
                    Ideal para clientes que compraram sua própria loja ou gestores setoriais (ex:
                    financeiro, agenda).
                  </td>
                </tr>

                <tr className="hover:bg-[#FAF8F5]/50">
                  <td className="p-3.5 font-bold text-[#4B1E3F]">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#4B1E3F]/10 text-[#4B1E3F]">
                      Gerencial
                    </span>
                  </td>
                  <td className="p-3.5">
                    Acesso às rotinas de estúdio: Episódios, Nossos Momentos, Agenda, Convites e
                    Chat Interno. Não acessa finanças ou configurações críticas.
                  </td>
                  <td className="p-3.5">
                    Equipe de produção, editores de vídeo e assistentes de palco.
                  </td>
                </tr>

                <tr className="hover:bg-[#FAF8F5]/50">
                  <td className="p-3.5 font-bold text-[#4B1E3F]">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#4B1E3F]">
                      Ouro
                    </span>
                  </td>
                  <td className="p-3.5">
                    Acesso à Área de Membros VIP, Meu Perfil e Chat Interno (mensagens diretas e
                    canais de relacionamento).
                  </td>
                  <td className="p-3.5">
                    Patrocinadores assíduos, apoiadores premium e parceiros estratégicos.
                  </td>
                </tr>

                <tr className="hover:bg-[#FAF8F5]/50">
                  <td className="p-3.5 font-bold text-[#4B1E3F]">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Prata
                    </span>
                  </td>
                  <td className="p-3.5">
                    Acesso à Área de Membros básica, Perfil e Chat Interno Geral.
                  </td>
                  <td className="p-3.5">
                    Visitantes cadastrados automaticamente pela assistente virtual Nine e novos
                    ouvintes inscritos.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/10 text-xs text-[#4B1E3F]/80 space-y-2">
            <h4 className="font-serif font-bold text-sm text-[#4B1E3F]">
              O Funil de Captação Nine ➔ Comercial:
            </h4>
            <p>
              Quando um ouvinte ou patrocinador em potencial conversa com a <strong>Nine</strong> no
              site público, a IA solicita seus dados (nome, e-mail, telefone/WhatsApp) e{' '}
              <strong>cria a conta Prata na hora</strong>. O registro aparece instantaneamente na
              tela <strong>Contatos e Leads</strong>, permitindo que o time comercial abra o
              WhatsApp do lead com um toque e converta o contato em cliente ou patrocinador.
            </p>
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 6: SEGURANÇA E AUDITORIA
            ======================================================== */}
        <section
          id="sec-security"
          className="bg-white rounded-3xl p-6 sm:p-10 border border-[#4B1E3F]/10 shadow-sm space-y-6 print:shadow-none print:border-none print:break-before-page"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#4B1E3F] text-[#D4AF37] flex items-center justify-center font-serif font-black text-sm">
              06
            </span>
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#4B1E3F]">
                6. Segurança, Auditoria & Proteção Antifraude
              </h2>
              <p className="text-xs text-[#4B1E3F]/70">
                Padrões rígidos de integridade de dados e rastreabilidade total
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-[#2C1820]/80">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#4B1E3F]/10 text-[#4B1E3F] flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#4B1E3F]">
                Trilha Imutável de Auditoria
              </h4>
              <p className="leading-relaxed">
                Todas as operações no banco de dados registram autor, e-mail, perfil, IP, horário e
                o estado anterior e posterior dos registros alterados.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#4B1E3F]/10 text-[#4B1E3F] flex items-center justify-center font-bold">
                <Lock className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#4B1E3F]">
                Proteção em Dupla Camada & Inatividade
              </h4>
              <p className="leading-relaxed">
                Rotas protegidas no frontend com <code>ProtectedRoute</code>, logout automático por
                inatividade individual parametrizável e fluxo obrigatório de criação de nova senha
                no primeiro acesso com auditoria completa.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#4B1E3F]/10 text-[#4B1E3F] flex items-center justify-center font-bold">
                <Zap className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#4B1E3F]">
                Preservação Inteligente de Mídias
              </h4>
              <p className="leading-relaxed">
                Os formulários preservam fotos de convidados, logomarcas e comprovantes existentes
                quando campos não são re-enviados, evitando deleções acidentais.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 7: ENCERRAMENTO & PITCH DE VENDAS
            ======================================================== */}
        <section
          id="sec-sales"
          className="bg-gradient-to-br from-[#4B1E3F] via-[#3E1633] to-[#2B0E23] text-white rounded-3xl p-8 sm:p-12 border-2 border-[#D4AF37]/50 shadow-xl space-y-6 print:bg-white print:text-[#2C1820] print:border-[#4B1E3F]/20 print:shadow-none print:break-before-page"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#4B1E3F] flex items-center justify-center font-serif font-black text-sm">
              07
            </span>
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white print:text-[#4B1E3F]">
                7. Encerramento — Por Que a Plataforma É Única no Mercado?
              </h2>
              <p className="text-xs text-[#D4AF37] print:text-[#853C73]">
                O argumento de fechamento comercial para apresentação a clientes e investidores
              </p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-white/90 print:text-[#2C1820]/80 space-y-4 leading-relaxed text-xs sm:text-sm">
            <p>
              Ao escolher a plataforma <strong>CoffeeCast 4.0</strong>, seu cliente ou parceiro não
              contrata apenas o desenvolvimento de um website: ele implementa uma{' '}
              <strong>central completa de negócios audiovisuais e digitais</strong>.
            </p>
            <p>
              A combinação de <strong>Storefront Multi-Lojas</strong> (que permite multiplicar o
              faturamento criando novas marcas sem novos custos de servidores),{' '}
              <strong>Inteligência Artificial Nine nativa</strong> (atendimento, captura de contatos
              e criação automática de membros) e{' '}
              <strong>gestão financeira com rateio entre apresentadoras</strong> cria uma solução
              inigualável frente a qualquer CMS tradicional do mercado.
            </p>
            <p>
              Tudo isso com código 100% brasileiro, formato de moeda e datas nacionais, conformidade
              com a LGPD e uma identidade visual clássica e luxuosa que posiciona a marca do cliente
              no mais alto patamar de autoridade.
            </p>
          </div>

          <div className="pt-6 border-t border-white/20 print:border-[#4B1E3F]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-white/70 print:text-[#4B1E3F]/70">
              <p className="font-bold text-white print:text-[#4B1E3F]">
                CoffeeCast 4.0 — Tecnologia para Histórias que Transformam
              </p>
              <p>Mantida institucionalmente por SAF TECNOLOGIA E GESTAO LTDA</p>
            </div>

            <Button
              type="button"
              onClick={handlePrint}
              className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#4B1E3F] font-bold text-xs px-6 py-2.5 rounded-full shadow-lg print:hidden"
            >
              <Printer className="w-4 h-4 mr-2" />
              Exportar para Apresentação em PDF
            </Button>
          </div>
        </section>
      </main>

      {/* RODAPÉ COM LOGO OFICIAL */}
      <footer className="py-10 text-xs text-[#4B1E3F]/70 print:hidden border-t border-[#4B1E3F]/10 mt-12 bg-white/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="group flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 rounded-lg"
              title="CoffeeCast 4.0"
            >
              <img
                src={officialLogo}
                alt="CoffeeCast 4.0"
                className="h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.25)] transition-transform duration-200 group-hover:scale-105"
              />
            </Link>
            <div>
              <p className="font-serif font-bold text-[#4B1E3F]">CoffeeCast 4.0 Pro</p>
              <p className="text-[11px] text-[#4B1E3F]/60">Histórias que transformam</p>
            </div>
          </div>

          <div className="text-center sm:text-right text-[11px] text-[#4B1E3F]/60 space-y-0.5">
            <p>© {new Date().getFullYear()} CoffeeCast 4.0 — Documentação Oficial do Sistema.</p>
            <p>Mantida institucionalmente por SAF TECNOLOGIA E GESTAO LTDA</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
