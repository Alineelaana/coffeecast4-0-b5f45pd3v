/// <reference path="../pb_data/types.d.ts" />
// Hooks comerciais da Nine: endpoints autenticados (staff) para leads da área de Leads
// (coleção `contatos`) e tarefas de retorno (`nine_tarefas`).
// O contato com leads é sempre MANUAL (wa.me / tel: / mailto:) — nunca envio automático.
// Nota JSVM: TODAS as funções auxiliares vivem DENTRO de cada callback (escopo próprio).

// ---------------------------------------------------------------------------
// GET /backend/v1/nine/leads?status_comercial=aguardando_contato
// Lista leads com contagens por status (indicadores do painel comercial).
// ---------------------------------------------------------------------------
routerAdd('GET', '/backend/v1/nine/leads', (e) => {
  const isStaff = () => {
    try {
      const auth = e.auth
      if (!auth || !auth.id) return false
      return ['master', 'gerencial', 'adm'].indexOf(auth.getString('role') || '') !== -1
    } catch (_) {
      return false
    }
  }
  if (!isStaff()) return e.json(401, { error: 'Acesso restrito à equipe autorizada.' })
  try {
    const q = e.requestInfo().query || {}
    const statusFilter = (q.status_comercial || '').trim()
    const sort = (q.sort || '-created').trim()
    const validSorts = ['-created', 'created', '-prioridade', 'data_proximo_retorno']
    const sortFinal = validSorts.indexOf(sort) !== -1 ? sort : '-created'

    let filter = ''
    if (statusFilter && statusFilter !== 'todos') {
      filter = `status_comercial = "${statusFilter}"`
    }

    let records = []
    try {
      records = $app.findRecordsByFilter('contatos', filter, sortFinal, 200, 0)
    } catch (listErr) {
      console.log('nine_comercial leads list:', listErr)
    }

    const contagens = {
      aguardando_contato: 0,
      novos_leads: 0,
      contatos_agendados: 0,
      em_atendimento: 0,
      convertidos: 0,
      contatos_atrasados: 0,
    }

    const hoje = new Date().toISOString().slice(0, 10)
    const todos = []
    try {
      todos.push(
        ...$app.findRecordsByFilter('contatos', 'status_comercial != ""', '-created', 500, 0),
      )
    } catch (_) {
      // se o filtro falhar (nenhum registro com o campo preenchido), tenta sem filtro
      try {
        todos.push(...$app.findRecordsByFilter('contatos', '', '-created', 500, 0))
      } catch (_) {}
    }

    for (let i = 0; i < todos.length; i++) {
      const r = todos[i]
      const st = r.getString('status_comercial') || 'novo_lead'
      const retorno = (r.getString('data_proximo_retorno') || '').slice(0, 10)
      if (st === 'aguardando_contato') contagens.aguardando_contato++
      if (st === 'novo_lead') contagens.novos_leads++
      if (st === 'contato_agendado') contagens.contatos_agendados++
      if (st === 'em_atendimento') contagens.em_atendimento++
      if (st === 'convertido') contagens.convertidos++
      if (retorno && retorno < hoje && st !== 'convertido' && st !== 'encerrado') {
        contagens.contatos_atrasados++
      }
    }

    const leads = (records || []).map((r) => ({
      id: r.id,
      nome_completo: r.getString('nome_completo'),
      email: r.getString('email'),
      telefone: r.getString('telefone'),
      whatsapp: r.getString('whatsapp'),
      interesse: r.getString('interesse'),
      empresa_projeto: r.getString('empresa_projeto'),
      resumo_necessidade: r.getString('resumo_necessidade'),
      canal_preferido: r.getString('canal_preferido'),
      melhor_horario: r.getString('melhor_horario'),
      responsavel: r.getString('responsavel'),
      prioridade: r.getString('prioridade') || 'media',
      status: r.getString('status'),
      status_comercial: r.getString('status_comercial'),
      origem: r.getString('origem'),
      conversation_id: r.getString('conversation_id'),
      resumo_ia: r.getString('resumo_ia'),
      data_contato: r.getString('data_contato'),
      data_proximo_retorno: r.getString('data_proximo_retorno'),
      proxima_acao: r.getString('proxima_acao'),
      nao_contatar: r.getBool('nao_contatar'),
      autorizacao_contato: r.getBool('autorizacao_contato'),
      notas_comerciais: r.getString('notas_comerciais'),
      created: r.getString('created'),
      updated: r.getString('updated'),
    }))

    return e.json(200, { leads: leads, contagens: contagens })
  } catch (err) {
    console.log('Erro no endpoint nine/leads:', err)
    return e.json(500, { error: 'Falha ao carregar leads.' })
  }
})

