-- Curious Thinkers Club v1
-- Families are isolated with row level security. The service role (webhooks,
-- local seed via the database superuser) bypasses RLS. Members never receive
-- the service role key.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email text not null,
  is_adult_confirmed boolean not null default false,
  adult_confirmed_at timestamptz,
  role text not null default 'member' check (role in ('member', 'admin')),
  shopify_customer_id text,
  created_at timestamptz not null default now(),
  constraint accounts_display_name_chk check (
    char_length(display_name) between 1 and 40
    and display_name ~ '^[A-Za-z][A-Za-z ''-]{0,39}$'
  )
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  nickname text not null,
  avatar_key text not null,
  age_years integer not null check (age_years between 2 and 12),
  created_at timestamptz not null default now(),
  constraint children_nickname_chk check (
    char_length(btrim(nickname)) between 1 and 24
    and nickname !~ '@'
    and nickname !~ '[[:cntrl:]]'
    and nickname ~ '^[A-Za-z0-9][A-Za-z0-9 ''-]{0,23}$'
  ),
  constraint children_avatar_chk check (
    avatar_key in (
      'pirate', 'captain', 'magpie', 'star', 'dino',
      'astronaut', 'knight', 'explorer', 'fox', 'owl'
    )
  )
);

create unique index children_nickname_unique
  on public.children (account_id, lower(nickname));

create table public.packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 2 and 80),
  theme text not null check (char_length(theme) between 2 and 40),
  age_min integer not null check (age_min between 2 and 12),
  age_max integer not null check (age_max between 2 and 14),
  duration_minutes integer not null check (duration_minutes between 15 and 300),
  duration_label text not null check (char_length(duration_label) between 2 and 40),
  blurb text not null check (char_length(blurb) between 2 and 180),
  cover_tone text not null default 'bottle' check (
    cover_tone in ('bottle', 'palm', 'navy', 'plum', 'sea')
  ),
  shopify_product_id text,
  price_pence integer not null default 899 check (price_pence >= 0 and price_pence < 100000),
  certificate_bonus_points integer not null default 50 check (certificate_bonus_points between 0 and 200),
  step_count integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint packs_age_range_chk check (age_min <= age_max)
);

create table public.steps (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.packs (id) on delete cascade,
  position integer not null check (position >= 1 and position < 100),
  title text not null check (char_length(title) between 2 and 80),
  description text not null check (char_length(description) between 2 and 400),
  video_url text check (video_url is null or char_length(video_url) <= 500),
  video_provider text not null default 'mp4' check (
    video_provider in ('youtube', 'vimeo', 'mp4', 'storage')
  ),
  printable_ref text check (printable_ref is null or char_length(printable_ref) <= 160),
  estimated_minutes integer not null default 15 check (estimated_minutes between 1 and 120),
  points integer not null default 10 check (points between 1 and 50),
  unique (pack_id, position)
);

create table public.pack_ownership (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  pack_id uuid not null references public.packs (id) on delete cascade,
  source text not null check (source in ('shopify_webhook', 'admin_grant', 'seed')),
  shopify_order_id text,
  granted_at timestamptz not null default now(),
  unique (account_id, pack_id)
);

create index pack_ownership_account_idx on public.pack_ownership (account_id);

create table public.step_progress (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  step_id uuid not null references public.steps (id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'complete')),
  video_position_seconds integer not null default 0 check (
    video_position_seconds >= 0 and video_position_seconds <= 21600
  ),
  completed_at timestamptz,
  points_awarded integer not null default 0 check (points_awarded >= 0 and points_awarded <= 50),
  unique (child_id, step_id)
);

create index step_progress_child_idx on public.step_progress (child_id);

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  amount integer not null check (amount > 0 and amount <= 2000),
  reason text not null check (
    reason in ('step_complete', 'pack_certificate', 'submission_featured', 'opening_balance')
  ),
  ref_id uuid not null,
  created_at timestamptz not null default now(),
  unique (child_id, reason, ref_id)
);

