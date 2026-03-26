import type { QueuedRequest, SessionState } from '@/shared/types'

// ─── Keys ────────────────────────────────────────────────────────────────────
const KEYS = {
  SESSION: 'glepower:session',
  OFFLINE_QUEUE: 'glepower:offline-queue',
  LAST_STUDENT: 'glepower:last-student',
} as const

// ─── Session (sessionStorage — clears on tab close) ──────────────────────────
export const sessionStorage_ = {
  save(state: Partial<SessionState>): void {
    try {
      const existing = sessionStorage_.load() ?? {}
      sessionStorage.setItem(KEYS.SESSION, JSON.stringify({ ...existing, ...state }))
    } catch {
      // Storage might be unavailable (private mode, quota exceeded)
    }
  },

  load(): Partial<SessionState> | null {
    try {
      const raw = sessionStorage.getItem(KEYS.SESSION)
      return raw ? (JSON.parse(raw) as Partial<SessionState>) : null
    } catch {
      return null
    }
  },

  clear(): void {
    try {
      sessionStorage.removeItem(KEYS.SESSION)
    } catch {
      // noop
    }
  },
}

// ─── Offline Queue (localStorage — persists across sessions) ──────────────────
export const offlineQueue = {
  load(): QueuedRequest[] {
    try {
      const raw = localStorage.getItem(KEYS.OFFLINE_QUEUE)
      return raw ? (JSON.parse(raw) as QueuedRequest[]) : []
    } catch {
      return []
    }
  },

  save(queue: QueuedRequest[]): void {
    try {
      localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue))
    } catch {
      // noop
    }
  },

  enqueue(request: Omit<QueuedRequest, 'id' | 'createdAt' | 'retries'>): void {
    const queue = offlineQueue.load()
    const item: QueuedRequest = {
      ...request,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      retries: 0,
    }
    offlineQueue.save([...queue, item])
  },

  dequeue(id: string): void {
    const queue = offlineQueue.load().filter((r) => r.id !== id)
    offlineQueue.save(queue)
  },

  clear(): void {
    try {
      localStorage.removeItem(KEYS.OFFLINE_QUEUE)
    } catch {
      // noop
    }
  },

  size(): number {
    return offlineQueue.load().length
  },
}

// ─── Last Student (localStorage) ─────────────────────────────────────────────
export const lastStudent = {
  save(studentId: string): void {
    try {
      localStorage.setItem(KEYS.LAST_STUDENT, studentId)
    } catch {
      // noop
    }
  },

  load(): string | null {
    try {
      return localStorage.getItem(KEYS.LAST_STUDENT)
    } catch {
      return null
    }
  },
}
