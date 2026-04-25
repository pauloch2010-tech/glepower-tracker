import type {
  ApiResponse,
  AuthSession,
  Student,
  WorkoutSession,
  Anamnesis,
  PhysicalAssessment,
  WorkoutPlan,
  WorkoutExecution,
} from '@/shared/types'
import { offlineQueue } from '@/shared/services/storage'
import { supabase } from '@/shared/services/supabase'

const USE_SUPABASE = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_STUDENTS: Student[] = [
  { id: 'stu-001', name: 'Ana Beatriz',    level: 'Intermediário', lastSession: '2024-12-15' },
  { id: 'stu-002', name: 'Carlos Mendes',  level: 'Avançado',      lastSession: '2024-12-14' },
  { id: 'stu-003', name: 'Fernanda Costa', level: 'Iniciante',     lastSession: '2024-12-10' },
  { id: 'stu-004', name: 'João Pedro',     level: 'Intermediário', lastSession: '2024-12-13' },
]

// ─── Mock Handler ─────────────────────────────────────────────────────────────
async function mockCall<T>(action: string, data: Record<string, unknown>): Promise<ApiResponse<T>> {
  await new Promise<void>((r) => setTimeout(r, action === 'save_session' ? 600 : 500))

  switch (action) {
    case 'login': {
      if (data.pin !== '1234') return { success: false, error: 'PIN inválido' }
      return {
        success: true,
        data: {
          trainerId: 'trainer-001',
          trainerName: 'Glécia',
          token: 'mock-token',
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        } as unknown as T,
      }
    }
    case 'get_students':
      return { success: true, data: MOCK_STUDENTS as unknown as T }
    case 'save_session':
      return { success: true }
    default:
      return { success: false, error: `Ação desconhecida: ${action}` }
  }
}

// ─── Supabase Handlers ────────────────────────────────────────────────────────

async function supabaseLogin(pin: string): Promise<ApiResponse<AuthSession>> {
  const { data, error } = await supabase
    .from('trainers')
    .select('id, name')
    .eq('pin', pin)
    .single()

  if (error || !data) return { success: false, error: 'PIN inválido' }

  return {
    success: true,
    data: {
      trainerId: data.id as string,
      trainerName: data.name as string,
      token: 'supabase-session',
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    },
  }
}

async function supabaseGetStudents(): Promise<ApiResponse<Student[]>> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, level, sex, phone, email, birth_date, height_m, goal, active, anamnesis_token, anamnesis_pending_review, created_at')
    .eq('active', true)
    .order('name')

  if (error) return { success: false, error: error.message }

  const students: Student[] = (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    level: (row.level as string) ?? undefined,
    sex: (row.sex as 'M' | 'F') ?? undefined,
    phone: (row.phone as string) ?? undefined,
    email: (row.email as string) ?? undefined,
    birthDate: (row.birth_date as string) ?? undefined,
    heightM: (row.height_m as number) ?? undefined,
    goal: (row.goal as string) ?? undefined,
    active: row.active as boolean,
    anamnesisToken: (row.anamnesis_token as string) ?? undefined,
    anamnesisPendingReview: (row.anamnesis_pending_review as boolean) ?? false,
  }))

  return { success: true, data: students }
}

