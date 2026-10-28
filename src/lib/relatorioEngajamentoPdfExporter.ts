/**
 * Exportador oficial em PDF dos Relatórios de Engajamento do CoffeeCast 4.0
 * Padrão visual idêntico aos PDFs do sistema:
 * - Paleta oficial Vinho (#4B1E3F), Dourado (#D4AF37), Marfim (#FAF8F5 / #F9F6F0)
 * - Tipografia Playfair Display (serifa premium) + Plus Jakarta Sans
 * - Logo oficial do CoffeeCast 4.0 no cabeçalho
 * - Período selecionado, data/hora da geração e usuário responsável
 * - Totais com variações percentuais em cards sofisticados
 * - Tabelas e gráficos estruturados com barras de progresso visual
 * - Estados vazios elegantes quando não houver dados no período
 */
import officialLogoImg from '@/assets/coffeeCastOfficialLogo'

export interface RelatorioTotais {
  contatos: number
  contatosVar: number
  depoimentos: number
  depoimentosVar: number
  roteiros: number
  roteirosVar: number
  acessos: number
  acessosVar: number
  episodios: number
  episodiosVar: number
}

export interface RelatorioGraficoItem {
  label: string
  sublabel?: string
  valor: number
  porcentagem?: number
  cor?: string
}

export interface RelatorioEpisodioItem {
  numero: number
  titulo: string
  dataPublicacao: string
  status?: string
}

export interface RelatorioPdfData {
  periodoRotulo: string
  dataInicioFormatada?: string
  dataFimFormatada?: string
  geradoPorNome: string
  geradoPorEmail: string
  totais: RelatorioTotais
  evolucaoContatos: RelatorioGraficoItem[]
  telasMaisAcessadas: RelatorioGraficoItem[]
  usuariosMaisAcessos: RelatorioGraficoItem[]
  distribuicaoRoteiros: RelatorioGraficoItem[]
  episodiosPublicados: RelatorioEpisodioItem[]
}

function escapeHtml(str: string | undefined | null): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatVariacaoHtml(varPct: number): string {
  if (isNaN(varPct) || !isFinite(varPct)) {
    return `<span style="color: #6B7280; font-size: 11px;">Sem base comparativa</span>`
  }
  if (varPct > 0) {
    return `<span style="color: #047857; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 3px;">
      ▲ +${varPct.toFixed(1)}% <span style="font-size: 10px; font-weight: normal; color: #4B1E3F/70;">vs anterior</span>
    </span>`
  }
  if (varPct < 0) {
    return `<span style="color: #BE123C; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 3px;">
      ▼ ${varPct.toFixed(1)}% <span style="font-size: 10px; font-weight: normal; color: #4B1E3F/70;">vs anterior</span>
    </span>`
  }
  return `<span style="color: #6B7280; font-weight: 600; font-size: 12px;">= Estável (0%)</span>`
}

