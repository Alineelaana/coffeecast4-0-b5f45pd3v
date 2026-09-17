migrate(
  (app) => {
    // Verificar se a coleção já existe
    try {
      app.findCollectionByNameOrId('depoimentos_convidados')
      return // Já existe
    } catch (_) {}

    const collection = new Collection({
      name: 'depoimentos_convidados',
      type: 'base',
      listRule: '@request.auth.role = "master" || @request.auth.role = "gerencial"',
      viewRule: '@request.auth.role = "master" || @request.auth.role = "gerencial"',
      createRule: '', // Público para permitir envio de depoimento sem login
      updateRule: '@request.auth.role = "master" || @request.auth.role = "gerencial"',
      deleteRule: '@request.auth.role = "master" || @request.auth.role = "gerencial"',
      fields: [
        {
          name: 'nome',
          type: 'text',
          required: true,
        },
        {
          name: 'empresa',
          type: 'text',
          required: false,
        },
        {
          name: 'instagram',
          type: 'text',
          required: true,
        },
        {
          name: 'texto',
          type: 'text',
          required: true,
        },
        {
          name: 'foto',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 10485760, // 10MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        },
        {
          name: 'autoriza_publicacao',
          type: 'bool',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'aprovada', 'oculta'],
          maxSelect: 1,
        },
        {
          name: 'visualizado',
          type: 'bool',
          required: false,
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
      indexes: [
        'CREATE INDEX idx_dep_conv_status ON depoimentos_convidados (status)',
        'CREATE INDEX idx_dep_conv_created ON depoimentos_convidados (created)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('depoimentos_convidados')
      app.delete(col)
    } catch (_) {}
  },
)
