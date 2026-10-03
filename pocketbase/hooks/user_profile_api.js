// pocketbase/hooks/user_profile_api.js
// Endpoint seguro para que qualquer usuário autenticado atualize o seu PRÓPRIO perfil
// e altere a sua própria senha validando a senha atual.
// Regras de segurança estritas:
// - Usuário só pode alterar seu próprio registro (e.auth.id)
// - Não é permitido alterar role, ativo ou adm_permissions por este endpoint (somente Master em user_admin_api)
// - Alteração de senha exige validação da senha atual com hash do registro

routerAdd(
  'POST',
  '/backend/v1/user/profile/update',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.unauthorizedError('Acesso restrito a usuários autenticados.')
      }

      const body = e.requestInfo().body || {}

      let userRecord = null
      try {
        userRecord = $app.findFirstRecordByData('_pb_users_auth_', 'id', user.id)
      } catch (_) {
        return e.notFoundError('Usuário não encontrado.')
      }

      // 1. Atualizar Nome se fornecido (string)
      if (typeof body.name === 'string') {
        const trimmedName = body.name.trim()
        if (trimmedName.length > 0) {
          userRecord.set('name', trimmedName)
        }
      }

      // 2. Atualizar Telefone se fornecido (string)
      if (typeof body.telefone === 'string') {
        userRecord.set('telefone', body.telefone.trim())
      }

      // 3. Atualizar Bio se fornecida (string)
      if (typeof body.bio === 'string') {
        userRecord.set('bio', body.bio.trim())
      }

      // 3.1 Remover Avatar se explicitamente solicitado (ex: removeAvatar === true ou avatar === "")
      if (body.removeAvatar === true || body.avatar === '') {
        userRecord.set('avatar', '')
      }

      // 4. Alteração de Senha (opcional)
      // Se body.newPassword for enviado, validações completas
      const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : ''
      const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
      const confirmPassword =
        typeof body.confirmPassword === 'string' ? body.confirmPassword.trim() : ''

      if (newPassword.length > 0) {
        if (!currentPassword) {
          return e.badRequestError('Informe a sua senha atual para autorizar a alteração de senha.')
        }

        // Valida se a senha atual está correta usando o validador nativo do PocketBase
        if (!userRecord.validatePassword(currentPassword)) {
          return e.badRequestError('Senha atual incorreta.')
        }

        if (newPassword.length < 8) {
          return e.badRequestError('A nova senha deve ter pelo menos 8 caracteres.')
        }

        if (confirmPassword && newPassword !== confirmPassword) {
          return e.badRequestError('As senhas não coincidem.')
        }

        userRecord.setPassword(newPassword)
      }

      $app.save(userRecord)

      return e.json(200, {
        success: true,
        message:
          newPassword.length > 0
            ? 'Perfil e senha atualizados com sucesso!'
            : 'Perfil atualizado com sucesso!',
        user: {
          id: userRecord.id,
          name: userRecord.getString('name'),
          email: userRecord.getString('email'),
          avatar: userRecord.getString('avatar'),
          telefone: userRecord.getString('telefone'),
          bio: userRecord.getString('bio'),
          role: userRecord.getString('role'),
          origem: userRecord.getString('origem'),
          ativo: userRecord.getBool('ativo'),
          created: userRecord.getString('created'),
          updated: userRecord.getString('updated'),
        },
      })
    } catch (err) {
      console.log('Erro ao atualizar perfil do usuário:', err)
      return e.json(500, {
        error: 'Falha ao atualizar perfil: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)
