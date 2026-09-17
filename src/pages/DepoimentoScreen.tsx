import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MembersAreaModal } from '@/components/MembersAreaModal'
import { GuestTestimonialForm } from '@/components/GuestTestimonialForm'
import { MessageSquareQuote, Sparkles, ArrowLeft, Heart, Coffee, Star } from 'lucide-react'

export default function DepoimentoScreen() {
  const [membersModalOpen, setMembersModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-marfim text-vinho flex flex-col font-sans selection:bg-dourado/30">
      {/* Navbar global consistente */}
      <Navbar onOpenMembersModal={() => setMembersModalOpen(true)} />

      <main className="flex-1 pt-20 sm:pt-24 md:pt-28 pb-16 sm:pb-24">
        {/* Cabeçalho Acolhedor na Identidade Visual Oficial */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-10 sm:py-16 bg-gradient-to-b from-[#36142d] via-vinho to-[#36142d] text-marfim overflow-hidden">
          {/* Efeitos sutis de iluminação dourada e rosé */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-dourado/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-brand/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto relative z-10 space-y-6">
            {/* Botão de retorno sutil */}
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
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-dourado/20 border border-dourado/40 text-dourado text-xs font-semibold tracking-wide shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-dourado shrink-0" />
                <span>Espaço Oficial do Convidado</span>
                <Heart className="w-3 h-3 text-dourado shrink-0 fill-dourado/40" />
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                Como foi a sua experiência à mesa do CoffeeCast 4.0?
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-marfim/90 max-w-2xl mx-auto leading-relaxed font-light">
                Criamos este espaço dedicado para você, nosso convidado especial, contar como se
                sentiu ao compartilhar sua história conosco.
              </p>

              {/* Selo do lema da marca */}
              <div className="pt-2 flex items-center justify-center gap-2 text-xs sm:text-sm text-dourado font-medium italic">
                <Coffee className="w-4 h-4 text-dourado shrink-0" />
                <span>"Mais que conversas, histórias que transformam."</span>
              </div>
            </div>

            {/* Três destaques de valor */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3.5 text-center space-y-1">
                <div className="flex justify-center text-dourado">
                  <Star className="w-4 h-4 fill-dourado" />
                </div>
                <h3 className="text-xs font-bold text-white">Sua História Brilha</h3>
                <p className="text-[11px] text-marfim/75 leading-snug">
                  Seu relato com sua foto e link do Instagram no nosso site oficial.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3.5 text-center space-y-1">
                <div className="flex justify-center text-dourado">
                  <Heart className="w-4 h-4 fill-dourado" />
                </div>
                <h3 className="text-xs font-bold text-white">Acolhimento Real</h3>
                <p className="text-[11px] text-marfim/75 leading-snug">
                  Ouvir você é o que aquece nossa equipe e nos ajuda a evoluir.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3.5 text-center space-y-1">
                <div className="flex justify-center text-dourado">
                  <MessageSquareQuote className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Inspire Próximos Convidados</h3>
                <p className="text-[11px] text-marfim/75 leading-snug">
                  Ajude novas vozes a darem o passo de se sentar à nossa mesa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Formulário reutilizado integralmente (sem duplicar lógica) */}
        <div className="relative">
          <GuestTestimonialForm />
        </div>
      </main>

      {/* Rodapé oficial do site */}
      <Footer />

      {/* Modal de Membros caso o usuário clique na navbar */}
      <MembersAreaModal open={membersModalOpen} onOpenChange={setMembersModalOpen} />
    </div>
  )
}
