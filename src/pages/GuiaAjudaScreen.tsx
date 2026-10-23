import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Printer,
  Sparkles,
  HelpCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Shield,
  ShieldCheck,
  User,
  Compass,
  Sliders,
  Globe,
  Store,
  Bot,
  LayoutDashboard,
  Bell,
  MessageSquare,
  MessagesSquare,
  Tv,
  Camera,
  FileText,
  MessageSquareQuote,
  Inbox,
  DollarSign,
  Clock,
  CalendarDays,
  FileCheck2,
  Activity,
  UserCheck,
  Users2,
  ShieldAlert,
  BookOpen,
  Home,
  KeyRound,
  LayoutGrid,
  Filter,
  ArrowUpRight,
  ChevronDown,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import officialLogo from '@/assets/sem-nome-1350-x-1080-px-1-c4c50.png'
import bannerImg from '@/assets/whatsapp-image-2026-09-14-at-22.43.57-19091.jpeg'
import { useAuth } from '@/context/AuthContext'
import { GUIA_AJUDA_CATEGORIAS, type GuiaItemSecao, type GuiaCategoria } from '@/data/guiaAjudaData'
import type { UserRole } from '@/types/database'

// Mapeador de ícones Lucide
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Sliders,
  Globe,
  Shield,
  ShieldCheck,
  User,
  Store,
  Bot,
  LayoutDashboard,
  Bell,
  MessageSquare,
  MessagesSquare,
  Tv,
  Camera,
  FileText,
  MessageSquareQuote,
  Inbox,
  DollarSign,
  Clock,
  CalendarDays,
  FileCheck2,
  Activity,
  UserCheck,
  Users2,
  ShieldAlert,
  BookOpen,
  Home,
  KeyRound,
  LayoutGrid,
  HelpCircle,
  Sparkles,
  Layers,
  Search,
}

