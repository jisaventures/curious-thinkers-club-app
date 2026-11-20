-- Demo family and packs for local development.
-- Passwords are random and unknown. Sign in with a magic link, or the dev demo button.

create or replace function public.seed_user(uid uuid, user_email text, display text)
returns void
language plpgsql
as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_sso_user, is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000',
    uid,
    'authenticated',
    'authenticated',
    user_email,
    extensions.crypt(extensions.gen_random_uuid()::text, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', display),
    now(),
    now(),
    '',
    '',
    '',
    '',
    false,
    false
  );

  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    uid::text,
    uid,
    jsonb_build_object('sub', uid::text, 'email', user_email),
    'email',
    now(),
    now(),
    now()
  );
end;
$$;

select public.seed_user('a1000000-0000-4000-8000-000000000001', 'sam@demo.curiousthinkersclub.test', 'Sam');
select public.seed_user('a1000000-0000-4000-8000-000000000002', 'admin@demo.curiousthinkersclub.test', 'Ada');
select public.seed_user('a1000000-0000-4000-8000-000000000003', 'star@demo.curiousthinkersclub.test', 'Star');
select public.seed_user('a1000000-0000-4000-8000-000000000004', 'dex@demo.curiousthinkersclub.test', 'Dex');
select public.seed_user('a1000000-0000-4000-8000-000000000005', 'bea@demo.curiousthinkersclub.test', 'Bea');

update public.accounts
set is_adult_confirmed = true,
    adult_confirmed_at = now();

update public.accounts
set role = 'admin'
where id = 'a1000000-0000-4000-8000-000000000002';

