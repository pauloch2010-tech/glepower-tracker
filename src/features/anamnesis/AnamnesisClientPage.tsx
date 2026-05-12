import { useEffect, useState } from 'react'
import { useClientLang } from '@/shared/i18n/LangContext'
import { LANG_LABELS } from '@/shared/i18n/translations'
import { api } from '@/shared/services/api'
import type { Lang } from '@/shared/i18n/translations'

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'personal' | 'routine' | 'physical' | 'nutrition' | 'emotional'
const STEPS: Step[] = ['personal', 'routine', 'physical', 'nutrition', 'emotional']

type FormData = Record<string, string>

type T = ReturnType<typeof useClientLang>['t']

// ─── Primitive inputs ─────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">{children}</p>
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.08] transition-all"
    />
  )
}

function TextareaInput({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.08] transition-all resize-none"
    />
  )
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all appearance-none"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o} className="bg-[#111] text-white">
          {o}
        </option>
      ))}
    </select>
  )
}

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly string[] | string[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
            value === o
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
              : 'bg-white/[0.04] border-white/10 text-text-muted'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function YesNo({
  label,
  field,
  data,
  set,
  yes,
  no,
}: {
  label: string
  field: string
  data: FormData
  set: (k: string, v: string) => void
  yes: string
  no: string
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <RadioGroup value={data[field] || ''} onChange={(v) => set(field, v)} options={[yes, no]} />
    </div>
  )
}

// ─── Language Selector ────────────────────────────────────────────────────────
function LangSelector({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex gap-1.5">
      {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
            lang === code
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
              : 'bg-white/[0.04] border-white/10 text-text-muted'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Step: Dados Pessoais ─────────────────────────────────────────────────────
function StepPersonal({ data, set, t }: { data: FormData; set: (k: string, v: string) => void; t: T }) {
  const p = t.anamnesisClient.personal
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>{p.name}</FieldLabel>
          <TextInput value={data.name || ''} onChange={(v) => set('name', v)} />
        </div>
        <div>
          <FieldLabel>{p.surname}</FieldLabel>
          <TextInput value={data.surname || ''} onChange={(v) => set('surname', v)} />
        </div>
      </div>
      <div>
        <FieldLabel>{p.email}</FieldLabel>
        <TextInput type="email" value={data.email || ''} onChange={(v) => set('email', v)} />
      </div>
      <div>
        <FieldLabel>{p.whatsapp}</FieldLabel>
        <TextInput type="tel" value={data.whatsapp || ''} onChange={(v) => set('whatsapp', v)} />
      </div>
      <div>
        <FieldLabel>{p.birthDate}</FieldLabel>
        <TextInput type="date" value={data.birthDate || ''} onChange={(v) => set('birthDate', v)} />
      </div>
      <div>
        <FieldLabel>{p.profession}</FieldLabel>
        <TextInput value={data.profession || ''} onChange={(v) => set('profession', v)} />
      </div>
      <div>
        <FieldLabel>{p.gender}</FieldLabel>
        <RadioGroup value={data.gender || ''} onChange={(v) => set('gender', v)} options={p.genderOptions} />
      </div>
      <div>
        <FieldLabel>{p.city}</FieldLabel>
        <TextInput value={data.city || ''} onChange={(v) => set('city', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>{p.height}</FieldLabel>
          <TextInput type="number" value={data.height || ''} onChange={(v) => set('height', v)} />
        </div>
        <div>
          <FieldLabel>{p.weight}</FieldLabel>
          <TextInput type="number" value={data.weight || ''} onChange={(v) => set('weight', v)} />
        </div>
      </div>
      <div>
        <FieldLabel>{p.goal}</FieldLabel>
        <SelectInput
          value={data.goal || ''}
          onChange={(v) => set('goal', v)}
          options={p.goalOptions}
          placeholder="—"
        />
      </div>
      <div>
        <FieldLabel>{p.goalEvent}</FieldLabel>
        <TextInput value={data.goalEvent || ''} onChange={(v) => set('goalEvent', v)} />
      </div>
    </div>
  )
}

// ─── Step: Rotina ─────────────────────────────────────────────────────────────
function StepRoutine({ data, set, t }: { data: FormData; set: (k: string, v: string) => void; t: T }) {
  const r = t.anamnesisClient.routine
  return (
    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel>{r.trainingDays}</FieldLabel>
        <RadioGroup value={data.trainingDays || ''} onChange={(v) => set('trainingDays', v)} options={r.trainingDaysOptions} />
      </div>
      <div>
        <FieldLabel>{r.trainingTime}</FieldLabel>
        <RadioGroup value={data.trainingTime || ''} onChange={(v) => set('trainingTime', v)} options={r.trainingTimeOptions} />
      </div>
      <div>
        <FieldLabel>{r.bestTime}</FieldLabel>
        <RadioGroup value={data.bestTime || ''} onChange={(v) => set('bestTime', v)} options={r.bestTimeOptions} />
      </div>
      <div>
        <FieldLabel>{r.selfCareTime}</FieldLabel>
        <RadioGroup value={data.selfCareTime || ''} onChange={(v) => set('selfCareTime', v)} options={r.selfCareOptions} />
      </div>
      <div>
        <FieldLabel>{r.weekendHabits}</FieldLabel>
        <RadioGroup value={data.weekendHabits || ''} onChange={(v) => set('weekendHabits', v)} options={r.weekendOptions} />
      </div>
    </div>
  )
}

// ─── Step: Atividade Física ───────────────────────────────────────────────────
function StepPhysical({ data, set, t }: { data: FormData; set: (k: string, v: string) => void; t: T }) {
  const p = t.anamnesisClient.physical
  const yes = t.app.yes
  const no = t.app.no
  return (
    <div className="flex flex-col gap-4">
      <YesNo label={p.practices} field="practices" data={data} set={set} yes={yes} no={no} />
      <div>
        <FieldLabel>{p.frequency}</FieldLabel>
        <SelectInput value={data.frequency || ''} onChange={(v) => set('frequency', v)} options={p.frequencyOptions} placeholder="—" />
      </div>
      <YesNo label={p.hadPersonal} field="hadPersonal" data={data} set={set} yes={yes} no={no} />
      <YesNo label={p.equipment} field="equipment" data={data} set={set} yes={yes} no={no} />
      <YesNo label={p.limitation} field="limitation" data={data} set={set} yes={yes} no={no} />
      {data.limitation === yes && (
        <div>
          <FieldLabel>{p.limitationDesc}</FieldLabel>
          <TextareaInput value={data.limitationDesc || ''} onChange={(v) => set('limitationDesc', v)} />
        </div>
      )}
      <YesNo label={p.surgery} field="surgery" data={data} set={set} yes={yes} no={no} />
      {data.surgery === yes && (
        <div>
          <FieldLabel>{p.surgeryDesc}</FieldLabel>
          <TextareaInput value={data.surgeryDesc || ''} onChange={(v) => set('surgeryDesc', v)} />
        </div>
      )}
      <YesNo label={p.medicalRelease} field="medicalRelease" data={data} set={set} yes={yes} no={no} />
      <YesNo label={p.diseases} field="diseases" data={data} set={set} yes={yes} no={no} />
      {data.diseases === yes && (
        <div>
          <FieldLabel>{p.diseasesDesc}</FieldLabel>
          <TextInput value={data.diseasesDesc || ''} onChange={(v) => set('diseasesDesc', v)} />
        </div>
      )}
      <YesNo label={p.familyHistory} field="familyHistory" data={data} set={set} yes={yes} no={no} />
      {data.familyHistory === yes && (
        <div>
          <FieldLabel>{p.familyHistoryDesc}</FieldLabel>
          <TextInput value={data.familyHistoryDesc || ''} onChange={(v) => set('familyHistoryDesc', v)} />
        </div>
      )}
      <div>
        <FieldLabel>{p.smoking}</FieldLabel>
        <RadioGroup value={data.smoking || ''} onChange={(v) => set('smoking', v)} options={p.smokingOptions} />
      </div>
    </div>
  )
}

// ─── Step: Alimentação ────────────────────────────────────────────────────────
function StepNutrition({ data, set, t }: { data: FormData; set: (k: string, v: string) => void; t: T }) {
  const n = t.anamnesisClient.nutrition
  const yes = t.app.yes
  const no = t.app.no
  return (
    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel>{n.meals}</FieldLabel>
        <RadioGroup value={data.meals || ''} onChange={(v) => set('meals', v)} options={n.mealsOptions} />
      </div>
      <div>
        <FieldLabel>{n.skips}</FieldLabel>
        <RadioGroup value={data.skips || ''} onChange={(v) => set('skips', v)} options={n.skipsOptions} />
      </div>
      <div>
        <FieldLabel>{n.dailyFood}</FieldLabel>
        <TextareaInput value={data.dailyFood || ''} onChange={(v) => set('dailyFood', v)} rows={2} />
      </div>
      <div>
        <FieldLabel>{n.weekendFood}</FieldLabel>
        <TextInput value={data.weekendFood || ''} onChange={(v) => set('weekendFood', v)} />
      </div>
      <div>
        <FieldLabel>{n.hungerTime}</FieldLabel>
        <TextInput value={data.hungerTime || ''} onChange={(v) => set('hungerTime', v)} />
      </div>
      <div>
        <FieldLabel>{n.favorites}</FieldLabel>
        <TextInput value={data.favorites || ''} onChange={(v) => set('favorites', v)} />
      </div>
      <div>
        <FieldLabel>{n.avoided}</FieldLabel>
        <TextInput value={data.avoided || ''} onChange={(v) => set('avoided', v)} />
      </div>
      <YesNo label={n.restriction} field="restriction" data={data} set={set} yes={yes} no={no} />
      {data.restriction === yes && (
        <div>
          <FieldLabel>{n.restrictionDesc}</FieldLabel>
          <TextInput value={data.restrictionDesc || ''} onChange={(v) => set('restrictionDesc', v)} />
        </div>
      )}
      <div>
        <FieldLabel>{n.water}</FieldLabel>
        <RadioGroup value={data.water || ''} onChange={(v) => set('water', v)} options={n.waterOptions} />
      </div>
      <div>
        <FieldLabel>{n.medications}</FieldLabel>
        <TextInput value={data.medications || ''} onChange={(v) => set('medications', v)} />
      </div>
      <div>
        <FieldLabel>{n.contraceptive}</FieldLabel>
        <TextInput value={data.contraceptive || ''} onChange={(v) => set('contraceptive', v)} />
      </div>
      <div>
        <FieldLabel>{n.alcohol}</FieldLabel>
        <RadioGroup value={data.alcohol || ''} onChange={(v) => set('alcohol', v)} options={n.alcoholOptions} />
      </div>
    </div>
  )
}

// ─── Step: Saúde Emocional ────────────────────────────────────────────────────
function StepEmotional({ data, set, t }: { data: FormData; set: (k: string, v: string) => void; t: T }) {
  const e = t.anamnesisClient.emotional
  const yes = t.app.yes
  const no = t.app.no
  return (
    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel>{e.weightFeeling}</FieldLabel>
        <TextareaInput value={data.weightFeeling || ''} onChange={(v) => set('weightFeeling', v)} rows={2} />
      </div>
      <YesNo label={e.anxiety} field="anxiety" data={data} set={set} yes={yes} no={no} />
      {data.anxiety === yes && (
        <div>
          <FieldLabel>{e.anxietyTriggers}</FieldLabel>
          <TextInput value={data.anxietyTriggers || ''} onChange={(v) => set('anxietyTriggers', v)} />
        </div>
      )}
      <YesNo label={e.emotionalEating} field="emotionalEating" data={data} set={set} yes={yes} no={no} />
      <div>
        <FieldLabel>{e.bodyImage}</FieldLabel>
        <TextareaInput value={data.bodyImage || ''} onChange={(v) => set('bodyImage', v)} rows={2} />
      </div>
      <div>
        <FieldLabel>{e.sleepQuality}</FieldLabel>
        <TextInput type="number" value={data.sleepQuality || ''} onChange={(v) => set('sleepQuality', v)} placeholder="0–10" />
      </div>
      <div>
        <FieldLabel>{e.wakeUp}</FieldLabel>
        <RadioGroup value={data.wakeUp || ''} onChange={(v) => set('wakeUp', v)} options={e.wakeUpOptions} />
      </div>
      <div>
        <FieldLabel>{e.support}</FieldLabel>
        <RadioGroup value={data.support || ''} onChange={(v) => set('support', v)} options={e.supportOptions} />
      </div>
      <YesNo label={e.familySupport} field="familySupport" data={data} set={set} yes={yes} no={no} />
      <div>
        <FieldLabel>{e.changeAbility}</FieldLabel>
        <TextInput type="number" value={data.changeAbility || ''} onChange={(v) => set('changeAbility', v)} placeholder="0–10" />
      </div>
      <div>
        <FieldLabel>{e.pastAttempts}</FieldLabel>
        <TextareaInput value={data.pastAttempts || ''} onChange={(v) => set('pastAttempts', v)} />
      </div>
      <div>
        <FieldLabel>{e.dreamClothing}</FieldLabel>
        <TextareaInput value={data.dreamClothing || ''} onChange={(v) => set('dreamClothing', v)} rows={2} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function AnamnesisClientPage({ token }: { token: string }) {
  const { lang, setLang, t } = useClientLang()
  const [studentId, setStudentId] = useState<string | null>(null)
  const [studentName, setStudentName] = useState('')
  const [tokenStatus, setTokenStatus] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<FormData>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const ac = t.anamnesisClient

  useEffect(() => {
    api.getStudentByToken(token).then((res) => {
      if (res.success && res.data) {
        setStudentId(res.data.id)
        setStudentName(res.data.name)
        setTokenStatus('valid')
      } else {
        setTokenStatus('invalid')
      }
    })
  }, [token])

  const set = (k: string, v: string) => setData((prev) => ({ ...prev, [k]: v }))

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    if (!studentId) return
    setSubmitting(true)
    const res = await api.saveClientAnamnesis(studentId, {
      ...data,
      lang,
      submittedAt: new Date().toISOString(),
    })
    setSubmitting(false)
    if (res.success) setDone(true)
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (tokenStatus === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Invalid token ────────────────────────────────────────────────────────
  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-white font-semibold">{ac.invalidToken}</p>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-2xl italic uppercase text-white mb-2">{ac.success.title}</h1>
          <p className="text-text-muted text-sm leading-relaxed max-w-xs">{ac.success.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
            <span className="font-display text-xs italic font-black text-white">GP</span>
          </div>
          <span className="font-display italic text-white text-sm uppercase">GlePower</span>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  const stepKey = STEPS[currentStep]
  const stepLabel = ac.steps[stepKey]
  const isLastStep = currentStep === STEPS.length - 1

  return (
    <div className="min-h-screen bg-bg pb-12 max-w-2xl mx-auto">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur border-b border-white/8 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
              <span className="font-display text-[10px] italic font-black text-white">GP</span>
            </div>
            <p className="font-display italic text-white text-xs uppercase">GlePower</p>
          </div>
          <LangSelector lang={lang} setLang={setLang} />
        </div>

        <div className="mb-2">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">{studentName}</p>
          <p className="font-semibold text-white text-sm">{stepLabel}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${
                i <= currentStep ? 'bg-cyan-400' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <p className="text-[10px] text-text-muted mt-1 text-right">
          {currentStep + 1} / {STEPS.length}
        </p>
      </div>

      {/* Form content */}
      <div className="px-4 pt-5">
        {stepKey === 'personal'  && <StepPersonal  data={data} set={set} t={t} />}
        {stepKey === 'routine'   && <StepRoutine   data={data} set={set} t={t} />}
        {stepKey === 'physical'  && <StepPhysical  data={data} set={set} t={t} />}
        {stepKey === 'nutrition' && <StepNutrition data={data} set={set} t={t} />}
        {stepKey === 'emotional' && <StepEmotional data={data} set={set} t={t} />}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 px-4 mt-8">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-2xl border border-white/10 text-text-muted text-sm font-medium hover:bg-white/5 transition-all"
          >
            {t.app.back}
          </button>
        )}
        <button
          type="button"
          onClick={isLastStep ? handleSubmit : handleNext}
          disabled={submitting}
          className="flex-1 py-3.5 rounded-2xl bg-gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
        >
          {submitting ? t.app.saving : isLastStep ? t.app.finish : t.app.next}
        </button>
      </div>
    </div>
  )
}