async function supabaseCreateStudent(student: Omit<Student, 'id'>): Promise<ApiResponse<Student>> {
  const { data, error } = await supabase
    .from('students')
    .insert({
      name: student.name,
      level: student.level ?? null,
      sex: student.sex ?? null,
      phone: student.phone ?? null,
      email: student.email ?? null,
      birth_date: student.birthDate ?? null,
      height_m: student.heightM ?? null,
      goal: student.goal ?? null,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  return {
    success: true,
    data: {
      id: data.id as string,
      name: data.name as string,
      level: (data.level as string) ?? undefined,
    },
  }
}

async function supabaseUpdateStudent(id: string, updates: Partial<Student>): Promise<ApiResponse<void>> {
  const { error } = await supabase
    .from('students')
    .update({
      name: updates.name,
      level: updates.level ?? null,
      sex: updates.sex ?? null,
      phone: updates.phone ?? null,
      email: updates.email ?? null,
      birth_date: updates.birthDate ?? null,
      height_m: updates.heightM ?? null,
      goal: updates.goal ?? null,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── Anamnese ────────────────────────────────────────────────────────────────

function dbToAnamnesis(row: Record<string, unknown>): Anamnesis {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    familyDiseases: (row.family_diseases as string) ?? undefined,
    personalDiseases: (row.personal_diseases as string) ?? undefined,
    exerciseRestrictions: (row.exercise_restrictions as string) ?? undefined,
    surgeries: (row.surgeries as string) ?? undefined,
    allergies: (row.allergies as string) ?? undefined,
    injuries: (row.injuries as string) ?? undefined,
    medications: (row.medications as string) ?? undefined,
    bodyPains: (row.body_pains as string) ?? undefined,
    smoking: (row.smoking as string) ?? undefined,
    diet: (row.diet as string) ?? undefined,
    currentExercise: (row.current_exercise as string) ?? undefined,
    activityType: (row.activity_type as string) ?? undefined,
    frequency: (row.frequency as string) ?? undefined,
    parqHeart: row.parq_heart as boolean,
    parqChestPain: row.parq_chest_pain as boolean,
    parqChestPainMonth: row.parq_chest_pain_month as boolean,
    parqDizziness: row.parq_dizziness as boolean,
    parqBoneJoint: row.parq_bone_joint as boolean,
    parqBloodPressureMed: row.parq_blood_pressure_med as boolean,
    parqOtherReason: row.parq_other_reason as boolean,
    parqObservations: (row.parq_observations as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function anamnesisToDb(a: Omit<Anamnesis, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    student_id: a.studentId,
    family_diseases: a.familyDiseases ?? null,
    personal_diseases: a.personalDiseases ?? null,
    exercise_restrictions: a.exerciseRestrictions ?? null,
    surgeries: a.surgeries ?? null,
    allergies: a.allergies ?? null,
    injuries: a.injuries ?? null,
    medications: a.medications ?? null,
    body_pains: a.bodyPains ?? null,
    smoking: a.smoking ?? null,
    diet: a.diet ?? null,
    current_exercise: a.currentExercise ?? null,
    activity_type: a.activityType ?? null,
    frequency: a.frequency ?? null,
    parq_heart: a.parqHeart ?? false,
    parq_chest_pain: a.parqChestPain ?? false,
    parq_chest_pain_month: a.parqChestPainMonth ?? false,
    parq_dizziness: a.parqDizziness ?? false,
    parq_bone_joint: a.parqBoneJoint ?? false,
    parq_blood_pressure_med: a.parqBloodPressureMed ?? false,
    parq_other_reason: a.parqOtherReason ?? false,
    parq_observations: a.parqObservations ?? null,
    updated_at: new Date().toISOString(),
  }
}

async function supabaseGetAnamnesis(studentId: string): Promise<ApiResponse<Anamnesis | null>> {
  const { data, error } = await supabase
    .from('anamnesis')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  return { success: true, data: data ? dbToAnamnesis(data as Record<string, unknown>) : null }
}

async function supabaseSaveAnamnesis(a: Omit<Anamnesis, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Anamnesis>> {
  const { data, error } = await supabase
    .from('anamnesis')
    .upsert(anamnesisToDb(a), { onConflict: 'student_id' })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: dbToAnamnesis(data as Record<string, unknown>) }
}

// ─── Physical Assessments ────────────────────────────────────────────────────

function dbToAssessment(row: Record<string, unknown>): PhysicalAssessment {
  const get = (k: string) => row[k]
  const n = (k: string) => (row[k] !== null && row[k] !== undefined ? Number(row[k]) : undefined)
  return {
    id: get('id') as string,
    studentId: get('student_id') as string,
    assessmentDate: get('assessment_date') as string,
    protocol: get('protocol') as PhysicalAssessment['protocol'],
    weightKg: n('weight_kg'),
    heightM: n('height_m'),
    bmi: n('bmi'),
    skinfoldSubscapular: n('skinfold_subscapular'),
    skinfoldTriceps: n('skinfold_triceps'),
    skinfoldBiceps: n('skinfold_biceps'),
    skinfoldChest: n('skinfold_chest'),
    skinfoldMidaxillary: n('skinfold_midaxillary'),
    skinfoldSuprailiac: n('skinfold_suprailiac'),
    skinfoldAbdominal: n('skinfold_abdominal'),
    skinfoldThigh: n('skinfold_thigh'),
    skinfoldCalf: n('skinfold_calf'),
    circShoulder: n('circ_shoulder'),
    circChest: n('circ_chest'),
    circWaist: n('circ_waist'),
    circAbdomen: n('circ_abdomen'),
    circHip: n('circ_hip'),
    circArmRight: n('circ_arm_right'),
    circArmLeft: n('circ_arm_left'),
    circForearmRight: n('circ_forearm_right'),
    circForearmLeft: n('circ_forearm_left'),
    circThighRight: n('circ_thigh_right'),
    circThighLeft: n('circ_thigh_left'),
    circCalfRight: n('circ_calf_right'),
    circCalfLeft: n('circ_calf_left'),
    boneHumerus: n('bone_humerus'),
    boneFemur: n('bone_femur'),
    boneWrist: n('bone_wrist'),
    sumSkinfolds: n('sum_skinfolds'),
    whr: n('whr'),
    bodyFatPct: n('body_fat_pct'),
    fatMassKg: n('fat_mass_kg'),
    leanMassKg: n('lean_mass_kg'),
    muscleMassKg: n('muscle_mass_kg'),
    residualMassKg: n('residual_mass_kg'),
    boneMassKg: n('bone_mass_kg'),
    bmr: n('bmr'),
    activityFactor: n('activity_factor'),
    tdee: n('tdee'),
    notes: (get('notes') as string) ?? undefined,
    createdAt: get('created_at') as string,
  }
}

function assessmentToDb(a: Omit<PhysicalAssessment, 'id' | 'createdAt'>) {
  return {
    student_id: a.studentId,
    assessment_date: a.assessmentDate,
    protocol: a.protocol,
    weight_kg: a.weightKg ?? null,
    height_m: a.heightM ?? null,
    bmi: a.bmi ?? null,
    skinfold_subscapular: a.skinfoldSubscapular ?? null,
    skinfold_triceps: a.skinfoldTriceps ?? null,
    skinfold_biceps: a.skinfoldBiceps ?? null,
    skinfold_chest: a.skinfoldChest ?? null,
    skinfold_midaxillary: a.skinfoldMidaxillary ?? null,
    skinfold_suprailiac: a.skinfoldSuprailiac ?? null,
    skinfold_abdominal: a.skinfoldAbdominal ?? null,
    skinfold_thigh: a.skinfoldThigh ?? null,
    skinfold_calf: a.skinfoldCalf ?? null,
    circ_shoulder: a.circShoulder ?? null,
    circ_chest: a.circChest ?? null,
    circ_waist: a.circWaist ?? null,
    circ_abdomen: a.circAbdomen ?? null,
    circ_hip: a.circHip ?? null,
    circ_arm_right: a.circArmRight ?? null,
    circ_arm_left: a.circArmLeft ?? null,
    circ_forearm_right: a.circForearmRight ?? null,
    circ_forearm_left: a.circForearmLeft ?? null,
    circ_thigh_right: a.circThighRight ?? null,
    circ_thigh_left: a.circThighLeft ?? null,
    circ_calf_right: a.circCalfRight ?? null,
    circ_calf_left: a.circCalfLeft ?? null,
    bone_humerus: a.boneHumerus ?? null,
    bone_femur: a.boneFemur ?? null,
    bone_wrist: a.boneWrist ?? null,
    sum_skinfolds: a.sumSkinfolds ?? null,
    whr: a.whr ?? null,
    body_fat_pct: a.bodyFatPct ?? null,
    fat_mass_kg: a.fatMassKg ?? null,
    lean_mass_kg: a.leanMassKg ?? null,
    muscle_mass_kg: a.muscleMassKg ?? null,
    residual_mass_kg: a.residualMassKg ?? null,
    bone_mass_kg: a.boneMassKg ?? null,
    bmr: a.bmr ?? null,
    activity_factor: a.activityFactor ?? 1.5,
    tdee: a.tdee ?? null,
    notes: a.notes ?? null,
    updated_at: new Date().toISOString(),
  }
}

async function supabaseListAssessments(studentId: string): Promise<ApiResponse<PhysicalAssessment[]>> {
  const { data, error } = await supabase
    .from('physical_assessments')
    .select('*')
    .eq('student_id', studentId)
    .order('assessment_date', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data: (data ?? []).map((r) => dbToAssessment(r as Record<string, unknown>)) }
}

async function supabaseGetAssessment(id: string): Promise<ApiResponse<PhysicalAssessment>> {
  const { data, error } = await supabase
    .from('physical_assessments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: dbToAssessment(data as Record<string, unknown>) }
}

async function supabaseCreateAssessment(a: Omit<PhysicalAssessment, 'id' | 'createdAt'>): Promise<ApiResponse<PhysicalAssessment>> {
  const { data, error } = await supabase
    .from('physical_assessments')
    .insert(assessmentToDb(a))
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: dbToAssessment(data as Record<string, unknown>) }
}

async function supabaseUpdateAssessment(id: string, a: Omit<PhysicalAssessment, 'id' | 'createdAt'>): Promise<ApiResponse<PhysicalAssessment>> {
  const { data, error } = await supabase
    .from('physical_assessments')
    .update(assessmentToDb(a))
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: dbToAssessment(data as Record<string, unknown>) }
}

async function supabaseDeleteAssessment(id: string): Promise<ApiResponse<void>> {
  const { error } = await supabase.from('physical_assessments').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

async function supabaseDeactivateStudent(id: string): Promise<ApiResponse<void>> {
  const { error } = await supabase
    .from('students')
    .update({ active: false })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

async function supabaseSaveSession(session: WorkoutSession): Promise<ApiResponse<void>> {
  const { error } = await supabase.from('workout_sessions').insert({
    id: session.id,
    student_id: session.studentId,
    trainer_id: session.trainerId,
    date: session.date,
    started_at: session.startedAt,
    duration_minutes: session.durationMinutes ?? null,
    wellness: session.wellness,
    exercises: session.exercises,
    status: 'completed',
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── Workout Plans ──────────────────────────────────────────────────────────

async function supabaseListPlans(studentId: string): Promise<ApiResponse<WorkoutPlan[]>> {
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return {
    success: true,
    data: (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      studentId: r.student_id as string,
      trainerId: r.trainer_id as string,
      name: r.name as string,
      description: (r.description as string) ?? undefined,
      exercises: (r.exercises ?? []) as WorkoutPlan['exercises'],
      active: r.active as boolean,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    })),
  }
}

async function supabaseGetPlan(id: string): Promise<ApiResponse<WorkoutPlan>> {
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { success: false, error: error.message }
  const r = data as Record<string, unknown>
  return {
    success: true,
    data: {
      id: r.id as string,
      studentId: r.student_id as string,
      trainerId: r.trainer_id as string,
      name: r.name as string,
      description: (r.description as string) ?? undefined,
      exercises: (r.exercises ?? []) as WorkoutPlan['exercises'],
      active: r.active as boolean,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    },
  }
}

async function supabaseCreatePlan(plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<WorkoutPlan>> {
  const { data, error } = await supabase
    .from('workout_plans')
    .insert({
      student_id: plan.studentId,
      trainer_id: plan.trainerId,
      name: plan.name,
      description: plan.description ?? null,
      exercises: plan.exercises,
      active: plan.active,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  const r = data as Record<string, unknown>
  return {
    success: true,
    data: {
      id: r.id as string,
      studentId: r.student_id as string,
      trainerId: r.trainer_id as string,
      name: r.name as string,
      description: (r.description as string) ?? undefined,
      exercises: (r.exercises ?? []) as WorkoutPlan['exercises'],
      active: r.active as boolean,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    },
  }
}

async function supabaseUpdatePlan(id: string, plan: Partial<WorkoutPlan>): Promise<ApiResponse<WorkoutPlan>> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (plan.name !== undefined) payload.name = plan.name
  if (plan.description !== undefined) payload.description = plan.description
  if (plan.exercises !== undefined) payload.exercises = plan.exercises
  if (plan.active !== undefined) payload.active = plan.active

  const { data, error } = await supabase
    .from('workout_plans')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  const r = data as Record<string, unknown>
  return {
    success: true,
    data: {
      id: r.id as string,
      studentId: r.student_id as string,
      trainerId: r.trainer_id as string,
      name: r.name as string,
      description: (r.description as string) ?? undefined,
      exercises: (r.exercises ?? []) as WorkoutPlan['exercises'],
      active: r.active as boolean,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    },
  }
}

async function supabaseDeletePlan(id: string): Promise<ApiResponse<void>> {
  const { error } = await supabase.from('workout_plans').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── Workout Executions ─────────────────────────────────────────────────────

function dbToExecution(r: Record<string, unknown>): WorkoutExecution {
  return {
    id: r.id as string,
    planId: (r.plan_id as string) ?? null,
    studentId: r.student_id as string,
    trainerId: r.trainer_id as string,
    date: r.date as string,
    exercises: (r.exercises ?? []) as WorkoutExecution['exercises'],
    status: r.status as WorkoutExecution['status'],
    notes: (r.notes as string) ?? undefined,
    startedAt: r.started_at as string,
    completedAt: (r.completed_at as string) ?? undefined,
    createdAt: r.created_at as string,
  }
}

async function supabaseListExecutions(studentId: string): Promise<ApiResponse<WorkoutExecution[]>> {
  const { data, error } = await supabase
    .from('workout_executions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data: (data ?? []).map((r) => dbToExecution(r as Record<string, unknown>)) }
}

async function supabaseCreateExecution(exec: Omit<WorkoutExecution, 'id' | 'createdAt'>): Promise<ApiResponse<WorkoutExecution>> {
  const { data, error } = await supabase
    .from('workout_executions')
    .insert({
      plan_id: exec.planId ?? null,
      student_id: exec.studentId,
      trainer_id: exec.trainerId,
      date: exec.date,
      exercises: exec.exercises,
      status: exec.status,
      notes: exec.notes ?? null,
      started_at: exec.startedAt,
      completed_at: exec.completedAt ?? null,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: dbToExecution(data as Record<string, unknown>) }
}

async function supabaseUpdateExecution(id: string, updates: Partial<WorkoutExecution>): Promise<ApiResponse<WorkoutExecution>> {
  const payload: Record<string, unknown> = {}
  if (updates.exercises !== undefined) payload.exercises = updates.exercises
  if (updates.status !== undefined) payload.status = updates.status
  if (updates.notes !== undefined) payload.notes = updates.notes
  if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt

  const { data, error } = await supabase
    .from('workout_executions')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: dbToExecution(data as Record<string, unknown>) }
}

// ─── Anamnese Cliente (token público) ────────────────────────────────────────

/** Busca aluno pelo token de anamnese (sem autenticação) */
async function supabaseGetStudentByToken(token: string): Promise<ApiResponse<Student | null>> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, anamnesis_token, anamnesis_pending_review')
    .eq('anamnesis_token', token)
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  if (!data) return { success: true, data: null }

  return {
    success: true,
    data: {
      id: data.id as string,
      name: data.name as string,
      anamnesisToken: data.anamnesis_token as string,
      anamnesisPendingReview: data.anamnesis_pending_review as boolean,
    },
  }
}

/** Salva dados preenchidos pelo cliente e marca pending review */
async function supabaseSaveClientAnamnesis(
  studentId: string,
  clientData: Record<string, unknown>,
): Promise<ApiResponse<void>> {
  const { error } = await supabase
    .from('anamnesis')
    .upsert(
      {
        student_id: studentId,
        client_data: clientData,
        submitted_by_client: true,
        client_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id' },
    )

  if (error) return { success: false, error: error.message }

  // Marca pending review no aluno
  const { error: e2 } = await supabase
    .from('students')
    .update({ anamnesis_pending_review: true })
    .eq('id', studentId)

  if (e2) return { success: false, error: e2.message }
  return { success: true }
}

/** Gera (ou retorna existente) o token de anamnese para um aluno */
async function supabaseEnsureAnamnesisToken(studentId: string): Promise<ApiResponse<string>> {
  // Lê token existente
  const { data, error } = await supabase
    .from('students')
    .select('anamnesis_token')
    .eq('id', studentId)
    .single()

  if (error) return { success: false, error: error.message }

  if (data?.anamnesis_token) return { success: true, data: data.anamnesis_token as string }

  // Gera novo UUID via crypto
  const token = crypto.randomUUID()
  const { error: e2 } = await supabase
    .from('students')
    .update({ anamnesis_token: token })
    .eq('id', studentId)

  if (e2) return { success: false, error: e2.message }
  return { success: true, data: token }
}

/** Limpa a flag de pending review após o trainer abrir a anamnese */
async function supabaseClearPendingReview(studentId: string): Promise<ApiResponse<void>> {
  const { error } = await supabase
    .from('students')
    .update({ anamnesis_pending_review: false })
    .eq('id', studentId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── Legacy GAS caller (fallback when no Supabase) ───────────────────────────
const SCRIPT_URL = import.meta.env.VITE_API_URL ?? ''
const TIMEOUT_MS = 10_000

async function gasCall<T>(action: string, data: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data }),
      signal: controller.signal,
    })

    if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
    return (await res.json()) as ApiResponse<T>
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === 'AbortError'
    return { success: false, error: isAbort ? 'Timeout — tente novamente' : 'Sem conexão com o servidor' }
  } finally {
    clearTimeout(timer)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const api = {
  login(pin: string): Promise<ApiResponse<AuthSession>> {
    if (USE_SUPABASE) return supabaseLogin(pin)
    if (SCRIPT_URL) return gasCall<AuthSession>('login', { pin })
    return mockCall<AuthSession>('login', { pin })
  },

  getStudents(): Promise<ApiResponse<Student[]>> {
    if (USE_SUPABASE) return supabaseGetStudents()
    if (SCRIPT_URL) return gasCall<Student[]>('get_students')
    return mockCall<Student[]>('get_students', {})
  },

  createStudent(student: Omit<Student, 'id'>): Promise<ApiResponse<Student>> {
    if (USE_SUPABASE) return supabaseCreateStudent(student)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },

  updateStudent(id: string, updates: Partial<Student>): Promise<ApiResponse<void>> {
    if (USE_SUPABASE) return supabaseUpdateStudent(id, updates)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },

  deactivateStudent(id: string): Promise<ApiResponse<void>> {
    if (USE_SUPABASE) return supabaseDeactivateStudent(id)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },

  // ─── Anamnese ──────────────────────────────────────────────────────────
  getAnamnesis(studentId: string): Promise<ApiResponse<Anamnesis | null>> {
    if (USE_SUPABASE) return supabaseGetAnamnesis(studentId)
    return Promise.resolve({ success: true, data: null })
  },
  saveAnamnesis(a: Omit<Anamnesis, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Anamnesis>> {
    if (USE_SUPABASE) return supabaseSaveAnamnesis(a)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },

  // ─── Avaliações Físicas ────────────────────────────────────────────────
  listAssessments(studentId: string): Promise<ApiResponse<PhysicalAssessment[]>> {
    if (USE_SUPABASE) return supabaseListAssessments(studentId)
    return Promise.resolve({ success: true, data: [] })
  },
  getAssessment(id: string): Promise<ApiResponse<PhysicalAssessment>> {
    if (USE_SUPABASE) return supabaseGetAssessment(id)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },
  createAssessment(a: Omit<PhysicalAssessment, 'id' | 'createdAt'>): Promise<ApiResponse<PhysicalAssessment>> {
    if (USE_SUPABASE) return supabaseCreateAssessment(a)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },
  updateAssessment(id: string, a: Omit<PhysicalAssessment, 'id' | 'createdAt'>): Promise<ApiResponse<PhysicalAssessment>> {
    if (USE_SUPABASE) return supabaseUpdateAssessment(id, a)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },
  deleteAssessment(id: string): Promise<ApiResponse<void>> {
    if (USE_SUPABASE) return supabaseDeleteAssessment(id)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },

  // ─── Workout Plans ────────────────────────────────────────────────────
  listPlans(studentId: string): Promise<ApiResponse<WorkoutPlan[]>> {
    if (USE_SUPABASE) return supabaseListPlans(studentId)
    return Promise.resolve({ success: true, data: [] })
  },
  getPlan(id: string): Promise<ApiResponse<WorkoutPlan>> {
    if (USE_SUPABASE) return supabaseGetPlan(id)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },
  createPlan(plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<WorkoutPlan>> {
    if (USE_SUPABASE) return supabaseCreatePlan(plan)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },
  updatePlan(id: string, plan: Partial<WorkoutPlan>): Promise<ApiResponse<WorkoutPlan>> {
    if (USE_SUPABASE) return supabaseUpdatePlan(id, plan)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },
  deletePlan(id: string): Promise<ApiResponse<void>> {
    if (USE_SUPABASE) return supabaseDeletePlan(id)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },

  // ─── Workout Executions ──────────────────────────────────────────────
  listExecutions(studentId: string): Promise<ApiResponse<WorkoutExecution[]>> {
    if (USE_SUPABASE) return supabaseListExecutions(studentId)
    return Promise.resolve({ success: true, data: [] })
  },
  createExecution(exec: Omit<WorkoutExecution, 'id' | 'createdAt'>): Promise<ApiResponse<WorkoutExecution>> {
    if (USE_SUPABASE) return supabaseCreateExecution(exec)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },
  updateExecution(id: string, updates: Partial<WorkoutExecution>): Promise<ApiResponse<WorkoutExecution>> {
    if (USE_SUPABASE) return supabaseUpdateExecution(id, updates)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },

  // ─── Anamnese cliente (token público) ────────────────────────────────────
  getStudentByToken(token: string): Promise<ApiResponse<Student | null>> {
    if (USE_SUPABASE) return supabaseGetStudentByToken(token)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },
  saveClientAnamnesis(studentId: string, clientData: Record<string, unknown>): Promise<ApiResponse<void>> {
    if (USE_SUPABASE) return supabaseSaveClientAnamnesis(studentId, clientData)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },
  ensureAnamnesisToken(studentId: string): Promise<ApiResponse<string>> {
    if (USE_SUPABASE) return supabaseEnsureAnamnesisToken(studentId)
    return Promise.resolve({ success: false, error: 'Supabase não configurado' })
  },
  clearPendingReview(studentId: string): Promise<ApiResponse<void>> {
    if (USE_SUPABASE) return supabaseClearPendingReview(studentId)
    return Promise.resolve({ success: true })
  },

  async saveSession(session: WorkoutSession): Promise<ApiResponse<void>> {
    const result = USE_SUPABASE
      ? await supabaseSaveSession(session)
      : SCRIPT_URL
        ? await gasCall<void>('save_session', { session })
        : await mockCall<void>('save_session', { session })

    if (!result.success) {
      const isNetworkError =
        !navigator.onLine ||
        result.error === 'Sem conexão com o servidor' ||
        result.error?.startsWith('Timeout')

      if (isNetworkError) {
        offlineQueue.enqueue({ endpoint: 'save_session', payload: { session } })
      }
    }

    return result
  },
}
