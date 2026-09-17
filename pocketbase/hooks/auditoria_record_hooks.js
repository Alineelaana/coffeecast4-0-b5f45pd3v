// pocketbase/hooks/auditoria_record_hooks.js
// Captura em segundo plano eventos de ciclo de vida das coleções principais:
// onRecordAfterCreateSuccess, onRecordAfterUpdateSuccess, onRecordAfterDeleteSuccess
// Gera registro permanente em auditoria_eventos e avalia regras ativas.

// 1. Hook pós-criação de registros
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    if (!record) return
    const colName = record.collection().name
    if (colName.startsWith('auditoria_')) return // evitar recursão

    let colEventos = null
    try {
      colEventos = $app.findCollectionByNameOrId('auditoria_eventos')
    } catch (_) {
      return
    }

    const auditRec = new Record(colEventos)
    let tipoAcao = 'criacao'
    let area = colName

    if (colName === 'transacoes' || colName === 'horas_compradas') {
      tipoAcao = 'movimentacao_financeira'
      area = 'Financeiro & Horas'
    } else if (colName === 'users') {
      tipoAcao = 'criacao_usuario'
      area = 'Usuários & Permissões'
    } else if (colName === 'chat_mensagens' || colName === 'chat_conversas') {
      tipoAcao = 'chat'
      area = 'Chat e Conversas'
    } else if (colName === 'nine_config' || colName === 'nine_conversas') {
      tipoAcao = 'configuracao'
      area = 'Nine Assistente Virtual'
    } else if (colName === 'stores' || colName.startsWith('store_')) {
      tipoAcao = 'alteracao_site'
      area = 'Storefront Multi-Loja'
    } else if (colName === 'agenda') {
      tipoAcao = 'agenda'
      area = 'Agenda de Gravação'
    } else if (colName === 'convites') {
      tipoAcao = 'cadastro'
      area = 'Gerador de Convites'
    }

    const desc = 'Novo registro criado na coleção "' + colName + '" [ID: ' + record.id + ']'

    auditRec.set('usuario_id', '')
    auditRec.set('usuario_email', 'Sistema / Operação')
    auditRec.set('usuario_nome', 'Sistema Automático')
    auditRec.set('usuario_role', 'sistema')
    auditRec.set('tipo_acao', tipoAcao)
    auditRec.set('area_sistema', area)
    auditRec.set('descricao', desc)
    auditRec.set('registro_afetado', record.id)
    auditRec.set('tabela_afetada', colName)
    auditRec.set('resultado', 'sucesso')

    const dataObj = {}
    const colFields = record.collection().fields
    for (let f = 0; f < colFields.length; f++) {
      const fn = colFields[f].name
      if (fn !== 'password' && fn !== 'tokenKey') {
        dataObj[fn] = record.get(fn)
      }
    }
    auditRec.set('diff_depois', dataObj)
    auditRec.set('metadata', { id: record.id, colecao: colName })

    $app.save(auditRec)
  } catch (err) {
    console.log('[Auditoria] Erro ao registrar pós-criação:', err)
  }
})

