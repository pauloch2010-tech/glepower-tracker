import { useEffect, useRef, useState } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { useLang } from '@/shared/i18n/LangContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { api } from '@/shared/services/api'
import { whatsappUrl } from '@/shared/utils/phone'
import type { Anamnesis } from '@/shared/types'

const APP_URL = window.location.origin

const CLINICAL_FIELDS: Array<{ key: keyof Anamnesis; label: string }> = [
  { key: 'familyDiseases', label: 'Doenças na família nos últimos anos?' },
  { key: 'personalDiseases', label: 'Doenças pessoais nos últimos anos?' },
  { key: 'exerciseRestrictions', label: 'Restrição à prática de exercícios físicos?' },
  { key: 'surgeries', label: 'Foi submetido(a) a alguma cirurgia?' },
  { key: 'allergies', label: 'Possui algum tipo de alergia?' },
  { key: 'injuries', label: 'Sofreu acidente ou lesão osteo-muscular?' },
  { key: 'medications', label: 'Utiliza algum medicamento?' },
  { key: 'bodyPains', label: 'Sente dores no corpo ultimamente?' },
  { key: 'smoking', label: 'Tem ou teve o hábito de fumar?' },
  { key: 'diet', label: 'Está em dieta para perder/ganhar peso?' },
  { key: 'currentExercise', label: 'Pratica algum exercício físico atualmente?' },
  { key: 'activityType', label: 'Qual atividade?' },
  { key: 'frequency', label: 'Frequência semanal?' },
]

const PARQ_FIELDS: Array<{ key: keyof Anamnesis; label: string }> = [
  { key: 'parqHeart', label: 'Algum médico já disse que você tem problema de coração e só deveria fazer atividade física supervisionada?' },
  { key: 'parqChestPain', label: 'Você sente dores no peito quando pratica atividade física?' },
  { key: 'parqChestPainMonth', label: 'No último mês, sentiu dores no peito durante atividade física?' },
  { key: 'parqDizziness', label: 'Apresenta desequilíbrio por tontura ou perda de consciência?' },
  { key: 'parqBoneJoint', label: 'Possui problema ósseo/articular que poderia piorar com atividade física?' },
  { key: 'parqBloodPressureMed', label: 'Toma medicamento para pressão arterial ou coração?' },
  { key: 'parqOtherReason', label: 'Sabe de outra razão pela qual não deve fazer atividade física?' },
]

// ─── Client section field maps (mirrors AnamnesisClientPage keys) ─────────────
type ClientSectionField = { key: string; type?: 'text' | 'yesno' | 'desc' }
type ClientSection = {
  id: 'personal' | 'routine' | 'physical' | 'nutrition' | 'emotional'
  fields: ClientSectionField[]
}

const CLIENT_SECTIONS: ClientSection[] = [
  {
    id: 'personal',
    fields: [
      { key: 'name' }, { key: 'surname' }, { key: 'email' }, { key: 'whatsapp' },
      { key: 'birthDate' }, { key: 'profession' }, { key: 'gender' }, { key: 'city' },
      { key: 'height' }, { key: 'weight' }, { key: 'goal' }, { key: 'goalEvent' },
    ],
  },
  {
    id: 'routine',
    fields: [
      { key: 'trainingDays' }, { key: 'trainingTime' }, { key: 'bestTime' },
      { key: 'selfCareTime' }, { key: 'weekendHabits' },
    ],
  },
  {
    id: 'physical',
    fields: [
      { key: 'practices' }, { key: 'frequency' }, { key: 'hadPersonal' },
      { key: 'equipment' }, { key: 'limitation' }, { key: 'limitationDesc' },
      { key: 'surgery' }, { key: 'surgeryDesc' }, { key: 'medicalRelease' },
      { key: 'diseases' }, { key: 'diseasesDesc' }, { key: 'familyHistory' },
      { key: 'familyHistoryDesc' }, { key: 'smoking' },
    ],
  },
  {
    id: 'nutrition',
    fields: [
      { key: 'meals' }, { key: 'skips' }, { key: 'dailyFood' }, { key: 'weekendFood' },
      { key: 'hungerTime' }, { key: 'favorites' }, { key: 'avoided' },
      { key: 'restriction' }, { key: 'restrictionDesc' }, { key: 'water' },
      { key: 'medications' }, { key: 'contraceptive' }, { key: 'alcohol' },
    ],
  },
  {
    id: 'emotional',
    fields: [
      { key: 'weightFeeling' }, { key: 'anxiety' }, { key: 'anxietyTriggers' },
      { key: 'emotionalEating' }, { key: 'bodyImage' }, { key: 'sleepQuality' },
      { key: 'wakeUp' }, { key: 'support' }, { key: 'familySupport' },
      { key: 'changeAbility' }, { key: 'pastAttempts' }, { key: 'dreamClothing' },
    ],
  },
]

