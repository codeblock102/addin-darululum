create table if not exists public.communication_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null default 'general', -- 'absence' | 'progress' | 'general' | 'reminder'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.communication_templates enable row level security;

-- Admins full access
create policy "Admins manage templates" on public.communication_templates
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Seed 6 starter templates
insert into public.communication_templates (title, body, category) values
  ('Absence Follow-Up', 'Assalamu Alaikum [Parent Name], we noticed [Student Name] was absent today. Please confirm the reason for their absence and let us know if there is anything we can do to support them. JazakAllah Khayran.', 'absence'),
  ('Late Arrival Notice', 'Assalamu Alaikum [Parent Name], we wanted to inform you that [Student Name] arrived late to class today. Please ensure they arrive on time so they do not miss any instruction. JazakAllah Khayran.', 'reminder'),
  ('Progress Update — Excellent', 'Assalamu Alaikum [Parent Name], we are pleased to share that [Student Name] has been making excellent progress in their Quran memorization. May Allah bless their efforts and grant them continued success. JazakAllah Khayran.', 'progress'),
  ('Assignment Reminder', 'Assalamu Alaikum [Parent Name], this is a friendly reminder that [Student Name] has an assignment due on [Date]. Please encourage them to complete it on time. JazakAllah Khayran.', 'reminder'),
  ('General Announcement', 'Assalamu Alaikum dear parents, we would like to inform you that [Message]. Please feel free to reach out if you have any questions. JazakAllah Khayran.', 'general'),
  ('Extended Absence Acknowledgement', 'Assalamu Alaikum [Parent Name], we have noted that [Student Name] will be absent from [Start Date] to [End Date]. We have recorded an excused absence for this period. Please ensure they catch up on any missed work upon their return. JazakAllah Khayran.', 'absence');
