// pocketbase/hooks/chat_api.js
// Endpoints e validações para o sistema de Chat e Gestão de Conversas do CoffeeCast 4.0
// Regras fundamentais:
// 1. Anti-duplicidade em conversas privadas (garantido no servidor)
// 2. Criação de grupos com participantes
// 3. Gestão exclusiva para Master (/backend/v1/chat/admin/...)
// 4. Listagem de usuários elegíveis para chat com identificação e nível de acesso

// Helper / Endpoint para listar usuários ativos elegíveis para o Chat (com foto, nome, role e id)
routerAdd(
  'GET',
  '/backend/v1/chat/users',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito a usuários autenticados.')
      }

      // Buscar todos os usuários ativos
      const records = $app.findRecordsByFilter(
        '_pb_users_auth_',
        'ativo = true',
        'name,email',
        200,
        0,
      )

      const users = records.map((u) => ({
        id: u.id,
        name: u.getString('name') || u.getString('email').split('@')[0],
        email: u.getString('email'),
        avatar: u.getString('avatar') || '',
        role: u.getString('role') || 'prata',
        bio: u.getString('bio') || '',
      }))

      return e.json(200, { success: true, users: users })
    } catch (err) {
      console.log('Erro ao listar usuários para chat:', err)
      return e.json(500, { error: 'Falha ao buscar usuários: ' + (err.message || String(err)) })
    }
  },
  $apis.requireAuth(),
)

// Endpoint para obter ou criar conversa privada anti-duplicidade
routerAdd(
  'POST',
  '/backend/v1/chat/private/start',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito.')
      }

      const body = e.requestInfo().body || {}
      const targetUserId = (body.target_user_id || '').trim()

      if (!targetUserId) {
        return e.badRequestError('ID do usuário destinatário é obrigatório.')
      }

      if (targetUserId === authUser.id) {
        return e.badRequestError('Não é possível criar conversa privada consigo mesmo.')
      }

      // Verificar se o target user existe
      let targetUser = null
      try {
        targetUser = $app.findFirstRecordByData('_pb_users_auth_', 'id', targetUserId)
      } catch (_) {
        return e.notFoundError('Usuário destinatário não encontrado.')
      }

      // Criar pair ordenado lexicograficamente para unicidade exata
      const currentId = authUser.id
      const pairKey =
        currentId < targetUserId ? currentId + ':' + targetUserId : targetUserId + ':' + currentId

      // Verificar se já existe conversa com esse private_pair
      let existingConversa = null
      try {
        existingConversa = $app.findFirstRecordByData('chat_conversas', 'private_pair', pairKey)
      } catch (_) {
        // Não existe ainda
      }

      if (existingConversa) {
        // Garantir que ambos os participantes existem no chat_participantes
        try {
          $app.findFirstRecordByFilter(
            'chat_participantes',
            'conversa = {:conversa} && user = {:user}',
            { conversa: existingConversa.id, user: currentId },
          )
        } catch (_) {
          const colPart = $app.findCollectionByNameOrId('chat_participantes')
          const p1 = new Record(colPart)
          p1.set('conversa', existingConversa.id)
          p1.set('user', currentId)
          $app.save(p1)
        }

        try {
          $app.findFirstRecordByFilter(
            'chat_participantes',
            'conversa = {:conversa} && user = {:user}',
            { conversa: existingConversa.id, user: targetUserId },
          )
        } catch (_) {
          const colPart = $app.findCollectionByNameOrId('chat_participantes')
          const p2 = new Record(colPart)
          p2.set('conversa', existingConversa.id)
          p2.set('user', targetUserId)
          $app.save(p2)
        }

        return e.json(200, {
          success: true,
          createdNew: false,
          conversa: {
            id: existingConversa.id,
            tipo: 'privado',
            private_pair: pairKey,
            created: existingConversa.getString('created'),
            updated: existingConversa.getString('updated'),
          },
        })
      }

      // Criar nova conversa privada
      const colConversas = $app.findCollectionByNameOrId('chat_conversas')
      const novaConversa = new Record(colConversas)
      novaConversa.set('tipo', 'privado')
      novaConversa.set('criador', currentId)
      novaConversa.set('private_pair', pairKey)
      novaConversa.set('nome', '')
      $app.save(novaConversa)

      // Registrar os dois participantes
      const colPart = $app.findCollectionByNameOrId('chat_participantes')
      const p1 = new Record(colPart)
      p1.set('conversa', novaConversa.id)
      p1.set('user', currentId)
      $app.save(p1)

      const p2 = new Record(colPart)
      p2.set('conversa', novaConversa.id)
      p2.set('user', targetUserId)
      $app.save(p2)

      return e.json(200, {
        success: true,
        createdNew: true,
        conversa: {
          id: novaConversa.id,
          tipo: 'privado',
          private_pair: pairKey,
          created: novaConversa.getString('created'),
          updated: novaConversa.getString('updated'),
        },
      })
    } catch (err) {
      console.log('Erro ao iniciar conversa privada:', err)
      return e.json(500, {
        error: 'Falha ao iniciar conversa privada: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)

// Endpoint para criar Grupo
routerAdd(
  'POST',
  '/backend/v1/chat/group/create',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito.')
      }

      const body = e.requestInfo().body || {}
      const nome = (body.nome || '').trim()
      const descricao = (body.descricao || '').trim()
      const participantIds = Array.isArray(body.participant_ids) ? body.participant_ids : []

      if (!nome) {
        return e.badRequestError('O nome do grupo é obrigatório.')
      }

      // Criar conversa de grupo
      const colConversas = $app.findCollectionByNameOrId('chat_conversas')
      const grupo = new Record(colConversas)
      grupo.set('tipo', 'grupo')
      grupo.set('nome', nome)
      grupo.set('descricao', descricao)
      grupo.set('criador', authUser.id)
      $app.save(grupo)

      const colPart = $app.findCollectionByNameOrId('chat_participantes')

      // Criador sempre entra como admin do grupo
      const pCriador = new Record(colPart)
      pCriador.set('conversa', grupo.id)
      pCriador.set('user', authUser.id)
      pCriador.set('is_admin', true)
      $app.save(pCriador)

      // Adicionar demais participantes
      for (let i = 0; i < participantIds.length; i++) {
        const uid = String(participantIds[i]).trim()
        if (uid && uid !== authUser.id) {
          try {
            const p = new Record(colPart)
            p.set('conversa', grupo.id)
            p.set('user', uid)
            p.set('is_admin', false)
            $app.save(p)
          } catch (errPart) {
            console.log('Aviso ao adicionar participante ' + uid + ' ao grupo:', errPart)
          }
        }
      }

      // Mensagem inicial de criação
      const colMsg = $app.findCollectionByNameOrId('chat_mensagens')
      const msg = new Record(colMsg)
      msg.set('conversa', grupo.id)
      msg.set('remetente', authUser.id)
      msg.set('texto', 'Grupo criado por ' + (authUser.getString('name') || 'Membro') + ': ' + nome)
      $app.save(msg)

      return e.json(200, {
        success: true,
        conversa: {
          id: grupo.id,
          tipo: 'grupo',
          nome: grupo.getString('nome'),
          descricao: grupo.getString('descricao'),
          criador: grupo.getString('criador'),
        },
      })
    } catch (err) {
      console.log('Erro ao criar grupo de chat:', err)
      return e.json(500, { error: 'Falha ao criar grupo: ' + (err.message || String(err)) })
    }
  },
  $apis.requireAuth(),
)

