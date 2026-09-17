// pocketbase/hooks/backup_manager.js
// Sistema de Backup e Proteção de Dados do CoffeeCast 4.0
//
// 1. Job agendado (cronAdd) para snapshot diário automático de todas as coleções de dados
// 2. Rota POST /backend/v1/admin/backups/create para disparar backup manual imediato (Master)
// 3. Rota GET /backend/v1/admin/backups/download/{id} para download seguro do snapshot JSON com registro em auditoria
// 4. Rota GET /backend/v1/admin/backups/stats para obter contadores ao vivo de coleções e conferência de segurança

// -------------------------------------------------------------
// 1. JOB AGENDADO DIÁRIO (03:00 UTC)
// -------------------------------------------------------------
cronAdd('coffeecast_daily_backup', '0 3 * * *', () => {
  console.log('[Backup Cron] Iniciando rotina de snapshot diário automático do CoffeeCast...')
  try {
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
        criado_por: 'Job Agendado (Sistema)',
      },
      contadores: {},
      dados: {},
    }

    let totalRegistros = 0

    for (let i = 0; i < colecoesAlvo.length; i++) {
      const colName = colecoesAlvo[i]
      try {
        const registros = $app.findRecordsByFilter(colName, '', '-created', 10000, 0)
        snapshot.contadores[colName] = registros.length
        totalRegistros += registros.length

        // Mapear registros para objetos limpos (sem tokens ou senhas hash para segurança máxima)
        snapshot.dados[colName] = registros.map((rec) => {
          const exportado = rec.export()
          if (colName === 'users') {
            delete exportado.passwordHash
            delete exportado.tokenKey
          }
          return exportado
        })
      } catch (errCol) {
        console.log('[Backup Cron] Aviso ao ler coleção ' + colName + ':', errCol)
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
      'coffeecast_backup_auto_' + ano + mes + dia + '_' + hora + min + seg + '.json'

    const colBackups = $app.findCollectionByNameOrId('backups')
    const backupRec = new Record(colBackups)
    backupRec.set('nome_arquivo', nomeArquivo)
    backupRec.set('tipo', 'automatico')
    backupRec.set('status', 'concluido')
    backupRec.set('tamanho_bytes', tamanhoBytes)
    backupRec.set('total_registros', totalRegistros)
    backupRec.set('resumo_colecoes', snapshot.contadores)
    backupRec.set('payload_dados', snapshot)
    backupRec.set('criado_por_nome', 'Rotina Automática (Cron)')
    backupRec.set('criado_por_email', 'sistema@coffeecast.com.br')

    try {
      const fileObj = $filesystem.fileFromBytes(jsonString, nomeArquivo)
      backupRec.set('arquivo', fileObj)
    } catch (errFile) {
      console.log('[Backup Cron] Aviso ao anexar arquivo binário:', errFile)
    }

    $app.save(backupRec)
    console.log(
      '[Backup Cron] Backup diário gravado com sucesso! Total registros:',
      totalRegistros,
      'ID:',
      backupRec.id,
    )

    // Rotação: manter os últimos 30 backups
    try {
      const todosBackups = $app.findRecordsByFilter('backups', '', '-created', 100, 0)
      if (todosBackups.length > 30) {
        const paraExcluir = todosBackups.slice(30)
        for (let j = 0; j < paraExcluir.length; j++) {
          try {
            $app.delete(paraExcluir[j])
          } catch (_) {}
        }
        console.log('[Backup Cron] Rotação concluída. Excluídos:', paraExcluir.length)
      }
    } catch (errRot) {
      console.log('[Backup Cron] Aviso na rotação:', errRot)
    }

    // Registro na auditoria
    try {
      const colAudit = $app.findCollectionByNameOrId('auditoria_eventos')
      const auditRec = new Record(colAudit)
      auditRec.set('usuario_id', 'sistema')
      auditRec.set('usuario_email', 'sistema@coffeecast.com.br')
      auditRec.set('usuario_nome', 'Rotina Automática de Backup')
      auditRec.set('usuario_role', 'master')
      auditRec.set('tipo_acao', 'acao_administrativa')
      auditRec.set('area_sistema', 'Backups & Segurança')
      auditRec.set(
        'descricao',
        'Backup automático diário gerado com sucesso. ' +
          totalRegistros +
          ' registros salvos em ' +
          nomeArquivo,
      )
      auditRec.set('registro_afetado', backupRec.id)
      auditRec.set('tabela_afetada', 'backups')
      auditRec.set('resultado', 'sucesso')
      auditRec.set('metadata', {
        tipo: 'automatico',
        total_registros: totalRegistros,
        tamanho_bytes: tamanhoBytes,
        nome_arquivo: nomeArquivo,
      })
      $app.save(auditRec)
    } catch (errAudit) {
      console.log('[Backup Cron] Aviso ao auditar backup cron:', errAudit)
    }
  } catch (err) {
    console.log('[Backup Cron] Erro crítico no job de backup:', err)
  }
})

