// Migration 1753000100017 — Collection "notificacoes": central de avisos internos acionáveis
// Criada por hooks (lead novo, roteiro aguardando aprovação, gravação < 48h) — nunca pelo site público.
// Regras de API restritas aos perfis administrativos (no PocketBase ~ é LIKE: role ~ 'master|adm|gerencial').
migrate(
  (app) => {
    let col
    try {
      col = app.findCollectionByNameOrId('notificacoes')
    } catch (_) {
      col = null
    }
    if (col) return // idempotente

    const collection = new Collection({
      name: 'notificacoes',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.role ~ 'master|adm|gerencial'",
      viewRule: "@request.auth.id != '' && @request.auth.role ~ 'master|adm|gerencial'",
      createRule: null, // criadas apenas por hooks de sistema
      updateRule: "@request.auth.id != '' && @request.auth.role ~ 'master|adm|gerencial'",
      deleteRule: null,
      fields: [
        {
          name: 'destinatario',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'perfil_alvo',
          type: 'select',
          required: true,
          values: ['master', 'adm', 'gerencial'],
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['lead', 'roteiro', 'gravacao'],
          maxSelect: 1,
        },
        {
          name: 'titulo',
          type: 'text',
          required: true,
          max: 200,
        },
        {
          name: 'mensagem',
          type: 'text',
          required: true,
          max: 1000,
        },
        {
          name: 'referencia_tipo',
          type: 'text',
          required: false,
          max: 60,
        },
        {
          name: 'referencia_id',
          type: 'text',
          required: false,
          max: 60,
        },
        {
          name: 'lida',
          type: 'bool',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
      ],
      indexes: [
        'CREATE INDEX idx_notificacoes_created ON notificacoes (created DESC)',
        'CREATE INDEX idx_notificacoes_lida ON notificacoes (lida)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('notificacoes')
      app.delete(col)
    } catch (_) {}
  },
)
