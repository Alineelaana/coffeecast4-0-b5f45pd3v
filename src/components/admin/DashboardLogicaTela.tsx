// src/components/admin/DashboardLogicaTela.tsx
// Botão "Lógica da Tela" do Dashboard — documenta os indicadores reais do painel.

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
    titulo: '📊 Indicadores conectados aos dados reais',
    itens: [
      'Todos os números do painel são calculados em tempo real a partir das coleções do banco — nenhum valor é fixo ou manual.',
      'Episódios no Ar: conta os episódios com status "publicado". Episódios "programado" (em edição/agendados) NÃO entram no total.',
      'Episódios Programados: os que ainda vão ao ar, com data de publicação futura — mostrados junto ao card de episódios.',
      'Contatos Novos: propostas recebidas pelo site com status "novo" (ainda não visualizadas pela equipe).',
      'Gastos em Aberto: despesas do Financeiro com situação "em aberto" (a quitar).',
      'Gravações na Agenda: apenas compromissos com data de gravação de HOJEm diante — gravações passadas saem do contador.',
      'Banco de Horas: soma das horas compradas menos as horas utilizadas pela Agenda (mesma conta do módulo Controle de Horas).',
    ],
  },
  {
    titulo: '🔗 De onde vem cada informação (fonte única de verdade)',
    itens: [
      'Episódios → coleção "episodios" (módulo Episódios é o dono do status de publicação).',
      'Contatos/Leads → coleção "contatos" (módulo Contatos & Leads é o dono do status comercial).',
      'Despesas → coleção "transacoes" (módulo Financeiro é o dono das situações de pagamento).',
      'Agenda → coleção "agenda" (módulo Agenda é o dono das datas de gravação e postagem).',
      'Horas → coleções "horas_compradas" + "agenda" (o débito é o campo horas_utilizadas de cada compromisso).',
      'O Dashboard não cadastra nada: é leitura pura. Alterar status/datas acontece na tela responsável e o painel reflete automaticamente.',
    ],
  },
  {
    titulo: '🧭 Painéis de acompanhamento',
    itens: [
      'Próximas Gravações: os 5 compromissos futuros mais próximos, com convidado(a) e data — clique em "Ver todas" para abrir a Agenda.',
      'Últimas Propostas Recebidas: os 5 contatos mais recentes com o status de atendimento — clique em "Ver todas" para abrir Contatos & Leads.',
      'Distribuição de Gastos: gráfico real por categoria (gravação, edição, equipamento, marketing etc.), somando apenas despesas.',
    ],
  },
  {
    titulo: '🔐 Permissões',
    itens: [
      'O Dashboard respeita as permissões de tela configuradas pelo Master (campo allowedScreens).',
      'Não expõe dados comerciais confidenciais: mostra apenas contadores e os contatos mais recentes, conforme o perfil autenticado.',
    ],
  },
]

export default function DashboardLogicaTela() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs border-vinho/20">
          <BookOpen className="mr-1.5 h-3.5 w-3.5 text-dourado" />
          Lógica da Tela
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-marfim">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-vinho">
            Lógica da Tela — Dashboard
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
