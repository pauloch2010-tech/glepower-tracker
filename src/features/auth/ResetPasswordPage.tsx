import { useState, FormEvent } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { useToast } from '@/shared/components/feedback/Toast'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { api } from '@/shared/services/api'

// ─── Reset Password Page ──────────────────────────────────────────────────────
// This page is reached when the user clicks the password-reset link in their
// email. Supabase appends #access_token=...&type=recovery to the redirect URL,
// which the Supabase client detects and emits a PASSWORD_RECOVERY auth event.
// SessionContext listens for that event and navigates here automatically.
// ─────────────────────────────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const { navigate } = useSession()
  const { showToast } = useToast()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const isValid = password.length >= 8 && password === confirm

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    if (password !== confirm) {
      showToast('As senhas não coincidem.', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await api.resetPassword(password)
      if (!res.success) {
        showToast(res.error ?? 'Erro ao atualizar senha.', 'error')
        return
      }
      setDone(true)
    } catch {
      showToast('Erro ao conectar. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer centered className="min-h-dvh bg-gradient-brand px-6 py-12">
      <div className="w-full max-w-sm mx-auto">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-6xl text-white uppercase italic tracking-wider">
            Gle<span className="text-primary">Power</span>
          </h1>
          <p className="text-text-secondary text-sm mt-2 tracking-widest uppercase">
            Tracker
          </p>
        </div>

        {done ? (
          /* Success state */
          <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Senha atualizada!</p>
              <p className="text-text-secondary text-sm">
                Sua nova senha foi salva. Faça login para continuar.
              </p>
            </div>
            <Button size="full" onClick={() => navigate('login')}>
              Ir para o login
            </Button>
          </div>
        ) : (
          /* Form */
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-white font-semibold text-lg">Nova senha</h2>
              <p className="text-text-secondary text-sm mt-1">
                Escolha uma senha com pelo menos 8 caracteres.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <Input
                label="Nova senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                required
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="pointer-events-auto text-text-muted hover:text-white transition-colors"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                }
              />

              <Input
                label="Confirmar nova senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita a nova senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                required
              />

              {/* Password mismatch hint */}
              {confirm.length > 0 && password !== confirm && (
                <p className="text-error text-xs -mt-2">As senhas não coincidem.</p>
              )}

              <Button
                type="submit"
                size="full"
                loading={loading}
                disabled={loading || !isValid}
                className="mt-2"
              >
                Salvar nova senha
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-text-muted text-xs mt-8">
          GlePower Tracker v0.1
        </p>
      </div>
    </PageContainer>
  )
}
