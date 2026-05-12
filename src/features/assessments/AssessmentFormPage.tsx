import { useEffect, useMemo, useState } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { api } from '@/shared/services/api'
import {
  computeComposition,
  PROTOCOL_LABELS,
  skinfoldsForProtocol,
  type Protocol,
  type Skinfolds,
  type Sex,
} from '@/shared/utils/bodyComposition'
import { BodySilhouette, type BodyPoint } from '@/shared/components/illustrations/BodySilhouette'
import type { PhysicalAssessment } from '@/shared/types'

type FormState = Partial<PhysicalAssessment> & {
  protocol: Protocol
  assessmentDate: string
  activityFactor: number
}

const SKINFOLD_LABELS: Record<keyof Skinfolds, { label: string; point: BodyPoint }> = {
  subscapular: { label: 'Subescapular', point: 'subscapular' },
  triceps: { label: 'Tricipital', point: 'triceps' },
  biceps: { label: 'Bicipital', point: 'biceps' },
  chest: { label: 'Peitoral', point: 'chest' },
  midaxillary: { label: 'Axilar-média', point: 'midaxillary' },
  suprailiac: { label: 'Supra-ilíaca', point: 'suprailiac' },
  abdominal: { label: 'Abdominal', point: 'abdominal' },
  thigh: { label: 'Coxa', point: 'thigh' },
  calf: { label: 'Panturrilha', point: 'calf' },
}

function calcAge(birthDate?: string): number {
  if (!birthDate) return 30
  const b = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}