insert into public.children (id, account_id, nickname, avatar_key, age_years, created_at) values
  ('c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Pirate Pip', 'pirate', 7, now() - interval '3 days'),
  ('c1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'Captain Lou', 'captain', 4, now() - interval '2 days'),
  ('c1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', 'Magpie Mo', 'magpie', 5, now() - interval '1 day'),
  ('c1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000003', 'Star Scout', 'star', 8, now() - interval '10 days'),
  ('c1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000004', 'Dino Dex', 'dino', 6, now() - interval '9 days'),
  ('c1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000005', 'Cosmic Bea', 'astronaut', 5, now() - interval '8 days');

insert into public.packs (
  id, slug, title, theme, age_min, age_max, duration_minutes, duration_label, blurb,
  cover_tone, shopify_product_id, price_pence, certificate_bonus_points, published, created_at
) values
  ('b1000000-0000-4000-8000-000000000001', 'be-a-pirate-for-the-day', 'Be a pirate for the day', 'history', 4, 8, 120, 'About 2 hours', 'Learn about real pirates, maps and ships', 'bottle', '900000000001', 899, 50, true, now() - interval '5 days'),
  ('b1000000-0000-4000-8000-000000000002', 'be-an-egyptian-explorer', 'Be an Egyptian explorer', 'history', 6, 10, 120, 'About 2 hours', 'Hieroglyphs, pyramids and real ancient Egypt', 'palm', '900000000002', 899, 50, true, now() - interval '4 days'),
  ('b1000000-0000-4000-8000-000000000003', 'become-a-spy', 'Become a spy', 'codes', 7, 10, 120, 'About 2 hours', 'Learn about real spies, codes and secret messages', 'navy', '900000000003', 899, 50, true, now() - interval '3 days'),
  ('b1000000-0000-4000-8000-000000000004', 'be-a-knight-for-the-day', 'Be a knight for the day', 'castles', 5, 9, 120, 'About 2 hours', 'Castles, armour and real medieval life', 'plum', '900000000004', 899, 50, true, now() - interval '2 days'),
  ('b1000000-0000-4000-8000-000000000005', 'be-a-space-explorer', 'Be a space explorer', 'space', 6, 10, 120, 'About 2 hours', 'Planets, rockets and the real night sky', 'sea', '900000000005', 899, 50, true, now() - interval '1 day');

insert into public.steps (id, pack_id, position, title, description, video_url, video_provider, printable_ref, estimated_minutes, points) values
  ('51100000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 1, 'Meet a real pirate', 'Say hello to a real pirate from history and notice what they actually did.', '/videos/guide.mp4', 'mp4', 'Print page 1 — Meet a real pirate', 15, 10),
  ('51100000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 2, 'Flags and ships', 'Spot the flags and the parts of a ship a crew would know.', '/videos/guide.mp4', 'mp4', 'Print page 2 — Flags and ships', 15, 10),
  ('51100000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 3, 'Read a treasure map', 'Follow the dotted line on the map and mark the landing spot.', '/videos/guide.mp4', 'mp4', 'Print page 4 — Follow the dotted line', 15, 10),
  ('51100000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', 4, 'Make a pirate code', 'Write three fair rules a crew could keep.', '/videos/guide.mp4', 'mp4', 'Print page 5 — A fair pirate code', 15, 10),
  ('51100000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000001', 5, 'Chart your course', 'Find a course with a crayon, then follow the compass points from the video.', '/videos/guide.mp4', 'mp4', 'Print page 6 — The treasure map', 15, 10),
  ('51100000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000001', 6, 'Life on board', 'Find out what people ate, where they slept, and how they passed the time.', '/videos/guide.mp4', 'mp4', 'Print page 7 — Life on board', 15, 10),
  ('51100000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000001', 7, 'Famous pirates', 'Meet two real pirates and one story that grew taller than the truth.', '/videos/guide.mp4', 'mp4', 'Print page 8 — Famous pirates', 15, 10),
  ('51100000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000001', 8, 'Your pirate oath', 'Make a promise about being brave and kind on the crew.', '/videos/guide.mp4', 'mp4', 'Print page 9 — Your pirate oath', 15, 10);

insert into public.steps (id, pack_id, position, title, description, video_url, video_provider, printable_ref, estimated_minutes, points) values
  ('51200000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', 1, 'Meet the Nile', 'Find the river that made life in Egypt possible.', '/videos/guide.mp4', 'mp4', 'Print page 1 — The Nile', 15, 10),
  ('51200000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 2, 'Homes and families', 'Look at how families lived beside the river.', '/videos/guide.mp4', 'mp4', 'Print page 2 — Homes', 15, 10),
  ('51200000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000002', 3, 'Write in pictures', 'Try a few real hieroglyphs and invent a kind one of your own.', '/videos/guide.mp4', 'mp4', 'Print page 3 — Pictures', 15, 10),
  ('51200000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000002', 4, 'Pyramids up close', 'See how a pyramid was planned, without the film-set magic.', '/videos/guide.mp4', 'mp4', 'Print page 4 — Pyramids', 15, 10),
  ('51200000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000002', 5, 'A day in the palace', 'Follow a morning in a busy ancient household.', '/videos/guide.mp4', 'mp4', 'Print page 5 — Palace', 15, 10),
  ('51200000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000002', 6, 'Boats and trade', 'Pack a boat with things Egypt really traded.', '/videos/guide.mp4', 'mp4', 'Print page 6 — Boats', 15, 10),
  ('51200000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000002', 7, 'Famous finds', 'Meet objects archaeologists still study.', '/videos/guide.mp4', 'mp4', 'Print page 7 — Finds', 15, 10),
  ('51200000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000002', 8, 'Your explorer badge', 'Record one true thing you want to remember.', '/videos/guide.mp4', 'mp4', 'Print page 8 — Badge', 15, 10);

insert into public.steps (id, pack_id, position, title, description, video_url, video_provider, printable_ref, estimated_minutes, points) values
  ('51300000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000003', 1, 'What spies noticed', 'Practise looking carefully, the way real codebreakers did.', '/videos/guide.mp4', 'mp4', 'Print page 1 — Noticing', 15, 10),
  ('51300000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000003', 2, 'Keep a secret', 'Agree a family signal that means "talk later".', '/videos/guide.mp4', 'mp4', 'Print page 2 — Signals', 15, 10),
  ('51300000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000003', 3, 'Simple codes', 'Swap letters and read a short friendly note.', '/videos/guide.mp4', 'mp4', 'Print page 3 — Codes', 15, 10),
  ('51300000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000003', 4, 'Lemon juice notes', 'Write a note that appears when an adult warms the paper.', '/videos/guide.mp4', 'mp4', 'Print page 4 — Invisible ink', 15, 10),
  ('51300000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000003', 5, 'Spot the pattern', 'Find the pattern hiding in a grid of shapes.', '/videos/guide.mp4', 'mp4', 'Print page 5 — Patterns', 15, 10),
  ('51300000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000003', 6, 'A careful disguise', 'Design a hat and a notebook cover, not a pretend identity.', '/videos/guide.mp4', 'mp4', 'Print page 6 — Disguise', 15, 10),
  ('51300000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000003', 7, 'Famous codebreakers', 'Meet people who solved puzzles to help others.', '/videos/guide.mp4', 'mp4', 'Print page 7 — Codebreakers', 15, 10),
  ('51300000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000003', 8, 'Your spy promise', 'Promise to use codes for kindness, never for unkind secrets.', '/videos/guide.mp4', 'mp4', 'Print page 8 — Promise', 15, 10);

insert into public.steps (id, pack_id, position, title, description, video_url, video_provider, printable_ref, estimated_minutes, points) values
  ('51400000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000004', 1, 'A real castle', 'Walk the parts of a castle and what each one was for.', '/videos/guide.mp4', 'mp4', 'Print page 1 — Castle', 15, 10),
  ('51400000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000004', 2, 'Who lived there', 'Meet the people who cooked, guarded and told stories.', '/videos/guide.mp4', 'mp4', 'Print page 2 — People', 15, 10),
  ('51400000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000004', 3, 'Armour and shields', 'See what armour could and could not do.', '/videos/guide.mp4', 'mp4', 'Print page 3 — Armour', 15, 10),
  ('51400000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000004', 4, 'Banners and colours', 'Design colours a household would recognise.', '/videos/guide.mp4', 'mp4', 'Print page 4 — Banners', 15, 10),
  ('51400000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000004', 5, 'A feast day', 'Plan a medieval menu from foods they really had.', '/videos/guide.mp4', 'mp4', 'Print page 5 — Feast', 15, 10),
  ('51400000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000004', 6, 'Horses and heralds', 'Follow a message from the gate to the hall.', '/videos/guide.mp4', 'mp4', 'Print page 6 — Heralds', 15, 10),
  ('51400000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000004', 7, 'True knight stories', 'Sort the legend from the history.', '/videos/guide.mp4', 'mp4', 'Print page 7 — Stories', 15, 10),
  ('51400000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000004', 8, 'Your coat of arms', 'Draw symbols for your own household.', '/videos/guide.mp4', 'mp4', 'Print page 8 — Arms', 15, 10);

insert into public.steps (id, pack_id, position, title, description, video_url, video_provider, printable_ref, estimated_minutes, points) values
  ('51500000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000005', 1, 'Our night sky', 'Find the moon and one bright star from your window or garden.', '/videos/guide.mp4', 'mp4', 'Print page 1 — Night sky', 15, 10),
  ('51500000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000005', 2, 'The Moon', 'See why the Moon looks different through the month.', '/videos/guide.mp4', 'mp4', 'Print page 2 — Moon', 15, 10),
  ('51500000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000005', 3, 'The rocky planets', 'Line up the small rocky worlds.', '/videos/guide.mp4', 'mp4', 'Print page 3 — Rocky planets', 15, 10),
  ('51500000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000005', 4, 'Gas giants', 'Compare the huge planets with Earth.', '/videos/guide.mp4', 'mp4', 'Print page 4 — Giants', 15, 10),
  ('51500000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000005', 5, 'The Sun', 'Learn why we never look straight at it.', '/videos/guide.mp4', 'mp4', 'Print page 5 — Sun', 15, 10),
  ('51500000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000005', 6, 'Rockets', 'Fold a paper rocket and talk about real launches.', '/videos/guide.mp4', 'mp4', 'Print page 6 — Rockets', 15, 10),
  ('51500000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000005', 7, 'People in space', 'Meet a few of the people who have left Earth.', '/videos/guide.mp4', 'mp4', 'Print page 7 — People', 15, 10),
  ('51500000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000005', 8, 'Your space log', 'Draw one thing you want to look for next.', '/videos/guide.mp4', 'mp4', 'Print page 8 — Log', 15, 10);

insert into public.pack_ownership (account_id, pack_id, source) values
  ('a1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'seed'),
  ('a1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', 'seed'),
  ('a1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000003', 'seed');

-- Pip: pirate steps 1–4 done, step 5 open. Egypt 1–2 done. Spy 1–5 done.
insert into public.step_progress (child_id, step_id, status) values
  ('c1000000-0000-4000-8000-000000000001', '51100000-0000-4000-8000-000000000001', 'complete');
insert into public.step_progress (child_id, step_id, status) values
  ('c1000000-0000-4000-8000-000000000001', '51100000-0000-4000-8000-000000000002', 'complete');
insert into public.step_progress (child_id, step_id, status) values
  ('c1000000-0000-4000-8000-000000000001', '51100000-0000-4000-8000-000000000003', 'complete');
insert into public.step_progress (child_id, step_id, status) values
  ('c1000000-0000-4000-8000-000000000001', '51100000-0000-4000-8000-000000000004', 'complete');
insert into public.step_progress (child_id, step_id, status, video_position_seconds) values
  ('c1000000-0000-4000-8000-000000000001', '51100000-0000-4000-8000-000000000005', 'in_progress', 0);

insert into public.step_progress (child_id, step_id, status) values
  ('c1000000-0000-4000-8000-000000000001', '51200000-0000-4000-8000-000000000001', 'complete');
insert into public.step_progress (child_id, step_id, status) values
  ('c1000000-0000-4000-8000-000000000001', '51200000-0000-4000-8000-000000000002', 'complete');

insert into public.step_progress (child_id, step_id, status) values
  ('c1000000-0000-4000-8000-000000000001', '51300000-0000-4000-8000-000000000001', 'complete');
insert into public.step_progress (child_id, step_id, status) values
  ('c1000000-0000-4000-8000-000000000001', '51300000-0000-4000-8000-000000000002', 'complete');
insert into public.step_progress (child_id, step_id, status) values
  ('c1000000-0000-4000-8000-000000000001', '51300000-0000-4000-8000-000000000003', 'complete');
insert into public.step_progress (child_id, step_id, status) values
  ('c1000000-0000-4000-8000-000000000001', '51300000-0000-4000-8000-000000000004', 'complete');
insert into public.step_progress (child_id, step_id, status) values
  ('c1000000-0000-4000-8000-000000000001', '51300000-0000-4000-8000-000000000005', 'complete');

-- Lou is on step 2, three steps behind Pip, and can resume at 2:14.
insert into public.step_progress (child_id, step_id, status) values
  ('c1000000-0000-4000-8000-000000000002', '51100000-0000-4000-8000-000000000001', 'complete');
insert into public.step_progress (child_id, step_id, status, video_position_seconds) values
  ('c1000000-0000-4000-8000-000000000002', '51100000-0000-4000-8000-000000000002', 'in_progress', 134);

insert into public.points_ledger (child_id, account_id, amount, reason, ref_id) values
  ('c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 230, 'opening_balance', 'c1000000-0000-4000-8000-000000000001'),
  ('c1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', 210, 'opening_balance', 'c1000000-0000-4000-8000-000000000003'),
  ('c1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000003', 512, 'opening_balance', 'c1000000-0000-4000-8000-000000000004'),
  ('c1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000004', 480, 'opening_balance', 'c1000000-0000-4000-8000-000000000005'),
  ('c1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000005', 175, 'opening_balance', 'c1000000-0000-4000-8000-000000000006');

insert into public.reward_codes (code, headline, description, min_points, active, sort_order) values
  ('CURIOUS15', 'You''ve unlocked 15% off your next pack', 'A little thank you for being a Curious Explorer this month.', 300, true, 1),
  ('EXPLORER10', 'You''ve unlocked 10% off your next pack', 'A small thank you while you climb towards the next level.', 150, true, 2);

insert into public.prizes (title, detail, sort_order) values
  ('Any pack of their choice', 'Printed and posted to you', 1),
  ('50% off a pack', 'A code in the shop', 2),
  ('Certificate + stickers', 'Posted to your door', 3);

drop function public.seed_user(uuid, text, text);
