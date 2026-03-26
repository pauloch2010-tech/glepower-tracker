import { useState } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Button } from '@/shared/components/ui/Button'
import type { WellnessCheckin, StressLevel } from '@/shared/types'

// ─── Slider Field ─────────────────────────────────────────────────────────────
function ScaleField({
  label,
  value,
  min,
  max,
  onChange,
  description,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  description?: string
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          {label}
        </label>
        <span className="font-display text-2xl italic text-primary">{value}</span>
      </div>
      {description && (
        <p className="text-xs text-text-muted">{description}</p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #E91E63 ${pct}%, #2E2E2E ${pct}%)`,
        }}
      />
      <div className="flex justify-between text-xs text-text-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

// ─── Stress Selector ──────────────────────────────────────────────────────────
const STRESS_OPTIONS: StressLevel[] = ['Baixo', 'Medio', 'Alto']

const stressColors: Record<StressLevel, string> = {
  Baixo: 'border-success text-success',
  Medio: 'border-warning text-warning',
  Alto: 'border-error text-error',
}

function StressField({
  value,
  onChange,
}: {
  value: StressLevel
  onChange: (v: StressLevel) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
        Nível de Stress
      </label>
      <div className="flex gap-2">
        {STRESS_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={value === opt}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-150
              ${value === opt
                ? stressColors[opt] + ' bg-surface-raised'
                : 'border-surface-overlay text-text-muted hover:border-surface-overlay'
              }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Wellness Page ────────────────────────────────────────────────────────────
const DEFAULT_WELLNESS: WellnessCheckin = {
  sleep: 3,
  nutrition: 3,
  mood: 3,
  stress: 'Medio',
  soreness: 3,
}

/**
 * Phase 1 scaffold — displays all wellness fields.
 * Full validation + UX polish in Phase 4.
 */
export function WellnessPage() {
  const { setWellness, navigate, state } = useSession()
  const [form, setForm] = useState<WellnessCheckin>(DEFAULT_WELLNESS)

  const update = <K extends keyof WellnessCheckin>(key: K, value: WellnessCheckin[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const header = (
    <div>
      <p className="text-xs text-text-muted uppercase tracking-widest">Check-in de</p>
      <h2 className="font-display text-2xl italic text-white uppercase">
        {state.student?.name ?? 'Aluno'}
      </h2>
    </div>
  )

  const handleContinue = () => {
    setWellness(form)
  }

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-6" scrollable>
        <h1 className="font-display text-3xl italic uppercase text-white">
          Como você está hoje?
        </h1>

        <ScaleField
          label="Sono"
          value={form.sleep}
          min={1}
          max={5}
          onChange={(v) => update('sleep', v)}
          description="1 = Péssimo · 5 = Excelente"
        />

        <ScaleField
          label="Nutrição"
          value={form.nutrition}
          min={1}
          max={5}
          onChange={(v) => update('nutrition', v)}
          description="1 = Péssima · 5 = Excelente"
        />

        <ScaleField
          label="Humor"
          value={form.mood}
          min={1}
          max={5}
          onChange={(v) => update('mood', v)}
          description="1 = Muito mal · 5 = Ótimo"
        />

        <StressField
          value={form.stress}
          onChange={(v) => update('stress', v)}
        />

        <ScaleField
          label="Dores musculares"
          value={form.soreness}
          min={0}
          max={10}
          onChange={(v) => update('soreness', v)}
          description="0 = Nenhuma dor · 10 = Dor intensa"
        />

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Observações (opcional)
          </label>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => update('notes', e.target.value || undefined)}
            placeholder="Algum detalhe importante..."
            rows={3}
            className="input-field resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2 pb-4">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('student-select')}
            className="flex-1"
          >
            Voltar
          </Button>
          <Button size="md" onClick={handleContinue} className="flex-1">
            Continuar
          </Button>
        </div>
      </PageContainer>
    </AppShell>
  )
}
