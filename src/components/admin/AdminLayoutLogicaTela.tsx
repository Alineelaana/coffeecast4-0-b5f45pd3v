// src/components/admin/AdminLayoutLogicaTela.tsx
// Botão "Lógica da Tela" do LAYOUT ADMINISTRATIVO — documenta o comportamento do
// cabeçalho e dos menus no celular (leiaute tipo App) e no desktop.
// O botão fica no Topbar Desktop (hidden md:flex), então no celular ele só aparece
// quando o diálogo é aberto — documentação consultável em qualquer tela do painel.

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

const SECOES: { titulo: string; itens: string[] }[] = [
  {
    titulo: '🎯 O que é o Layout Administrativo',
    itens: [
      'É a "casca" de todas as telas do painel: sidebar (desktop), gaveta de menu (mobile), topbar e área de conteúdo.',
      'Todas as telas (Dashboard, Agenda, Leads, Roteiros, Portfolios, Usuários etc.) renderizam dentro dele — qualquer ajuste aqui vale para o painel inteiro.',
      'Identidade visual vinho/dourado preservada; no desktop nada mudou.',
    ],
  },
  {
    titulo: '📱 Comportamento mobile (leiaute tipo App)',
    itens: [
      'Cabeçalho mobile dobrado (mesmo padrão do site público): logo h-16 (~64px) + py-3 com env(safe-area-inset-top) — altura total ~96px, fora da área do notch do iPhone.',
      'Todos os botões do cabeçalho (Guia de Ajuda, Notificações e Menu/hamburger) têm 44×44px — área mínima de toque, nunca comprimidos pelo logo ou pela safe-area.',
      'O botão de menu (hamburger) fica sempre visível no topo direito, com aria-expanded indicando o estado (aberto/fechado).',
      'A gaveta de menu abre em TELA CHEIA (fixed inset-0, fundo vinho), com o logo e o botão fechar também respeitando a safe-area do iPhone.',
      'Itens do menu com min-h 52px e ícone em quadrado 36px (realce dourado no item ativo); submenu Master com itens >= 46px; rodapé (Perfil / Sair) com safe-area-inset-bottom.',
      'O conteúdo das telas começa logo abaixo do cabeçalho — nada fica escondido atrás dele (o cabeçalho é sticky, faz parte do fluxo, não sobrepõe o conteúdo).',
      'Pesquisa de telas no topo da gaveta, exatamente como já existia, com campo de toque confortável.',
    ],
  },
  {
    titulo: '🖥️ Desktop (sm+ / md+): intocado',
    itens: [
      'Sidebar fixa à esquerda e Topbar com título da página, seletor de loja, Ajuda, Notificações e Perfil — layout idêntico ao anterior.',
      'O cabeçalho mobile (md:hidden) só existe abaixo de 768px; acima disso o painel é exatamente como era antes desta mudança.',
    ],
  },
  {
    titulo: '🔒 O que NÃO mudou',
    itens: [
      'Nenhuma funcionalidade foi alterada: navegação, permissões, badges, busca de telas, logout e seletor de loja continuam iguais.',
      'Apenas o leiaute do cabeçalho e da gaveta no celular foi ampliado para o padrão do site público.',
    ],
  },
]

export default function AdminLayoutLogicaTela() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-xs text-vinho hover:text-dourado-dark flex items-center gap-1.5 transition-all font-bold bg-marfim border border-vinho/15 hover:border-dourado px-3 py-1.5 rounded-full shadow-2xs"
          title="Como o layout do painel se comporta no celular e no desktop"
          aria-label="Lógica da Tela — Layout Administrativo"
        >
          <BookOpen className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-vinho font-bold">Lógica da Tela</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl bg-marfim">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-vinho">
            Lógica da Tela — Layout Administrativo
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-3">
          <div className="space-y-5">
            {SECOES.map((s) => (
              <div key={s.titulo}>
                <h4 className="font-semibold text-[#4B1E3F]">{s.titulo}</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {s.itens.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