export default function GuiaAjudaScreen() {
  const { user, role, isMaster, isAdm, isGerencial } = useAuth()
  const userRole: UserRole = role || 'prata'

  // Estados de filtro e busca
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'meu-perfil' | 'todos' | UserRole>(
    'meu-perfil',
  )
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  const handlePrint = () => {
    window.print()
  }

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const expandAll = () => {
    const all: Record<string, boolean> = {}
    GUIA_AJUDA_CATEGORIAS.forEach((cat) => {
      cat.itens.forEach((it) => {
        all[it.id] = true
      })
    })
    setExpandedItems(all)
  }

  const collapseAll = () => {
    setExpandedItems({})
  }

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Garante que o item esteja expandido ao rolar até ele
      setExpandedItems((prev) => ({ ...prev, [id]: true }))
    }
  }

  // Filtragem inteligente por busca e perfil
  const filteredCategorias = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return GUIA_AJUDA_CATEGORIAS.map((cat) => {
      const itensFiltrados = cat.itens.filter((item) => {
        // Filtro por perfil
        if (selectedRoleFilter === 'meu-perfil') {
          // Se for Master, vê tudo; caso contrário, verifica se o perfil do usuário está incluído
          if (!isMaster && !item.perfisPermitidos.includes(userRole)) {
            return false
          }
        } else if (selectedRoleFilter !== 'todos') {
          if (!item.perfisPermitidos.includes(selectedRoleFilter)) {
            return false
          }
        }

        // Filtro por texto de busca
        if (!term) return true

        const matchTitulo = item.titulo.toLowerCase().includes(term)
        const matchSub = item.subtitulo?.toLowerCase().includes(term) || false
        const matchOnde = item.ondeClicar.toLowerCase().includes(term)
        const matchParaQue = item.paraQueServe.toLowerCase().includes(term)
        const matchPassos = item.passoAPasso?.some((p) => p.toLowerCase().includes(term)) || false
        const matchBotoes =
          item.botoesPrincipais?.some(
            (b) =>
              b.nome.toLowerCase().includes(term) ||
              b.onde.toLowerCase().includes(term) ||
              b.paraQueServe.toLowerCase().includes(term),
          ) || false

        return matchTitulo || matchSub || matchOnde || matchParaQue || matchPassos || matchBotoes
      })

      return {
        ...cat,
        itens: itensFiltrados,
      }
    }).filter((cat) => cat.itens.length > 0)
  }, [searchTerm, selectedRoleFilter, isMaster, userRole])

  const totalItensEncontrados = filteredCategorias.reduce((acc, cat) => acc + cat.itens.length, 0)

  const roleLabel =
    userRole === 'master'
      ? 'Master (Superadmin)'
      : userRole === 'adm'
        ? 'ADM (Administrador)'
        : userRole === 'gerencial'
          ? 'Gerencial'
          : userRole === 'ouro'
            ? 'Membro Ouro'
            : 'Membro Prata'

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C1820] font-sans antialiased selection:bg-[#D4AF37]/30 selection:text-[#4B1E3F]">
      {/* ========================================================
          BARRA SUPERIOR FIXA (OCULTA NA IMPRESSÃO)
          ======================================================== */}
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

            {isMaster || isAdm || isGerencial ? (
              <Link
                to="/admin"
                className="font-serif font-bold text-xs sm:text-sm text-[#4B1E3F] hover:text-[#D4AF37] transition-colors"
              >
                Painel Admin
              </Link>
            ) : (
              <Link
                to="/membros"
                className="font-serif font-bold text-xs sm:text-sm text-[#4B1E3F] hover:text-[#D4AF37] transition-colors"
              >
                Área de Membros
              </Link>
            )}

            <span className="text-[#4B1E3F]/30 hidden sm:inline">/</span>
            <span className="text-xs font-semibold text-[#4B1E3F]/70 hidden sm:inline flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
              Guia de Ajuda & Primeiro Acesso
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-[#4B1E3F]/25 text-[#4B1E3F] hover:bg-[#4B1E3F]/5 font-semibold text-xs rounded-full px-4 min-h-[38px] flex items-center gap-2 shadow-2xs"
              title="Exportar este manual para PDF ou Imprimir"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Imprimir / Salvar PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>

            <Badge className="bg-[#4B1E3F] text-[#FAF8F5] border border-[#D4AF37]/50 font-bold text-[11px] px-2.5 py-1">
              Perfil: {roleLabel}
            </Badge>
          </div>
        </div>
      </header>

      {/* ========================================================
          CONTEÚDO PRINCIPAL
          ======================================================== */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10">
        {/* ========================================================
            HERO / BANNER DE APRESENTAÇÃO DO GUIA
            ======================================================== */}
        <section className="bg-gradient-to-br from-[#4B1E3F] via-[#3E1633] to-[#2B0E23] text-[#FAF8F5] rounded-3xl p-6 sm:p-12 border-2 border-[#D4AF37]/50 shadow-2xl relative overflow-hidden print:rounded-none print:shadow-none print:border-none print:p-6 print:bg-white print:text-[#2C1820]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none print:hidden" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C88E9B]/10 rounded-full blur-2xl pointer-events-none print:hidden" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-5">
            {/* Banner oficial wide do CoffeeCast */}
            <div className="w-full max-w-xl mx-auto rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-xl bg-[#1b0816] print:border-[#4B1E3F]/30">
              <img
                src={bannerImg}
                alt="CoffeeCast 4.0 - Mais que conversas, histórias que transformam"
                className="w-full h-auto object-contain block"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] print:text-[#4B1E3F] text-xs font-bold uppercase tracking-widest shadow-2xs">
              <HelpCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
              Manual do Usuário • Primeiro Acesso • Passo a Passo
            </div>

            <div className="space-y-2 max-w-3xl">
              <h1 className="font-serif text-3xl sm:text-5xl font-black text-white print:text-[#4B1E3F] tracking-tight leading-tight">
                Guia de Ajuda & Primeiro Acesso
              </h1>
              <p className="font-serif italic text-base sm:text-xl text-[#D4AF37] print:text-[#853C73] font-light">
                Onde clicar, para que serve cada aba e como usar cada botão do sistema
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#FAF8F5]/85 print:text-[#2C1820]/80 max-w-2xl leading-relaxed font-light">
              Seja muito bem-vindo(a) ao <strong>CoffeeCast 4.0</strong>! Criamos este walkthrough
              autoexplicativo especialmente para orientar você em seus primeiros passos e servir de
              consulta permanente sempre que tiver dúvidas sobre qualquer funcionalidade da
              plataforma.
            </p>

            <div className="pt-4 border-t border-white/15 print:border-[#4B1E3F]/20 w-full max-w-xl flex flex-wrap items-center justify-around gap-3 text-xs text-[#FAF8F5]/80 print:text-[#2C1820]/70">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Atualizado com a versão 4.0</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Visão adaptada ao seu perfil</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-[#D4AF37]" />
                <span>Pronto para impressão / PDF</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            BARRA DE BUSCA, FILTRO POR PERFIL E CONTROLES (PRINT:HIDDEN)
            ======================================================== */}
        <section className="bg-white rounded-3xl p-5 sm:p-7 border border-[#4B1E3F]/10 shadow-xs space-y-4 print:hidden">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Campo de Busca Rápida */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#4B1E3F]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Pesquise por tela, botão, aba ou termo (ex: financeiro, roteiro, WhatsApp, PDF)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-xs rounded-2xl border-[#4B1E3F]/20 focus-visible:ring-[#D4AF37] min-h-[42px] bg-[#FAF8F5]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#4B1E3F]/60 hover:text-[#4B1E3F] font-bold"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Controles de Expandir/Recolher Tudo */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={expandAll}
                className="text-xs text-[#4B1E3F] hover:bg-[#4B1E3F]/5 font-medium px-3 rounded-xl"
              >
                Expandir Tudo
              </Button>
              <span className="text-[#4B1E3F]/30">•</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                className="text-xs text-[#4B1E3F] hover:bg-[#4B1E3F]/5 font-medium px-3 rounded-xl"
              >
                Recolher Tudo
              </Button>
            </div>
          </div>

          {/* Filtro por Perfil / Nível de Acesso */}
          <div className="pt-3 border-t border-[#4B1E3F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4B1E3F]">
              <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Filtrar por nível de acesso:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedRoleFilter('meu-perfil')}
                className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
                  selectedRoleFilter === 'meu-perfil'
                    ? 'bg-[#4B1E3F] text-[#D4AF37] shadow-xs ring-1 ring-[#D4AF37]'
                    : 'bg-[#FAF8F5] text-[#4B1E3F]/80 hover:bg-[#4B1E3F]/10 border border-[#4B1E3F]/15'
                }`}
              >
                Meu Perfil Atual ({roleLabel})
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleFilter('todos')}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                  selectedRoleFilter === 'todos'
                    ? 'bg-[#D4AF37] text-[#4B1E3F] font-bold shadow-xs'
                    : 'bg-[#FAF8F5] text-[#4B1E3F]/80 hover:bg-[#4B1E3F]/10 border border-[#4B1E3F]/15'
                }`}
              >
                Todas as Áreas (Completo)
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleFilter('master')}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                  selectedRoleFilter === 'master'
                    ? 'bg-[#D4AF37] text-[#4B1E3F] font-bold shadow-xs'
                    : 'bg-[#FAF8F5] text-[#4B1E3F]/70 hover:bg-[#4B1E3F]/10 border border-[#4B1E3F]/15'
                }`}
              >
                Master
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleFilter('adm')}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                  selectedRoleFilter === 'adm'
                    ? 'bg-[#D4AF37] text-[#4B1E3F] font-bold shadow-xs'
                    : 'bg-[#FAF8F5] text-[#4B1E3F]/70 hover:bg-[#4B1E3F]/10 border border-[#4B1E3F]/15'
                }`}
              >
                ADM
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleFilter('gerencial')}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                  selectedRoleFilter === 'gerencial'
                    ? 'bg-[#D4AF37] text-[#4B1E3F] font-bold shadow-xs'
                    : 'bg-[#FAF8F5] text-[#4B1E3F]/70 hover:bg-[#4B1E3F]/10 border border-[#4B1E3F]/15'
                }`}
              >
                Gerencial
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleFilter('ouro')}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                  selectedRoleFilter === 'ouro'
                    ? 'bg-[#D4AF37] text-[#4B1E3F] font-bold shadow-xs'
                    : 'bg-[#FAF8F5] text-[#4B1E3F]/70 hover:bg-[#4B1E3F]/10 border border-[#4B1E3F]/15'
                }`}
              >
                Ouro
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleFilter('prata')}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                  selectedRoleFilter === 'prata'
                    ? 'bg-[#D4AF37] text-[#4B1E3F] font-bold shadow-xs'
                    : 'bg-[#FAF8F5] text-[#4B1E3F]/70 hover:bg-[#4B1E3F]/10 border border-[#4B1E3F]/15'
                }`}
              >
                Prata
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================
            SUMÁRIO INTERATIVO DE ÂNCORAS / ÍNDICE RÁPIDO
            ======================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#4B1E3F]/10 shadow-xs print:border-[#4B1E3F]/20">
          <div className="flex items-center justify-between gap-4 border-b border-[#4B1E3F]/10 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#4B1E3F]/10 text-[#4B1E3F] flex items-center justify-center font-bold">
                <Compass className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#4B1E3F]">
                  Índice Rápido de Navegação
                </h2>
                <p className="text-xs text-[#4B1E3F]/70">
                  {totalItensEncontrados} tela(s) e módulo(s) disponíveis para consulta
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {filteredCategorias.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/10 space-y-2"
              >
                <div className="flex items-center gap-2 font-serif font-bold text-sm text-[#4B1E3F]">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  <span>{cat.titulo}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {cat.itens.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => scrollToAnchor(`item-${it.id}`)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#4B1E3F] hover:text-[#FAF8F5] border border-[#4B1E3F]/10 text-[#4B1E3F] font-medium text-[11px] transition-all flex items-center gap-1 group shadow-2xs"
                    >
                      <span>{it.titulo}</span>
                      <ArrowUpRight className="w-3 h-3 text-[#D4AF37] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            SEÇÕES DETALHADAS COM ONDE CLICAR E BOTÕES
            ======================================================== */}
        <div className="space-y-12">
          {filteredCategorias.map((cat, catIdx) => {
            const CatIcon = ICON_MAP[cat.icone] || Sliders

            return (
              <section
                key={cat.id}
                id={`cat-${cat.id}`}
                className="space-y-5 print:break-before-page"
              >
                {/* Cabeçalho da Categoria */}
                <div className="flex items-center gap-3 border-b-2 border-[#D4AF37]/50 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#4B1E3F] text-[#D4AF37] flex items-center justify-center font-bold shadow-md">
                    <CatIcon className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#4B1E3F]">
                      {cat.titulo}
                    </h2>
                    <p className="text-xs text-[#4B1E3F]/75 font-normal">{cat.descricao}</p>
                  </div>
                </div>

                {/* Lista de Itens da Categoria */}
                <div className="space-y-5">
                  {cat.itens.map((item, itemIdx) => {
                    const ItemIcon = ICON_MAP[item.icone] || HelpCircle
                    const isExpanded = expandedItems[item.id] !== false // padrão expandido

                    return (
                      <article
                        key={item.id}
                        id={`item-${item.id}`}
                        className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                          item.exclusivoMaster
                            ? 'border-[#D4AF37]/60 ring-1 ring-[#D4AF37]/30'
                            : 'border-[#4B1E3F]/10'
                        }`}
                      >
                        {/* Topo do Card / Acordeão */}
                        <div
                          onClick={() => toggleExpand(item.id)}
                          className="p-5 sm:p-6 cursor-pointer flex items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-[#FAF8F5] select-none"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#4B1E3F]/15 text-[#4B1E3F] flex items-center justify-center shrink-0 shadow-2xs">
                              <ItemIcon className="w-5 h-5 text-[#D4AF37]" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-[#D4AF37]">
                                  {String(catIdx + 1).padStart(2, '0')}.
                                  {String(itemIdx + 1).padStart(2, '0')}
                                </span>
                                <h3 className="font-serif font-bold text-base sm:text-lg text-[#4B1E3F] truncate">
                                  {item.titulo}
                                </h3>

                                {item.badge && (
                                  <Badge className="bg-[#D4AF37] text-[#4B1E3F] font-bold text-[9px] px-2 py-0.5">
                                    {item.badge}
                                  </Badge>
                                )}

                                {item.exclusivoMaster && (
                                  <Badge className="bg-[#4B1E3F] text-[#D4AF37] font-bold text-[9px] px-2 py-0.5 border border-[#D4AF37]/50">
                                    Exclusivo Master
                                  </Badge>
                                )}

                                {item.rota && (
                                  <span className="font-mono text-[10px] text-[#4B1E3F]/60 bg-[#FAF8F5] border border-[#4B1E3F]/10 px-2 py-0.5 rounded hidden md:inline-block">
                                    {item.rota}
                                  </span>
                                )}
                              </div>

                              {item.subtitulo && (
                                <p className="text-xs text-[#4B1E3F]/70 truncate mt-0.5">
                                  {item.subtitulo}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <ChevronDown
                              className={`w-5 h-5 text-[#4B1E3F]/60 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180 text-[#D4AF37]' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {/* Conteúdo Expandido do Item */}
                        {isExpanded && (
                          <div className="px-5 pb-6 sm:px-6 sm:pb-7 pt-2 border-t border-[#4B1E3F]/10 space-y-5 text-xs text-[#2C1820]/85">
                            {/* Bloco 1: Onde Clicar & Para Que Serve */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/10 space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-[#4B1E3F]">
                                  <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  <span className="uppercase tracking-wider text-[10px]">
                                    Onde Clicar
                                  </span>
                                </div>
                                <p className="leading-relaxed font-medium">{item.ondeClicar}</p>
                              </div>

                              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#4B1E3F]/10 space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-[#4B1E3F]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  <span className="uppercase tracking-wider text-[10px]">
                                    Para Que Serve
                                  </span>
                                </div>
                                <p className="leading-relaxed">{item.paraQueServe}</p>
                              </div>
                            </div>

                            {/* Bloco 2: Passo a Passo Numerado */}
                            {item.passoAPasso && item.passoAPasso.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#4B1E3F] flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                                  Passo a Passo de Utilização:
                                </h4>
                                <ol className="space-y-2 pl-1">
                                  {item.passoAPasso.map((passo, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5">
                                      <span className="w-5 h-5 rounded-full bg-[#4B1E3F] text-[#FAF8F5] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                        {idx + 1}
                                      </span>
                                      <span className="leading-relaxed">{passo}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {/* Bloco 3: Botões Principais da Tela */}
                            {item.botoesPrincipais && item.botoesPrincipais.length > 0 && (
                              <div className="space-y-2 pt-1">
                                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#4B1E3F] flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                                  Guia dos Botões Desta Tela:
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                  {item.botoesPrincipais.map((botao, bIdx) => (
                                    <div
                                      key={bIdx}
                                      className="p-3 rounded-xl bg-white border border-[#4B1E3F]/15 space-y-1 shadow-2xs hover:border-[#D4AF37] transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-[#4B1E3F] text-xs">
                                          {botao.nome}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-[#4B1E3F]/60 italic font-mono">
                                        {botao.onde}
                                      </p>
                                      <p className="text-[11px] text-[#2C1820]/80 leading-snug">
                                        {botao.paraQueServe}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Bloco 4: Caixa de Dica ou Atenção */}
                            {item.dica && (
                              <div className="p-3.5 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-start gap-2.5 text-[#4B1E3F]">
                                <Lightbulb className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <span className="font-bold text-xs">Dica Prática:</span>
                                  <p className="text-xs leading-relaxed">{item.dica}</p>
                                </div>
                              </div>
                            )}

                            {item.atencao && (
                              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-amber-950">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <span className="font-bold text-xs">Atenção / Segurança:</span>
                                  <p className="text-xs leading-relaxed">{item.atencao}</p>
                                </div>
                              </div>
                            )}

                            {/* Rodapé com Perfis Autorizados e Link Direto */}
                            <div className="pt-3 border-t border-[#4B1E3F]/10 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[#4B1E3F]/60 font-semibold">
                                  Liberado para:
                                </span>
                                {item.perfisPermitidos.map((p) => (
                                  <span
                                    key={p}
                                    className="px-2 py-0.5 rounded-md bg-[#4B1E3F]/5 border border-[#4B1E3F]/10 text-[#4B1E3F] uppercase font-bold text-[9px]"
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>

                              {item.rota && (
                                <Link
                                  to={item.rota}
                                  className="font-bold text-[#D4AF37] hover:text-[#4B1E3F] inline-flex items-center gap-1 transition-colors group"
                                >
                                  <span>Ir para esta tela</span>
                                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </Link>
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {filteredCategorias.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#4B1E3F]/10 p-8 space-y-3">
              <HelpCircle className="w-10 h-10 text-[#D4AF37] mx-auto" />
              <h3 className="font-serif font-bold text-lg text-[#4B1E3F]">
                Nenhum item encontrado para sua pesquisa
              </h3>
              <p className="text-xs text-[#4B1E3F]/70 max-w-md mx-auto">
                Tente usar termos mais genéricos (ex: "roteiro", "gravação", "senha") ou selecione
                "Todas as Áreas" no filtro acima.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedRoleFilter('todos')
                }}
                className="text-xs rounded-full border-[#4B1E3F]/20 text-[#4B1E3F]"
              >
                Limpar filtros e ver tudo
              </Button>
            </div>
          )}
        </div>

        {/* ========================================================
            CARD FINAL DE MANUTENÇÃO & SUPORTE
            ======================================================== */}
        <section className="bg-gradient-to-br from-[#FAF8F5] via-white to-[#FAF8F5] rounded-3xl p-6 sm:p-10 border border-[#D4AF37]/50 shadow-md space-y-5 print:border-[#4B1E3F]/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                Manutenção Contínua do Sistema
              </span>
              <h3 className="font-serif font-bold text-xl text-[#4B1E3F]">
                Política de Atualização Deste Guia
              </h3>
              <p className="text-xs text-[#4B1E3F]/80 max-w-2xl leading-relaxed">
                Em conformidade com a governança da plataforma, sempre que novas abas, botões ou
                fluxos forem adicionados ou alterados no CoffeeCast 4.0, este manual é atualizado
                simultaneamente no módulo <code>src/data/guiaAjudaData.ts</code> e na Documentação
                Oficial.
              </p>
            </div>

            <Button
              type="button"
              onClick={handlePrint}
              className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#4B1E3F] font-bold text-xs px-6 py-2.5 rounded-full shadow-md shrink-0 print:hidden"
            >
              <Printer className="w-4 h-4 mr-2" />
              Salvar Guia em PDF
            </Button>
          </div>
        </section>
      </main>

      {/* ========================================================
          RODAPÉ INSTITUCIONAL
          ======================================================== */}
      <footer className="py-8 text-xs text-[#4B1E3F]/70 print:hidden border-t border-[#4B1E3F]/10 mt-12 bg-white/60 backdrop-blur-sm">
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
              <p className="font-serif font-bold text-[#4B1E3F]">
                CoffeeCast 4.0 — Guia de Ajuda Oficial
              </p>
              <p className="text-[11px] text-[#4B1E3F]/60">Histórias que transformam</p>
            </div>
          </div>

          <div className="text-center sm:text-right text-[11px] text-[#4B1E3F]/60 space-y-0.5">
            <p>© {new Date().getFullYear()} CoffeeCast 4.0 — Todos os direitos reservados.</p>
            <p>Mantida institucionalmente por SAF TECNOLOGIA E GESTAO LTDA</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
