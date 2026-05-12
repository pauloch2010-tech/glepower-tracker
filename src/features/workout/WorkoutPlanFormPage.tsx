import { useEffect, useState, useCallback } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { api } from '@/shared/services/api'
import type { PlanExercise } from '@/shared/types'

// ─── Catálogo de exercícios (reutilizado do ExerciseBlock) ──────────────────
const CATALOG: Record<string, Record<string, string[]>> = {
  Superior: {
    Peito: ['Supino Reto Barra','Supino Inclinado Barra','Supino Reto Halter','Supino Inclinado Halter','Supino Declinado Barra','Crucifixo Reto','Crucifixo Inclinado','Peck Deck','Crossover Alto','Crossover Baixo','Flexão'],
    Costa: ['Puxada Frontal','Puxada Fechada','Puxada Neutra','Remada Baixa Cabo','Remada Curvada Barra','Remada Curvada Halter','Remada Unilateral','Remada Alta','Pull Over','Barra Fixa','Serrátil Máquina'],
    Ombro: ['Desenvolvimento Barra','Desenvolvimento Halter','Desenvolvimento Máquina','Elevação Lateral Halter','Elevação Lateral Cabo Unilateral','Elevação Lateral Cabo Duplo','Elevação Frontal Livre','Elevação Frontal Cabo','Crucifixo Invertido Máquina','Crucifixo Invertido Halter','Face Pull','Arnold Press','Encolhimento Ombros'],
    Bíceps: ['Rosca Direta Barra','Rosca Direta Barra W','Rosca Direta Halter','Rosca Alternada','Rosca Martelo','Rosca Concentrada','Rosca Scott','Rosca Spider','Rosca Cabo','Rosca 21'],
    Tríceps: ['Tríceps Pulley Barra','Tríceps Pulley Barra V','Tríceps Pulley Corda','Tríceps Francês Barra','Tríceps Francês Halter','Tríceps Testa','Tríceps Coice','Tríceps Mergulho','Tríceps Máquina','Tríceps Unilateral Cabo'],
    Antebraço: ['Rosca Punho Barra','Extensão Punho Barra','Rosca Punho Halter','Farmer Walk','Pronação Supinação'],
  },
  Inferior: {
    Quadríceps: ['Agachamento Livre','Agachamento Smith','Agachamento Hack','Agachamento Búlgaro','Leg Press 45°','Leg Press Horizontal','Cadeira Extensora','Afundo','Avanço','Passada','Sissy Squat'],
    Posterior: ['Stiff Barra','Stiff Halter','Mesa Flexora','Cadeira Flexora','Levantamento Terra','Leg Curl Deitado','Leg Curl em Pé','Good Morning','Ponte Isquiotibial'],
    Glúteo: ['Hip Thrust Barra','Hip Thrust Halter','Hip Thrust Máquina','Abdução Máquina','Abdução Cabo','Agachamento Sumô','Elevação Pélvica','Coice Glúteo Cabo','Coice Glúteo Máquina','Step Up','Passada Glúteo'],
    Panturrilha: ['Panturrilha em Pé','Panturrilha Sentado','Panturrilha Leg Press','Panturrilha Unilateral','Panturrilha Smith','Tibial Anterior'],
  },
  Cardio: {
    Cardio: ['Esteira','Bike','Elíptico','Corda','Burpee','Polichinelo','Jumping Jack','Sprint','Jump Squat','Mountain Climber','Boxe'],
  },
  Core: {
    Abdômen: ['Crunch','Crunch Invertido','Prancha','Prancha Lateral','Elevação de Pernas','Abdominal Infra','Russian Twist','Bicycle Crunch','Leg Raise','Ab Wheel'],
  },
}

function emptyExercise(): PlanExercise {
  return {
    id: crypto.randomUUID(),
    exerciseName: '',
    muscleGroup: '',
    subGroup: '',
    targetSets: 3,
    targetReps: '10-12',
    targetWeight: '',
    notes: '',
  }
}

