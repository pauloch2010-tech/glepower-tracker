import { useState, FormEvent } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { useToast } from '@/shared/components/feedback/Toast'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { api } from '@/shared/services/api'

export function RegisterPage() {
  const { login, navigate } = useSession()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !password || !confirmPassword) return

    if (password.length < 8) {
      showToast('A senha deve ter pelo menos 8 caracteres.', 'error')
      return
    }

    if (password !== confirmPassword) {
      showToast('As senhas não coincidem.', 'error')
      return
    }

    setLoading(true)

    try {
      const res = await api.register(name.trim(), email.trim(), password)

      if (!res.success || !res.data) {
        showToast(res.error ?? 'Erro ao criar conta. Tente novamente.', 'error')
        return
      }

      login(res.data)
    } catch {
      showToast('Erro ao conectar. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const EyeIcon = ({ visible }: { visible: boolean }) =>
    visible ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    )

  return (
    <PageContainer centered className="min-h-dvh bg-gradient-brand px-6 py-12">
      <div className="w-full max-w-sm mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-6xl text-white uppercase italic tracking-wider">
            Gle<span className="text-primary">Power</span>
          </h1>
          <p className="text-text-secondary text-sm mt-2 tracking-widest uppercase">
            Tracker
          </p>
        </div>

        <h2 className="text-white text-xl font-semibold text-center mb-6">
          Criar Conta
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="Nome"
            type="text"
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            disabled={loading}
            required
          />

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
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            disabled={loading}
            required
            rightAddon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="pointer-events-auto text-text-muted hover:text-white transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <EyeIcon visible={showPassword} />
              </button>
            }
          />

          <Input
            label="Confirmar Senha"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
            required
            rightAddon={
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="pointer-events-auto text-text-muted hover:text-white transition-colors"
                aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <EyeIcon visible={showConfirm} />
              </button>
            }
          />

          <Button
            type="submit"
            size="full"
            loading={loading}
            disabled={loading || !name.trim() || !email.trim() || !password || !confirmPassword}
            className="mt-2"
          >
            Criar Conta
          </Button>
        </form>

        {/* Login link */}
        <p className="text-center text-text-secondary text-sm mt-6">
          Já tem conta?{' '}
          <button
            type="button"
            onClick={() => navigate('login')}
            className="text-primary hover:underline font-medium"
          >
            Entrar
          </button>
        </p>
      </div>
    </PageContainer>
  )
}