create index points_ledger_child_idx on public.points_ledger (child_id, created_at);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  pack_id uuid not null references public.packs (id) on delete cascade,
  bonus_points integer not null check (bonus_points >= 0),
  awarded_at timestamptz not null default now(),
  unique (child_id, pack_id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  pack_id uuid references public.packs (id) on delete set null,
  storage_path text not null check (char_length(storage_path) between 3 and 300),
  consent_social boolean not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index submissions_status_idx on public.submissions (status, created_at desc);

create table public.reward_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{4,24}$'),
  headline text not null check (char_length(headline) between 2 and 120),
  description text not null check (char_length(description) between 2 and 240),
  min_points integer not null default 0 check (min_points >= 0 and min_points < 100000),
  active boolean not null default true,
  sort_order integer not null default 0
);

create table public.prizes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 80),
  detail text not null check (char_length(detail) between 2 and 120),
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Auth helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.accounts
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.accounts (id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Friend'),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_account_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'You cannot change account roles';
    end if;
    if new.email is distinct from old.email then
      raise exception 'Email is managed by sign-in';
    end if;
    if new.shopify_customer_id is distinct from old.shopify_customer_id then
      raise exception 'Shop link is managed by the shop';
    end if;
  end if;
  return new;
end;
$$;

create trigger accounts_protect_role
  before update on public.accounts
  for each row execute function public.protect_account_role();

create or replace function public.limit_children()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.children
    where account_id = new.account_id
  ) >= 5 then
    raise exception 'This club account already has 5 children';
  end if;
  return new;
end;
$$;

create trigger children_limit
  before insert on public.children
  for each row execute function public.limit_children();

create or replace function public.refresh_step_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  pid := coalesce(new.pack_id, old.pack_id);
  update public.packs
    set step_count = (select count(*) from public.steps where pack_id = pid)
    where id = pid;
  if tg_op = 'UPDATE' and old.pack_id is distinct from new.pack_id then
    update public.packs
      set step_count = (select count(*) from public.steps where pack_id = old.pack_id)
      where id = old.pack_id;
  end if;
  return null;
end;
$$;

create trigger steps_refresh_count
  after insert or update or delete on public.steps
  for each row execute function public.refresh_step_count();

-- Awards points on the server. Clients cannot choose the point value.
create or replace function public.handle_step_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pack uuid;
  v_position integer;
  v_points integer;
  v_account uuid;
  v_total integer;
  v_done integer;
  v_bonus integer;
