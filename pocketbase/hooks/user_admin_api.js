// pocketbase/hooks/user_admin_api.js
// Endpoint administrativo seguro para o cargo Master atualizar qualquer informação de um usuário,
// incluindo alteração direta de senha sem necessidade de redefinição por e-mail.

routerAdd(
  'POST',
  '/backend/v1/admin/users/update',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.unauthorizedError('Acesso restrito ao painel administrativo.')
      }

      const userRole = user.getString('role')
      if (userRole !== 'master') {
        return e.forbiddenError(
          'Apenas o Superadministrador Master pode gerenciar e editar usuários.',
        )
      }

      const body = e.requestInfo().body || {}
      const targetUserId = (body.id || '').trim()

      if (!targetUserId) {
        return e.badRequestError('ID do usuário é obrigatório.')
      }

      // Preparar snapshot antes da alteração para auditoria
      let snapshotAntes = null

      let targetUser = null
      try {
        targetUser = $app.findCollectionByNameOrId('_pb_users_auth_')
      } catch (_) {
        return e.internalServerError('Coleção de usuários não encontrada.')
      }

      let targetRecord = null
      try {
        targetRecord = $app.findFirstRecordByData('_pb_users_auth_', 'id', targetUserId)
      } catch (_) {
        return e.notFoundError('Usuário não encontrado.')
      }

      const targetEmail = targetRecord.getString('email')

      // Se for a conta do Superadmin Master principal, prevenir bloqueio ou perda acidental de privilégios
      const isSuperAdminPrincipal = targetEmail === 'alineelaana@gmail.com'

      // 1. Atualizar Nome se fornecido
      if (typeof body.name === 'string') {
        targetRecord.set('name', body.name.trim())
      }

      // 2. Atualizar E-mail se fornecido
      if (typeof body.email === 'string' && body.email.trim() !== '') {
        const newEmail = body.email.trim().toLowerCase()
        if (newEmail !== targetEmail) {
          if (isSuperAdminPrincipal) {
            return e.badRequestError(
              'O e-mail do Superadministrador Master principal não pode ser alterado.',
            )
          }
          // Verificar se já existe outro usuário com esse e-mail
          try {
            const existing = $app.findAuthRecordByEmail('_pb_users_auth_', newEmail)
            if (existing && existing.id !== targetUserId) {
              return e.badRequestError('Este e-mail já está em uso por outro usuário.')
            }
          } catch (_) {
            // Nenhum usuário com esse e-mail, pode prosseguir
          }
          targetRecord.setEmail(newEmail)
        }
      }

      // 3. Atualizar Telefone se fornecido
      if (typeof body.telefone === 'string') {
        targetRecord.set('telefone', body.telefone.trim())
      }

      // 3.1 Atualizar Origem se fornecido
      if (typeof body.origem === 'string') {
        targetRecord.set('origem', body.origem.trim())
      }

      // 3.2 Atualizar Cargo/Nível (Role)
      if (typeof body.role === 'string' && body.role.trim() !== '') {
        const newRole = body.role.trim()
        const validRoles = ['master', 'adm', 'gerencial', 'ouro', 'prata']
        if (!validRoles.includes(newRole)) {
          return e.badRequestError('Cargo/nível de permissão inválido.')
        }

        if (isSuperAdminPrincipal && newRole !== 'master') {
          return e.badRequestError(
            'O Superadministrador Master principal não pode perder o cargo Master.',
          )
        }

        targetRecord.set('role', newRole)
      }
      // 3.1 Atualizar Permissões de ADM (adm_permissions)
      // Se body.adm_permissions foi enviado (objeto ou null/string)
      if (body.adm_permissions !== undefined) {
        if (targetRecord.getString('role') === 'adm' || body.role === 'adm') {
          targetRecord.set('adm_permissions', body.adm_permissions)
        } else {
          // Se não for ADM, limpa permissões específicas de ADM
          targetRecord.set('adm_permissions', null)
        }
      }

      // 4. Atualizar Status/Ativo
      if (typeof body.ativo === 'boolean') {
        if (isSuperAdminPrincipal && body.ativo === false) {
          return e.badRequestError('O Superadministrador Master principal não pode ser desativado.')
        }
        targetRecord.set('ativo', body.ativo)
      }

      // 5. Atualizar Senha (opcional, mínimo 8 caracteres)
      if (typeof body.password === 'string' && body.password.trim() !== '') {
        const newPassword = body.password.trim()
        if (newPassword.length < 8) {
          return e.badRequestError('A nova senha deve conter no mínimo 8 caracteres.')
        }
        targetRecord.setPassword(newPassword)
      }

      // Registrar log de auditoria da alteração de permissão / usuário
      try {
        const colAudit = $app.findCollectionByNameOrId('auditoria_eventos')
        const logRec = new Record(colAudit)
        logRec.set('usuario_id', user.id)
        logRec.set('usuario_email', user.getString('email'))
        logRec.set('usuario_nome', user.getString('name') || user.getString('email'))
        logRec.set('usuario_role', user.getString('role'))
        logRec.set(
          'tipo_acao',
          body.adm_permissions !== undefined || body.role !== undefined
            ? 'alteracao_permissao'
            : 'edicao',
        )
        logRec.set('area_sistema', 'Usuários & Permissões')
        logRec.set(
          'descricao',
          'Alteração administrativa realizada no usuário: ' +
            targetRecord.getString('name') +
            ' (' +
            targetRecord.getString('email') +
            ')',
        )
        logRec.set('registro_afetado', targetRecord.id)
        logRec.set('tabela_afetada', '_pb_users_auth_')
        logRec.set('resultado', 'sucesso')
        logRec.set('diff_depois', {
          name: targetRecord.getString('name'),
          email: targetRecord.getString('email'),
          role: targetRecord.getString('role'),
          ativo: targetRecord.getBool('ativo'),
          adm_permissions: targetRecord.get('adm_permissions'),
        })
        $app.save(logRec)
      } catch (errAudit) {
        console.log('Aviso ao auditar atualização de usuário:', errAudit)
      }

      $app.save(targetRecord)

      return e.json(200, {
        success: true,
        message: 'Usuário atualizado com sucesso!',
        user: {
          id: targetRecord.id,
          name: targetRecord.getString('name'),
          email: targetRecord.getString('email'),
          telefone: targetRecord.getString('telefone'),
          origem: targetRecord.getString('origem'),
          role: targetRecord.getString('role'),
          ativo: targetRecord.getBool('ativo'),
          adm_permissions: targetRecord.get('adm_permissions'),
          created: targetRecord.getString('created'),
          updated: targetRecord.getString('updated'),
        },
      })
    } catch (err) {
      console.log('Erro ao atualizar usuário via user_admin_api:', err)
      return e.json(500, {
        error: 'Falha ao atualizar usuário: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)

// Endpoint administrativo para listar usuários com email e dados completos para Master
routerAdd(
  'GET',
  '/backend/v1/admin/users/list',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.unauthorizedError('Acesso restrito ao painel administrativo.')
      }

      const userRole = user.getString('role')
      if (userRole !== 'master') {
        return e.forbiddenError(
          'Apenas o Superadministrador Master pode gerenciar e listar detalhes de usuários.',
        )
      }

      const records = $app.findRecordsByFilter('_pb_users_auth_', '', '-created', 500, 0)
      const list = records.map((rec) => ({
        id: rec.id,
        name: rec.getString('name'),
        email: rec.getString('email'),
        telefone: rec.getString('telefone') || '',
        origem: rec.getString('origem') || '',
        role: rec.getString('role') || 'prata',
        ativo: rec.getBool('ativo'),
        adm_permissions: rec.get('adm_permissions'),
        created: rec.getString('created'),
        updated: rec.getString('updated'),
      }))

      return e.json(200, {
        success: true,
        items: list,
      })
    } catch (err) {
      console.log('Erro ao listar usuários via user_admin_api:', err)
      return e.json(500, {
        error: 'Falha ao listar usuários: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)
