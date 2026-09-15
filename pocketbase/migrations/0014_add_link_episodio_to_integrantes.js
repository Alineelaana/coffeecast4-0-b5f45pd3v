migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('integrantes')
    if (!col.fields.getByName('link_episodio')) {
      col.fields.add(
        new TextField({
          name: 'link_episodio',
          required: false,
        }),
      )
      app.save(col)
    }

    // Opcionalmente atualiza as 4 integrantes com os episódios de entrevista já cadastrados
    try {
      const aline = app.findFirstRecordByData('integrantes', 'nome', 'Aline Lana')
      if (aline && !aline.get('link_episodio')) {
        aline.set('link_episodio', 'https://youtu.be/bjiRfDIpdHA?si=ZbgSBXmRR4-8dKWo')
        app.save(aline)
      }
    } catch (_) {}

    try {
      const dayana = app.findFirstRecordByData('integrantes', 'nome', 'Dayana Ribas')
      if (dayana && !dayana.get('link_episodio')) {
        dayana.set('link_episodio', 'https://youtu.be/Gv4FEw85UCM?si=_qdHUa5j3pd3n6Y4')
        app.save(dayana)
      }
    } catch (_) {}

    try {
      const rosi = app.findFirstRecordByData('integrantes', 'nome', 'Rosi Lima')
      if (rosi && !rosi.get('link_episodio')) {
        rosi.set('link_episodio', 'https://youtu.be/D-LT4u-nJ-E?si=WjkGDcGIpvN6qMi4')
        app.save(rosi)
      }
    } catch (_) {}

    try {
      const flavia = app.findFirstRecordByData('integrantes', 'nome', 'Flávia Franco')
      if (flavia && !flavia.get('link_episodio')) {
        flavia.set('link_episodio', 'https://youtu.be/O5TZo1zkXiQ?si=Hl8lhmNafteh-_nM')
        app.save(flavia)
      }
    } catch (_) {}
  },
  (app) => {
    const col = app.findCollectionByNameOrId('integrantes')
    const field = col.fields.getByName('link_episodio')
    if (field) {
      col.fields.removeByName('link_episodio')
      app.save(col)
    }
  },
)
