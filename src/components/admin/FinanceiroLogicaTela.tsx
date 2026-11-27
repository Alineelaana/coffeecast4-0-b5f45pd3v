// src/components/admin/FinanceiroLogicaTela.tsx
// Botão "Lógica da Tela" do Financeiro — documenta lançamentos, recorrência
// (repetir mensalmente ou por período) e o rateio igual entre integrantes.

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
    titulo: '💸 Lançamentos (base de tudo)',
    itens: [
      'Cada lançamento tem descrição, categoria (tipo), valor, data de vencimento e situação (quitado ou em aberto), além do tipo de movimentação (receita ou despesa).',
      'A divisão por integrante continua disponível no modo manual: informe quanto cada uma pagou campo a campo — a soma pode ficar diferente do valor total sem bloquear o salvamento.',
      'Lançamentos criados por recorrência aparecem na listagem como lançamentos comuns: cada um pode ser editado ou excluído individualmente, sem afetar os demais do grupo.',
    ],
  },
  {
    titulo: '🔁 Repetir lançamento (recorrência)',
    itens: [
      'No formulário (apenas ao CRIAR), na seção "Repetir lançamento", escolha "Não repetir", "Mensal" ou "Período personalizado".',
      'Mensal: repete na mesma data de vencimento dos meses seguintes. A data final é opcional — sem ela, o sistema cria 12 ocorrências (um ano).',
      'Período personalizado: informe data inicial e data final; o lançamento repete mensalmente entre as duas datas (a inicial conta como a primeira).',
      'Ao salvar, é gerado um lançamento por ocorrência, com o mesmo valor e divisão, e a descrição ganha o mês no final (ex.: "Aluguel — jan/2025").',
      'Todos os lançamentos do grupo recebem o selo violeta "Recorrente" com o intervalo original (ex.: "Recorrente · 01/01 → 01/06") para facilitar a identificação.',
      'Não há limite artificial de ocorrências: o que define a quantidade é o período escolhido (ex.: 05/01 até 05/06 = 6 lançamentos).',
    ],
  },
  {
    titulo: '⚖️ Dividir igualmente entre integrantes',
    itens: [
      'Marque "Dividir igualmente entre integrantes", selecione quem participa (checkbox) e informe o valor TOTAL — o sistema divide em partes iguais.',
      'A prévia aparece antes de salvar: ex. R$ 1.000,00 entre 4 integrantes → R$ 250,00 cada.',
      'O rateio arredonda para centavos: as primeiras recebem o valor cheio e a ÚLTIMA selecionada recebe o ajuste para fechar o total exato (ex.: R$ 100,00 entre 3 → R$ 33,34 + 33,33 + 33,33).',
      'Se uma integrante for desmarcada depois, o rateio é recalculado automaticamente na prévia.',
      'Pode ser combinado com a recorrência: o rateio calculado é replicado igualmente em todas as ocorrências (ex.: dividir R$ 300,00 mensais entre 3 → R$ 100,00 cada, em todos os meses).',
      'Ao marcar a divisão igual, os campos de divisão manual são limpos para evitar valores conflitantes.',
    ],
  },
  {
    titulo: '🧮 Resumo e cards',
    itens: [
      'Os cards do topo somam receitas, despesas e saldo a partir da listagem — sem dupla contagem: cada ocorrência da recorrência é um lançamento real.',
      'O card por integrante soma as divisões (manuais ou do rateio igual) de cada lançamento.',
      'Filtros de período/situacao continuam funcionando normalmente sobre os lançamentos gerados.',
    ],
  },
  {
    titulo: '🔐 Permissões e auditoria',
    itens: [
      'As permissões da tela seguem como estavam (matriz de telas do painel — Master/Adm/Gerencial).',
      'Toda criação, edição e exclusão de lançamento continua registrando evento na Auditoria, incluindo os gerados por recorrência e rateio.',
    ],
  },
]

export default function FinanceiroLogicaTela() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs border-vinho/20">
          <BookOpen className="mr-1.5 h-3.5 w-3.5 text-dourado" />
          Lógica da Tela
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl bg-marfim">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-vinho">
            Lógica da Tela — Financeiro
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
