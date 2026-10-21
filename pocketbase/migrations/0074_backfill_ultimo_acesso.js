// pocketbase/migrations/0074_backfill_ultimo_acesso.js
// Popula o campo 'ultimo_acesso' para usuários existentes a partir dos eventos de login
// registrados na coleção auditoria_eventos e last_seen.

migrate(
  (app) => {
    try {
      const users = app.findRecordsByFilter('_pb_users_auth_', '', '-created', 500, 0)
      for (const u of users) {
        let lastLoginTime = ''

        // 1. Tenta buscar o evento de login mais recente na tabela auditoria_eventos
        try {
          const events = app.findRecordsByFilter(
            'auditoria_eventos',
            `tipo_acao = 'login' && resultado = 'sucesso' && (usuario_id = '${u.id}' || usuario_email = '${u.getString('email')}')`,
            '-created',
            1,
            0,
          )
          if (events && events.length > 0) {
            lastLoginTime = events[0].getString('created')
          }
        } catch (errEvent) {
          console.log(
            'Aviso ao consultar auditoria_eventos para ' + u.getString('email') + ':',
            errEvent,
          )
        }

        // 2. Se não encontrou login auditado, verifica last_seen
        if (!lastLoginTime) {
          const lastSeen = u.getString('last_seen')
          if (lastSeen) {
            lastLoginTime = lastSeen
          }
        }

        // 3. Se encontrou, atualiza o usuário
        if (lastLoginTime) {
          u.set('ultimo_acesso', lastLoginTime)
          app.save(u)
        }
      }
    } catch (err) {
      console.log('Erro no backfill de ultimo_acesso:', err)
    }
  },
  () => {},
)
