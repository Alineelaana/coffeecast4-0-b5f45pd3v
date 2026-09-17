import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Download,
  Play,
  Clock,
  HardDrive,
  Calendar,
  AlertTriangle,
  FileJson,
  Layers,
  RefreshCw,
  Info,
  CheckCircle2,
  Tv,
  Camera,
  Users2,
  MessageSquareQuote,
  DollarSign,
  Inbox,
  FileText,
  Shield,
  Sparkles,
  Bot,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BackupService } from '@/services/backup'
import type { BackupRecord, BackupStatsInfo } from '@/types/database'
import { formatDateBR } from '@/lib/formatters'

export default function AdminBackupsScreen() {
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [stats, setStats] = useState<BackupStatsInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null)

  const loadData = async (silencioso = false) => {
    if (!silencioso) setLoading(true)
    try {
      const [list, statsData] = await Promise.all([
        BackupService.listarBackups(),
        BackupService.obterStats(),
      ])
      setBackups(list)
      setStats(statsData)
    } catch (err) {
      console.error('Erro ao carregar dados de backup:', err)
      toast.error('Não foi possível carregar os dados de backup.')
    } finally {
      if (!silencioso) setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateBackup = async () => {
    setCreating(true)
    try {
      const res = await BackupService.criarBackupManual()
      toast.success(res.message || 'Backup manual gerado com sucesso!')
      await loadData(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao gerar backup manual.')
    } finally {
      setCreating(false)
    }
  }

  const handleDownload = async (backup: BackupRecord) => {
    setDownloadingId(backup.id)
    try {
      await BackupService.baixarBackup(backup)
      toast.success(`Download de "${backup.nome_arquivo}" iniciado!`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Falha ao realizar download do backup.')
    } finally {
      setDownloadingId(null)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 KB'
    const k = 1024
    if (bytes < k) return bytes + ' B'
    if (bytes < k * k) return (bytes / k).toFixed(1) + ' KB'
    return (bytes / (k * k)).toFixed(2) + ' MB'
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  // Coleções sensíveis em destaque para conferência do Master
  const colecoesSensíveis = [
    {
      key: 'episodios',
      label: 'Episódios',
      desc: 'Vídeos e programas publicados',
      icon: Tv,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      key: 'momentos',
      label: 'Nossos Momentos',
      desc: 'Galeria fotográfica dos bastidores',
      icon: Camera,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10',
    },
    {
      key: 'integrantes',
      label: 'Integrantes',
      desc: 'Membros da bancada e equipe',
      icon: Users2,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      key: 'depoimentos',
      label: 'Depoimentos',
      desc: 'Avaliações de convidados e público',
      icon: MessageSquareQuote,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
  ]

  const outrasColecoes = [
    { key: 'users', label: 'Usuários Cadastrados', icon: Users2 },
    { key: 'contatos', label: 'Contatos & Leads', icon: Inbox },
    { key: 'transacoes', label: 'Movimentações Financeiras', icon: DollarSign },
    { key: 'roteiros_convidados', label: 'Roteiros de Convidados', icon: FileText },
    { key: 'nine_conversas', label: 'Conversas com a Nine', icon: Bot },
    { key: 'chat_mensagens', label: 'Mensagens do Chat', icon: MessageSquareQuote },
  ]

  return (
    <div className="space-y-6 pb-12">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-vinho/10 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-dourado text-vinho font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
              Exclusivo Master
            </Badge>
            <span className="text-xs text-vinho/60 font-medium">CoffeeCast 4.0 Core</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-vinho mt-1 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-dourado" />
            Central de Backups & Proteção de Dados
          </h1>
          <p className="text-xs text-vinho/70 max-w-2xl mt-1">
            Garante a persistência, integridade e recuperação rápida de todo o acervo do CoffeeCast:
            episódios, momentos, integrantes, depoimentos, dados de membros e configurações vitais.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(false)}
            disabled={loading || creating}
            className="border-vinho/20 text-vinho hover:bg-marfim hover:text-dourado-dark text-xs h-10 px-3.5 rounded-xl gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            onClick={handleCreateBackup}
            disabled={loading || creating}
            className="bg-vinho hover:bg-vinho-dark text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md border border-dourado/40 gap-2 transition-all hover:scale-[1.02] active:scale-95"
          >
            {creating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-dourado" />
                <span>Processando Snapshot...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-dourado fill-dourado" />
                <span>Fazer Backup Agora</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* CARDS DE STATUS DO CRON E ROTINA AUTOMÁTICA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Job Agendado */}
        <Card className="border-vinho/10 shadow-xs bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-vinho/60">
                Rotina Automática (Cron)
              </span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <CardTitle className="text-base text-vinho flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-dourado" />
              Diário (Madrugada)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-vinho/80">
            <p className="flex items-center justify-between">
              <span className="text-vinho/60">Horário programado:</span>
              <span className="font-semibold text-vinho">03:00 UTC (00:00 Brasília)</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-vinho/60">Retenção de segurança:</span>
              <span className="font-semibold text-vinho">Últimos 30 backups</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-vinho/60">Status do agendador:</span>
              <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 text-[10px] font-bold">
                Ativo no Backend
              </Badge>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Último Backup Automático */}
        <Card className="border-vinho/10 shadow-xs bg-white">
          <CardHeader className="pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-vinho/60">
              Último Backup Automático
            </span>
            <CardTitle className="text-base text-vinho flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-dourado" />
              {stats?.ultimo_backup_automatico
                ? formatDateTime(stats.ultimo_backup_automatico.created)
                : 'Aguardando 1º ciclo noturno'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-vinho/80">
            {stats?.ultimo_backup_automatico ? (
              <>
                <p className="flex items-center justify-between">
                  <span className="text-vinho/60">Registros salvos:</span>
                  <span className="font-semibold text-vinho">
                    {stats.ultimo_backup_automatico.total_registros} itens
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-vinho/60">Tamanho do snapshot:</span>
                  <span className="font-semibold text-vinho">
                    {formatFileSize(stats.ultimo_backup_automatico.tamanho_bytes)}
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-vinho/60">Arquivo:</span>
                  <span className="font-mono text-[11px] truncate max-w-[150px] text-vinho/70">
                    {stats.ultimo_backup_automatico.nome_arquivo}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-vinho/60 text-[11px] leading-relaxed">
                O job cron dispara automaticamente todos os dias às 03:00 UTC. Você também pode
                disparar um backup manual a qualquer instante.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Estado Geral do Acervo */}
        <Card className="border-vinho/10 shadow-xs bg-white">
          <CardHeader className="pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-vinho/60">
              Acervo Total Protegido
            </span>
            <CardTitle className="text-base text-vinho flex items-center gap-2 mt-1">
              <HardDrive className="w-4 h-4 text-dourado" />
              {backups.length} snapshots armazenados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-vinho/80">
            <p className="flex items-center justify-between">
              <span className="text-vinho/60">Último snapshot geral:</span>
              <span className="font-semibold text-vinho">
                {stats?.ultimo_backup
                  ? formatDateTime(stats.ultimo_backup.created)
                  : 'Nenhum ainda'}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-vinho/60">Tipo mais recente:</span>
              <Badge
                className={
                  stats?.ultimo_backup?.tipo === 'automatico'
                    ? 'bg-blue-500/15 text-blue-700 text-[10px]'
                    : 'bg-purple-500/15 text-purple-700 text-[10px]'
                }
              >
                {stats?.ultimo_backup?.tipo === 'automatico' ? 'Automático' : 'Manual'}
              </Badge>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-vinho/60">Integridade geral:</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Protegido
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PAINEL DE SEGURANÇA DO CONTEÚDO (CONFERÊNCIA VISUAL CONTRA INCIDENTES) */}
      <Card className="border-vinho/15 shadow-sm bg-gradient-to-br from-white via-[#FAF8F5] to-white">
        <CardHeader className="pb-3 border-b border-vinho/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-vinho/10 text-vinho text-[10px] font-bold">
                  Conferência Visual
                </Badge>
                <span className="text-[11px] text-vinho/60 font-medium">Anti-Incidentes</span>
              </div>
              <CardTitle className="text-lg font-serif font-bold text-vinho mt-1 flex items-center gap-2">
                <Shield className="w-5 h-5 text-dourado" />
                Painel de Segurança do Conteúdo Sensível
              </CardTitle>
              <CardDescription className="text-xs text-vinho/70">
                Acompanhe o número exato de registros em tempo real. Se ocorrer qualquer anomalia
                visual no site, este painel confirma se os dados continuam intactos no banco.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">Banco Skip Cloud / PocketBase Operacional</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-6">
          {/* Coleções Críticas do Incidente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {colecoesSensíveis.map((c) => {
              const Icon = c.icon
              const count = stats?.contadores_atuais?.[c.key] ?? '-'
              return (
                <div
                  key={c.key}
                  className="p-4 rounded-xl border border-vinho/15 bg-white shadow-2xs hover:border-dourado/50 transition-all flex items-start gap-3"
                >
                  <div className={`p-3 rounded-xl ${c.bg} shrink-0`}>
                    <Icon className={`w-5 h-5 ${c.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-vinho truncate">{c.label}</p>
                    <p className="text-[10px] text-vinho/60 truncate">{c.desc}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-serif font-black text-vinho">
                        {loading ? '...' : count}
                      </span>
                      <span className="text-[10px] text-vinho/60 uppercase font-semibold">
                        no ar
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Outras coleções vitais */}
          <div className="pt-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-vinho/60 mb-2.5">
              Demais Coleções Monitoradas
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {outrasColecoes.map((col) => {
                const Icon = col.icon
                const count = stats?.contadores_atuais?.[col.key] ?? '-'
                return (
                  <div
                    key={col.key}
                    className="p-2.5 rounded-xl bg-white border border-vinho/10 text-center flex flex-col items-center justify-center shadow-2xs"
                  >
                    <Icon className="w-3.5 h-3.5 text-dourado mb-1" />
                    <span className="text-base font-bold text-vinho leading-none font-serif">
                      {loading ? '...' : count}
                    </span>
                    <span className="text-[10px] text-vinho/70 truncate max-w-full mt-0.5">
                      {col.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LISTA DE BACKUPS ARMAZENADOS COM DOWNLOAD */}
      <Card className="border-vinho/10 shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-vinho/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-serif font-bold text-vinho flex items-center gap-2">
                <FileJson className="w-5 h-5 text-dourado" />
                Histórico de Snapshots Persistidos ({backups.length})
              </CardTitle>
              <CardDescription className="text-xs text-vinho/70">
                Cada snapshot contém a estrutura integral de coleções e registros em JSON puro,
                pronto para arquivamento externo seguro.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-0 sm:p-6">
          {loading && backups.length === 0 ? (
            <div className="py-12 text-center text-xs text-vinho/60 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-dourado" />
              <span>Carregando backups do sistema...</span>
            </div>
          ) : backups.length === 0 ? (
            <div className="py-12 text-center text-xs text-vinho/60 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-vinho/5 flex items-center justify-center text-vinho">
                <HardDrive className="w-6 h-6 text-dourado" />
              </div>
              <p className="font-semibold text-vinho">Nenhum backup gerado ainda</p>
              <p className="max-w-md text-vinho/60 text-[11px]">
                Clique no botão <strong>"Fazer Backup Agora"</strong> acima para criar o primeiro
                snapshot completo de segurança do CoffeeCast.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-vinho/10 text-[11px] font-bold uppercase tracking-wider text-vinho/60 bg-marfim/30">
                    <th className="py-3 px-4">Arquivo & Data/Hora</th>
                    <th className="py-3 px-3">Origem</th>
                    <th className="py-3 px-3">Registros</th>
                    <th className="py-3 px-3">Tamanho</th>
                    <th className="py-3 px-3">Autor</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vinho/5 text-xs text-vinho">
                  {backups.map((b) => {
                    const isAuto = b.tipo === 'automatico'
                    const isDownloading = downloadingId === b.id

                    return (
                      <tr key={b.id} className="hover:bg-marfim/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-vinho/5 text-dourado shrink-0">
                              <FileJson className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-mono text-xs font-bold text-vinho truncate max-w-[240px] sm:max-w-[340px]">
                                {b.nome_arquivo}
                              </p>
                              <p className="text-[10px] text-vinho/60 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-dourado/80" />
                                {formatDateTime(b.created)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            className={
                              isAuto
                                ? 'bg-blue-500/15 text-blue-700 border-blue-500/20 text-[10px]'
                                : 'bg-purple-500/15 text-purple-700 border-purple-500/20 text-[10px]'
                            }
                          >
                            {isAuto ? 'Automático (Cron)' : 'Manual (Master)'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-vinho">
                            {b.total_registros ?? '-'}
                          </span>
                          <span className="text-[10px] text-vinho/60 block">registros</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-vinho/80">
                          {formatFileSize(b.tamanho_bytes)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-medium text-vinho truncate block max-w-[130px]">
                            {b.criado_por_nome || b.criado_por_email || 'Sistema'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBackup(b)}
                              className="h-8 px-2.5 text-[11px] text-vinho border-vinho/20 hover:bg-vinho/5"
                              title="Ver resumo de coleções incluídas"
                            >
                              <Info className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline ml-1">Detalhes</span>
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleDownload(b)}
                              disabled={isDownloading}
                              className="bg-vinho hover:bg-vinho-dark text-white h-8 px-3 text-[11px] font-bold rounded-lg shadow-2xs gap-1.5 border border-dourado/40"
                              title="Baixar arquivo JSON completo"
                            >
                              {isDownloading ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-dourado" />
                              ) : (
                                <Download className="w-3.5 h-3.5 text-dourado" />
                              )}
                              <span>Baixar JSON</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NOTA DE SEGURANÇA E INSTRUÇÕES DE RECUPERAÇÃO MANUAL */}
      <Card className="border-amber-200 bg-amber-50/60 shadow-2xs">
        <CardContent className="p-4 sm:p-5 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs text-amber-900 leading-relaxed">
            <p className="font-bold text-amber-950 flex items-center gap-1.5">
              <span>Política de Restauração Segura (Zero Sobrescrita Acidental)</span>
            </p>
            <p>
              Por diretriz estrita de segurança, esta área não possui botões de restauração em lote
              com um único clique — prevenindo que dados atuais recentes sejam sobrescritos por
              engano.
            </p>
            <p className="text-[11px] text-amber-800">
              <strong>Como utilizar o arquivo baixado:</strong> O download gera um arquivo{' '}
              <code className="bg-amber-100/80 px-1 py-0.5 rounded text-amber-950 font-mono">
                .json
              </code>{' '}
              padronizado com todos os registros organizados por tabela (episódios, momentos,
              integrantes, depoimentos, etc.). Em caso de falha externa ou migração de
              infraestrutura, os registros podem ser inspecionados ou reinseridos via PocketBase
              Admin / script de migração com total controle e segurança de dados.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* MODAL / DIALOG DE DETALHES DO BACKUP SELECIONADO */}
      {selectedBackup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-vinho/15 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-vinho/10">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-dourado" />
                <h3 className="font-serif font-bold text-base text-vinho">Resumo do Snapshot</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBackup(null)}
                className="h-8 w-8 p-0 text-vinho/60 hover:text-vinho"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-2 text-xs text-vinho">
              <p>
                <strong className="text-vinho/70">Arquivo:</strong>{' '}
                <span className="font-mono">{selectedBackup.nome_arquivo}</span>
              </p>
              <p>
                <strong className="text-vinho/70">Data de Geração:</strong>{' '}
                {formatDateTime(selectedBackup.created)}
              </p>
              <p>
                <strong className="text-vinho/70">Tipo:</strong>{' '}
                <Badge
                  className={
                    selectedBackup.tipo === 'automatico'
                      ? 'bg-blue-500/15 text-blue-700'
                      : 'bg-purple-500/15 text-purple-700'
                  }
                >
                  {selectedBackup.tipo === 'automatico' ? 'Automático' : 'Manual'}
                </Badge>
              </p>
              <p>
                <strong className="text-vinho/70">Tamanho Estimado:</strong>{' '}
                {formatFileSize(selectedBackup.tamanho_bytes)}
              </p>
              <p>
                <strong className="text-vinho/70">Total de Registros Gravados:</strong>{' '}
                <span className="font-bold text-vinho">
                  {selectedBackup.total_registros ?? 'N/D'}
                </span>
              </p>
            </div>

            {selectedBackup.resumo_colecoes && (
              <div className="pt-2 border-t border-vinho/10 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-vinho/60">
                  Distribuição por Coleção
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs max-h-48 overflow-y-auto pr-1">
                  {Object.entries(selectedBackup.resumo_colecoes).map(([col, total]) => (
                    <div
                      key={col}
                      className="p-2 rounded-lg bg-marfim/60 border border-vinho/10 flex items-center justify-between"
                    >
                      <span className="font-mono text-[11px] text-vinho/80 truncate">{col}</span>
                      <span className="font-bold text-vinho">{total as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-vinho/10 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBackup(null)}
                className="text-xs"
              >
                Fechar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleDownload(selectedBackup)
                  setSelectedBackup(null)
                }}
                className="bg-vinho text-white hover:bg-vinho-dark font-bold text-xs gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-dourado" />
                Baixar Este Snapshot
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
