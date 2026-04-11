// ─── Navigation Steps ────────────────────────────────────────────────────────
export type AppStep =
  | 'login'
  | 'student-select'
  | 'student-form'
  | 'student-detail'
  | 'anamnesis'
  | 'assessment-list'
  | 'assessment-form'
  | 'progress-report'
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
export type Sex = 'M' | 'F'

export interface Student {
  id: string
  name: string
  avatarUrl?: string
  level?: string
  sex?: Sex
  phone?: string
  email?: string
  birthDate?: string
  heightM?: number
  goal?: string
  lastSession?: string
  active?: boolean
}

// ─── Anamnese ────────────────────────────────────────────────────────────────
export interface Anamnesis {
  id?: string
  studentId: string
  familyDiseases?: string
  personalDiseases?: string
  exerciseRestrictions?: string
  surgeries?: string
  allergies?: string
  injuries?: string
  medications?: string
  bodyPains?: string
  smoking?: string
  diet?: string
  currentExercise?: string
  activityType?: string
  frequency?: string
  // PAR-Q
  parqHeart?: boolean
  parqChestPain?: boolean
  parqChestPainMonth?: boolean
  parqDizziness?: boolean
  parqBoneJoint?: boolean
  parqBloodPressureMed?: boolean
  parqOtherReason?: boolean
  parqObservations?: string
  createdAt?: string
  updatedAt?: string
}

// ─── Avaliação Física ────────────────────────────────────────────────────────
export type AssessmentProtocol =
  | 'jackson_pollock_7'
  | 'pollock_3'
  | 'guedes'
  | 'faulkner'

export interface PhysicalAssessment {
  id?: string
  studentId: string
  assessmentDate: string
  protocol: AssessmentProtocol
  // Antropometria
  weightKg?: number
  heightM?: number
  bmi?: number
  // Dobras cutâneas
  skinfoldSubscapular?: number
  skinfoldTriceps?: number
  skinfoldBiceps?: number
  skinfoldChest?: number
  skinfoldMidaxillary?: number
  skinfoldSuprailiac?: number
  skinfoldAbdominal?: number
  skinfoldThigh?: number
  skinfoldCalf?: number
  // Perimetria
  circShoulder?: number
  circChest?: number
  circWaist?: number
  circAbdomen?: number
  circHip?: number
  circArmRight?: number
  circArmLeft?: number
  circForearmRight?: number
  circForearmLeft?: number
  circThighRight?: number
  circThighLeft?: number
  circCalfRight?: number
  circCalfLeft?: number
  // Diâmetros ósseos
  boneHumerus?: number
  boneFemur?: number
  boneWrist?: number
  // Calculados
  sumSkinfolds?: number
  whr?: number
  bodyFatPct?: number
  fatMassKg?: number
  leanMassKg?: number
  muscleMassKg?: number
  residualMassKg?: number
  boneMassKg?: number
  bmr?: number
  activityFactor?: number
  tdee?: number
  notes?: string
  createdAt?: string
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
  editingAssessmentId: string | null
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
