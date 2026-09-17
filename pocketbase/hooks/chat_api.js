// pocketbase/hooks/chat_api.js
// Endpoints e validações para o sistema de Chat e Gestão de Conversas do CoffeeCast 4.0
// Regras fundamentais:
// 1. Anti-duplicidade em conversas privadas (garantido no servidor)
// 2. Criação de grupos com participantes
// 3. Gestão exclusiva para Master (/backend/v1/chat/admin/...)
// 4. Listagem de usuários elegíveis para chat com identificação, nível de acesso e status em tempo real
// 5. Sistema de status (online, offline, em_pausa com motivo obrigatório) e heartbeat

// Helper / Endpoint para listar usuários ativos elegíveis para o Chat (com foto, nome, role, status e pause_reason)
routerAdd(
  'GET',
  '/backend/v1/chat/users',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito a usuários autenticados.')
      }

      // Atualiza last_seen do usuário solicitante
      try {
        const nowIso = new Date().toISOString()
        authUser.set('last_seen', nowIso)
        // Se o usuário não estiver em_pausa, pode ser considerado online
        if (authUser.getString('status') !== 'em_pausa') {
          authUser.set('status', 'online')
        }
        $app.save(authUser)
      } catch (_) {}

      // Buscar todos os usuários cadastrados e ativos no sistema (níveis prata, ouro, gerencial, adm, master)
      const records = $app.findRecordsByFilter(
        '_pb_users_auth_',
        'ativo = true',
        'name,email',
        500,
        0,
      )

      const nowMs = Date.now()
      // Usuário considerado offline se last_seen for superior a 3 minutos e status não for 'em_pausa'
      const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000

      const users = records.map((u) => {
        let status = u.getString('status') || 'offline'
        const pauseReason = u.getString('pause_reason') || ''
        const lastSeenStr = u.getString('last_seen')

        if (status === 'em_pausa') {
          // Mantém em pausa
        } else if (lastSeenStr) {
          const lastSeenMs = new Date(lastSeenStr).getTime()
          if (!isNaN(lastSeenMs) && nowMs - lastSeenMs <= OFFLINE_THRESHOLD_MS) {
            status = 'online'
          } else {
            status = 'offline'
          }
        } else {
          status = 'offline'
        }

        return {
          id: u.id,
          name: u.getString('name') || u.getString('email').split('@')[0],
          email: u.getString('email'),
          avatar: u.getString('avatar') || '',
          role: u.getString('role') || 'prata',
          bio: u.getString('bio') || '',
          status: status,
          pause_reason: status === 'em_pausa' ? pauseReason : '',
          last_seen: lastSeenStr || '',
          status_updated: u.getString('status_updated') || '',
        }
      })

      return e.json(200, { success: true, users: users })
    } catch (err) {
      console.log('Erro ao listar usuários para chat:', err)
      return e.json(500, { error: 'Falha ao buscar usuários: ' + (err.message || String(err)) })
    }
  },
  $apis.requireAuth(),
)

// Endpoint para heartbeat e atualização de status em segundo plano
routerAdd(
  'POST',
  '/backend/v1/chat/heartbeat',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito.')
      }

      const nowIso = new Date().toISOString()
      authUser.set('last_seen', nowIso)
      if (authUser.getString('status') !== 'em_pausa') {
        authUser.set('status', 'online')
      }
      $app.save(authUser)

      return e.json(200, {
        success: true,
        status: authUser.getString('status') || 'online',
        pause_reason: authUser.getString('pause_reason') || '',
        last_seen: nowIso,
      })
    } catch (err) {
      return e.json(500, { error: 'Falha no heartbeat: ' + (err.message || String(err)) })
    }
  },
  $apis.requireAuth(),
)

