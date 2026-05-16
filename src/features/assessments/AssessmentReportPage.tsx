/**
 * AssessmentReportPage — relatório visual completo de UMA avaliação física.
 * Disponível desde a 1ª consulta.
 * Exporta PDF e compartilha via WhatsApp.
 */
import { useEffect, useRef, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { api } from '@/shared/services/api'
import {
  computeComposition,
  PROTOCOL_LABELS,
  classifyBmi,
  classifyWhr,
  classifyBodyFat,
} from '@/shared/utils/bodyComposition'
import type { PhysicalAssessment } from '@/shared/types'

// ─── Cores ───────────────────────────────────────────────────────────────────
const COLORS = {
  fat: '#E91E63',
  muscle: '#00E5FF',
  bone: '#7C3AED',
  residual: '#F59E0B',
  good: '#10B981',
  warn: '#F59E0B',
  bad: '#EF4444',
}

const PIE_COLORS = [COLORS.fat, COLORS.muscle, COLORS.bone, COLORS.residual]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function classColor(cls: string): string {
  if (['Excelente', 'Bom', 'Normal', 'Baixo', 'Peso Normal'].some((k) => cls.includes(k))) return 'text-emerald-400'
  if (['Média', 'Moderado', 'Sobrepeso'].some((k) => cls.includes(k))) return 'text-amber-400'
  return 'text-rose-400'
}

function calcAge(birthDate?: string): number {
  if (!birthDate) return 30
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const SKINFOLD_LABELS: Record<string, string> = {
  skinfoldSubscapular: 'Subescapular',
  skinfoldTriceps: 'Tríceps',
  skinfoldBiceps: 'Bíceps',
  skinfoldChest: 'Peitoral',
  skinfoldMidaxillary: 'Axilar Média',
  skinfoldSuprailiac: 'Supra-ilíaca',
  skinfoldAbdominal: 'Abdominal',
  skinfoldThigh: 'Coxa',
  skinfoldCalf: 'Panturrilha',
}

const CIRC_LABELS: Record<string, string> = {
  circShoulder: 'Ombro',
  circChest: 'Tórax',
  circWaist: 'Cintura',
  circAbdomen: 'Abdômen',
  circHip: 'Quadril',
  circArmRight: 'Braço D',
  circArmLeft: 'Braço E',
  circForearmRight: 'Antebraço D',
  circForearmLeft: 'Antebraço E',
  circThighRight: 'Coxa D',
  circThighLeft: 'Coxa E',
  circCalfRight: 'Panturrilha D',
  circCalfLeft: 'Panturrilha E',
}

// ─── Componente principal ────────────────────────────────────────────────────
export function AssessmentReportPage() {
  const { state, navigate } = useSession()
  const student = state.student
  const assessmentId = state.editingAssessmentId
  const [assessment, setAssessment] = useState<PhysicalAssessment | null>(null)
  const [allAssessments, setAllAssessments] = useState<PhysicalAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!student || !assessmentId) return
    Promise.all([
      api.getAssessment(assessmentId),
      api.listAssessments(student.id),
    ]).then(([aRes, allRes]) => {
      if (aRes.success && aRes.data) setAssessment(aRes.data)
      if (allRes.success && allRes.data) setAllAssessments([...allRes.data].reverse()) // cronológico
      setLoading(false)
    })
  }, [assessmentId, student])

  if (!student) return null

  const age = calcAge(student.birthDate)
  const sex = student.sex ?? 'F'

  // ─── Calcular composição ────────────────────────────────────────────────
  const comp = assessment && assessment.weightKg && assessment.heightM
    ? computeComposition({
        sex,
        ageYears: age,
        weightKg: assessment.weightKg!,
        heightM: assessment.heightM!,
        protocol: assessment.protocol,
        skinfolds: {
          subscapular: assessment.skinfoldSubscapular,
          triceps: assessment.skinfoldTriceps,
          biceps: assessment.skinfoldBiceps,
          chest: assessment.skinfoldChest,
          midaxillary: assessment.skinfoldMidaxillary,
          suprailiac: assessment.skinfoldSuprailiac,
          abdominal: assessment.skinfoldAbdominal,
          thigh: assessment.skinfoldThigh,
          calf: assessment.skinfoldCalf,
        },
        circumferences: {
          waist: assessment.circWaist,
          hip: assessment.circHip,
        },
        bones: {
          humerus: assessment.boneHumerus,
          femur: assessment.boneFemur,
          wrist: assessment.boneWrist,
        },
        activityFactor: assessment.activityFactor ?? 1.5,
      })
    : null

  // ─── Dados gráfico pizza composição ────────────────────────────────────
  const pieData = comp
    ? [
        { name: '% Gordura', value: parseFloat(comp.fatMassKg.toFixed(2)) },
        { name: 'Massa Muscular', value: parseFloat(comp.muscleMassKg.toFixed(2)) },
        { name: 'Massa Óssea', value: parseFloat(comp.boneMassKg.toFixed(2)) },
        { name: 'Residual', value: parseFloat(comp.residualMassKg.toFixed(2)) },
      ].filter((d) => d.value > 0)
    : []

  // ─── Dados gráfico dobras ────────────────────────────────────────────────
  const skinfoldData = assessment
    ? Object.entries(SKINFOLD_LABELS)
        .map(([key, label]) => ({
          label: label.split(' ')[0],
          value: (assessment as Record<string, unknown>)[key] as number | undefined,
        }))
        .filter((d) => d.value !== undefined && d.value > 0)
    : []

  // ─── Número da avaliação na sequência ──────────────────────────────────
  const assessmentNumber = allAssessments.findIndex((a) => a.id === assessmentId) + 1

  // ─── Previous assessment para delta ─────────────────────────────────────
  const prevAssessment = assessmentNumber > 1 ? allAssessments[assessmentNumber - 2] : null

  // ─── Export ─────────────────────────────────────────────────────────────
  const handleExport = async (share = false) => {
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
        useCORS: true,
      })
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const ratio = canvas.width / pw
      const pagePixels = ph * ratio
      let y = 0
      while (y < canvas.height) {
        const sliceH = Math.min(pagePixels, canvas.height - y)
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = sliceH
        sliceCanvas.getContext('2d')!.drawImage(canvas, 0, -y)
        const sliceImg = sliceCanvas.toDataURL('image/png')
        if (y > 0) pdf.addPage()
        pdf.addImage(sliceImg, 'PNG', 0, 0, pw, (sliceH / ratio))
        y += pagePixels
      }
      const filename = `avaliacao-${assessmentNumber}-${student.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
      const blob = pdf.output('blob')

      if (share && navigator.canShare?.({ files: [new File([blob], filename, { type: 'application/pdf' })] })) {
        await navigator.share({
          title: `Avaliação #${assessmentNumber} — ${student.name}`,
          text: `Aqui está sua avaliação física! 💪\n_GlePower_`,
          files: [new File([blob], filename, { type: 'application/pdf' })],
        })
      } else if (share) {
        // fallback desktop
        const phone = student.phone?.replace(/\D/g, '') ?? ''
        const text = encodeURIComponent(`Olá ${student.name.split(' ')[0]}! Aqui está sua avaliação física #${assessmentNumber} 💪`)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = filename; a.click()
        URL.revokeObjectURL(url)
        setTimeout(() => window.open(`https://wa.me/${phone ? '55' + phone : ''}?text=${text}`, '_blank'), 500)
      } else {
        pdf.save(filename)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(false)
    }
  }

  const header = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate('assessment-list')}
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
          Relatório #{assessmentNumber || '…'}
        </h1>
      </div>
    </div>
  )

  if (loading || !assessment) {
    return (
      <AppShell header={header}>
        <PageContainer className="py-4">
          <p className="text-text-muted text-center py-12">Carregando...</p>
        </PageContainer>
      </AppShell>
    )
  }

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-4" scrollable>

        {/* ── Conteúdo que vira PDF ── */}
        <div ref={reportRef} className="flex flex-col gap-4 bg-bg p-1">

          {/* Cabeçalho do relatório */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0">
              <span className="font-display text-lg italic font-black text-white">GP</span>
            </div>
            <div className="flex-1">
              <p className="font-display italic text-white uppercase tracking-wide">GlePower</p>
              <p className="text-xs text-text-muted">Avaliação Física #{assessmentNumber} · {student.name}</p>
              <p className="text-[10px] text-text-muted">
                {new Date(assessment.assessmentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                {' · '}{PROTOCOL_LABELS[assessment.protocol]}
              </p>
            </div>
          </div>

          {/* Métricas principais */}
          {comp && (
            <Card className="border-primary/20">
              <p className="text-[10px] uppercase tracking-wider text-pink-300 mb-3">Composição Corporal</p>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Peso" value={assessment.weightKg?.toFixed(1)} unit="kg" />
                <MetricCard
                  label="% Gordura"
                  value={comp.bodyFatPct.toFixed(1)}
                  unit="%"
                  cls={comp.bodyFatClass}
                  delta={prevAssessment?.bodyFatPct != null ? comp.bodyFatPct - prevAssessment.bodyFatPct : undefined}
                  deltaInvert
                />
                <MetricCard
                  label="Massa Magra"
                  value={comp.leanMassKg.toFixed(1)}
                  unit="kg"
                  delta={prevAssessment?.leanMassKg != null ? comp.leanMassKg - prevAssessment.leanMassKg : undefined}
                />
                <MetricCard
                  label="Massa Muscular"
                  value={comp.muscleMassKg.toFixed(1)}
                  unit="kg"
                  delta={prevAssessment?.muscleMassKg != null ? comp.muscleMassKg - prevAssessment.muscleMassKg : undefined}
                />
                <MetricCard label="IMC" value={comp.bmi.toFixed(1)} unit="" cls={comp.bmiClass} />
                <MetricCard
                  label="RCQ"
                  value={comp.whr?.toFixed(3)}
                  unit=""
                  cls={comp.whrClass ? classifyWhr(sex, comp.whr!) : undefined}
                />
                <MetricCard label="TMB" value={comp.bmr.toFixed(0)} unit="kcal" />
                <MetricCard label="GET" value={comp.tdee.toFixed(0)} unit="kcal" />
              </div>
              {prevAssessment && (
                <p className="text-[10px] text-text-muted mt-3 text-center">
                  ▲/▼ comparado à avaliação anterior
                </p>
              )}
            </Card>
          )}

          {/* Gráfico pizza composição corporal */}
          {pieData.length > 0 && (
            <Card className="border-violet-500/20">
              <p className="text-[10px] uppercase tracking-wider text-violet-300 mb-3">
                Composição Corporal (kg)
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name.split(' ')[0]}: ${value}kg`}
                      labelLine={false}
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(2)} kg`]}
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legenda */}
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-[10px] text-text-muted">{d.name}</span>
                    <span className="text-[10px] text-white ml-auto font-mono">{d.value}kg</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Gráfico dobras cutâneas */}
          {skinfoldData.length > 0 && (
            <Card className="border-rose-500/20">
              <p className="text-[10px] uppercase tracking-wider text-rose-300 mb-3">
                Dobras Cutâneas (mm)
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skinfoldData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="rgba(255,255,255,0.3)" style={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="label" width={68} stroke="rgba(255,255,255,0.3)" style={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(v: number) => [`${v} mm`]}
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="value" fill="#E91E63" radius={[0, 4, 4, 0]}>
                      {skinfoldData.map((_, idx) => (
                        <Cell key={idx} fill={`rgba(233,30,99,${0.4 + idx * 0.07})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-text-muted mt-2">
                Soma total: <span className="text-white font-mono">{assessment.sumSkinfolds?.toFixed(0) ?? '—'} mm</span>
              </p>
            </Card>
          )}

          {/* Perimetria */}
          {Object.keys(CIRC_LABELS).some((k) => (assessment as Record<string, unknown>)[k] != null) && (
            <Card className="border-emerald-500/20">
              <p className="text-[10px] uppercase tracking-wider text-emerald-300 mb-3">
                Perimetria (cm)
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {Object.entries(CIRC_LABELS).map(([key, label]) => {
                  const val = (assessment as Record<string, unknown>)[key] as number | undefined
                  if (val == null) return null
                  const prevVal = prevAssessment ? (prevAssessment as Record<string, unknown>)[key] as number | undefined : undefined
                  const delta = prevVal != null ? val - prevVal : undefined
                  return (
                    <div key={key} className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-[11px] text-text-muted">{label}</span>
                      <div className="flex items-center gap-1.5">
                        {delta != null && (
                          <span className={`text-[9px] font-mono ${Math.abs(delta) < 0.1 ? 'text-text-muted' : delta < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                          </span>
                        )}
                        <span className="text-[11px] text-white font-mono">{val.toFixed(1)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Classificações */}
          {comp && (
            <Card className="border-amber-500/20">
              <p className="text-[10px] uppercase tracking-wider text-amber-300 mb-3">
                Classificações
              </p>
              <div className="flex flex-col gap-2">
                <ClassRow label="IMC" value={comp.bmiClass} />
                <ClassRow label="% Gordura" value={comp.bodyFatClass} />
                {comp.whrClass && <ClassRow label="RCQ" value={comp.whrClass} />}
              </div>
              {assessment.notes && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-[10px] text-text-muted uppercase mb-1">Observações</p>
                  <p className="text-xs text-white/80">{assessment.notes}</p>
                </div>
              )}
            </Card>
          )}

          {/* Rodapé PDF */}
          <div className="text-center text-[10px] text-text-muted pt-2 pb-1">
            GlePower · Relatório gerado em {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>

        {/* Botões ação */}
        <div className="flex gap-3 pt-2 pb-8">
          <Button
            variant="secondary"
            onClick={() => handleExport(false)}
            disabled={exporting}
            className="flex-1"
          >
            {exporting ? 'Gerando...' : 'Exportar PDF'}
          </Button>
          <Button
            onClick={() => handleExport(true)}
            disabled={exporting}
            className="flex-1"
          >
            {exporting ? 'Aguarde...' : 'Enviar WhatsApp'}
          </Button>
        </div>
      </PageContainer>
    </AppShell>
  )
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────

function MetricCard({
  label, value, unit, cls, delta, deltaInvert,
}: {
  label: string
  value?: string
  unit: string
  cls?: string
  delta?: number
  deltaInvert?: boolean
}) {
  const showDelta = delta != null && Math.abs(delta) >= 0.01
  const isPositive = deltaInvert ? delta! < 0 : delta! > 0
  return (
    <div className="bg-white/[0.03] rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <div className="flex items-end gap-1.5 mt-1">
        <p className="font-mono text-xl font-bold text-white leading-none">
          {value ?? '—'}
          <span className="text-xs text-text-muted ml-0.5">{unit}</span>
        </p>
        {showDelta && (
          <span className={`text-[10px] font-mono mb-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {delta! > 0 ? '▲' : '▼'}{Math.abs(delta!).toFixed(1)}
          </span>
        )}
      </div>
      {cls && (
        <p className={`text-[10px] mt-0.5 font-medium ${classColor(cls)}`}>{cls}</p>
      )}
    </div>
  )
}

function ClassRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/5">
      <span className="text-xs text-text-muted">{label}</span>
      <span className={`text-xs font-medium ${classColor(value)}`}>{value}</span>
    </div>
  )
}
