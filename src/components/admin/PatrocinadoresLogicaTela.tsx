// src/components/admin/PatrocinadoresLogicaTela.tsx
// Botão "Lógica da Tela" da tela Patrocinadores & Parceiros — documenta objetivo,
// ciclo de status, vínculo com episódios, entregas/pendências, materiais e permissões.

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
    titulo: '🤝 Objetivo da tela',
    itens: [
      'CRM de patrocínio do CoffeeCast 4.0: cadastra empresas parceiras, guarda o contato comercial, a modalidade (Cota Master, Cota por Episódio, Permuta, Apoio ou Outro), o valor do contrato e as contrapartidas acordadas por escrito.',
      'Cada parceiro é um registro da coleção "patrocinadores" (migration 1753000100018), exibido como card com logo, badges de modalidade/valor/episódios e faixa âmbar de pendências.',
      'Regra permanente: a Nine nunca informa preços de patrocínio — negociação é humana, conduzida pela equipe comercial.',
    ],
  },
  {
    titulo: '🔄 Ciclo de status',
    itens: [
      'Prospect → Em Negociação → Ativo → Pausado → Encerrado.',
      'Somente parceiros "Ativos" entram na receita ativa do resumo; cards com pendências em branco ganham destaque âmbar e entram na contagem "Com Pendências".',
      'Os filtros do topo (busca por empresa/segmento/contato + status) combinam-se entre si.',
    ],
  },
  {
    titulo: '🎬 Episódios vinculados',
    itens: [
      'No cadastro/edição, marque os episódios patrocinados na lista de checkboxes — o vínculo é uma relação real com a coleção "episodios", exibida como badge "N episódios" no card.',
    ],
  },
  {
    titulo: '📦 Entregas e pendências',
    itens: [
      '"Entregas realizadas" registra o que já foi cumprido (data + o que foi feito); "Pendências" lista o que ainda falta.',
      'Card com pendências ganha faixa âmbar e entra na contagem "Com Pendências" do resumo.',
    ],
  },
  {
    titulo: '🖼️ Materiais e logo',
    itens: [
      'Logo (PNG/JPG/WebP/SVG) aparece no card do parceiro.',
      'Materiais publicitários (até 10 arquivos por upload) ficam anexados ao registro para consulta da equipe.',
    ],
  },
  {
    titulo: '🔐 Permissões',
    itens: [
      'Lista, cadastro e edição: perfis master, adm e gerencial.',
      'Exclusão: apenas master e adm (regras de API aplicadas na collection patrocinadores).',
    ],
  },
]

export default function PatrocinadoresLogicaTela() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="mr-2 h-4 w-4" />
          Lógica da Tela
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl bg-marfim">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-vinho">
            Lógica da Tela — Patrocinadores &amp; Parceiros
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
