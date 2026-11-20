-- Orders the webhook could not attach to a club account yet.
-- Admins can retry them after the adult has signed in with the same email.

create table public.shopify_events (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id text not null,
  email text,
  shopify_customer_id text,
  product_ids text[] not null default '{}',
  status text not null check (status in ('granted', 'unmatched', 'no_products')),
  detail text,
  created_at timestamptz not null default now()
);

alter table public.shopify_events enable row level security;

create policy shopify_events_admin on public.shopify_events
  for select to authenticated
  using (public.is_admin());

create policy shopify_events_admin_update on public.shopify_events
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, update on public.shopify_events to authenticated;
grant all on public.shopify_events to service_role;

revoke all on all tables in schema public from anon;
