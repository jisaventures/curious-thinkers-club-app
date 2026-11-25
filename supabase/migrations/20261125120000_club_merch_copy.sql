update public.dashboard_banners
set badge_text = 'Club Merch',
    headline = E'Get the official\nclub kit!',
    button_label = 'Shop Now'
where id = 'club-kit'
  and badge_text = 'MEMBERS ONLY';
