// src/features/progress/ProgressPage.tsx

import { useState, useEffect, type ReactNode } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Legend,
} from "recharts";
import { useProgressData } from "./useProgressData";
import { api } from "@/shared/services/api";
import type { WorkoutExecution } from "@/shared/types";

interface ProgressPageProps {
  studentId: string;
  studentName: string;
  onBack: () => void;
}

type ActiveTab = "resumo" | "exercicios" | "musculos";

const ExerciseTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a0f26] border border-white/20 rounded-xl p-3 shadow-xl min-w-[140px]">
      <p className="text-white/60 text-xs mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}:{" "}
          {entry.name === "Volume"
            ? entry.value >= 1000
              ? `${(entry.value / 1000).toFixed(1)}t`
              : `${entry.value}kg`
            : `${entry.value}kg`}
        </p>
      ))}
    </div>
  );
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a0f26] border border-white/20 rounded-xl p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-1">{label}</p>
      <p className="text-sm font-semibold text-primary">{payload[0].value}t</p>
    </div>
  );
};

export function ProgressPage({ studentId, studentName, onBack }: ProgressPageProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("resumo");
  const [executions, setExecutions] = useState<WorkoutExecution[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setDataLoading(false); return; }
    api.listExecutions(studentId).then((res) => {
      if (res.success && res.data) setExecutions(res.data);
      setDataLoading(false);
    });
  }, [studentId]);

  const data = useProgressData(executions);

  const tabs: { id: ActiveTab; label: string; icon: ReactNode }[] = [
    {
      id: "resumo",
      label: "Resumo",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      id: "exercicios",
      label: "Exercícios",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4v6a6 6 0 0012 0V4" /><line x1="4" y1="20" x2="20" y2="20" />
        </svg>
      ),
    },
    {
      id: "musculos",
      label: "Músculos",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-white/[0.08]">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.08] text-white/60 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Progressão de Treinos</h1>
            <p className="text-xs text-white/40">{studentName} · Evolução de carga e volume</p>
          </div>
        </div>

        <div className="flex px-4 pb-3 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 flex-1 justify-center py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-[0_0_12px_rgba(233,30,99,0.4)]"
                  : "bg-white/[0.08] text-white/50 hover:bg-white/[0.12]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-8">
        {/* ABA RESUMO */}
        {activeTab === "resumo" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-xs text-white/40 mb-1">Volume Total</p>
                <p className="text-3xl font-bold text-primary">
                  {dataLoading ? "..." : data.totalVolumeTons > 0 ? `${data.totalVolumeTons}t` : "—"}
                </p>
                <p className="text-xs text-white/30 mt-1">últimas 8 semanas</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-xs text-white/40 mb-1">Sessões</p>
                <p className="text-3xl font-bold text-primary">{dataLoading ? "..." : data.totalSessions}</p>
                <p className="text-xs text-white/30 mt-1">treinos registrados</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <h3 className="font-bold text-white mb-1">Volume Semanal Total</h3>
              <p className="text-xs text-white/40 mb-4">Últimas 8 semanas (em toneladas)</p>

              {dataLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : data.totalSessions === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-white/25">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                    <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
                  </svg>
                  <p className="text-sm">Sem dados ainda</p>
                  <p className="text-xs">Registre treinos para ver o gráfico</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.weeklyVolume} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}t`} />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                      {data.weeklyVolume.map((entry, index) => (
                        <Cell key={index} fill={entry.isCurrent ? "#E91E63" : "#2a2a3e"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}

        {/* ABA EXERCÍCIOS */}
        {activeTab === "exercicios" && (
          <>
            {data.exerciseProgress.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/25">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                  <path d="M6 4v6a6 6 0 0012 0V4" /><line x1="4" y1="20" x2="20" y2="20" />
                </svg>
                <p className="text-sm font-medium">Nenhum exercício registrado</p>
                <p className="text-xs mt-1 text-center">Registre treinos para acompanhar a evolução de carga</p>
              </div>
            ) : (
              data.exerciseProgress.map((exercise) => (
                <div key={exercise.name} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <h3 className="font-bold text-white text-base">{exercise.name}</h3>
                  <p className="text-xs text-white/40 mb-4">{exercise.muscleGroup}</p>

                  {exercise.data.length === 1 ? (
                    /* Primeira sessão — card com valores, sem gráfico ainda */
                    <div className="flex justify-around items-center py-4">
                      <div className="text-center">
                        <p className="text-xs text-white/40 mb-1">Carga Máx</p>
                        <p className="text-2xl font-bold text-primary">{exercise.data[0].maxLoad}kg</p>
                      </div>
                      <div className="w-px h-10 bg-white/10" />
                      <div className="text-center">
                        <p className="text-xs text-white/40 mb-1">Volume</p>
                        <p className="text-2xl font-bold text-violet-400">
                          {exercise.data[0].totalVolume >= 1000
                            ? `${(exercise.data[0].totalVolume / 1000).toFixed(1)}t`
                            : `${exercise.data[0].totalVolume}kg`}
                        </p>
                      </div>
                      <div className="w-px h-10 bg-white/10" />
                      <div className="text-center">
                        <p className="text-xs text-white/40 mb-1">Data</p>
                        <p className="text-sm font-semibold text-white/60">{exercise.data[0].date}</p>
                      </div>
                    </div>
                  ) : (
                    /* 2+ sessões — gráfico combinado com eixo duplo */
                    <ResponsiveContainer width="100%" height={180}>
                      <ComposedChart data={exercise.data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        {/* Eixo esquerdo: Carga Máx (kg) */}
                        <YAxis
                          yAxisId="load"
                          tick={{ fill: "#E91E63", fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}kg`}
                          width={38}
                        />
                        {/* Eixo direito: Volume (kg ou t) */}
                        <YAxis
                          yAxisId="vol"
                          orientation="right"
                          tick={{ fill: "#7C3AED", fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}kg`}
                          width={36}
                        />
                        <Tooltip content={<ExerciseTooltip />} />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                          formatter={(value, entry: any) => (
                            <span style={{ color: entry.color }}>{value}</span>
                          )}
                        />
                        <Line
                          yAxisId="load"
                          type="monotone"
                          dataKey="maxLoad"
                          name="Carga Máx"
                          stroke="#E91E63"
                          strokeWidth={2.5}
                          dot={{ fill: "#E91E63", r: 4, strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: "#E91E63" }}
                        />
                        <Line
                          yAxisId="vol"
                          type="monotone"
                          dataKey="totalVolume"
                          name="Volume"
                          stroke="#7C3AED"
                          strokeWidth={2}
                          strokeDasharray="5 3"
                          dot={{ fill: "#7C3AED", r: 3, strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: "#7C3AED" }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* ABA MÚSCULOS */}
        {activeTab === "musculos" && (
          <>
            {data.muscleGroupStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/25">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
                <p className="text-sm font-medium">Nenhum dado ainda</p>
                <p className="text-xs mt-1">Os grupos musculares aparecem após registrar treinos</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-white/30 uppercase tracking-wider">
                  Séries por grupo · últimas 4 semanas
                </p>
                <div className="space-y-3">
                  {data.muscleGroupStats.map((group) => (
                    <div key={group.name} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-white text-sm">{group.name}</p>
                        <p className="text-primary font-bold text-sm">{group.series} séries</p>
                      </div>
                      <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(group.series / group.maxSeries) * 100}%`,
                            background: "linear-gradient(90deg, #311848, #E91E63)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <button
          onClick={onBack}
          className="w-full py-4 rounded-2xl border border-white/10 text-white/60 text-sm font-medium hover:border-white/20 hover:text-white transition-all mt-4"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