export function WorkoutPlanFormPage() {
  const { state, navigate, setEditingPlan } = useSession()
  const student = state.student
  const editingId = state.editingPlanId

  const [name, setName] = useState('Treino A')
  const [description, setDescription] = useState('')
  const [exercises, setExercises] = useState<PlanExercise[]>([emptyExercise()])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!editingId)
  const [error, setError] = useState<string | null>(null)

  // Seletor de exercício inline
  const [selectorIdx, setSelectorIdx] = useState<number | null>(null)
  const [selGroup, setSelGroup] = useState<string | null>(null)
  const [selSub, setSelSub] = useState<string | null>(null)

  useEffect(() => {
    if (!editingId) return
    api.getPlan(editingId).then((res) => {
      if (res.success && res.data) {
        setName(res.data.name)
        setDescription(res.data.description ?? '')
        setExercises(res.data.exercises.length > 0 ? res.data.exercises : [emptyExercise()])
      }
      setLoading(false)
    })
  }, [editingId])

  const updateExercise = useCallback((idx: number, updates: Partial<PlanExercise>) => {
    setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, ...updates } : ex)))
  }, [])

  const removeExercise = useCallback((idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const selectExercise = (idx: number, exName: string, sub: string, group: string) => {
    updateExercise(idx, { exerciseName: exName, subGroup: sub, muscleGroup: group })
    setSelectorIdx(null)
    setSelGroup(null)
    setSelSub(null)
  }

  const handleSave = async () => {
    const validExercises = exercises.filter((e) => e.exerciseName)
    if (!validExercises.length) {
      setError('Adicione pelo menos 1 exercício')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      studentId: student!.id,
      trainerId: state.auth?.trainerId ?? '',
      name,
      description: description || undefined,
      exercises: validExercises,
      active: true,
    }

    const res = editingId
      ? await api.updatePlan(editingId, payload)
      : await api.createPlan(payload)

    setSaving(false)
    if (!res.success) {
      setError(res.error ?? 'Erro ao salvar')
      return
    }
    setEditingPlan(null)
    navigate('workout-plan-list')
  }

  if (!student) return null

  const header = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate('workout-plan-list')}
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
          {editingId ? 'Editar Treino' : 'Novo Treino'}
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

  const groups = Object.keys(CATALOG)
  const subGroups = selGroup ? Object.keys(CATALOG[selGroup]) : []
  const exerciseList = selGroup && selSub ? CATALOG[selGroup][selSub] ?? [] : []

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-4" scrollable>
        {/* Nome e descrição */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Nome do treino</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field mt-1"
              placeholder="Ex: Treino A — Peito e Tríceps"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Descrição (opcional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field mt-1"
              placeholder="Foco, observações..."
            />
          </div>
        </div>

        {/* Lista de exercícios */}
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-sm italic uppercase text-cyan-300">Exercícios</h3>

          {exercises.map((ex, idx) => (
            <Card key={ex.id} className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {ex.exerciseName ? (
                    <div>
                      <p className="text-sm font-semibold text-white truncate">{ex.exerciseName}</p>
                      <p className="text-[10px] text-text-muted">{ex.subGroup} · {ex.muscleGroup}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectorIdx(selectorIdx === idx ? null : idx)
                        setSelGroup(null)
                        setSelSub(null)
                      }}
                      className="text-sm text-primary/60 hover:text-primary"
                    >
                      Selecionar exercício...
                    </button>
                  )}
                </div>
                <div className="flex gap-1">
                  {ex.exerciseName && (
                    <button
                      onClick={() => {
                        updateExercise(idx, { exerciseName: '', muscleGroup: '', subGroup: '' })
                        setSelectorIdx(idx)
                        setSelGroup(null)
                        setSelSub(null)
                      }}
                      className="p-1 text-text-muted hover:text-white"
                      title="Trocar exercício"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => removeExercise(idx)}
                    className="p-1 text-text-muted hover:text-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Seletor de exercício inline */}
              {selectorIdx === idx && !ex.exerciseName && (
                <div className="mb-3 space-y-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {groups.map((g) => (
                      <button
                        key={g}
                        onClick={() => { setSelGroup(g === selGroup ? null : g); setSelSub(null) }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          selGroup === g
                            ? 'bg-primary text-white'
                            : 'bg-white/[0.08] text-white/60 hover:bg-white/[0.12]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  {selGroup && (
                    <div className="flex gap-1.5 flex-wrap">
                      {subGroups.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelSub(s === selSub ? null : s)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            selSub === s
                              ? 'bg-cyan-500/30 text-cyan-200'
                              : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {exerciseList.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-white/[0.08]">
                      {exerciseList.map((exName) => (
                        <button
                          key={exName}
                          onClick={() => selectExercise(idx, exName, selSub!, selGroup!)}
                          className="w-full text-left py-2.5 px-3 text-sm text-white/80 hover:bg-white/5 hover:text-white border-b border-white/5 last:border-0"
                        >
                          {exName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Configuração: séries, reps, peso */}
              {ex.exerciseName && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] uppercase text-text-muted">Séries</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={ex.targetSets || ''}
                      onChange={(e) => updateExercise(idx, { targetSets: parseInt(e.target.value) || 0 })}
                      onBlur={(e) => { if (!parseInt(e.target.value)) updateExercise(idx, { targetSets: 1 }) }}
                      onFocus={(e) => e.target.select()}
                      className="input-field mt-0.5 text-center"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-text-muted">Reps</label>
                    <input
                      value={ex.targetReps}
                      onChange={(e) => updateExercise(idx, { targetReps: e.target.value })}
                      className="input-field mt-0.5 text-center"
                      placeholder="8-12"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-text-muted">Carga</label>
                    <input
                      value={ex.targetWeight ?? ''}
                      onChange={(e) => updateExercise(idx, { targetWeight: e.target.value })}
                      className="input-field mt-0.5 text-center"
                      placeholder="kg"
                    />
                  </div>
                </div>
              )}
            </Card>
          ))}

          <button
            type="button"
            onClick={() => {
              setExercises((prev) => [...prev, emptyExercise()])
              setSelectorIdx(exercises.length)
              setSelGroup(null)
              setSelSub(null)
            }}
            className="w-full py-3 rounded-2xl border border-dashed border-white/15 text-white/40 text-sm hover:border-primary/40 hover:text-primary/60 transition-all"
          >
            + Adicionar Exercício
          </button>
        </div>

        {error && (
          <Card className="border-red-500/30 bg-red-500/10 py-3">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </Card>
        )}

        <div className="flex gap-3 pt-2 pb-8">
          <Button
            variant="secondary"
            onClick={() => navigate('workout-plan-list')}
            className="flex-1"
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Treino'}
          </Button>
        </div>
      </PageContainer>
    </AppShell>
  )
}
