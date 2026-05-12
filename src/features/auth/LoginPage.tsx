import { useState, useCallback, FormEvent } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { useToast } from '@/shared/components/feedback/Toast'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Button } from '@/shared/components/ui/Button'
import { api } from '@/shared/services/api'

// ─── PIN Pad ──────────────────────────────────────────────────────────────────
const PIN_LENGTH = 4

function PinDisplay({ value, error }: { value: string; error: boolean }) {
  return (
    <div className="flex gap-4 justify-center my-8" aria-label="PIN digitado">
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <div
          key={i}
          className={`w-5 h-5 rounded-full transition-all duration-150 ${
            i < value.length
              ? error
                ? 'bg-error scale-110'
                : 'bg-primary scale-110 shadow-glow'
              : 'bg-surface-overlay'
          }`}
        />
      ))}
    </div>
  )
}

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

function PinPad({ onKey }: { onKey: (k: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto" role="group" aria-label="Teclado numérico">
      {PAD_KEYS.map((k, idx) => {
        if (k === '') return <div key={idx} />
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onKey(k)}
            aria-label={k === '⌫' ? 'Apagar' : k}
            className={`
              h-16 rounded-2xl font-semibold text-xl select-none
              transition-all duration-100 active:scale-90
              ${k === '⌫'
                ? 'bg-surface text-text-secondary hover:bg-surface-raised'
                : 'bg-surface-raised text-white hover:bg-secondary active:bg-secondary'}
            `}
          >
            {k}
          </button>
        )
      })}
    </div>
  )
}

// ─── Login Page ───────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login } = useSession()
  const { showToast } = useToast()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleKey = useCallback((k: string) => {
    setError(false)
    if (k === '⌫') {
      setPin((p) => p.slice(0, -1))
    } else if (pin.length < PIN_LENGTH) {
      setPin((p) => p + k)
    }
  }, [pin])

  const handleSubmit = useCallback(async (e?: FormEvent) => {
    e?.preventDefault()
    if (pin.length !== PIN_LENGTH) return
    setLoading(true)

    try {
      const res = await api.login(pin)

      if (!res.success || !res.data) {
        setError(true)
        setPin('')
        showToast(res.error ?? 'PIN inválido. Tente novamente.', 'error')
        return
      }

      login(res.data)
    } catch {
      setError(true)
      setPin('')
      showToast('Erro ao conectar. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }, [pin, login, showToast])

  const handleKeyUpdate = useCallback((k: string) => {
    handleKey(k)
    if (k !== '⌫' && pin.length === PIN_LENGTH - 1) {
      setTimeout(() => handleSubmit(), 0)
    }
  }, [handleKey, pin.length, handleSubmit])

  return (
    <PageContainer centered className="min-h-dvh bg-gradient-brand px-6 py-12">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-2">
          <h1 className="font-display text-6xl text-white uppercase italic tracking-wider">
            Gle<span className="text-primary">Power</span>
          </h1>
          <p className="text-text-secondary text-sm mt-2 tracking-widest uppercase">
            Tracker
          </p>
        </div>

        <p className="text-center text-text-secondary text-sm mb-2">
          Digite seu PIN de acesso
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <PinDisplay value={pin} error={error} />

          <PinPad onKey={handleKeyUpdate} />

          {pin.length === PIN_LENGTH && (
            <div className="mt-6">
              <Button
                type="submit"
                size="full"
                loading={loading}
                disabled={loading}
                className="animate-scale-in"
              >
                Entrar
              </Button>
            </div>
          )}
        </form>

        <p className="text-center text-text-muted text-xs mt-8">
          GlePower Tracker v0.1
        </p>
      </div>
    </PageContainer>
  )
}
