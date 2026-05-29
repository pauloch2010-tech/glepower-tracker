import { useEffect, useState, useMemo } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { api } from '@/shared/services/api'
import type { WorkoutPlan, WorkoutExecution, TrainingCycle, CycleSummary } from '@/shared/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS_PT = ['D','S','T','Q','Q','S','S']

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function calcSummary(execs: WorkoutExecution[]): CycleSummary {
  const maxLoadByExercise: Record<string, number> = {}
  let totalVolumeKg = 0

  execs.forEach((e) => {
    e.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        const vol = (s.weight ?? 0) * (s.reps ?? 0)
        totalVolumeKg += vol
        if ((s.weight ?? 0) > 0) {
          maxLoadByExercise[ex.exerciseName] = Math.max(
            maxLoadByExercise[ex.exerciseName] ?? 0,
            s.weight ?? 0,
          )
        }
      })
    })
  })

  return { sessionsCompleted: execs.length, totalVolumeKg, maxLoadByExercise }
}

function filterExecsByCycle(execs: WorkoutExecution[], cycle: TrainingCycle | null) {
  if (!cycle) return []
  return execs.filter((e) => {
    if (e.date < cycle.startDate) return false
    if (cycle.endDate && e.date > cycle.endDate) return false
    return true
  })
}

// ─── Mini Calendar ──────────────────────────────────────────────────────────────

interface MiniCalendarProps {
  year: number
  month: number
  execDates: Set<string>
  startDate: string
  endDate: string | null
  onPrev: () => void
  onNext: () => void
  onDayClick: (date: string) => void
  selectedDate: string | null
}

function MiniCalendar({ year, month, execDates, startDate, endDate, onPrev, onNext, onDayClick, selectedDate }: MiniCalendarProps) {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="bg-white/5 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrev}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-white">
          {MONTHS_PT[month]} {year}
        </span>
        <button
          onClick={onNext}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS_PT.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-text-muted pb-1 font-medium">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dateStr = toDateStr(year, month, day)
          const hasExec = execDates.has(dateStr)
          const inCycle = dateStr >= startDate && (!endDate || dateStr <= endDate)
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === today()

          return (
            <button
              key={day}
              onClick={() => onDayClick(dateStr)}
              className={`
                relative h-8 w-full flex items-center justify-center rounded-full text-xs transition-all
                ${inCycle && !hasExec ? 'bg-primary/10' : ''}
                ${hasExec ? 'bg-primary text-white font-bold shadow-[0_0_8px_rgba(233,30,99,0.5)]' : inCycle ? 'text-white/70' : 'text-text-muted'}
                ${isSelected ? 'ring-2 ring-white' : ''}
                ${isToday && !hasExec ? 'ring-1 ring-primary/50' : ''}
                hover:bg-primary/20
              `}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-[10px] text-text-muted">Treino realizado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary/10 border border-primary/30" />
          <span className="text-[10px] text-text-muted">Período do ciclo</span>
        </div>
      </div>
    </div>
  )
}

// ─── Comparison Card ──────────────────────────────────────────────────────────