// ---------------------------------------------------------------------------
// GET /backend/v1/nine/leads/{id} — detalhe com histórico de atendimento
// ---------------------------------------------------------------------------
routerAdd('GET', '/backend/v1/nine/leads/{id}', (e) => {
  const isStaff = () => {
    try {
      const auth = e.auth
      if (!auth || !auth.id) return false
      return ['master', 'gerencial', 'adm'].indexOf(auth.getString('role') || '') !== -1
    } catch (_) {
      return false
    }
  }
  if (!isStaff()) return e.json(401, { error: 'Acesso restrito à equipe autorizada.' })
  try {
    let rec = null
    try {
      rec = $app.findRecordById('contatos', e.request.pathValue('id'))
    } catch (_) {
      rec = null
    }
    if (!rec) return e.json(404, { error: 'Lead não encontrado.' })

    const conversationId = rec.getString('conversation_id') || ''
    let mensagens = []
    if (conversationId) {
      try {
        const msgs = $app.findRecordsByFilter(
          'nine_mensagens',
          `conversation_id = "${conversationId}"`,
          'created',
          300,
          0,
        )
        mensagens = (msgs || []).map((m) => ({
          id: m.id,
          remetente: m.getString('remetente'),
          remetente_nome: m.getString('remetente_nome'),
          conteudo: m.getString('conteudo'),
          created: m.getString('created'),
        }))
      } catch (msgErr) {
        console.log('nine_comercial lead detail msgs:', msgErr)
      }
    }

    let tarefas = []
    try {
      const ts = $app.findRecordsByFilter('nine_tarefas', `lead = "${rec.id}"`, '-created', 50, 0)
      tarefas = (ts || []).map((t) => ({
        id: t.id,
        titulo: t.getString('titulo'),
        status: t.getString('status'),
        prioridade: t.getString('prioridade'),
        prazo: t.getString('prazo'),
        canal_preferido: t.getString('canal_preferido'),
        horario_preferido: t.getString('horario_preferido'),
        responsavel: t.getString('responsavel'),
        motivo: t.getString('motivo'),
        resumo_conversa: t.getString('resumo_conversa'),
        created: t.getString('created'),
      }))
    } catch (tErr) {
      console.log('nine_comercial lead detail tarefas:', tErr)
    }

    return e.json(200, {
      lead: {
        id: rec.id,
        nome_completo: rec.getString('nome_completo'),
        email: rec.getString('email'),
        telefone: rec.getString('telefone'),
        whatsapp: rec.getString('whatsapp'),
        interesse: rec.getString('interesse'),
        empresa_projeto: rec.getString('empresa_projeto'),
        resumo_necessidade: rec.getString('resumo_necessidade'),
        canal_preferido: rec.getString('canal_preferido'),
        melhor_horario: rec.getString('melhor_horario'),
        responsavel: rec.getString('responsavel'),
        prioridade: rec.getString('prioridade') || 'media',
        status: rec.getString('status'),
        status_comercial: rec.getString('status_comercial'),
        origem: rec.getString('origem'),
        conversation_id: conversationId,
        resumo_ia: rec.getString('resumo_ia'),
        data_contato: rec.getString('data_contato'),
        data_proximo_retorno: rec.getString('data_proximo_retorno'),
        proxima_acao: rec.getString('proxima_acao'),
        nao_contatar: rec.getBool('nao_contatar'),
        autorizacao_contato: rec.getBool('autorizacao_contato'),
        notas_comerciais: rec.getString('notas_comerciais'),
        created: rec.getString('created'),
        updated: rec.getString('updated'),
      },
      mensagens: mensagens,
      tarefas: tarefas,
    })
  } catch (err) {
    console.log('Erro no detalhe do lead:', err)
    return e.json(500, { error: 'Falha ao carregar o lead.' })
  }
})

