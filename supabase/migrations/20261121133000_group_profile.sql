alter table public.accounts
  add column if not exists group_name text,
  add column if not exists group_type text,
  add column if not exists group_location text,
  add column if not exists group_icon text,
  add column if not exists group_icon_colour text,
  add column if not exists group_bg text;
