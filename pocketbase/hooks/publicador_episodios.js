// pocketbase/hooks/publicador_episodios.js
// Publicação Automática de Episódios Programados do CoffeeCast 4.0
//
// 1. Job agendado (cronAdd) executado a cada 5 minutos ("*/5 * * * *")
// 2. Busca episódios com status='programado' cuja data_publicacao_programada já chegou (<= agora)
// 3. Atualiza o status para 'publicado'
// 4. Registra cada publicação automática na Auditoria do Sistema (auditoria_eventos)
// 5. Rota POST /backend/v1/admin/episodios/processar-agendados para verificação sob demanda
//
// Regra crítica do Goja/PocketBase: tudo deve ser inline nos callbacks sem variáveis ou funções
// no escopo de módulo / topo do arquivo para evitar ReferenceError.

// 1. Cron Job periódico a cada 5 minutos
cronAdd('publicar_episodios_programados', '*/5 * * * *', () => {
  try {
    const agoraIso = new Date().toISOString()
    const records = $app.findRecordsByFilter(
      'episodios',
      `status = 'programado' && data_publicacao_programada != '' && data_publicacao_programada <= '${agoraIso}'`,
      'numero',
      100,
      0,
    )

    if (!records || records.length === 0) {
      return
    }

    console.log(
      '[Publicador Episódios Cron] Encontrados ' +
        records.length +
        ' episódio(s) prontos para publicação automática.',
    )

    let colAudit = null
    try {
      colAudit = $app.findCollectionByNameOrId('auditoria_eventos')
    } catch (_) {}

    for (let i = 0; i < records.length; i++) {
      const ep = records[i]
      const epId = ep.id
      const num = ep.getInt('numero')
      const titulo = ep.getString('titulo')
      const dataProg = ep.getString('data_publicacao_programada')

      const antes = {
        id: epId,
        numero: num,
        titulo: titulo,
        status: 'programado',
        data_publicacao_programada: dataProg,
      }

      ep.set('status', 'publicado')
      $app.save(ep)

      const depois = {
        id: epId,
        numero: num,
        titulo: titulo,
        status: 'publicado',
        data_publicacao_programada: dataProg,
      }

      console.log(
        '[Publicador Episódios Cron] Episódio #' + num + ' "' + titulo + '" publicado com sucesso!',
      )

      if (colAudit) {
        try {
          const auditRec = new Record(colAudit)
          auditRec.set('usuario_id', 'sistema')
          auditRec.set('usuario_email', 'sistema@coffeecast.com.br')
          auditRec.set('usuario_nome', 'Publicador Automático de Episódios (Cron)')
          auditRec.set('usuario_role', 'sistema')
          auditRec.set('tipo_acao', 'edicao')
          auditRec.set('area_sistema', 'Episódios')
          auditRec.set(
            'descricao',
            'Episódio #' +
              num +
              ' "' +
              titulo +
              '" publicado automaticamente no site (data/hora programada atingida: ' +
              dataProg +
              ')',
          )
          auditRec.set('registro_afetado', epId)
          auditRec.set('tabela_afetada', 'episodios')
          auditRec.set('resultado', 'sucesso')
          auditRec.set('diff_antes', antes)
          auditRec.set('diff_depois', depois)
          auditRec.set('metadata', {
            origem: 'cron_job',
            job_id: 'publicar_episodios_programados',
            data_execucao: agoraIso,
            data_programada: dataProg,
          })
          $app.save(auditRec)
        } catch (auditErr) {
          console.log(
            '[Publicador Episódios Cron] Aviso ao registrar auditoria para ep #' + num + ':',
            auditErr,
          )
        }
      }
    }
  } catch (err) {
    console.log('[Publicador Episódios Cron] Erro no job de publicação:', err)
  }
})

// 2. Rota administrativa para acionamento/verificação sob demanda pelo painel
routerAdd(
  'POST',
  '/backend/v1/admin/episodios/processar-agendados',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito.')
      }
      const role = authUser.getString('role')
      if (role !== 'master' && role !== 'gerencial' && role !== 'adm') {
        return e.forbiddenError('Acesso não permitido.')
      }

      const agoraIso = new Date().toISOString()
      const records = $app.findRecordsByFilter(
        'episodios',
        `status = 'programado' && data_publicacao_programada != '' && data_publicacao_programada <= '${agoraIso}'`,
        'numero',
        100,
        0,
      )

      let totalProcessados = 0

      if (records && records.length > 0) {
        let colAudit = null
        try {
          colAudit = $app.findCollectionByNameOrId('auditoria_eventos')
        } catch (_) {}

        for (let i = 0; i < records.length; i++) {
          const ep = records[i]
          const epId = ep.id
          const num = ep.getInt('numero')
          const titulo = ep.getString('titulo')
          const dataProg = ep.getString('data_publicacao_programada')

          const antes = {
            id: epId,
            numero: num,
            titulo: titulo,
            status: 'programado',
            data_publicacao_programada: dataProg,
          }

          ep.set('status', 'publicado')
          $app.save(ep)

          const depois = {
            id: epId,
            numero: num,
            titulo: titulo,
            status: 'publicado',
            data_publicacao_programada: dataProg,
          }

          totalProcessados++

          if (colAudit) {
            try {
              const auditRec = new Record(colAudit)
              auditRec.set('usuario_id', authUser.id)
              auditRec.set('usuario_email', authUser.getString('email'))
              auditRec.set(
                'usuario_nome',
                authUser.getString('name') || authUser.getString('email'),
              )
              auditRec.set('usuario_role', role)
              auditRec.set('tipo_acao', 'edicao')
              auditRec.set('area_sistema', 'Episódios')
              auditRec.set(
                'descricao',
                'Episódio #' +
                  num +
                  ' "' +
                  titulo +
                  '" publicado no site via verificação manual de programação',
              )
              auditRec.set('registro_afetado', epId)
              auditRec.set('tabela_afetada', 'episodios')
              auditRec.set('resultado', 'sucesso')
              auditRec.set('diff_antes', antes)
              auditRec.set('diff_depois', depois)
              auditRec.set('metadata', {
                origem: 'verificacao_manual',
                data_execucao: agoraIso,
                data_programada: dataProg,
              })
              $app.save(auditRec)
            } catch (auditErr) {
              console.log(
                '[Publicador Episódios Manual] Aviso ao auditar ep #' + num + ':',
                auditErr,
              )
            }
          }
        }
      }

      return e.json(200, {
        success: true,
        message: totalProcessados + ' episódio(s) programado(s) verificado(s)/publicado(s).',
        processados: totalProcessados,
      })
    } catch (err) {
      console.log('[Publicador Episódios Manual] Erro no endpoint:', err)
      return e.json(500, {
        error: 'Falha ao processar episódios programados: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)
