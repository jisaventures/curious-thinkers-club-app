alter table public.children drop constraint if exists children_first_name_chk;

alter table public.children
  add constraint children_first_name_chk check (
    first_name is null
    or (
      char_length(btrim(first_name)) between 1 and 15
      and first_name ~ '^[A-Za-z][A-Za-z ''-]{0,14}$'
    )
  );
