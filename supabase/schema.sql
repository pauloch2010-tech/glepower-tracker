-- ============================================================
-- GlePower Tracker — Supabase Schema
-- Rode este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- ─── Trainers (treinadores / login por PIN) ───────────────────────────────────
create table if not exists trainers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  pin        text not null,
  created_at timestamptz default now()
);

-- Treinadora padrão (PIN: 1234)
insert into trainers (name, pin) values ('Glécia', '1234')
on conflict do nothing;

-- ─── Students (alunos) ────────────────────────────────────────────────────────
create table if not exists students (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  level      text check (level in ('Iniciante', 'Intermediário', 'Avançado')),
  phone      text,
  email      text,
  birth_date date,
  goal       text,
  active     boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger para updated_at automático
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists students_updated_at on students;
create trigger students_updated_at
  before update on students
  for each row execute function update_updated_at();

-- ─── Workout Sessions ──────────────────────────────────────────────────────────
create table if not exists workout_sessions (
  id               uuid primary key,
  student_id       uuid references students(id) on delete cascade,
  trainer_id       uuid references trainers(id),
  date             date not null,
  started_at       timestamptz not null,
  duration_minutes integer,
  wellness         jsonb,
  exercises        jsonb,
  status           text not null default 'completed',
  created_at       timestamptz default now()
);

-- Índice para buscar sessões por aluno
create index if not exists workout_sessions_student_id_idx
  on workout_sessions (student_id, date desc);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Habilitamos RLS mas permitimos acesso via anon key (segurança simples via PIN)
-- Para produção, considere autenticação real com Supabase Auth

alter table trainers enable row level security;
alter table students enable row level security;
alter table workout_sessions enable row level security;

-- Políticas abertas (acesso via anon key do projeto)
create policy "anon_select_trainers"  on trainers        for select using (true);
create policy "anon_all_students"     on students        for all    using (true);
create policy "anon_all_sessions"     on workout_sessions for all   using (true);

-- ─── Dados de exemplo (opcional — remova se preferir começar vazio) ────────────
-- insert into students (name, level, goal) values
--   ('Ana Beatriz', 'Intermediário', 'Hipertrofia e definição'),
--   ('Carlos Mendes', 'Avançado', 'Força e performance'),
--   ('Fernanda Costa', 'Iniciante', 'Emagrecimento e condicionamento');