function ComparisonRow({ label, curr, prev }: { label: string; curr: number; prev: number | undefined }) {
  const diff = prev !== undefined ? curr - prev : null
  const pct = prev !== undefined && prev > 0 ? ((curr - prev) / prev) * 100 : null
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-text-muted truncate max-w-[40%]">{label}</span>
      <div className="flex items-center gap-3">
        {prev !== undefined && (
          <span className="text-xs text-text-muted font-mono">{prev.toFixed(0)}kg</span>
        )}
        <span className="text-xs text-white font-mono font-bold">{curr.toFixed(0)}kg</span>
        {diff !== null && pct !== null && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${diff >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────────────

export function CycleCalendarPage() {
  const { state, navigate } = useSession()
  const student = state.student
  const planId = state.editingPlanId

  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [cycles, setCycles] = useState<TrainingCycle[]>([])
  const [allPlanExecs, setAllPlanExecs] = useState<WorkoutExecution[]>([])
  const [selectedCycleIdx, setSelectedCycleIdx] = useState(0)
  const [viewMonth, setViewMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // New cycle form state
  const [newName, setNewName] = useState('')
  const [newStart, setNewStart] = useState(today())
  const [newEnd, setNewEnd] = useState('')

  useEffect(() => {
    if (!planId || !student) return
    setLoading(true)
    Promise.all([
      api.getPlan(planId),
      api.listCycles(planId),
      api.listExecutions(student.id),
    ]).then(([planRes, cyclesRes, execsRes]) => {
      if (planRes.success && planRes.data) setPlan(planRes.data)

      const sorted = [...(cyclesRes.data ?? [])].sort((a, b) => b.cycleNumber - a.cycleNumber)
      setCycles(sorted)

      const planExecs = (execsRes.data ?? []).filter(
        (e) => e.planId === planId && e.status === 'completed',
      )
      setAllPlanExecs(planExecs)

      // Navigate calendar to start of latest cycle
      if (sorted.length > 0) {
        const d = new Date(sorted[0].startDate)
        setViewMonth(d)
      }

      setLoading(false)
    })
  }, [planId, student])

  const selectedCycle = cycles[selectedCycleIdx] ?? null
  const prevCycle = cycles[selectedCycleIdx + 1] ?? null

  const cycleExecs = useMemo(() => filterExecsByCycle(allPlanExecs, selectedCycle), [allPlanExecs, selectedCycle])
  const prevCycleExecs = useMemo(() => filterExecsByCycle(allPlanExecs, prevCycle), [allPlanExecs, prevCycle])

  const cycleSummary = useMemo(() => calcSummary(cycleExecs), [cycleExecs])
  const prevSummary = useMemo(() => (prevCycle ? calcSummary(prevCycleExecs) : null), [prevCycle, prevCycleExecs])

  const execDateSet = useMemo(() => new Set(cycleExecs.map((e) => e.date)), [cycleExecs])

  // Executions on the selected day
  const dayExecs = useMemo(
    () => (selectedDate ? cycleExecs.filter((e) => e.date === selectedDate) : []),
    [cycleExecs, selectedDate],
  )

  const handlePrevMonth = () => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const handleNextMonth = () => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const handleCreateCycle = async () => {
    if (!planId || !student || !newName.trim()) return
    setSaving(true)
    const nextNum = Math.max(0, ...cycles.map((c) => c.cycleNumber)) + 1
    const res = await api.createCycle({
      studentId: student.id,
      planId,
      cycleNumber: nextNum,
      name: newName.trim(),
      startDate: newStart,
      endDate: newEnd || null,
      status: 'active',
      summary: null,
    })
    if (res.success && res.data) {
      setCycles((prev) => [res.data!, ...prev])
      setSelectedCycleIdx(0)
      setViewMonth(new Date(newStart))
      setShowNewForm(false)
      setNewName('')
      setNewStart(today())
      setNewEnd('')
    }
    setSaving(false)
  }

  const handleCloseCycle = async () => {
    if (!selectedCycle || selectedCycle.status === 'completed') return
    const summary = calcSummary(cycleExecs)
    const endDate = selectedCycle.endDate ?? today()
    setSaving(true)
    const res = await api.closeCycle(selectedCycle.id, endDate, summary)
    if (res.success && res.data) {
      setCycles((prev) => prev.map((c) => (c.id === selectedCycle.id ? res.data! : c)))
    }
    setSaving(false)
  }

  const header = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate('workout-plan-list')}
        className="p-1 -ml-1 text-text-muted hover:text-white"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-text-muted">
          {student?.name} • {plan?.name ?? '...'}
        </p>
        <h1 className="font-display text-xl italic uppercase text-white">Ciclos de Treino</h1>
      </div>
    </div>
  )

  if (!planId || !student) return null

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-4" scrollable>
        {loading ? (
          <p className="text-text-muted text-center py-12">Carregando...</p>
        ) : (
          <>
            {/* Cycle Selector */}
            {cycles.length > 0 ? (
              <Card className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCycleIdx((i) => Math.min(i + 1, cycles.length - 1))}
                    disabled={selectedCycleIdx >= cycles.length - 1}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-text-muted hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="text-center flex-1">
                    <p className="text-xs text-text-muted">Ciclo {selectedCycleIdx + 1} de {cycles.length}</p>
                    <p className="text-sm font-semibold text-white">{selectedCycle?.name}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {selectedCycle?.startDate && new Date(selectedCycle.startDate).toLocaleDateString('pt-BR')}
                      {' → '}
                      {selectedCycle?.endDate
                        ? new Date(selectedCycle.endDate).toLocaleDateString('pt-BR')
                        : <span className="text-emerald-400">em aberto</span>}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedCycleIdx((i) => Math.max(i - 1, 0))}
                    disabled={selectedCycleIdx <= 0}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-text-muted hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Status badge */}
                <div className="flex justify-center mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium ${
                    selectedCycle?.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/10 text-text-muted'
                  }`}>
                    {selectedCycle?.status === 'active' ? 'Ativo' : 'Concluído'}
                  </span>
                </div>
              </Card>
            ) : (
              <Card className="py-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-text-muted text-sm">Nenhum ciclo criado ainda</p>
                <p className="text-text-muted text-xs mt-1">Crie o primeiro ciclo para começar a acompanhar</p>
              </Card>
            )}

            {/* Calendar */}
            {selectedCycle && (
              <MiniCalendar
                year={viewMonth.getFullYear()}
                month={viewMonth.getMonth()}
                execDates={execDateSet}
                startDate={selectedCycle.startDate}
                endDate={selectedCycle.endDate}
                onPrev={handlePrevMonth}
                onNext={handleNextMonth}
                onDayClick={setSelectedDate}
                selectedDate={selectedDate}
              />
            )}

            {/* Day Detail */}
            {selectedDate && dayExecs.length > 0 && (
              <Card>
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
                  {new Date(selectedDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {dayExecs.map((exec) => {
                  const vol = exec.exercises.reduce(
                    (a, ex) => a + ex.sets.reduce((sa, s) => sa + (s.weight ?? 0) * (s.reps ?? 0), 0),
                    0,
                  )
                  return (
                    <div key={exec.id}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-white font-medium">{exec.exercises.length} exercícios</span>
                        <span className="text-primary font-mono">{vol.toFixed(0)} kg volume</span>
                      </div>
                      <div className="space-y-1">
                        {exec.exercises.map((ex) => {
                          const maxLoad = Math.max(0, ...ex.sets.map((s) => s.weight ?? 0))
                          return (
                            <div key={ex.exerciseId} className="flex justify-between text-xs text-text-muted">
                              <span>{ex.exerciseName}</span>
                              <span className="font-mono">{maxLoad > 0 ? `${maxLoad}kg × ${ex.sets.length}s` : `${ex.sets.length} séries`}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </Card>
            )}

            {/* Summary Stats */}
            {selectedCycle && (
              <Card>
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-3">Resumo do Ciclo</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-text-muted">Sessões</p>
                    <p className="text-xl font-bold font-mono text-white mt-0.5">{cycleSummary.sessionsCompleted}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted">Volume Total</p>
                    <p className="text-xl font-bold font-mono text-white mt-0.5">
                      {cycleSummary.totalVolumeKg >= 1000
                        ? `${(cycleSummary.totalVolumeKg / 1000).toFixed(1)}t`
                        : `${cycleSummary.totalVolumeKg.toFixed(0)}kg`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted">Exercícios</p>
                    <p className="text-xl font-bold font-mono text-white mt-0.5">
                      {Object.keys(cycleSummary.maxLoadByExercise).length}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Exercise Comparison */}
            {selectedCycle && Object.keys(cycleSummary.maxLoadByExercise).length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Carga Máxima por Exercício</p>
                  {prevCycle && (
                    <span className="text-[10px] text-text-muted">vs {prevCycle.name}</span>
                  )}
                </div>
                {Object.entries(cycleSummary.maxLoadByExercise).map(([name, load]) => (
                  <ComparisonRow
                    key={name}
                    label={name}
                    curr={load}
                    prev={prevSummary?.maxLoadByExercise[name]}
                  />
                ))}
                {prevCycle && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-muted">Volume total</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-muted font-mono">
                          {prevSummary && prevSummary.totalVolumeKg >= 1000
                            ? `${(prevSummary.totalVolumeKg / 1000).toFixed(1)}t`
                            : `${prevSummary?.totalVolumeKg.toFixed(0) ?? '—'}kg`}
                        </span>
                        <span className="text-xs text-white font-mono font-bold">
                          {cycleSummary.totalVolumeKg >= 1000
                            ? `${(cycleSummary.totalVolumeKg / 1000).toFixed(1)}t`
                            : `${cycleSummary.totalVolumeKg.toFixed(0)}kg`}
                        </span>
                        {prevSummary && (() => {
                          const diff = cycleSummary.totalVolumeKg - prevSummary.totalVolumeKg
                          const pct = prevSummary.totalVolumeKg > 0 ? (diff / prevSummary.totalVolumeKg) * 100 : 0
                          return (
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${diff >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                              {diff >= 0 ? '+' : ''}{pct.toFixed(0)}%
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {selectedCycle?.status === 'active' && (
                <Button
                  variant="secondary"
                  onClick={handleCloseCycle}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? 'Encerrando...' : 'Encerrar Ciclo'}
                </Button>
              )}

              {showNewForm ? (
                <Card className="border-primary/30">
                  <p className="text-xs font-semibold text-white mb-3">Novo Ciclo</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase text-text-muted block mb-1">Nome do ciclo</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ex: Ciclo 2 — Glúteo"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-text-muted/50 focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase text-text-muted block mb-1">Início</label>
                        <input
                          type="date"
                          value={newStart}
                          onChange={(e) => setNewStart(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-text-muted block mb-1">Fim (opcional)</label>
                        <input
                          type="date"
                          value={newEnd}
                          onChange={(e) => setNewEnd(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="secondary" onClick={() => setShowNewForm(false)} className="flex-1">Cancelar</Button>
                    <Button onClick={handleCreateCycle} disabled={!newName.trim() || saving} className="flex-1">
                      {saving ? 'Salvando...' : 'Criar Ciclo'}
                    </Button>
                  </div>
                </Card>
              ) : (
                <Button onClick={() => setShowNewForm(true)} className="w-full">
                  + Novo Ciclo
                </Button>
              )}
            </div>
          </>
        )}
      </PageContainer>
    </AppShell>
  )
}
