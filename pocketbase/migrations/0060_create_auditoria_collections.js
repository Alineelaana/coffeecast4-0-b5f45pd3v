migrate(
  (app) => {
    // 1. Coleção auditoria_eventos
    // Registro imutável de cada ação relevante no sistema
    // deleteRule e updateRule = null (ninguém edita nem apaga via API)
    // listRule e viewRule: Master e ADM autenticado
    // createRule: autenticado ou endpoint/servidor
    const eventosCol = new Collection({
      name: 'auditoria_eventos',
      type: 'base',
      listRule:
        '@request.auth.id != "" && (@request.auth.role = "master" || @request.auth.role = "adm")',
      viewRule:
        '@request.auth.id != "" && (@request.auth.role = "master" || @request.auth.role = "adm")',
      createRule: '@request.auth.id != ""',
      updateRule: null, // HISTÓRICO PROTEGIDO CONTRA EDIÇÃO
      deleteRule: null, // HISTÓRICO PROTEGIDO CONTRA EXCLUSÃO
      fields: [
        {
          name: 'usuario_id',
          type: 'text',
          required: false,
        },
        {
          name: 'usuario_email',
          type: 'text',
          required: false,
        },
        {
          name: 'usuario_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'usuario_role',
          type: 'text',
          required: false,
        },
        {
          name: 'loja_id',
          type: 'text',
          required: false,
        },
        {
          name: 'loja_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'tipo_acao',
          type: 'select',
          required: true,
          values: [
            'login',
            'logout',
            'tentativa_login',
            'falha_login',
            'alteracao_senha',
            'criacao',
            'edicao',
            'exclusao',
            'download',
            'upload',
            'alteracao_permissao',
            'criacao_usuario',
            'mudanca_nivel',
            'acao_administrativa',
            'movimentacao_financeira',
            'alteracao_site',
            'agenda',
            'cadastro',
            'configuracao',
            'chat',
            'bloqueio_acesso',
            'outro',
          ],
          maxSelect: 1,
        },
        {
          name: 'area_sistema',
          type: 'text',
          required: true,
        },
        {
          name: 'descricao',
          type: 'text',
          required: true,
        },
        {
          name: 'registro_afetado',
          type: 'text',
          required: false,
        },
        {
          name: 'tabela_afetada',
          type: 'text',
          required: false,
        },
        {
          name: 'ip',
          type: 'text',
          required: false,
        },
        {
          name: 'dispositivo',
          type: 'text',
          required: false,
        },
        {
          name: 'navegador',
          type: 'text',
          required: false,
        },
        {
          name: 'resultado',
          type: 'select',
          required: true,
          values: ['sucesso', 'erro', 'bloqueio'],
          maxSelect: 1,
        },
        {
          name: 'diff_antes',
          type: 'json',
          required: false,
          maxSize: 5000000,
        },
        {
          name: 'diff_depois',
          type: 'json',
          required: false,
          maxSize: 5000000,
        },
        {
          name: 'metadata',
          type: 'json',
          required: false,
          maxSize: 5000000,
        },
        {
          name: 'suspeito',
          type: 'bool',
          required: false,
        },
        {
          name: 'motivo_suspeito',
          type: 'text',
          required: false,
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
        'CREATE INDEX idx_audit_eventos_created ON auditoria_eventos (created DESC)',
        'CREATE INDEX idx_audit_eventos_usuario ON auditoria_eventos (usuario_id)',
        'CREATE INDEX idx_audit_eventos_tipo ON auditoria_eventos (tipo_acao)',
        'CREATE INDEX idx_audit_eventos_area ON auditoria_eventos (area_sistema)',
        'CREATE INDEX idx_audit_eventos_resultado ON auditoria_eventos (resultado)',
        'CREATE INDEX idx_audit_eventos_suspeito ON auditoria_eventos (suspeito)',
        'CREATE INDEX idx_audit_eventos_loja ON auditoria_eventos (loja_id)',
      ],
    })
    app.save(eventosCol)

    // 2. Coleção auditoria_regras
    // Regras personalizadas de alerta criadas por Master ou ADM autorizado
    const regrasCol = new Collection({
      name: 'auditoria_regras',
      type: 'base',
      listRule:
        '@request.auth.id != "" && (@request.auth.role = "master" || @request.auth.role = "adm")',
      viewRule:
        '@request.auth.id != "" && (@request.auth.role = "master" || @request.auth.role = "adm")',
      createRule:
        '@request.auth.id != "" && (@request.auth.role = "master" || @request.auth.role = "adm")',
      updateRule:
        '@request.auth.id != "" && (@request.auth.role = "master" || @request.auth.role = "adm")',
      deleteRule: '@request.auth.role = "master"',
      fields: [
        {
          name: 'nome',
          type: 'text',
          required: true,
        },
        {
          name: 'descricao',
          type: 'text',
          required: false,
        },
        {
          name: 'evento_monitorado',
          type: 'text', // Ex.: 'todos', 'exclusao', 'palavra_chave', 'financeiro', 'permissao', 'falha_login', 'bloqueio_acesso'
          required: true,
        },
        {
          name: 'palavra_chave',
          type: 'text', // Ex.: "Aline Lana", "excluir", "pix"
          required: false,
        },
        {
          name: 'usuarios_monitorados',
          type: 'json', // Array de IDs de usuários ou vazio para todos
          required: false,
        },
        {
          name: 'niveis_monitorados',
          type: 'json', // Array de cargos: ['adm', 'gerencial', 'ouro', 'prata', 'master']
          required: false,
        },
        {
          name: 'lojas_monitoradas',
          type: 'json', // Array de IDs de lojas ou vazio para todas
          required: false,
        },
        {
          name: 'areas_monitoradas',
          type: 'json', // Array de telas/áreas: ['financeiro', 'usuarios', 'chat', ...]
          required: false,
        },
        {
          name: 'criterio_disparo',
          type: 'text', // Ex.: 'imediato', 'contagem_tentativas_3', 'valor_acima_limite'
          required: false,
        },
        {
          name: 'prioridade',
          type: 'select',
          required: true,
          values: ['baixa', 'media', 'alta', 'critica'],
          maxSelect: 1,
        },
        {
          name: 'destinatarios',
          type: 'json', // Lista de emails ou roles que devem receber o alerta
          required: false,
        },
        {
          name: 'ativo',
          type: 'bool',
          required: false,
        },
        {
          name: 'criado_por',
          type: 'text',
          required: false,
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
        'CREATE INDEX idx_audit_regras_ativo ON auditoria_regras (ativo)',
        'CREATE INDEX idx_audit_regras_evento ON auditoria_regras (evento_monitorado)',
      ],
    })
    app.save(regrasCol)

    // 3. Coleção auditoria_alertas
    // Alertas disparados pelas regras de monitoramento
    const alertasCol = new Collection({
      name: 'auditoria_alertas',
      type: 'base',
      listRule:
        '@request.auth.id != "" && (@request.auth.role = "master" || @request.auth.role = "adm")',
      viewRule:
        '@request.auth.id != "" && (@request.auth.role = "master" || @request.auth.role = "adm")',
      createRule: '@request.auth.id != ""',
      updateRule:
        '@request.auth.id != "" && (@request.auth.role = "master" || @request.auth.role = "adm")',
      deleteRule: '@request.auth.role = "master"',
      fields: [
        {
          name: 'regra_id',
          type: 'text',
          required: false,
        },
        {
          name: 'regra_nome',
          type: 'text',
          required: true,
        },
        {
          name: 'evento_id',
          type: 'text',
          required: false,
        },
        {
          name: 'prioridade',
          type: 'select',
          required: true,
          values: ['baixa', 'media', 'alta', 'critica'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['novo', 'visualizado', 'em_analise', 'resolvido'],
          maxSelect: 1,
        },
        {
          name: 'motivo',
          type: 'text',
          required: true,
        },
        {
          name: 'detalhes',
          type: 'text',
          required: false,
        },
        {
          name: 'usuario_envolvido_id',
          type: 'text',
          required: false,
        },
        {
          name: 'usuario_envolvido_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'usuario_envolvido_email',
          type: 'text',
          required: false,
        },
        {
          name: 'loja_id',
          type: 'text',
          required: false,
        },
        {
          name: 'loja_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'area_sistema',
          type: 'text',
          required: false,
        },
        {
          name: 'link_relacionado',
          type: 'text',
          required: false,
        },
        {
          name: 'historico_status',
          type: 'json', // Array de { status: string, alterado_por_id: string, alterado_por_nome: string, data: string, observacao: string }
          required: false,
          maxSize: 2000000,
        },
        {
          name: 'visualizado_por_id',
          type: 'text',
          required: false,
        },
        {
          name: 'visualizado_por_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'data_visualizacao',
          type: 'date',
          required: false,
        },
        {
          name: 'resolvido_por_id',
          type: 'text',
          required: false,
        },
        {
          name: 'resolvido_por_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'data_resolucao',
          type: 'date',
          required: false,
        },
        {
          name: 'resolucao_notas',
          type: 'text',
          required: false,
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
        'CREATE INDEX idx_audit_alertas_created ON auditoria_alertas (created DESC)',
        'CREATE INDEX idx_audit_alertas_status ON auditoria_alertas (status)',
        'CREATE INDEX idx_audit_alertas_prioridade ON auditoria_alertas (prioridade)',
        'CREATE INDEX idx_audit_alertas_usuario ON auditoria_alertas (usuario_envolvido_id)',
      ],
    })
    app.save(alertasCol)

    // 4. Inserir regras padrão de monitoramento para o sistema estar protegido imediatamente
    try {
      const defaultRules = [
        {
          nome: 'Alerta de Menção a Aline Lana no Chat',
          descricao:
            'Dispara alerta crítico quando o nome da fundadora for mencionado em mensagens ou conversas',
          evento_monitorado: 'chat',
          palavra_chave: 'Aline Lana',
          prioridade: 'alta',
          criterio_disparo: 'imediato',
          ativo: true,
          niveis_monitorados: ['master', 'adm', 'gerencial', 'ouro', 'prata'],
        },
        {
          nome: 'Exclusão de Registros do Sistema',
          descricao:
            'Registra alerta sempre que qualquer usuário excluir cadastros, transações, episódios ou conversas',
          evento_monitorado: 'exclusao',
          palavra_chave: '',
          prioridade: 'critica',
          criterio_disparo: 'imediato',
          ativo: true,
          niveis_monitorados: ['adm', 'gerencial', 'ouro', 'prata', 'master'],
        },
        {
          nome: 'Alteração em Movimentação Financeira',
          descricao:
            'Dispara alerta quando houver edição ou inserção de valores no caixa e receitas',
          evento_monitorado: 'financeiro',
          palavra_chave: '',
          prioridade: 'alta',
          criterio_disparo: 'imediato',
          ativo: true,
          niveis_monitorados: ['adm', 'gerencial', 'master'],
        },
        {
          nome: 'Alteração de Permissões ou Cargo de Usuário',
          descricao:
            'Monitora alterações em perfis de acesso, permissões granulares de ADM ou mudanças de cargo',
          evento_monitorado: 'alteracao_permissao',
          palavra_chave: '',
          prioridade: 'critica',
          criterio_disparo: 'imediato',
          ativo: true,
          niveis_monitorados: ['adm', 'gerencial', 'master'],
        },
        {
          nome: 'Tentativa de Acesso Não Autorizado / Bloqueio',
          descricao:
            'Alerta quando um usuário tentar acessar telas, rotas ou recursos sem permissão concedida',
          evento_monitorado: 'bloqueio_acesso',
          palavra_chave: '',
          prioridade: 'alta',
          criterio_disparo: 'imediato',
          ativo: true,
          niveis_monitorados: ['adm', 'gerencial', 'ouro', 'prata'],
        },
        {
          nome: 'Múltiplas Falhas de Login / Tentativas Suspeitas',
          descricao:
            'Alerta quando houver erros seguidos de senha ou tentativas de login inválidas',
          evento_monitorado: 'falha_login',
          palavra_chave: '',
          prioridade: 'alta',
          criterio_disparo: 'imediato',
          ativo: true,
          niveis_monitorados: ['adm', 'gerencial', 'ouro', 'prata', 'master'],
        },
      ]

      for (let i = 0; i < defaultRules.length; i++) {
        const rData = defaultRules[i]
        const rec = new Record(regrasCol)
        rec.set('nome', rData.nome)
        rec.set('descricao', rData.descricao)
        rec.set('evento_monitorado', rData.evento_monitorado)
        rec.set('palavra_chave', rData.palavra_chave)
        rec.set('prioridade', rData.prioridade)
        rec.set('criterio_disparo', rData.criterio_disparo)
        rec.set('ativo', rData.ativo)
        rec.set('niveis_monitorados', rData.niveis_monitorados)
        rec.set('criado_por', 'Sistema CoffeeCast (Padrão)')
        app.save(rec)
      }
    } catch (errSeed) {
      console.log('Aviso ao semear regras padrão de auditoria:', errSeed)
    }
  },
  (app) => {
    try {
      const alertas = app.findCollectionByNameOrId('auditoria_alertas')
      app.delete(alertas)
    } catch (_) {}

    try {
      const regras = app.findCollectionByNameOrId('auditoria_regras')
      app.delete(regras)
    } catch (_) {}

    try {
      const eventos = app.findCollectionByNameOrId('auditoria_eventos')
      app.delete(eventos)
    } catch (_) {}
  },
)
