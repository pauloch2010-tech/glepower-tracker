import { useState, useEffect } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { useLang } from '@/shared/i18n/LangContext'
import type { Lang } from '@/shared/i18n/translations'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'
import { api } from '@/shared/services/api'
import { whatsappUrl } from '@/shared/utils/phone'
import type { Student } from '@/shared/types'

const APP_URL = window.location.origin

function StudentCard({
  student,
  isSelected,
  onSelect,
}: {
  student: Student
  isSelected: boolean
  onSelect: () => void
}) {
  const initials = student.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')

  return (
    <Card
      pressable
      onClick={onSelect}
      className={`flex items-center gap-4 transition-all ${
        isSelected
          ? 'border-primary/60 bg-primary/[0.08] shadow-[0_0_12px_rgba(233,30,99,0.2)]'
          : ''
      }`}
      aria-label={`Selecionar ${student.name}`}
      aria-pressed={isSelected}
    >
      <div className="w-12 h-12 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
        <span className="font-display text-lg italic font-black text-white">{initials}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{student.name}</p>
        {student.lastSession && (
          <p className="text-xs text-text-muted mt-0.5">
            Último treino: {new Date(student.lastSession).toLocaleDateString('pt-BR')}
          </p>
        )}
        {student.goal && (
          <p className="text-xs text-text-muted mt-0.5 truncate">{student.goal}</p>
        )}
        {student.phone && (
          <p className="text-xs text-text-muted mt-0.5 truncate">{student.phone}</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        {student.anamnesisPendingReview && (
          <span
            className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 uppercase tracking-wider"
            title="Cliente respondeu anamnese — aguardando revisão"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Nova anamnese
          </span>
        )}
        {student.level && (
          <Badge variant={isSelected ? 'primary' : 'secondary'} size="sm">
            {student.level}
          </Badge>
        )}
      </div>
    </Card>
  )
}

export function StudentSelectPage() {
  const { selectStudent, setEditingStudent, navigate, logout, state } = useSession()
  const { lang, setLang } = useLang()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)

  const loadStudents = () => {
    setLoading(true)
    api.getStudents().then((res) => {
      if (res.success && res.data) setStudents(res.data)
      setLoading(false)
    })
  }

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    setSelectedStudent(null)
  }, [search])

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleStartWorkout = () => {
    if (!selectedStudent) return
    selectStudent(selectedStudent)
  }

  const handleViewProgress = () => {
    if (!selectedStudent) return
    selectStudent(selectedStudent)
    navigate('progress')
  }

  const handleNewStudent = () => {
    setEditingStudent(null)
    navigate('student-form')
  }

  const handleEditStudent = () => {
    if (!selectedStudent) return
    setEditingStudent(selectedStudent)
    navigate('student-form')
  }

  const handleSendLink = async () => {
    if (!selectedStudent) return
    setLinkLoading(true)
    setGeneratedLink(null)
    const res = await api.ensureAnamnesisToken(selectedStudent.id)
    setLinkLoading(false)
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

  const handleSendLinkWhatsApp = async () => {
    if (!selectedStudent?.phone) return
    setLinkLoading(true)
    const res = await api.ensureAnamnesisToken(selectedStudent.id)
    setLinkLoading(false)
    if (!res.success || !res.data) return
    const url = `${APP_URL}/?token=${res.data}`
    const msg = `Olá ${selectedStudent.name.split(' ')[0]}! Por favor preencha sua anamnese: ${url}`
    window.open(whatsappUrl(selectedStudent.phone, msg), '_blank')
  }

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-text-muted uppercase tracking-widest">Olá,</p>
        <h2 className="font-display text-2xl italic text-white uppercase">
          {state.auth?.trainerName ?? 'Treinadora'}
        </h2>
      </div>
      <div className="flex items-center gap-1.5">
        {/* Seletor de idioma */}
        {(['pt', 'en', 'es'] as Lang[]).map((code) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
              lang === code ? 'text-white bg-white/10' : 'text-text-muted hover:text-white'
            }`}
          >
            {code.toUpperCase()}
          </button>
        ))}
        <span className="w-px h-3 bg-white/10 mx-0.5" />
        <Button variant="ghost" size="sm" onClick={handleNewStudent} aria-label="Cadastrar aluno">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>
        <Button variant="ghost" size="sm" onClick={logout}>
          Sair
        </Button>
      </div>
    </div>
  )

  return (
    <AppShell header={header}>
      <PageContainer className="py-4 gap-4" scrollable>
        <h1 className="font-display text-3xl italic uppercase text-white">
          Selecionar Aluno
        </h1>

        <input
          type="search"
          placeholder="Buscar aluno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          aria-label="Buscar aluno"
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.length === 0 ? (
              <div className="col-span-full flex flex-col items-center gap-4 py-12 text-center">
                <p className="text-text-muted">Nenhum aluno encontrado.</p>
                <Button size="sm" onClick={handleNewStudent}>
                  Cadastrar primeiro aluno
                </Button>
              </div>
            ) : (
              filtered.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  isSelected={selectedStudent?.id === student.id}
                  onSelect={() =>
                    setSelectedStudent((prev) =>
                      prev?.id === student.id ? null : student,
                    )
                  }
                />
              ))
            )}
          </div>
        )}

        {/* Action buttons — shown only when a student is selected */}
        {selectedStudent && (
          <div className="flex flex-col gap-2 pt-1 pb-6">
            {/* Primary actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={handleViewProgress}
                className="flex-1"
              >
                Ver Progressão
              </Button>
              <Button
                size="md"
                onClick={handleStartWorkout}
                className="flex-1"
              >
                Iniciar Treino
              </Button>
            </div>

            {/* Enviar anamnese ao cliente — primeira ação visível */}
            <Card variant="raised" className="!p-3 mt-1">
              <p className="text-[10px] uppercase tracking-widest text-pink-300 font-semibold mb-2">
                Anamnese — enviar ao cliente
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSendLink}
                  disabled={linkLoading}
                  className="!py-2"
                >
                  {linkCopied ? '✓ Copiado' : linkLoading ? '...' : '📋 Copiar link'}
                </Button>
                {selectedStudent.phone ? (
                  <Button
                    size="sm"
                    onClick={handleSendLinkWhatsApp}
                    disabled={linkLoading}
                    className="!py-2"
                  >
                    Enviar WhatsApp
                  </Button>
                ) : (
                  <Button size="sm" disabled className="!py-2">
                    Sem telefone
                  </Button>
                )}
              </div>
              {generatedLink && (
                <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                    Toque e segure para copiar:
                  </p>
                  <p className="text-xs text-pink-300 break-all font-mono select-all">
                    {generatedLink}
                  </p>
                </div>
              )}
            </Card>

            {/* WhatsApp casual */}
            {selectedStudent.phone && (
              <a
                href={whatsappUrl(
                  selectedStudent.phone,
                  `Olá ${selectedStudent.name.split(' ')[0]}, tudo bem?`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Abrir WhatsApp
              </a>
            )}
            {/* Edit */}
            <button
              onClick={handleEditStudent}
              className="text-sm text-text-muted hover:text-white transition-colors text-center py-1"
            >
              Editar dados de {selectedStudent.name.split(' ')[0]}
            </button>
          </div>
        )}
      </PageContainer>
    </AppShell>
  )
}
