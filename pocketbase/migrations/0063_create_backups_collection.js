// pocketbase/migrations/0063_create_backups_collection.js
migrate(
  (app) => {
    const collection = new Collection({
      name: 'backups',
      type: 'base',
      // Acesso restrito apenas a usuários autenticados com cargo 'master'
      listRule: "@request.auth.id != '' && @request.auth.role = 'master'",
      viewRule: "@request.auth.id != '' && @request.auth.role = 'master'",
      createRule: null, // Criação apenas via superuser ou hooks internos ($app.save)
      updateRule: null, // Imutável
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'master'",
      fields: [
        {
          name: 'nome_arquivo',
          type: 'text',
          required: true,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['automatico', 'manual'],
          maxSelect: 1,
        },
        {
          name: 'arquivo',
          type: 'file',
          required: false,
          maxSelect: 1,
          maxSize: 104857600, // 100MB
          mimeTypes: ['application/json', 'application/zip', 'text/plain'],
        },
        {
          name: 'tamanho_bytes',
          type: 'number',
          required: false,
        },
        {
          name: 'total_registros',
          type: 'number',
          required: false,
        },
        {
          name: 'resumo_colecoes',
          type: 'json',
          required: false,
          maxSize: 5242880,
        },
        {
          name: 'payload_dados',
          type: 'json',
          required: false,
          maxSize: 52428800, // Armazena cópia do snapshot em JSON caso upload de arquivo varie
        },
        {
          name: 'criado_por_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'criado_por_email',
          type: 'text',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['concluido', 'erro'],
          maxSelect: 1,
        },
        {
          name: 'detalhes_erro',
          type: 'text',
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
        'CREATE INDEX idx_backups_created ON backups (created DESC)',
        'CREATE INDEX idx_backups_tipo ON backups (tipo)',
        'CREATE INDEX idx_backups_status ON backups (status)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('backups')
      app.delete(collection)
    } catch (_) {}
  },
)
