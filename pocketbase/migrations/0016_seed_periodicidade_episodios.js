migrate(
  (app) => {
    const conteudoCol = app.findCollectionByNameOrId('conteudo_site')
    const key = 'periodicidade_episodios'
    const defaultValue = 'Todo sábado às 10h sai um episódio novo no canal do YouTube!'

    try {
      app.findFirstRecordByData('conteudo_site', 'chave', key)
    } catch (_) {
      const rec = new Record(conteudoCol)
      rec.set('chave', key)
      rec.set('valor', defaultValue)
      app.save(rec)
    }
  },
  (app) => {
    try {
      const rec = app.findFirstRecordByData('conteudo_site', 'chave', 'periodicidade_episodios')
      app.delete(rec)
    } catch (_) {}
  },
)
