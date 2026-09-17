/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'

// Interceptação imediata de token de recuperação antes de qualquer renderização da SPA:
// Se o link do e-mail chegar com hash (ex: /_/#/auth/confirm-password-reset/<token> ou /#token=<token>
// ou se cair na raiz com query param ?token=xyz), normaliza de imediato para /redefinir-senha?token=<token>
// garantindo que NUNCA renderize a Home por engano.
;(function handleEarlyAuthRedirect() {
  if (typeof window === 'undefined') return
  try {
    const pathname = window.location.pathname
    const search = window.location.search
    const hash = window.location.hash

    // 1. Se chegou token na query param (?token=xyz) e não estamos já em /redefinir-senha ou /reset-password
    if (search) {
      const sp = new URLSearchParams(search)
      const token = sp.get('token')
      if (
        token &&
        token.trim() &&
        !pathname.startsWith('/redefinir-senha') &&
        !pathname.startsWith('/reset-password')
      ) {
        window.location.replace(`/redefinir-senha?token=${encodeURIComponent(token.trim())}`)
        return
      }
    }

    // 2. Se o hash contiver confirm-password-reset ou token=
    if (hash) {
      const matchReset = hash.match(/confirm-password-reset\/([a-zA-Z0-9_\-.]+)/)
      const matchTokenParam = hash.match(/[?&#]token=([a-zA-Z0-9_\-.]+)/)
      const token = (matchReset && matchReset[1]) || (matchTokenParam && matchTokenParam[1])
      if (token && token.trim()) {
        window.location.replace(`/redefinir-senha?token=${encodeURIComponent(token.trim())}`)
        return
      }
    }

    // 3. Se o pathname contiver confirm-password-reset (sem hash)
    if (pathname.includes('confirm-password-reset')) {
      const matchPath = pathname.match(/confirm-password-reset\/([a-zA-Z0-9_\-.]+)/)
      if (matchPath && matchPath[1]) {
        window.location.replace(`/redefinir-senha?token=${encodeURIComponent(matchPath[1].trim())}`)
        return
      }
    }
  } catch (err) {
    console.error('Erro na normalização de rota de autenticação:', err)
  }
})()

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)