export function AnamnesisFormPage() {
  const { state, navigate } = useSession()
  const { t } = useLang()
  const student = state.student
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Anamnesis>>({})
  const [linkCopied, setLinkCopied] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!student) return
    api.getAnamnesis(student.id).then((res) => {
      if (res.success && res.data) setForm(res.data)
      setLoading(false)
    })
    // Limpa flag de pending review ao abrir
    api.clearPendingReview(student.id).catch(() => {})
  }, [student])

  if (!student) return null

  const setField = (key: keyof Anamnesis, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const parqHasYes = PARQ_FIELDS.some((f) => form[f.key] === true)
  const clientData = (form.clientData ?? {}) as Record<string, string>
  const clientHasFilled = !!form.clientSubmittedAt

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const res = await api.saveAnamnesis({ ...form, studentId: student.id })
    setSaving(false)
    if (!res.success) {
      setError(res.error ?? 'Erro ao salvar')
      return
    }
    navigate('student-detail')
  }

  const handleGenerateLink = async () => {
    if (!student) return
    const res = await api.ensureAnamnesisToken(student.id)
    if (!res.success || !res.data) return
    const url = `${APP_URL}/?token=${res.data}`
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch {
      setGeneratedLink(url)
    }
  }

  const handleSendWhatsApp = async () => {
    if (!student?.phone) return
    const res = await api.ensureAnamnesisToken(student.id)
    if (!res.success || !res.data) return
    const url = `${APP_URL}/?token=${res.data}`
    const msg = `Olá ${student.name.split(' ')[0]}! Por favor preencha sua anamnese: ${url}`
    window.open(whatsappUrl(student.phone, msg), '_blank')
  }

  const isEditing = !!form.id

  const handleExportPDF = async () => {
    if (!printRef.current) return
    setExporting(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(printRef.current, { backgroundColor: '#0a0a0a', scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const w = pdf.internal.pageSize.getWidth()
      const h = (canvas.height * w) / canvas.width
      if (h > pdf.internal.pageSize.getHeight()) {
        let y = 0
        const pageH = pdf.internal.pageSize.getHeight()
        const sliceH = Math.floor((pageH / h) * canvas.height)
        while (y < canvas.height) {
          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width = canvas.width
          sliceCanvas.height = Math.min(sliceH, canvas.height - y)
          sliceCanvas.getContext('2d')!.drawImage(canvas, 0, -y)
          const sliceImg = sliceCanvas.toDataURL('image/png')
          if (y > 0) pdf.addPage()
          const slicePdfH = (sliceCanvas.height * w) / sliceCanvas.width
          pdf.addImage(sliceImg, 'PNG', 0, 0, w, slicePdfH)
          y += sliceH
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, w, h)
      }
      const filename = `anamnese-${student!.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
      const blob = pdf.output('blob')

      if (navigator.canShare?.({ files: [new File([blob], filename, { type: 'application/pdf' })] })) {
        const file = new File([blob], filename, { type: 'application/pdf' })
        await navigator.share({
          title: `Anamnese - ${student!.name}`,
          text: `Anamnese clínica de ${student!.name} - GlePower`,
          files: [file],
        })
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => (step === 1 ? navigate('student-detail') : setStep((step - 1) as 1 | 2 | 3))}
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
            Anamnese · {step}/3
          </h1>
        </div>
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

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-4" scrollable>
        {/* Progress bar */}
        <div className="flex gap-1">
          <div className="flex-1 h-1 rounded-full bg-cyan-400" />
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-cyan-400' : 'bg-white/10'}`} />
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 3 ? 'bg-cyan-400' : 'bg-white/10'}`} />
        </div>

        {/* ───────────── Step 1: Cliente ───────────── */}
        {step === 1 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg italic uppercase text-cyan-300">
                Respostas do Cliente
              </h2>
              {clientHasFilled && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold">
                  Recebido
                </span>
              )}
            </div>

            {!clientHasFilled ? (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">Cliente ainda não preencheu</p>
                    <p className="text-xs text-text-muted mt-1">
                      Envie o link e ele(a) responde diretamente — perguntas sobre rotina,
                      atividade física, alimentação e saúde emocional.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="secondary" onClick={handleGenerateLink}>
                    {linkCopied ? '✓ Copiado' : '📋 Copiar link'}
                  </Button>
                  {student.phone && (
                    <Button size="sm" onClick={handleSendWhatsApp}>
                      WhatsApp
                    </Button>
                  )}
                </div>

                {generatedLink && (
                  <div className="mt-3 p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                      Toque e segure para copiar:
                    </p>
                    <p className="text-xs text-cyan-300 break-all font-mono select-all">
                      {generatedLink}
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs text-text-muted -mt-2">
                  <span>📅 {new Date(form.clientSubmittedAt!).toLocaleString('pt-BR')}</span>
                  {form.clientLang && (
                    <span className="px-1.5 py-0.5 rounded bg-white/10 uppercase font-mono text-[10px]">
                      {form.clientLang}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  {CLIENT_SECTIONS.map((section) => {
                    const sectionData = section.fields
                      .map((f) => ({ key: f.key, value: clientData[f.key] }))
                      .filter((f) => f.value !== undefined && f.value !== '')
                    if (sectionData.length === 0) return null

                    const sectionTitle = t.anamnesisClient.steps[section.id]
                    const sectionLabels = (t.anamnesisClient as unknown as Record<string, Record<string, string>>)[section.id] ?? {}

                    return (
                      <Card key={section.id}>
                        <h3 className="font-semibold text-cyan-300 text-sm uppercase tracking-wider mb-3">
                          {sectionTitle}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                          {sectionData.map(({ key, value }) => (
                            <div key={key} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                              <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">
                                {sectionLabels[key] ?? key}
                              </p>
                              <p className="text-sm text-white whitespace-pre-wrap">{value}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}

            <Button onClick={() => setStep(2)} className="w-full mt-2">
              Continuar → Anamnese Clínica
            </Button>
          </>
        )}

        {/* ───────────── Step 2: Anamnese Clínica ───────────── */}
        {step === 2 && (
          <>
            <h2 className="font-display text-lg italic uppercase text-cyan-300">
              Anamnese Clínica
            </h2>
            <p className="text-xs text-text-muted -mt-2">Preenchido pela personal durante consulta</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              {CLINICAL_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted">{label}</label>
                  <textarea
                    value={(form[key] as string) ?? ''}
                    onChange={(e) => setField(key, e.target.value)}
                    rows={2}
                    className="input-field resize-none"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-2">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continuar → PAR-Q
              </Button>
            </div>
          </>
        )}

        {/* ───────────── Step 3: PAR-Q ───────────── */}
        {step === 3 && (
          <>
            <h2 className="font-display text-lg italic uppercase text-cyan-300">PAR-Q</h2>
            <p className="text-xs text-text-muted">
              Questionário de Prontidão para Atividade Física
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              {PARQ_FIELDS.map(({ key, label }) => {
                const value = form[key] === true
                return (
                  <Card key={key} className="py-3">
                    <p className="text-sm text-white mb-2.5 leading-snug">{label}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setField(key, false)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                          form[key] === false
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-white/[0.04] border-white/10 text-text-muted'
                        }`}
                      >
                        Não
                      </button>
                      <button
                        onClick={() => setField(key, true)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                          value
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : 'bg-white/[0.04] border-white/10 text-text-muted'
                        }`}
                      >
                        Sim
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs text-text-muted">Observações</label>
              <textarea
                value={form.parqObservations ?? ''}
                onChange={(e) => setField('parqObservations', e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="Observações adicionais..."
              />
            </div>

            {parqHasYes && (
              <Card className="border-rose-500/40 bg-rose-500/10">
                <p className="text-sm text-rose-200">
                  ⚠️ <strong>Atenção:</strong> Foi respondido SIM a pelo menos uma pergunta do
                  PAR-Q. Recomenda-se <strong>liberação médica</strong> antes de iniciar o
                  programa de exercícios.
                </p>
              </Card>
            )}

            {error && (
              <Card className="border-red-500/30 bg-red-500/10 py-3">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </Card>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setStep(2)}
                className="flex-1"
                disabled={saving}
              >
                Voltar
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Anamnese'}
              </Button>
            </div>

            {isEditing && (
              <Button
                variant="secondary"
                onClick={handleExportPDF}
                disabled={exporting}
                className="w-full mb-4"
              >
                {exporting ? 'Gerando...' : 'Exportar PDF / Enviar'}
              </Button>
            )}

            {/* Print-ready summary (hidden, used for PDF) */}
            <div className="fixed -left-[9999px] top-0">
              <div ref={printRef} className="w-[800px] bg-[#0a0a0a] p-8 text-white">
                <div className="flex items-center gap-4 pb-4 border-b border-white/10 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
                    <span className="font-bold text-xl text-white">GP</span>
                  </div>
                  <div>
                    <p className="font-bold text-lg">GlePower — Anamnese</p>
                    <p className="text-sm text-white/60">
                      {student!.name} · {new Date().toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {clientHasFilled && (
                  <>
                    <h3 className="text-cyan-300 font-bold text-sm uppercase tracking-wider mb-4">
                      Respostas do Cliente
                    </h3>
                    {CLIENT_SECTIONS.map((section) => {
                      const sectionData = section.fields
                        .map((f) => ({ key: f.key, value: clientData[f.key] }))
                        .filter((f) => f.value !== undefined && f.value !== '')
                      if (sectionData.length === 0) return null
                      const sectionTitle = t.anamnesisClient.steps[section.id]
                      const sectionLabels = (t.anamnesisClient as unknown as Record<string, Record<string, string>>)[section.id] ?? {}
                      return (
                        <div key={section.id} className="mb-6">
                          <p className="text-white/80 font-semibold text-xs uppercase tracking-wider mb-2">
                            {sectionTitle}
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {sectionData.map(({ key, value }) => (
                              <div key={key} className="border-b border-white/5 pb-1.5">
                                <p className="text-[10px] text-white/50">{sectionLabels[key] ?? key}</p>
                                <p className="text-sm">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}

                <h3 className="text-cyan-300 font-bold text-sm uppercase tracking-wider mb-4">
                  Dados Clínicos
                </h3>
                <div className="grid grid-cols-1 gap-3 mb-8">
                  {CLINICAL_FIELDS.map(({ key, label }) => (
                    <div key={key} className="border-b border-white/5 pb-2">
                      <p className="text-xs text-white/50 mb-0.5">{label}</p>
                      <p className="text-sm">{(form[key] as string) || '—'}</p>
                    </div>
                  ))}
                </div>

                <h3 className="text-cyan-300 font-bold text-sm uppercase tracking-wider mb-4">
                  PAR-Q — Questionário de Prontidão
                </h3>
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {PARQ_FIELDS.map(({ key, label }) => (
                    <div key={key} className="flex items-start gap-3 border-b border-white/5 pb-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          form[key] === true
                            ? 'bg-rose-500/30 text-rose-300'
                            : 'bg-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        {form[key] === true ? 'SIM' : 'NÃO'}
                      </span>
                      <p className="text-sm flex-1">{label}</p>
                    </div>
                  ))}
                </div>

                {parqHasYes && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 mb-4">
                    <p className="text-sm text-rose-200">
                      ATENÇÃO: Respostas SIM no PAR-Q. Recomenda-se liberação médica.
                    </p>
                  </div>
                )}

                {form.parqObservations && (
                  <div>
                    <p className="text-xs text-white/50 mb-1">Observações</p>
                    <p className="text-sm">{form.parqObservations}</p>
                  </div>
                )}

                <div className="mt-8 pt-4 border-t border-white/10 text-center text-xs text-white/30">
                  Gerado por GlePower · {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            <div className="pb-4" />
          </>
        )}
      </PageContainer>
    </AppShell>
  )
}
