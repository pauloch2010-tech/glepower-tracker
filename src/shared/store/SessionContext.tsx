import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type {
  AppStep,
  AuthSession,
  Student,
  WellnessCheckin,
  WorkoutSession,
  SessionState,
} from '@/shared/types'
import { sessionStorage_ } from '@/shared/services/storage'
import { supabase } from '@/shared/services/supabase'

// ─── URL ↔ Step mapping ───────────────────────────────────────────────────────
const STEP_TO_PATH: Partial<Record<AppStep, string>> = {
  login:              '/',
  register:           '/register',
  'reset-password':   '/reset-password',
  'student-select':   '/students',
  'student-form':     '/student/form',
  'student-detail':   '/student',
  anamnesis:          '/student/anamnesis',
  'assessment-list':  '/student/assessments',
  'assessment-form':  '/student/assessments/new',
  'assessment-report':'/student/assessments/report',
  'progress-report':  '/student/assessments/progress',
  'workout-plan-list':'/student/workout',
  'workout-plan-form':'/student/workout/new',
  'workout-execution':'/student/workout/execute',
  wellness:           '/student/wellness',
  workout:            '/student/workout-session',
  review:             '/student/review',
  success:            '/student/success',
  progress:           '/student/progress',
}

const PATH_TO_STEP: Record<string, AppStep> = Object.fromEntries(
  Object.entries(STEP_TO_PATH).map(([step, path]) => [path, step as AppStep])
)

// ─── Initial State ────────────────────────────────────────────────────────────
const INITIAL_STATE: SessionState = {
  step: 'login',
  auth: null,
  student: null,
  editingStudent: null,
  wellness: null,
  workout: null,
  editingAssessmentId: null,
  editingPlanId: null,
  editingExecutionId: null,
}

