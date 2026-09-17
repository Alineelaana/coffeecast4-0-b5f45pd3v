/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const contatosCol = app.findCollectionByNameOrId('contatos')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Flexibilizar campos do formulário para permitir contatos gerados via Chat/IA
    // No formulário antigo do site, idade/profissao/motivo eram obrigatórios.
    // Leads vindos do Chat da Nine possuem nome, e-mail, telefone/WhatsApp e histórico de conversa.
    const fieldsToOptional = [
      'idade',
      'profissao',
      'instagram',
      'telefone',
      'whatsapp',
      'motivo',
      'como_nos_conheceu',
    ]

    for (let i = 0; i < fieldsToOptional.length; i++) {
      const fName = fieldsToOptional[i]
      const f = contatosCol.fields.getByName(fName)
      if (f) {
        f.required = false
      }
    }

    // 2. Adicionar campo 'origem' (ex: "Nine — Chat do Site", "Formulário do Site")
    if (!contatosCol.fields.getByName('origem')) {
      contatosCol.fields.add(
        new TextField({
          name: 'origem',
          required: false,
        }),
      )
    }

    // 3. Adicionar campo 'user' (relation com users - opcional)
    if (!contatosCol.fields.getByName('user')) {
      contatosCol.fields.add(
        new RelationField({
          name: 'user',
          collectionId: usersCol.id,
          required: false,
          maxSelect: 1,
        }),
      )
    }

    // 4. Adicionar campo 'conversation_id' para linkar direto à conversa da Nine
    if (!contatosCol.fields.getByName('conversation_id')) {
      contatosCol.fields.add(
        new TextField({
          name: 'conversation_id',
          required: false,
        }),
      )
    }

    // 5. Adicionar campo 'notas_comerciais' para anotações da equipe comercial
    if (!contatosCol.fields.getByName('notas_comerciais')) {
      contatosCol.fields.add(
        new TextField({
          name: 'notas_comerciais',
          required: false,
        }),
      )
    }

    app.save(contatosCol)

    // 6. Sincronização RETROATIVA:
    // Buscar todos os usuários cadastrados com role='prata' e que tenham origem da Nine
    try {
      const prataUsers = app.findRecordsByFilter(
        '_pb_users_auth_',
        'role = "prata" && origem ~ "Nine"',
        '-created',
        500,
        0,
      )

      for (let u = 0; u < prataUsers.length; u++) {
        const userRec = prataUsers[u]
        const userEmail = (userRec.getString('email') || '').trim().toLowerCase()
        const userPhone = (userRec.getString('telefone') || '').trim()
        const userName = (userRec.getString('name') || '').trim() || 'Contato Nine'
        const userOrigin = userRec.getString('origem') || 'Nine — Chat do Site'

        // Pular e-mails fictícios de sistema se houver
        if (userEmail.endsWith('@app.local')) {
          continue
        }

        // Tentar encontrar se já existe contato por email ou telefone
        let existingContato = null
        if (userEmail) {
          try {
            existingContato = app.findFirstRecordByData('contatos', 'email', userEmail)
          } catch (_) {}
        }

        if (!existingContato && userPhone) {
          const cleanPhoneDigits = userPhone.replace(/\D/g, '').slice(-8)
          if (cleanPhoneDigits.length >= 8) {
            try {
              const matchedByPhone = app.findRecordsByFilter(
                'contatos',
                `whatsapp ~ "${cleanPhoneDigits}" || telefone ~ "${cleanPhoneDigits}"`,
                '-created',
                1,
                0,
              )
              if (matchedByPhone && matchedByPhone.length > 0) {
                existingContato = matchedByPhone[0]
              }
            } catch (_) {}
          }
        }

        // Tentar buscar conversa associada para resgatar conversation_id e última mensagem
        let matchedConvId = ''
        let convNotes = ''
        try {
          const matchedConvs = app.findRecordsByFilter(
            'nine_conversas',
            `user = "${userRec.id}" || visitante_email = "${userEmail}"`,
            '-created',
            1,
            0,
          )
          if (matchedConvs && matchedConvs.length > 0) {
            matchedConvId = matchedConvs[0].getString('conversation_id') || ''
            const lastMsg = matchedConvs[0].getString('ultima_mensagem') || ''
            if (lastMsg) {
              convNotes = `Última mensagem no chat da Nine: "${lastMsg.slice(0, 300)}"`
            }
          }
        } catch (_) {}

        if (existingContato) {
          // Atualiza dados faltantes sem sobrescrever indevidamente
          let updated = false
          if (!existingContato.getString('user')) {
            existingContato.set('user', userRec.id)
            updated = true
          }
          if (!existingContato.getString('origem')) {
            existingContato.set('origem', userOrigin)
            updated = true
          }
          if (!existingContato.getString('conversation_id') && matchedConvId) {
            existingContato.set('conversation_id', matchedConvId)
            updated = true
          }
          if (!existingContato.getString('whatsapp') && userPhone) {
            existingContato.set('whatsapp', userPhone)
            updated = true
          }
          if (!existingContato.getString('telefone') && userPhone) {
            existingContato.set('telefone', userPhone)
            updated = true
          }
          if (updated) {
            app.save(existingContato)
          }
        } else {
          // Criar novo registro de contato para a equipe comercial
          const newContato = new Record(contatosCol)
          newContato.set('nome_completo', userName)
          newContato.set('email', userEmail)
          newContato.set('telefone', userPhone)
          newContato.set('whatsapp', userPhone)
          newContato.set('origem', userOrigin)
          newContato.set('como_nos_conheceu', 'Nine — Chat do Site')
          newContato.set(
            'motivo',
            convNotes ||
              'Contato e lead captado pela assistente virtual Nine através do chat do site.',
          )
          newContato.set('status', 'novo')
          newContato.set('user', userRec.id)
          if (matchedConvId) {
            newContato.set('conversation_id', matchedConvId)
          }
          app.save(newContato)
        }
      }
    } catch (retroErr) {
      console.log(
        'Aviso na sincronização retroativa de usuários Prata da Nine para Contatos:',
        retroErr,
      )
    }
  },
  (app) => {
    try {
      const contatosCol = app.findCollectionByNameOrId('contatos')
      if (contatosCol.fields.getByName('origem')) {
        contatosCol.fields.removeByName('origem')
      }
      if (contatosCol.fields.getByName('user')) {
        contatosCol.fields.removeByName('user')
      }
      if (contatosCol.fields.getByName('conversation_id')) {
        contatosCol.fields.removeByName('conversation_id')
      }
      if (contatosCol.fields.getByName('notas_comerciais')) {
        contatosCol.fields.removeByName('notas_comerciais')
      }
      app.save(contatosCol)
    } catch (_) {}
  },
)
