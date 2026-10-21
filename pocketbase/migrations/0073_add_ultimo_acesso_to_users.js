// pocketbase/migrations/0073_add_ultimo_acesso_to_users.js
// Adiciona o campo 'ultimo_acesso' (date) na coleção users (_pb_users_auth_).
// Faz backfill inicial seguro derivando do evento de login mais recente de cada usuário
// na tabela de auditoria_eventos ou last_seen caso exista.

migrate(
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

      // 1. Campo ultimo_acesso: data e horário ISO do último login do usuário
      if (!usersCol.fields.getByName('ultimo_acesso')) {
        usersCol.fields.add(
          new DateField({
            name: 'ultimo_acesso',
            required: false,
          }),
        )
        app.save(usersCol)
      }

      // 2. Backfill idempotente a partir da tabela de auditoria_eventos (tipo_acao = 'login' e resultado = 'sucesso')
      // Se não houver login auditado mas houver last_seen, usa como fallback.
      try {
        app
          .db()
          .newQuery(`
            UPDATE users
            SET ultimo_acesso = (
              SELECT MAX(created)
              FROM auditoria_eventos
              WHERE (auditoria_eventos.usuario_id = users.id OR LOWER(auditoria_eventos.usuario_email) = LOWER(users.email))
                AND auditoria_eventos.tipo_acao = 'login'
                AND auditoria_eventos.resultado = 'sucesso'
            )
            WHERE ultimo_acesso IS NULL OR ultimo_acesso = ''
          `)
          .execute()

        // Para os que continuarem vazios mas tiverem last_seen preenchido
        app
          .db()
          .newQuery(`
            UPDATE users
            SET ultimo_acesso = last_seen
            WHERE (ultimo_acesso IS NULL OR ultimo_acesso = '')
              AND last_seen IS NOT NULL
              AND last_seen != ''
          `)
          .execute()
      } catch (backfillErr) {
        console.log('Aviso no backfill de ultimo_acesso (ignorado se tabelas vazias):', backfillErr)
      }
    } catch (err) {
      console.log('Erro ao aplicar migração 0073_add_ultimo_acesso_to_users.js:', err)
      throw err
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const field = usersCol.fields.getByName('ultimo_acesso')
      if (field) {
        usersCol.fields.removeByName('ultimo_acesso')
        app.save(usersCol)
      }
    } catch (_) {}
  },
)
