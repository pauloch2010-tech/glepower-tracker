// ─── Navigation Steps ──────────────────────────────────────────────────────────────
export type AppStep =
  | 'login'
  | 'register'
  | 'student-select'
  | 'student-form'
  | 'student-detail'
  | 'anamnesis'
  | 'assessment-list'
  | 'assessment-form'
  | 'assessment-report'
  | 'progress-report'
  | 'workout-plan-list'
  | 'workout-plan-form'
  | 'workout-execution'
  | 'workout-cycles'
  | 'wellness'
  | 'workout'
  | 'review'
  | 'success'
  | 'progress'
  | 'reset-password'

// ─── Auth ─────────────────────────────────────────────────────────────────────────────
export interface AuthSession {
  trainerId: string
  trainerName: string
  token: string
  expiresAt: string
}

// ─── Students ───────────────────────────────────────────────────────────────────────────
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
  anamnesisToken?: string
  anamnesisPendingReview?: boolean
}

// ─── Anamnese ──────────────────────────────────────────────────────────────────────────
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
  parqHeart?: boolean
  parqChestPain?: boolean
  parqChestPainMonth?: boolean
  parqDizziness?: boolean
  parqBoneJoint?: boolean
  parqBloodPressureMed?: boolean
  parqOtherReason?: boolean
  parqObservations?: string
  clientData?: Record<string, unknown>
  clientSubmittedAt?: string
  clientLang?: string
  createdAt?: string
  updatedAt?: string
}

// ─── Avaliação Física ────────────────────────────────────────────────────────────────nexport type AssessmentProtocol =
  | 'jackson_pollock_7'
  | 'pollock_3'
  | 'guedes'
  | 'faulkner'

export interface PhysicalAssessment {
  id?: string
  studentId: string
  assessmentDate: string
  protocol: AssessmentProtocol
  weightKg?: number
  heightM?: number
  bmi?: number
  skinfoldSubscapular?: number
  skinfoldTriceps?: number
  skinfoldBiceps?: number
  skinfoldChest?: number
  skinfoldMidaxillary?: number
  skinfoldSuprailiac?: number
  skinfoldAbdominal?: number
  skinfoldThigh?: number
  skinfoldCalf?: number
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
  boneHumerus?: number
  boneFemur?: number
  boneWrist?: number
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

// ─── Wellness ───────────────────────────────────────────────────────────────────────────
export type StressLevel = 'Baixo' | 'Medio' | 'Alto'

export interface WellnessCheckin {
  sleep: number
  nutrition: number
  mood: number
  stress: StressLevel
  soreness: number
  notes?: string
}

// ─── Workout ────────────────────────────────────────────────────────────────────────────
export interface WorkoutSet {
  id: string
  reps: number | null
  weight: number | null
  rpe?: number
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
  date: string
  startedAt: string
  wellness: WellnessCheckin
  exercises: WorkoutExercise[]
  status: WorkoutStatus
  durationMinutes?: number
}

// ─── Workout Plans ────────────────────────────────────────────────────────────────────
export interface PlanExercise {
  id: string
  exerciseName: string
  muscleGroup: string
  subGroup: string
  targetSets: number
  targetReps: string
  targetWeight?: string
  restSeconds?: number
  notes?: string
}

export interface WorkoutPlan {
  id: string
  studentId: string
  trainerId: string
  name: string
  description?: string
  exercises: PlanExercise[]
  active: boolean
  createdAt: string
  updatedAt: string
}

// ─── Workout Executions ───────────────────────────────────────────────────────────────
export interface ExecutionSet {
  id: string
  reps: number | null
  weight: number | null
  rpe?: number
  completed: boolean
}

export interface ExecutionExercise {
  exerciseId: string
  exerciseName: string
  muscleGroup: string
  subGroup: string
  targetReps: string
  targetWeight?: string
  sets: ExecutionSet[]
  notes?: string
}

export type ExecutionStatus = 'in_progress' | 'completed'

export interface WorkoutExecution {
  id: string
  planId: string | null
  studentId: string
  trainerId: string
  date: string
  exercises: ExecutionExercise[]
  status: ExecutionStatus
  notes?: string
  startedAt: string
  completedAt?: string
  createdAt: string
}

// ─── Training Cycles ──────────────────────────────────────────────────────────────────
export interface CycleSummary {
  sessionsCompleted: number
  totalVolumeKg: number
  maxLoadByExercise: Record<string, number>
}

export interface TrainingCycle {
  id: string
  studentId: string
  planId: string | null
  cycleNumber: number
  name: string
  startDate: string
  endDate: string | null
  status: 'active' | 'completed'
  summary: CycleSummary | null
  createdAt: string
}

// ─── Session State ───────────────────────────────────────────────────────────────────
export interface SessionState {
  step: AppStep
  auth: AuthSession | null
  student: Student | null
  editingStudent: Student | null
  wellness: WellnessCheckin | null
  workout: WorkoutSession | null
  editingAssessmentId: string | null
  editingPlanId: string | null
  editingExecutionId: string | null
}

// ─── API ────────────────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ─── Offline Queue ────────────────────────────────────────────────────────────────────────
export interface QueuedRequest {
  id: string
  endpoint: string
  payload: unknown
  createdAt: string
  retries: number
}
