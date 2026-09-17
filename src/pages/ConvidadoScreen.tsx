import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MembersAreaModal } from '@/components/MembersAreaModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Sparkles,
  Heart,
  Coffee,
  MessageSquareQuote,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  LockOpen,
  ArrowLeft,
  Calendar,
  Mic,
  Star,
} from 'lucide-react'

export default function ConvidadoScreen() {
  const [membersModalOpen, setMembersModalOpen] = useState(false)

  const handleRoteiroClick = () => {
    toast.info('Área do Roteiro em desenvolvimento!', {
      description:
        'Em breve você poderá preencher ou alinhar o roteiro do seu episódio diretamente por aqui, sem complicações.',
      duration: 4500,
    })
  }

  return (
    <div className="min-h-screen bg-marfim text-vinho flex flex-col font-sans selection:bg-dourado/30">
      {/* Navbar global */}
      <Navbar onOpenMembersModal={() => setMembersModalOpen(true)} />

      <main className="flex-1 pt-20 sm:pt-24 md:pt-28 pb-16 sm:pb-24">
        {/* Cabeçalho Acolhedor na Identidade Visual Oficial (vinho #4B1E3F, dourado, rosé, marfim) */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-gradient-to-b from-[#36142d] via-vinho to-[#36142d] text-marfim overflow-hidden">
          {/* Efeitos sutis de iluminação dourada e rosé */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-dourado/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-brand/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-dourado/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto relative z-10 space-y-6">
            {/* Botão de retorno ao site */}
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-marfim/80 hover:text-dourado transition-colors bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-dourado/30 backdrop-blur-xs shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-dourado" />
                Voltar para o site do CoffeeCast 4.0
              </Link>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dourado/20 border border-dourado/40 text-dourado text-xs sm:text-sm font-semibold tracking-wide shadow-xs">
                <Sparkles className="w-4 h-4 text-dourado shrink-0" />
                <span>Portal Aberto do Convidado & Entrevistado</span>
                <Heart className="w-3.5 h-3.5 text-dourado shrink-0 fill-dourado/40" />
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                Seja muito bem-vinda ao seu espaço exclusivo
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-marfim/90 max-w-2xl mx-auto leading-relaxed font-light">
                Criamos esta área prática e sem exigência de login para que você envie suas
                contribuições com conforto, rapidez e autonomia.
              </p>

              {/* Tag informativa sem login */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <LockOpen className="w-3.5 h-3.5 text-emerald-300" />
                  Sem necessidade de senha ou cadastro
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-dourado-light border border-dourado/30">
                  <Coffee className="w-3.5 h-3.5 text-dourado" />
                  Experiência leve e rápida
                </span>
              </div>

              {/* Lema da marca */}
              <div className="pt-2 flex items-center justify-center gap-2 text-xs sm:text-sm text-dourado font-medium italic">
                <Mic className="w-4 h-4 text-dourado shrink-0" />
                <span>"Mais que conversas, histórias que transformam."</span>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Principal: Escolha sua Contribuição (2 Cartões em Destaque) */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
          <div className="text-center mb-6 sm:mb-8">
            <span className="text-xs uppercase tracking-widest text-vinho/70 font-bold">
              Escolha o que deseja preencher
            </span>
            <p className="text-xs sm:text-sm text-vinho/60 mt-1">
              Selecione uma das opções abaixo para prosseguir
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Card 1: Deixe seu depoimento (ATIVO e PRINCIPAL) */}
            <div className="group bg-white rounded-3xl p-6 sm:p-8 border-2 border-dourado/60 shadow-xl hover:shadow-2xl hover:border-dourado transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
              {/* Brilho dourado no topo */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-dourado/10 rounded-full blur-2xl pointer-events-none group-hover:bg-dourado/15 transition-all" />

              <div className="space-y-5 relative z-10">
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-vinho via-[#4B1E3F] to-vinho-dark text-dourado flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <MessageSquareQuote className="w-7 h-7 text-dourado" />
                  </div>
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Disponível agora
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-vinho group-hover:text-vinho-dark transition-colors">
                    Deixe seu depoimento
                  </h2>
                  <p className="text-sm text-vinho/75 leading-relaxed">
                    Já esteve à mesa do CoffeeCast 4.0? Conte para nós como foi sua experiência! Seu
                    relato ganha destaque no site oficial junto com sua foto e seu Instagram.
                  </p>
                </div>

                {/* Vantagens / Informações rápidas */}
                <div className="space-y-2 pt-2 border-t border-vinho/10">
                  <div className="flex items-center gap-2 text-xs text-vinho/80">
                    <Star className="w-3.5 h-3.5 text-dourado fill-dourado shrink-0" />
                    <span>Leva menos de 3 minutos para enviar</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-vinho/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Você anexa sua foto favorita e seu @ do Instagram</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-vinho/80">
                    <Heart className="w-3.5 h-3.5 text-rose-brand fill-rose-brand/30 shrink-0" />
                    <span>Inspira novas convidadas e fortalece sua autoridade</span>
                  </div>
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="pt-6 relative z-10">
                <Link to="/depoimento" className="block">
                  <Button className="w-full bg-vinho hover:bg-vinho-dark text-white font-bold text-sm sm:text-base py-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:bg-gradient-to-r group-hover:from-vinho group-hover:to-[#36142d]">
                    <span>Preencher depoimento agora</span>
                    <ArrowRight className="w-4 h-4 text-dourado transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <p className="text-[11px] text-center text-vinho/60 mt-2 font-light">
                  Formulário direto, simples e intuitivo.
                </p>
              </div>
            </div>

            {/* Card 2: Roteiro do Episódio (ATIVO - DISPONÍVEL AGORA) */}
            <div className="group bg-white rounded-3xl p-6 sm:p-8 border-2 border-dourado/60 shadow-xl hover:shadow-2xl hover:border-dourado transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
              {/* Brilho rosé no topo */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-rose-brand/10 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-brand/15 transition-all" />

              <div className="space-y-5 relative z-10">
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-vinho via-[#4B1E3F] to-vinho-dark text-dourado flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <FileText className="w-7 h-7 text-dourado" />
                  </div>
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Disponível agora
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-vinho group-hover:text-vinho-dark transition-colors">
                    Roteiro do Episódio
                  </h2>
                  <p className="text-sm text-vinho/75 leading-relaxed">
                    Vai gravar seu episódio no estúdio? Responda às perguntinhas de preparação com
                    seus dados pessoais, família, empresa, tema preferido e temas sensíveis para
                    deixarmos tudo perfeito!
                  </p>
                </div>

                {/* Vantagens / Informações rápidas */}
                <div className="space-y-2 pt-2 border-t border-vinho/10">
                  <div className="flex items-center gap-2 text-xs text-vinho/80">
                    <Calendar className="w-3.5 h-3.5 text-dourado shrink-0" />
                    <span>Alinhamento prévio dos tópicos da conversa</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-vinho/80">
                    <Mic className="w-3.5 h-3.5 text-dourado shrink-0" />
                    <span>Envio de foto para divulgação e logo da empresa</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-vinho/80">
                    <LockOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Acesso direto e público, sem necessidade de senha</span>
                  </div>
                </div>
              </div>

              {/* Botão de Ação para o Novo Formulário */}
              <div className="pt-6 relative z-10">
                <Link to="/roteiro" className="block">
                  <Button className="w-full bg-vinho hover:bg-vinho-dark text-white font-bold text-sm sm:text-base py-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:bg-gradient-to-r group-hover:from-vinho group-hover:to-[#36142d]">
                    <span>Preencher roteiro agora</span>
                    <ArrowRight className="w-4 h-4 text-dourado transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <p className="text-[11px] text-center text-vinho/60 mt-2 font-light">
                  Leva poucos minutos e prepara sua gravação com carinho.
                </p>
              </div>
            </div>
          </div>

          {/* Bloco de Suporte / Acolhimento */}
          <div className="mt-12 bg-white rounded-2xl p-6 sm:p-8 border border-vinho/15 shadow-sm text-center space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-vinho/10 text-vinho mb-1">
              <Coffee className="w-5 h-5 text-dourado" />
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-vinho">
              Dúvidas ou precisa de ajuda para preencher?
            </h3>
            <p className="text-xs sm:text-sm text-vinho/70 max-w-xl mx-auto leading-relaxed">
              Nossa equipe está sempre por perto para lhe dar suporte antes, durante e depois da sua
              gravação. Fale conosco a qualquer momento.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/5531991297619?text=Ol%C3%A1%2C%20sou%20convidada%20do%20CoffeeCast%204.0%20e%20gostaria%20de%20uma%20orienta%C3%A7%C3%A3o!"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-vinho bg-marfim border border-dourado/50 hover:bg-dourado/20 hover:border-dourado transition-all shadow-xs"
              >
                <span>Falar com a Produção no WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5 text-dourado" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé oficial do site */}
      <Footer />

      {/* Modal de Membros caso o usuário clique na navbar */}
      <MembersAreaModal open={membersModalOpen} onOpenChange={setMembersModalOpen} />
    </div>
  )
}
