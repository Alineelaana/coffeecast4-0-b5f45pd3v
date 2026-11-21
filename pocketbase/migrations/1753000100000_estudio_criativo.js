// pocketbase/migrations/1753000100000_estudio_criativo.js
// Estúdio Criativo IA + Divulgação Inteligente (CoffeeCast 4.0)
// Cria: capas_templates (biblioteca de templates), capas_estudio (capas geradas/vinculadas)
// e campos de divulgação IA em roteiros_convidados. Idempotente.

migrate(
  (app) => {
    // ---------- Coleção capas_templates ----------
    let capasTemplates = null
    try {
      capasTemplates = app.findCollectionByNameOrId('capas_templates')
    } catch (_) {
      capasTemplates = null
    }
    if (!capasTemplates) {
      capasTemplates = new Collection({
        name: 'capas_templates',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          new Field({ type: 'text', name: 'nome', required: true, max: 120 }),
          new Field({ type: 'text', name: 'estilo', max: 60 }),
          new Field({ type: 'text', name: 'descricao', max: 2000 }),
          new Field({ type: 'text', name: 'paleta', max: 300 }),
          new Field({ type: 'text', name: 'formato', max: 30 }),
          new Field({ type: 'json', name: 'template_json', maxSize: 2000000 }),
          new Field({
            type: 'select',
            name: 'status',
            values: ['ativo', 'inativo', 'rascunho'],
            maxSelect: 1,
          }),
          new Field({ type: 'bool', name: 'bloqueado' }),
          new Field({ type: 'bool', name: 'mestre' }),
          new Field({ type: 'number', name: 'versao', onlyInt: true }),
          new Field({ type: 'text', name: 'autor', max: 200 }),
          new Field({
            type: 'file',
            name: 'thumbnail',
            required: false,
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
          }),
        ],
      })
      app.save(capasTemplates)
    }

    // ---------- Coleção capas_estudio ----------
    let capasEstudio = null
    try {
      capasEstudio = app.findCollectionByNameOrId('capas_estudio')
    } catch (_) {
      capasEstudio = null
    }
    if (!capasEstudio) {
      capasEstudio = new Collection({
        name: 'capas_estudio',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          new Field({ type: 'text', name: 'episodio_id', max: 30 }),
          new Field({ type: 'text', name: 'roteiro_id', max: 30 }),
          new Field({ type: 'text', name: 'titulo', max: 300 }),
          new Field({ type: 'text', name: 'titulo_thumbnail', max: 120 }),
          new Field({ type: 'text', name: 'template_id', max: 30 }),
          new Field({ type: 'text', name: 'template_nome', max: 120 }),
          new Field({ type: 'json', name: 'convidados', maxSize: 500000 }),
          new Field({
            type: 'file',
            name: 'arquivo_capa',
            required: false,
            maxSelect: 1,
            maxSize: 20971520,
            mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
          }),
          new Field({ type: 'text', name: 'resolucao', max: 30 }),
          new Field({ type: 'number', name: 'versao', onlyInt: true }),
          new Field({
            type: 'select',
            name: 'status',
            values: ['rascunho', 'oficial', 'arquivada'],
            maxSelect: 1,
          }),
          new Field({ type: 'json', name: 'dados_ia', maxSize: 1000000 }),
          new Field({ type: 'text', name: 'usuario', max: 200 }),
          new Field({ type: 'bool', name: 'oficial' }),
        ],
      })
      app.save(capasEstudio)
    }

    // ---------- Campos de divulgação IA em roteiros_convidados ----------
    const roteiros = app.findCollectionByNameOrId('roteiros_convidados')
    if (!roteiros.fields.getByName('divulgacao_ia')) {
      roteiros.fields.add(new Field({ type: 'json', name: 'divulgacao_ia', maxSize: 2000000 }))
    }
    if (!roteiros.fields.getByName('divulgacao_gerada_em')) {
      roteiros.fields.add(new Field({ type: 'date', name: 'divulgacao_gerada_em' }))
    }
    if (!roteiros.fields.getByName('divulgacao_historico')) {
      roteiros.fields.add(
        new Field({ type: 'json', name: 'divulgacao_historico', maxSize: 4000000 }),
      )
    }
    app.save(roteiros)
  },
  (app) => {
    // Down: remove apenas os campos adicionados; coleções novas permanecem (dados preservados)
    try {
      const roteiros = app.findCollectionByNameOrId('roteiros_convidados')
      ;['divulgacao_ia', 'divulgacao_gerada_em', 'divulgacao_historico'].forEach((n) => {
        const f = roteiros.fields.getByName(n)
        if (f) roteiros.fields.removeByName(n)
      })
      app.save(roteiros)
    } catch (_) {}
  },
)
