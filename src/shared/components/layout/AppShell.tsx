import { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'
import { OfflineBanner } from '@/shared/components/feedback/OfflineBanner'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'

interface AppShellProps {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  /** Gradient background (used on Login page) */
  gradient?: boolean
}

/**
 * Top-level layout shell. Handles:
 * - Safe area insets
 * - Full viewport height
 * - Optional header/footer slots
 * - Offline banner injection
 */
export function AppShell({ children, header, footer, gradient = false }: AppShellProps) {
  const isOnline = useOnlineStatus()

  return (
    <div
      className={cn(
        'flex flex-col min-h-dvh w-full max-w-md mx-auto',
        'relative overflow-hidden',
        gradient ? 'bg-gradient-brand' : 'bg-bg',
      )}
    >
      {/* Safe area top */}
      <div className="pt-safe" />

      {/* Offline banner — sits at the top */}
      {!isOnline && <OfflineBanner />}

      {/* Optional header */}
      {header && (
        <header className="flex-none px-4 py-3">{header}</header>
      )}

      {/* Main scrollable content */}
      <main className="flex flex-col flex-1 overflow-y-auto no-scrollbar animate-fade-in">
        {children}
      </main>

      {/* Optional footer */}
      {footer && (
        <footer className="flex-none px-4 py-3 pb-safe">{footer}</footer>
      )}

      {/* Safe area bottom fallback */}
      {!footer && <div className="pb-safe" />}
    </div>
  )
}
