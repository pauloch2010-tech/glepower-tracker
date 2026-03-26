// src/features/workout/ExerciseBlock.tsx
// Seleção de exercício: 3 níveis inline (Grupo → Subgrupo → Lista)
// Sem modal, sem bottom sheet — tudo dentro do bloco de exercício

import { useState, useRef, useEffect, RefObject } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface WorkoutSet {
  id: string;
  reps: string;
  weight: string;
  rpe: string;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  subGroup: string;
  sets: WorkoutSet[];
  notes: string;
}

// ─── Catálogo de exercícios ───────────────────────────────────────────────────

const CATALOG: Record<string, Record<string, string[]>> = {
  Superior: {
    Peito: [
      "Supino Reto Barra",
      "Supino Inclinado Barra",
      "Supino Reto Halter",
      "Supino Inclinado Halter",
      "Supino Declinado Barra",
      "Crucifixo Reto",
      "Crucifixo Inclinado",
      "Peck Deck",
      "Crossover Alto",
      "Crossover Baixo",
      "Flexão",
    ],
    Costa: [
      "Puxada Frontal",
      "Puxada Fechada",
      "Puxada Neutra",
      "Remada Baixa Cabo",
      "Remada Curvada Barra",
      "Remada Curvada Halter",
      "Remada Unilateral",
      "Remada Alta",
      "Pull Over",
      "Barra Fixa",
      "Serrátil Máquina",
    ],
    Ombro: [
      "Desenvolvimento Barra",
      "Desenvolvimento Halter",
      "Desenvolvimento Máquina",
      "Elevação Lateral Halter",
      "Elevação Lateral Cabo Unilateral",
      "Elevação Lateral Cabo Duplo",
      "Elevação Frontal Livre",
      "Elevação Frontal Cabo",
      "Crucifixo Invertido Máquina",
      "Crucifixo Invertido Halter",
      "Face Pull",
      "Arnold Press",
      "Encolhimento Ombros",
    ],
    Bíceps: [
      "Rosca Direta Barra",
      "Rosca Direta Barra W",
      "Rosca Direta Halter",
      "Rosca Alternada",
      "Rosca Martelo",
      "Rosca Concentrada",
      "Rosca Scott",
      "Rosca Spider",
      "Rosca Cabo",
      "Rosca 21",
    ],
    Tríceps: [
      "Tríceps Pulley Barra",
      "Tríceps Pulley Barra V",
      "Tríceps Pulley Corda",
      "Tríceps Francês Barra",
      "Tríceps Francês Halter",
      "Tríceps Testa",
      "Tríceps Coice",
      "Tríceps Mergulho",
      "Tríceps Máquina",
      "Tríceps Unilateral Cabo",
    ],
    Antebraço: [
      "Rosca Punho Barra",
      "Extensão Punho Barra",
      "Rosca Punho Halter",
      "Farmer Walk",
      "Pronação Supinação",
    ],
  },
  Inferior: {
    Quadríceps: [
      "Agachamento Livre",
      "Agachamento Smith",
      "Agachamento Hack",
      "Agachamento Búlgaro",
      "Leg Press 45°",
      "Leg Press Horizontal",
      "Cadeira Extensora",
      "Afundo",
      "Avanço",
      "Passada",
      "Sissy Squat",
    ],
    Posterior: [
      "Stiff Barra",
      "Stiff Halter",
      "Mesa Flexora",
      "Cadeira Flexora",
      "Levantamento Terra",
      "Leg Curl Deitado",
      "Leg Curl em Pé",
      "Good Morning",
      "Ponte Isquiotibial",
    ],
    Glúteo: [
      "Hip Thrust Barra",
      "Hip Thrust Halter",
      "Hip Thrust Máquina",
      "Abdução Máquina",
      "Abdução Cabo",
      "Agachamento Sumô",
      "Elevação Pélvica",
      "Coice Glúteo Cabo",
      "Coice Glúteo Máquina",
      "Step Up",
      "Passada Glúteo",
    ],
    Panturrilha: [
      "Panturrilha em Pé",
      "Panturrilha Sentado",
      "Panturrilha Leg Press",
      "Panturrilha Unilateral",
      "Panturrilha Smith",
      "Tibial Anterior",
    ],
  },
  Cardio: {
    Cardio: [
      "Esteira",
      "Bike",
      "Elíptico",
      "Corda",
      "Burpee",
      "Polichinelo",
      "Jumping Jack",
      "Sprint",
      "Jump Squat",
      "Mountain Climber",
      "Boxe",
    ],
  },
};

const RECENT_KEY = "gle_recent_exercises";

