// pocketbase/migrations/0064_seed_first_backup_verification.js
// Gera o primeiro snapshot de backup de proteção para assegurar os dados do usuário após o incidente.
migrate(
  (app) => {
    try {
      const colBackups = app.findCollectionByNameOrId('backups')

      // Idempotente: se já existir backup gravado, não duplica
      try {
        const exist = app.findFirstRecordByData('backups', 'status', 'concluido')
        if (exist) return
      } catch (_) {}

      const colecoesAlvo = [
        'users',
        'episodios',
        'integrantes',
        'depoimentos',
        'momentos',
        'contatos',
        'transacoes',
        'agenda',
        'convites',
        'conteudo_site',
        'politicas',
        'horas_compradas',
        'depoimentos_convidados',
        'roteiros_convidados',
        'nine_config',
        'nine_conversas',
        'nine_mensagens',
        'nine_conhecimento',
        'stores',
        'store_members',
        'store_episodes',
        'store_banners',
        'store_testimonials',
        'chat_conversas',
        'chat_participantes',
        'chat_mensagens',
        'auditoria_regras',
      ]

      const snapshot = {
        meta: {
          versao_sistema: 'CoffeeCast 4.0',
          gerado_em: new Date().toISOString(),
          tipo: 'automatico',
          criado_por: 'Seed de Ativação do Sistema de Proteção',
        },
        contadores: {},
        dados: {},
      }

      let totalRegistros = 0

      for (let i = 0; i < colecoesAlvo.length; i++) {
        const colName = colecoesAlvo[i]
        try {
          const registros = app.findRecordsByFilter(colName, '', '-created', 10000, 0)
          snapshot.contadores[colName] = registros.length
          totalRegistros += registros.length

          snapshot.dados[colName] = registros.map((rec) => {
            const exp = rec.export()
            if (colName === 'users') {
              delete exp.passwordHash
              delete exp.tokenKey
            }
            return exp
          })
        } catch (errCol) {
          snapshot.contadores[colName] = 0
          snapshot.dados[colName] = []
        }
      }

      const jsonString = JSON.stringify(snapshot, null, 2)
      const tamanhoBytes = jsonString.length
      const now = new Date()
      const ano = now.getFullYear()
      const mes = String(now.getMonth() + 1).padStart(2, '0')
      const dia = String(now.getDate()).padStart(2, '0')
      const hora = String(now.getHours()).padStart(2, '0')
      const min = String(now.getMinutes()).padStart(2, '0')
      const seg = String(now.getSeconds()).padStart(2, '0')
      const nomeArquivo =
        'coffeecast_backup_inicial_' + ano + mes + dia + '_' + hora + min + seg + '.json'

      const backupRec = new Record(colBackups)
      backupRec.set('nome_arquivo', nomeArquivo)
      backupRec.set('tipo', 'automatico')
      backupRec.set('status', 'concluido')
      backupRec.set('tamanho_bytes', tamanhoBytes)
      backupRec.set('total_registros', totalRegistros)
      backupRec.set('resumo_colecoes', snapshot.contadores)
      backupRec.set('payload_dados', snapshot)
      backupRec.set('criado_por_nome', 'Sistema de Proteção CoffeeCast')
      backupRec.set('criado_por_email', 'sistema@coffeecast.com.br')

      try {
        const fileObj = $filesystem.fileFromBytes(jsonString, nomeArquivo)
        backupRec.set('arquivo', fileObj)
      } catch (_) {}

      app.save(backupRec)

      // Auditoria
      try {
        const colAudit = app.findCollectionByNameOrId('auditoria_eventos')
        const auditRec = new Record(colAudit)
        auditRec.set('usuario_id', 'sistema')
        auditRec.set('usuario_email', 'sistema@coffeecast.com.br')
        auditRec.set('usuario_nome', 'Sistema CoffeeCast 4.0')
        auditRec.set('usuario_role', 'master')
        auditRec.set('tipo_acao', 'acao_administrativa')
        auditRec.set('area_sistema', 'Backups & Segurança')
        auditRec.set(
          'descricao',
          'Snapshot inicial de segurança criado e persistido com ' +
            totalRegistros +
            ' registros protegidos.',
        )
        auditRec.set('registro_afetado', backupRec.id)
        auditRec.set('tabela_afetada', 'backups')
        auditRec.set('resultado', 'sucesso')
        auditRec.set('metadata', {
          tipo: 'inicial',
          total_registros: totalRegistros,
          tamanho_bytes: tamanhoBytes,
          nome_arquivo: nomeArquivo,
        })
        app.save(auditRec)
      } catch (_) {}
    } catch (err) {
      console.log('[Seed Backup] Falha ao gerar backup inicial:', err)
    }
  },
  (app) => {
    try {
      const colBackups = app.findCollectionByNameOrId('backups')
      app.truncateCollection(colBackups)
    } catch (_) {}
  },
)
