// Migration 1753000100009 — Cria a collection "portfolios" (repositório de PDFs da área administrativa)
// Campos: nome (obrigatório, definido no momento do envio), arquivo (PDF, até 25 MB, apenas mime application/pdf),
// enviado_por (usuário administrativo que importou) e tamanhos gerenciados pelo autodate.
migrate(
  (app) => {
    const collection = new Collection({
      name: 'portfolios',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.role ~ 'master|adm|gerencial'",
      viewRule: "@request.auth.id != '' && @request.auth.role ~ 'master|adm|gerencial'",
      createRule:
        "@request.auth.id != '' && @request.auth.role ~ 'master|adm|gerencial' && enviado_por = @request.auth.id",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'nome',
          type: 'text',
          required: true,
          min: 2,
          max: 200,
        },
        {
          name: 'arquivo',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 26214400,
          mimeTypes: ['application/pdf'],
        },
        {
          name: 'enviado_por',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: ['CREATE INDEX idx_portfolios_created ON portfolios (created DESC)'],
    })
    app.save(collection)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('portfolios')
    app.delete(col)
  },
)
