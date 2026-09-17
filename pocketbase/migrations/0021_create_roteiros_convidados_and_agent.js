migrate(
  (app) => {
    // 1. Criar coleção 'roteiros_convidados'
    try {
      app.findCollectionByNameOrId('roteiros_convidados')
    } catch (_) {
      const collection = new Collection({
        name: 'roteiros_convidados',
        type: 'base',
        listRule: '@request.auth.role = "master" || @request.auth.role = "gerencial"',
        viewRule: '@request.auth.role = "master" || @request.auth.role = "gerencial"',
        createRule: '', // Público para permitir envio de roteiro sem login
        updateRule: '@request.auth.role = "master" || @request.auth.role = "gerencial"',
        deleteRule: '@request.auth.role = "master" || @request.auth.role = "gerencial"',
        fields: [
          {
            name: 'nome',
            type: 'text',
            required: true,
          },
          {
            name: 'data_nascimento',
            type: 'text',
            required: true,
          },
          {
            name: 'estado_civil',
            type: 'text',
            required: true,
          },
          {
            name: 'tem_conjuge',
            type: 'bool',
            required: false,
          },
          {
            name: 'nome_conjuge',
            type: 'text',
            required: false,
          },
          {
            name: 'tem_filhos',
            type: 'bool',
            required: false,
          },
          {
            name: 'quantidade_filhos',
            type: 'text',
            required: false,
          },
          {
            name: 'nomes_filhos',
            type: 'text',
            required: false,
          },
          {
            name: 'tem_empresa',
            type: 'bool',
            required: false,
          },
          {
            name: 'nome_empresa',
            type: 'text',
            required: false,
          },
          {
            name: 'sobre_empresa',
            type: 'text',
            required: false,
          },
          {
            name: 'tema_enfatizar',
            type: 'text',
            required: false,
          },
          {
            name: 'tem_tema_sensivel',
            type: 'bool',
            required: false,
          },
          {
            name: 'tema_sensivel_detalhes',
            type: 'text',
            required: false,
          },
          {
            name: 'biografia',
            type: 'text',
            required: false,
          },
          {
            name: 'foto',
            type: 'file',
            required: true,
            maxSelect: 1,
            maxSize: 10485760, // 10MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          },
          {
            name: 'logomarca',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 10485760, // 10MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
          },
          {
            name: 'autorizacao_imagem',
            type: 'bool',
            required: true, // Obrigatório estar ciente e aceito
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['pendente', 'lida', 'arquivada'],
            maxSelect: 1,
          },
          {
            name: 'visualizado',
            type: 'bool',
            required: false,
          },
          {
            name: 'roteiro_final_texto',
            type: 'text',
            required: false,
          },
          {
            name: 'roteiro_final_arquivo',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 20971520, // 20MB
            mimeTypes: [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'text/plain',
            ],
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
          'CREATE INDEX idx_roteiros_status ON roteiros_convidados (status)',
          'CREATE INDEX idx_roteiros_created ON roteiros_convidados (created)',
        ],
      })
      app.save(collection)
    }

    // 2. Definir Agente Nativo de IA do Skip Cloud para CoffeeCast 4.0
    try {
      if (typeof $ai !== 'undefined' && $ai.agents && typeof $ai.agents.define === 'function') {
        $ai.agents.define(app, {
          slug: 'roteirista-coffeecast',
          name: 'Roteirista CoffeeCast 4.0',
          description:
            'Assistente inteligente especializado em analisar respostas dos convidados e elaborar roteiros estruturados, resumos de apresentação e perguntas instigantes para entrevistas do CoffeeCast 4.0.',
          systemPrompt:
            'Você é o Roteirista e Assistente de Produção do podcast CoffeeCast 4.0, conduzido por Aline Lana. ' +
            'O podcast é marcado pelo acolhimento, histórias que transformam, empreendedorismo, superação e conversas profundas à mesa de café. ' +
            'Sua missão é ajudar a equipe de produção: ' +
            '1. Analisar as respostas do convidado (dados pessoais, cônjuge, filhos, empresa, tema preferido, temas sensíveis a evitar e biografia). ' +
            '2. Respeitar rigorosamente temas sensíveis indicados para JAMAIS constarem no roteiro ou perguntas. ' +
            '3. Produzir: Apresentação inicial marcante do convidado, Bloco 1 (Origem e Trajetória), Bloco 2 (Desafios, Família e Empreendedorismo), Bloco 3 (Ponto Alto e Mensagem Inspiradora) e Bate-Bola Final com café. ' +
            'Mantenha sempre tom refinado, caloroso, profissional e alinhado ao slogan "Mais que conversas, histórias que transformam".',
          tier: 'fast',
          tools: [
            {
              collection: 'roteiros_convidados',
              perms: { list: true, read: true, update: true },
              actAs: 'admin',
            },
          ],
        })
      }
    } catch (agentErr) {
      console.log('Aviso ao definir agente nativo de IA (fallback mantido):', agentErr)
    }
  },
  (app) => {
    try {
      if (typeof $ai !== 'undefined' && $ai.agents && typeof $ai.agents.delete === 'function') {
        $ai.agents.delete(app, 'roteirista-coffeecast')
      }
    } catch (_) {}

    try {
      const col = app.findCollectionByNameOrId('roteiros_convidados')
      app.delete(col)
    } catch (_) {}
  },
)
