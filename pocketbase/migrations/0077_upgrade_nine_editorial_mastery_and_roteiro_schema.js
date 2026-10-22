// pocketbase/migrations/0077_upgrade_nine_editorial_mastery_and_roteiro_schema.js
/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Atualizar a coleção roteiros_convidados com novos campos para o Editor e Aprovação
    const roteirosCol = app.findCollectionByNameOrId('roteiros_convidados')

    // Campo de status de aprovação editorial: rascunho | em_revisao | aprovado
    if (!roteirosCol.fields.getByName('status_aprovacao')) {
      roteirosCol.fields.add(
        new SelectField({
          name: 'status_aprovacao',
          values: ['rascunho', 'em_revisao', 'aprovado'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    // Campo estruturado em JSON para armazenar os blocos do editor interativo
    if (!roteirosCol.fields.getByName('roteiro_estruturado')) {
      roteirosCol.fields.add(
        new JSONField({
          name: 'roteiro_estruturado',
          maxSize: 5242880,
          required: false,
        }),
      )
    }

    // Metadados dinâmicos de gravação (data, horário, subtítulo, empresa, endereço, gps)
    if (!roteirosCol.fields.getByName('data_gravacao')) {
      roteirosCol.fields.add(
        new TextField({
          name: 'data_gravacao',
          required: false,
        }),
      )
    }

    if (!roteirosCol.fields.getByName('horario_gravacao')) {
      roteirosCol.fields.add(
        new TextField({
          name: 'horario_gravacao',
          required: false,
        }),
      )
    }

    if (!roteirosCol.fields.getByName('subtitulo_episodio')) {
      roteirosCol.fields.add(
        new TextField({
          name: 'subtitulo_episodio',
          required: false,
        }),
      )
    }

    if (!roteirosCol.fields.getByName('empresa_cargo_personalizado')) {
      roteirosCol.fields.add(
        new TextField({
          name: 'empresa_cargo_personalizado',
          required: false,
        }),
      )
    }

    if (!roteirosCol.fields.getByName('endereco_personalizado')) {
      roteirosCol.fields.add(
        new TextField({
          name: 'endereco_personalizado',
          required: false,
        }),
      )
    }

    if (!roteirosCol.fields.getByName('link_gps_personalizado')) {
      roteirosCol.fields.add(
        new URLField({
          name: 'link_gps_personalizado',
          required: false,
        }),
      )
    }

    app.save(roteirosCol)

    // 2. Garantir chave de endereço padrão e link GPS oficial em conteudo_site se não existirem
    const conteudoCol = app.findCollectionByNameOrId('conteudo_site')
    const defaultsStudio = [
      {
        chave: 'estudio_padrao_endereco',
        valor:
          'Estúdio Filme — R. Ulisses Sarmento, 24, salas 407 e 408 — Praia do Suá, Vitória — ES, CEP 29052-320',
      },
      {
        chave: 'estudio_padrao_gps',
        valor:
          'https://www.google.com/maps/dir/?api=1&destination=R.+Ulisses+Sarmento,+24,+Praia+do+Su%C3%A1,+Vit%C3%B3ria,+ES',
      },
      {
        chave: 'estudio_padrao_estacionamento',
        valor: 'ESTACIONAMENTO PRÓPRIO DISPONÍVEL AOS CONVIDADOS',
      },
    ]

    for (let s = 0; s < defaultsStudio.length; s++) {
      const defItem = defaultsStudio[s]
      try {
        app.findFirstRecordByData('conteudo_site', 'chave', defItem.chave)
      } catch (_) {
        const nRec = new Record(conteudoCol)
        nRec.set('chave', defItem.chave)
        nRec.set('valor', defItem.valor)
        app.save(nRec)
      }
    }

    // 3. Atualizar o agente nativo 'roteirista-coffeecast' com o treinamento editorial do modelo Grazi e Márcio
    const roteiristaSystemPromptV2 = [
      'Você é a Nine, roteirista-chefe e produtora editorial sênior do podcast CoffeeCast 4.0.',
      'Sua missão é criar roteiros personalizados, inteligentes, envolventes e profissionais seguindo a referência oficial de excelência editorial do CoffeeCast 4.0 (modelo Grazi e Márcio / Orvex).',
      '',
      '### DIRETRIZES FUNDAMENTAIS:',
      '1. COMPREENSÃO ANTES DA FORMULAÇÃO: Analise cuidadosamente as informações dos convidados: acontecimentos mais relevantes, desafios e decisões, características pessoais marcantes, resultados concretos, assuntos que geram identificação com o público e conexões entre vida pessoal, carreira e tema do episódio.',
      '2. PROFUNDIDADE REAL: Não crie roteiros genéricos, superficiais ou excessivamente poéticos. Não faça perguntas que apenas reproduzam dados da ficha. Pergunte o que existe por trás dos acontecimentos: decisões, sentimentos, dificuldades, aprendizados, consequências e transformações.',
      '3. REGRA DURA DE VERDADE: Jamais invente fatos, títulos profissionais, conquistas, resultados ou informações biográficas que não constem do material recebido.',
      '4. SEM SÍMBOLOS DE MARKDOWN NO TEXTO: Não use **, __ ou listas com hifens. Gere saída estruturada limpa, pronta para o editor da plataforma diagramar.',
      '5. ESTRUTURA EDITORIAL OBRIGATÓRIA (Padrão 60 minutos):',
      '   - Título forte e elegante;',
      '   - Subtítulo que resuma a essência;',
      '   - Abertura escrita para leitura natural pelas apresentadoras (3 minutos);',
      '   - Bloco 1: Origens e formação / Encontro (8 minutos);',
      '   - Bloco 2: Desafios, família e escolhas (8 minutos);',
      '   - Bloco 3: Projeto profissional / Empresa como propósito (12 minutos);',
      '   - Bloco 4: Conhecimento prático / Liderança / Conteúdo útil (10 minutos);',
      '   - Bloco 5: Sonhos e perspectivas de futuro (5 minutos);',
      '   - Bloco 6: Bate-bola dinâmico e personalizado (5 minutos);',
      '   - Bloco 7: Encerramento com pergunta de LEGADO e reflexão final (4 minutos);',
      '   - Resumo de duração (55 minutos de roteiro + 5 minutos para fluir = 60 minutos).',
      '   - Perguntas opcionais sinalizadas como "Se houver espaço:".',
      '6. CASAL / MÚLTIPLOS CONVIDADOS: Equilibre perguntas individuais para cada um e perguntas de troca mútua e sinergia na mesa.',
      '7. EPISÓDIOS SEM CONVIDADOS: Adapte para dinâmica de conversa profunda entre as apresentadoras.',
    ].join('\n')

    try {
      if (typeof $ai !== 'undefined' && $ai.agents && typeof $ai.agents.define === 'function') {
        $ai.agents.define(app, {
          slug: 'roteirista-coffeecast',
          name: 'Nine - Roteirista & Produtora Editorial CoffeeCast 4.0',
          description:
            'Nine atua como roteirista-chefe e produtora editorial do CoffeeCast 4.0. Estrutura roteiros personalizados, inteligentes e envolventes no padrão oficial de Grazi e Márcio (60 minutos, 7 blocos, bate-bola e legado), com texto limpo e fidelidade factual absoluta.',
          systemPrompt: roteiristaSystemPromptV2,
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
      console.log('Aviso ao atualizar agente nativo na migração 0077:', agentErr)
    }
  },
  (app) => {
    // Reverter apenas campos adicionados se necessário
    const roteirosCol = app.findCollectionByNameOrId('roteiros_convidados')
    const fieldsToRemove = [
      'status_aprovacao',
      'roteiro_estruturado',
      'data_gravacao',
      'horario_gravacao',
      'subtitulo_episodio',
      'empresa_cargo_personalizado',
      'endereco_personalizado',
      'link_gps_personalizado',
    ]
    for (let f = 0; f < fieldsToRemove.length; f++) {
      const fName = fieldsToRemove[f]
      const field = roteirosCol.fields.getByName(fName)
      if (field) {
        roteirosCol.fields.removeByName(fName)
      }
    }
    app.save(roteirosCol)
  },
)
