/**
 * Abre uma URL externa tentando nova aba (_blank) e contornando bloqueios
 * de pop-up ou sandboxing de iframe sem allow-popups com fallback para navegação direta.
 *
 * Em iframes sandboxeados (como no preview), window.open retorna null ou falha silenciosamente
 * e links target="_blank" são bloqueados pelo navegador. Se o pop-up falhar ou for bloqueado,
 * navegamos na própria janela / frame atual (window.location.href), garantindo que o vídeo ou
 * link sempre abra para o usuário.
 */
import { toast } from 'sonner'

/**
 * Normaliza uma URL garantindo o prefixo https:// se faltar protocolo.
 */
export function formatExternalUrl(url: string): string {
  const cleanUrl = url?.trim() || ''
  if (!cleanUrl) return ''
  return cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')
    ? cleanUrl
    : `https://${cleanUrl}`
}

/**
 * Abre uma URL externa SEMPRE em nova guia (_blank), SEM NUNCA substituir a guia atual
 * (sem window.location.href).
 *
 * Se o navegador ou iframe sandbox bloquear pop-ups, tenta o disparo via elemento <a>
 * temporário com target="_blank" e rel="noopener noreferrer". Se ainda assim não for
 * possível (ex: sandbox sem allow-popups), exibe um aviso amigável ao usuário via toast.
 */
export function openExternalUrl(
  url: string,
  e?: React.SyntheticEvent | Event | React.MouseEvent | React.KeyboardEvent,
): boolean {
  if (e && 'preventDefault' in e) {
    e.preventDefault()
  }

  const formattedUrl = formatExternalUrl(url)
  if (!formattedUrl) return false

  let opened = false

  // 1ª tentativa: window.open com relatórios e validação
  try {
    const newWindow = window.open(formattedUrl, '_blank', 'noopener,noreferrer')
    if (newWindow && !newWindow.closed && typeof newWindow.closed !== 'undefined') {
      opened = true
    }
  } catch (_err) {
    opened = false
  }

  // 2ª tentativa: elemento <a> nativo temporário anexado ao DOM com target="_blank"
  if (!opened && typeof document !== 'undefined') {
    try {
      const link = document.createElement('a')
      link.href = formattedUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      opened = true
    } catch (_linkErr) {
      opened = false
    }
  }

  // Se mesmo assim não foi possível abrir nova guia (ex: sandbox restrita sem allow-popups),
  // NUNCA navegar na guia atual. Apenas informar o usuário gentilmente.
  if (!opened) {
    try {
      toast.info('Não foi possível abrir o link em uma nova guia.', {
        description: 'Verifique se o seu navegador ou bloqueador de pop-ups permite novas guias.',
      })
    } catch (_toastErr) {
      // noop caso toast não esteja disponível
    }
  }

  return opened
}
