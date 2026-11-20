alter table public.children
  add column first_name text,
  add column gender text,
  add column avatar_bg text,
  add column avatar_face text,
  add column avatar_hair_style text,
  add column avatar_hair_colour text,
  add column avatar_glasses boolean,
  add column avatar_hat text,
  add column avatar_skin text,
  add column avatar_eyes text,
  add column avatar_shirt text;

alter table public.children
  add constraint children_gender_chk check (gender is null or gender in ('boy', 'girl', 'unspecified')),
  add constraint children_first_name_chk check (
    first_name is null
    or (
      char_length(btrim(first_name)) between 1 and 40
      and first_name ~ '^[A-Za-z][A-Za-z ''-]{0,39}$'
    )
  );

create or replace function public.nickname_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.children
    where lower(nickname) = lower(btrim(candidate))
  );
$$;

revoke all on function public.nickname_available(text) from public;
grant execute on function public.nickname_available(text) to authenticated;
