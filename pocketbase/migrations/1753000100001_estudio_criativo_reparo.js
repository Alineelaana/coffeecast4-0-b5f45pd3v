// pocketbase/migrations/1753000100001_estudio_criativo_reparo.js
// MIGRAÇÃO DE REPARO — Estúdio Criativo IA (CoffeeCast 4.0)
// A migração anterior (1753000100000) criou 'capas_templates' e 'capas_estudio' com ZERO campos
// e regras de API nulas (construtor genérico new Field({...}) é descartado pelo JSVM).
// Aqui usamos construtores TIPADOS (TextField, BoolField, ...) — padrão funcional do projeto
// (ex.: migração 0021) — e semeamos o Template Mestre Oficial "CoffeeCast 4.0 — Premium Dourado".
// Os campos divulgacao_ia / divulgacao_gerada_em / divulgacao_historico de roteiros_convidados
// JÁ EXISTEM e NÃO são recriados.

const REGRA_ADM =
  '@request.auth.role = "master" || @request.auth.role = "gerencial" || @request.auth.role = "adm"'

function adicionarSeFaltando(collection, field) {
  const jaTem = collection.fields.find(function (f) {
    return f.name === field.name
  })
  if (!jaTem) {
    collection.fields.add(field)
  }
}

function garantirAutodates(collection) {
  const tem = function (nome) {
    return !!collection.fields.find(function (f) {
      return f.name === nome
    })
  }
  if (!tem('created')) {
    collection.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
  }
  if (!tem('updated')) {
    collection.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
  }
}

function garantirRegrasAPI(collection) {
  collection.listRule = REGRA_ADM
  collection.viewRule = REGRA_ADM
  collection.createRule = REGRA_ADM
  collection.updateRule = REGRA_ADM
  collection.deleteRule = REGRA_ADM
}