// ---------------------------------------------------------------------------
// PATCH /backend/v1/nine/leads/{id} — ações rápidas do painel
// body: { acao: "registrar_contato" | "agendar_retorno" | "alterar_status" |
//              "observacao" | "definir_prioridade",
//         canal, resultado, observacoes, proxima_acao, data_proximo_retorno,
//         status_comercial, prioridade, responsavel }
// ---------------------------------------------------------------------------
routerAdd('PATCH', '/backend/v1/nine/leads/{id}', (e) => {
  const isStaff = () => {
    try {
      const auth = e.auth
      if (!auth || !auth.id) return false
      return ['master', 'gerencial', 'adm'].indexOf(auth.getString('role') || '') !== -1
    } catch (_) {
      return false
    }
  }
  if (!isStaff()) return e.json(401, { error: 'Acesso restrito à equipe autorizada.' })
  const safeSave = (rec) => {
    try {
      $app.save(rec)
      return true
    } catch (saveErr) {
      console.log('nine_comercial: falha ao salvar registro:', saveErr)
      return false
    }
  }
  try {
    let rec = null
    try {
      rec = $app.findRecordById('contatos', e.request.pathValue('id'))
    } catch (_) {
      rec = null
    }
    if (!rec) return e.json(404, { error: 'Lead não encontrado.' })

    const body = e.requestInfo().body || {}
    const acao = (body.acao || '').trim()
    const responsavel = (body.responsavel || e.auth.getString('name') || 'Equipe CoffeeCast').trim()
    const agoraIso = new Date().toISOString()

    if (!acao) return e.badRequestError('A ação é obrigatória.')

    // 1. Registrar contato (abrir o cadastro NÃO marca como atendido — só a ação real)
    if (acao === 'registrar_contato') {
      const canal = (body.canal || 'whatsapp').trim()
      const resultado = (body.resultado || '').trim()
      const observacoes = (body.observacoes || '').trim()

      let historico = []
      try {
        const raw = rec.getString('historico_atendimento')
        if (raw) historico = JSON.parse(raw)
        if (!Array.isArray(historico)) historico = []
      } catch (_) {
        historico = []
      }

      historico.push({
        data: agoraIso.slice(0, 10),
        data_hora: agoraIso,
        responsavel: responsavel,
        canal: canal,
        resultado: resultado,
        observacoes: observacoes,
      })

      rec.set('historico_atendimento', JSON.stringify(historico))
      rec.set('data_contato', agoraIso)
      if (body.proxima_acao && body.proxima_acao.trim()) {
        rec.set('proxima_acao', body.proxima_acao.trim())
      } else if (resultado) {
        rec.set('proxima_acao', resultado)
      }
      if (body.data_proximo_retorno) rec.set('data_proximo_retorno', body.data_proximo_retorno)
      // Status só muda se a ação real indicar isso
      if (body.status) rec.set('status_comercial', body.status)
    } else if (acao === 'agendar_retorno') {
      const dataRetorno = (body.data || body.data_proximo_retorno || '').trim()
      if (!dataRetorno) return e.badRequestError('Informe a data do próximo retorno.')
      rec.set('data_proximo_retorno', dataRetorno)
      rec.set(
        'proxima_acao',
        (body.observacao || body.proxima_acao || 'Retorno agendado pela equipe').trim(),
      )
      if (body.status) rec.set('status_comercial', body.status)
      else if (rec.getString('status_comercial') === 'novo_lead') {
        rec.set('status_comercial', 'contato_agendado')
      }
      // Tarefa interna de retorno vinculada ao lead (sem duplicar)
      try {
        const tarefaTitulo = 'Retornar contato — Lead CoffeeCast 4.0'
        const existentes = $app.findRecordsByFilter(
          'nine_tarefas',
          `lead = "${rec.id}" && titulo = "${tarefaTitulo}" && status = "pendente"`,
          '-created',
          1,
          0,
        )
        if (!existentes || existentes.length === 0) {
          const tarefasCol = $app.findCollectionByNameOrId('nine_tarefas')
          const t = new Record(tarefasCol)
          t.set('titulo', tarefaTitulo)
          t.set('lead', rec.id)
          t.set('conversation_id', rec.getString('conversation_id'))
          t.set('nome', rec.getString('nome_completo'))
          t.set('telefone', rec.getString('whatsapp') || rec.getString('telefone'))
          t.set('email', rec.getString('email'))
          t.set('motivo', rec.getString('interesse') || 'Retorno comercial')
          t.set('resumo_conversa', rec.getString('resumo_necessidade'))
          t.set('canal_preferido', rec.getString('canal_preferido') || 'whatsapp')
          t.set('horario_preferido', rec.getString('melhor_horario'))
          t.set('link_historico', '/admin/contatos')
          t.set('responsavel', rec.getString('responsavel') || 'Aline Lana')
          t.set('prioridade', rec.getString('prioridade') || 'media')
          t.set('status', 'pendente')
          t.set('prazo', dataRetorno)
          $app.save(t)
        } else {
          // Atualiza a tarefa pendente existente em vez de duplicar
          const t = existentes[0]
          t.set('prazo', dataRetorno)
          t.set('status', 'pendente')
          $app.save(t)
        }
      } catch (tErr) {
        console.log('nine_comercial agendar_retorno tarefa:', tErr)
      }
    } else if (acao === 'alterar_status') {
      const novoStatus = (body.status || body.status_comercial || '').trim()
      const validos = [
        'novo_lead',
        'aguardando_contato',
        'contato_agendado',
        'em_atendimento',
        'convertido',
        'encerrado',
      ]
      if (validos.indexOf(novoStatus) === -1) {
        return e.badRequestError('Status comercial inválido.')
      }
      rec.set('status_comercial', novoStatus)
      const obsStatus = (body.observacoes || '').trim()
      if (obsStatus) {
        rec.set('notas_comerciais', obsStatus)
      }
    } else if (acao === 'observacao') {
      const obs = (body.observacoes || '').trim()
      if (!obs) return e.badRequestError('A observação é obrigatória.')
      rec.set('notas_comerciais', obs)
    } else if (acao === 'definir_prioridade') {
      const pri = (body.prioridade || '').trim()
      if (['baixa', 'media', 'alta'].indexOf(pri) === -1) {
        return e.badRequestError('Prioridade inválida.')
      }
      rec.set('prioridade', pri)
    } else {
      return e.badRequestError('Ação desconhecida: ' + acao)
    }

    if (!safeSave(rec)) {
      return e.json(500, { error: 'Não foi possível salvar a alteração do lead.' })
    }

    return e.json(200, {
      ok: true,
      id: rec.id,
      status_comercial: rec.getString('status_comercial'),
    })
  } catch (err) {
    console.log('Erro na ação do lead:', err)
    return e.json(500, { error: 'Falha ao registrar a ação.' })
  }
})

