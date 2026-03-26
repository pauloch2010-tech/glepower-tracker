import { useState, useCallback } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Button } from '@/shared/components/ui/Button'
import { ExerciseBlock, newExercise } from './ExerciseBlock'
import type { WorkoutExercise as EBExercise } from './ExerciseBlock'
import type { WorkoutSession } from '@/shared/types'

export function WorkoutPage() {
  const { navigate, state, setWorkout } = useSession()
  const [exercises, setExercises] = useState<EBExercise[]>(() => [newExercise()])

  const updateExercise = useCallback((index: number, updated: EBExercise) => {
    setExercises((prev) => prev.map((ex, i) => (i === index ? updated : ex)))
  }, [])

  const removeExercise = useCallback((index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addExercise = useCallback(() => {
    setExercises((prev) => [...prev, newExercise()])
  }, [])

  const handleFinish = () => {
    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      studentId: state.student?.id ?? '',
      trainerId: state.auth?.trainerId ?? '',
      date: new Date().toISOString().split('T')[0],
      startedAt: new Date().toISOString(),
      wellness: state.wellness!,
      exercises: exercises.map((ex) => ({
        exerciseId: ex.id,
        exerciseName: ex.exerciseName,
        muscleGroup: ex.muscleGroup,
        subGroup: ex.subGroup,
        notes: ex.notes || undefined,
        sets: ex.sets.map((s) => ({
          id: s.id,
          reps: s.reps ? parseInt(s.reps, 10) : null,
          weight: s.weight ? parseFloat(s.weight) : null,
          rpe: s.rpe ? parseInt(s.rpe, 10) : undefined,
          completed: s.completed,
        })),
      })),
      status: 'draft',
    }
    setWorkout(session)
    navigate('review')
  }

  // ── Stats para o header ──
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
  const completedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0,
  )
  const totalVolumeKg = exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets.reduce((sacc, s) => {
        const w = parseFloat(s.weight) || 0
        const r = parseInt(s.reps, 10) || 0
        return sacc + w * r
      }, 0),
    0,
  )

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-text-muted uppercase tracking-widest">Treino de</p>
        <h2 className="font-display text-2xl italic text-white uppercase">
          {state.student?.name ?? 'Aluno'}
        </h2>
      </div>
      <div className="flex flex-col items-end gap-0.5 text-right">
        <p className="text-xs text-text-muted">
          {exercises.length} ex · {completedSets}/{totalSets} séries
        </p>
        {totalVolumeKg > 0 && (
          <p className="text-sm font-bold text-primary">
            {totalVolumeKg.toFixed(0)} kg
          </p>
        )}
      </div>
    </div>
  )

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-4" scrollable>
        {/* Lista de exercícios */}
        <div className="flex flex-col gap-4">
          {exercises.map((ex, i) => (
            <ExerciseBlock
              key={ex.id}
              exercise={ex}
              index={i}
              onUpdate={(updated) => updateExercise(i, updated)}
              onRemove={() => removeExercise(i)}
            />
          ))}
        </div>

        {/* Botão adicionar exercício */}
        <button
          type="button"
          onClick={addExercise}
          className="w-full py-3 rounded-2xl border border-dashed border-white/15 text-white/40 text-sm hover:border-primary/40 hover:text-primary/60 transition-all"
        >
          + Adicionar Exercício
        </button>

        {/* Ações */}
        <div className="flex gap-3 pt-2 pb-6">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('wellness')}
            className="flex-1"
          >
            Voltar
          </Button>
          <Button size="md" onClick={handleFinish} className="flex-1">
            Revisar
          </Button>
        </div>
      </PageContainer>
    </AppShell>
  )
}
