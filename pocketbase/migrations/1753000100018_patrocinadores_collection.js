/// <reference path="../pb_data/types.d.ts" />
// Migrate 1753000100018 — Coleção "patrocinadores" (FEATURE 2: Módulo Patrocinadores/Parceiros)
// CRM de patrocínio do CoffeeCast 4.0: empresa, contatos comerciais, modalidade/contrapartidas,
// status da parceria, episódios vinculados (relação), materiais publicitários, entregas e pendências.
// Regras de API restritas a perfis master/adm/gerencial (no PocketBase, ~ é LIKE).

migrate(
  (app) => {
    const collection = new Collection({
      name: 'patrocinadores',
      type: 'base',
      listRule:
        'role = "master" || role = "adm" || role = "gerencial" || @request.auth.role ~ "master" || @request.auth.role ~ "adm" || @request.auth.role ~ "gerencial"',
      viewRule:
        'role = "master" || role = "adm" || role = "gerencial" || @request.auth.role ~ "master" || @request.auth.role ~ "adm" || @request.auth.role ~ "gerencial"',
      createRule:
        'role = "master" || role = "adm" || role = "gerencial" || @request.auth.role ~ "master" || @request.auth.role ~ "adm" || @request.auth.role ~ "gerencial"',
      updateRule:
        'role = "master" || role = "adm" || role = "gerencial" || @request.auth.role ~ "master" || @request.auth.role ~ "adm" || @request.auth.role ~ "gerencial"',
      deleteRule: 'role = "master" || @request.auth.role ~ "master" || @request.auth.role ~ "adm"',
      fields: [
        // ---- Identificação da empresa ----
        { name: 'empresa', type: 'text', required: true, presentable: true },
        { name: 'segmento', type: 'text' },
        { name: 'website', type: 'url' },
        { name: 'instagram', type: 'text' },
        {
          name: 'logo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
        },

        // ---- Contatos comerciais ----
        { name: 'contato_nome', type: 'text' },
        { name: 'contato_cargo', type: 'text' },
        { name: 'contato_email', type: 'email' },
        { name: 'contato_telefone', type: 'text' },

        // ---- Comercial ----
        // Modalidade / contrapartidas acordadas (texto livre: cota, valor, o que foi combinado)
        {
          name: 'modalidade',
          type: 'select',
          maxSelect: 1,
          values: ['cota_master', 'cota_episodio', 'permuta', 'apoio', 'outro'],
        },
        { name: 'valor_contrato', type: 'number', onlyInt: false },
        { name: 'contrapartidas', type: 'text' },
        // Status da parceria
        {
          name: 'status',
          type: 'select',
          maxSelect: 1,
          values: ['prospect', 'em_negociacao', 'ativo', 'pausado', 'encerrado'],
        },

        // ---- Vínculo com episódios ----
        // Relation resolvida em tempo de migração (o id de "episodios" não é conhecido antes)
        {
          name: 'episodios',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('episodios').id,
          cascadeDelete: false,
          maxSelect: 99,
          minSelect: 0,
        },

        // ---- Materiais publicitários (PDFs/imagens/banners enviados) ----
        { name: 'materiais', type: 'file', maxSelect: 10, maxSize: 10485760 },

        // ---- Acompanhamento ----
        { name: 'entregas', type: 'text' },
        { name: 'pendencias', type: 'text' },
        { name: 'observacoes', type: 'text' },

        // Padrão do projeto (auditoria/ownership)
        { name: 'role', type: 'text' },
      ],
      indexes: [
        'CREATE INDEX idx_patrocinadores_empresa ON patrocinadores (empresa)',
        'CREATE INDEX idx_patrocinadores_status ON patrocinadores (status)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('patrocinadores')
    app.delete(collection)
  },
)
