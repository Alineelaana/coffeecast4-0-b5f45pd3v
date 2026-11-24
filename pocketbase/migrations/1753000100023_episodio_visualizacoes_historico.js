// pocketbase/migrations/1753000100023_episodio_visualizacoes_historico.js
// Histórico de visualizações por episódio: um registro por VISUALIZAÇÃO (sem dados
// pessoais — só o episódio e a data de criação). Alimenta o gráfico "Visualizações
// por período" do Dashboard; o acumulado em episodios.visualizacoes continua igual.
//
// - episodio: relation obrigatória para episodios (delete em cascata junto com o episódio).
// - created: autodate onCreate — a data do evento.
// - Regras: sem create/update/delete público (escrita só via hook $app.save, que ignora
//   as regras); leitura restrita aos perfis que já veem estatísticas (role = "master" ||
//   "adm" || "gerencial").
// - Índices: episódio + created (busca por período) e created (ordenação do gráfico).
// - Sem limite baixo de registros (PocketBase não impõe limite de coleção por padrão).
migrate(
  (app) => {
    let episodiosId = ''
    try {
      episodiosId = app.findCollectionByNameOrId('episodios').id
    } catch (err) {
      console.log('[episodio_visualizacoes] episódios não existe ainda — nada a fazer')
      return
    }

    const collection = new Collection({
      name: 'episodio_visualizacoes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role ~ 'master' || @request.auth.role ~ 'adm' || @request.auth.role ~ 'gerencial')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role ~ 'master' || @request.auth.role ~ 'adm' || @request.auth.role ~ 'gerencial')",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'episodio',
          type: 'relation',
          required: true,
          collectionId: episodiosId,
          cascadeDelete: true,
          maxSelect: 1,
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
        'CREATE INDEX idx_episodio_visualizacoes_episodio_created ON episodio_visualizacoes (episodio, created)',
        'CREATE INDEX idx_episodio_visualizacoes_created ON episodio_visualizacoes (created)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('episodio_visualizacoes')
    app.delete(col)
  },
)
