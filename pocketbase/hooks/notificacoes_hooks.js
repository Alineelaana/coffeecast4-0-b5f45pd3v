// pocketbase/hooks/notificacoes_hooks.js
// Cria registros internos na collection "notificacoes" automaticamente quando:
//  (a) entra um lead novo pelo comercial/site (coleção contatos);
//  (b) um roteiro de convidado fica aguardando aprovação (status_aprovacao = em_revisao);
//  (c) uma gravação é marcada para menos de 48h (coleção agenda, create e update).
// Sem envio externo — somente registro interno, lido pelo sino/central de notificações.
//
// IMPORTANTE (PocketBase >= 0.23): todo handler é um elo de cadeia e DEVE chamar
// e.next() em TODOS os caminhos de saída (try/finally), senão realtime/entrega
// subsequente nunca roda. Todo o util vai INLINE dentro de cada callback — a JSVM
// não compartilha declarações de top-level com o pool de callbacks.

// ---------- (a) lead novo (contatos) ----------
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    if (record && record.collection().name === 'contatos') {
      try {
        const col = $app.findCollectionByNameOrId('notificacoes')
        const jaExiste = $app.findRecordsByFilter(
          'notificacoes',
          'tipo = "lead" && referencia_id = "' + record.id + '"',
          '-created',
          1,
          0,
        ).length
        if (jaExiste === 0) {
          const rec = new Record(col)
          rec.set('perfil_alvo', 'master')
          rec.set('tipo', 'lead')
          rec.set('titulo', 'Novo lead: ' + (record.get('nome_completo') || 'Sem nome'))
          rec.set(
            'mensagem',
            'Lead entrou pelo chat/site — interesse: ' +
              (record.get('interesse') || record.get('resumo_necessidade') || 'não informado') +
              '. Verificar no Painel Comercial de Leads.',
          )
          rec.set('referencia_tipo', 'lead')
          rec.set('referencia_id', record.id)
          rec.set('lida', false)
          $app.save(rec)
        }
      } catch (err) {
        console.log('[Notificacoes] Erro no hook de lead novo:', err)
      }
    }
  } catch (err) {
    console.log('[Notificacoes] Erro inesperado (lead novo):', err)
  } finally {
    e.next()
  }
})

// ---------- (b) roteiro aguardando aprovação (roteiros_convidados) ----------
onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    if (
      record &&
      record.collection().name === 'roteiros_convidados' &&
      record.get('status_aprovacao') === 'em_revisao'
    ) {
      try {
        const col = $app.findCollectionByNameOrId('notificacoes')
        const jaExiste = $app.findRecordsByFilter(
          'notificacoes',
          'tipo = "roteiro" && referencia_id = "' + record.id + '"',
          '-created',
          1,
          0,
        ).length
        if (jaExiste === 0) {
          const rec = new Record(col)
          rec.set('perfil_alvo', 'master')
          rec.set('tipo', 'roteiro')
          rec.set('titulo', 'Roteiro aguardando aprovação: ' + (record.get('nome') || 'convidado'))
          rec.set(
            'mensagem',
            'Roteiro do convidado ficou aguardando aprovação (status em_revisao). Rever na tela de Roteiros.',
          )
          rec.set('referencia_tipo', 'roteiro')
          rec.set('referencia_id', record.id)
          rec.set('lida', false)
          $app.save(rec)
        }
      } catch (err) {
        console.log('[Notificacoes] Erro no hook de roteiro aguardando aprovação:', err)
      }
    }
  } catch (err) {
    console.log('[Notificacoes] Erro inesperado (roteiro):', err)
  } finally {
    e.next()
  }
})

// ---------- (c) gravação criada para menos de 48h (agenda) ----------
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    if (record && record.collection().name === 'agenda') {
      try {
        const dataGrav = record.get('data_gravacao')
        const ts = dataGrav ? new Date(dataGrav).getTime() : NaN
        const agora = Date.now()
        const dentro48h = !isNaN(ts) && ts >= agora && ts - agora <= 48 * 60 * 60 * 1000
        if (dentro48h) {
          const col = $app.findCollectionByNameOrId('notificacoes')
          const jaExiste = $app.findRecordsByFilter(
            'notificacoes',
            'tipo = "gravacao" && referencia_id = "' + record.id + '"',
            '-created',
            1,
            0,
          ).length
          if (jaExiste === 0) {
            const rec = new Record(col)
            rec.set('perfil_alvo', 'master')
            rec.set('tipo', 'gravacao')
            rec.set('titulo', 'Gravação em menos de 48h: ' + (record.get('titulo') || 'sem título'))
            rec.set(
              'mensagem',
              'Gravação agendada para ' +
                new Date(dataGrav).toLocaleString('pt-BR') +
                '. Conferir na Agenda.',
            )
            rec.set('referencia_tipo', 'gravacao')
            rec.set('referencia_id', record.id)
            rec.set('lida', false)
            $app.save(rec)
          }
        }
      } catch (err) {
        console.log('[Notificacoes] Erro no hook de gravação < 48h:', err)
      }
    }
  } catch (err) {
    console.log('[Notificacoes] Erro inesperado (gravação):', err)
  } finally {
    e.next()
  }
})

// ---------- (c-extra) gravação RE-agendada para menos de 48h (agenda) ----------
onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    if (record && record.collection().name === 'agenda') {
      try {
        const anterior = record.original()
        const mudouData = !anterior || record.get('data_gravacao') !== anterior.get('data_gravacao')
        const dataGrav = record.get('data_gravacao')
        const ts = dataGrav ? new Date(dataGrav).getTime() : NaN
        const agora = Date.now()
        const dentro48h = !isNaN(ts) && ts >= agora && ts - agora <= 48 * 60 * 60 * 1000
        if (mudouData && dentro48h) {
          const col = $app.findCollectionByNameOrId('notificacoes')
          const jaExiste = $app.findRecordsByFilter(
            'notificacoes',
            'tipo = "gravacao" && referencia_id = "' + record.id + '"',
            '-created',
            1,
            0,
          ).length
          if (jaExiste === 0) {
            const rec = new Record(col)
            rec.set('perfil_alvo', 'master')
            rec.set('tipo', 'gravacao')
            rec.set('titulo', 'Gravação em menos de 48h: ' + (record.get('titulo') || 'sem título'))
            rec.set(
              'mensagem',
              'Gravação RE-agendada para ' +
                new Date(dataGrav).toLocaleString('pt-BR') +
                '. Conferir na Agenda.',
            )
            rec.set('referencia_tipo', 'gravacao')
            rec.set('referencia_id', record.id)
            rec.set('lida', false)
            $app.save(rec)
          }
        }
      } catch (err) {
        console.log('[Notificacoes] Erro no hook de gravação re-agendada:', err)
      }
    }
  } catch (err) {
    console.log('[Notificacoes] Erro inesperado (gravação re-agendada):', err)
  } finally {
    e.next()
  }
})
