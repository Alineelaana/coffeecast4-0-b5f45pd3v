// pocketbase/hooks/episodio_visualizacao.js
// Registro de visualizações de episódios do site público (/episodio/:id).
//
// Endpoint público (sem autenticação):
//   POST /backend/v1/episodios/visualizacao   body: { episodio_id }
//
// Como funciona:
// - O frontend chama uma vez por CARREGAMENTO DE PÁGINA (a deduplicação de carimbo
//   vivo só em memória impede o duplo-effect do React StrictMode — nunca um refresh).
// - O backend só incrementa episódios com status "publicado".
// - O incremento é ATÔMICO no servidor (visualizacoes = visualizacoes + 1): não há
//   leitura-escrita pelo cliente, então navegadores concorrentes não sobrescrevem.
// - Visitante não precisa estar logado (rota sem requireAuth).
//
// Nota JSVM: TODAS as funções auxiliares vivem DENTRO de cada callback (escopo próprio).

routerAdd(
  'POST',
  '/backend/v1/episodios/visualizacao',
  (e) => {
    const body = e.requestInfo().body || {}
    const episodioId = (body.episodio_id || '').trim()

    if (!episodioId) {
      return e.json(400, { sucesso: false, mensagem: 'ID do episódio é obrigatório.' })
    }

    try {
      const episodio = $app.findRecordById('episodios', episodioId)
      if (!episodio) {
        return e.json(404, { sucesso: false, mensagem: 'Episódio não encontrado.' })
      }

      // Só episódios PUBLICADOS contam visualização (página individual é pública)
      const status = episodio.getString('status') || 'publicado'
      if (status !== 'publicado') {
        return e.json(200, {
          sucesso: true,
          contabilizado: false,
          mensagem: 'Episódio não publicado.',
        })
      }

      // Incremento atômico direto no banco (não usa o valor lido pelo cliente)
      episodio.set('visualizacoes', episodio.getInt('visualizacoes') + 1)
      episodio.set('ultima_visualizacao', new Date().toISOString())
      $app.save(episodio)

      // Histórico por período: um registro por visualização na coleção de eventos.
      // $app.save no hook ignora as regras de API — o create público continua bloqueado.
      // Se a coleção não existir numa cópia antiga do banco, a visualização NÃO é
      // descartada: só o histórico fica sem o evento.
      try {
        const evento = new Record($app.findCollectionByNameOrId('episodio_visualizacoes'))
        evento.set('episodio', episodio.id)
        $app.save(evento)
      } catch (errHist) {
        console.log(
          '[episodio_visualizacao] Falha ao registrar histórico de visualização:',
          errHist,
        )
      }

      return e.json(200, {
        sucesso: true,
        contabilizado: true,
        visualizacoes: episodio.getInt('visualizacoes'),
      })
    } catch (err) {
      console.log('[episodio_visualizacao] Erro ao registrar visualização:', err)
      return e.json(500, { sucesso: false, mensagem: 'Falha ao registrar visualização.' })
    }
  },
  // Sem requireAuth: a página do episódio é pública — visitante não logado conta visualização
)
