import { useState } from 'react'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { api } from '@/shared/services/api'
import { formatPhone } from '@/shared/utils/phone'
import type { Student, Sex } from '@/shared/types'

type Level = 'Iniciante' | 'Intermediário' | 'Avançado'

interface FormData {
  name: string
  level: Level | ''
  sex: Sex | ''
  heightM: string
  phone: string
  email: string
  birthDate: string
  goal: string
}

const LEVELS: Level[] = ['Iniciante', 'Intermediário', 'Avançado']

const LEVEL_COLORS: Record<Level, string> = {
  Iniciante: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  Intermediário: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
  Avançado: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
}

interface Props {
  editStudent?: Student
  onBack: () => void
  onSaved: () => void
}

export function StudentFormPage({ editStudent, onBack, onSaved }: Props) {
  const [form, setForm] = useState<FormData>({
    name: editStudent?.name ?? '',
    level: (editStudent?.level as Level) ?? '',
    sex: (editStudent?.sex as Sex) ?? '',
    heightM: editStudent?.heightM != null ? String(editStudent.heightM) : '',
    phone: editStudent?.phone ?? '',
    email: editStudent?.email ?? '',
    birthDate: editStudent?.birthDate ?? '',
    goal: editStudent?.goal ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!editStudent

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const setPhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, phone: formatPhone(e.target.value) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    if (!form.level) { setError('Nível é obrigatório'); return }

    setSaving(true)
    setError(null)

    const payload: Omit<Student, 'id'> = {
      name: form.name.trim(),
      level: form.level,
      sex: form.sex || undefined,
      heightM: form.heightM ? Number(form.heightM) : undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      birthDate: form.birthDate || undefined,
      goal: form.goal.trim() || undefined,
    }

    const res = isEditing
      ? await api.updateStudent(editStudent.id, payload)
      : await api.createStudent(payload)

    setSaving(false)

    if (!res.success) {
      setError(res.error ?? 'Erro ao salvar')
      return
    }

    onSaved()
  }

  const header = (
    <div className="flex items-center gap-3">
      <button onClick={onBack} className="p-1 -ml-1 text-text-muted hover:text-white transition-colors" aria-label="Voltar">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="font-display text-2xl italic uppercase text-white">
        {isEditing ? 'Editar Aluno' : 'Novo Aluno'}
      </h1>
    </div>
  )

  return (
    <AppShell header={header}>
      <PageContainer className="py-4" scrollable>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest text-text-muted">
              Nome completo <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Ex: Ana Beatriz Silva"
              className="input-field"
              autoFocus
              required
            />
          </div>

          {/* Nível */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest text-text-muted">
              Nível <span className="text-primary">*</span>
            </label>
            <div className="flex gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, level: lvl }))}
                  className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                    form.level === lvl
                      ? LEVEL_COLORS[lvl]
                      : 'bg-white/[0.04] border-white/10 text-text-muted hover:border-white/20'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Sexo + Altura */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-text-muted">Sexo</label>
              <div className="flex gap-2">
                {(['F', 'M'] as Sex[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, sex: s }))}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.sex === s
                        ? 'bg-primary/20 border-primary/40 text-pink-200'
                        : 'bg-white/[0.04] border-white/10 text-text-muted'
                    }`}
                  >
                    {s === 'F' ? 'Fem' : 'Masc'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-text-muted">
                Altura (m)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.heightM}
                onChange={(e) => setForm((prev) => ({ ...prev, heightM: e.target.value }))}
                placeholder="1.65"
                inputMode="decimal"
                className="input-field font-mono"
              />
            </div>
          </div>

          {/* Telefone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest text-text-muted">WhatsApp</label>
            <input
              type="tel"
              value={form.phone}
              onChange={setPhone}
              placeholder="(11) 99999-9999"
              inputMode="numeric"
              maxLength={15}
              className="input-field"
            />
          </div>

          {/* E-mail */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest text-text-muted">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="aluno@email.com"
              className="input-field"
            />
          </div>

          {/* Data de nascimento */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest text-text-muted">Data de nascimento</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={set('birthDate')}
              className="input-field"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Objetivo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest text-text-muted">Objetivo</label>
            <textarea
              value={form.goal}
              onChange={set('goal')}
              placeholder="Ex: Hipertrofia muscular, emagrecimento, condicionamento..."
              className="input-field resize-none min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Erro */}
          {error && (
            <Card className="border-red-500/30 bg-red-500/10 py-3">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </Card>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-2 pb-8">
            <Button type="button" variant="secondary" onClick={onBack} className="flex-1" disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar aluno'}
            </Button>
          </div>

        </form>
      </PageContainer>
    </AppShell>
  )
}
