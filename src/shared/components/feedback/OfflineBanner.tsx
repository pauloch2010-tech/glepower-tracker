/**
 * Shown when navigator.onLine === false.
 * Injected by AppShell automatically.
 */
export function OfflineBanner() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center justify-center gap-2 bg-warning/20 border-b border-warning/30
                 text-warning text-sm font-medium py-2 px-4 animate-slide-down"
    >
      <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
      Sem conexão — dados salvos localmente
    </div>
  )
}
