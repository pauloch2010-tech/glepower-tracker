import { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { SessionProvider } from '@/shared/store/SessionContext'
import { ToastProvider } from '@/shared/components/feedback/Toast'
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary'
import { LangProvider } from '@/shared/i18n/LangContext'

interface ProvidersProps {
  children: ReactNode
}

/**
 * Wraps the entire app with global providers.
 * Order matters: BrowserRouter is outermost (required by SessionProvider
 * which uses useNavigate/useLocation), ErrorBoundary catches everything.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <LangProvider>
          <SessionProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SessionProvider>
        </LangProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