// ---------------------------------------------------------------------------
// GET /backend/v1/nine/leads/{id}/resumo-ia — resumo objetivo via IA
// ---------------------------------------------------------------------------
routerAdd('GET', '/backend/v1/nine/leads/{id}/resumo-ia', (e) => {
  const isStaff = () => {
    try {
      const auth = e.auth
      if (!auth || !auth.id) return false
      return ['master', 'gerencial', 'adm'].indexOf(auth.getString('role') || '') !== -1
    } catch (_) {
      return false
    }
  }
  if (!isStaff()) return e.json(401, { error: 'Acesso restrito à equipe autorizada.' })
  const safeSave = (rec) => {
    try {
      $app.save(rec)
      return true
    } catch (saveErr) {
      console.log('nine_comercial: falha ao salvar registro:', saveErr)
      return false
    }
  }
  try {
    let rec = null
    try {
      rec = $app.findRecordById('contatos', e.request.pathValue('id'))
    } catch (_) {
      rec = null
    }
    if (!rec) return e.json(404, { error: 'Lead não encontrado.' })

    const conversationId = rec.getString('conversation_id') || ''
    let transcript = ''
    if (conversationId) {
      try {
        const msgs = $app.findRecordsByFilter(
          'nine_mensagens',
          `conversation_id = "${conversationId}"`,
          'created',
          200,
          0,
        )
        for (let i = 0; i < (msgs || []).length; i++) {
          const m = msgs[i]
          const quem = m.getString('remetente') === 'visitante' ? 'Visitante' : 'Nine'
          transcript += `${quem}: ${m.getString('conteudo')}\n`
        }
      } catch (_) {}
    }
    if (!transcript) transcript = 'Sem mensagens registradas nesta conversa.'

    let resumo = ''
    try {
      const chatRes = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é assistente comercial do CoffeeCast 4.0. Resuma a conversa em português do Brasil, fielmente, SEM inventar nada. Use exatamente esta estrutura com quebras de linha:\nQuem é o visitante: ...\nO que deseja: ...\nInformações relevantes: ...\nExpectativa: ...\nCanal preferido: ...\nPróxima ação: ...\nQuando um dado não aparece na conversa, escreva "não informado". Seja objetivo.',
          },
          { role: 'user', content: transcript.slice(0, 12000) },
        ],
      })
      if (chatRes && chatRes.choices && chatRes.choices[0] && chatRes.choices[0].message) {
        resumo = chatRes.choices[0].message.content || ''
      }
    } catch (aiErr) {
      console.log('nine_comercial resumo IA:', aiErr)
    }

    if (!resumo) {
      return e.json(200, {
        resumo_ia:
          'Resumo indisponível no momento. Consulte a conversa completa em "Ver Conversa".',
        salvo: false,
      })
    }

    rec.set('resumo_ia', resumo)
    safeSave(rec)

    return e.json(200, { resumo_ia: resumo, salvo: true })
  } catch (err) {
    console.log('Erro no resumo IA do lead:', err)
    return e.json(500, { error: 'Falha ao gerar o resumo.' })
  }
})

