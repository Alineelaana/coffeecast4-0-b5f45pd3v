// pocketbase/hooks/notificacoes_hooks.js
// Cria registros internos na collection "notificacoes" automaticamente quando:
//  (a) entra um lead novo pelo chat/site (coleção contatos);
//  (b) um roteiro de convidado fica aguardando aprovação (status_aprovacao = em_revisao);
//  (c) uma gravação é marcada para menos de 48h (coleção agenda).
// Sem envio externo — somente registro interno, lido pelo sino/central de notificações.

// ---------- util ----------
function criaNotificacao(app, dados) {
  try {
    const col = app.findCollectionByNameOrId('notificacoes')
    const rec = new Record(col)
    rec.set('destinatario_role', dados.destinatario_role || 'equipe')
    rec.set('tipo', dados.tipo || 'geral')
    rec.set('titulo', dados.titulo || 'Notificação')
    rec.set('mensagem', dados.mensagem || '')
    rec.set('referencia_tipo', dados.referencia_tipo || '')
    rec.set('referencia_id', dados.referencia_id || '')
    rec.set('lida', false)
    app.save(rec)
  } catch (err) {
    console.log('[Notificacoes] Erro ao criar notificação:', err)
  }
}

function extraiIdRel(rel) {
  if (!rel) return ''
  if (typeof rel === 'string') return rel
  if (rel.id) return rel.id
  return ''
}

// ---------- (a) lead novo (contatos) ----------
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    if (!record) return
    const colName = record.collection().name
    if (colName !== 'contatos') return

    criaNotificacao($app, {
      destinatario_role: 'equipe',
      tipo: 'lead',
      titulo: 'Novo lead: ' + (record.get('nome_completo') || 'Sem nome'),
      mensagem:
        'Lead entrou pelo chat/site — interesse: ' +
        (record.get('interesse') || record.get('resumo_necessidade') || 'não informado') +
        '. Verificar no Painel Comercial de Leads.',
      referencia_tipo: 'lead',
      referencia_id: record.id,
    })
  } catch (err) {
    console.log('[Notificacoes] Erro no hook de lead novo:', err)
  }
})

// ---------- (b) roteiro aguardando aprovação ----------
onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    if (!record) return
    const colName = record.collection().name
    if (colName !== 'roteiros_convidados') return
    if (record.get('status_aprovacao') !== 'em_revisao') return

    // evita duplicar se a notificação já existe para este roteiro
    const existentes = $app.findRecordsByFilter(
      'notificacoes',
      'tipo = "roteiro_aprovacao" && referencia_id = "' + record.id + '"',
      '-created',
      1,
      0,
    )
    if (existentes && existentes.length > 0) return

    criaNotificacao($app, {
      destinatario_role: 'equipe',
      tipo: 'roteiro_aprovacao',
      titulo: 'Roteiro aguardando aprovação: ' + (record.get('nome') || 'convidado'),
      mensagem:
        'Roteiro do convidado ficou aguardando aprovação (status em_revisao). Rever na tela de Roteiros.',
      referencia_tipo: 'roteiro',
      referencia_id: record.id,
    })
  } catch (err) {
    console.log('[Notificacoes] Erro no hook de roteiro aguardando aprovação:', err)
  }
})

// ---------- (c) gravação marcada para menos de 48h ----------
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    if (!record) return
    const colName = record.collection().name
    if (colName !== 'agenda') return

    const dataGrav = record.get('data_gravacao')
    if (!dataGrav) return
    const ts = new Date(dataGrav).getTime()
    if (isNaN(ts)) return
    const agora = Date.now()
    if (ts < agora || ts - agora > 48 * 60 * 60 * 1000) return

    // evita duplicar para o mesmo agendamento
    const existentes = $app.findRecordsByFilter(
      'notificacoes',
      'tipo = "gravacao_48h" && referencia_id = "' + record.id + '"',
      '-created',
      1,
      0,
    )
    if (existentes && existentes.length > 0) return

    criaNotificacao($app, {
      destinatario_role: 'equipe',
      tipo: 'gravacao_48h',
      titulo: 'Gravação em menos de 48h: ' + (record.get('titulo') || 'sem título'),
      mensagem:
        'Gravação agendada para ' +
        new Date(dataGrav).toLocaleString('pt-BR') +
        '. Conferir na Agenda.',
      referencia_tipo: 'gravacao',
      referencia_id: record.id,
    })
  } catch (err) {
    console.log('[Notificacoes] Erro no hook de gravação < 48h:', err)
  }
})

// ---------- (c-extra) gravação RE-agendada para menos de 48h ----------
onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    if (!record) return
    const colName = record.collection().name
    if (colName !== 'agenda') return
    if (record.get('data_gravacao') === record.original().get('data_gravacao')) return

    const dataGrav = record.get('data_gravacao')
    if (!dataGrav) return
    const ts = new Date(dataGrav).getTime()
    if (isNaN(ts)) return
    const agora = Date.now()
    if (ts < agora || ts - agora > 48 * 60 * 60 * 1000) return

    const existentes = $app.findRecordsByFilter(
      'notificacoes',
      'tipo = "gravacao_48h" && referencia_id = "' + record.id + '"',
      '-created',
      1,
      0,
    )
    if (existentes && existentes.length > 0) return

    criaNotificacao($app, {
      destinatario_role: 'equipe',
      tipo: 'gravacao_48h',
      titulo: 'Gravação em menos de 48h: ' + (record.get('titulo') || 'sem título'),
      mensagem:
        'Gravação RE-agendada para ' +
        new Date(dataGrav).toLocaleString('pt-BR') +
        '. Conferir na Agenda.',
      referencia_tipo: 'gravacao',
      referencia_id: record.id,
    })
  } catch (err) {
    console.log('[Notificacoes] Erro no hook de gravação re-agendada:', err)
  }
})
