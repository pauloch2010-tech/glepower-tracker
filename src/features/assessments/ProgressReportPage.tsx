import { useEffect, useRef, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { api } from '@/shared/services/api'
import type { PhysicalAssessment } from '@/shared/types'

type Metric = {
  key: keyof PhysicalAssessment
  label: string
  unit: string
  color: string
}

const METRICS: Metric[] = [
  { key: 'weightKg', label: 'Peso', unit: 'kg', color: '#00E5FF' },
  { key: 'bodyFatPct', label: '% Gordura', unit: '%', color: '#E91E63' },
  { key: 'leanMassKg', label: 'Massa Magra', unit: 'kg', color: '#10B981' },
  { key: 'muscleMassKg', label: 'Massa Muscular', unit: 'kg', color: '#7C3AED' },
  { key: 'bmi', label: 'IMC', unit: '', color: '#F59E0B' },
  { key: 'circWaist', label: 'Cintura', unit: 'cm', color: '#EC4899' },
  { key: 'whr', label: 'RCQ', unit: '', color: '#A78BFA' },
  { key: 'bmr', label: 'TMB', unit: 'kcal', color: '#06B6D4' },
]

export function ProgressReportPage() {
  const { state, navigate } = useSession()
  const student = state.student
  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Metric>(METRICS[0])
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!student) return
    api.listAssessments(student.id).then((res) => {
      if (res.success && res.data) {
        // Ordem cronológica (mais antiga primeiro, para gráfico de progressão)
        setAssessments([...res.data].reverse())
      }
      setLoading(false)
    })
  }, [student])

  if (!student) return null

  const chartData = assessments.map((a, idx) => ({
    name: `#${idx + 1}`,
    date: new Date(a.assessmentDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
    value: a[selected.key] as number | undefined,
  }))

  const handleExportPDF = async () => {
    if (!reportRef.current) return
    setExporting(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`avaliacao-${student.name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(false)
    }
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
        <h1 className="font-display text-xl italic uppercase text-white">Progressão</h1>
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

  if (assessments.length < 2) {
    return (
      <AppShell header={header}>
        <PageContainer className="py-4">
          <Card className="py-12 text-center">
            <p className="text-text-muted">
              São necessárias pelo menos 2 avaliações para gerar progressão.
            </p>
          </Card>
        </PageContainer>
      </AppShell>
    )
  }

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-4" scrollable>
        <div ref={reportRef} className="flex flex-col gap-4 p-2 bg-bg">
          <div className="flex items-center gap-3 pb-2 border-b border-white/10">
            <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center">
              <span className="font-display text-sm italic font-black text-white">GP</span>
            </div>
            <div>
              <p className="font-display italic text-white text-sm uppercase">GlePower</p>
              <p className="text-[10px] text-text-muted">
                Relatório de evolução — {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Seletor de métrica */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {METRICS.map((m) => (
              <button
                key={m.key as string}
                onClick={() => setSelected(m)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                  selected.key === m.key
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
                    : 'bg-white/[0.04] border-white/10 text-text-muted'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Gráfico */}
          <Card className="py-4">
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
              {selected.label} ({selected.unit})
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.4)"
                    style={{ fontSize: 10 }}
                  />
                  <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={selected.color}
                    strokeWidth={2.5}
                    dot={{ fill: selected.color, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Tabela comparativa */}
          <Card>
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
              Comparativo
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="text-text-muted">
                    <th className="text-left py-1 font-normal">Métrica</th>
                    {assessments.map((_, idx) => (
                      <th key={idx} className="text-right py-1 font-normal">
                        #{idx + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((m) => (
                    <tr key={m.key as string} className="border-t border-white/5">
                      <td className="py-1.5 text-text-muted">{m.label}</td>
                      {assessments.map((a, idx) => {
                        const v = a[m.key] as number | undefined
                        return (
                          <td key={idx} className="text-right py-1.5 text-white">
                            {v !== undefined ? v.toFixed(1) : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Button onClick={handleExportPDF} disabled={exporting} className="mb-8">
          {exporting ? 'Gerando PDF...' : '📄 Exportar PDF para o aluno'}
        </Button>
      </PageContainer>
    </AppShell>
  )
}
