update public.dashboard_banners
set badge_text = 'Club Merchandise',
    headline = E'Get the official\nclub kit!',
    button_label = 'Shop Now'
where id = 'club-kit'
  and badge_text in ('MEMBERS ONLY', 'Club Merch');
