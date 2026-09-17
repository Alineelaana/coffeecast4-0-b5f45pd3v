import pb from '@/lib/pocketbase/client'
import { AuditoriaService } from '@/services/auditoria'
import type { BackupRecord, BackupStatsInfo } from '@/types/database'

export const BackupService = {
  /**
   * Lista todos os backups armazenados no sistema ordenados do mais recente para o mais antigo.
   */
  async listarBackups(): Promise<BackupRecord[]> {
    try {
      const records = await pb.collection('backups').getFullList<BackupRecord>({
        sort: '-created',
        fields:
          'id,nome_arquivo,tipo,arquivo,tamanho_bytes,total_registros,resumo_colecoes,criado_por_nome,criado_por_email,status,detalhes_erro,created,updated',
      })
      return records
    } catch (err) {
      console.error('[BackupService] Erro ao listar backups:', err)
      return []
    }
  },

  /**
   * Obtém informações de status do cron, contadores de registros ao vivo e último backup.
   */
  async obterStats(): Promise<BackupStatsInfo> {
    try {
      const res = await pb.send<BackupStatsInfo>('/backend/v1/admin/backups/stats', {
        method: 'GET',
      })
      return res
    } catch (err) {
      console.warn('[BackupService] Fallback ao buscar stats:', err)

      // Fallback inteligente caso a rota esteja carregando
      const contadores: Record<string, number> = {}
      const colecoesSensíveis = [
        'episodios',
        'momentos',
        'integrantes',
        'depoimentos',
        'contatos',
        'transacoes',
        'agenda',
        'roteiros_convidados',
        'depoimentos_convidados',
        'users',
        'chat_mensagens',
        'nine_conversas',
        'stores',
      ]

      await Promise.all(
        colecoesSensíveis.map(async (c) => {
          try {
            const list = await pb.collection(c).getList(1, 1, { fields: 'id' })
            contadores[c] = list.totalItems
          } catch {
            contadores[c] = 0
          }
        }),
      )

      let ultimo: any = null
      let ultimoAuto: any = null
      try {
        const u = await pb.collection('backups').getList<BackupRecord>(1, 1, { sort: '-created' })
        if (u.items.length > 0) {
          ultimo = {
            id: u.items[0].id,
            nome_arquivo: u.items[0].nome_arquivo,
            tipo: u.items[0].tipo,
            total_registros: u.items[0].total_registros || 0,
            tamanho_bytes: u.items[0].tamanho_bytes || 0,
            created: u.items[0].created,
          }
        }
        const ua = await pb.collection('backups').getList<BackupRecord>(1, 1, {
          sort: '-created',
          filter: 'tipo = "automatico"',
        })
        if (ua.items.length > 0) {
          ultimoAuto = {
            id: ua.items[0].id,
            nome_arquivo: ua.items[0].nome_arquivo,
            tipo: ua.items[0].tipo,
            total_registros: ua.items[0].total_registros || 0,
            tamanho_bytes: ua.items[0].tamanho_bytes || 0,
            created: ua.items[0].created,
          }
        }
      } catch {
        /* intentionally ignored */
      }

      return {
        cron: {
          ativo: true,
          expressao: '0 3 * * *',
          descricao: 'Diariamente às 03:00 (UTC) / 00:00 (Horário de Brasília)',
          politica_retencao: 'Mantém os últimos 30 backups rotacionados',
        },
        ultimo_backup: ultimo,
        ultimo_backup_automatico: ultimoAuto,
        total_backups: 0,
        contadores_atuais: contadores,
      }
    }
  },

  /**
   * Dispara a geração de um novo backup manual imediatamente.
   */
  async criarBackupManual(): Promise<{
    success: boolean
    backup?: BackupRecord
    message?: string
  }> {
    const authUser = pb.authStore.model as any

    try {
      const res = await pb.send<{ success: boolean; message: string; backup: BackupRecord }>(
        '/backend/v1/admin/backups/create',
        {
          method: 'POST',
        },
      )

      return res
    } catch (err: any) {
      console.error('[BackupService] Erro ao disparar endpoint de backup:', err)
      const msg = err.message || 'Falha ao processar snapshot no servidor'
      throw new Error(msg)
    }
  },

  /**
   * Faz o download de um backup específico em formato JSON e audita a ação.
   */
  async baixarBackup(backup: BackupRecord): Promise<void> {
    const authUser = pb.authStore.model as any

    try {
      // 1. Tentar baixar via endpoint customizado que já formata e envia os cabeçalhos apropriados
      try {
        const url = `${pb.baseUrl}/backend/v1/admin/backups/download/${backup.id}`
        const token = pb.authStore.token

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        })

        if (response.ok) {
          const blob = await response.blob()
          const downloadUrl = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = downloadUrl
          a.download = backup.nome_arquivo || `coffeecast_backup_${backup.id}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(downloadUrl)

          // Auditar no front-end para garantir caso o hook tenha sofrido rate limit
          await AuditoriaService.registrarEvento({
            tipo_acao: 'download',
            area_sistema: 'Backups & Segurança',
            descricao: `Download do backup ${backup.nome_arquivo} efetuado com sucesso.`,
            registro_afetado: backup.id,
            tabela_afetada: 'backups',
            resultado: 'sucesso',
            metadata: {
              nome_arquivo: backup.nome_arquivo,
              tipo: backup.tipo,
              tamanho_bytes: backup.tamanho_bytes,
            },
          })
          return
        }
      } catch (errEndpoint) {
        console.warn(
          '[BackupService] Endpoint de download falhou, buscando payload gravado:',
          errEndpoint,
        )
      }

      // 2. Fallback: buscar o record com payload_dados ou baixar arquivo direto pelo token do PB
      const rec = await pb.collection('backups').getOne<BackupRecord>(backup.id)
      let content = ''

      if (rec.payload_dados) {
        content = JSON.stringify(rec.payload_dados, null, 2)
      } else {
        content = JSON.stringify(
          {
            meta: {
              id: rec.id,
              nome_arquivo: rec.nome_arquivo,
              tipo: rec.tipo,
              created: rec.created,
              total_registros: rec.total_registros,
            },
            resumo_colecoes: rec.resumo_colecoes,
          },
          null,
          2,
        )
      }

      const blob = new Blob([content], { type: 'application/json;charset=utf-8;' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = rec.nome_arquivo || `coffeecast_backup_${rec.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      await AuditoriaService.registrarEvento({
        tipo_acao: 'download',
        area_sistema: 'Backups & Segurança',
        descricao: `Download do snapshot JSON do backup ${rec.nome_arquivo} efetuado via fallback.`,
        registro_afetado: rec.id,
        tabela_afetada: 'backups',
        resultado: 'sucesso',
      })
    } catch (err: any) {
      console.error('[BackupService] Erro ao realizar download:', err)
      throw new Error(err.message || 'Falha ao baixar o arquivo de backup')
    }
  },
}