// 2. Hook pós-edição de registros com Diff Antes/Depois
onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    if (!record) return
    const colName = record.collection().name
    if (colName.startsWith('auditoria_')) return

    let colEventos = null
    try {
      colEventos = $app.findCollectionByNameOrId('auditoria_eventos')
    } catch (_) {
      return
    }

    const auditRec = new Record(colEventos)
    let tipoAcao = 'edicao'
    let area = colName

    if (colName === 'transacoes' || colName === 'horas_compradas') {
      tipoAcao = 'movimentacao_financeira'
      area = 'Financeiro & Horas'
    } else if (colName === 'users') {
      tipoAcao = 'alteracao_permissao'
      area = 'Usuários & Permissões'
    } else if (colName === 'nine_config') {
      tipoAcao = 'configuracao'
      area = 'Nine Assistente Virtual'
    } else if (colName === 'stores' || colName.startsWith('store_')) {
      tipoAcao = 'alteracao_site'
      area = 'Storefront Multi-Loja'
    }

    // Calcular diff campos alterados
    const diffAntes = {}
    const diffDepois = {}
    const colFields = record.collection().fields
    let alteredCount = 0

    for (let f = 0; f < colFields.length; f++) {
      const fn = colFields[f].name
      if (fn === 'password' || fn === 'tokenKey' || fn === 'updated' || fn === 'created') {
        continue
      }
      try {
        const valNovo = record.get(fn)
        const valAntigo = record.original().get(fn)
        const sNovo = JSON.stringify(valNovo)
        const sAntigo = JSON.stringify(valAntigo)
        if (sNovo !== sAntigo) {
          diffAntes[fn] = valAntigo
          diffDepois[fn] = valNovo
          alteredCount++
        }
      } catch (_) {}
    }

    const desc =
      'Registro editado na coleção "' +
      colName +
      '" [ID: ' +
      record.id +
      '] (' +
      alteredCount +
      ' campo(s) alterado(s))'

    auditRec.set('usuario_id', '')
    auditRec.set('usuario_email', 'Operação Autenticada')
    auditRec.set('usuario_nome', 'Usuário do Sistema')
    auditRec.set('usuario_role', 'sistema')
    auditRec.set('tipo_acao', tipoAcao)
    auditRec.set('area_sistema', area)
    auditRec.set('descricao', desc)
    auditRec.set('registro_afetado', record.id)
    auditRec.set('tabela_afetada', colName)
    auditRec.set('resultado', 'sucesso')
    auditRec.set('diff_antes', diffAntes)
    auditRec.set('diff_depois', diffDepois)
    auditRec.set('metadata', {
      id: record.id,
      colecao: colName,
      campos_alterados: Object.keys(diffDepois),
    })

    $app.save(auditRec)
  } catch (err) {
    console.log('[Auditoria] Erro ao registrar pós-edição:', err)
  }
})

// 3. Hook pós-exclusão permanente com snapshot do que existia antes
onRecordAfterDeleteSuccess((e) => {
  try {
    const record = e.record
    if (!record) return
    const colName = record.collection().name
    if (colName.startsWith('auditoria_')) return

    let colEventos = null
    try {
      colEventos = $app.findCollectionByNameOrId('auditoria_eventos')
    } catch (_) {
      return
    }

    const auditRec = new Record(colEventos)
    let area = colName
    if (colName === 'transacoes' || colName === 'horas_compradas') {
      area = 'Financeiro & Horas'
    } else if (colName === 'chat_mensagens' || colName === 'chat_conversas') {
      area = 'Chat e Conversas'
    } else if (colName === 'users') {
      area = 'Usuários & Permissões'
    }

    const snapshotAntes = {}
    const colFields = record.collection().fields
    for (let f = 0; f < colFields.length; f++) {
      const fn = colFields[f].name
      if (fn !== 'password' && fn !== 'tokenKey') {
        snapshotAntes[fn] = record.get(fn)
      }
    }

    const desc = 'REGISTRO EXCLUÍDO na coleção "' + colName + '" [ID: ' + record.id + ']'

    auditRec.set('usuario_id', '')
    auditRec.set('usuario_email', 'Operação Autenticada')
    auditRec.set('usuario_nome', 'Usuário do Sistema')
    auditRec.set('usuario_role', 'sistema')
    auditRec.set('tipo_acao', 'exclusao')
    auditRec.set('area_sistema', area)
    auditRec.set('descricao', desc)
    auditRec.set('registro_afetado', record.id)
    auditRec.set('tabela_afetada', colName)
    auditRec.set('resultado', 'sucesso')
    auditRec.set('diff_antes', snapshotAntes)
    auditRec.set('diff_depois', null)
    auditRec.set('metadata', { id: record.id, colecao: colName, excluido: true })

    $app.save(auditRec)

    // Criar alerta imediato de exclusão
    try {
      const colAlertas = $app.findCollectionByNameOrId('auditoria_alertas')
      const alerta = new Record(colAlertas)
      alerta.set('regra_nome', 'Exclusão Crítica de Registro')
      alerta.set('evento_id', auditRec.id)
      alerta.set('prioridade', 'critica')
      alerta.set('status', 'novo')
      alerta.set('motivo', 'Registro permanente excluído da tabela "' + colName + '"')
      alerta.set('detalhes', 'ID excluído: ' + record.id)
      alerta.set('area_sistema', area)
      alerta.set('link_relacionado', '/admin/auditoria?tab=registros')
      $app.save(alerta)
    } catch (_) {}
  } catch (err) {
    console.log('[Auditoria] Erro ao registrar pós-exclusão:', err)
  }
})
