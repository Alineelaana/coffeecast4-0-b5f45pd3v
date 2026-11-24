// src/pages/admin/AdminBackupExportacaoScreen.tsx
// Seção "Backup & Exportação" do painel CoffeeCast 4.0.
// Exportação CSV/JSON das principais coleções + backup completo em um JSON.
// Visível apenas para Master e ADM com a tela liberada (key "backup_exportacao").

import React, { useState } from 'react'
import { Download, FileJson, FileSpreadsheet, DatabaseBackup, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  COLECOES_EXPORTAVEIS,
  exportarColecao,
  gerarBackupCompleto,
  ResultadoExportacao,
} from '@/services/backupExportacao'
import { useAuth } from '@/context/AuthContext'
import BackupExportacaoLogicaTela from '@/components/admin/BackupExportacaoLogicaTela'

export default function AdminBackupExportacaoScreen() {
  const { user, hasScreenPermission } = useAuth()
  const [emProgresso, setEmProgresso] = useState<string | null>(null)
  const [resultados, setResultados] = useState<ResultadoExportacao[]>([])

  const podeVerTela = hasScreenPermission

  const handleExportar = async (colecao: string, formato: 'csv' | 'json') => {
    const item = COLECOES_EXPORTAVEIS.find((c) => c.colecao === colecao)
    if (!item) return
    setEmProgresso(`${colecao}:${formato}`)
    try {
      const res = await exportarColecao(item, formato)
      if (res.sucesso) {
        setResultados((prev) => [...prev.filter((r) => r.colecao !== colecao), res])
        toast.success(`${res.rotulo}: ${res.registros} registro(s) exportado(s).`)
      } else {
        toast.error(`${res.rotulo}: ${res.motivo || 'falha na exportação'}.`)
      }
    } finally {
      setEmProgresso(null)
    }
  }

  const handleBackupCompleto = async () => {
    setEmProgresso('completo')
    try {
      const res = await gerarBackupCompleto(podeVerTela, (i, t, rotulo) => {
        if (i < t) toast.info(`Coletando (${i + 1}/${t}): ${rotulo}...`)
      })
      setResultados(res)
      const ok = res.filter((r) => r.sucesso)
      const falhas = res.filter((r) => !r.sucesso)
      if (falhas.length === 0) {
        toast.success(
          `Backup completo gerado: ${ok.reduce((s, r) => s + r.registros, 0)} registro(s).`,
        )
      } else {
        toast.warning(
          `Backup gerado com ${ok.length} coleção(ões); ${falhas.length} coleção(ões) restrita(s) não incluída(s).`,
        )
      }
    } finally {
      setEmProgresso(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">
            Backup & Exportação
          </h2>
          <p className="text-xs text-vinho/70">
            Proteja o ativo do negócio: baixe leads, episódios, roteiros e demais dados em CSV
            (Excel) ou JSON (backup fiel), ou gere um backup completo de uma vez.
          </p>
        </div>
        <BackupExportacaoLogicaTela />
      </div>

      <div className="bg-dourado/10 border border-dourado/40 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-dourado-dark shrink-0 mt-0.5" />
        <p className="text-xs text-vinho/85 leading-relaxed">
          <strong>Recomendação:</strong> gere um backup completo periodicamente (por exemplo, toda
          semana ou após grandes cadastros) e guarde o arquivo em local seguro fora do site (HD
          externo, Google Drive). A exportação respeita as suas permissões: coleções de telas que
          você não pode ver NÃO entram no arquivo.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-vinho/10 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vinho/10 flex items-center justify-center">
              <DatabaseBackup className="w-5 h-5 text-vinho" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-vinho">Backup completo</h3>
              <p className="text-[11px] text-vinho/60">
                Um único arquivo JSON com todas as coleções que você pode ver + data/hora no nome.
              </p>
            </div>
          </div>
          <Button
            onClick={handleBackupCompleto}
            disabled={emProgresso !== null}
            className="w-full sm:w-auto bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-xl sm:rounded-full px-5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
          >
            {emProgresso === 'completo' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileJson className="w-4 h-4 text-dourado" />
            )}
            {emProgresso === 'completo' ? 'Gerando backup...' : 'Gerar backup completo'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-vinho/10 overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-vinho/10">
          <h3 className="font-serif text-base font-bold text-vinho">Exportar por coleção</h3>
          <p className="text-[11px] text-vinho/60">
            O CSV usa ponto-e-vírgula e BOM UTF-8 — abre direto no Excel brasileiro. O JSON é o
            backup fiel, incluindo campos opcionais vazios.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-marfim/60">
                <TableHead className="text-vinho font-bold text-[11px]">Coleção</TableHead>
                <TableHead className="text-vinho font-bold text-[11px] hidden md:table-cell">
                  O que contém
                </TableHead>
                <TableHead className="text-vinho font-bold text-[11px] text-center">
                  Exportar
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COLECOES_EXPORTAVEIS.filter((c) => podeVerTela(c.screenKey)).length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-xs text-vinho/60 py-8">
                    Nenhuma coleção liberada para o seu perfil.
                  </TableCell>
                </TableRow>
              )}
              {COLECOES_EXPORTAVEIS.map((c) => {
                const permitido = podeVerTela(c.screenKey)
                const res = resultados.find((r) => r.colecao === c.colecao)
                return (
                  <TableRow
                    key={`${c.colecao}-${c.screenKey}`}
                    className={!permitido ? 'opacity-40' : ''}
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-vinho">{c.rotulo}</span>
                        <Badge className="bg-vinho/10 text-vinho/70 text-[9px] font-semibold px-1.5 py-0">
                          {c.colecao}
                        </Badge>
                        {!permitido && (
                          <Badge className="bg-rose-brand/20 text-vinho/70 text-[9px] font-semibold px-1.5 py-0">
                            Sem permissão
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-vinho/55 md:hidden mt-0.5">{c.descricao}</p>
                    </TableCell>
                    <TableCell className="py-3 hidden md:table-cell">
                      <span className="text-[11px] text-vinho/70">{c.descricao}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {(['csv', 'json'] as const).map((fmt) => (
                          <Button
                            key={fmt}
                            size="sm"
                            variant="outline"
                            disabled={!permitido || emProgresso !== null}
                            onClick={() => handleExportar(c.colecao, fmt)}
                            className="h-8 px-2.5 text-[10px] font-bold border-vinho/20 text-vinho hover:bg-vinho/5 flex items-center gap-1"
                            title={
                              permitido
                                ? `Baixar ${fmt.toUpperCase()} de ${c.rotulo}`
                                : 'Sua permissão não inclui esta tela'
                            }
                          >
                            {emProgresso === `${c.colecao}:${fmt}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : fmt === 'csv' ? (
                              <FileSpreadsheet className="w-3.5 h-3.5 text-dourado-dark" />
                            ) : (
                              <FileJson className="w-3.5 h-3.5 text-dourado-dark" />
                            )}
                            {fmt.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {resultados.length > 0 && (
        <div className="bg-white rounded-2xl border border-vinho/10 p-4 sm:p-5 space-y-2">
          <h3 className="font-serif text-base font-bold text-vinho">
            Última exportação — registros por coleção
          </h3>
          <ul className="space-y-1">
            {resultados.map((r) => (
              <li key={r.colecao} className="text-xs text-vinho/80 flex items-center gap-2">
                {r.sucesso ? (
                  <Download className="w-3.5 h-3.5 text-dourado-dark" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-rose-brand" />
                )}
                <span className="font-semibold">{r.rotulo}:</span>
                {r.sucesso ? (
                  <span>{r.registros} registro(s)</span>
                ) : (
                  <span className="text-vinho/60">{r.motivo}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
