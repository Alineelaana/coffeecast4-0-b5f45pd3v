// pocketbase/migrations/0070_ensure_users_avatar_field_and_rules.js
// Garante que o campo 'avatar' na coleção de usuários (_pb_users_auth_) esteja
// devidamente configurado como FileField com suporte a imagens até 10MB (JPEG, PNG, WebP, GIF),
// e confirma que a regra de atualização permite que qualquer usuário autenticado edite seu próprio perfil.

migrate(
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

      let avatarField = usersCol.fields.getByName('avatar')
      if (!avatarField) {
        usersCol.fields.add(
          new FileField({
            name: 'avatar',
            required: false,
            maxSelect: 1,
            maxSize: 10485760, // 10MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          }),
        )
      } else {
        // Garantir tamanho de até 10MB e mimeTypes amplos
        if (typeof avatarField.maxSize === 'number') {
          avatarField.maxSize = 10485760 // 10MB
        }
        avatarField.maxSelect = 1
        avatarField.mimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      }

      // Regra de update: usuário pode atualizar seu próprio perfil ou master
      if (!usersCol.updateRule || usersCol.updateRule.trim() === '') {
        usersCol.updateRule =
          '@request.auth.id != "" && (id = @request.auth.id || @request.auth.role = "master")'
      }

      app.save(usersCol)
    } catch (err) {
      console.log('Erro ao aplicar migração 0070_ensure_users_avatar_field_and_rules.js:', err)
      throw err
    }
  },
  (app) => {
    // Reversão segura sem excluir dados existentes
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      app.save(usersCol)
    } catch (_) {}
  },
)
