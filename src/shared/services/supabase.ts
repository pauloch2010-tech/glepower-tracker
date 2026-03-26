import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Variáveis de ambiente não definidas — usando modo mock.')
}

export const supabase = createClient(supabaseUrl ?? 'http://localhost', supabaseAnonKey ?? 'mock')

// ─── Tipos do banco ───────────────────────────────────────────────────────────

export interface DbStudent {
  id: string
  name: string
  level: string | null
  phone: string | null
  email: string | null
  birth_date: string | null
  goal: string | null
  active: boolean
  created_at: string
}

export interface DbWorkoutSession {
  id: string
  student_id: string
  trainer_id: string
  date: string
  started_at: string
  duration_minutes: number | null
  wellness: unknown
  exercises: unknown
  status: string
  created_at: string
}