begin
  if tg_op = 'UPDATE' and old.status = 'complete' then
    new.status := 'complete';
    new.points_awarded := old.points_awarded;
    new.completed_at := old.completed_at;
    new.video_position_seconds := old.video_position_seconds;
    return new;
  end if;

  select s.pack_id, s.position, s.points
    into v_pack, v_position, v_points
  from public.steps s
  where s.id = new.step_id;

  if v_pack is null then
    raise exception 'Unknown step';
  end if;

  select c.account_id into v_account
  from public.children c
  where c.id = new.child_id;

  if v_account is null then
    raise exception 'Unknown child';
  end if;

  if not exists (
    select 1
    from public.pack_ownership po
    where po.account_id = v_account
      and po.pack_id = v_pack
  ) then
    raise exception 'This pack is not unlocked for your club';
  end if;

  if new.video_position_seconds < 0 or new.video_position_seconds > 21600 then
    raise exception 'Invalid video position';
  end if;

  if exists (
    select 1
    from public.steps s
    where s.pack_id = v_pack
      and s.position < v_position
      and not exists (
        select 1
        from public.step_progress sp
        where sp.child_id = new.child_id
          and sp.step_id = s.id
          and sp.status = 'complete'
      )
  ) then
    raise exception 'Finish the earlier steps first';
  end if;

  if new.status = 'in_progress' then
    new.points_awarded := 0;
    new.completed_at := null;
    return new;
  end if;

  if new.status <> 'complete' then
    raise exception 'Invalid progress';
  end if;

  new.points_awarded := v_points;
  new.completed_at := coalesce(new.completed_at, now());

  insert into public.points_ledger (child_id, account_id, amount, reason, ref_id)
  values (new.child_id, v_account, v_points, 'step_complete', new.step_id)
  on conflict (child_id, reason, ref_id) do nothing;

  select count(*) into v_total from public.steps where pack_id = v_pack;

  select count(*) into v_done
  from public.step_progress sp
  join public.steps s on s.id = sp.step_id
  where sp.child_id = new.child_id
    and s.pack_id = v_pack
    and sp.status = 'complete'
    and sp.step_id <> new.step_id;

  if v_done + 1 >= v_total then
    select p.certificate_bonus_points into v_bonus
    from public.packs p
    where p.id = v_pack;

    insert into public.certificates (child_id, pack_id, bonus_points)
    values (new.child_id, v_pack, coalesce(v_bonus, 50))
    on conflict (child_id, pack_id) do nothing;

    if coalesce(v_bonus, 50) > 0 then
      insert into public.points_ledger (child_id, account_id, amount, reason, ref_id)
      values (new.child_id, v_account, coalesce(v_bonus, 50), 'pack_certificate', v_pack)
      on conflict (child_id, reason, ref_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

create trigger step_progress_award
  before insert or update on public.step_progress
  for each row execute function public.handle_step_progress();

-- Nicknames, ages and points only. No account ids, emails or storage paths.
create or replace function public.leaderboard_month()
returns table (
  nickname text,
  age_years integer,
  avatar_key text,
  points integer,
  rank integer,
  is_mine boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with totals as (
    select
      c.nickname,
      c.age_years,
      c.avatar_key,
      c.account_id,
      coalesce(sum(l.amount), 0)::integer as points
    from public.children c
    left join public.points_ledger l
      on l.child_id = c.id
     and l.created_at >= date_trunc('month', now())
    group by c.id
  ),
  ranked as (
    select
      nickname,
      age_years,
      avatar_key,
      points,
      rank() over (order by points desc, nickname asc)::integer as rank,
      (account_id = auth.uid()) as is_mine
    from totals
    where points > 0
  )
  select nickname, age_years, avatar_key, points, rank, is_mine
  from ranked
  order by rank, nickname
  limit 20;
$$;

create or replace function public.review_submission(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.submissions%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;
  if p_status not in ('approved', 'rejected') then
    raise exception 'Invalid status';
  end if;

  select * into sub from public.submissions where id = p_id for update;
  if not found then
    raise exception 'Submission not found';
  end if;
  if sub.status <> 'pending' then
    raise exception 'Already reviewed';
  end if;

  update public.submissions
    set status = p_status,
        reviewed_at = now()
    where id = p_id;

  if p_status = 'approved' then
    insert into public.points_ledger (child_id, account_id, amount, reason, ref_id)
    values (sub.child_id, sub.account_id, 25, 'submission_featured', sub.id)
    on conflict (child_id, reason, ref_id) do nothing;
  end if;
end;
$$;

create or replace function public.reorder_steps(p_pack_id uuid, p_step_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  i integer;
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;
  if p_step_ids is null or array_length(p_step_ids, 1) is null then
    raise exception 'Step list mismatch';
  end if;
  if (
    select count(*) from public.steps where pack_id = p_pack_id
  ) <> array_length(p_step_ids, 1) then
    raise exception 'Step list mismatch';
  end if;
  if (
    select count(distinct id)
    from unnest(p_step_ids) as id
  ) <> array_length(p_step_ids, 1) then
    raise exception 'Step list mismatch';
  end if;
  if (
    select count(*)
    from public.steps
    where pack_id = p_pack_id
      and id = any (p_step_ids)
  ) <> array_length(p_step_ids, 1) then
    raise exception 'Step list mismatch';
  end if;

  update public.steps
    set position = position + 1000
    where pack_id = p_pack_id;

  for i in 1..array_length(p_step_ids, 1) loop
    update public.steps
      set position = i
      where id = p_step_ids[i]
        and pack_id = p_pack_id;
  end loop;
end;
$$;

create or replace function public.can_read_pack_video(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.pack_ownership po
      where po.account_id = auth.uid()
        and po.pack_id::text = (storage.foldername(object_name))[1]
    );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.leaderboard_month() from public;
revoke all on function public.review_submission(uuid, text) from public;
revoke all on function public.reorder_steps(uuid, uuid[]) from public;
revoke all on function public.can_read_pack_video(text) from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.leaderboard_month() to authenticated;
grant execute on function public.review_submission(uuid, text) to authenticated;
grant execute on function public.reorder_steps(uuid, uuid[]) to authenticated;
grant execute on function public.can_read_pack_video(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.accounts enable row level security;
alter table public.children enable row level security;
alter table public.packs enable row level security;
alter table public.steps enable row level security;
alter table public.pack_ownership enable row level security;
alter table public.step_progress enable row level security;
alter table public.points_ledger enable row level security;
alter table public.certificates enable row level security;
alter table public.submissions enable row level security;
alter table public.reward_codes enable row level security;
alter table public.prizes enable row level security;

create policy accounts_select on public.accounts
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy accounts_insert on public.accounts
  for insert to authenticated
  with check (id = auth.uid() and role = 'member');

create policy accounts_update on public.accounts
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy children_all on public.children
  for all to authenticated
  using (account_id = auth.uid() or public.is_admin())
  with check (account_id = auth.uid() or public.is_admin());

create policy packs_select on public.packs
  for select to authenticated
  using (published or public.is_admin());

create policy packs_insert on public.packs
  for insert to authenticated
  with check (public.is_admin());

create policy packs_update on public.packs
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy packs_delete on public.packs
  for delete to authenticated
  using (public.is_admin());

-- Step videos and printable notes are the paid pack. Locked packs stay hidden.
create policy steps_select on public.steps
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.pack_ownership po
      where po.pack_id = steps.pack_id
        and po.account_id = auth.uid()
    )
  );

create policy steps_insert on public.steps
  for insert to authenticated
  with check (public.is_admin());

create policy steps_update on public.steps
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy steps_delete on public.steps
  for delete to authenticated
  using (public.is_admin());

create policy ownership_select on public.pack_ownership
  for select to authenticated
  using (account_id = auth.uid() or public.is_admin());

create policy ownership_insert on public.pack_ownership
  for insert to authenticated
  with check (public.is_admin());

create policy ownership_delete on public.pack_ownership
  for delete to authenticated
  using (public.is_admin());

create policy progress_all on public.step_progress
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.children c
      where c.id = step_progress.child_id
        and c.account_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.children c
      where c.id = step_progress.child_id
        and c.account_id = auth.uid()
    )
  );

create policy ledger_select on public.points_ledger
  for select to authenticated
  using (account_id = auth.uid() or public.is_admin());

create policy certificates_select on public.certificates
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.children c
      where c.id = certificates.child_id
        and c.account_id = auth.uid()
    )
  );

