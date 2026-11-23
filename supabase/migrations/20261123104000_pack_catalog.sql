-- Fields the dashboard needs that were not on packs yet:
-- free packs, upcoming (unreleased) packs, and how many work
-- submissions a pack can take. Reminders are stored so a launch email
-- can be sent later.

alter table public.packs
  add column if not exists free boolean not null default false,
  add column if not exists upcoming boolean not null default false,
  add column if not exists submission_slots integer not null default 3
    check (submission_slots between 0 and 20);

create table if not exists public.pack_reminders (
  account_id uuid not null references public.accounts (id) on delete cascade,
  pack_id uuid not null references public.packs (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  primary key (account_id, pack_id)
);

alter table public.pack_reminders enable row level security;

create policy pack_reminders_select on public.pack_reminders
  for select to authenticated
  using (account_id = auth.uid() or public.is_admin());

create policy pack_reminders_insert on public.pack_reminders
  for insert to authenticated
  with check (account_id = auth.uid());
