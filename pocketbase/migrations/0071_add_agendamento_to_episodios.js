migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('episodios')

    // 1. Campo status: select ('publicado', 'programado')
    if (!col.fields.getByName('status')) {
      col.fields.add(
        new SelectField({
          name: 'status',
          required: false,
          values: ['publicado', 'programado'],
          maxSelect: 1,
        }),
      )
    }

    // 2. Campo data_publicacao_programada: date
    if (!col.fields.getByName('data_publicacao_programada')) {
      col.fields.add(
        new DateField({
          name: 'data_publicacao_programada',
          required: false,
        }),
      )
    }

    app.save(col)

    // Backfill defensivo e idempotente: episódios antigos sem status ficam como 'publicado'
    try {
      app
        .db()
        .newQuery(`
        UPDATE episodios 
        SET status = 'publicado' 
        WHERE status IS NULL OR status = ''
      `)
        .execute()
    } catch (err) {
      console.log('Aviso ao aplicar backfill em episodios:', err)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('episodios')
    if (col.fields.getByName('status')) {
      col.fields.removeByName('status')
    }
    if (col.fields.getByName('data_publicacao_programada')) {
      col.fields.removeByName('data_publicacao_programada')
    }
    app.save(col)
  },
)
