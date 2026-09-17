migrate(
  (app) => {
    const agendaCol = app.findCollectionByNameOrId('agenda')

    const listaEpisodios = [
      {
        titulo:
          'EP #01 — FEMINILIDADE EM CRISE: a mulher que aprendeu a lutar, mas desaprendeu a sentir...',
        gravacao: '2025-10-23 10:00:00.000Z',
        postagem: '2025-11-01 10:00:00.000Z',
      },
      {
        titulo:
          'EP #02 — Querer ou Não Ser Mãe: Desafios da Maternidade na Vida da Mulher Moderna...',
        gravacao: '2025-10-30 10:00:00.000Z',
        postagem: '2025-11-08 10:00:00.000Z',
      },
      {
        titulo:
          'EP #03 — TRANSIÇÃO DE CARREIRA FEMININA: Encontrando harmonia entre família, trabalho e si mesma.',
        gravacao: '2025-11-06 10:00:00.000Z',
        postagem: '2025-11-15 10:00:00.000Z',
      },
      {
        titulo:
          'EP #04 — BURNOUT COMO SINTOMA DE UMA VIDA NO AUTOMÁTICO: A sobrecarga que nos desconecta de nós mesmos',
        gravacao: '2025-11-13 10:00:00.000Z',
        postagem: '2025-11-22 10:00:00.000Z',
      },
      {
        titulo: 'EP #05 — VÍNCULOS SAUDÁVEIS: Como Construir Laços Que Sustentam e Não Consomem...',
        gravacao: '2025-11-20 10:00:00.000Z',
        postagem: '2025-11-29 10:00:00.000Z',
      },
      {
        titulo: 'EP #06 — NARCISISMO PARTE 1: É possível reconhecer um narcisista patológico?',
        gravacao: '2025-11-27 10:00:00.000Z',
        postagem: '2025-12-06 10:00:00.000Z',
      },
      {
        titulo:
          'EP #07 — NARCISISMO PARTE 2: Entenda qual o perfil da vítima e do agressor narcisista...',
        gravacao: '2025-12-04 10:00:00.000Z',
        postagem: '2025-12-13 10:00:00.000Z',
      },
      {
        titulo: 'EP #08 — NARCISISTA PARTE 3: Como quebrar o ciclo e voltar a ser você...',
        gravacao: '2025-12-11 10:00:00.000Z',
        postagem: '2025-12-20 10:00:00.000Z',
      },
      {
        titulo: 'EP #09 — AUTOVALOR E MERECIMENTO: Quando você entende o seu valor, tudo muda...',
        gravacao: '2025-12-18 10:00:00.000Z',
        postagem: '2025-12-27 10:00:00.000Z',
      },
      {
        titulo: 'EP #10 — RELACIONAMENTOS SAUDÁVEIS: Quando o amor é leve, seguro e recíproco...',
        gravacao: '2025-12-25 10:00:00.000Z',
        postagem: '2026-01-03 10:00:00.000Z',
      },
      {
        titulo: 'EP #11 — RELACIONAMENTOS SAUDÁVEIS 2: O amor que você escolhe viver...',
        gravacao: '2026-01-01 10:00:00.000Z',
        postagem: '2026-01-10 10:00:00.000Z',
      },
      {
        titulo: 'EP #12 — FEMINICÍDIO: Não começa com a MORTE, começa com o controle...',
        gravacao: '2026-01-08 10:00:00.000Z',
        postagem: '2026-01-17 10:00:00.000Z',
      },
      {
        titulo: 'EP #13 — FEMINICÍDIO 2: Sair viva e com segurança é prioridade...',
        gravacao: '2026-01-15 10:00:00.000Z',
        postagem: '2026-01-24 10:00:00.000Z',
      },
      {
        titulo: 'EP #14 — DA REPETIÇÃO DE PADRÕES À CONSCIÊNCIA – Como nasceu o Coffee Cast 4.0...',
        gravacao: '2026-01-22 10:00:00.000Z',
        postagem: '2026-01-31 10:00:00.000Z',
      },
      {
        titulo: 'EP #15 — LEVEZA NÃO É FUGA, É MATURIDADE!',
        gravacao: '2026-01-29 10:00:00.000Z',
        postagem: '2026-02-07 10:00:00.000Z',
      },
      {
        titulo:
          'EP #16 — Autorresponsabilidade: "Qual a sua responsabilidade na desordem da qual você se queixa?"',
        gravacao: '2026-02-05 10:00:00.000Z',
        postagem: '2026-02-14 10:00:00.000Z',
      },
      {
        titulo: 'EP #17 — DEPENDÊNCIA EMOCIONAL: Quem vem primeiro, você ou o próximo?',
        gravacao: '2026-02-12 10:00:00.000Z',
        postagem: '2026-02-21 10:00:00.000Z',
      },
      {
        titulo:
          'EP #18 — Prosperidade emocional: o quanto você se permite viver sem precisar de aprovação?',
        gravacao: '2026-02-19 10:00:00.000Z',
        postagem: '2026-02-28 10:00:00.000Z',
      },
      {
        titulo:
          'EP #19 — O cérebro que prospera: o que a neurociência revela sobre riqueza, leveza e escolhas',
        gravacao: '2026-02-26 10:00:00.000Z',
        postagem: '2026-03-07 10:00:00.000Z',
      },
      {
        titulo: 'EP #20 — Manifestação não é mágica: o erro na Lei da Atração',
        gravacao: '2026-03-05 10:00:00.000Z',
        postagem: '2026-03-14 10:00:00.000Z',
      },
      {
        titulo: 'EP #21 — Física Quântica: você cria sua realidade mais do que imagina...',
        gravacao: '2026-03-12 10:00:00.000Z',
        postagem: '2026-03-21 10:00:00.000Z',
      },
      {
        titulo:
          'EP #22 — Decidir e sustentar: por que sua vida não muda mesmo quando você sabe o que fazer?',
        gravacao: '2026-03-19 10:00:00.000Z',
        postagem: '2026-03-28 10:00:00.000Z',
      },
      {
        titulo: 'EP #23 — Sua vida não trava. Ela reflete quem você sustenta ser.',
        gravacao: '2026-03-26 10:00:00.000Z',
        postagem: '2026-04-04 10:00:00.000Z',
      },
      {
        titulo: 'EP #24 — Você não ganha mais dinheiro porque não sustenta quem precisa ser...',
        gravacao: '2026-04-02 10:00:00.000Z',
        postagem: '2026-04-11 10:00:00.000Z',
      },
      {
        titulo: 'EP #25 — O erro que te impede de evoluir (mesmo querendo)...',
        gravacao: '2026-04-09 10:00:00.000Z',
        postagem: '2026-04-18 10:00:00.000Z',
      },
      {
        titulo: 'EP #26 — Sua vida não está travada você que está aceitando demais...',
        gravacao: '2026-04-16 10:00:00.000Z',
        postagem: '2026-04-25 10:00:00.000Z',
      },
      {
        titulo:
          'EP #27 — Por que adultos precisam de terapia? (a verdade que ninguém te contou)...',
        gravacao: '2026-04-23 10:00:00.000Z',
        postagem: '2026-05-02 10:00:00.000Z',
      },
      {
        titulo: 'EP #28 — Mãe, foi isso que eu aprendi com você... (Especial Dia das Mães)...',
        gravacao: '2026-04-30 10:00:00.000Z',
        postagem: '2026-05-09 10:00:00.000Z',
      },
      {
        titulo: 'EP #29 — "Eu sou assim" Pode ser a maior mentira que você acredita...',
        gravacao: '2026-05-07 10:00:00.000Z',
        postagem: '2026-05-16 10:00:00.000Z',
      },
      {
        titulo: 'EP #30 — A infância que você teve, ainda está decidindo sua vida...',
        gravacao: '2026-05-14 10:00:00.000Z',
        postagem: '2026-05-23 10:00:00.000Z',
      },
      {
        titulo: 'EP #31 — A verdade difícil sobre pais que "fizeram o melhor que podiam"...',
        gravacao: '2026-05-21 10:00:00.000Z',
        postagem: '2026-05-30 10:00:00.000Z',
      },
      {
        titulo: 'EP #32 — Muita gente não é quem é. É quem aprendeu que deveria ser.',
        gravacao: '2026-05-28 10:00:00.000Z',
        postagem: '2026-06-06 10:00:00.000Z',
      },
      {
        titulo: 'EP #33 — Seu filho não precisa de perfeição. Precisa se sentir seguro.',
        gravacao: '2026-06-04 10:00:00.000Z',
        postagem: '2026-06-13 10:00:00.000Z',
      },
      {
        titulo: 'EP #34 — O que toda família precisa entender antes que seja tarde...',
        gravacao: '2026-06-11 10:00:00.000Z',
        postagem: '2026-06-20 10:00:00.000Z',
      },
      {
        titulo: 'EP #35 — Mulheres inspiradoras: Dayana Ribas',
        gravacao: '2026-06-18 10:00:00.000Z',
        postagem: '2026-06-27 10:00:00.000Z',
      },
      {
        titulo: 'EP #36 — Mulheres inspiradoras: Flávia Franco',
        gravacao: '2026-06-25 10:00:00.000Z',
        postagem: '2026-07-04 10:00:00.000Z',
      },
      {
        titulo: 'EP #37 — Mulheres inspiradoras: Aline Lana',
        gravacao: '2026-07-02 10:00:00.000Z',
        postagem: '2026-07-11 10:00:00.000Z',
      },
      {
        titulo: 'EP #38 — Mulheres inspiradoras: Rosi Lima',
        gravacao: '2026-07-09 10:00:00.000Z',
        postagem: '2026-07-18 10:00:00.000Z',
      },
      {
        titulo: 'EP #39 — Histórias que inspiram: Turismo 10 – Júnior e Bruna como tudo começou...',
        gravacao: '2026-07-16 10:00:00.000Z',
        postagem: '2026-07-25 10:00:00.000Z',
      },
      {
        titulo: 'EP #40 — Por que viajar pode ser a melhor decisão da sua vida?',
        gravacao: '2026-07-23 10:00:00.000Z',
        postagem: '2026-08-01 10:00:00.000Z',
      },
      {
        titulo:
          'EP #41 — E se o café que você vende fosse, na verdade, apenas o começo da sua missão?',
        gravacao: '2026-07-30 10:00:00.000Z',
        postagem: '2026-08-08 10:00:00.000Z',
      },
      {
        titulo:
          'EP #42 — Você Está Vivendo ou Apenas Sobrevivendo? | Propósito, Silêncio e Coragem',
        gravacao: '2026-08-06 10:00:00.000Z',
        postagem: '2026-08-15 10:00:00.000Z',
      },
      {
        titulo: 'EP #43 — Histórias que Inspiram: Daniella Freitas e Gran Romano',
        gravacao: '2026-08-13 10:00:00.000Z',
        postagem: '2026-08-22 10:00:00.000Z',
      },
      {
        titulo:
          'EP #44 — A CORAGEM DE RECOMEÇAR | O que você está disposta a fazer para chegar lá?',
        gravacao: '2026-08-20 10:00:00.000Z',
        postagem: '2026-08-29 10:00:00.000Z',
      },
    ]

    for (let i = 0; i < listaEpisodios.length; i++) {
      const ep = listaEpisodios[i]
      try {
        app.findFirstRecordByData('agenda', 'titulo', ep.titulo)
      } catch (_) {
        const record = new Record(agendaCol)
        record.set('titulo', ep.titulo)
        record.set('data_agendamento', ep.gravacao)
        record.set('data_gravacao', ep.gravacao)
        record.set('data_postagem', ep.postagem)
        record.set('horas_utilizadas', 1)
        record.set('tem_convidado', false)
        record.set('patrocinado', false)
        app.save(record)
      }
    }
  },
  (app) => {
    // Reverter excluindo os registros cadastrados por esta migration
    const listaEpisodios = [
      'EP #01 — FEMINILIDADE EM CRISE: a mulher que aprendeu a lutar, mas desaprendeu a sentir...',
      'EP #02 — Querer ou Não Ser Mãe: Desafios da Maternidade na Vida da Mulher Moderna...',
      'EP #03 — TRANSIÇÃO DE CARREIRA FEMININA: Encontrando harmonia entre família, trabalho e si mesma.',
      'EP #04 — BURNOUT COMO SINTOMA DE UMA VIDA NO AUTOMÁTICO: A sobrecarga que nos desconecta de nós mesmos',
      'EP #05 — VÍNCULOS SAUDÁVEIS: Como Construir Laços Que Sustentam e Não Consomem...',
      'EP #06 — NARCISISMO PARTE 1: É possível reconhecer um narcisista patológico?',
      'EP #07 — NARCISISMO PARTE 2: Entenda qual o perfil da vítima e do agressor narcisista...',
      'EP #08 — NARCISISTA PARTE 3: Como quebrar o ciclo e voltar a ser você...',
      'EP #09 — AUTOVALOR E MERECIMENTO: Quando você entende o seu valor, tudo muda...',
      'EP #10 — RELACIONAMENTOS SAUDÁVEIS: Quando o amor é leve, seguro e recíproco...',
      'EP #11 — RELACIONAMENTOS SAUDÁVEIS 2: O amor que você escolhe viver...',
      'EP #12 — FEMINICÍDIO: Não começa com a MORTE, começa com o controle...',
      'EP #13 — FEMINICÍDIO 2: Sair viva e com segurança é prioridade...',
      'EP #14 — DA REPETIÇÃO DE PADRÕES À CONSCIÊNCIA – Como nasceu o Coffee Cast 4.0...',
      'EP #15 — LEVEZA NÃO É FUGA, É MATURIDADE!',
      'EP #16 — Autorresponsabilidade: "Qual a sua responsabilidade na desordem da qual você se queixa?"',
      'EP #17 — DEPENDÊNCIA EMOCIONAL: Quem vem primeiro, você ou o próximo?',
      'EP #18 — Prosperidade emocional: o quanto você se permite viver sem precisar de aprovação?',
      'EP #19 — O cérebro que prospera: o que a neurociência revela sobre riqueza, leveza e escolhas',
      'EP #20 — Manifestação não é mágica: o erro na Lei da Atração',
      'EP #21 — Física Quântica: você cria sua realidade mais do que imagina...',
      'EP #22 — Decidir e sustentar: por que sua vida não muda mesmo quando você sabe o que fazer?',
      'EP #23 — Sua vida não trava. Ela reflete quem você sustenta ser.',
      'EP #24 — Você não ganha mais dinheiro porque não sustenta quem precisa ser...',
      'EP #25 — O erro que te impede de evoluir (mesmo querendo)...',
      'EP #26 — Sua vida não está travada você que está aceitando demais...',
      'EP #27 — Por que adultos precisam de terapia? (a verdade que ninguém te contou)...',
      'EP #28 — Mãe, foi isso que eu aprendi com você... (Especial Dia das Mães)...',
      'EP #29 — "Eu sou assim" Pode ser a maior mentira que você acredita...',
      'EP #30 — A infância que você teve, ainda está decidindo sua vida...',
      'EP #31 — A verdade difícil sobre pais que "fizeram o melhor que podiam"...',
      'EP #32 — Muita gente não é quem é. É quem aprendeu que deveria ser.',
      'EP #33 — Seu filho não precisa de perfeição. Precisa se sentir seguro.',
      'EP #34 — O que toda família precisa entender antes que seja tarde...',
      'EP #35 — Mulheres inspiradoras: Dayana Ribas',
      'EP #36 — Mulheres inspiradoras: Flávia Franco',
      'EP #37 — Mulheres inspiradoras: Aline Lana',
      'EP #38 — Mulheres inspiradoras: Rosi Lima',
      'EP #39 — Histórias que inspiram: Turismo 10 – Júnior e Bruna como tudo começou...',
      'EP #40 — Por que viajar pode ser a melhor decisão da sua vida?',
      'EP #41 — E se o café que você vende fosse, na verdade, apenas o começo da sua missão?',
      'EP #42 — Você Está Vivendo ou Apenas Sobrevivendo? | Propósito, Silêncio e Coragem',
      'EP #43 — Histórias que Inspiram: Daniella Freitas e Gran Romano',
      'EP #44 — A CORAGEM DE RECOMEÇAR | O que você está disposta a fazer para chegar lá?',
    ]

    for (let i = 0; i < listaEpisodios.length; i++) {
      try {
        const rec = app.findFirstRecordByData('agenda', 'titulo', listaEpisodios[i])
        app.delete(rec)
      } catch (_) {}
    }
  },
)
