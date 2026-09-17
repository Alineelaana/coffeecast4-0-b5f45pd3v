migrate(
  (app) => {
    try {
      const email = 'teste.coffeecast@mail.goskip.dev'
      let userRecord
      try {
        userRecord = app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
        userRecord = new Record(usersCol)
        userRecord.setEmail(email)
        userRecord.setPassword('Skip@Pass123')
        userRecord.setVerified(true)
        userRecord.set('name', 'Usuário Teste Reset')
        userRecord.set('role', 'prata')
        app.save(userRecord)
      }

      console.log('[MIGRATION 0034] Chamando sendRecordPasswordReset...')
      app.sendRecordPasswordReset(userRecord)
      console.log('[MIGRATION 0034] sendRecordPasswordReset chamado com sucesso!')
    } catch (err) {
      console.log('[MIGRATION 0034] Erro:', err)
    }
  },
  (app) => {},
)
