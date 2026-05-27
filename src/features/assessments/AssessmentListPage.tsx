import { useEffect, useState } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { api } from '@/shared/services/api'
import { PROTOCOL_LABELS } from '@/shared/utils/bodyComposition'
import type { PhysicalAssessment } from '@/shared/types'

export function AssessmentListPage() {
  const { state, navigate, setEditingAssessment } = useSession()
  const student = state.student
  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student) return
    api.listAssessments(student.id).then((res) => {
      if (res.success && res.data) setAssessments(res.data)
      setLoading(false)
    })
  }, [student])

  if (!student) return null

  const handleNew = () => {
    setEditingAssessment(null)
    navigate('assessment-form')
  }

  const handleViewReport = (id: string) => {
    setEditingAssessment(id)
    navigate('assessment-report')
  }

  const handleEdit = (id: string) => {
    setEditingAssessment(id)
    navigate('assessment-form')
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
        <h1 className="font-display text-xl italic uppercase text-white">Avaliações Físicas</h1>
      </div>
    </div>
  )

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-3" scrollable>
        {loading ? (
          <p className="text-text-muted text-center py-12">Carregando...</p>
        ) : assessments.length === 0 ? (
          <Card className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className="text-sm text-text-muted">Nenhuma avaliação realizada ainda.</p>
            <Button onClick={handleNew} size="sm">
              Realizar primeira avaliação
            </Button>
          </Card>
        ) : (
          <>
            {/* Botão de evolução física — disponível a partir da 1ª avaliação */}
            <button
              onClick={() => navigate('progress-report')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Ver Evolução Física</p>
                  <p className="text-[11px] text-text-muted">
                    {assessments.length === 1
                      ? 'Snapshot da avaliação atual'
                      : `Comparativo de ${assessments.length} avaliações`}
                  </p>
                </div>
              </div>
              <svg className="w-4 h-4 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {assessments.map((a, idx) => {
                const total = assessments.length
                const number = total - idx
                return (
                  <Card key={a.id} className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-display text-lg italic font-black text-pink-300">
                          #{number}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">
                          {new Date(a.assessmentDate).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {PROTOCOL_LABELS[a.protocol]}
                        </p>
                        <div className="flex gap-3 mt-1.5 font-mono text-[11px]">
                          <span className="text-text-muted">
                            Peso <span className="text-white">{a.weightKg?.toFixed(1) ?? '—'}kg</span>
                          </span>
                          <span className="text-text-muted">
                            %G <span className="text-white">{a.bodyFatPct?.toFixed(1) ?? '—'}%</span>
                          </span>
                          <span className="text-text-muted">
                            IMC <span className="text-white">{a.bmi?.toFixed(1) ?? '—'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewReport(a.id!)}
                        className="flex-1 py-2 rounded-xl bg-primary/10 border border-primary/20 text-pink-300 text-xs font-medium hover:bg-primary/20 transition-all"
                      >
                        Ver Relatório
                      </button>
                      <button
                        onClick={() => handleEdit(a.id!)}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-text-muted text-xs hover:bg-white/10 transition-all"
                      >
                        Editar
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>

            <Button onClick={handleNew} className="mt-2 mb-8">
              + Nova avaliação
            </Button>
          </>
        )}
      </PageContainer>
    </AppShell>
  )
}
