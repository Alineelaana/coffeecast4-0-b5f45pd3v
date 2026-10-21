// pocketbase/migrations/0072_add_inatividade_and_forcar_troca_senha.js
// Adiciona os campos 'inatividade_minutos' (number) e 'forcar_troca_senha' (bool)
// na coleção de usuários (_pb_users_auth_).
// Inicializa 'inatividade_minutos' com 10 por padrão para todos os usuários existentes.

migrate(
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

      // 1. Campo inatividade_minutos: tempo de inatividade em minutos para logout automático (mínimo 1, padrão 10)
      if (!usersCol.fields.getByName('inatividade_minutos')) {
        usersCol.fields.add(
          new NumberField({
            name: 'inatividade_minutos',
            required: false,
            min: 1,
            max: 1440,
            onlyInt: true,
          }),
        )
      }

      // 2. Campo forcar_troca_senha: flag para exigir redefinição de senha no próximo login
      // Lembrete: em PocketBase nunca marcar bool como required, para não impedir valor false.
      if (!usersCol.fields.getByName('forcar_troca_senha')) {
        usersCol.fields.add(
          new BoolField({
            name: 'forcar_troca_senha',
            required: false,
          }),
        )
      }

      app.save(usersCol)

      // 3. Atualizar registros existentes: todos os usuários já vêm com 10 minutos por padrão caso não tenham definido
      app
        .db()
        .newQuery(`
        UPDATE users
        SET inatividade_minutos = 10
        WHERE inatividade_minutos IS NULL OR inatividade_minutos <= 0
      `)
        .execute()
    } catch (err) {
      console.log('Erro ao aplicar migração 0072_add_inatividade_and_forcar_troca_senha.js:', err)
      throw err
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const inatField = usersCol.fields.getByName('inatividade_minutos')
      if (inatField) {
        usersCol.fields.removeByName('inatividade_minutos')
      }
      const forcarField = usersCol.fields.getByName('forcar_troca_senha')
      if (forcarField) {
        usersCol.fields.removeByName('forcar_troca_senha')
      }
      app.save(usersCol)
    } catch (_) {}
  },
)
