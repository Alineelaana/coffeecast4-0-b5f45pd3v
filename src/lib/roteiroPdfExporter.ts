import { formatDateBR, getFileUrl } from '@/lib/formatters'
import type { RoteiroConvidadoRecord } from '@/types/database'
import officialLogoImg from '@/assets/coffeeCastOfficialLogo'

/**
 * Utilitário para geração de slug seguro no nome de arquivo
 */
export function buildRoteiroPdfFileName(nome: string): string {
  const safeGuestSlug =
    nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'convidado'

  return `roteiro-${safeGuestSlug}.pdf`
}

/**
 * Converte strings para HTML seguro contra injeção de script
 */
function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Formata texto com preservação de quebras de linha em HTML
 */
function formatMultilineHtml(text: string | null | undefined): string {
  if (!text) return '<span class="empty-val">Não informado</span>'
  const escaped = escapeHtml(text)
  return escaped.replace(/\n/g, '<br/>')
}

/**
 * Monta o documento HTML completo com CSS @page A4 e identidade visual CoffeeCast 4.0
 * (#4B1E3F vinho, #D4AF37 dourado, #FAF8F5 marfim, Playfair Display e fontes legíveis)
 */
export function buildRoteiroPdfHtml(roteiro: RoteiroConvidadoRecord): string {
  const dataEnvio = formatDateBR(roteiro.created)
  const statusLabel =
    roteiro.status === 'pendente'
      ? 'Pendente de Leitura'
      : roteiro.status === 'lida'
        ? 'Roteiro Lido / Em Produção'
        : 'Arquivado'

  const statusBadgeClass =
    roteiro.status === 'pendente'
      ? 'status-pendente'
      : roteiro.status === 'lida'
        ? 'status-lida'
        : 'status-arquivada'

  const fotoUrl = roteiro.foto ? getFileUrl(roteiro, roteiro.foto, '300x300') : ''
  const logomarcaUrl = roteiro.logomarca ? getFileUrl(roteiro, roteiro.logomarca, '300x300') : ''

  const safeTitle = `Roteiro - ${escapeHtml(roteiro.nome)}`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 16mm 14mm;
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
      font-size: 11pt;
      line-height: 1.5;
    }

    body {
      padding: 0;
    }

    /* BARRA DE AÇÕES NA VISUALIZAÇÃO DE TELA (oculta ao imprimir / salvar PDF) */
    .screen-actions-bar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #4B1E3F;
      color: #FAF8F5;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid #D4AF37;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: 'Plus Jakarta Sans', sans-serif;
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
      padding: 8px 18px;
      border-radius: 9999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: transform 0.15s ease, background 0.15s ease;
    }

    .screen-actions-bar .btn-print:hover {
      background: #E5C358;
      transform: scale(1.02);
    }

    .screen-actions-bar .btn-close {
      background: rgba(255,255,255,0.15);
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
        background: #ffffff !important;
      }
    }

    .document-wrapper {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px 24px 32px 24px;
    }

    @media print {
      .document-wrapper {
        max-width: 100%;
        margin: 0;
        padding: 0;
      }
    }

    /* CABEÇALHO OFICIAL COFFEECAST 4.0 */
    .header-card {
      background: linear-gradient(135deg, #4B1E3F 0%, #36142D 60%, #4B1E3F 100%);
      color: #FAF8F5;
      border-radius: 16px;
      padding: 22px 24px;
      border: 2px solid #D4AF37;
      position: relative;
      margin-bottom: 22px;
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
      height: 64px;
      width: auto;
      max-width: 140px;
      object-contain: contain;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.35));
    }

    .header-titles h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 20pt;
      margin: 0;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.01em;
      line-height: 1.15;
    }

    .header-titles .tagline {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      color: #D4AF37;
      font-size: 9.5pt;
      margin-top: 3px;
      font-weight: 500;
    }

    .header-titles .doc-type {
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: rgba(250, 248, 245, 0.75);
      margin-top: 4px;
      font-weight: 600;
    }

    .header-meta {
      text-align: right;
      font-size: 9pt;
      color: rgba(250, 248, 245, 0.85);
      line-height: 1.4;
      flex-shrink: 0;
      border-left: 1px solid rgba(212, 175, 55, 0.35);
      padding-left: 16px;
    }

    .header-meta strong {
      color: #FFFFFF;
    }

    .badge-status {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-pendente {
      background: #FEF3C7;
      color: #92400E;
      border: 1px solid #FCD34D;
    }

    .status-lida {
      background: #D1FAE5;
      color: #065F46;
      border: 1px solid #6EE7B7;
    }

    .status-arquivada {
      background: #E2E8F0;
      color: #334155;
      border: 1px solid #CBD5E1;
    }

    /* CARD DO CONVIDADO (FOTO + DADOS PRINCIPAIS) */
    .guest-summary-card {
      background: #FFFFFF;
      border: 1.5px solid rgba(75, 30, 63, 0.15);
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .guest-avatar {
      width: 74px;
      height: 74px;
      border-radius: 50%;
      object-fit: cover;
      border: 2.5px solid #D4AF37;
      flex-shrink: 0;
      background: #FAF8F5;
    }

    .guest-avatar-fallback {
      width: 74px;
      height: 74px;
      border-radius: 50%;
      background: #4B1E3F;
      color: #D4AF37;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Playfair Display', serif;
      font-size: 20pt;
      font-weight: 700;
      border: 2.5px solid #D4AF37;
      flex-shrink: 0;
    }

    .guest-summary-info {
      flex: 1;
      min-width: 0;
    }

    .guest-summary-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 16pt;
      font-weight: 700;
      color: #4B1E3F;
      margin: 0 0 4px 0;
      line-height: 1.2;
    }

    .guest-summary-details {
      font-size: 9.5pt;
      color: rgba(75, 30, 63, 0.8);
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
    }

    .guest-summary-details span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* SEÇÕES DE PERGUNTAS E RESPOSTAS */
    .section-block {
      background: #FFFFFF;
      border: 1px solid rgba(75, 30, 63, 0.12);
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 18px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .section-header {
      border-bottom: 1.5px solid rgba(212, 175, 55, 0.4);
      padding-bottom: 8px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 13pt;
      font-weight: 700;
      color: #4B1E3F;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-badge {
      font-size: 8pt;
      font-weight: 600;
      color: #4B1E3F;
      background: rgba(212, 175, 55, 0.18);
      border: 1px solid rgba(212, 175, 55, 0.4);
      padding: 2px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .qa-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 18px;
    }

    .qa-item {
      font-size: 10pt;
    }

    .qa-item.full-width {
      grid-column: 1 / -1;
    }

    .qa-label {
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #4B1E3F;
      margin-bottom: 3px;
    }

    .qa-value {
      color: #2C1820;
      background: #FAF8F5;
      border: 1px solid rgba(75, 30, 63, 0.08);
      border-radius: 8px;
      padding: 7px 11px;
      font-size: 9.5pt;
      line-height: 1.45;
      min-height: 32px;
      display: flex;
      align-items: center;
    }

    .qa-value.multiline {
      display: block;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.55;
    }

    .empty-val {
      color: rgba(75, 30, 63, 0.4);
      font-style: italic;
    }

    /* DESTAQUE DE TEMA SENSÍVEL */
    .sensitive-alert {
      background: #FEF2F2 !important;
      border: 1.5px solid #FCA5A5 !important;
      color: #991B1B !important;
      font-weight: 600;
    }

    .sensitive-ok {
      background: #ECFDF5 !important;
      border: 1px solid #A7F3D0 !important;
      color: #065F46 !important;
      font-weight: 500;
    }

    /* DESTAQUE DE TEMA DESEJADO */
    .desired-theme {
      background: #FFFBEB !important;
      border: 1px solid #FDE68A !important;
      color: #92400E !important;
      font-weight: 600;
    }

    /* MÍDIAS E ARQUIVOS */
    .media-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 8px;
    }

    .media-card {
      border: 1px solid rgba(75, 30, 63, 0.12);
      border-radius: 10px;
      padding: 12px;
      background: #FAF8F5;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .media-thumb {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 8px;
      border: 1.5px solid #D4AF37;
      background: #FFFFFF;
      flex-shrink: 0;
    }

    .media-info {
      font-size: 8.5pt;
      line-height: 1.35;
    }

    .media-info strong {
      color: #4B1E3F;
      display: block;
      font-size: 9pt;
      margin-bottom: 2px;
    }

    /* ROTEIRO FINAL ANEXADO */
    .final-script-box {
      background: #FAF8F5;
      border: 1px dashed rgba(212, 175, 55, 0.7);
      border-radius: 10px;
      padding: 12px 14px;
      margin-top: 10px;
      font-size: 9.5pt;
      line-height: 1.5;
    }

    /* RODAPÉ DO DOCUMENTO */
    .document-footer {
      border-top: 1.5px solid rgba(212, 175, 55, 0.4);
      padding-top: 12px;
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8pt;
      color: rgba(75, 30, 63, 0.65);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .document-footer .brand {
      font-weight: 700;
      color: #4B1E3F;
    }
  </style>
</head>
<body>
  <!-- BARRA DE AÇÕES NA VISUALIZAÇÃO INTERATIVA -->
  <div class="screen-actions-bar">
    <div class="info">
      <strong style="color:#D4AF37;">CoffeeCast 4.0</strong>
      <span>•</span>
      <span>Respostas do Roteiro: <strong>${escapeHtml(roteiro.nome)}</strong></span>
    </div>
    <div style="display:flex; align-items:center; gap:8px;">
      <button class="btn-print" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        <span>Salvar PDF / Imprimir</span>
      </button>
      <button class="btn-close" onclick="window.close()">Fechar Janela</button>
    </div>
  </div>

  <div class="document-wrapper">
    <!-- CABEÇALHO OFICIAL -->
    <header class="header-card">
      <div class="header-brand">
        <img src="${officialLogoImg}" alt="CoffeeCast 4.0" class="header-logo" />
        <div class="header-titles">
          <h1>CoffeeCast 4.0</h1>
          <div class="tagline">"Mais que conversas, histórias que transformam."</div>
          <div class="doc-type">Ficha de Respostas do Convidado para Roteiro</div>
        </div>
      </div>
      <div class="header-meta">
        <div><strong>Data de Envio:</strong> ${dataEnvio}</div>
        <div><strong>Código do Registro:</strong> ${escapeHtml(roteiro.id)}</div>
        <div>
          <span class="badge-status ${statusBadgeClass}">${statusLabel}</span>
        </div>
      </div>
    </header>

    <!-- RESUMO DO CONVIDADO COM AVATAR -->
    <div class="guest-summary-card">
      ${
        fotoUrl
          ? `<img src="${fotoUrl}" alt="${escapeHtml(roteiro.nome)}" class="guest-avatar" />`
          : `<div class="guest-avatar-fallback">${escapeHtml(roteiro.nome.slice(0, 2).toUpperCase())}</div>`
      }
      <div class="guest-summary-info">
        <h2 class="guest-summary-name">${escapeHtml(roteiro.nome)}</h2>
        <div class="guest-summary-details">
          <span><strong>Nascimento:</strong> ${escapeHtml(roteiro.data_nascimento) || 'Não informado'}</span>
          <span>•</span>
          <span><strong>Estado Civil:</strong> ${escapeHtml(roteiro.estado_civil) || 'Não informado'}</span>
          <span>•</span>
          <span><strong>Empresa:</strong> ${
            roteiro.tem_empresa && roteiro.nome_empresa
              ? escapeHtml(roteiro.nome_empresa)
              : 'Não possui'
          }</span>
        </div>
      </div>
    </div>

    <!-- SEÇÃO 1: DADOS PESSOAIS & FAMÍLIA -->
    <section class="section-block">
      <div class="section-header">
        <h3 class="section-title">1. Dados Pessoais & Família</h3>
        <span class="section-badge">Perguntas 1 a 5</span>
      </div>
      <div class="qa-grid">
        <div class="qa-item">
          <div class="qa-label">1. Nome Completo</div>
          <div class="qa-value">${escapeHtml(roteiro.nome)}</div>
        </div>
        <div class="qa-item">
          <div class="qa-label">2. Data de Nascimento</div>
          <div class="qa-value">${escapeHtml(roteiro.data_nascimento) || '<span class="empty-val">Não informado</span>'}</div>
        </div>
        <div class="qa-item">
          <div class="qa-label">3. Estado Civil</div>
          <div class="qa-value">${escapeHtml(roteiro.estado_civil) || '<span class="empty-val">Não informado</span>'}</div>
        </div>
        <div class="qa-item">
          <div class="qa-label">4. Cônjuge / Parceiro(a)</div>
          <div class="qa-value">
            ${
              roteiro.tem_conjuge
                ? `Sim — ${escapeHtml(roteiro.nome_conjuge) || 'Nome não especificado'}`
                : 'Não tem cônjuge / parceiro(a)'
            }
          </div>
        </div>
        <div class="qa-item full-width">
          <div class="qa-label">5. Filhos</div>
          <div class="qa-value">
            ${
              roteiro.tem_filhos
                ? `Sim • Quantidade: <strong>${escapeHtml(roteiro.quantidade_filhos) || 'Não informada'}</strong> • Nomes: <strong>${escapeHtml(roteiro.nomes_filhos) || 'Não informados'}</strong>`
                : 'Não tem filhos'
            }
          </div>
        </div>
      </div>
    </section>

    <!-- SEÇÃO 2: EMPRESA E EMPREENDIMENTO -->
    <section class="section-block">
      <div class="section-header">
        <h3 class="section-title">2. Empresa & Empreendimento</h3>
        <span class="section-badge">Pergunta 6</span>
      </div>
      <div class="qa-grid">
        <div class="qa-item ${roteiro.tem_empresa ? '' : 'full-width'}">
          <div class="qa-label">Possui empresa, negócio próprio ou marca?</div>
          <div class="qa-value">${roteiro.tem_empresa ? 'Sim, possui empresa/marca' : 'Não possui empresa/negócio próprio'}</div>
        </div>
        ${
          roteiro.tem_empresa
            ? `
        <div class="qa-item">
          <div class="qa-label">Nome da Empresa / Marca</div>
          <div class="qa-value"><strong>${escapeHtml(roteiro.nome_empresa) || '<span class="empty-val">Não informado</span>'}</strong></div>
        </div>
        <div class="qa-item full-width">
          <div class="qa-label">Sobre a Empresa (Propósito, Diferenciais & Serviços)</div>
          <div class="qa-value multiline">${formatMultilineHtml(roteiro.sobre_empresa)}</div>
        </div>`
            : ''
        }
      </div>
    </section>

    <!-- SEÇÃO 3: TEMAS DA ENTREVISTA & BIOGRAFIA -->
    <section class="section-block">
      <div class="section-header">
        <h3 class="section-title">3. Temas da Entrevista & Biografia</h3>
        <span class="section-badge">Perguntas 7 a 9</span>
      </div>
      <div class="qa-grid">
        <div class="qa-item full-width">
          <div class="qa-label">7. Tema mais desejado para enfatizar no episódio</div>
          <div class="qa-value multiline desired-theme">
            ${formatMultilineHtml(roteiro.tema_enfatizar) || 'Não especificado (conversa aberta à condução)'}
          </div>
        </div>

        <div class="qa-item full-width">
          <div class="qa-label">8. Temas sensíveis que prefere EVITAR na entrevista</div>
          ${
            roteiro.tem_tema_sensivel && roteiro.tema_sensivel_detalhes
              ? `<div class="qa-value multiline sensitive-alert">
                   ⚠️ <strong>ATENÇÃO PRODUÇÃO & APRESENTADORA:</strong><br/>
                   ${formatMultilineHtml(roteiro.tema_sensivel_detalhes)}
                 </div>`
              : `<div class="qa-value sensitive-ok">
                   ✓ Nenhum tema sensível declarado pelo convidado (conversa 100% livre).
                 </div>`
          }
        </div>

        <div class="qa-item full-width">
          <div class="qa-label">9. Biografia & Trajetória enviada pelo convidado</div>
          <div class="qa-value multiline">
            ${formatMultilineHtml(roteiro.biografia)}
          </div>
        </div>
      </div>
    </section>

    <!-- SEÇÃO 4: FOTOS, IDENTIDADE VISUAL & AUTORIZAÇÃO -->
    <section class="section-block">
      <div class="section-header">
        <h3 class="section-title">4. Fotos, Logomarca & Autorização de Imagem</h3>
        <span class="section-badge">Perguntas 10 a 12</span>
      </div>

      <div class="media-grid">
        <div class="media-card">
          ${
            fotoUrl
              ? `<img src="${fotoUrl}" alt="Foto oficial do convidado" class="media-thumb" />`
              : `<div class="media-thumb" style="display:flex;align-items:center;justify-content:center;color:#4B1E3F;font-size:10px;">Sem foto</div>`
          }
          <div class="media-info">
            <strong>10. Foto Oficial do Convidado</strong>
            ${
              fotoUrl
                ? `<span>Foto anexada em alta resolução para divulgação oficial.</span>`
                : `<span class="empty-val">Foto não fornecida</span>`
            }
          </div>
        </div>

        <div class="media-card">
          ${
            logomarcaUrl
              ? `<img src="${logomarcaUrl}" alt="Logomarca da empresa" class="media-thumb" style="object-fit:contain;" />`
              : `<div class="media-thumb" style="display:flex;align-items:center;justify-content:center;color:#4B1E3F;font-size:10px;">Sem logo</div>`
          }
          <div class="media-info">
            <strong>11. Logomarca da Empresa</strong>
            ${
              logomarcaUrl
                ? `<span>Logomarca anexada pelo convidado.</span>`
                : `<span class="empty-val">Sem logomarca enviada</span>`
            }
          </div>
        </div>
      </div>

      <div class="qa-item full-width" style="margin-top:14px;">
        <div class="qa-label">12. Autorização de Direito de Imagem e Voz</div>
        <div class="qa-value ${roteiro.autorizacao_imagem ? 'sensitive-ok' : 'sensitive-alert'}">
          ${
            roteiro.autorizacao_imagem
              ? '✓ <strong>AUTORIZADO:</strong> O convidado concordou expressamente com o uso da sua imagem, voz e nome nos canais oficiais do CoffeeCast 4.0.'
              : '⚠️ Autorização pendente ou não confirmada.'
          }
        </div>
      </div>
    </section>

    <!-- SEÇÃO 5: ROTEIRO FINAL (SE JÁ PREPARADO PELA PRODUÇÃO OU NINE) -->
    ${
      roteiro.roteiro_final_texto
        ? `
    <section class="section-block">
      <div class="section-header">
        <h3 class="section-title">5. Roteiro Final da Produção / Pauta da Entrevista</h3>
        <span class="section-badge">Produção</span>
      </div>
      <div class="qa-item full-width">
        <div class="qa-label">Roteiro Estruturado do Episódio</div>
        <div class="qa-value multiline final-script-box">
          ${formatMultilineHtml(roteiro.roteiro_final_texto)}
        </div>
      </div>
    </section>`
        : ''
    }

    <!-- RODAPÉ FORMAL DO DOCUMENTO -->
    <footer class="document-footer">
      <div>
        <span class="brand">CoffeeCast 4.0</span> • Sistema de Gestão Audiovisual & Podcasts
      </div>
      <div>
        Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </footer>
  </div>
</body>
</html>`
}

/**
 * Dispara o download/impressão em PDF através de uma janela dedicada limpa,
 * com CSS @page A4 portrait, acionando o diálogo nativo do navegador.
 */
export async function downloadRoteiroPdf(roteiro: RoteiroConvidadoRecord): Promise<void> {
  const fileName = buildRoteiroPdfFileName(roteiro.nome)
  const htmlContent = buildRoteiroPdfHtml(roteiro)

  const printWindow = window.open('', '_blank', 'width=900,height=1000,menubar=no,toolbar=no')
  if (!printWindow) {
    throw new Error('Abertura de nova janela bloqueada pelo navegador.')
  }

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Definir o título do documento para que o navegador use como sugestão de nome de arquivo PDF
  printWindow.document.title = fileName.replace(/\.pdf$/i, '')

  // Aguardar carregamento de fontes e estilos antes de disparar print
  await new Promise((resolve) => {
    let resolved = false
    const finish = () => {
      if (!resolved) {
        resolved = true
        resolve(true)
      }
    }

    printWindow.onload = () => {
      setTimeout(finish, 250)
    }

    // Fallback de tempo caso onload já tenha disparado
    setTimeout(finish, 800)
  })

  try {
    printWindow.focus()
    printWindow.print()
  } catch (err) {
    console.error('Falha ao abrir diálogo de impressão da janela do PDF:', err)
  }
}
