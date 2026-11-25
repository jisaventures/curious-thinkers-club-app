-- One editable dashboard promo, plus page counts on packs.
-- Purchase dates already live on pack_ownership.granted_at.
-- Work sent per pack is counted from submissions.pack_id.

alter table public.packs
  add column if not exists page_count integer check (page_count is null or (page_count >= 0 and page_count < 500));

create table if not exists public.dashboard_banners (
  id text primary key,
  image_url text not null check (char_length(image_url) between 1 and 2000000),
  badge_text text not null check (char_length(badge_text) between 1 and 40),
  headline text not null check (char_length(headline) between 2 and 80),
  subtext text not null check (char_length(subtext) between 2 and 180),
  button_label text not null check (char_length(button_label) between 2 and 40),
  button_link text not null check (char_length(button_link) between 1 and 300),
  background text not null check (char_length(background) between 1 and 200),
  text_colour text not null check (text_colour ~ '^#[0-9A-Fa-f]{3,8}$'),
  visible boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.dashboard_banners (
  id, image_url, badge_text, headline, subtext, button_label, button_link, background, text_colour, visible
) values (
  'club-kit',
  '/brand/merch-banner-v2.png',
  'Club Merch',
  E'Get the official\nclub kit!',
  'Show you''re a Curious Thinker. Free drawstring bag with every bundle.',
  'Shop Now',
  'https://curiousthinkersclub.org',
  'linear-gradient(115deg, #12352a 0%, #1b4d3c 46%, #2a6a52 100%)',
  '#fffaf2',
  true
) on conflict (id) do nothing;

alter table public.dashboard_banners enable row level security;

create policy dashboard_banners_select on public.dashboard_banners
  for select to authenticated
  using (true);

create policy dashboard_banners_write on public.dashboard_banners
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.dashboard_banners to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dashboard-banners',
  'dashboard-banners',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy dashboard_banner_read on storage.objects
  for select to public
  using (bucket_id = 'dashboard-banners');

create policy dashboard_banner_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dashboard-banners' and public.is_admin());

create policy dashboard_banner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'dashboard-banners' and public.is_admin());
