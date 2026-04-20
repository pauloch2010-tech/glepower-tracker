import { useEffect } from 'react'
import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'
import { startQueueProcessor } from '@/shared/services/queue'

// Feature pages
import { LoginPage } from '@/features/auth/LoginPage'
import { StudentSelectPage } from '@/features/students/StudentSelectPage'
import { StudentFormPage } from '@/features/students/StudentFormPage'
import { StudentDetailPage } from '@/features/students/StudentDetailPage'
import { AnamnesisFormPage } from '@/features/anamnesis/AnamnesisFormPage'
import { AssessmentListPage } from '@/features/assessments/AssessmentListPage'
import { AssessmentFormPage } from '@/features/assessments/AssessmentFormPage'
import { AssessmentReportPage } from '@/features/assessments/AssessmentReportPage'
import { ProgressReportPage } from '@/features/assessments/ProgressReportPage'
import { WorkoutPlanListPage } from '@/features/workout/WorkoutPlanListPage'
import { WorkoutPlanFormPage } from '@/features/workout/WorkoutPlanFormPage'
import { WorkoutExecutionPage } from '@/features/workout/WorkoutExecutionPage'
import { WellnessPage } from '@/features/wellness/WellnessPage'
import { WorkoutPage } from '@/features/workout/WorkoutPage'
import { ReviewPage } from '@/features/review/ReviewPage'
import { SuccessPage } from '@/features/success/SuccessPage'
import { ProgressPage } from '@/features/progress/ProgressPage'

export function App() {
  const { state, navigate, setEditingStudent } = useSession()

  // Inicia o processador de fila offline (flush automático ao voltar online)
  useEffect(() => {
    const stop = startQueueProcessor()
    return stop
  }, [])

  const goToStudentSelect = () => navigate('student-select')
  const goToStudentDetail = () => navigate('student-detail')

  const handleStudentSaved = () => {
    setEditingStudent(null)
    navigate(state.student ? 'student-detail' : 'student-select')
  }

  const renderStep = () => {
    switch (state.step) {
      case 'login':
        return <LoginPage />

      case 'student-select':
        return <StudentSelectPage />

      case 'student-form':
        return (
          <StudentFormPage
            editStudent={state.editingStudent ?? undefined}
            onBack={state.student ? goToStudentDetail : goToStudentSelect}
            onSaved={handleStudentSaved}
          />
        )

      case 'student-detail':
        return <StudentDetailPage />

      case 'anamnesis':
        return <AnamnesisFormPage />

      case 'assessment-list':
        return <AssessmentListPage />

      case 'assessment-form':
        return <AssessmentFormPage />

      case 'assessment-report':
        return <AssessmentReportPage />

      case 'progress-report':
        return <ProgressReportPage />

      case 'workout-plan-list':
        return <WorkoutPlanListPage />

      case 'workout-plan-form':
        return <WorkoutPlanFormPage />

      case 'workout-execution':
        return <WorkoutExecutionPage />

      case 'wellness':
        return <WellnessPage />

      case 'workout':
        return <WorkoutPage />

      case 'review':
        return <ReviewPage />

      case 'success':
        return <SuccessPage />

      case 'progress':
        return (
          <ProgressPage
            studentId={state.student?.id ?? ''}
            studentName={state.student?.name ?? ''}
            onBack={goToStudentSelect}
          />
        )

      default:
        return <LoginPage />
    }
  }

  return <AppShell>{renderStep()}</AppShell>
}
