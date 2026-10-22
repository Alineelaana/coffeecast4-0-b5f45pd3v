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
 * Utilitário para geração de nome de arquivo PDF de roteiro oficial do episódio
 * (individual ou conjunto gerado pela Nine)
 */
export function buildRoteiroOficialPdfFileName(tituloOuNomes: string): string {
  const safeSlug =
    tituloOuNomes
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'episodio'

  return `roteiro-oficial-${safeSlug}.pdf`
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
import { parseRoteiroTextToStructure } from '@/lib/roteiroParser'
import type { RoteiroEstruturado } from '@/types/database'

export interface BuildRoteiroOficialPdfOptions {
  titulo: string
  subtitulo?: string
  convidadosNomes: string[]
  roteiroTexto: string
  ehConjunto?: boolean
  semConvidados?: boolean
  roteiroEstruturado?: RoteiroEstruturado | null
  empresaCargo?: string
  dataGravacao?: string
  horarioGravacao?: string
  enderecoEstudio?: string
  linkGps?: string
  avisoEstacionamento?: string
  convidadosDetalhados?: Array<{
    nome: string
    empresa?: string
    fotoUrl?: string
    logomarcaUrl?: string
    temaEnfatizar?: string
  }>
}

/**
 * Constrói o HTML fiel ao PDF modelo de referência Grasiele e Márcio (ORVEX):
 * - Página 1: Capa oficial completa (Logo central com fundo bordô, fotos originais em cards verticais com borda dourada,
 *   logomarca da empresa, Título principal com serifa bordô, Subtítulo, Nomes dos convidados, Linha de Gravação com dia/hora,
 *   Box de endereço do estúdio com aviso de estacionamento próprio e link clicável para rota GPS).
 * - Páginas seguintes: Diagramação profissional de revista editorial com cabeçalho (CoffeeCast 4.0, Nomes | Empresa e
 *   "HISTÓRIAS QUE INSPIRAM • ROTEIRO DE GRAVAÇÃO N"), blocos com títulos em negrito bordô e DURAÇÃO destacada em dourado,
 *   perguntas numeradas (01., 02., ...), perguntas opcionais "Se houver espaço:", bate-bola e encerramento com legado.
 */
export function buildRoteiroOficialPdfHtml(options: BuildRoteiroOficialPdfOptions): string {
  // Estrutura do roteiro vinda do editor estruturado ou derivada pelo parser
  const estruturado: RoteiroEstruturado =
    options.roteiroEstruturado ||
    parseRoteiroTextToStructure(options.roteiroTexto, {
      tituloFallback: options.titulo,
      subtituloFallback: options.subtitulo,
      convidadosRotulo: options.convidadosNomes.join(' & '),
      empresaCargo: options.empresaCargo,
      dataGravacao: options.dataGravacao,
      horarioGravacao: options.horarioGravacao,
      endereco: options.enderecoEstudio,
      linkGps: options.linkGps,
    })

  const safeTitulo = escapeHtml(estruturado.tituloEpisodio || options.titulo)
  const safeSubtitulo = escapeHtml(
    estruturado.subtituloEpisodio || options.subtitulo || 'O poder de transformar pessoas',
  )

  const convidadosNomesArr =
    options.convidadosNomes && options.convidadosNomes.length > 0
      ? options.convidadosNomes
      : ['Episódio Especial']

  const safeConvidadosLinha = escapeHtml(
    options.semConvidados ? 'Aline Lana & Apresentadoras' : convidadosNomesArr.join(' & '),
  )

  const empresaCargo =
    options.empresaCargo ||
    estruturado.empresaCargoRotulo ||
    (options.convidadosDetalhados &&
      options.convidadosDetalhados.map((c) => c.empresa).filter(Boolean)[0]) ||
    ''

  const safeEmpresaCargo = escapeHtml(empresaCargo)

  // Metadados de gravação (data e hora nunca fixas)
  const dataGravacao = options.dataGravacao || estruturado.dataGravacaoFormatada || ''
  const horarioGravacao = options.horarioGravacao || estruturado.horarioGravacao || ''

  let linhaGravacao = ''
  if (dataGravacao && horarioGravacao) {
    linhaGravacao = `GRAVAÇÃO • ${dataGravacao.toUpperCase()} • ${horarioGravacao.toUpperCase()}`
  } else if (dataGravacao) {
    linhaGravacao = `GRAVAÇÃO • ${dataGravacao.toUpperCase()}`
  } else if (horarioGravacao) {
    linhaGravacao = `GRAVAÇÃO • ${horarioGravacao.toUpperCase()}`
  } else {
    linhaGravacao = `GRAVAÇÃO • A DEFINIR PELA PRODUÇÃO`
  }

  const enderecoEstudio =
    options.enderecoEstudio ||
    estruturado.enderecoEstudio ||
    'Estúdio Filme | R. Ulisses Sarmento, 24, salas 407 e 408\nPraia do Suá, Vitória - ES | CEP 29052-320'

  const linkGps =
    options.linkGps ||
    estruturado.linkGps ||
    'https://www.google.com/maps/dir/?api=1&destination=R.+Ulisses+Sarmento,+24,+Praia+do+Su%C3%A1,+Vit%C3%B3ria,+ES'

  const avisoEstacionamento =
    options.avisoEstacionamento ||
    estruturado.avisoEstacionamento ||
    'ESTACIONAMENTO PRÓPRIO DISPONÍVEL AOS CONVIDADOS'

  // Convidados com fotos para a capa
  const convidadosComFoto = options.convidadosDetalhados || []
  const fotosExistentes = convidadosComFoto.filter((c) => Boolean(c.fotoUrl))
  const logosExistentes = convidadosComFoto.filter((c) => Boolean(c.logomarcaUrl))

  // Renderizar o topo/header das páginas de conteúdo
  const subCabecalhoDireita = safeEmpresaCargo
    ? `${safeConvidadosLinha.toUpperCase()} | ${safeEmpresaCargo.toUpperCase()}`
    : safeConvidadosLinha.toUpperCase()

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Roteiro Oficial - ${safeTitulo}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
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
      background: #F9F6F0;
      color: #2C1820;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.6;
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
      padding: 8px 20px;
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
        background: #F9F6F0 !important;
      }
    }

    /* CONTAINER GERAL DO DOCUMENTO */
    .document-container {
      max-width: 820px;
      margin: 20px auto 40px auto;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      background: #F9F6F0;
    }
    @media print {
      .document-container {
        max-width: 100% !important;
        margin: 0 !important;
        box-shadow: none !important;
      }
    }

    /* PÁGINAS A4 INDIVIDUAIS */
    .pdf-page {
      width: 100%;
      position: relative;
      background: #F9F6F0;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }

    /* A Capa é a única que tem altura exata de página inteira e quebra logo após ela */
    .pdf-cover-page {
      box-sizing: border-box;
      height: 296mm;
      max-height: 296mm;
      overflow: hidden;
      page-break-before: auto !important;
      break-before: auto !important;
      page-break-after: always !important;
      break-after: page !important;
    }

    /* Conteúdo contínuo com quebras automáticas apenas entre blocos */
    .pdf-content-page {
      display: block !important;
      min-height: auto !important;
      height: auto !important;
      page-break-before: auto !important;
      break-before: auto !important;
      page-break-after: auto !important;
      break-after: auto !important;
    }

    @media print {
      .pdf-cover-page {
        height: 296mm !important;
        max-height: 296mm !important;
        overflow: hidden !important;
        page-break-before: auto !important;
        break-before: auto !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .pdf-content-page {
        display: block !important;
        min-height: auto !important;
        height: auto !important;
        page-break-before: auto !important;
        break-before: auto !important;
        page-break-after: auto !important;
        break-after: auto !important;
      }
    }

    /* ======================================================== */
    /* PÁGINA 1: CAPA OFICIAL (MODELO GRAZI E MÁRCIO / ORVEX)    */
    /* ======================================================== */
    .cover-header-stripe {
      background: #4B1E3F;
      color: #FAF8F5;
      padding: 24px 36px 20px 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #D4AF37;
    }
    .cover-header-brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .cover-header-logo {
      height: 60px;
      width: auto;
      max-width: 140px;
      object-fit: contain;
    }
    .cover-header-text {
      text-align: right;
    }
    .cover-header-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 20pt;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0;
      line-height: 1.1;
    }
    .cover-header-subtitle {
      font-size: 8.5pt;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(250, 248, 245, 0.85);
      margin-top: 4px;
      font-weight: 600;
    }

    .cover-body {
      padding: 28px 40px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* GRID DE FOTOS E LOGO NA CAPA */
    .cover-photos-grid {
      display: flex;
      gap: 16px;
      justify-content: center;
      align-items: stretch;
      margin-bottom: 24px;
      max-height: 250px;
    }
    .cover-photo-card {
      flex: 1;
      max-width: 220px;
      height: 240px;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid rgba(75, 30, 63, 0.2);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .cover-photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
      display: block;
    }
    .cover-logo-card {
      background: #111111;
      color: #FAF8F5;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .cover-logo-img {
      max-width: 160px;
      max-height: 80px;
      object-fit: contain;
      filter: brightness(1.05);
      margin-bottom: 8px;
    }
    .cover-logo-caption {
      font-size: 7pt;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #D4AF37;
      margin-top: 6px;
      font-weight: 600;
    }

    /* BLOCO CENTRAL: TÍTULOS E NOMES */
    .cover-titles-block {
      text-align: center;
      margin: 10px 0 24px 0;
    }
    .cover-main-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 26pt;
      font-weight: 700;
      color: #4B1E3F;
      margin: 0 0 6px 0;
      line-height: 1.15;
    }
    .cover-main-subtitle {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 15pt;
      font-style: italic;
      color: #2C1820;
      margin: 0 0 18px 0;
      opacity: 0.9;
    }
    .cover-divider-gold {
      width: 80px;
      height: 2px;
      background: #D4AF37;
      margin: 0 auto 18px auto;
    }
    .cover-guests-names {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #2C1820;
      margin: 0 0 4px 0;
    }
    .cover-guests-company {
      font-size: 9.5pt;
      color: rgba(75, 30, 63, 0.85);
      font-weight: 500;
    }

    /* CARD DE GRAVAÇÃO E ESTÚDIO NO RODAPÉ DA CAPA */
    .cover-location-card {
      background: #EFE9E0;
      border: 1px solid rgba(75, 30, 63, 0.15);
      border-radius: 12px;
      padding: 16px 22px;
      margin-top: auto;
    }
    .cover-recording-line {
      font-size: 10.5pt;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #2C1820;
      margin-bottom: 8px;
    }
    .cover-location-address {
      font-size: 9pt;
      color: #3D2230;
      line-height: 1.45;
      margin-bottom: 8px;
      white-space: pre-line;
    }
    .cover-parking-tag {
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #065F46;
      margin-bottom: 8px;
    }
    .cover-gps-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 9pt;
      font-weight: 700;
      color: #4B1E3F;
      text-decoration: underline;
      text-decoration-color: #D4AF37;
      text-underline-offset: 3px;
    }

    /* ======================================================== */
    /* PÁGINAS INTERNAS (PÁGINA 2 EM DIANTE)                     */
    /* ======================================================== */
    /* Cabeçalho editorial unificado no topo do fluxo de conteúdo */
    .inner-editorial-header-wrapper {
      page-break-before: auto !important;
      break-before: auto !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .inner-editorial-header {
      background: #4B1E3F;
      color: #FAF8F5;
      padding: 12px 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      font-size: 8.5pt;
      border-bottom: 2.5px solid #D4AF37;
    }
    .inner-header-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .inner-header-brand img {
      height: 30px;
      width: auto;
      object-fit: contain;
    }
    .inner-header-brand-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 11.5pt;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }
    .inner-header-guest {
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #D4AF37;
      text-align: right;
    }

    .inner-editorial-subbar {
      padding: 8px 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #4B1E3F;
      border-bottom: 1.5px solid rgba(212, 175, 55, 0.4);
      background: #FAF8F5;
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    .inner-page-content {
      padding: 24px 36px 36px 36px;
      display: block;
    }

    /* FORMATAÇÃO DOS BLOCOS EDITORIAIS */
    .script-block {
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px dashed rgba(75, 30, 63, 0.15);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .script-block:last-of-type {
      border-bottom: none;
      padding-bottom: 0;
      margin-bottom: 16px;
    }

    .script-block-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 2px solid rgba(75, 30, 63, 0.2);
    }
    .script-block-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .script-block-tag {
      background: #4B1E3F;
      color: #D4AF37;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 3px 9px;
      border-radius: 6px;
      border: 1px solid #D4AF37;
    }
    .script-block-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 14.5pt;
      font-weight: 800;
      color: #4B1E3F;
      margin: 0;
      line-height: 1.25;
      letter-spacing: -0.01em;
    }

    /* Pílula / Badge de Duração destacada */
    .script-block-duration-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #4B1E3F;
      background: #FEF3C7;
      border: 1.5px solid #D4AF37;
      padding: 4px 12px;
      border-radius: 9999px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .script-intro-text {
      font-size: 10.5pt;
      line-height: 1.7;
      color: #1A0D15;
      margin-bottom: 14px;
      white-space: pre-wrap;
    }
    .script-intro-text p {
      margin: 0 0 12px 0;
    }
    .script-intro-quote {
      background: #FAF8F5;
      border-left: 3.5px solid #D4AF37;
      padding: 12px 16px;
      margin: 10px 0 14px 0;
      border-radius: 0 8px 8px 0;
      font-size: 10.5pt;
      line-height: 1.65;
      color: #2C1820;
      box-shadow: 0 1px 4px rgba(75,30,63,0.04);
    }

    /* PERGUNTAS NUMERADAS COM ALTO CONTRASTE */
    .question-item {
      margin-bottom: 14px;
      font-size: 10.5pt;
      line-height: 1.65;
      color: #1A0D15;
      page-break-inside: avoid;
      break-inside: avoid;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #FFFFFF;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid rgba(75, 30, 63, 0.1);
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .question-number-badge {
      font-size: 9pt;
      font-weight: 800;
      color: #4B1E3F;
      background: #FEF3C7;
      border: 1.5px solid #D4AF37;
      padding: 2px 8px;
      border-radius: 6px;
      flex-shrink: 0;
      line-height: 1.3;
      margin-top: 1px;
    }
    .question-content {
      flex: 1;
    }
    .question-target {
      font-weight: 800;
      color: #4B1E3F;
      text-transform: uppercase;
      font-size: 8.5pt;
      letter-spacing: 0.05em;
      display: inline-block;
      margin-right: 6px;
      background: rgba(75, 30, 63, 0.08);
      padding: 1px 7px;
      border-radius: 4px;
    }
    .question-text-strong {
      color: #1A0D15;
      font-weight: 500;
    }

    .question-optional-box {
      background: #FFFDF5;
      border-left: 3.5px solid #D4AF37;
      padding: 10px 14px;
      margin: 10px 0;
      border-radius: 0 8px 8px 0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .question-optional-tag {
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #92400E;
      background: #FEF3C7;
      border: 1px solid #FCD34D;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
      display: inline-block;
      margin-bottom: 6px;
    }

    /* BATE-BOLA */
    .bate-bola-list {
      list-style: none;
      padding: 0;
      margin: 10px 0 16px 0;
    }
    .bate-bola-list li {
      position: relative;
      padding-left: 22px;
      margin-bottom: 8px;
      font-size: 10.5pt;
      line-height: 1.6;
      color: #1A0D15;
    }
    .bate-bola-list li::before {
      content: '◆';
      position: absolute;
      left: 4px;
      color: #D4AF37;
      font-size: 9pt;
      line-height: 1.6;
    }

    /* BOX DESTACADO DE PERGUNTA DE ASSINATURA / ENCERRAMENTO */
    .signature-question-box {
      background: linear-gradient(135deg, #4B1E3F 0%, #36142D 100%);
      color: #FAF8F5;
      border: 2px solid #D4AF37;
      border-radius: 10px;
      padding: 14px 18px;
      margin: 14px 0;
      box-shadow: 0 3px 10px rgba(75, 30, 63, 0.15);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .signature-question-label {
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #D4AF37;
      margin-bottom: 4px;
    }
    .signature-question-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 13.5pt;
      font-weight: 700;
      color: #FFFFFF;
      font-style: italic;
      line-height: 1.35;
      margin: 0;
    }

    .encerramento-box {
      background: #FAF8F5;
      border: 1.5px solid rgba(212, 175, 55, 0.6);
      border-radius: 10px;
      padding: 14px 18px;
      margin: 12px 0;
      font-size: 10.5pt;
      line-height: 1.65;
      color: #1A0D15;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* RESUMO FINAL DE TEMPO */
    .script-time-summary {
      margin-top: 26px;
      padding: 14px 20px;
      background: #FFFFFF;
      border: 1.5px solid #D4AF37;
      border-radius: 10px;
      font-size: 9.5pt;
      font-weight: 700;
      color: #4B1E3F;
      text-align: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* RODAPÉ DO DOCUMENTO */
    .inner-page-footer {
      border-top: 1.5px solid rgba(212, 175, 55, 0.5);
      padding: 12px 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8pt;
      color: #4B1E3F;
      background: #FAF8F5;
      margin-top: 20px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .inner-page-footer strong {
      color: #4B1E3F;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <!-- BARRA DE AÇÕES FIXA EM TELA -->
  <div class="screen-actions-bar">
    <div class="info">
      <strong style="color:#D4AF37;">CoffeeCast 4.0</strong>
      <span>•</span>
      <span>Roteiro Oficial de Gravação — <strong>${safeConvidadosLinha}</strong></span>
    </div>
    <div style="display:flex; align-items:center; gap:10px;">
      <button class="btn-print" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        <span>GERAR PDF DO ROTEIRO</span>
      </button>
      <button class="btn-close" onclick="window.close()">Fechar</button>
    </div>
  </div>

  <div class="document-container">
    <!-- ========================================== -->
    <!-- PÁGINA 1: CAPA OFICIAL (PADRÃO GRAZI & MÁRCIO) -->
    <!-- ========================================== -->
    <div class="pdf-page pdf-cover-page">
      <div class="cover-header-stripe">
        <div class="cover-header-brand">
          <img src="${officialLogoImg}" alt="CoffeeCast 4.0" class="cover-header-logo" />
        </div>
        <div class="cover-header-text">
          <h1 class="cover-header-title">CoffeeCast 4.0</h1>
          <div class="cover-header-subtitle">HISTÓRIAS QUE INSPIRAM • EPISÓDIO ESPECIAL</div>
        </div>
      </div>

      <div class="cover-body">
        <!-- FOTOS DOS CONVIDADOS OU DESTAQUE VISUAL -->
        <div class="cover-photos-grid">
          ${
            fotosExistentes.length > 0
              ? fotosExistentes
                  .map(
                    (c) => `
              <div class="cover-photo-card">
                <img src="${c.fotoUrl}" alt="${escapeHtml(c.nome)}" class="cover-photo-img" />
              </div>
            `,
                  )
                  .join('')
              : `
              <div class="cover-photo-card" style="background:#4B1E3F; color:#FAF8F5; padding:20px; text-align:center;">
                <div style="font-family:'Playfair Display', serif; font-size:18pt; color:#D4AF37; margin-bottom:6px;">CoffeeCast 4.0</div>
                <div style="font-size:9pt; opacity:0.85;">Mais que conversas, histórias que transformam.</div>
              </div>
            `
          }

          ${
            logosExistentes.length > 0
              ? `
            <div class="cover-photo-card cover-logo-card">
              <img src="${logosExistentes[0].logomarcaUrl}" alt="Logomarca" class="cover-logo-img" />
              ${safeEmpresaCargo ? `<div class="cover-logo-caption">${safeEmpresaCargo}</div>` : ''}
            </div>
          `
              : safeEmpresaCargo
                ? `
            <div class="cover-photo-card cover-logo-card">
              <div style="font-family:'Playfair Display', serif; font-size:16pt; color:#FFFFFF; margin-bottom:4px;">
                ${safeEmpresaCargo.split('|')[0] || safeEmpresaCargo}
              </div>
              <div class="cover-logo-caption">${safeEmpresaCargo}</div>
            </div>
          `
                : ''
          }
        </div>

        <!-- TÍTULOS E NOMES -->
        <div class="cover-titles-block">
          <h2 class="cover-main-title">${safeTitulo}</h2>
          <div class="cover-main-subtitle">${safeSubtitulo}</div>
          <div class="cover-divider-gold"></div>

          <div class="cover-guests-names">${safeConvidadosLinha}</div>
          ${safeEmpresaCargo ? `<div class="cover-guests-company">${safeEmpresaCargo}</div>` : ''}
        </div>

        <!-- BOX DE GRAVAÇÃO E ESTÚDIO COM GPS CLICÁVEL -->
        <div class="cover-location-card">
          <div class="cover-recording-line">${linhaGravacao}</div>
          <div class="cover-location-address">${formatMultilineHtml(enderecoEstudio)}</div>
          <div class="cover-parking-tag">${escapeHtml(avisoEstacionamento)}</div>
          <div>
            <a href="${escapeHtml(linkGps)}" target="_blank" rel="noopener noreferrer" class="cover-gps-link">
              TOQUE AQUI PARA ABRIR A ROTA NO GPS ↗
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- PÁGINAS DE CONTEÚDO EDITORIAL DIAGRAMADAS   -->
    <!-- ========================================== -->
    ${renderConteudoBlocos(estruturado, subCabecalhoDireita)}
  </div>
</body>
</html>`
}

/**
 * Renderiza os blocos do roteiro com quebra e diagramação profissional
 */
function renderConteudoBlocos(est: RoteiroEstruturado, subCabecalhoDireita: string): string {
  // Evitar qualquer quebra artificial vazia: se não houver blocos, não renderizar página vazia
  if (!est.blocos || est.blocos.length === 0) {
    return ''
  }

  let htmlPaginas = ''

  // Container de conteúdo editorial: inicia após a capa sem saltos vazios
  htmlPaginas += `
    <div class="pdf-page pdf-content-page">
      <div class="inner-editorial-header-wrapper">
        <div class="inner-editorial-header">
          <div class="inner-header-brand">
            <img src="${officialLogoImg}" alt="CoffeeCast 4.0" />
            <span class="inner-header-brand-title">CoffeeCast 4.0</span>
          </div>
          <div class="inner-header-guest">${subCabecalhoDireita}</div>
        </div>
        <div class="inner-editorial-subbar">
          <span>HISTÓRIAS QUE INSPIRAM • ROTEIRO DE GRAVAÇÃO OFICIAL</span>
          <span>GUIA DE ESTÚDIO</span>
        </div>
      </div>

      <div class="inner-page-content">
  `

  for (let b = 0; b < est.blocos.length; b++) {
    const bloco = est.blocos[b]
    const ehAbertura = bloco.tipo === 'abertura'
    const rotuloBloco = ehAbertura ? 'Abertura' : `Bloco ${bloco.numero}`

    htmlPaginas += `
      <section class="script-block">
        <div class="script-block-header">
          <div class="script-block-title-wrap">
            <span class="script-block-tag">${escapeHtml(rotuloBloco)}</span>
            <h3 class="script-block-title">${escapeHtml(bloco.titulo)}</h3>
          </div>
          <span class="script-block-duration-badge">⏱ ${bloco.duracaoMinutos} MINUTOS</span>
        </div>
    `

    if (bloco.textoIntro) {
      const paragrafos = bloco.textoIntro
        .split('\n\n')
        .map((p) => p.trim())
        .filter(Boolean)

      for (const p of paragrafos) {
        // Se for parágrafo entre aspas (falas de abertura / introdução das apresentadoras)
        if (p.startsWith('“') || p.startsWith('"')) {
          htmlPaginas += `
            <div class="script-intro-quote">
              ${escapeHtml(p)}
            </div>
          `
        } else {
          htmlPaginas += `
            <div class="script-intro-text">
              <p>${escapeHtml(p)}</p>
            </div>
          `
        }
      }
    }

    if (bloco.tipo === 'perguntas' && bloco.perguntas && bloco.perguntas.length > 0) {
      for (const q of bloco.perguntas) {
        if (q.opcional) {
          htmlPaginas += `
            <div class="question-optional-box">
              <span class="question-optional-tag">Se houver espaço na pauta</span>
              <div style="font-size:10.5pt; line-height:1.6; color:#1A0D15; margin-top:3px;">
                ${escapeHtml(q.texto)}
              </div>
            </div>
          `
        } else {
          htmlPaginas += `
            <div class="question-item">
              <span class="question-number-badge">${q.numero}.</span>
              <div class="question-content">
                ${q.direcionadaPara ? `<span class="question-target">${escapeHtml(q.direcionadaPara)}</span>` : ''}
                <span class="question-text-strong">${escapeHtml(q.texto)}</span>
              </div>
            </div>
          `
        }
      }
    }

    if (bloco.tipo === 'bate_bola') {
      if (bloco.itensBateBola && bloco.itensBateBola.length > 0) {
        htmlPaginas += `<ul class="bate-bola-list">`
        for (const item of bloco.itensBateBola) {
          htmlPaginas += `<li><strong>${escapeHtml(item)}</strong></li>`
        }
        htmlPaginas += `</ul>`
      }
      if (bloco.perguntaEspecialFinal) {
        htmlPaginas += `
          <div class="signature-question-box">
            <div class="signature-question-label">Pergunta de Assinatura CoffeeCast</div>
            <p class="signature-question-text">${escapeHtml(bloco.perguntaEspecialFinal)}</p>
          </div>
        `
      }
    }

    if (bloco.tipo === 'encerramento') {
      if (bloco.perguntaEspecialFinal) {
        htmlPaginas += `
          <div class="signature-question-box">
            <div class="signature-question-label">Momento Marcante de Fechamento</div>
            <p class="signature-question-text">${escapeHtml(bloco.perguntaEspecialFinal)}</p>
          </div>
        `
      }
      if (bloco.paragrafosEncerramento && bloco.paragrafosEncerramento.length > 0) {
        htmlPaginas += `
          <div class="encerramento-box">
            ${bloco.paragrafosEncerramento.map((p) => `<p style="margin:0 0 8px 0;">${escapeHtml(p)}</p>`).join('')}
          </div>
        `
      }
    }

    htmlPaginas += `</section>` // fecha .script-block
  }

  // Resumo de tempo final
  const durRoteiro = est.duracaoRoteiroMinutos || 55
  const durRespiro = est.duracaoRespiroMinutos || 5
  const durTotal = est.duracaoTotalMinutos || durRoteiro + durRespiro

  htmlPaginas += `
      <div class="script-time-summary">
        ⏱ <strong>Duração Planejada:</strong> ${durRoteiro} minutos de roteiro + ${durRespiro} minutos para a conversa fluir naturalmente = <strong>${durTotal} minutos totais</strong>
      </div>
    </div> <!-- fecha .inner-page-content -->

    <footer class="inner-page-footer">
      <div>
        <strong>HISTÓRIAS QUE INSPIRAM</strong> • ROTEIRO DE GRAVAÇÃO
      </div>
      <div>
        <strong>CoffeeCast 4.0</strong> — Mais que conversas, histórias que transformam.
      </div>
    </footer>
  </div> <!-- fecha .pdf-page -->
  `

  return htmlPaginas
}

/**
 * Dispara o download/impressão em PDF do roteiro oficial estruturado (individual ou conjunto)
 */
export async function downloadRoteiroOficialPdf(
  options: BuildRoteiroOficialPdfOptions,
): Promise<void> {
  const fileName = buildRoteiroOficialPdfFileName(
    options.titulo || options.convidadosNomes.join('-'),
  )
  const htmlContent = buildRoteiroOficialPdfHtml(options)

  const printWindow = window.open('', '_blank', 'width=900,height=1000,menubar=no,toolbar=no')
  if (!printWindow) {
    throw new Error('Abertura de nova janela bloqueada pelo navegador.')
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
    setTimeout(finish, 800)
  })

  try {
    printWindow.focus()
    printWindow.print()
  } catch (err) {
    console.error('Falha ao abrir diálogo de impressão da janela do PDF:', err)
  }
}

/**
 * Dispara o download/impressão em PDF das respostas originais do convidado através de uma janela dedicada limpa,
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
