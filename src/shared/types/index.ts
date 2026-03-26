// ─── Navigation Steps ────────────────────────────────────────────────────────
export type AppStep =
  | 'login'
  | 'student-select'
  | 'student-form'
  | 'wellness'
  | 'workout'
  | 'review'
  | 'success'
  | 'progress'

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthSession {
  trainerId: string
  trainerName: string
  token: string
  expiresAt: string
}

// ─── Students ────────────────────────────────────────────────────────────────
export interface Student {
  id: string
  name: string
  avatarUrl?: string
  level?: string
  phone?: string
  email?: string
  birthDate?: string
  goal?: string
  lastSession?: string
  active?: boolean
}

// ─── Wellness ────────────────────────────────────────────────────────────────
export type StressLevel = 'Baixo' | 'Medio' | 'Alto'

export interface WellnessCheckin {
  sleep: number       // 1–5
  nutrition: number   // 1–5
  mood: number        // 1–5
  stress: StressLevel
  soreness: number    // 0–10
  notes?: string
}

// ─── Workout ─────────────────────────────────────────────────────────────────
export interface WorkoutSet {
  id: string
  reps: number | null
  weight: number | null
  rpe?: number        // 1–10 Rate of Perceived Exertion
  completed: boolean
}

export interface WorkoutExercise {
  exerciseId: string
  exerciseName: string
  muscleGroup: string
  subGroup?: string
  sets: WorkoutSet[]
  notes?: string
  restSeconds?: number
}

export type WorkoutStatus = 'draft' | 'completed' | 'synced'

export interface WorkoutSession {
  id: string
  studentId: string
  trainerId: string
  date: string         // ISO date string YYYY-MM-DD
  startedAt: string    // ISO datetime string
  wellness: WellnessCheckin
  exercises: WorkoutExercise[]
  status: WorkoutStatus
  durationMinutes?: number
}

// ─── Session State ───────────────────────────────────────────────────────────
export interface SessionState {
  step: AppStep
  auth: AuthSession | null
  student: Student | null
  editingStudent: Student | null
  wellness: WellnessCheckin | null
  workout: WorkoutSession | null
}

// ─── API ─────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ─── Offline Queue ───────────────────────────────────────────────────────────
export interface QueuedRequest {
  id: string
  endpoint: string
  payload: unknown
  createdAt: string
  retries: number
}