// ─── Actions ──────────────────────────────────────────────────────────────────
type Action =
  | { type: 'LOGIN'; payload: AuthSession }
  | { type: 'SELECT_STUDENT'; payload: Student }
  | { type: 'SET_EDITING_STUDENT'; payload: Student | null }
  | { type: 'SET_EDITING_ASSESSMENT'; payload: string | null }
  | { type: 'SET_EDITING_PLAN'; payload: string | null }
  | { type: 'SET_EDITING_EXECUTION'; payload: string | null }
  | { type: 'SET_WELLNESS'; payload: WellnessCheckin }
  | { type: 'SET_WORKOUT'; payload: WorkoutSession }
  | { type: 'UPDATE_WORKOUT'; payload: Partial<WorkoutSession> }
  | { type: 'NAVIGATE'; payload: AppStep }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE'; payload: Partial<SessionState> }

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, auth: action.payload, step: 'student-select' }

    case 'SELECT_STUDENT':
      return { ...state, student: action.payload, step: 'student-detail' }

    case 'SET_EDITING_ASSESSMENT':
      return { ...state, editingAssessmentId: action.payload }

    case 'SET_EDITING_PLAN':
      return { ...state, editingPlanId: action.payload }

    case 'SET_EDITING_EXECUTION':
      return { ...state, editingExecutionId: action.payload }

    case 'SET_EDITING_STUDENT':
      return { ...state, editingStudent: action.payload }

    case 'SET_WELLNESS':
      return { ...state, wellness: action.payload, step: 'workout' }

    case 'SET_WORKOUT':
      return { ...state, workout: action.payload }

    case 'UPDATE_WORKOUT':
      if (!state.workout) return state
      return { ...state, workout: { ...state.workout, ...action.payload } }

    case 'NAVIGATE':
      return { ...state, step: action.payload }

    case 'LOGOUT':
      sessionStorage_.clear()
      return { ...INITIAL_STATE }

    case 'RESTORE':
      return { ...state, ...action.payload }

    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface SessionContextValue {
  state: SessionState
  login: (auth: AuthSession) => void
  selectStudent: (student: Student) => void
  setEditingStudent: (student: Student | null) => void
  setEditingAssessment: (id: string | null) => void
  setEditingPlan: (id: string | null) => void
  setEditingExecution: (id: string | null) => void
  setWellness: (wellness: WellnessCheckin) => void
  setWorkout: (workout: WorkoutSession) => void
  updateWorkout: (patch: Partial<WorkoutSession>) => void
  navigate: (step: AppStep) => void
  logout: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const routerNavigate = useNavigate()
  const location = useLocation()

  // Ref to track current step without triggering popstate effect
  const stepRef = useRef(state.step)
  stepRef.current = state.step

  // Listen for Supabase auth events (PASSWORD_RECOVERY, SIGNED_OUT, etc.)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the reset-password link in their email
        dispatch({ type: 'NAVIGATE', payload: 'reset-password' })
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Restore session on mount via Supabase auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Try to restore from sessionStorage first (has student context etc.)
        const saved = sessionStorage_.load()
        if (saved?.auth && saved.step !== 'login') {
          dispatch({ type: 'RESTORE', payload: saved })
          return
        }
        // Otherwise do a minimal login restoration from Supabase
        supabase
          .from('trainers')
          .select('id, name')
          .eq('auth_user_id', session.user.id)
          .single()
          .then(({ data: trainer }) => {
            if (trainer) {
              dispatch({
                type: 'LOGIN',
                payload: {
                  trainerId: trainer.id as string,
                  trainerName: trainer.name as string,
                  token: session.access_token,
                  expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
                },
              })
            }
          })
      }
    })
  }, [])

  // Sync state.step → URL (push to browser history on every step change)
  useEffect(() => {
    const targetPath = STEP_TO_PATH[state.step]
    if (targetPath && location.pathname !== targetPath) {
      routerNavigate(targetPath, { replace: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step])

  // Sync URL → step (handles browser back/forward button)
  useEffect(() => {
    const step = PATH_TO_STEP[location.pathname]
    if (step && step !== stepRef.current) {
      dispatch({ type: 'NAVIGATE', payload: step })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Persist on every state change (except logout — reducer handles clear)
  useEffect(() => {
    if (state.auth) {
      sessionStorage_.save(state)
    }
  }, [state])

  // ─── Action creators ─────────────────────────────────────────────────────
  const login = useCallback((auth: AuthSession) => {
    dispatch({ type: 'LOGIN', payload: auth })
  }, [])

  const selectStudent = useCallback((student: Student) => {
    dispatch({ type: 'SELECT_STUDENT', payload: student })
  }, [])

  const setEditingStudent = useCallback((student: Student | null) => {
    dispatch({ type: 'SET_EDITING_STUDENT', payload: student })
  }, [])

  const setEditingAssessment = useCallback((id: string | null) => {
    dispatch({ type: 'SET_EDITING_ASSESSMENT', payload: id })
  }, [])

  const setEditingPlan = useCallback((id: string | null) => {
    dispatch({ type: 'SET_EDITING_PLAN', payload: id })
  }, [])

  const setEditingExecution = useCallback((id: string | null) => {
    dispatch({ type: 'SET_EDITING_EXECUTION', payload: id })
  }, [])

  const setWellness = useCallback((wellness: WellnessCheckin) => {
    dispatch({ type: 'SET_WELLNESS', payload: wellness })
  }, [])

  const setWorkout = useCallback((workout: WorkoutSession) => {
    dispatch({ type: 'SET_WORKOUT', payload: workout })
  }, [])

  const updateWorkout = useCallback((patch: Partial<WorkoutSession>) => {
    dispatch({ type: 'UPDATE_WORKOUT', payload: patch })
  }, [])

  const navigate = useCallback((step: AppStep) => {
    dispatch({ type: 'NAVIGATE', payload: step })
  }, [])

  const logout = useCallback(() => {
    supabase.auth.signOut()
    dispatch({ type: 'LOGOUT' })
  }, [])

  return (
    <SessionContext.Provider
      value={{ state, login, selectStudent, setEditingStudent, setEditingAssessment, setEditingPlan, setEditingExecution, setWellness, setWorkout, updateWorkout, navigate, logout }}
    >
      {children}
    </SessionContext.Provider>
  )
}
