-- Drop deprecated attendance_taker column from profiles
alter table if exists public.profiles
  drop column if exists attendance_taker;


