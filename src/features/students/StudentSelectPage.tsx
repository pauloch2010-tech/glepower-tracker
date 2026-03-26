import { useState, useEffect } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'
import { api } from '@/shared/services/api'
import type { Student } from '@/shared/types'

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
      </div>

      {student.level && (
        <Badge variant={isSelected ? 'primary' : 'secondary'} size="sm">
          {student.level}
        </Badge>
      )}
    </Card>
  )
}

export function StudentSelectPage() {
  const { selectStudent, setEditingStudent, navigate, logout, state } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

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

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-text-muted uppercase tracking-widest">Olá,</p>
        <h2 className="font-display text-2xl italic text-white uppercase">
          {state.auth?.trainerName ?? 'Treinadora'}
        </h2>
      </div>
      <div className="flex items-center gap-2">
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
          <div className="flex flex-col gap-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
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
