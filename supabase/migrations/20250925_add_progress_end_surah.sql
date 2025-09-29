-- Add optional end_surah to progress to allow cross‑surah sabaq ranges
alter table if exists public.progress
  add column if not exists end_surah integer;

-- For existing rows, default end_surah to current_surah where null
update public.progress
  set end_surah = current_surah
  where end_surah is null and current_surah is not null;

-- No strict constraint; validation is handled in application layer
comment on column public.progress.end_surah is 'Ending surah number for sabaq range (inclusive). If null, defaults to current_surah.';


