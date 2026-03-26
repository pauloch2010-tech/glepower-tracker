import type { ApiResponse, AuthSession, Student, WorkoutSession } from '@/shared/types'
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
    .select('id, name, level, phone, email, birth_date, goal, active, created_at')
    .eq('active', true)
    .order('name')

  if (error) return { success: false, error: error.message }

  const students: Student[] = (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    level: (row.level as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    email: (row.email as string) ?? undefined,
    birthDate: (row.birth_date as string) ?? undefined,
    goal: (row.goal as string) ?? undefined,
    active: row.active as boolean,
  }))

  return { success: true, data: students }
}

async function supabaseCreateStudent(student: Omit<Student, 'id'>): Promise<ApiResponse<Student>> {
  const { data, error } = await supabase
    .from('students')
    .insert({
      name: student.name,
      level: student.level ?? null,
      phone: student.phone ?? null,
      email: student.email ?? null,
      birth_date: student.birthDate ?? null,
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
      phone: updates.phone ?? null,
      email: updates.email ?? null,
      birth_date: updates.birthDate ?? null,
      goal: updates.goal ?? null,
    })
    .eq('id', id)

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
