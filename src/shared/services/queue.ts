/**
 * Fila offline com flush automático ao voltar online.
 *
 * Uso:
 *   import { startQueueProcessor } from '@/shared/services/queue'
 *   startQueueProcessor(onProgress)
 */
import { offlineQueue } from './storage'
import { supabase } from './supabase'
import type { QueuedRequest, WorkoutSession } from '@/shared/types'

type ProgressHandler = (info: {
  pending: number
  flushed: number
  failed: number
  running: boolean
}) => void

let isProcessing = false
let listener: ProgressHandler | null = null

async function processRequest(req: QueuedRequest): Promise<boolean> {
  try {
    if (req.endpoint === 'save_session') {
      const payload = req.payload as { session: WorkoutSession }
      const session = payload.session
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
      if (error) throw new Error(error.message)
      return true
    }
    // Endpoints desconhecidos ficam na fila
    return false
  } catch {
    return false
  }
}

export async function flushQueue(): Promise<void> {
  if (isProcessing) return
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  const queue = offlineQueue.load()
  if (queue.length === 0) return

  isProcessing = true
  listener?.({ pending: queue.length, flushed: 0, failed: 0, running: true })

  let flushed = 0
  let failed = 0

  for (const req of queue) {
    const ok = await processRequest(req)
    if (ok) {
      offlineQueue.dequeue(req.id)
      flushed++
    } else {
      failed++
    }
    listener?.({
      pending: queue.length - flushed - failed,
      flushed,
      failed,
      running: true,
    })
  }

  isProcessing = false
  listener?.({ pending: offlineQueue.size(), flushed, failed, running: false })
}

export function startQueueProcessor(onProgress?: ProgressHandler): () => void {
  listener = onProgress ?? null

  const handleOnline = () => {
    flushQueue()
  }

  window.addEventListener('online', handleOnline)

  // Primeira tentativa ao iniciar
  flushQueue()

  return () => {
    window.removeEventListener('online', handleOnline)
    listener = null
  }
}
