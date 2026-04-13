import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react'
import type {
  AppStep,
  AuthSession,
  Student,
  WellnessCheckin,
  WorkoutSession,
  SessionState,
} from '@/shared/types'
import { sessionStorage_ } from '@/shared/services/storage'

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

  // Restore session on mount
  useEffect(() => {
    const saved = sessionStorage_.load()
    if (saved?.auth && saved.step !== 'login') {
      dispatch({ type: 'RESTORE', payload: saved })
    }
  }, [])

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