create policy submissions_select on public.submissions
  for select to authenticated
  using (account_id = auth.uid() or public.is_admin());

create policy submissions_insert on public.submissions
  for insert to authenticated
  with check (
    account_id = auth.uid()
    and status = 'pending'
    and consent_social = true
    and exists (
      select 1
      from public.children c
      where c.id = child_id
        and c.account_id = auth.uid()
    )
  );

create policy submissions_delete_pending on public.submissions
  for delete to authenticated
  using (account_id = auth.uid() and status = 'pending');

create policy rewards_select on public.reward_codes
  for select to authenticated
  using (active or public.is_admin());

create policy rewards_write on public.reward_codes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy prizes_select on public.prizes
  for select to authenticated
  using (true);

create policy prizes_write on public.prizes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- rewards_write FOR ALL also adds a select for admins; the select policy
-- already covers active codes. Permissive policies are OR-combined.

grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'work-submissions',
    'work-submissions',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'pack-videos',
    'pack-videos',
    false,
    83886080,
    array['video/mp4', 'video/webm']
  )
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy work_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'work-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy work_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'work-submissions'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

create policy work_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'work-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy pack_video_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pack-videos' and public.is_admin());

create policy pack_video_update on storage.objects
  for update to authenticated
  using (bucket_id = 'pack-videos' and public.is_admin())
  with check (bucket_id = 'pack-videos' and public.is_admin());

create policy pack_video_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'pack-videos'
    and public.can_read_pack_video(name)
  );
