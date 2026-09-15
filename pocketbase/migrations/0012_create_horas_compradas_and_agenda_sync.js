migrate(
  (app) => {
    // 1. Criar a coleção horas_compradas
    const ruleMasterOuGerencial =
      '@request.auth.role = "master" || @request.auth.role = "gerencial"'

    const horasCol = new Collection({
      name: 'horas_compradas',
      type: 'base',
      listRule: ruleMasterOuGerencial,
      viewRule: ruleMasterOuGerencial,
      createRule: ruleMasterOuGerencial,
      updateRule: ruleMasterOuGerencial,
      deleteRule: ruleMasterOuGerencial,
      fields: [
        {
          name: 'data',
          type: 'date',
          required: true,
        },
        {
          name: 'quantidade_horas',
          type: 'number',
          required: true,
          min: 0.25,
        },
        {
          name: 'descricao',
          type: 'text',
          required: true,
        },
        {
          name: 'situacao',
          type: 'select',
          required: true,
          values: ['paga', 'em_aberto'],
          maxSelect: 1,
        },
        {
          name: 'valor',
          type: 'number',
          min: 0,
        },
        {
          name: 'observacoes',
          type: 'text',
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
        'CREATE INDEX idx_horas_compradas_data ON horas_compradas (data)',
        'CREATE INDEX idx_horas_compradas_situacao ON horas_compradas (situacao)',
      ],
    })

    app.save(horasCol)

    // 2. Adicionar o campo 'horas_utilizadas' na coleção 'agenda'
    const agendaCol = app.findCollectionByNameOrId('agenda')
    if (!agendaCol.fields.getByName('horas_utilizadas')) {
      agendaCol.fields.add(
        new NumberField({
          name: 'horas_utilizadas',
          min: 0,
        }),
      )
      app.save(agendaCol)
    }

    // 3. Cadastrar um registro inicial de exemplo (idempotente)
    try {
      const col = app.findCollectionByNameOrId('horas_compradas')
      const initialRecord = new Record(col)
      initialRecord.set('data', '2026-09-01 00:00:00.000Z')
      initialRecord.set('quantidade_horas', 10)
      initialRecord.set('descricao', 'Pacote Inicial de Estúdio - 10h')
      initialRecord.set('situacao', 'paga')
      initialRecord.set('valor', 1500)
      initialRecord.set('observacoes', 'Contrato inicial de horas para gravações no Studio')
      app.save(initialRecord)
    } catch (e) {
      console.log('Registro inicial de horas já existente ou erro ao criar:', e)
    }
  },
  (app) => {
    try {
      const horasCol = app.findCollectionByNameOrId('horas_compradas')
      app.delete(horasCol)
    } catch (_) {}

    try {
      const agendaCol = app.findCollectionByNameOrId('agenda')
      const field = agendaCol.fields.getByName('horas_utilizadas')
      if (field) {
        agendaCol.fields.removeByName('horas_utilizadas')
        app.save(agendaCol)
      }
    } catch (_) {}
  },
)