// -------------------------------------------------------------
// 2. ENDPOINT: CRIAR BACKUP MANUAL IMEDIATO (POST)
// -------------------------------------------------------------
routerAdd(
  'POST',
  '/backend/v1/admin/backups/create',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito ao painel.')
      }

      const role = authUser.getString('role')
      if (role !== 'master') {
        return e.forbiddenError('Apenas o Superadministrador Master pode gerar backups.')
      }

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
          tipo: 'manual',
          criado_por_id: authUser.id,
          criado_por_nome: authUser.getString('name') || authUser.getString('email'),
          criado_por_email: authUser.getString('email'),
        },
        contadores: {},
        dados: {},
      }

      let totalRegistros = 0

      for (let i = 0; i < colecoesAlvo.length; i++) {
        const colName = colecoesAlvo[i]
        try {
          const registros = $app.findRecordsByFilter(colName, '', '-created', 10000, 0)
          snapshot.contadores[colName] = registros.length
          totalRegistros += registros.length

          snapshot.dados[colName] = registros.map((rec) => {
            const exportado = rec.export()
            if (colName === 'users') {
              delete exportado.passwordHash
              delete exportado.tokenKey
            }
            return exportado
          })
        } catch (errCol) {
          console.log('[Backup Manual] Aviso na leitura de ' + colName + ':', errCol)
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
        'coffeecast_backup_manual_' + ano + mes + dia + '_' + hora + min + seg + '.json'

      const colBackups = $app.findCollectionByNameOrId('backups')
      const backupRec = new Record(colBackups)
      backupRec.set('nome_arquivo', nomeArquivo)
      backupRec.set('tipo', 'manual')
      backupRec.set('status', 'concluido')
      backupRec.set('tamanho_bytes', tamanhoBytes)
      backupRec.set('total_registros', totalRegistros)
      backupRec.set('resumo_colecoes', snapshot.contadores)
      backupRec.set('payload_dados', snapshot)
      backupRec.set('criado_por_nome', authUser.getString('name') || authUser.getString('email'))
      backupRec.set('criado_por_email', authUser.getString('email'))

      try {
        const fileObj = $filesystem.fileFromBytes(jsonString, nomeArquivo)
        backupRec.set('arquivo', fileObj)
      } catch (errFile) {
        console.log('[Backup Manual] Aviso ao anexar arquivo:', errFile)
      }

      $app.save(backupRec)

      // Rotação: manter os últimos 30 backups
      try {
        const todosBackups = $app.findRecordsByFilter('backups', '', '-created', 100, 0)
        if (todosBackups.length > 30) {
          const paraExcluir = todosBackups.slice(30)
          for (let k = 0; k < paraExcluir.length; k++) {
            try {
              $app.delete(paraExcluir[k])
            } catch (_) {}
          }
        }
      } catch (_) {}

      // Registro na auditoria
      try {
        const colAudit = $app.findCollectionByNameOrId('auditoria_eventos')
        const auditRec = new Record(colAudit)
        auditRec.set('usuario_id', authUser.id)
        auditRec.set('usuario_email', authUser.getString('email'))
        auditRec.set('usuario_nome', authUser.getString('name') || authUser.getString('email'))
        auditRec.set('usuario_role', authUser.getString('role'))
        auditRec.set('tipo_acao', 'acao_administrativa')
        auditRec.set('area_sistema', 'Backups & Segurança')
        auditRec.set(
          'descricao',
          'Backup manual gerado sob demanda pelo Master ' +
            (authUser.getString('name') || authUser.getString('email')) +
            '. ' +
            totalRegistros +
            ' registros protegidos.',
        )
        auditRec.set('registro_afetado', backupRec.id)
        auditRec.set('tabela_afetada', 'backups')
        auditRec.set('resultado', 'sucesso')
        auditRec.set('metadata', {
          tipo: 'manual',
          total_registros: totalRegistros,
          tamanho_bytes: tamanhoBytes,
          nome_arquivo: nomeArquivo,
        })
        $app.save(auditRec)
      } catch (errAudit) {
        console.log('[Backup Manual] Aviso ao auditar backup manual:', errAudit)
      }

      return e.json(200, {
        success: true,
        message: 'Backup criado com sucesso!',
        backup: {
          id: backupRec.id,
          nome_arquivo: backupRec.getString('nome_arquivo'),
          tipo: backupRec.getString('tipo'),
          status: backupRec.getString('status'),
          tamanho_bytes: backupRec.getInt('tamanho_bytes'),
          total_registros: backupRec.getInt('total_registros'),
          resumo_colecoes: backupRec.get('resumo_colecoes'),
          criado_por_nome: backupRec.getString('criado_por_nome'),
          criado_por_email: backupRec.getString('criado_por_email'),
          created: backupRec.getString('created'),
          arquivo: backupRec.getString('arquivo'),
        },
      })
    } catch (err) {
      console.log('[Backup Manual] Erro ao criar backup:', err)
      return e.json(500, {
        error: 'Falha ao gerar backup: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)

// -------------------------------------------------------------
// 3. ENDPOINT: DOWNLOAD SEGURO DO SNAPSHOT (GET)
// -------------------------------------------------------------
routerAdd(
  'GET',
  '/backend/v1/admin/backups/download/{id}',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito.')
      }

      const role = authUser.getString('role')
      if (role !== 'master') {
        return e.forbiddenError('Apenas o Superadministrador Master pode baixar backups.')
      }

      const id = e.request.pathValue('id')
      if (!id) {
        return e.badRequestError('ID do backup é obrigatório.')
      }

      const backupRec = $app.findFirstRecordByData('backups', 'id', id)
      let payload = backupRec.get('payload_dados')

      // Se payload_dados não estiver presente mas houver resumo, monta snapshot mínimo
      if (!payload) {
        payload = {
          meta: {
            backup_id: backupRec.id,
            nome_arquivo: backupRec.getString('nome_arquivo'),
            created: backupRec.getString('created'),
            tipo: backupRec.getString('tipo'),
          },
          resumo_colecoes: backupRec.get('resumo_colecoes'),
          aviso: 'O snapshot completo pode ser acessado também através dos registros arquivados.',
        }
      }

      // Registro de Auditoria do download
      try {
        const colAudit = $app.findCollectionByNameOrId('auditoria_eventos')
        const auditRec = new Record(colAudit)
        auditRec.set('usuario_id', authUser.id)
        auditRec.set('usuario_email', authUser.getString('email'))
        auditRec.set('usuario_nome', authUser.getString('name') || authUser.getString('email'))
        auditRec.set('usuario_role', authUser.getString('role'))
        auditRec.set('tipo_acao', 'download')
        auditRec.set('area_sistema', 'Backups & Segurança')
        auditRec.set(
          'descricao',
          'Download do arquivo de backup realizado: ' + backupRec.getString('nome_arquivo'),
        )
        auditRec.set('registro_afetado', backupRec.id)
        auditRec.set('tabela_afetada', 'backups')
        auditRec.set('resultado', 'sucesso')
        auditRec.set('metadata', {
          backup_id: backupRec.id,
          nome_arquivo: backupRec.getString('nome_arquivo'),
          tamanho_bytes: backupRec.getInt('tamanho_bytes'),
        })
        $app.save(auditRec)
      } catch (errAudit) {
        console.log('[Backup Download] Aviso ao registrar auditoria de download:', errAudit)
      }

      const jsonStr = JSON.stringify(payload, null, 2)
      const nomeArquivo = backupRec.getString('nome_arquivo') || 'backup_coffeecast.json'

      e.response.header().set('Content-Type', 'application/json; charset=utf-8')
      e.response.header().set('Content-Disposition', 'attachment; filename="' + nomeArquivo + '"')

      return e.string(200, jsonStr)
    } catch (err) {
      console.log('[Backup Download] Erro ao servir download de backup:', err)
      return e.json(500, {
        error: 'Falha ao baixar backup: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)

// -------------------------------------------------------------
// 4. ENDPOINT: STATUS, CRON INFO E CONTADORES AO VIVO (GET)
// -------------------------------------------------------------
routerAdd(
  'GET',
  '/backend/v1/admin/backups/stats',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito.')
      }

      const role = authUser.getString('role')
      if (role !== 'master') {
        return e.forbiddenError('Acesso restrito ao Master.')
      }

      // Contadores das coleções mais sensíveis citadas pelo usuário
      const colecoesContar = [
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

      const contadoresAtuais = {}
      for (let i = 0; i < colecoesContar.length; i++) {
        const c = colecoesContar[i]
        try {
          const recs = $app.findRecordsByFilter(c, '', '', 10000, 0)
          contadoresAtuais[c] = recs.length
        } catch (_) {
          contadoresAtuais[c] = 0
        }
      }

      // Último backup realizado (geral e automático)
      let ultimoBackup = null
      let ultimoBackupAuto = null
      try {
        const ultimos = $app.findRecordsByFilter('backups', '', '-created', 1, 0)
        if (ultimos.length > 0) {
          const u = ultimos[0]
          ultimoBackup = {
            id: u.id,
            nome_arquivo: u.getString('nome_arquivo'),
            tipo: u.getString('tipo'),
            total_registros: u.getInt('total_registros'),
            tamanho_bytes: u.getInt('tamanho_bytes'),
            created: u.getString('created'),
          }
        }
      } catch (_) {}

      try {
        const ultimosAuto = $app.findRecordsByFilter(
          'backups',
          'tipo = "automatico"',
          '-created',
          1,
          0,
        )
        if (ultimosAuto.length > 0) {
          const ua = ultimosAuto[0]
          ultimoBackupAuto = {
            id: ua.id,
            nome_arquivo: ua.getString('nome_arquivo'),
            tipo: ua.getString('tipo'),
            total_registros: ua.getInt('total_registros'),
            tamanho_bytes: ua.getInt('tamanho_bytes'),
            created: ua.getString('created'),
          }
        }
      } catch (_) {}

      // Total de backups salvos
      let totalBackupsArmazenados = 0
      try {
        const todos = $app.findRecordsByFilter('backups', '', '', 1000, 0)
        totalBackupsArmazenados = todos.length
      } catch (_) {}

      return e.json(200, {
        success: true,
        cron: {
          ativo: true,
          expressao: '0 3 * * *',
          descricao: 'Diariamente às 03:00 (UTC) / 00:00 (Horário de Brasília)',
          politica_retencao: 'Mantém os últimos 30 backups rotacionados',
        },
        ultimo_backup: ultimoBackup,
        ultimo_backup_automatico: ultimoBackupAuto,
        total_backups: totalBackupsArmazenados,
        contadores_atuais: contadoresAtuais,
      })
    } catch (err) {
      console.log('[Backup Stats] Erro ao obter stats:', err)
      return e.json(500, {
        error: 'Falha ao obter status de backup: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)
