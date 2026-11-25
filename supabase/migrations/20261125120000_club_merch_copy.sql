update public.dashboard_banners
set badge_text = 'Club Merchandise',
    headline = 'Get the official club kit!',
    button_label = 'Shop Now'
where id = 'club-kit'
  and badge_text in ('MEMBERS ONLY', 'Club Merch');
