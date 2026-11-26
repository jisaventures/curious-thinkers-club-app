alter table public.accounts
  add column if not exists region text not null default 'Europe';

alter table public.accounts
  drop constraint if exists accounts_region_chk;

alter table public.accounts
  add constraint accounts_region_chk check (
    region in ('Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania', 'Middle East')
  );

create or replace function public.leaderboard_roster()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(person)), '[]'::jsonb)
  from (
    select
      c.id,
      c.nickname,
      c.first_name,
      coalesce(a.region, 'Europe') as region,
      (c.account_id = auth.uid()) as is_mine,
      c.age_years,
      c.created_at,
      c.gender,
      c.avatar_key,
      c.avatar_options,
      c.avatar_bg,
      c.avatar_face,
      c.avatar_hair_style,
      c.avatar_hair_colour,
      c.avatar_glasses,
      c.avatar_hat,
      c.avatar_skin,
      c.avatar_eyes,
      c.avatar_shirt,
      coalesce((
        select jsonb_agg(jsonb_build_object('at', l.created_at, 'amount', l.amount) order by l.created_at)
        from public.points_ledger l
        where l.child_id = c.id
      ), '[]'::jsonb) as events,
      coalesce((
        select jsonb_object_agg(done.pack_id, done.total)
        from (
          select st.pack_id, count(*)::int as total
          from public.step_progress sp
          join public.steps st on st.id = sp.step_id
          where sp.child_id = c.id
            and sp.status = 'complete'
          group by st.pack_id
        ) done
      ), '{}'::jsonb) as done_by_pack
    from public.children c
    join public.accounts a on a.id = c.account_id
  ) person;
$$;

revoke all on function public.leaderboard_roster() from public;
grant execute on function public.leaderboard_roster() to authenticated;