// Endpoint para o usuário alterar seu próprio status no Chat (Online, Offline, Em pausa com motivo obrigatório)
// e registrar evento de auditoria com diff_antes, diff_depois, tempo de permanência, IP e dispositivo
routerAdd(
  'POST',
  '/backend/v1/chat/status',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso restrito a usuários autenticados.')
      }

      const body = e.requestInfo().body || {}
      const headers = e.requestInfo().headers || {}
      const targetStatus = (body.status || '').trim().toLowerCase()
      const pauseReason = (body.pause_reason || '').trim()

      if (!['online', 'offline', 'em_pausa'].includes(targetStatus)) {
        return e.badRequestError('Status inválido. Escolha entre: online, offline ou em_pausa.')
      }

      if (targetStatus === 'em_pausa' && !pauseReason) {
        return e.badRequestError('Ao escolher "Em pausa", é obrigatório informar o motivo.')
      }

      const oldStatus = authUser.getString('status') || 'offline'
      const oldPauseReason = authUser.getString('pause_reason') || ''
      const oldStatusUpdated = authUser.getString('status_updated') || authUser.getString('created')
      const nowIso = new Date().toISOString()

      // Calcular tempo permanecido no status anterior
      let duracaoSegundos = 0
      if (oldStatusUpdated) {
        const prevMs = new Date(oldStatusUpdated).getTime()
        const nowMs = new Date(nowIso).getTime()
        if (!isNaN(prevMs) && nowMs > prevMs) {
          duracaoSegundos = Math.round((nowMs - prevMs) / 1000)
        }
      }

      // Atualizar no usuário
      authUser.set('status', targetStatus)
      authUser.set('pause_reason', targetStatus === 'em_pausa' ? pauseReason : '')
      authUser.set('status_updated', nowIso)
      authUser.set('last_seen', nowIso)
      $app.save(authUser)

      // Extração de IP e dispositivo para auditoria
      let ip =
        headers['x-forwarded-for'] || headers['x-real-ip'] || headers['cf-connecting-ip'] || ''
      if (ip && ip.includes(',')) ip = ip.split(',')[0].trim()

      const userAgent = headers['user-agent'] || ''
      let dispositivo = 'Desktop'
      if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
        dispositivo = 'Mobile'
      } else if (/tablet/i.test(userAgent)) {
        dispositivo = 'Tablet'
      }

      let navegador = 'Desconhecido'
      if (/edg/i.test(userAgent)) navegador = 'Edge'
      else if (/chrome/i.test(userAgent)) navegador = 'Chrome'
      else if (/firefox/i.test(userAgent)) navegador = 'Firefox'
      else if (/safari/i.test(userAgent)) navegador = 'Safari'

      // Registrar na Auditoria do Sistema
      try {
        const colAudit = $app.findCollectionByNameOrId('auditoria_eventos')
        const auditRec = new Record(colAudit)
        auditRec.set('usuario_id', authUser.id)
        auditRec.set('usuario_email', authUser.getString('email'))
        auditRec.set('usuario_nome', authUser.getString('name') || authUser.getString('email'))
        auditRec.set('usuario_role', authUser.getString('role') || 'prata')
        auditRec.set('tipo_acao', 'alteracao_status')
        auditRec.set('area_sistema', 'Chat e Conversas')

        let desc = 'Status alterado de ' + oldStatus + ' para ' + targetStatus
        if (targetStatus === 'em_pausa') {
          desc += ' (Motivo: ' + pauseReason + ')'
        }
        if (duracaoSegundos > 0) {
          const minutos = Math.round(duracaoSegundos / 60)
          desc +=
            ' — permaneceu ' +
            (minutos > 0 ? minutos + ' min' : duracaoSegundos + ' s') +
            ' no status anterior'
        }

        auditRec.set('descricao', desc)
        auditRec.set('registro_afetado', authUser.id)
        auditRec.set('tabela_afetada', 'users')
        auditRec.set('ip', ip)
        auditRec.set('dispositivo', dispositivo)
        auditRec.set('navegador', navegador)
        auditRec.set('resultado', 'sucesso')
        auditRec.set('diff_antes', {
          status: oldStatus,
          pause_reason: oldPauseReason,
          status_updated: oldStatusUpdated,
        })
        auditRec.set('diff_depois', {
          status: targetStatus,
          pause_reason: targetStatus === 'em_pausa' ? pauseReason : '',
          status_updated: nowIso,
          duracao_status_anterior_segundos: duracaoSegundos,
        })
        auditRec.set('metadata', {
          duracao_segundos: duracaoSegundos,
          origem: 'chat_status_picker',
        })
        $app.save(auditRec)
      } catch (auditErr) {
        console.log('Aviso ao registrar auditoria de mudança de status:', auditErr)
      }

      return e.json(200, {
        success: true,
        status: targetStatus,
        pause_reason: targetStatus === 'em_pausa' ? pauseReason : '',
        status_updated: nowIso,
      })
    } catch (err) {
      console.log('Erro ao alterar status de usuário:', err)
      return e.json(500, { error: 'Falha ao alterar status: ' + (err.message || String(err)) })
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
          status: u.getString('status') || 'offline',
          pause_reason: u.getString('pause_reason') || '',
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
            status: uInfo.status,
            pause_reason: uInfo.pause_reason,
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

        let totalMensagens = 0
        try {
          totalMensagens = $app.countRecords('chat_mensagens', 'conversa = "' + cid + '"')
        } catch (_) {
          const countRows = $app.findRecordsByFilter(
            'chat_mensagens',
            'conversa = {:conversa}',
            '',
            1,
            0,
            { conversa: cid },
          )
          totalMensagens = countRows.length
        }

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