// Endpoint exclusivo Master: Listagem completa de conversas com contadores e participantes
routerAdd(
  'GET',
  '/backend/v1/chat/admin/overview',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito.')
      }

      if (authUser.getString('role') !== 'master') {
        return e.forbiddenError('Acesso exclusivo ao perfil Master.')
      }

      // Buscar todas as conversas
      const conversas = $app.findRecordsByFilter('chat_conversas', '', '-updated', 200, 0)
      const usersRecords = $app.findRecordsByFilter('_pb_users_auth_', '', '', 500, 0)
      const userMap = {}
      for (let i = 0; i < usersRecords.length; i++) {
        const u = usersRecords[i]
        userMap[u.id] = {
          id: u.id,
          name: u.getString('name') || u.getString('email').split('@')[0],
          email: u.getString('email'),
          avatar: u.getString('avatar') || '',
          role: u.getString('role') || 'prata',
        }
      }

      const items = []

      for (let i = 0; i < conversas.length; i++) {
        const c = conversas[i]
        const cid = c.id
        const tipo = c.getString('tipo')

        // Buscar participantes
        const parts = $app.findRecordsByFilter(
          'chat_participantes',
          'conversa = {:conversa}',
          'created',
          100,
          0,
          { conversa: cid },
        )

        const participantes = parts.map((p) => {
          const uid = p.getString('user')
          const uInfo = userMap[uid] || { id: uid, name: 'Usuário', role: 'prata' }
          return {
            id: p.id,
            user_id: uid,
            name: uInfo.name,
            email: uInfo.email,
            avatar: uInfo.avatar,
            role: uInfo.role,
            is_admin: p.getBool('is_admin'),
          }
        })

        // Buscar contagem de mensagens e primeira/última mensagem
        const msgsAsc = $app.findRecordsByFilter(
          'chat_mensagens',
          'conversa = {:conversa}',
          'created',
          1,
          0,
          { conversa: cid },
        )
        const msgsDesc = $app.findRecordsByFilter(
          'chat_mensagens',
          'conversa = {:conversa}',
          '-created',
          1,
          0,
          { conversa: cid },
        )

        // Contagem total
        const countQuery = $app
          .db()
          .newQuery('SELECT count(*) as total FROM chat_mensagens WHERE conversa = {:conversa}')
          .bind({ conversa: cid })
        const countRow = {}
        countQuery.one(countRow)
        const totalMensagens = countRow.total || 0

        const primeiraMensagem =
          msgsAsc.length > 0
            ? {
                data: msgsAsc[0].getString('created'),
                texto: msgsAsc[0].getString('texto'),
              }
            : null

        const ultimaMensagem =
          msgsDesc.length > 0
            ? {
                data: msgsDesc[0].getString('created'),
                texto: msgsDesc[0].getString('texto'),
                remetente_id: msgsDesc[0].getString('remetente'),
                remetente_nome:
                  userMap[msgsDesc[0].getString('remetente')]?.name || 'Membro CoffeeCast',
              }
            : null

        items.push({
          id: c.id,
          tipo: tipo,
          nome:
            tipo === 'geral'
              ? 'Chat Geral CoffeeCast'
              : tipo === 'grupo'
                ? c.getString('nome') || 'Grupo sem nome'
                : participantes.map((p) => p.name).join(' & ') || 'Conversa Privada',
          descricao: c.getString('descricao') || '',
          criador: userMap[c.getString('criador')] || null,
          participantes: participantes,
          total_mensagens: totalMensagens,
          primeira_mensagem: primeiraMensagem,
          ultima_mensagem: ultimaMensagem,
          created: c.getString('created'),
          updated: c.getString('updated'),
        })
      }

      return e.json(200, {
        success: true,
        conversas: items,
      })
    } catch (err) {
      console.log('Erro em chat overview:', err)
      return e.json(500, { error: 'Falha no painel de conversas: ' + (err.message || String(err)) })
    }
  },
  $apis.requireAuth(),
)

