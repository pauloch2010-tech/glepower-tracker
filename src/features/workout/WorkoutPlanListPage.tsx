import { useEffect, useState } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { api } from '@/shared/services/api'
import type { WorkoutPlan, WorkoutExecution } from '@/shared/types'

export function WorkoutPlanListPage() {
  const { state, navigate, setEditingPlan, setEditingExecution } = useSession()
  const student = state.student
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [executions, setExecutions] = useState<WorkoutExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'plans' | 'history'>('plans')

  useEffect(() => {
    if (!student) return
    setLoading(true)
    Promise.all([api.listPlans(student.id), api.listExecutions(student.id)]).then(
      ([pRes, eRes]) => {
        if (pRes.success && pRes.data) setPlans(pRes.data)
        if (eRes.success && eRes.data) setExecutions(eRes.data)
        setLoading(false)
      },
    )
  }, [student])

  if (!student) return null

  const activePlans = plans.filter((p) => p.active)
  const inProgressExec = executions.find((e) => e.status === 'in_progress')

  const handleNewPlan = () => {
    setEditingPlan(null)
    navigate('workout-plan-form')
  }

  const handleEditPlan = (id: string) => {
    setEditingPlan(id)
    navigate('workout-plan-form')
  }

  const handleStartExecution = async (plan: WorkoutPlan) => {
    const exec = await api.createExecution({
      planId: plan.id,
      studentId: student.id,
      trainerId: state.auth?.trainerId ?? '',
      date: new Date().toISOString().split('T')[0],
      exercises: plan.exercises.map((ex) => ({
        exerciseId: ex.id,
        exerciseName: ex.exerciseName,
        muscleGroup: ex.muscleGroup,
        subGroup: ex.subGroup,
        targetReps: ex.targetReps,
        targetWeight: ex.targetWeight,
        sets: Array.from({ length: ex.targetSets }, () => ({
          id: crypto.randomUUID(),
          reps: null,
          weight: null,
          completed: false,
        })),
        notes: ex.notes,
      })),
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    })
    if (exec.success && exec.data) {
      setEditingExecution(exec.data.id)
      navigate('workout-execution')
    }
  }

  const handleContinueExecution = (id: string) => {
    setEditingExecution(id)
    navigate('workout-execution')
  }

  const handleDeletePlan = async (id: string) => {
    await api.deletePlan(id)
    setPlans((prev) => prev.filter((p) => p.id !== id))
  }

  const header = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate('student-detail')}
        className="p-1 -ml-1 text-text-muted hover:text-white"
        aria-label="Voltar"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-text-muted">{student.name}</p>
        <h1 className="font-display text-xl italic uppercase text-white">Treinos</h1>
      </div>
    </div>
  )

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-4" scrollable>
        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setTab('plans')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'plans'
                ? 'bg-primary text-white shadow-[0_0_12px_rgba(233,30,99,0.4)]'
                : 'text-text-muted hover:text-white'
            }`}
          >
            Planos ({activePlans.length})
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'history'
                ? 'bg-primary text-white shadow-[0_0_12px_rgba(233,30,99,0.4)]'
                : 'text-text-muted hover:text-white'
            }`}
          >
            Historico ({executions.length})
          </button>
        </div>

        {/* Treino em andamento */}
        {inProgressExec && (
          <Card className="border-amber-500/30 bg-amber-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400 uppercase tracking-wider font-medium">Em andamento</p>
                <p className="text-sm text-white mt-1">
                  {new Date(inProgressExec.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleContinueExecution(inProgressExec.id)}
              >
                Continuar
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <p className="text-text-muted text-center py-12">Carregando...</p>
        ) : tab === 'plans' ? (
          <>
            {activePlans.length === 0 ? (
              <Card className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-text-muted text-sm">Nenhum treino cadastrado</p>
                <p className="text-text-muted text-xs mt-1">Crie o primeiro plano de treino</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {activePlans.map((plan) => {
                  const totalExercises = plan.exercises.length
                  const totalSets = plan.exercises.reduce((a, e) => a + e.targetSets, 0)
                  return (
                    <Card key={plan.id} className="relative">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{plan.name}</h3>
                          {plan.description && (
                            <p className="text-xs text-text-muted mt-0.5">{plan.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditPlan(plan.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3 text-xs text-text-muted mb-3">
                        <span>{totalExercises} exerc.</span>
                        <span>{totalSets} series</span>
                      </div>

                      {/* Lista resumida de exercícios */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {plan.exercises.slice(0, 6).map((ex) => (
                          <span
                            key={ex.id}
                            className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-text-muted"
                          >
                            {ex.exerciseName}
                          </span>
                        ))}
                        {plan.exercises.length > 6 && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-text-muted">
                            +{plan.exercises.length - 6}
                          </span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleStartExecution(plan)}
                        disabled={!!inProgressExec}
                        className="w-full"
                      >
                        Iniciar Treino
                      </Button>
                    </Card>
                  )
                })}
              </div>
            )}

            <Button variant="secondary" onClick={handleNewPlan} className="w-full">
              + Novo Plano de Treino
            </Button>
          </>
        ) : (
          /* Histórico de execuções */
          <>
            {executions.length === 0 ? (
              <Card className="py-12 text-center">
                <p className="text-text-muted text-sm">Nenhum treino executado ainda</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {executions.map((exec, idx) => {
                  const totalSets = exec.exercises.reduce((a, e) => a + e.sets.length, 0)
                  const completedSets = exec.exercises.reduce(
                    (a, e) => a + e.sets.filter((s) => s.completed).length,
                    0,
                  )
                  const totalVolume = exec.exercises.reduce(
                    (a, e) =>
                      a + e.sets.reduce((sa, s) => sa + (s.weight ?? 0) * (s.reps ?? 0), 0),
                    0,
                  )
                  const isCompleted = exec.status === 'completed'

                  return (
                    <Card key={exec.id} className={isCompleted ? 'border-emerald-500/20' : 'border-amber-500/20'}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            #{executions.length - idx}
                          </span>
                          <span className="text-xs text-text-muted">
                            {new Date(exec.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider ${
                          isCompleted ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {isCompleted ? 'Concluido' : 'Em andamento'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div>
                          <p className="text-[10px] uppercase text-text-muted">Exerc.</p>
                          <p className="font-mono text-sm text-white">{exec.exercises.length}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-text-muted">Séries</p>
                          <p className="font-mono text-sm text-white">{completedSets}/{totalSets}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-text-muted">Volume</p>
                          <p className="font-mono text-sm text-white">{totalVolume > 0 ? `${totalVolume.toFixed(0)}kg` : '—'}</p>
                        </div>
                      </div>

                      {/* Painel de desempenho */}
                      {isCompleted && (() => {
                        const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
                        const allRpes = exec.exercises.flatMap((e) =>
                          e.sets.filter((s) => s.completed && s.rpe).map((s) => s.rpe as number),
                        )
                        const avgRpe = allRpes.length > 0
                          ? Math.round(allRpes.reduce((a, b) => a + b, 0) / allRpes.length)
                          : null
                        const scoreColor = pct >= 90 ? 'text-emerald-400' : pct >= 70 ? 'text-amber-400' : 'text-rose-400'
                        const barColor = pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                        return (
                          <div className="mt-1 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-[10px] uppercase tracking-wider text-text-muted">Desempenho</p>
                              <div className="flex items-center gap-2">
                                {avgRpe !== null && (
                                  <span className="text-[10px] text-text-muted">
                                    RPE médio: <span className="text-white font-mono">{avgRpe}/10</span>
                                  </span>
                                )}
                                <span className={`text-sm font-bold font-mono ${scoreColor}`}>{pct}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })()}

                      {!isCompleted && (
                        <Button
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => handleContinueExecution(exec.id)}
                        >
                          Continuar
                        </Button>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </PageContainer>
    </AppShell>
  )
}
