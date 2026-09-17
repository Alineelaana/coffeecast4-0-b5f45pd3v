/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Atualizar campos de status na coleção users (_pb_users_auth_)
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // status: online | offline | em_pausa
    if (!usersCol.fields.getByName('status')) {
      usersCol.fields.add(
        new SelectField({
          name: 'status',
          required: false,
          maxSelect: 1,
          values: ['online', 'offline', 'em_pausa'],
        }),
      )
    }

    // pause_reason: Almoço | Reunião | Atendimento | Intervalo | Outro (ou texto livre)
    if (!usersCol.fields.getByName('pause_reason')) {
      usersCol.fields.add(
        new TextField({
          name: 'pause_reason',
          required: false,
        }),
      )
    }

    // status_updated: data/hora da última alteração de status
    if (!usersCol.fields.getByName('status_updated')) {
      usersCol.fields.add(
        new DateField({
          name: 'status_updated',
          required: false,
        }),
      )
    }

    // last_seen: data/hora do último heartbeat / requisição ativa
    if (!usersCol.fields.getByName('last_seen')) {
      usersCol.fields.add(
        new DateField({
          name: 'last_seen',
          required: false,
        }),
      )
    }

    app.save(usersCol)

    // 2. Expandir tipo_acao em auditoria_eventos para incluir alteracao_status
    try {
      const auditCol = app.findCollectionByNameOrId('auditoria_eventos')
      const tipoAcaoField = auditCol.fields.getByName('tipo_acao')
      if (tipoAcaoField && tipoAcaoField.values) {
        if (!tipoAcaoField.values.includes('alteracao_status')) {
          tipoAcaoField.values.push('alteracao_status')
          auditCol.fields.add(tipoAcaoField)
          app.save(auditCol)
        }
      }
    } catch (auditErr) {
      console.log('Aviso ao atualizar tipo_acao de auditoria_eventos na migração 0061:', auditErr)
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      if (usersCol.fields.getByName('status')) {
        usersCol.fields.removeByName('status')
      }
      if (usersCol.fields.getByName('pause_reason')) {
        usersCol.fields.removeByName('pause_reason')
      }
      if (usersCol.fields.getByName('status_updated')) {
        usersCol.fields.removeByName('status_updated')
      }
      if (usersCol.fields.getByName('last_seen')) {
        usersCol.fields.removeByName('last_seen')
      }
      app.save(usersCol)
    } catch (_) {}
  },
)
