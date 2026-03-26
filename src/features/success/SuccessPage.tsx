import { useSession } from '@/shared/store/SessionContext'
import { PageContainer } from '@/shared/components/layout/PageContainer'
import { Button } from '@/shared/components/ui/Button'

export function SuccessPage() {
  const { state, navigate } = useSession()

  const totalExercises = state.workout?.exercises.length ?? 0
  const totalSets = state.workout?.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0,
  ) ?? 0

  return (
    <PageContainer centered className="min-h-dvh bg-gradient-brand px-6 py-16">
      {/* Headline */}
      <div className="text-center animate-slide-up">
        <p className="font-body text-sm tracking-widest uppercase text-primary-light mb-3">
          sessão concluída
        </p>

        <h1 className="font-display text-6xl italic uppercase text-white leading-none">
          Treino
        </h1>
        <div className="flex items-center justify-center gap-3 my-1">
          <span className="h-px flex-1 bg-primary/50" />
          <span className="font-display text-5xl italic uppercase text-primary">
            Concluído!
          </span>
          <span className="h-px flex-1 bg-primary/50" />
        </div>
        <h2 className="font-display text-3xl italic uppercase text-accent mt-1">
          {state.student?.name ?? ''}
        </h2>
      </div>

      {/* Stats */}
      <div className="flex gap-6 justify-center mt-12 animate-fade-in">
        <div className="text-center">
          <p className="font-display text-5xl italic text-white">{totalExercises}</p>
          <p className="text-xs text-text-muted uppercase tracking-widest mt-1">exercícios</p>
        </div>
        <div className="w-px bg-surface-overlay" />
        <div className="text-center">
          <p className="font-display text-5xl italic text-white">{totalSets}</p>
          <p className="text-xs text-text-muted uppercase tracking-widest mt-1">séries feitas</p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 w-full max-w-xs animate-slide-up">
        <Button size="full" onClick={() => navigate('student-select')}>
          Nova Sessão
        </Button>
      </div>
    </PageContainer>
  )
}
