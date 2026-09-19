migrate(
  (app) => {
    const conteudoCol = app.findCollectionByNameOrId('conteudo_site')
    const seedDefaults = [
      {
        chave: 'convites_padrao_texto_convidado',
        valor:
          'É com grande alegria e honra que convidamos você para compartilhar sua trajetória inspiradora no CoffeeCast 4.0. Preparamos uma mesa com afeto, respeito e cafés especiais para dar voz à sua história que transforma vidas.',
      },
      {
        chave: 'convites_padrao_texto_convidada',
        valor:
          'É com grande alegria e honra que convidamos você para compartilhar sua trajetória inspiradora no CoffeeCast 4.0. Preparamos uma mesa com afeto, respeito e cafés especiais para dar voz à sua história que transforma vidas.',
      },
    ]

    for (let i = 0; i < seedDefaults.length; i++) {
      const item = seedDefaults[i]
      try {
        app.findFirstRecordByData('conteudo_site', 'chave', item.chave)
      } catch (_) {
        const rec = new Record(conteudoCol)
        rec.set('chave', item.chave)
        rec.set('valor', item.valor)
        app.save(rec)
      }
    }
  },
  (app) => {
    const keys = ['convites_padrao_texto_convidado', 'convites_padrao_texto_convidada']
    for (let i = 0; i < keys.length; i++) {
      try {
        const rec = app.findFirstRecordByData('conteudo_site', 'chave', keys[i])
        app.delete(rec)
      } catch (_) {}
    }
  },
)