// ---------------------------------------------------------------------------
// GET /backend/v1/nine/tarefas — tarefas internas de retorno (área de Leads)
// ---------------------------------------------------------------------------
routerAdd('GET', '/backend/v1/nine/tarefas', (e) => {
  const isStaff = () => {
    try {
      const auth = e.auth
      if (!auth || !auth.id) return false
      return ['master', 'gerencial', 'adm'].indexOf(auth.getString('role') || '') !== -1
    } catch (_) {
      return false
    }
  }
  if (!isStaff()) return e.json(401, { error: 'Acesso restrito à equipe autorizada.' })
  try {
    let registros = []
    try {
      registros = $app.findRecordsByFilter('nine_tarefas', '', '-created', 200, 0)
    } catch (tErr) {
      console.log('nine_comercial tarefas list:', tErr)
    }

    const hoje = new Date().toISOString().slice(0, 10)
    const contagens = { pendentes: 0, hoje: 0, atrasadas: 0, concluidas: 0 }
    const tarefas = (registros || []).map((t) => {
      const st = t.getString('status')
      const prazo = (t.getString('prazo') || '').slice(0, 10)
      if (st === 'concluida') contagens.concluidas++
      else {
        contagens.pendentes++
        if (prazo && prazo < hoje) contagens.atrasadas++
        else if (prazo && prazo === hoje) contagens.hoje++
      }
      return {
        id: t.id,
        titulo: t.getString('titulo'),
        lead: t.getString('lead'),
        conversation_id: t.getString('conversation_id'),
        nome: t.getString('nome'),
        telefone: t.getString('telefone'),
        email: t.getString('email'),
        motivo: t.getString('motivo'),
        resumo_conversa: t.getString('resumo_conversa'),
        canal_preferido: t.getString('canal_preferido'),
        horario_preferido: t.getString('horario_preferido'),
        link_historico: t.getString('link_historico'),
        responsavel: t.getString('responsavel'),
        prioridade: t.getString('prioridade') || 'media',
        prazo: t.getString('prazo'),
        status: st || 'pendente',
        created: t.getString('created'),
      }
    })

    return e.json(200, { tarefas: tarefas, contagens: contagens })
  } catch (err) {
    console.log('Erro no endpoint nine/tarefas:', err)
    return e.json(500, { error: 'Falha ao carregar tarefas.' })
  }
})

// ---------------------------------------------------------------------------
// PATCH /backend/v1/nine/tarefas/{id} — concluir/reabrir tarefa
// ---------------------------------------------------------------------------
routerAdd('PATCH', '/backend/v1/nine/tarefas/{id}', (e) => {
  const isStaff = () => {
    try {
      const auth = e.auth
      if (!auth || !auth.id) return false
      return ['master', 'gerencial', 'adm'].indexOf(auth.getString('role') || '') !== -1
    } catch (_) {
      return false
    }
  }
  if (!isStaff()) return e.json(401, { error: 'Acesso restrito à equipe autorizada.' })
  try {
    let rec = null
    try {
      rec = $app.findRecordById('nine_tarefas', e.request.pathValue('id'))
    } catch (_) {
      rec = null
    }
    if (!rec) return e.json(404, { error: 'Tarefa não encontrada.' })

    const body = e.requestInfo().body || {}
    const status = (body.status || '').trim()
    if (['pendente', 'concluida'].indexOf(status) === -1) {
      return e.badRequestError('Status inválido para a tarefa.')
    }

    rec.set('status', status)
    if (status === 'concluida') {
      rec.set('concluida_em', new Date().toISOString())
    } else {
      rec.set('concluida_em', null)
    }
    try {
      $app.save(rec)
    } catch (saveErr) {
      console.log('nine_comercial: falha ao salvar tarefa:', saveErr)
      return e.json(500, { error: 'Não foi possível salvar a tarefa.' })
    }

    return e.json(200, { ok: true, id: rec.id, status: status })
  } catch (err) {
    console.log('Erro na ação da tarefa:', err)
    return e.json(500, { error: 'Falha ao atualizar a tarefa.' })
  }
})
