-- ============================================================
-- GlePower Tracker — Training Cycles
-- Cole este SQL no SQL Editor do Supabase e execute
-- ============================================================

create table if not exists training_cycles (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references students(id) on delete cascade,
  plan_id      uuid references workout_plans(id) on delete set null,
  cycle_number int  not null default 1,
  name         text not null,
  start_date   date not null,
  end_date     date,
  status       text not null default 'active' check (status in ('active', 'completed')),
  summary      jsonb,
  created_at   timestamptz default now()
);

alter table training_cycles enable row level security;
create policy "anon_all_cycles" on training_cycles for all using (true);

create index if not exists training_cycles_student_plan_idx
  on training_cycles (student_id, plan_id);

create index if not exists training_cycles_plan_status_idx
  on training_cycles (plan_id, status);
