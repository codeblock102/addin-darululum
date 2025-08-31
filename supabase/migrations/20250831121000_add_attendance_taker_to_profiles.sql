-- Add attendance_taker boolean flag to profiles to mark teachers who can take attendance
alter table if exists public.profiles
  add column if not exists attendance_taker boolean not null default false;

comment on column public.profiles.attendance_taker is 'If true, this teacher can take attendance and access attendance features.';