function getRecentExercises(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentExercise(name: string) {
  const recent = getRecentExercises().filter((e) => e !== name);
  const updated = [name, ...recent].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

function newSet(): WorkoutSet {
  return { id: crypto.randomUUID(), reps: "", weight: "", rpe: "", completed: false };
}

// ─── Componente SetRow ────────────────────────────────────────────────────────

interface SetRowProps {
  set: WorkoutSet;
  index: number;
  isFirst?: boolean;
  onUpdate: (updated: Partial<WorkoutSet>) => void;
  onRemove: () => void;
  repsRef?: RefObject<HTMLInputElement>;
}

function SetRow({ set, index, isFirst, onUpdate, onRemove, repsRef }: SetRowProps) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0">
      {/* Número da série */}
      <button
        onClick={() => onUpdate({ completed: !set.completed })}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
          set.completed
            ? "bg-primary text-white shadow-[0_0_12px_rgba(233,30,99,0.5)]"
            : "bg-white/10 text-white/60"
        }`}
      >
        {index + 1}
      </button>

      {/* Reps */}
      <div className="flex-1">
        <input
          ref={isFirst ? repsRef : undefined}
          type="number"
          inputMode="numeric"
          placeholder="Reps"
          value={set.reps}
          onChange={(e) => onUpdate({ reps: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      {/* Peso */}
      <div className="flex-1">
        <input
          type="number"
          inputMode="decimal"
          placeholder="kg"
          value={set.weight}
          onChange={(e) => onUpdate({ weight: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      {/* RPE */}
      <div className="w-16">
        <input
          type="number"
          inputMode="numeric"
          placeholder="RPE"
          min="1"
          max="10"
          value={set.rpe}
          onChange={(e) => onUpdate({ rpe: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      {/* Remover série */}
      <button
        onClick={onRemove}
        className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors flex-shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Componente ExerciseBlock ─────────────────────────────────────────────────

interface ExerciseBlockProps {
  exercise: WorkoutExercise;
  index: number;
  onUpdate: (updated: WorkoutExercise) => void;
  onRemove: () => void;
}

export function ExerciseBlock({ exercise, index, onUpdate, onRemove }: ExerciseBlockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedSubGroup, setSelectedSubGroup] = useState<string | null>(null);
  const firstRepsRef = useRef<HTMLInputElement>(null);
  const recentExercises = getRecentExercises();

  // suppress unused warning — useEffect kept for future scroll-to-ref behavior
  useEffect(() => {}, []);

  const isConfigured = !!exercise.exerciseName;
  const groups = Object.keys(CATALOG);

  function handleSelectGroup(group: string) {
    setSelectedGroup(group === selectedGroup ? null : group);
    setSelectedSubGroup(null);
  }

  function handleSelectSubGroup(sub: string) {
    setSelectedSubGroup(sub === selectedSubGroup ? null : sub);
  }

  function handleSelectExercise(name: string, sub: string, group: string) {
    saveRecentExercise(name);
    onUpdate({
      ...exercise,
      exerciseName: name,
      subGroup: sub,
      muscleGroup: group,
    });
    setSelectedGroup(null);
    setSelectedSubGroup(null);
    // Foca no primeiro campo de reps após selecionar
    setTimeout(() => firstRepsRef.current?.focus(), 100);
  }

  function updateSet(setId: string, partial: Partial<WorkoutSet>) {
    onUpdate({
      ...exercise,
      sets: exercise.sets.map((s) => (s.id === setId ? { ...s, ...partial } : s)),
    });
  }

  function removeSet(setId: string) {
    if (exercise.sets.length <= 1) return;
    onUpdate({ ...exercise, sets: exercise.sets.filter((s) => s.id !== setId) });
  }

  function addSet() {
    onUpdate({ ...exercise, sets: [...exercise.sets, newSet()] });
  }

  const subGroups = selectedGroup ? Object.keys(CATALOG[selectedGroup]) : [];
  const exerciseList =
    selectedGroup && selectedSubGroup ? CATALOG[selectedGroup][selectedSubGroup] : [];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* Header do bloco */}
      <div className="flex items-center gap-3 p-4">
        {/* Número */}
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-[0_0_12px_rgba(233,30,99,0.4)]">
          {index + 1}
        </div>

        {/* Nome do exercício ou placeholder */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold truncate text-sm ${isConfigured ? "text-white" : "text-white/40"}`}>
            {exercise.exerciseName || "Novo exercício"}
          </p>
          {isConfigured && (
            <p className="text-xs text-white/40 truncate">
              {exercise.subGroup} · {exercise.muscleGroup}
            </p>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>

        {/* Deletar exercício */}
        <button
          onClick={onRemove}
          className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
        </button>
      </div>

      {/* Corpo — visível quando não colapsado */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-4">
          {/* ── Seletor de exercício (3 níveis) ── */}
          <div className="space-y-3">
            {/* Nível 1: Grupo Muscular */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Grupo Muscular</p>
              <div className="flex gap-2">
                {groups.map((group) => (
                  <button
                    key={group}
                    onClick={() => handleSelectGroup(group)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                      selectedGroup === group
                        ? "bg-primary text-white shadow-[0_0_12px_rgba(233,30,99,0.4)]"
                        : "bg-white/[0.08] text-white/60 hover:bg-white/[0.12]"
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            {/* Nível 2: Subgrupo */}
            {selectedGroup && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Subgrupo</p>
                <div className="flex flex-wrap gap-2">
                  {subGroups.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => handleSelectSubGroup(sub)}
                      className={`py-1.5 px-3 rounded-xl text-sm font-medium transition-all ${
                        selectedSubGroup === sub
                          ? "bg-primary text-white shadow-[0_0_10px_rgba(233,30,99,0.3)]"
                          : "bg-white/[0.08] text-white/50 hover:bg-white/[0.12]"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nível 3: Lista de exercícios */}
            {selectedSubGroup && exerciseList.length > 0 && (
              <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                {/* Exercícios recentes no topo se houver match */}
                {recentExercises.filter((r) => exerciseList.includes(r)).length > 0 && (
                  <div className="px-3 py-2 bg-white/[0.02] border-b border-white/[0.08]">
                    <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Recentes</p>
                    {recentExercises
                      .filter((r) => exerciseList.includes(r))
                      .map((name) => (
                        <button
                          key={name}
                          onClick={() => handleSelectExercise(name, selectedSubGroup!, selectedGroup!)}
                          className="w-full text-left py-2 px-1 text-sm font-medium text-primary/90 hover:text-primary transition-colors border-b border-white/5 last:border-0"
                        >
                          ★ {name}
                        </button>
                      ))}
                  </div>
                )}

                {/* Lista completa */}
                <div className="max-h-48 overflow-y-auto">
                  {exerciseList.map((name, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectExercise(name, selectedSubGroup!, selectedGroup!)}
                      className="w-full text-left py-3 px-4 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0"
                    >
                      {name}
                    </button>
                  ))}
                </div>

                {/* Fallback: digitar nome livre */}
                <div className="border-t border-white/[0.08] p-2">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value)
                        handleSelectExercise(e.target.value, selectedSubGroup!, selectedGroup!);
                    }}
                    className="w-full bg-transparent text-white/40 text-sm py-2 px-2 focus:outline-none"
                  >
                    <option value="">Selecione o exercício</option>
                    {exerciseList.map((name, i) => (
                      <option key={i} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── Séries — só exibe se exercício foi escolhido ── */}
          {isConfigured && (
            <div>
              {/* Cabeçalho das colunas */}
              <div className="flex items-center gap-2 mb-1 px-1">
                <div className="w-8" />
                <div className="flex-1 text-xs text-white/30 uppercase tracking-wider">Reps</div>
                <div className="flex-1 text-xs text-white/30 uppercase tracking-wider">Peso (kg)</div>
                <div className="w-16 text-xs text-white/30 uppercase tracking-wider">RPE</div>
                <div className="w-7" />
              </div>

              {/* Linhas de série */}
              {exercise.sets.map((set, i) => (
                <SetRow
                  key={set.id}
                  set={set}
                  index={i}
                  isFirst={i === 0}
                  repsRef={firstRepsRef}
                  onUpdate={(partial) => updateSet(set.id, partial)}
                  onRemove={() => removeSet(set.id)}
                />
              ))}

              {/* Botão adicionar série */}
              <button
                onClick={addSet}
                className="mt-3 w-full py-2 rounded-xl border border-dashed border-white/15 text-white/40 text-sm hover:border-primary/40 hover:text-primary/60 transition-all"
              >
                + Adicionar série
              </button>

              {/* Notas do exercício */}
              <textarea
                placeholder="Observações deste exercício..."
                value={exercise.notes}
                onChange={(e) => onUpdate({ ...exercise, notes: e.target.value })}
                rows={2}
                className="mt-3 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helper para criar exercício vazio ────────────────────────────────────────

export function newExercise(): WorkoutExercise {
  return {
    id: crypto.randomUUID(),
    exerciseName: "",
    muscleGroup: "",
    subGroup: "",
    sets: [{ id: crypto.randomUUID(), reps: "", weight: "", rpe: "", completed: false }],
    notes: "",
  };
}