// Endpoint exclusivo Master: Excluir mensagem específica
routerAdd(
  'POST',
  '/backend/v1/chat/admin/message/delete',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito.')
      }

      if (authUser.getString('role') !== 'master') {
        return e.forbiddenError('Apenas o Master pode excluir mensagens de terceiros.')
      }

      const body = e.requestInfo().body || {}
      const messageId = (body.message_id || '').trim()

      if (!messageId) {
        return e.badRequestError('ID da mensagem é obrigatório.')
      }

      const msgRecord = $app.findFirstRecordByData('chat_mensagens', 'id', messageId)
      $app.delete(msgRecord)

      return e.json(200, {
        success: true,
        message: 'Mensagem excluída com sucesso pelo Master.',
      })
    } catch (err) {
      console.log('Erro ao excluir mensagem:', err)
      return e.json(500, {
        error: 'Falha ao excluir mensagem: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)

// Endpoint exclusivo Master: Excluir conversa inteira e histórico
routerAdd(
  'POST',
  '/backend/v1/chat/admin/conversa/delete',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito.')
      }

      if (authUser.getString('role') !== 'master') {
        return e.forbiddenError('Apenas o Master pode excluir conversas inteiras.')
      }

      const body = e.requestInfo().body || {}
      const conversaId = (body.conversa_id || '').trim()

      if (!conversaId) {
        return e.badRequestError('ID da conversa é obrigatório.')
      }

      const conversaRecord = $app.findFirstRecordByData('chat_conversas', 'id', conversaId)

      if (conversaRecord.getString('tipo') === 'geral') {
        return e.badRequestError(
          'O Chat Geral oficial não pode ser excluído. Você pode limpar mensagens específicas se necessário.',
        )
      }

      // Deletar mensagens relacionadas
      $app
        .db()
        .newQuery('DELETE FROM chat_mensagens WHERE conversa = {:conversa}')
        .bind({ conversa: conversaId })
        .execute()

      // Deletar participantes relacionados
      $app
        .db()
        .newQuery('DELETE FROM chat_participantes WHERE conversa = {:conversa}')
        .bind({ conversa: conversaId })
        .execute()

      // Deletar conversa
      $app.delete(conversaRecord)

      return e.json(200, {
        success: true,
        message: 'Conversa e participantes excluídos com sucesso.',
      })
    } catch (err) {
      console.log('Erro ao excluir conversa pelo Master:', err)
      return e.json(500, {
        error: 'Falha ao excluir conversa: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)
