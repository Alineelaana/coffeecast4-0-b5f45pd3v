// Migration 1753000100013 — Reparo do Template Mestre "Premium Dourado" (capas_templates)
//
// CAUSA RAIZ CORRIGIDA: o seed da migration 1753000100001 gravou as camadas do
// template_json SEM as coordenadas x/y/w/h (e sem "tamanho"). O motor gráfico
// (src/lib/estudioMotor.ts) multiplica essas coordenadas pela dimensão do canvas —
// com undefined vira NaN e o canvas silenciosamente NÃO desenha cabeçalho, título,
// fotos, placas, logomarcas e xícara (só fundo + rodapé, que são desenhados sem
// coordenadas). Resultado relatado pela usuária: prévia "eterna" com fundo dourado vazio.
//
// Esta migration é IDEMPOTENTE: preenche as coordenadas oficiais (idênticas ao
// templateMestrePremiumDourado() do motor) em qualquer camada de qualquer template
// que esteja sem elas. Rodar de novo não altera nada. Nenhuma identidade visual é
// alterada — as cores/fontes/bloqueios existentes são preservados.
migrate(
  (app) => {
    // Coordenadas oficiais por tipo — espelham templateMestrePremiumDourado() do motor.
    var COORDENADAS = {
      fundo: { x: 0, y: 0, w: 1, h: 1 },
      cabecalho: { x: 0.3, y: 0.02, w: 0.42, h: 0.16 },
      titulo: { x: 0.33, y: 0.2, w: 0.34, h: 0.5, tamanho: 1 },
      subtitulo: { x: 0.33, y: 0.72, w: 0.34, h: 0.08, tamanho: 0.42 },
      foto: { x: 0.02, y: 0.08, w: 0.3, h: 0.55 },
      placa_nome: { x: 0.02, y: 0.64, w: 0.3, h: 0.14 },
      logos: { x: 0.7, y: 0.2, w: 0.28, h: 0.4 },
      xicara: { x: 0.38, y: 0.72, w: 0.24, h: 0.2 },
      rodape: { x: 0, y: 0.9, w: 1, h: 0.1 },
    }

    var eNumero = function (v) {
      return typeof v === 'number' && isFinite(v)
    }

    var camadasAlteradas = 0
    var registrosAlterados = 0

    try {
      var registros = app.findRecordsByFilter('capas_templates', 'id != ""', '-id', 200, 0)
      registros.forEach(function (rec) {
        // No JSVM o campo JSON chega como STRING — normalizar antes de ler.
        var bruto = rec.get('template_json')
        if (!bruto) return
        var json = bruto
        if (typeof bruto === 'string') {
          try {
            json = JSON.parse(bruto)
          } catch (_) {
            return
          }
        }
        if (!json || typeof json !== 'object') return
        var camadas = json.camadas
        if (!Array.isArray(camadas) || !camadas.length) return

        var mudou = false
        camadas.forEach(function (c) {
          if (!c || typeof c !== 'object') return
          var padrao = COORDENADAS[c.tipo]
          if (!padrao) return
          if (eNumero(c.x) && eNumero(c.y) && eNumero(c.w) && eNumero(c.h)) return
          c.x = padrao.x
          c.y = padrao.y
          c.w = padrao.w
          c.h = padrao.h
          if (padrao.tamanho !== undefined && !eNumero(c.tamanho)) c.tamanho = padrao.tamanho
          mudou = true
          camadasAlteradas++
        })

        if (mudou) {
          rec.set('template_json', json)
          app.save(rec)
          registrosAlterados++
        }
      })
    } catch (e) {
      // Coleção pode não existir em cópias novas — nada a reparar.
      console.log('1753000100013: capas_templates indisponível — nada a reparar: ' + e)
    }

    console.log(
      '1753000100013: template_json reparado — camadas=' +
        camadasAlteradas +
        ' registros=' +
        registrosAlterados,
    )
  },
  (app) => {
    // Reversão: no-op — coordenadas preenchidas não devem ser removidas (eram inválidas).
  },
)
