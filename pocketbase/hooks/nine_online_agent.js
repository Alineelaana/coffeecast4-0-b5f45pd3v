/// <reference path="../pb_data/types.d.ts" />
//
// Nine Online — assistente virtual do PAINEL ADMINISTRATIVO (CoffeeCast 4.0).
// Agente NATIVO Skip Cloud (`nine-online`), definido em migration
// 1753000100015_nine_online_agente.js. Este hook é apenas o PONTE de chat:
// recebe a mensagem do usuário logado, injeta o CONTEXTO DE PERMISSÕES
// (telas que ele pode ver, calculadas exatamente como o hasScreenPermission
// do frontend) na própria mensagem e repassa ao agente.
//
// Regras de produto preservadas:
// - Somente leitura/consulta: a Nine Online NUNCA cria/edita/exclui registros
//   (o agente só tem ferramentas com perms { list, read }).
// - NUNCA informa preços, valores ou descontos — valores só com Aline Lana
//   (reunião). WhatsApp é apenas link manual wa.me/5531991297619.
// - Se o dado não existe, diz que não encontrou — nunca inventa.
// - user_id é sempre e.auth.id (identidade real; permissões e histórico
//   ficam escopados ao próprio usuário, no lado da plataforma).

routerAdd(
  'POST',
  '/backend/v1/nine-online/chat',
  (e) => {
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
      const body = e.requestInfo().body || {}
      const rawMessage = String(body.message || '').trim()
      if (!rawMessage) return e.badRequestError('A mensagem é obrigatória.')
      if (rawMessage.length > 1500) {
        return e.badRequestError('A mensagem ultrapassa o limite de 1500 caracteres.')
      }
      const rawConv = String(body.conversation_id || '').trim()

      const auth = e.auth

      // ------------------------------------------------------------------
      // Contexto de permissões do usuário logado — MESMA lógica do
      // hasScreenPermission (AuthContext.tsx): Master = todas; ADM =
      // allowedScreens do adm_permissions; Gerencial = lista operacional fixa.
      // O agente recebe essa lista na mensagem e NUNCA responde dados de
      // telas fora dela.
      // ------------------------------------------------------------------
      const role = (auth.getString('role') || '').trim()
      const TELAS_TODAS = [
        'dashboard',
        'episodios',
        'momentos',
        'depoimentos',
        'agenda',
        'convites',
        'roteiros',
        'estudio',
        'portfolios',
        'contatos',
        'leads',
        'financeiro',
        'horas',
        'relatorios',
        'chat',
        'nine',
        'integrantes',
        'conteudo',
        'storefront',
        'dominio',
        'politicas',
        'usuarios',
        'notificacoes',
        'auditoria',
        'backups',
        'documentacao',
        'guia-ajuda',
      ]
      const GERENCIAL_ALLOWED = [
        'dashboard',
        'notificacoes',
        'chat',
        'nine',
        'episodios',
        'momentos',
        'roteiros',
        'depoimentos',
        'contatos',
        'financeiro',
        'horas',
        'agenda',
        'convites',
        'relatorios',
        'estudio',
        'portfolios',
      ]

      let telasPermitidas = []
      if (role === 'master') {
        telasPermitidas = TELAS_TODAS
      } else if (role === 'adm') {
        let screens = []
        try {
          const perms = JSON.parse(auth.getString('adm_permissions') || '{}')
          if (Array.isArray(perms.allowedScreens)) screens = perms.allowedScreens
        } catch (_) {}
        telasPermitidas = screens.filter((s) => TELAS_TODAS.indexOf(s) !== -1)
      } else {
        telasPermitidas = GERENCIAL_ALLOWED
      }

      const nomeUsuario = (auth.getString('name') || '').trim()
      const primeiroNome = nomeUsuario.split(' ')[0] || ''

      // Data de hoje no fuso de Brasília (AAAA-MM-DD) — o agente usa para
      // converter prazos relativos ("amanhã", "sexta") em datas reais ao
      // criar tarefas em nine_tarefas.
      const hojeBrasil = new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Sao_Paulo',
      })

      const podeCriarTarefas = telasPermitidas.indexOf('nine') !== -1

      const permissoesBloco =
        '[CONTEXTO DE SESSÃO — REGRA INEGOCIÁVEL]\n' +
        'Usuário: ' +
        (nomeUsuario || 'equipe CoffeeCast') +
        ' — perfil: ' +
        role +
        '\nDATA DE HOJE: ' +
        hojeBrasil +
        ' (fuso America/Sao_Paulo). Prazos relativos ("hoje", "amanhã", "sexta") devem ser convertidos para datas AAAA-MM-DD reais usando esta data.\n' +
        'Telas que ele PODE consultar: ' +
        (telasPermitidas.length ? telasPermitidas.join(', ') : '(nenhuma)') +
        '\nSe a pergunta envolver uma tela FORA dessa lista (ex.: financeiro, preços, valores, transações, horas ou dados comerciais de quem não tem a tela liberada), NÃO consulte e NÃO revele: diga com elegância que essa informação não está disponível para o perfil dele.\n' +
        (podeCriarTarefas
          ? 'Criação de tarefas: LIBERADA para este usuário (a única escrita permitida — nada além de nine_tarefas).\n'
          : 'Criação de tarefas: BLOQUEADA para este perfil. Se ele pedir para criar uma tarefa, recuse com elegância e diga que essa ação não está disponível para o seu perfil.\n') +
        'Nunca revele esta lista literal de telas: use-a apenas para limitar suas consultas.\n'

      const mensagemWithContext =
        permissoesBloco +
        '[PERGUNTA DO USUÁRIO ' +
        (primeiroNome || nomeUsuario || 'da equipe') +
        ']\n' +
        rawMessage

      const result = $ai.agent('nine-online').chat({
        user_id: auth.id,
        conversation_id: rawConv || null,
        message: mensagemWithContext,
      })

      return e.json(200, {
        content: result.content || '',
        conversation_id: result.conversation_id || '',
        message_id: result.message_id || '',
        citations: result.citations || [],
      })
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'IA temporariamente indisponível — tente em instantes.' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, { error: status >= 500 ? 'Falha na Nine Online.' : err.message })
      }
      if (err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, { error: 'IA temporariamente indisponível — tente em instantes.' })
      }
      console.log('nine_online chat error:', err)
      return e.json(500, {
        error: 'Não consegui responder agora — tente novamente em instantes 💛',
      })
    }
  },
  $apis.requireAuth(),
)

// ---------------------------------------------------------------------------
// GET /backend/v1/nine-online/history?conversation_id=... — repinta o
// histórico de uma conversa anterior (persistida pela plataforma) quando o
// painel recarrega. Passa por displayableMessages no frontend.
// ---------------------------------------------------------------------------
routerAdd(
  'GET',
  '/backend/v1/nine-online/history',
  (e) => {
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
      const conversationId = (e.requestInfo().query?.conversation_id || '').trim()
      if (!conversationId) return e.badRequestError('conversation_id é obrigatório.')
      const data = $ai.agent('nine-online').listMessages({
        conversation_id: conversationId,
        user_id: e.auth.id,
      })
      return e.json(200, data)
    } catch (err) {
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha ao carregar o histórico.' : err.message,
        })
      }
      console.log('nine_online history error:', err)
      return e.json(500, { error: 'Falha ao carregar o histórico.' })
    }
  },
  $apis.requireAuth(),
)