export function AssessmentFormPage() {
  const { state, navigate, setEditingAssessment } = useSession()
  const student = state.student
  const editingId = state.editingAssessmentId
  const isEditing = !!editingId

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activePoint, setActivePoint] = useState<BodyPoint | null>(null)

  const [form, setForm] = useState<FormState>({
    protocol: 'jackson_pollock_7',
    assessmentDate: new Date().toISOString().split('T')[0],
    activityFactor: 1.5,
    weightKg: undefined,
    heightM: student?.heightM,
  })

  useEffect(() => {
    if (!isEditing || !editingId) return
    api.getAssessment(editingId).then((res) => {
      if (res.success && res.data) {
        setForm({
          ...res.data,
          protocol: res.data.protocol,
          assessmentDate: res.data.assessmentDate,
          activityFactor: res.data.activityFactor ?? 1.5,
        })
      }
      setLoading(false)
    })
  }, [editingId, isEditing])

  if (!student) return null

  const age = calcAge(student.birthDate)
  const sex: Sex = (student.sex as Sex) ?? 'F'

  // Cálculos em tempo real
  const computed = useMemo(() => {
    if (!form.weightKg || !form.heightM) return null
    try {
      return computeComposition({
        sex,
        ageYears: age,
        weightKg: Number(form.weightKg),
        heightM: Number(form.heightM),
        protocol: form.protocol,
        activityFactor: form.activityFactor,
        skinfolds: {
          subscapular: form.skinfoldSubscapular,
          triceps: form.skinfoldTriceps,
          biceps: form.skinfoldBiceps,
          chest: form.skinfoldChest,
          midaxillary: form.skinfoldMidaxillary,
          suprailiac: form.skinfoldSuprailiac,
          abdominal: form.skinfoldAbdominal,
          thigh: form.skinfoldThigh,
          calf: form.skinfoldCalf,
        },
        circumferences: { waist: form.circWaist, hip: form.circHip },
        bones: {
          humerus: form.boneHumerus,
          femur: form.boneFemur,
          wrist: form.boneWrist,
        },
      })
    } catch {
      return null
    }
  }, [form, age, sex])

  const setNum = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setForm((prev) => ({ ...prev, [key]: v === '' ? undefined : Number(v) }))
  }

  const handleSave = async () => {
    if (!form.weightKg || !form.heightM) {
      setError('Peso e altura são obrigatórios')
      return
    }
    setSaving(true)
    setError(null)

    const payload: Omit<PhysicalAssessment, 'id' | 'createdAt'> = {
      studentId: student.id,
      assessmentDate: form.assessmentDate,
      protocol: form.protocol,
      weightKg: form.weightKg,
      heightM: form.heightM,
      bmi: computed?.bmi,
      skinfoldSubscapular: form.skinfoldSubscapular,
      skinfoldTriceps: form.skinfoldTriceps,
      skinfoldBiceps: form.skinfoldBiceps,
      skinfoldChest: form.skinfoldChest,
      skinfoldMidaxillary: form.skinfoldMidaxillary,
      skinfoldSuprailiac: form.skinfoldSuprailiac,
      skinfoldAbdominal: form.skinfoldAbdominal,
      skinfoldThigh: form.skinfoldThigh,
      skinfoldCalf: form.skinfoldCalf,
      circShoulder: form.circShoulder,
      circChest: form.circChest,
      circWaist: form.circWaist,
      circAbdomen: form.circAbdomen,
      circHip: form.circHip,
      circArmRight: form.circArmRight,
      circArmLeft: form.circArmLeft,
      circForearmRight: form.circForearmRight,
      circForearmLeft: form.circForearmLeft,
      circThighRight: form.circThighRight,
      circThighLeft: form.circThighLeft,
      circCalfRight: form.circCalfRight,
      circCalfLeft: form.circCalfLeft,
      boneHumerus: form.boneHumerus,
      boneFemur: form.boneFemur,
      boneWrist: form.boneWrist,
      sumSkinfolds: computed?.sumSkinfolds,
      whr: computed?.whr,
      bodyFatPct: computed?.bodyFatPct,
      fatMassKg: computed?.fatMassKg,
      leanMassKg: computed?.leanMassKg,
      muscleMassKg: computed?.muscleMassKg,
      residualMassKg: computed?.residualMassKg,
      boneMassKg: computed?.boneMassKg,
      bmr: computed?.bmr,
      activityFactor: form.activityFactor,
      tdee: computed?.tdee,
      notes: form.notes,
    }

    const res = isEditing && editingId
      ? await api.updateAssessment(editingId, payload)
      : await api.createAssessment(payload)
    setSaving(false)
    if (!res.success) {
      setError(res.error ?? 'Erro ao salvar')
      return
    }
    setEditingAssessment(null)
    navigate('assessment-list')
  }

  const header = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => {
          if (step > 1) setStep((step - 1) as 1 | 2 | 3)
          else navigate('assessment-list')
        }}
        className="p-1 -ml-1 text-text-muted hover:text-white"
        aria-label="Voltar"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-text-muted">{student.name}</p>
        <h1 className="font-display text-xl italic uppercase text-white">
          Avaliação · {step}/4
        </h1>
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

  const relevantSkinfolds = skinfoldsForProtocol(form.protocol, sex)

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-4" scrollable>
        {/* Progress */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? 'bg-cyan-400' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* STEP 1 — Antropometria */}
        {step === 1 && (
          <>
            <h2 className="font-display text-lg italic uppercase text-cyan-300">
              Antropometria
            </h2>

            <Field label="Data da avaliação">
              <input
                type="date"
                value={form.assessmentDate}
                onChange={(e) => setForm({ ...form, assessmentDate: e.target.value })}
                className="input-field"
                max={new Date().toISOString().split('T')[0]}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Peso (kg) *">
                <input
                  type="number"
                  step="0.1"
                  value={form.weightKg ?? ''}
                  onChange={setNum('weightKg')}
                  className="input-field font-mono"
                  placeholder="62.0"
                  inputMode="decimal"
                />
              </Field>
              <Field label="Altura (m) *">
                <input
                  type="number"
                  step="0.01"
                  value={form.heightM ?? ''}
                  onChange={setNum('heightM')}
                  className="input-field font-mono"
                  placeholder="1.61"
                  inputMode="decimal"
                />
              </Field>
            </div>

            {computed && (
              <Card className="border-cyan-500/20 bg-cyan-500/[0.04]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-cyan-300">
                      IMC
                    </p>
                    <p className="font-mono text-2xl font-bold text-white mt-0.5">
                      {computed.bmi.toFixed(1)}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-200">
                    {computed.bmiClass}
                  </span>
                </div>
              </Card>
            )}

            <Field label="Protocolo de dobras cutâneas">
              <select
                value={form.protocol}
                onChange={(e) => setForm({ ...form, protocol: e.target.value as Protocol })}
                className="input-field"
              >
                {(Object.keys(PROTOCOL_LABELS) as Protocol[]).map((p) => (
                  <option key={p} value={p}>
                    {PROTOCOL_LABELS[p]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Fator de atividade (GE)">
              <select
                value={form.activityFactor}
                onChange={(e) => setForm({ ...form, activityFactor: Number(e.target.value) })}
                className="input-field"
              >
                <option value="1.2">1.2 — Sedentário</option>
                <option value="1.375">1.375 — Leve (1-3×/sem)</option>
                <option value="1.5">1.5 — Moderado</option>
                <option value="1.55">1.55 — Ativo (3-5×/sem)</option>
                <option value="1.725">1.725 — Muito ativo</option>
                <option value="1.9">1.9 — Atleta</option>
              </select>
            </Field>

            <Button onClick={() => setStep(2)} className="w-full mt-2">
              Continuar → Dobras cutâneas
            </Button>
          </>
        )}

        {/* STEP 2 — Dobras */}
        {step === 2 && (
          <>
            <h2 className="font-display text-lg italic uppercase text-cyan-300">
              Dobras cutâneas (mm)
            </h2>
            <p className="text-[10px] text-text-muted -mt-2">
              Protocolo: <strong>{PROTOCOL_LABELS[form.protocol]}</strong> — campos
              destacados são os usados.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                {(Object.keys(SKINFOLD_LABELS) as Array<keyof Skinfolds>).map((key) => {
                  const meta = SKINFOLD_LABELS[key]
                  const formKey = `skinfold${key[0].toUpperCase() + key.slice(1)}` as keyof FormState
                  const active = relevantSkinfolds.includes(key)
                  return (
                    <div key={key} className="flex flex-col gap-1">
                      <label
                        className={`text-[10px] uppercase tracking-wider ${
                          active ? 'text-cyan-300' : 'text-text-muted/50'
                        }`}
                      >
                        {meta.label} {active && '★'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={(form[formKey] as number | undefined) ?? ''}
                        onChange={setNum(formKey)}
                        onFocus={() => setActivePoint(meta.point)}
                        onBlur={() => setActivePoint(null)}
                        className={`input-field font-mono text-sm py-2 ${
                          !active ? 'opacity-50' : ''
                        }`}
                        placeholder="—"
                        inputMode="decimal"
                      />
                    </div>
                  )
                })}
              </div>
              <div className="sticky top-0 self-start">
                <BodySilhouette
                  active={activePoint}
                  className="w-full max-h-[400px] drop-shadow-[0_0_20px_rgba(0,229,255,0.15)]"
                />
              </div>
            </div>

            {computed && computed.sumSkinfolds > 0 && (
              <Card className="border-cyan-500/20 bg-cyan-500/[0.04]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-cyan-300">
                      Soma das dobras
                    </p>
                    <p className="font-mono text-xl font-bold text-white mt-0.5">
                      {computed.sumSkinfolds.toFixed(1)} mm
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-cyan-300">
                      % Gordura (prévia)
                    </p>
                    <p className="font-mono text-xl font-bold text-white mt-0.5">
                      {computed.bodyFatPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continuar
              </Button>
            </div>
          </>
        )}

        {/* STEP 3 — Perimetria + Diâmetros */}
        {step === 3 && (
          <>
            <h2 className="font-display text-lg italic uppercase text-cyan-300">
              Perimetria (cm)
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <PerimField label="Ombro" value={form.circShoulder} onChange={setNum('circShoulder')} point="shoulder" setActive={setActivePoint} />
              <PerimField label="Tórax" value={form.circChest} onChange={setNum('circChest')} point="circ_chest" setActive={setActivePoint} />
              <PerimField label="Cintura" value={form.circWaist} onChange={setNum('circWaist')} point="waist" setActive={setActivePoint} />
              <PerimField label="Abdômen" value={form.circAbdomen} onChange={setNum('circAbdomen')} point="abdomen" setActive={setActivePoint} />
              <PerimField label="Quadril" value={form.circHip} onChange={setNum('circHip')} point="hip" setActive={setActivePoint} />
            </div>

            <p className="text-[10px] uppercase tracking-wider text-text-muted mt-1">
              Medidas bilaterais (D / E)
            </p>
            <BilateralField label="Braço" right={form.circArmRight} left={form.circArmLeft} onR={setNum('circArmRight')} onL={setNum('circArmLeft')} point="arm" setActive={setActivePoint} />
            <BilateralField label="Antebraço" right={form.circForearmRight} left={form.circForearmLeft} onR={setNum('circForearmRight')} onL={setNum('circForearmLeft')} point="forearm" setActive={setActivePoint} />
            <BilateralField label="Coxa" right={form.circThighRight} left={form.circThighLeft} onR={setNum('circThighRight')} onL={setNum('circThighLeft')} point="circ_thigh" setActive={setActivePoint} />
            <BilateralField label="Panturrilha" right={form.circCalfRight} left={form.circCalfLeft} onR={setNum('circCalfRight')} onL={setNum('circCalfLeft')} point="circ_calf" setActive={setActivePoint} />

            {computed?.whr !== undefined && (
              <Card className="border-violet-500/20 bg-violet-500/[0.04]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-violet-300">
                      RCQ
                    </p>
                    <p className="font-mono text-xl font-bold text-white mt-0.5">
                      {computed.whr.toFixed(3)}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg bg-violet-500/20 text-violet-200">
                    {computed.whrClass}
                  </span>
                </div>
              </Card>
            )}

            <h3 className="text-xs uppercase tracking-widest text-text-muted mt-2">
              Diâmetros ósseos (cm)
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Úmero">
                <input type="number" step="0.1" value={form.boneHumerus ?? ''} onChange={setNum('boneHumerus')} className="input-field font-mono text-sm" placeholder="—" inputMode="decimal" />
              </Field>
              <Field label="Fêmur">
                <input type="number" step="0.1" value={form.boneFemur ?? ''} onChange={setNum('boneFemur')} className="input-field font-mono text-sm" placeholder="—" inputMode="decimal" />
              </Field>
              <Field label="Estilóide">
                <input type="number" step="0.1" value={form.boneWrist ?? ''} onChange={setNum('boneWrist')} className="input-field font-mono text-sm" placeholder="—" inputMode="decimal" />
              </Field>
            </div>

            <div className="flex gap-3 mt-2">
              <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Ver resumo
              </Button>
            </div>
          </>
        )}

        {/* STEP 4 — Resumo */}
        {step === 4 && (
          <>
            <h2 className="font-display text-lg italic uppercase text-cyan-300">
              Resumo da avaliação
            </h2>

            {computed ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ResultCard label="IMC" value={computed.bmi.toFixed(1)} badge={computed.bmiClass} color="cyan" />
                  <ResultCard label="% Gordura" value={computed.bodyFatPct.toFixed(1) + '%'} badge={computed.bodyFatClass} color="violet" />
                  <ResultCard label="Massa Gorda" value={computed.fatMassKg.toFixed(1) + ' kg'} color="rose" />
                  <ResultCard label="Massa Magra" value={computed.leanMassKg.toFixed(1) + ' kg'} color="emerald" />
                  <ResultCard label="Massa Muscular" value={computed.muscleMassKg.toFixed(1) + ' kg'} color="cyan" />
                  <ResultCard label="Massa Óssea" value={computed.boneMassKg.toFixed(1) + ' kg'} color="amber" />
                  <ResultCard label="TMB" value={Math.round(computed.bmr) + ' kcal'} color="violet" />
                  <ResultCard label="GET" value={Math.round(computed.tdee) + ' kcal'} color="rose" />
                </div>

                <Field label="Observações">
                  <textarea
                    value={form.notes ?? ''}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Observações da avaliação..."
                  />
                </Field>
              </>
            ) : (
              <Card className="border-amber-500/30 bg-amber-500/10">
                <p className="text-sm text-amber-200 text-center">
                  Preencha peso e altura no passo 1 para ver os cálculos.
                </p>
              </Card>
            )}

            {error && (
              <Card className="border-red-500/30 bg-red-500/10 py-3">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </Card>
            )}

            <div className="flex gap-3 pt-2 pb-8">
              <Button variant="secondary" onClick={() => setStep(3)} className="flex-1" disabled={saving}>
                Voltar
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={saving || !computed}>
                {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar Avaliação'}
              </Button>
            </div>
          </>
        )}
      </PageContainer>
    </AppShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-wider text-text-muted">{label}</label>
      {children}
    </div>
  )
}

function PerimField({
  label,
  value,
  onChange,
  point,
  setActive,
}: {
  label: string
  value?: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  point: BodyPoint
  setActive: (p: BodyPoint | null) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-wider text-text-muted">{label}</label>
      <input
        type="number"
        step="0.1"
        value={value ?? ''}
        onChange={onChange}
        onFocus={() => setActive(point)}
        onBlur={() => setActive(null)}
        className="input-field font-mono text-sm"
        placeholder="—"
        inputMode="decimal"
      />
    </div>
  )
}

function BilateralField({
  label,
  right,
  left,
  onR,
  onL,
  point,
  setActive,
}: {
  label: string
  right?: number
  left?: number
  onR: (e: React.ChangeEvent<HTMLInputElement>) => void
  onL: (e: React.ChangeEvent<HTMLInputElement>) => void
  point: BodyPoint
  setActive: (p: BodyPoint | null) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] uppercase tracking-wider text-text-muted w-20 flex-shrink-0">
        {label}
      </label>
      <input
        type="number"
        step="0.1"
        value={right ?? ''}
        onChange={onR}
        onFocus={() => setActive(point)}
        onBlur={() => setActive(null)}
        className="input-field font-mono text-sm flex-1 py-1.5"
        placeholder="Dir"
        inputMode="decimal"
      />
      <input
        type="number"
        step="0.1"
        value={left ?? ''}
        onChange={onL}
        onFocus={() => setActive(point)}
        onBlur={() => setActive(null)}
        className="input-field font-mono text-sm flex-1 py-1.5"
        placeholder="Esq"
        inputMode="decimal"
      />
    </div>
  )
}

function ResultCard({
  label,
  value,
  badge,
  color,
}: {
  label: string
  value: string
  badge?: string
  color: 'cyan' | 'violet' | 'rose' | 'emerald' | 'amber'
}) {
  const colors = {
    cyan: 'border-cyan-500/20 bg-cyan-500/[0.04] text-cyan-300',
    violet: 'border-violet-500/20 bg-violet-500/[0.04] text-violet-300',
    rose: 'border-rose-500/20 bg-rose-500/[0.04] text-rose-300',
    emerald: 'border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-300',
    amber: 'border-amber-500/20 bg-amber-500/[0.04] text-amber-300',
  }
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <p className="text-[9px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="font-mono text-lg font-bold text-white mt-1">{value}</p>
      {badge && <p className="text-[10px] opacity-80 mt-0.5">{badge}</p>}
    </div>
  )
}
