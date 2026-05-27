// src/features/progress/useProgressData.ts
// Hook que processa execuções do Supabase e calcula métricas para o dashboard

import { useMemo } from 'react'
import type { WorkoutExecution } from '@/shared/types'

// ─── Interfaces de saída ──────────────────────────────────────────────────────

export interface WeeklyVolume {
  label: string
  volume: number   // em toneladas (kg/1000)
  isCurrent: boolean
}

export interface ExerciseProgress {
  name: string
  muscleGroup: string
  data: Array<{ date: string; maxLoad: number; avgLoad: number }>
}

export interface MuscleGroupStats {
  name: string
  series: number
  maxSeries: number
}

export interface ProgressData {
  totalVolumeTons: number
  totalSessions: number
  weeklyVolume: WeeklyVolume[]
  exerciseProgress: ExerciseProgress[]
  muscleGroupStats: MuscleGroupStats[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// Um set conta como realizado se foi marcado como concluído OU se tem peso registrado
function setHasData(s: { completed: boolean; weight?: number | null; reps?: number | null }): boolean {
  return s.completed || ((s.weight ?? 0) > 0 && (s.reps ?? 0) > 0)
}

// ─── Hook principal ───────────────────────────────────────────────────────────
// Aceita WorkoutExecution[] já carregadas — o fetch é feito pelo componente pai.

export function useProgressData(executions: WorkoutExecution[]): ProgressData {
  return useMemo(() => {
    const now = new Date()
    const eightWeeksAgo = new Date(now)
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

    // Execuções concluídas nas últimas 8 semanas
    const recent = executions.filter(
      (e) => e.status === 'completed' && new Date(e.date) >= eightWeeksAgo,
    )

    // ── Totais ──────────────────────────────────────────────────────────────
    let totalVolumeKg = 0
    recent.forEach((exec) => {
      exec.exercises.forEach((ex) => {
        ex.sets.forEach((s) => {
          if (setHasData(s)) totalVolumeKg += (s.weight ?? 0) * (s.reps ?? 0)
        })
      })
    })

    // ── Volume semanal (8 semanas) ───────────────────────────────────────────
    const weekMap = new Map<string, { volume: number; weekStart: Date }>()
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      const ws = startOfWeek(d)
      const key = ws.toISOString()
      if (!weekMap.has(key)) weekMap.set(key, { volume: 0, weekStart: ws })
    }

    recent.forEach((exec) => {
      const ws = startOfWeek(new Date(exec.date))
      const key = ws.toISOString()
      const entry = weekMap.get(key) ?? { volume: 0, weekStart: ws }
      exec.exercises.forEach((ex) => {
        ex.sets.forEach((s) => {
          if (setHasData(s)) entry.volume += (s.weight ?? 0) * (s.reps ?? 0)
        })
      })
      weekMap.set(key, entry)
    })

    const currentWeekStart = startOfWeek(now).toISOString()
    const weeklyVolume: WeeklyVolume[] = Array.from(weekMap.values())
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
      .slice(-8)
      .map((w) => ({
        label: getWeekLabel(w.weekStart),
        volume: parseFloat((w.volume / 1000).toFixed(2)),
        isCurrent: w.weekStart.toISOString() === currentWeekStart,
      }))

    // ── Progressão por exercício ─────────────────────────────────────────────
    const exerciseMap = new Map<string, ExerciseProgress>()

    ;[...executions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .filter((e) => e.status === 'completed')
      .forEach((exec) => {
        exec.exercises.forEach((ex) => {
          if (!ex.exerciseName) return
          if (!exerciseMap.has(ex.exerciseName)) {
            exerciseMap.set(ex.exerciseName, {
              name: ex.exerciseName,
              muscleGroup: ex.subGroup || ex.muscleGroup,
              data: [],
            })
          }
          const loads = ex.sets
            .filter((s) => (s.weight ?? 0) > 0)
            .map((s) => s.weight ?? 0)
          if (loads.length === 0) return

          const maxLoad = Math.max(...loads)
          const avgLoad = parseFloat((loads.reduce((a, b) => a + b, 0) / loads.length).toFixed(1))
          const dateLabel = new Date(exec.date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
          })
          exerciseMap.get(ex.exerciseName)!.data.push({ date: dateLabel, maxLoad, avgLoad })
        })
      })

    const exerciseProgress = Array.from(exerciseMap.values()).filter((e) => e.data.length >= 1)

    // ── Volume por grupo muscular (últimas 4 semanas) ───────────────────────
    const fourWeeksAgo = new Date(now)
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const muscleMap = new Map<string, number>()
    executions
      .filter((e) => e.status === 'completed' && new Date(e.date) >= fourWeeksAgo)
      .forEach((exec) => {
        exec.exercises.forEach((ex) => {
          const group = ex.subGroup || ex.muscleGroup || 'Outros'
          const doneSets = ex.sets.filter((s) => setHasData(s)).length
          if (doneSets > 0) muscleMap.set(group, (muscleMap.get(group) ?? 0) + doneSets)
        })
      })

    const maxSeries = Math.max(1, ...muscleMap.values())
    const muscleGroupStats: MuscleGroupStats[] = Array.from(muscleMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, series]) => ({ name, series, maxSeries }))

    return {
      totalVolumeTons: parseFloat((totalVolumeKg / 1000).toFixed(1)),
      totalSessions: recent.length,
      weeklyVolume,
      exerciseProgress,
      muscleGroupStats,
    }
  }, [executions])
}
