import { ReactNode } from 'react'
import { SessionProvider } from '@/shared/store/SessionContext'
import { ToastProvider } from '@/shared/components/feedback/Toast'
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary'

interface ProvidersProps {
  children: ReactNode
}

/**
 * Wraps the entire app with global providers.
 * Order matters: ErrorBoundary is outermost so it catches everything.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}
