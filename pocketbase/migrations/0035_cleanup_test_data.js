migrate(
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'teste.coffeecast@mail.goskip.dev')
      app.delete(user)
      console.log(
        '[MIGRATION 0035] Usuario de teste teste.coffeecast@mail.goskip.dev removido com sucesso.',
      )
    } catch (_) {
      console.log('[MIGRATION 0035] Usuario de teste ja nao existia.')
    }
  },
  (app) => {},
)