export function buildRelatorioEngajamentoPdfHtml(data: RelatorioPdfData): string {
  const agora = new Date()
  const dataGeracao = agora.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const horaGeracao = agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const maxContatos = Math.max(1, ...data.evolucaoContatos.map((i) => i.valor))
  const maxTelas = Math.max(1, ...data.telasMaisAcessadas.map((i) => i.valor))
  const maxUsuarios = Math.max(1, ...data.usuariosMaisAcessos.map((i) => i.valor))
  const totalRoteirosStatus = data.distribuicaoRoteiros.reduce((acc, curr) => acc + curr.valor, 0)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório de Engajamento - CoffeeCast 4.0</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #FAF8F5;
      color: #2C1820;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.45;
    }

    /* BARRA DE AÇÕES NA TELA */
    .screen-actions-bar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #4B1E3F;
      color: #FAF8F5;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid #D4AF37;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }
    .screen-actions-bar .info {
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .screen-actions-bar .btn-print {
      background: #D4AF37;
      color: #4B1E3F;
      border: none;
      font-weight: 700;
      font-size: 13px;
      padding: 8px 22px;
      border-radius: 9999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(212,175,55,0.4);
      transition: transform 0.15s ease, background 0.15s ease;
    }
    .screen-actions-bar .btn-print:hover {
      background: #E5C358;
      transform: scale(1.02);
    }
    .screen-actions-bar .btn-close {
      background: rgba(255,255,255,0.12);
      color: #FAF8F5;
      border: 1px solid rgba(255,255,255,0.25);
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 9999px;
      cursor: pointer;
    }
    @media print {
      .screen-actions-bar {
        display: none !important;
      }
      body {
        background: #FFFFFF !important;
      }
      .document-container {
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      .page-break {
        page-break-before: always !important;
        break-before: page !important;
      }
    }

    .document-container {
      max-width: 820px;
      margin: 20px auto 40px auto;
      background: #FFFFFF;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(75, 30, 63, 0.15);
    }

    /* CABEÇALHO OFICIAL */
    .header {
      background: linear-gradient(135deg, #4B1E3F 0%, #35132C 100%);
      color: #FAF8F5;
      padding: 22px 28px;
      border-bottom: 3px solid #D4AF37;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-logo {
      height: 58px;
      width: auto;
      max-width: 130px;
      object-fit: contain;
    }
    .header-title-box h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 20pt;
      font-weight: 700;
      margin: 0;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }
    .header-title-box p {
      margin: 4px 0 0 0;
      font-size: 9pt;
      color: #D4AF37;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 600;
    }
    .header-meta {
      text-align: right;
      font-size: 8.5pt;
      color: rgba(250, 248, 245, 0.85);
      line-height: 1.4;
      border-left: 1px solid rgba(212, 175, 55, 0.3);
      padding-left: 16px;
    }
    .header-meta strong {
      color: #FAF8F5;
      display: block;
      font-size: 9.5pt;
    }
    .badge-periodo {
      display: inline-block;
      background: #D4AF37;
      color: #4B1E3F;
      font-size: 8pt;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 9999px;
      margin-top: 5px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* CONTEÚDO */
    .body-content {
      padding: 24px 28px;
    }

    /* GRID DE CARDS */
    .section-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 13pt;
      font-weight: 700;
      color: #4B1E3F;
      margin: 0 0 12px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(75, 30, 63, 0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-title span.tag {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 8pt;
      font-weight: 600;
      color: #7A5372;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin-bottom: 22px;
    }
    .card-kpi {
      background: #FAF8F5;
      border: 1px solid rgba(75, 30, 63, 0.12);
      border-radius: 8px;
      padding: 10px 12px;
      border-left: 3px solid #D4AF37;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-kpi .label {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #5F2650;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .card-kpi .valor {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 18pt;
      font-weight: 800;
      color: #4B1E3F;
      line-height: 1.1;
      margin-bottom: 6px;
    }
    .card-kpi .variacao {
      font-size: 8.5pt;
    }

    /* GRÁFICOS / TABELAS DE DUAS COLUNAS */
    .two-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-bottom: 20px;
    }

    .chart-box {
      background: #FFFFFF;
      border: 1px solid rgba(75, 30, 63, 0.12);
      border-radius: 8px;
      padding: 14px 16px;
    }
    .chart-box h3 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 11pt;
      font-weight: 700;
      color: #4B1E3F;
      margin: 0 0 4px 0;
    }
    .chart-box p.subtitle {
      font-size: 7.5pt;
      color: #7A5372;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .bar-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .bar-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5pt;
      color: #2C1820;
    }
    .bar-header .name {
      font-weight: 600;
      truncate: true;
      max-width: 75%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bar-header .val {
      font-weight: 700;
      color: #4B1E3F;
    }
    .bar-track {
      width: 100%;
      height: 7px;
      background: #FAF8F5;
      border-radius: 9999px;
      overflow: hidden;
      border: 1px solid rgba(75, 30, 63, 0.08);
    }
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #4B1E3F 0%, #D4AF37 100%);
      border-radius: 9999px;
    }

    /* TABELA DE EPISÓDIOS */
    .table-container {
      margin-top: 10px;
      border: 1px solid rgba(75, 30, 63, 0.12);
      border-radius: 8px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      text-align: left;
    }
    thead {
      background: #4B1E3F;
      color: #FAF8F5;
    }
    thead th {
      padding: 8px 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-size: 7.5pt;
    }
    tbody tr {
      border-bottom: 1px solid rgba(75, 30, 63, 0.08);
    }
    tbody tr:nth-child(even) {
      background: #FAF8F5;
    }
    tbody td {
      padding: 7px 12px;
      color: #2C1820;
    }
    .badge-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-status.publicado {
      background: #DEF7EC;
      color: #03543F;
    }
    .badge-status.programado {
      background: #FEF3C7;
      color: #92400E;
    }

    .empty-state {
      padding: 18px;
      text-align: center;
      color: #7A5372;
      font-style: italic;
      font-size: 8.5pt;
      background: #FAF8F5;
      border-radius: 6px;
      border: 1px dashed rgba(75, 30, 63, 0.2);
    }

    /* RODAPÉ DO DOCUMENTO */
    .footer {
      border-top: 1px solid rgba(75, 30, 63, 0.15);
      padding: 12px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #7A5372;
      background: #FAF8F5;
    }
  </style>
</head>
<body>
  <div class="screen-actions-bar">
    <div class="info">
      <span>📄 Visualização do <strong>Relatório Oficial de Engajamento</strong></span>
      <span style="opacity: 0.5;">|</span>
      <span>Período: <strong>${escapeHtml(data.periodoRotulo)}</strong></span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn-print" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        <span>Salvar PDF / Imprimir</span>
      </button>
      <button class="btn-close" onclick="window.close()">Fechar</button>
    </div>
  </div>

  <div class="document-container">
    <!-- CABEÇALHO -->
    <header class="header">
      <div class="header-brand">
        <img src="${officialLogoImg}" alt="CoffeeCast 4.0" class="header-logo" />
        <div class="header-title-box">
          <h1>Relatório de Engajamento</h1>
          <p>Métricas Oficiais de Audiência &amp; Atividades</p>
        </div>
      </div>
      <div class="header-meta">
        <strong>CoffeeCast 4.0</strong>
        <span>Gerado em ${dataGeracao} às ${horaGeracao}</span><br />
        <span>Responsável: ${escapeHtml(data.geradoPorNome || 'Administração')}</span><br />
        <span class="badge-periodo">${escapeHtml(data.periodoRotulo)}</span>
      </div>
    </header>

    <div class="body-content">
      <!-- 1. RESUMO GERAL COM VARIAÇÕES -->
      <div class="section-title">
        <span>1. Indicadores Principais (KPIs)</span>
        <span class="tag">Comparativo com Período Anterior</span>
      </div>

      <div class="cards-grid">
        <div class="card-kpi">
          <div class="label">Contatos &amp; Leads</div>
          <div class="valor">${data.totais.contatos}</div>
          <div class="variacao">${formatVariacaoHtml(data.totais.contatosVar)}</div>
        </div>

        <div class="card-kpi">
          <div class="label">Depoimentos</div>
          <div class="valor">${data.totais.depoimentos}</div>
          <div class="variacao">${formatVariacaoHtml(data.totais.depoimentosVar)}</div>
        </div>

        <div class="card-kpi">
          <div class="label">Roteiros Respondidos</div>
          <div class="valor">${data.totais.roteiros}</div>
          <div class="variacao">${formatVariacaoHtml(data.totais.roteirosVar)}</div>
        </div>

        <div class="card-kpi">
          <div class="label">Acessos ao Painel</div>
          <div class="valor">${data.totais.acessos}</div>
          <div class="variacao">${formatVariacaoHtml(data.totais.acessosVar)}</div>
        </div>

        <div class="card-kpi">
          <div class="label">Episódios no Período</div>
          <div class="valor">${data.totais.episodios}</div>
          <div class="variacao">${formatVariacaoHtml(data.totais.episodiosVar)}</div>
        </div>
      </div>

      <!-- 2. DUAS COLUNAS: CONTATOS & TELAS MAIS ACESSADAS -->
      <div class="two-cols">
        <!-- Evolução de Contatos -->
        <div class="chart-box">
          <h3>Evolução de Contatos &amp; Leads</h3>
          <p class="subtitle">Distribuição temporal no período</p>
          ${
            data.evolucaoContatos.length === 0
              ? `<div class="empty-state">Nenhum contato recebido neste período.</div>`
              : `<div class="bar-list">
                  ${data.evolucaoContatos
                    .map((item) => {
                      const pct = Math.round((item.valor / maxContatos) * 100)
                      return `
                        <div class="bar-item">
                          <div class="bar-header">
                            <span class="name">${escapeHtml(item.label)}</span>
                            <span class="val">${item.valor} lead(s)</span>
                          </div>
                          <div class="bar-track">
                            <div class="bar-fill" style="width: ${Math.max(4, pct)}%;"></div>
                          </div>
                        </div>
                      `
                    })
                    .join('')}
                </div>`
          }
        </div>

        <!-- Ranking Telas Mais Acessadas -->
        <div class="chart-box">
          <h3>Telas Mais Acessadas do Painel</h3>
          <p class="subtitle">Com base nos registros de Auditoria</p>
          ${
            data.telasMaisAcessadas.length === 0
              ? `<div class="empty-state">Nenhum registro de acesso nesta janela de tempo.</div>`
              : `<div class="bar-list">
                  ${data.telasMaisAcessadas
                    .slice(0, 6)
                    .map((item) => {
                      const pct = Math.round((item.valor / maxTelas) * 100)
                      return `
                        <div class="bar-item">
                          <div class="bar-header">
                            <span class="name">${escapeHtml(item.label)}</span>
                            <span class="val">${item.valor} ação(ões)</span>
                          </div>
                          <div class="bar-track">
                            <div class="bar-fill" style="width: ${Math.max(4, pct)}%; background: #4B1E3F;"></div>
                          </div>
                        </div>
                      `
                    })
                    .join('')}
                </div>`
          }
        </div>
      </div>

      <!-- 3. DUAS COLUNAS: USUÁRIOS MAIS ATIVOS & STATUS DOS ROTEIROS -->
      <div class="two-cols">
        <!-- Ranking de Usuários -->
        <div class="chart-box">
          <h3>Usuários com Mais Acessos no Painel</h3>
          <p class="subtitle">Logins e operações ativas no período</p>
          ${
            data.usuariosMaisAcessos.length === 0
              ? `<div class="empty-state">Nenhum login registrado neste período.</div>`
              : `<div class="bar-list">
                  ${data.usuariosMaisAcessos
                    .slice(0, 6)
                    .map((item) => {
                      const pct = Math.round((item.valor / maxUsuarios) * 100)
                      return `
                        <div class="bar-item">
                          <div class="bar-header">
                            <span class="name" title="${escapeHtml(item.sublabel)}">${escapeHtml(item.label)}</span>
                            <span class="val">${item.valor} login(s)</span>
                          </div>
                          <div class="bar-track">
                            <div class="bar-fill" style="width: ${Math.max(4, pct)}%; background: linear-gradient(90deg, #D4AF37 0%, #B8860B 100%);"></div>
                          </div>
                        </div>
                      `
                    })
                    .join('')}
                </div>`
          }
        </div>

        <!-- Status dos Roteiros -->
        <div class="chart-box">
          <h3>Distribuição de Roteiros por Status</h3>
          <p class="subtitle">Rascunho, Em Revisão e Aprovados</p>
          ${
            data.distribuicaoRoteiros.length === 0 || totalRoteirosStatus === 0
              ? `<div class="empty-state">Nenhum roteiro cadastrado neste período.</div>`
              : `<div class="bar-list">
                  ${data.distribuicaoRoteiros
                    .map((item) => {
                      const pct =
                        totalRoteirosStatus > 0
                          ? Math.round((item.valor / totalRoteirosStatus) * 100)
                          : 0
                      const barColor = item.cor || '#4B1E3F'
                      return `
                        <div class="bar-item">
                          <div class="bar-header">
                            <span class="name" style="display: flex; align-items: center; gap: 6px;">
                              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${barColor}; display: inline-block;"></span>
                              ${escapeHtml(item.label)}
                            </span>
                            <span class="val">${item.valor} (${pct}%)</span>
                          </div>
                          <div class="bar-track">
                            <div class="bar-fill" style="width: ${Math.max(4, pct)}%; background: ${barColor};"></div>
                          </div>
                        </div>
                      `
                    })
                    .join('')}
                </div>`
          }
        </div>
      </div>

      <!-- 4. TABELA DE EPISÓDIOS NO PERÍODO -->
      <div class="section-title" style="margin-top: 10px;">
        <span>2. Episódios Lançados / Programados no Período</span>
        <span class="tag">${data.episodiosPublicados.length} registro(s)</span>
      </div>

      ${
        data.episodiosPublicados.length === 0
          ? `<div class="empty-state">Nenhum episódio publicado ou programado neste período.</div>`
          : `<div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th style="width: 70px;">EP #</th>
                    <th>Título do Episódio</th>
                    <th style="width: 140px;">Data de Lançamento</th>
                    <th style="width: 110px;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.episodiosPublicados
                    .map((ep) => {
                      const statusClass = ep.status === 'programado' ? 'programado' : 'publicado'
                      const statusLabel = ep.status === 'programado' ? 'Programado' : 'Publicado'
                      return `
                        <tr>
                          <td style="font-weight: 700; color: #4B1E3F;">EP#${ep.numero}</td>
                          <td style="font-weight: 600;">${escapeHtml(ep.titulo)}</td>
                          <td>${escapeHtml(ep.dataPublicacao)}</td>
                          <td>
                            <span class="badge-status ${statusClass}">${statusLabel}</span>
                          </td>
                        </tr>
                      `
                    })
                    .join('')}
                </tbody>
              </table>
            </div>`
      }
    </div>

    <!-- RODAPÉ -->
    <footer class="footer">
      <span>CoffeeCast 4.0 — Histórias que Transformam • Relatório Confidencial de Engajamento</span>
      <span>Página 1 / 1</span>
    </footer>
  </div>
</body>
</html>`
}

export async function downloadRelatorioEngajamentoPdf(data: RelatorioPdfData): Promise<void> {
  const safePeriodo = data.periodoRotulo.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const fileName = `relatorio-engajamento-coffeecast-${safePeriodo}.pdf`
  const htmlContent = buildRelatorioEngajamentoPdfHtml(data)

  const printWindow = window.open('', '_blank', 'width=980,height=1000,menubar=no,toolbar=no')
  if (!printWindow) {
    throw new Error('Abertura de nova janela bloqueada pelo navegador. Permita pop-ups.')
  }

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  printWindow.document.title = fileName.replace(/\.pdf$/i, '')

  await new Promise((resolve) => {
    let resolved = false
    const finish = () => {
      if (!resolved) {
        resolved = true
        resolve(true)
      }
    }
    printWindow.onload = () => setTimeout(finish, 250)
    setTimeout(finish, 850)
  })

  try {
    printWindow.focus()
    printWindow.print()
  } catch (err) {
    console.error('Falha ao abrir diálogo de impressão da janela do PDF:', err)
  }
}
