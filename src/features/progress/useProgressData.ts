// src/features/progress/useProgressData.ts
// Hook que processa sessões salvas e calcula métricas para o dashboard

import { useMemo } from "react";

export interface SavedSet {
  reps: string;
  weight: string;
}

export interface SavedExercise {
  exerciseName: string;
  muscleGroup: string;
  subGroup: string;
  sets: SavedSet[];
}

export interface SavedSession {
  id: string;
  studentId: string;
  date: string; // ISO string
  exercises: SavedExercise[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadSessions(studentId: string): SavedSession[] {
  try {
    const raw = localStorage.getItem(`gle_sessions_${studentId}`);
    if (!raw) return [];
    return JSON.parse(raw) as SavedSession[];
  } catch {
    return [];
  }
}

export function saveSessions(studentId: string, sessions: SavedSession[]) {
  localStorage.setItem(`gle_sessions_${studentId}`, JSON.stringify(sessions));
}

function parseWeight(w: string): number {
  const n = parseFloat(w);
  return isNaN(n) ? 0 : n;
}

function parseReps(r: string): number {
  const n = parseInt(r, 10);
  return isNaN(n) ? 0 : n;
}

function getWeekLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export interface WeeklyVolume {
  label: string;
  volume: number; // em toneladas (kg/1000)
  isCurrent: boolean;
}

export interface ExerciseProgress {
  name: string;
  muscleGroup: string;
  data: Array<{ date: string; maxLoad: number; avgLoad: number }>;
}

export interface MuscleGroupStats {
  name: string;
  series: number;
  maxSeries: number; // para calcular a barra
}

export interface ProgressData {
  totalVolumeTons: number;
  totalSessions: number;
  weeklyVolume: WeeklyVolume[];
  exerciseProgress: ExerciseProgress[];
  muscleGroupStats: MuscleGroupStats[];
}

export function useProgressData(studentId: string): ProgressData {
  return useMemo(() => {
    const sessions = loadSessions(studentId);
    const now = new Date();
    const eightWeeksAgo = new Date(now);
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    // Filtra últimas 8 semanas
    const recent = sessions.filter((s) => new Date(s.date) >= eightWeeksAgo);

    // ── Totais ──
    let totalVolumeKg = 0;
    recent.forEach((s) => {
      s.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          totalVolumeKg += parseWeight(set.weight) * parseReps(set.reps);
        });
      });
    });

    // ── Volume semanal ──
    const weekMap = new Map<string, { volume: number; weekStart: Date }>();

    // Cria as 8 semanas (mesmo sem dados)
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const ws = startOfWeek(d);
      const key = ws.toISOString();
      if (!weekMap.has(key)) {
        weekMap.set(key, { volume: 0, weekStart: ws });
      }
    }

    recent.forEach((s) => {
      const ws = startOfWeek(new Date(s.date));
      const key = ws.toISOString();
      const entry = weekMap.get(key) || { volume: 0, weekStart: ws };
      s.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          entry.volume += parseWeight(set.weight) * parseReps(set.reps);
        });
      });
      weekMap.set(key, entry);
    });

    const currentWeekStart = startOfWeek(now).toISOString();
    const weeklyVolume: WeeklyVolume[] = Array.from(weekMap.values())
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
      .slice(-8)
      .map((w) => ({
        label: getWeekLabel(w.weekStart),
        volume: parseFloat((w.volume / 1000).toFixed(2)),
        isCurrent: w.weekStart.toISOString() === currentWeekStart,
      }));

    // ── Progressão por exercício ──
    const exerciseMap = new Map<string, ExerciseProgress>();

    sessions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((s) => {
        s.exercises.forEach((ex) => {
          if (!ex.exerciseName) return;

          const key = ex.exerciseName;
          if (!exerciseMap.has(key)) {
            exerciseMap.set(key, {
              name: ex.exerciseName,
              muscleGroup: ex.subGroup || ex.muscleGroup,
              data: [],
            });
          }

          const loads = ex.sets
            .map((set) => parseWeight(set.weight))
            .filter((w) => w > 0);

          if (loads.length === 0) return;

          const maxLoad = Math.max(...loads);
          const avgLoad = parseFloat(
            (loads.reduce((a, b) => a + b, 0) / loads.length).toFixed(1)
          );

          const dateLabel = new Date(s.date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          });

          exerciseMap.get(key)!.data.push({ date: dateLabel, maxLoad, avgLoad });
        });
      });

    // Filtra exercícios com pelo menos 1 ponto de dados
    const exerciseProgress = Array.from(exerciseMap.values()).filter(
      (ex) => ex.data.length >= 1
    );

    // ── Volume por grupo muscular (últimas 4 semanas) ──
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const muscleMap = new Map<string, number>();
    sessions
      .filter((s) => new Date(s.date) >= fourWeeksAgo)
      .forEach((s) => {
        s.exercises.forEach((ex) => {
          const group = ex.subGroup || ex.muscleGroup || "Outros";
          muscleMap.set(group, (muscleMap.get(group) || 0) + ex.sets.length);
        });
      });

    const maxSeries = Math.max(1, ...muscleMap.values());
    const muscleGroupStats: MuscleGroupStats[] = Array.from(muscleMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, series]) => ({ name, series, maxSeries }));

    return {
      totalVolumeTons: parseFloat((totalVolumeKg / 1000).toFixed(1)),
      totalSessions: recent.length,
      weeklyVolume,
      exerciseProgress,
      muscleGroupStats,
    };
  }, [studentId]);
}
