import { useState } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { useToast } from '@/shared/components/feedback/Toast'
import { api } from '@/shared/services/api'
import { saveSessions } from '@/features/progress/useProgressData'
import type { SavedSession } from '@/features/progress/useProgressData'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card, CardHeader, CardBody } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'

// ─── Wellness Summary ─────────────────────────────────────────────────────────
function WellnessSummary() {
  const { state } = useSession()
  const w = state.wellness
  if (!w) return null

  const stressColor = {
    Baixo: 'success',
    Medio: 'warning',
    Alto: 'error',
  } as const

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-text-secondary uppercase text-xs tracking-widest">
          Check-in de Bem-estar
        </h3>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-text-muted">Sono</p>
            <p className="font-semibold text-white">{w.sleep}/5</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Nutrição</p>
            <p className="font-semibold text-white">{w.nutrition}/5</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Humor</p>
            <p className="font-semibold text-white">{w.mood}/5</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Dores</p>
            <p className="font-semibold text-white">{w.soreness}/10</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-text-muted">Stress:</span>
          <Badge variant={stressColor[w.stress]} size="sm" dot>
            {w.stress}
          </Badge>
        </div>

        {w.notes && (
          <p className="mt-2 text-xs text-text-secondary italic">{w.notes}</p>
        )}
      </CardBody>
    </Card>
  )
}

// ─── Exercise Summary ─────────────────────────────────────────────────────────
function ExerciseSummary() {
  const { state } = useSession()
  const exercises = state.workout?.exercises ?? []

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-text-secondary uppercase text-xs tracking-widest">
          Exercícios ({exercises.length})
        </h3>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-4">
          {exercises.map((ex) => {
            const completed = ex.sets.filter((s) => s.completed).length
            return (
              <div key={ex.exerciseId} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{ex.exerciseName}</p>
                  <Badge variant="secondary" size="sm">
                    {ex.muscleGroup}
                  </Badge>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {ex.sets.map((set, i) => (
                    <div
                      key={set.id}
                      className={`px-2 py-1 rounded-lg text-xs font-mono
                        ${set.completed
                          ? 'bg-success/20 text-success'
                          : 'bg-surface text-text-muted'
                        }`}
                    >
                      {i + 1}: {set.reps ?? '—'}× {set.weight ?? '—'}kg
                    </div>
                  ))}
                </div>

                {completed < ex.sets.length && (
                  <p className="text-xs text-warning">
                    {ex.sets.length - completed} série(s) não concluída(s)
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}

// ─── Review Page ──────────────────────────────────────────────────────────────
export function ReviewPage() {
  const { state, navigate, logout } = useSession()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)

  const saveToLocalStorage = () => {
    if (!state.workout) return
    try {
      const key = `gle_sessions_${state.workout.studentId}`
      let existing: SavedSession[] = []
      try {
        existing = JSON.parse(localStorage.getItem(key) ?? '[]')
      } catch { existing = [] }

      const session: SavedSession = {
        id: state.workout.id,
        studentId: state.workout.studentId,
        date: state.workout.date,
        exercises: state.workout.exercises
          .filter((ex) => ex.exerciseName)
          .map((ex) => ({
            exerciseName: ex.exerciseName,
            muscleGroup: ex.muscleGroup,
            subGroup: ex.subGroup ?? '',
            sets: ex.sets
              .filter((s) => s.completed)
              .map((s) => ({
                reps: s.reps?.toString() ?? '',
                weight: s.weight?.toString() ?? '',
              })),
          })),
      }
      saveSessions(state.workout.studentId, [...existing, session])
    } catch {
      // falha silenciosa — dados já enviados ao GAS
    }
  }

  const handleSave = async () => {
    if (!state.workout) return
    setSaving(true)
    saveToLocalStorage()

    try {
      const res = await api.saveSession(state.workout)

      if (res.success) {
        showToast('Treino salvo com sucesso! 💪', 'success')
      } else {
        showToast('Treino salvo localmente. Sincronizará quando online.', 'warning')
      }

      navigate('success')
    } catch {
      showToast('Erro inesperado. Dados guardados localmente.', 'error')
      navigate('success')
    } finally {
      setSaving(false)
    }
  }

  const totalExercises = state.workout?.exercises.length ?? 0
  const totalSets = state.workout?.exercises.reduce((a, ex) => a + ex.sets.length, 0) ?? 0
  const completedSets = state.workout?.exercises.reduce(
    (a, ex) => a + ex.sets.filter((s) => s.completed).length,
    0,
  ) ?? 0

  const header = (
    <div>
      <p className="text-xs text-text-muted uppercase tracking-widest">Revisão —</p>
      <h2 className="font-display text-2xl italic text-white uppercase">
        {state.student?.name ?? 'Aluno'}
      </h2>
    </div>
  )

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-4" scrollable>
        <h1 className="font-display text-3xl italic uppercase text-white">
          Resumo do Treino
        </h1>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card variant="raised" className="text-center">
            <p className="font-display text-3xl italic text-primary">{totalExercises}</p>
            <p className="text-xs text-text-muted mt-1">Exercícios</p>
          </Card>
          <Card variant="raised" className="text-center">
            <p className="font-display text-3xl italic text-primary">{completedSets}</p>
            <p className="text-xs text-text-muted mt-1">Séries feitas</p>
          </Card>
          <Card variant="raised" className="text-center">
            <p className="font-display text-3xl italic text-primary">
              {totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0}%
            </p>
            <p className="text-xs text-text-muted mt-1">Conclusão</p>
          </Card>
        </div>

        <WellnessSummary />
        <ExerciseSummary />

        {/* Actions */}
        <div className="flex gap-3 pt-2 pb-6">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('workout')}
            disabled={saving}
            className="flex-1"
          >
            Editar
          </Button>
          <Button
            size="md"
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? <Spinner size="sm" /> : 'Salvar'}
          </Button>
        </div>

        <button
          type="button"
          onClick={logout}
          disabled={saving}
          className="text-xs text-text-muted text-center w-full pb-4 hover:text-text-secondary transition-colors"
        >
          Encerrar sessão
        </button>
      </PageContainer>
    </AppShell>
  )
}
