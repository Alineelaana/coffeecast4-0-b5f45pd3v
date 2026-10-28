// pocketbase/hooks/auth_password_reset_flow.js
// Endpoint seguro para redefinição obrigatória de senha quando forcar_troca_senha está ativada.
// Permite que o usuário autenticado defina sua nova senha sem precisar da senha antiga,
// valida requisitos de segurança, desativa forcar_troca_senha e registra na auditoria.

routerAdd(
  'POST',
  '/backend/v1/auth/redefinir-senha-obrigatoria',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Sessão expirada ou não autenticada.')
      }

      const body = e.requestInfo().body || {}
      const novaSenha = (body.novaSenha || '').trim()
      const confirmarNovaSenha = (body.confirmarNovaSenha || '').trim()

      if (!novaSenha) {
        return e.badRequestError('O campo Nova senha não pode estar em branco.')
      }

      if (novaSenha.length < 8) {
        return e.badRequestError('A nova senha deve conter no mínimo 8 caracteres.')
      }

      if (novaSenha !== confirmarNovaSenha) {
        return e.badRequestError('A nova senha e a confirmação não coincidem.')
      }

      // Buscar o registro atualizado do usuário
      let userRecord = null
      try {
        userRecord = $app.findFirstRecordByData('_pb_users_auth_', 'id', authUser.id)
      } catch (findErr) {
        try {
          userRecord = $app.findRecordById('_pb_users_auth_', authUser.id)
        } catch (_) {
          return e.notFoundError('Usuário não encontrado.')
        }
      }

      // Atualizar a senha e desativar a flag forcar_troca_senha
      userRecord.setPassword(novaSenha)
      userRecord.set('forcar_troca_senha', false)
      $app.save(userRecord)

      // Registrar na Auditoria
      try {
        const colAudit = $app.findCollectionByNameOrId('auditoria_eventos')
        const logRec = new Record(colAudit)
        logRec.set('usuario_id', userRecord.id)
        logRec.set('usuario_email', userRecord.getString('email'))
        logRec.set('usuario_nome', userRecord.getString('name') || userRecord.getString('email'))
        logRec.set('usuario_role', userRecord.getString('role'))
        logRec.set('tipo_acao', 'alteracao_senha')
        logRec.set('area_sistema', 'Autenticação / Segurança')
        logRec.set(
          'descricao',
          'Nova senha definida com sucesso no primeiro acesso obrigatório por ' +
            userRecord.getString('name') +
            ' (' +
            userRecord.getString('email') +
            ')',
        )
        logRec.set('registro_afetado', userRecord.id)
        logRec.set('tabela_afetada', '_pb_users_auth_')
        logRec.set('resultado', 'sucesso')
        $app.save(logRec)
      } catch (errAudit) {
        console.log('Aviso ao registrar auditoria de redefinição obrigatória de senha:', errAudit)
      }

      return e.json(200, {
        success: true,
        message: 'Nova senha definida com sucesso! Você já pode navegar normalmente no sistema.',
        user: {
          id: userRecord.id,
          name: userRecord.getString('name'),
          email: userRecord.getString('email'),
          role: userRecord.getString('role'),
          inatividade_minutos: userRecord.getInt('inatividade_minutos') || 10,
          forcar_troca_senha: false,
        },
      })
    } catch (err) {
      console.log('Erro ao redefinir senha obrigatória:', err)
      return e.json(500, {
        error: 'Falha ao redefinir senha: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)
