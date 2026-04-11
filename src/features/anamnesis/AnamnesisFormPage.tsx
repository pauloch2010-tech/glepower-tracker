import { useEffect, useState } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { api } from '@/shared/services/api'
import type { Anamnesis } from '@/shared/types'

const CLINICAL_FIELDS: Array<{ key: keyof Anamnesis; label: string }> = [
  { key: 'familyDiseases', label: 'Doenças na família nos últimos anos?' },
  { key: 'personalDiseases', label: 'Doenças pessoais nos últimos anos?' },
  { key: 'exerciseRestrictions', label: 'Restrição à prática de exercícios físicos?' },
  { key: 'surgeries', label: 'Foi submetido(a) a alguma cirurgia?' },
  { key: 'allergies', label: 'Possui algum tipo de alergia?' },
  { key: 'injuries', label: 'Sofreu acidente ou lesão osteo-muscular?' },
  { key: 'medications', label: 'Utiliza algum medicamento?' },
  { key: 'bodyPains', label: 'Sente dores no corpo ultimamente?' },
  { key: 'smoking', label: 'Tem ou teve o hábito de fumar?' },
  { key: 'diet', label: 'Está em dieta para perder/ganhar peso?' },
  { key: 'currentExercise', label: 'Pratica algum exercício físico atualmente?' },
  { key: 'activityType', label: 'Qual atividade?' },
  { key: 'frequency', label: 'Frequência semanal?' },
]

const PARQ_FIELDS: Array<{ key: keyof Anamnesis; label: string }> = [
  { key: 'parqHeart', label: 'Algum médico já disse que você tem problema de coração e só deveria fazer atividade física supervisionada?' },
  { key: 'parqChestPain', label: 'Você sente dores no peito quando pratica atividade física?' },
  { key: 'parqChestPainMonth', label: 'No último mês, sentiu dores no peito durante atividade física?' },
  { key: 'parqDizziness', label: 'Apresenta desequilíbrio por tontura ou perda de consciência?' },
  { key: 'parqBoneJoint', label: 'Possui problema ósseo/articular que poderia piorar com atividade física?' },
  { key: 'parqBloodPressureMed', label: 'Toma medicamento para pressão arterial ou coração?' },
  { key: 'parqOtherReason', label: 'Sabe de outra razão pela qual não deve fazer atividade física?' },
]

export function AnamnesisFormPage() {
  const { state, navigate } = useSession()
  const student = state.student
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Anamnesis>>({})

  useEffect(() => {
    if (!student) return
    api.getAnamnesis(student.id).then((res) => {
      if (res.success && res.data) setForm(res.data)
      setLoading(false)
    })
  }, [student])

  if (!student) return null

  const setField = (key: keyof Anamnesis, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const parqHasYes = PARQ_FIELDS.some((f) => form[f.key] === true)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const res = await api.saveAnamnesis({ ...form, studentId: student.id })
    setSaving(false)
    if (!res.success) {
      setError(res.error ?? 'Erro ao salvar')
      return
    }
    navigate('student-detail')
  }

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => (step === 1 ? navigate('student-detail') : setStep(1))}
          className="p-1 -ml-1 text-text-muted hover:text-white"
          aria-label="Voltar"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted">
            {student.name}
          </p>
          <h1 className="font-display text-xl italic uppercase text-white">
            Anamnese · {step}/2
          </h1>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <AppShell header={header}>
        <PageContainer className="py-4">
          <p className="text-text-muted text-center py-12">Carregando...</p>
        </PageContainer>
      </AppShell>
    )
  }

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-4" scrollable>
        {/* Progress bar */}
        <div className="flex gap-1">
          <div className="flex-1 h-1 rounded-full bg-cyan-400" />
          <div
            className={`flex-1 h-1 rounded-full transition-colors ${
              step === 2 ? 'bg-cyan-400' : 'bg-white/10'
            }`}
          />
        </div>

        {step === 1 ? (
          <>
            <h2 className="font-display text-lg italic uppercase text-cyan-300">
              Anamnese Clínica
            </h2>
            <div className="flex flex-col gap-3">
              {CLINICAL_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted">{label}</label>
                  <textarea
                    value={(form[key] as string) ?? ''}
                    onChange={(e) => setField(key, e.target.value)}
                    rows={2}
                    className="input-field resize-none"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>

            <Button onClick={() => setStep(2)} className="w-full mt-2">
              Continuar → PAR-Q
            </Button>
          </>
        ) : (
          <>
            <h2 className="font-display text-lg italic uppercase text-cyan-300">PAR-Q</h2>
            <p className="text-xs text-text-muted">
              Questionário de Prontidão para Atividade Física
            </p>

            <div className="flex flex-col gap-2">
              {PARQ_FIELDS.map(({ key, label }) => {
                const value = form[key] === true
                return (
                  <Card key={key} className="py-3">
                    <p className="text-sm text-white mb-2.5 leading-snug">{label}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setField(key, false)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                          form[key] === false
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-white/[0.04] border-white/10 text-text-muted'
                        }`}
                      >
                        Não
                      </button>
                      <button
                        onClick={() => setField(key, true)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                          value
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : 'bg-white/[0.04] border-white/10 text-text-muted'
                        }`}
                      >
                        Sim
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs text-text-muted">Observações</label>
              <textarea
                value={form.parqObservations ?? ''}
                onChange={(e) => setField('parqObservations', e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="Observações adicionais..."
              />
            </div>

            {parqHasYes && (
              <Card className="border-rose-500/40 bg-rose-500/10">
                <p className="text-sm text-rose-200">
                  ⚠️ <strong>Atenção:</strong> Foi respondido SIM a pelo menos uma pergunta do
                  PAR-Q. Recomenda-se <strong>liberação médica</strong> antes de iniciar o
                  programa de exercícios.
                </p>
              </Card>
            )}

            {error && (
              <Card className="border-red-500/30 bg-red-500/10 py-3">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </Card>
            )}

            <div className="flex gap-3 pt-2 pb-8">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
                className="flex-1"
                disabled={saving}
              >
                Voltar
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Anamnese'}
              </Button>
            </div>
          </>
        )}
      </PageContainer>
    </AppShell>
  )
}
