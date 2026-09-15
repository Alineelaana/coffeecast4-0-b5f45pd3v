/**
 * Abre uma URL externa tentando nova aba (_blank) e contornando bloqueios
 * de pop-up ou sandboxing de iframe sem allow-popups com fallback para navegação direta.
 *
 * Em iframes sandboxeados (como no preview), window.open retorna null ou falha silenciosamente
 * e links target="_blank" são bloqueados pelo navegador. Se o pop-up falhar ou for bloqueado,
 * navegamos na própria janela / frame atual (window.location.href), garantindo que o vídeo ou
 * link sempre abra para o usuário.
 */
export function openExternalUrl(url: string, e?: React.MouseEvent | Event): void {
  if (e && 'preventDefault' in e) {
    e.preventDefault()
  }

  const cleanUrl = url?.trim()
  if (!cleanUrl) return

  const formattedUrl =
    cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')
      ? cleanUrl
      : `https://${cleanUrl}`

  try {
    const newWindow = window.open(formattedUrl, '_blank', 'noopener,noreferrer')
    // Se newWindow for null, undefined ou fechado imediatamente (bloqueado por sandbox/popup blocker)
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = formattedUrl
    }
  } catch (_err) {
    // Se ocorrer SecurityError ou restrição rígida de iframe sandbox
    try {
      window.location.href = formattedUrl
    } catch (_navErr) {
      // noop
    }
  }
}
