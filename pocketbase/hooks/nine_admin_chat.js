// Endpoints administrativos para a Nine Assistente Virtual
// Permite que Master e Gerencial enviem respostas humanas, alterem modo da conversa e atualizem treinamento

// Enviar resposta humana direto do painel administrativo
routerAdd(
  'POST',
  '/backend/v1/nine/admin/reply',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.unauthorizedError('Acesso restrito ao painel administrativo.')
      }

      const body = e.requestInfo().body || {}
      const conversationId = (body.conversation_id || '').trim()
      const content = (body.message || '').trim()

      if (!conversationId) {
        return e.badRequestError('conversation_id é obrigatório.')
      }

      if (!content) {
        return e.badRequestError('A mensagem não pode estar vazia.')
      }

      // Localizar a conversa
      let conversaRecord = null
      try {
        conversaRecord = $app.findFirstRecordByData(
          'nine_conversas',
          'conversation_id',
          conversationId,
        )
      } catch (_) {}

      if (!conversaRecord) {
        return e.notFoundError('Conversa não encontrada.')
      }

      const mensagensCol = $app.findCollectionByNameOrId('nine_mensagens')
      const attendantName = user.getString('name') || 'Equipe CoffeeCast'

      // Salvar mensagem como 'humano'
      const newMsg = new Record(mensagensCol)
      newMsg.set('conversation_id', conversationId)
      newMsg.set('remetente', 'humano')
      newMsg.set('remetente_nome', attendantName)
      newMsg.set('conteudo', content)
      $app.save(newMsg)

      // Atualizar conversa: modo agora é humano_respondendo, gravar última mensagem
      conversaRecord.set('modo_atendimento', 'humano_respondendo')
      conversaRecord.set('atendente_humano_nome', attendantName)
      conversaRecord.set('ultima_mensagem', content)
      conversaRecord.set('ultimo_remetente', 'humano')
      conversaRecord.set('data_ultima_mensagem', new Date().toISOString())
      conversaRecord.set('total_mensagens', (conversaRecord.getInt('total_mensagens') || 0) + 1)
      $app.save(conversaRecord)

      return e.json(200, {
        success: true,
        message_id: newMsg.id,
        conversation_id: conversationId,
        modo_atendimento: 'humano_respondendo',
        remetente_nome: attendantName,
        created: newMsg.getString('created'),
      })
    } catch (err) {
      console.log('Erro ao enviar resposta humana pelo painel:', err)
      return e.json(500, { error: 'Falha ao registrar resposta humana.' })
    }
  },
  $apis.requireAuth(),
)

// Alterar modo da conversa (alternar entre "automatico" e "humano_respondendo" / "aguardando_humano")
routerAdd(
  'POST',
  '/backend/v1/nine/admin/toggle-mode',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.unauthorizedError('Acesso restrito ao painel administrativo.')
      }

      const body = e.requestInfo().body || {}
      const conversationId = (body.conversation_id || '').trim()
      const newMode = (body.modo_atendimento || '').trim()

      if (!conversationId) {
        return e.badRequestError('conversation_id é obrigatório.')
      }

      const validModes = ['automatico', 'aguardando_humano', 'humano_respondendo']
      if (!validModes.includes(newMode)) {
        return e.badRequestError('Modo de atendimento inválido.')
      }

      let conversaRecord = null
      try {
        conversaRecord = $app.findFirstRecordByData(
          'nine_conversas',
          'conversation_id',
          conversationId,
        )
      } catch (_) {}

      if (!conversaRecord) {
        return e.notFoundError('Conversa não encontrada.')
      }

      conversaRecord.set('modo_atendimento', newMode)
      if (newMode === 'humano_respondendo') {
        conversaRecord.set('atendente_humano_nome', user.getString('name') || 'Equipe CoffeeCast')
      }
      $app.save(conversaRecord)

      return e.json(200, {
        success: true,
        conversation_id: conversationId,
        modo_atendimento: newMode,
      })
    } catch (err) {
      console.log('Erro ao alternar modo de atendimento da conversa:', err)
      return e.json(500, { error: 'Falha ao atualizar modo de atendimento.' })
    }
  },
  $apis.requireAuth(),
)
