import { useSession } from '@/shared/store/SessionContext'
import { AppShell } from '@/shared/components/layout/AppShell'

// Feature pages
import { LoginPage } from '@/features/auth/LoginPage'
import { StudentSelectPage } from '@/features/students/StudentSelectPage'
import { StudentFormPage } from '@/features/students/StudentFormPage'
import { WellnessPage } from '@/features/wellness/WellnessPage'
import { WorkoutPage } from '@/features/workout/WorkoutPage'
import { ReviewPage } from '@/features/review/ReviewPage'
import { SuccessPage } from '@/features/success/SuccessPage'
import { ProgressPage } from '@/features/progress/ProgressPage'

export function App() {
  const { state, navigate, setEditingStudent } = useSession()

  const goToStudentSelect = () => navigate('student-select')

  const handleStudentSaved = () => {
    setEditingStudent(null)
    navigate('student-select')
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
            onBack={goToStudentSelect}
            onSaved={handleStudentSaved}
          />
        )

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
