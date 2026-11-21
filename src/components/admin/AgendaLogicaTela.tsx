// src/components/admin/AgendaLogicaTela.tsx
// Botão "Lógica da Tela" da Agenda & Planejamento — documenta o calendário
// interativo, o cadastro de compromissos e o vínculo com o Banco de Horas.

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
    titulo: '📅 Calendário interativo',
    itens: [
      'Visão padrão da Agenda: mês corrente com os compromissos marcados direto nos dias.',
      'CLIQUE NO DIA: abre o cadastro de um novo compromisso com a data daquele dia já preenchida (Data Agendamento e Data Gravação = dia clicado).',
      'CLIQUE NO COMPROMISSO (dentro do dia): abre o cadastro do episódio no modo edição, com todos os campos carregados — visualize e altere sem sair do calendário.',
      'As cores seguem a legenda oficial: Vinho (teve gravação), Dourado (teve postagem), Esmeralda (gravação futura) e Rosé Nobre (postagem prevista).',
      'Botão "Hoje": volta ao mês corrente e seleciona o dia de hoje. Os dias de outros meses (apagados) também são clicáveis.',
      'Clicando em um dia, o painel de detalhes mostra tudo que está naquela data (gravações e postagens), com botões Editar e Excluir por item.',
    ],
  },
  {
    titulo: '☕ Cadastro de compromisso (mesma ficha, dois caminhos)',
    itens: [
      'Mesma ficha pelo botão "Novo Agendamento" ou pelo clique no dia do calendário — mesma coleção "agenda", sem cadastro duplicado.',
      'Campos: título do episódio, Data Agendamento, Data Gravação, Hora da Gravação (opcional — dia inteiro), Horas a Utilizar e Previsão de Postagem.',
      'Horas a Utilizar é o débito no Banco de Horas do estúdio (permite 0,5h; 0h = isento). Ao salvar, as horas são debitadas e o saldo aparece no topo da tela.',
      'Convidado(a): ao ativar, cadastre nome, empresa e biografia — dados que alimentam o episódio e os convites.',
      'Patrocínio: ao ativar, informe os patrocinadores do episódio.',
      'Imagens: até 6 por episódio (fotos do convidado, logo da empresa, marcas) — as já salvas podem ser abertas ou removidas.',
    ],
  },
  {
    titulo: '🗂️ Organização da agenda',
    itens: [
      'Mostrar no Calendário: visão interativa padrão (o clique no dia agenda).',
      'Agenda Futura: gravações e postagens de hoje em diante, em lista.',
      'Agenda Passada: histórico do que já aconteceu, em lista.',
      'Selecionar Período: recorte por intervalo de datas de gravação.',
      'Todos: a lista completa de episódios, com contador.',
      'Em lista, cada linha/cards têm Editar e Excluir; excluir devolve as horas vinculadas ao Banco de Horas.',
    ],
  },
  {
    titulo: '🕘 Banco de Horas',
    itens: [
      'O saldo disponível aparece no topo ("Banco de Horas: Xh disponíveis") e detalha no módulo Controle de Horas.',
      'Cada compromisso grava as horas utilizadas; ao excluir, o valor é estornado ao saldo.',
      'O aviso antes de salvar mostra quantas horas serão debitadas e o saldo atual.',
    ],
  },
  {
    titulo: '🔐 Permissões e auditoria',
    itens: [
      'Acesso à tela segue as regras de permissões do painel (marcadas pelo Master).',
      'Toda criação, edição e exclusão de agendamento registra evento na Auditoria (área "Agenda de Gravação"), com antes/depois dos dados.',
    ],
  },
]

export default function AgendaLogicaTela() {
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
            Lógica da Tela — Agenda & Planejamento
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