migrate(
  (app) => {
    // ---------- 1. capas_templates ----------
    let tpl
    try {
      tpl = app.findCollectionByNameOrId('capas_templates')
    } catch (_) {
      tpl = new Collection({ name: 'capas_templates', type: 'base' })
      app.save(tpl)
      tpl = app.findCollectionByNameOrId('capas_templates')
    }
    adicionarSeFaltando(tpl, new TextField({ name: 'nome', required: true, max: 120 }))
    adicionarSeFaltando(
      tpl,
      new SelectField({
        name: 'estilo',
        maxSelect: 1,
        values: [
          'Premium Dourado',
          'Black Gold',
          'Minimalista',
          'Cinematográfico',
          'Corporativo',
          'Moderno',
          'Tecnológico',
          'Editorial',
          'Luxo Contemporâneo',
          'Personalizado',
        ],
      }),
    )
    adicionarSeFaltando(tpl, new TextField({ name: 'descricao', max: 2000 }))
    adicionarSeFaltando(tpl, new TextField({ name: 'paleta', max: 500 }))
    adicionarSeFaltando(
      tpl,
      new SelectField({ name: 'formato', maxSelect: 1, values: ['16:9', '1:1', '9:16'] }),
    )
    adicionarSeFaltando(tpl, new JSONField({ name: 'template_json', maxSize: 2000000 }))
    adicionarSeFaltando(
      tpl,
      new SelectField({
        name: 'status',
        required: true,
        maxSelect: 1,
        values: ['ativo', 'inativo', 'rascunho'],
      }),
    )
    adicionarSeFaltando(tpl, new BoolField({ name: 'bloqueado' }))
    adicionarSeFaltando(tpl, new BoolField({ name: 'mestre' }))
    adicionarSeFaltando(tpl, new NumberField({ name: 'versao', onlyInt: true, min: 1 }))
    adicionarSeFaltando(tpl, new TextField({ name: 'autor', max: 200 }))
    adicionarSeFaltando(
      tpl,
      new FileField({
        name: 'thumbnail',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    garantirAutodates(tpl)
    garantirRegrasAPI(tpl)
    app.save(tpl)

    // ---------- 2. capas_estudio ----------
    let capas
    try {
      capas = app.findCollectionByNameOrId('capas_estudio')
    } catch (_) {
      capas = new Collection({ name: 'capas_estudio', type: 'base' })
      app.save(capas)
      capas = app.findCollectionByNameOrId('capas_estudio')
    }
    adicionarSeFaltando(capas, new TextField({ name: 'episodio_id', max: 30 }))
    adicionarSeFaltando(capas, new TextField({ name: 'roteiro_id', max: 30 }))
    adicionarSeFaltando(capas, new TextField({ name: 'titulo', max: 300 }))
    adicionarSeFaltando(capas, new TextField({ name: 'titulo_thumbnail', max: 200 }))
    adicionarSeFaltando(capas, new TextField({ name: 'template_id', max: 30 }))
    adicionarSeFaltando(capas, new TextField({ name: 'template_nome', max: 160 }))
    adicionarSeFaltando(capas, new JSONField({ name: 'convidados', maxSize: 2000000 }))
    adicionarSeFaltando(
      capas,
      new FileField({
        name: 'arquivo_capa',
        maxSelect: 1,
        maxSize: 26214400,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    adicionarSeFaltando(capas, new TextField({ name: 'resolucao', max: 40 }))
    adicionarSeFaltando(
      capas,
      new SelectField({
        name: 'status',
        required: true,
        maxSelect: 1,
        values: ['rascunho', 'oficial', 'arquivada'],
      }),
    )
    adicionarSeFaltando(capas, new NumberField({ name: 'versao', onlyInt: true, min: 1 }))
    adicionarSeFaltando(capas, new JSONField({ name: 'dados_ia', maxSize: 2000000 }))
    adicionarSeFaltando(capas, new TextField({ name: 'usuario', max: 200 }))
    adicionarSeFaltando(capas, new BoolField({ name: 'oficial' }))
    garantirAutodates(capas)
    garantirRegrasAPI(capas)
    app.save(capas)

    // ---------- 3. Seed do Template Mestre Oficial "CoffeeCast 4.0 — Premium Dourado" ----------
    const jaExiste = app.findRecordsByFilter('capas_templates', 'mestre = true', '-id', 1, 0)
    if (jaExiste.length === 0) {
      const templateMestre = {
        nome: 'CoffeeCast 4.0 — Premium Dourado',
        versao: 1,
        // Identidade oficial BLOQUEADA — nenhum elemento menciona temporada.
        camadas: [
          { id: 'fundo', nome: 'Fundo cinematográfico dourado', tipo: 'fundo', bloqueado: true },
          {
            id: 'cabecalho',
            nome: 'Cabeçalho oficial (logomarca CoffeeCast 4.0 + xícara com coração)',
            tipo: 'cabecalho',
            bloqueado: true,
          },
          {
            id: 'titulo',
            nome: 'Área central de título serifado dourado/preto',
            tipo: 'titulo',
            bloqueado: false,
            fonte: 'serif',
            cor: '#C9971F',
          },
          {
            id: 'subtitulo',
            nome: 'Subtítulo (opcional)',
            tipo: 'subtitulo',
            bloqueado: false,
            fonte: 'sans',
            cor: '#4B1E3F',
          },
          {
            id: 'foto',
            nome: 'Área esquerda para fotografias dos convidados',
            tipo: 'foto',
            bloqueado: false,
          },
          {
            id: 'placa_nome',
            nome: 'Placas pretas com borda dourada (nomes dos convidados)',
            tipo: 'placa_nome',
            bloqueado: false,
          },
          {
            id: 'logos',
            nome: 'Área direita para logomarcas dos convidados',
            tipo: 'logos',
            bloqueado: false,
          },
          { id: 'xicara', nome: 'Xícara com pires', tipo: 'xicara', bloqueado: true },
          {
            id: 'rodape',
            nome:
              'Rodapé esquerdo "Mais que conversas, histórias que transformam." · ' +
              'Rodapé direito "CURTA | INSCREVA-SE | ATIVE O SININHO"',
            tipo: 'rodape',
            bloqueado: true,
          },
        ],
      }
      const colTemplates = app.findCollectionByNameOrId('capas_templates')
      const seedRec = new Record(colTemplates)
      seedRec.set('nome', templateMestre.nome)
      seedRec.set('estilo', 'Premium Dourado')
      seedRec.set(
        'descricao',
        'Template Mestre Oficial do CoffeeCast 4.0 — reconstrução fiel da capa oficial ' +
          '"Histórias que inspiram": fundo dourado cinematográfico com refletores, cabeçalho com ' +
          'logomarca oficial e xícara com coração, área esquerda para fotos dos convidados com ' +
          'placas pretas e borda dourada, área central de título serifado dourado/preto, área ' +
          'direita para logomarcas, rodapés oficiais. REGRA ABSOLUTA: nenhuma menção a temporada ' +
          '("Quarta Temporada", "4ª Temporada" etc.) — somente "CoffeeCast 4.0".',
      )
      seedRec.set('paleta', 'Dourado #C9971F · Vinho #4B1E3F · Champagne #F7E9D2 · Marfim #FDF8F0')
      seedRec.set('formato', '16:9')
      seedRec.set('template_json', templateMestre)
      seedRec.set('status', 'ativo')
      seedRec.set('bloqueado', true)
      seedRec.set('mestre', true)
      seedRec.set('versao', 1)
      seedRec.set('autor', 'Sistema (CoffeeCast 4.0)')
      app.save(seedRec)
    }
  },
  (app) => {
    // Reversão: apenas remove o seed do template mestre (coleções e campos permanecem).
    try {
      const seed = app.findRecordsByFilter('capas_templates', 'mestre = true', '-id', 50, 0)
      seed.forEach(function (r) {
        app.delete(r)
      })
    } catch (_) {
      /* coleção pode não existir */
    }
  },
)
