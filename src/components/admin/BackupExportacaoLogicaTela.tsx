// src/components/admin/BackupExportacaoLogicaTela.tsx
// Botão "Lógica da Tela" da seção Backup & Exportação — documenta como a
// exportação funciona, o que entra em cada formato e as regras de permissão.

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
    titulo: '🎯 O que é o Backup & Exportação',
    itens: [
      'É a proteção do ativo do negócio: leads, roteiros, episódios e demais dados podem ser baixados a qualquer momento para arquivo local.',
      'Dois formatos: CSV (abre no Excel brasileiro, separador ";" e BOM UTF-8) e JSON (backup fiel, com todos os campos, incluindo os opcionais vazios).',
      'O "Gerar backup completo" baixa UM único arquivo JSON com todas as coleções que você pode ver, com data e hora no nome (ex.: coffeecast-backup-2026-01-15-1010.json).',
    ],
  },
  {
    titulo: '📊 Como os registros são contados',
    itens: [
      'Ao exportar, a tela informa quantos registros de cada coleção foram incluídos no arquivo.',
      'No backup completo, coleções sem permissão de leitura ficam de fora e aparecem como "restritas" no resumo.',
    ],
  },
  {
    titulo: '🔒 Permissões (mesma matriz das telas e da Nine Online)',
    itens: [
      'A exportação usa a MESMA matriz de permissões de telas do painel: se você não enxerga a tela de Leads, o arquivo não contém os dados de leads.',
      'Master: acesso a todas as coleções. ADM: apenas as telas liberadas pelo Master em Usuários & Permissões.',
      'A exportação acontece com a sua própria sessão — as regras de segurança do banco também limitam o que chega no arquivo.',
    ],
  },
  {
    titulo: '✅ Recomendação de rotina',
    itens: [
      'Gere um backup completo semanalmente (ou após grandes cadastros, como um episódio novo ou uma campanha de leads).',
      'Guarde o arquivo fora do site: HD externo, Google Drive ou outro local seguro — assim nenhum imprevisto apaga o histórico do podcast.',
      'Arquivos antigos podem ser mantidos como histórico: o nome do arquivo já traz a data/hora da geração.',
    ],
  },
]

export default function BackupExportacaoLogicaTela() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-xs text-vinho hover:text-dourado-dark flex items-center gap-1.5 transition-all font-bold bg-marfim border border-vinho/15 hover:border-dourado px-3 py-1.5 rounded-full shadow-2xs min-h-[38px]"
          title="Como funciona o Backup & Exportação"
          aria-label="Lógica da Tela — Backup & Exportação"
        >
          <BookOpen className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-vinho font-bold">Lógica da Tela</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl bg-marfim">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-vinho">
            Lógica da Tela — Backup & Exportação
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
