import { useEffect, useState } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { api } from '@/shared/services/api'
import type { Anamnesis, PhysicalAssessment } from '@/shared/types'

export function StudentDetailPage() {
  const { state, navigate, setEditingStudent, setEditingAssessment } = useSession()
  const student = state.student
  const [anamnesis, setAnamnesis] = useState<Anamnesis | null>(null)
  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student) return
    setLoading(true)
    Promise.all([api.getAnamnesis(student.id), api.listAssessments(student.id)]).then(
      ([aRes, asRes]) => {
        if (aRes.success) setAnamnesis(aRes.data ?? null)
        if (asRes.success && asRes.data) setAssessments(asRes.data)
        setLoading(false)
      },
    )
  }, [student])

  if (!student) return null

  const initials = student.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')

  const hasAnamnesis = !!anamnesis
  const latestAssessment = assessments[0]
  const canCreateAssessment = hasAnamnesis // regra: anamnese obrigatória antes da 1ª avaliação

  const handleStartWorkout = () => navigate('wellness')
  const handleEditStudent = () => {
    setEditingStudent(student)
    navigate('student-form')
  }

  const header = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate('student-select')}
        className="p-1 -ml-1 text-text-muted hover:text-white"
        aria-label="Voltar"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="font-display text-2xl italic uppercase text-white">Aluno</h1>
    </div>
  )

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-4" scrollable>
        {/* Card identidade */}
        <Card className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
            <span className="font-display text-2xl italic font-black text-white">
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-lg truncate">{student.name}</p>
            {student.level && (
              <p className="text-xs text-text-muted uppercase tracking-widest mt-0.5">
                {student.level}
              </p>
            )}
            {student.goal && (
              <p className="text-xs text-text-muted mt-0.5 truncate">{student.goal}</p>
            )}
          </div>
          <button
            onClick={handleEditStudent}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors"
            aria-label="Editar aluno"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </Card>

        {/* 4 módulos */}
        <div className="grid grid-cols-2 gap-3">
          {/* Anamnese */}
          <button
            onClick={() => navigate('anamnesis')}
            className="relative flex flex-col items-start gap-2 p-4 rounded-2xl border border-white/10 bg-gradient-to-br from-rose-500/10 to-rose-500/[0.02] hover:border-rose-500/40 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-semibold text-white text-sm">Anamnese</p>
            <p className="text-[11px] text-text-muted leading-tight">
              {loading ? '...' : hasAnamnesis ? 'Preenchida' : 'Pendente'}
            </p>
            {!loading && !hasAnamnesis && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            )}
          </button>

          {/* Avaliações */}
          <button
            onClick={() => navigate('assessment-list')}
            disabled={!canCreateAssessment && assessments.length === 0}
            className="relative flex flex-col items-start gap-2 p-4 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-cyan-500/[0.02] hover:border-cyan-500/40 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className="font-semibold text-white text-sm">Avaliações</p>
            <p className="text-[11px] text-text-muted leading-tight">
              {loading ? '...' : `${assessments.length} ${assessments.length === 1 ? 'realizada' : 'realizadas'}`}
            </p>
          </button>

          {/* Treinos */}
          <button
            onClick={handleStartWorkout}
            className="relative flex flex-col items-start gap-2 p-4 rounded-2xl border border-white/10 bg-gradient-to-br from-primary/15 to-primary/[0.02] hover:border-primary/40 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="font-semibold text-white text-sm">Iniciar Treino</p>
            <p className="text-[11px] text-text-muted leading-tight">Wellness + workout</p>
          </button>

          {/* Progressão */}
          <button
            onClick={() => navigate('progress-report')}
            disabled={assessments.length === 0}
            className="relative flex flex-col items-start gap-2 p-4 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-violet-500/[0.02] hover:border-violet-500/40 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <p className="font-semibold text-white text-sm">Progressão</p>
            <p className="text-[11px] text-text-muted leading-tight">
              {assessments.length < 2 ? 'Precisa 2+ avaliações' : 'Ver gráficos'}
            </p>
          </button>
        </div>

        {/* Alerta anamnese obrigatória */}
        {!loading && !hasAnamnesis && (
          <Card className="border-amber-500/30 bg-amber-500/10">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-xs text-amber-200">
                <strong>Anamnese obrigatória</strong> antes da 1ª avaliação física. Preencha para liberar.
              </div>
            </div>
          </Card>
        )}

        {/* Resumo última avaliação */}
        {latestAssessment && (
          <Card className="border-cyan-500/20 bg-cyan-500/[0.03]">
            <p className="text-xs uppercase tracking-widest text-cyan-300 mb-2">
              Última avaliação
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Peso" value={latestAssessment.weightKg} unit="kg" />
              <Metric label="% Gordura" value={latestAssessment.bodyFatPct} unit="%" />
              <Metric label="IMC" value={latestAssessment.bmi} unit="" />
            </div>
            <p className="text-[10px] text-text-muted mt-3 text-center">
              {new Date(latestAssessment.assessmentDate).toLocaleDateString('pt-BR')}
            </p>
          </Card>
        )}

        <div className="pt-2 pb-8">
          <Button
            variant="secondary"
            onClick={() => {
              setEditingAssessment(null)
              navigate(canCreateAssessment ? 'assessment-form' : 'anamnesis')
            }}
            className="w-full"
          >
            {hasAnamnesis ? '+ Nova avaliação física' : '+ Preencher anamnese'}
          </Button>
        </div>
      </PageContainer>
    </AppShell>
  )
}

function Metric({ label, value, unit }: { label: string; value?: number; unit: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="font-mono text-lg font-bold text-white mt-1">
        {value?.toFixed(1) ?? '—'}
        <span className="text-xs text-text-muted ml-0.5">{unit}</span>
      </p>
    </div>
  )
}
