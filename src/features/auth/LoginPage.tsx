import { useState, FormEvent } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { useToast } from '@/shared/components/feedback/Toast'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { api } from '@/shared/services/api'

// ─── Login Page ───────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login, navigate } = useSession()
  const { showToast } = useToast()

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)

    try {
      const res = await api.loginEmail(email.trim(), password)

      if (!res.success || !res.data) {
        showToast(res.error ?? 'E-mail ou senha inválidos.', 'error')
        return
      }

      login(res.data)
    } catch {
      showToast('Erro ao conectar. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!resetEmail.trim()) return
    setResetLoading(true)

    try {
      await api.forgotPassword(resetEmail.trim())
      // Always show success — prevents email enumeration
      setResetSent(true)
    } catch {
      showToast('Erro ao enviar. Tente novamente.', 'error')
    } finally {
      setResetLoading(false)
    }
  }

  const backToLogin = () => {
    setForgotMode(false)
    setResetSent(false)
    setResetEmail('')
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

        {/* ── Forgot Password flow ── */}
        {forgotMode ? (
          resetSent ? (
            /* Success state */
            <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">E-mail enviado!</p>
                <p className="text-text-secondary text-sm">
                  Se <span className="text-white font-mono">{resetEmail}</span> estiver cadastrado,
                  você receberá um link para redefinir sua senha.
                </p>
                <p className="text-text-muted text-xs mt-2">Verifique também a caixa de spam.</p>
              </div>
              <Button size="full" onClick={backToLogin}>
                Voltar ao login
              </Button>
            </div>
          ) : (
            /* Forgot password form */
            <div className="animate-fade-in">
              <div className="mb-6">
                <h2 className="text-white font-semibold text-lg">Esqueceu a senha?</h2>
                <p className="text-text-secondary text-sm mt-1">
                  Digite seu e-mail e enviaremos um link para criar uma nova senha.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} noValidate className="flex flex-col gap-4">
                <Input
                  label="E-mail cadastrado"
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  disabled={resetLoading}
                  required
                />

                <Button
                  type="submit"
                  size="full"
                  loading={resetLoading}
                  disabled={resetLoading || !resetEmail.trim()}
                  className="mt-2"
                >
                  Enviar link de recuperação
                </Button>
              </form>

              <p className="text-center text-text-secondary text-sm mt-6">
                <button
                  type="button"
                  onClick={backToLogin}
                  className="text-primary hover:underline font-medium"
                >
                  ← Voltar ao login
                </button>
              </p>
            </div>
          )
        ) : (
          /* ── Login form ── */
          <div className="animate-fade-in">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                disabled={loading}
                required
              />

              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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

              {/* Forgot password link */}
              <div className="text-right -mt-1">
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setResetEmail(email) }}
                  className="text-text-secondary text-sm hover:text-white transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <Button
                type="submit"
                size="full"
                loading={loading}
                disabled={loading || !email.trim() || !password}
                className="mt-1"
              >
                Entrar
              </Button>
            </form>

            {/* Register link */}
            <p className="text-center text-text-secondary text-sm mt-6">
              Ainda não tem conta?{' '}
              <button
                type="button"
                onClick={() => navigate('register')}
                className="text-primary hover:underline font-medium"
              >
                Criar conta
              </button>
            </p>
          </div>
        )}

        <p className="text-center text-text-muted text-xs mt-8">
          GlePower Tracker v0.1
        </p>
      </div>
    </PageContainer>
  )
}
