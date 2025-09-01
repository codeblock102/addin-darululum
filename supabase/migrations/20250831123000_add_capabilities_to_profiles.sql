-- Add capabilities JSONB array to profiles for per-teacher feature flags
alter table if exists public.profiles
  add column if not exists capabilities jsonb not null default '[]'::jsonb;

comment on column public.profiles.capabilities is 'Array of capability strings, e.g., ["attendance_access", "progress_access", "assignments_access"]';

-- Backfill attendance_access capability for existing attendance_taker profiles
update public.profiles
set capabilities = case
  when jsonb_typeof(capabilities) = 'array' then
    (case
      when capabilities @> '["attendance_access"]'::jsonb then capabilities
      else (capabilities || '["attendance_access"]'::jsonb)
    end)
  else '["attendance_access"]'::jsonb
end
where attendance_taker is true;

-- Normalize null capabilities to an empty array
update public.profiles
set capabilities = '[]'::jsonb
where capabilities is null;

