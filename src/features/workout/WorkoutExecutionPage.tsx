import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { api } from '@/shared/services/api'
import type { WorkoutExecution, ExecutionExercise, ExecutionSet } from '@/shared/types'

export function WorkoutExecutionPage() {
  const { state, navigate } = useSession()
  const student = state.student
  const executionId = state.editingExecutionId
  const [execution, setExecution] = useState<WorkoutExecution | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeExIdx, setActiveExIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!executionId) return
    api.listExecutions(student?.id ?? '').then((res) => {
      if (res.success && res.data) {
        const found = res.data.find((e) => e.id === executionId)
        if (found) {
          setExecution(found)
          // Calcular tempo decorrido desde início
          const started = new Date(found.startedAt).getTime()
          setElapsed(Math.floor((Date.now() - started) / 1000))
        }
      }
      setLoading(false)
    })
  }, [executionId, student?.id])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const updateSet = useCallback(
    (exIdx: number, setIdx: number, updates: Partial<ExecutionSet>) => {
      setExecution((prev) => {
        if (!prev) return prev
        const newExercises = prev.exercises.map((ex, ei) => {
          if (ei !== exIdx) return ex
          return {
            ...ex,
            sets: ex.sets.map((s, si) => (si === setIdx ? { ...s, ...updates } : s)),
          }
        })
        return { ...prev, exercises: newExercises }
      })
    },
    [],
  )

  const toggleSetCompleted = useCallback(
    (exIdx: number, setIdx: number) => {
      setExecution((prev) => {
        if (!prev) return prev
        const newExercises = prev.exercises.map((ex, ei) => {
          if (ei !== exIdx) return ex
          return {
            ...ex,
            sets: ex.sets.map((s, si) =>
              si === setIdx ? { ...s, completed: !s.completed } : s,
            ),
          }
        })
        return { ...prev, exercises: newExercises }
      })
    },
    [],
  )

  const addSet = useCallback((exIdx: number) => {
    setExecution((prev) => {
      if (!prev) return prev
      const newExercises = prev.exercises.map((ex, ei) => {
        if (ei !== exIdx) return ex
        return {
          ...ex,
          sets: [...ex.sets, { id: crypto.randomUUID(), reps: null, weight: null, completed: false }],
        }
      })
      return { ...prev, exercises: newExercises }
    })
  }, [])

  const handleSaveProgress = async () => {
    if (!execution) return
    setSaving(true)
    await api.updateExecution(execution.id, {
      exercises: execution.exercises,
      status: 'in_progress',
    })
    setSaving(false)
  }

  const handleFinish = async () => {
    if (!execution) return
    setSaving(true)
    const res = await api.updateExecution(execution.id, {
      exercises: execution.exercises,
      status: 'completed',
      completedAt: new Date().toISOString(),
    })
    setSaving(false)
    if (res.success) {
      navigate('workout-plan-list')
    }
  }

  if (!student) return null

  const totalSets = execution?.exercises.reduce((a, e) => a + e.sets.length, 0) ?? 0
  const completedSets = execution?.exercises.reduce(
    (a, e) => a + e.sets.filter((s) => s.completed).length,
    0,
  ) ?? 0
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0
  const totalVolume = execution?.exercises.reduce(
    (a, e) => a + e.sets.reduce((sa, s) => sa + (s.weight ?? 0) * (s.reps ?? 0), 0),
    0,
  ) ?? 0

  const header = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            handleSaveProgress()
            navigate('workout-plan-list')
          }}
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
          <h1 className="font-display text-lg italic uppercase text-white">Executando</h1>
        </div>
      </div>
      <div className="flex flex-col items-end text-right">
        <span className="font-mono text-lg text-primary font-bold">{formatTime(elapsed)}</span>
        <span className="text-[10px] text-text-muted">
          {completedSets}/{totalSets} · {totalVolume > 0 ? `${totalVolume.toFixed(0)}kg` : ''}
        </span>
      </div>
    </div>
  )

  if (loading || !execution) {
    return (
      <AppShell header={header}>
        <PageContainer className="py-4">
          <p className="text-text-muted text-center py-12">Carregando...</p>
        </PageContainer>
      </AppShell>
    )
  }

  const activeEx = execution.exercises[activeExIdx]

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-4" scrollable>
        {/* Barra de progresso */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Seletor de exercício */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {execution.exercises.map((ex, idx) => {
            const done = ex.sets.every((s) => s.completed)
            const partial = ex.sets.some((s) => s.completed)
            return (
              <button
                key={ex.exerciseId}
                onClick={() => setActiveExIdx(idx)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                  activeExIdx === idx
                    ? 'bg-primary/20 border-primary/40 text-white'
                    : done
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : partial
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-white/[0.04] border-white/10 text-text-muted'
                }`}
              >
                {done ? '✓ ' : ''}{idx + 1}
              </button>
            )
          })}
        </div>

        {/* Exercício ativo */}
        {activeEx && (
          <ExerciseExecCard
            exercise={activeEx}
            exIdx={activeExIdx}
            onToggleSet={toggleSetCompleted}
            onUpdateSet={updateSet}
            onAddSet={addSet}
          />
        )}

        {/* Navegação entre exercícios */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveExIdx(Math.max(0, activeExIdx - 1))}
            disabled={activeExIdx === 0}
            className="flex-1"
          >
            ← Anterior
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveExIdx(Math.min(execution.exercises.length - 1, activeExIdx + 1))}
            disabled={activeExIdx === execution.exercises.length - 1}
            className="flex-1"
          >
            Próximo →
          </Button>
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-4 pb-8">
          <Button
            variant="secondary"
            onClick={handleSaveProgress}
            className="flex-1"
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Progresso'}
          </Button>
          <Button
            onClick={handleFinish}
            className="flex-1"
            disabled={saving}
          >
            Finalizar Treino
          </Button>
        </div>
      </PageContainer>
    </AppShell>
  )
}

// ─── Subcomponente: Card do exercício em execução ───────────────────────────

function ExerciseExecCard({
  exercise,
  exIdx,
  onToggleSet,
  onUpdateSet,
  onAddSet,
}: {
  exercise: ExecutionExercise
  exIdx: number
  onToggleSet: (exIdx: number, setIdx: number) => void
  onUpdateSet: (exIdx: number, setIdx: number, updates: Partial<ExecutionSet>) => void
  onAddSet: (exIdx: number) => void
}) {
  const completedCount = exercise.sets.filter((s) => s.completed).length

  return (
    <Card className="border-primary/20">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">{exercise.exerciseName}</h3>
          <p className="text-xs text-text-muted">
            {exercise.subGroup} · {exercise.muscleGroup}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm text-primary font-bold">
            {completedCount}/{exercise.sets.length}
          </p>
          <p className="text-[10px] text-text-muted">séries</p>
        </div>
      </div>

      {/* Meta do treino */}
      <div className="flex gap-3 mb-3 text-xs">
        <span className="px-2 py-1 rounded-md bg-primary/10 text-pink-300">
          {exercise.targetReps} reps
        </span>
        {exercise.targetWeight && (
          <span className="px-2 py-1 rounded-md bg-violet-500/10 text-violet-300">
            {exercise.targetWeight}
          </span>
        )}
      </div>

      {/* Cabeçalho colunas */}
      <div className="flex items-center gap-2 mb-1 px-1">
        <div className="w-9" />
        <div className="flex-1 text-[10px] text-white/30 uppercase tracking-wider">Reps</div>
        <div className="flex-1 text-[10px] text-white/30 uppercase tracking-wider">Peso (kg)</div>
        <div className="w-14 text-[10px] text-white/30 uppercase tracking-wider">RPE</div>
      </div>

      {/* Séries */}
      {exercise.sets.map((set, si) => (
        <div
          key={set.id}
          className={`flex items-center gap-2 py-2 border-b border-white/5 last:border-0 transition-all ${
            set.completed ? 'opacity-60' : ''
          }`}
        >
          <button
            onClick={() => onToggleSet(exIdx, si)}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              set.completed
                ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-white/10 text-white/60'
            }`}
          >
            {set.completed ? '✓' : si + 1}
          </button>

          <div className="flex-1">
            <input
              type="number"
              inputMode="numeric"
              placeholder="—"
              value={set.reps ?? ''}
              onChange={(e) =>
                onUpdateSet(exIdx, si, { reps: e.target.value ? parseInt(e.target.value) : null })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>

          <div className="flex-1">
            <input
              type="number"
              inputMode="decimal"
              placeholder="—"
              value={set.weight ?? ''}
              onChange={(e) =>
                onUpdateSet(exIdx, si, {
                  weight: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>

          <div className="w-14">
            <input
              type="number"
              inputMode="numeric"
              placeholder="—"
              min={1}
              max={10}
              value={set.rpe ?? ''}
              onChange={(e) =>
                onUpdateSet(exIdx, si, { rpe: e.target.value ? parseInt(e.target.value) : undefined })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/60 transition-colors text-center"
            />
          </div>
        </div>
      ))}

      <button
        onClick={() => onAddSet(exIdx)}
        className="mt-3 w-full py-2 rounded-xl border border-dashed border-white/15 text-white/40 text-xs hover:border-primary/40 hover:text-primary/60 transition-all"
      >
        + Adicionar série
      </button>
    </Card>
  )
}
