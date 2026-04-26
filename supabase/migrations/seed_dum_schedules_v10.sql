-- ============================================================
-- DUM Schedule Seed — Scheduling V10
-- Run this from the Supabase SQL editor (as a service-role call)
-- to populate all 12 class schedules into the `classes` table.
--
-- Teacher lookup: profiles.name ILIKE '%<name>%'
-- If a teacher name isn't found the slot still inserts with an
-- empty teacher_ids array — no data is lost.
-- ============================================================

DO $$
DECLARE
  -- ── Teacher IDs (resolved by name at runtime) ───────────────
  v_safiyyah  uuid;
  v_karima    uuid;
  v_humaira   uuid;  -- Humairaa / Humaira
  v_maysa     uuid;
  v_raeesah   uuid;  -- Raeesah / Raeesha
  v_rijah     uuid;
  v_salma     uuid;
  v_mariatou  uuid;
  v_ihssene   uuid;
  v_ikram     uuid;
  v_halima    uuid;
  v_afaf      uuid;

  -- ── Helper: build teacher_ids JSONB array (omits NULLs) ─────
  --    Used inline as  _tids(ARRAY[v_x, v_y])
  v_all_days  jsonb := '["monday","tuesday","wednesday","thursday","friday"]';
  v_mttf      jsonb := '["monday","tuesday","thursday","friday"]';
  v_mtwtf     jsonb := '["monday","tuesday","wednesday","thursday","friday"]';

BEGIN
  -- ── 1. Resolve teacher profiles ────────────────────────────
  SELECT id INTO v_safiyyah  FROM profiles WHERE name ILIKE '%Safiyyah%'  LIMIT 1;
  SELECT id INTO v_karima    FROM profiles WHERE name ILIKE '%Karima%'    LIMIT 1;
  SELECT id INTO v_humaira   FROM profiles WHERE name ILIKE '%Humaira%'   LIMIT 1;
  SELECT id INTO v_maysa     FROM profiles WHERE name ILIKE '%Maysa%'     LIMIT 1;
  SELECT id INTO v_raeesah   FROM profiles WHERE (name ILIKE '%Raeesah%' OR name ILIKE '%Raeesha%') LIMIT 1;
  SELECT id INTO v_rijah     FROM profiles WHERE name ILIKE '%Rijah%'     LIMIT 1;
  SELECT id INTO v_salma     FROM profiles WHERE name ILIKE '%Salma%'     LIMIT 1;
  SELECT id INTO v_mariatou  FROM profiles WHERE name ILIKE '%Mariatou%'  LIMIT 1;
  SELECT id INTO v_ihssene   FROM profiles WHERE name ILIKE '%Ihssene%'   LIMIT 1;
  SELECT id INTO v_ikram     FROM profiles WHERE name ILIKE '%Ikram%'     LIMIT 1;
  SELECT id INTO v_halima    FROM profiles WHERE name ILIKE '%Halima%'    LIMIT 1;
  SELECT id INTO v_afaf      FROM profiles WHERE name ILIKE '%Afaf%'      LIMIT 1;

  -- ── 2. Upsert classes ───────────────────────────────────────
  -- Deterministic IDs: ('x'||md5('DUM_<NAME>'))::bit(128)::uuid
  -- so re-running is idempotent.

  -- ════════════════════════════════════════════════════════════
  -- KG  (Room 202, starts 9:00)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO classes (id, name, subject, section, status, capacity, days_of_week, teacher_ids, time_slots)
  VALUES (
    ('x'||md5('DUM_KG'))::bit(128)::uuid,
    'KG', 'Kindergarten', 'KG', 'active', 25,
    ARRAY['monday','tuesday','wednesday','thursday','friday'],
    array_remove(ARRAY[v_safiyyah, v_karima, v_afaf], NULL),
    jsonb_build_array(
      jsonb_build_object('days',v_all_days,'start_time','09:00','end_time','09:05','subject','Assemblée','room','202','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","wednesday","thursday"]'::jsonb,'start_time','09:05','end_time','09:55','subject','Literacy','room','202','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','09:05','end_time','09:45','subject','AP / Gym','room','Gym','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["monday","tuesday","wednesday","thursday"]'::jsonb,'start_time','09:55','end_time','10:40','subject','Math','room','202','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','10:40','end_time','10:55','subject','Récré','room','202','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','11:00','end_time','11:55','subject','Qur''an','room','202','teacher_ids',to_jsonb(array_remove(ARRAY[v_karima::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','12:00','end_time','12:55','subject','Lunch','room','202','teacher_ids',to_jsonb(array_remove(ARRAY[v_afaf::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','13:55','end_time','14:00','subject','Salah','room','202','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["monday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','AP','room','202','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["tuesday","wednesday","thursday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','Islamic Studies','room','202','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','Surah','room','202','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","wednesday","thursday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Freeplay','room','202','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Duas','room','202','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL)))
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    time_slots = EXCLUDED.time_slots,
    teacher_ids = EXCLUDED.teacher_ids,
    name = EXCLUDED.name,
    subject = EXCLUDED.subject;

  -- ════════════════════════════════════════════════════════════
  -- Grade 1 / 1e Année  (Room 303, starts 9:00)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO classes (id, name, subject, section, status, capacity, days_of_week, teacher_ids, time_slots)
  VALUES (
    ('x'||md5('DUM_GRADE1'))::bit(128)::uuid,
    'Grade 1', '1ère Année', 'Grade 1', 'active', 25,
    ARRAY['monday','tuesday','wednesday','thursday','friday'],
    array_remove(ARRAY[v_humaira, v_maysa, v_raeesah, v_rijah, v_safiyyah, v_karima, v_halima, v_mariatou], NULL),
    jsonb_build_array(
      jsonb_build_object('days',v_all_days,'start_time','09:00','end_time','09:05','subject','Assemblée','room','303','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["monday","wednesday"]'::jsonb,'start_time','09:05','end_time','09:55','subject','Devoirs','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text,v_halima::text],NULL))),
      jsonb_build_object('days','["tuesday","thursday"]'::jsonb,'start_time','09:05','end_time','09:55','subject','Surah','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text,v_karima::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','09:05','end_time','09:55','subject','AP','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','10:03','end_time','10:55','subject','Français','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','10:55','end_time','11:15','subject','Récré','room','303','teacher_ids','[]'::jsonb),
      jsonb_build_object('days',v_all_days,'start_time','11:15','end_time','12:00','subject','Math','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','12:00','end_time','13:20','subject','Qur''an','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_raeesah::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','13:20','end_time','13:55','subject','Lunch','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days','["monday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','Univers Sociale','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["tuesday","wednesday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','Islamic Studies','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','AP','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','Anglais','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","thursday","friday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Devoirs','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','AP','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL)))
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    time_slots = EXCLUDED.time_slots, teacher_ids = EXCLUDED.teacher_ids,
    name = EXCLUDED.name, subject = EXCLUDED.subject;

  -- ════════════════════════════════════════════════════════════
  -- Grade 2 / 2e Année  (Room 301, starts 9:00)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO classes (id, name, subject, section, status, capacity, days_of_week, teacher_ids, time_slots)
  VALUES (
    ('x'||md5('DUM_GRADE2'))::bit(128)::uuid,
    'Grade 2', '2ème Année', 'Grade 2', 'active', 25,
    ARRAY['monday','tuesday','wednesday','thursday','friday'],
    array_remove(ARRAY[v_karima, v_halima, v_salma, v_rijah, v_humaira, v_maysa, v_safiyyah], NULL),
    jsonb_build_array(
      jsonb_build_object('days',v_all_days,'start_time','09:00','end_time','09:05','subject','Assemblée','room','301','teacher_ids','[]'::jsonb),
      jsonb_build_object('days',v_all_days,'start_time','09:05','end_time','10:45','subject','Qur''an','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_karima::text,v_halima::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','10:45','end_time','11:05','subject','Récré','room','301','teacher_ids','[]'::jsonb),
      jsonb_build_object('days',v_all_days,'start_time','11:05','end_time','11:55','subject','Français','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','12:00','end_time','12:55','subject','Lunch','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text,v_humaira::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','13:00','end_time','13:55','subject','Math','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','14:00','end_time','14:10','subject','Salah','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","thursday"]'::jsonb,'start_time','14:10','end_time','14:55','subject','Islamic Studies','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["wednesday","friday"]'::jsonb,'start_time','14:10','end_time','14:55','subject','AP / Gym','room','Gym','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["monday","thursday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','AP','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days','["tuesday","wednesday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Surah','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_karima::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Anglais','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL)))
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    time_slots = EXCLUDED.time_slots, teacher_ids = EXCLUDED.teacher_ids,
    name = EXCLUDED.name, subject = EXCLUDED.subject;

  -- ════════════════════════════════════════════════════════════
  -- Grade 2-ES  (Room 302 / 301, starts 9:00)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO classes (id, name, subject, section, status, capacity, days_of_week, teacher_ids, time_slots)
  VALUES (
    ('x'||md5('DUM_GRADE2ES'))::bit(128)::uuid,
    'Grade 2-ES', '2ème Année ES', 'Grade 2-ES', 'active', 25,
    ARRAY['monday','tuesday','wednesday','thursday','friday'],
    array_remove(ARRAY[v_karima, v_halima, v_humaira, v_salma, v_safiyyah, v_raeesah, v_mariatou], NULL),
    jsonb_build_array(
      jsonb_build_object('days',v_all_days,'start_time','09:00','end_time','09:05','subject','Assemblée','room','301','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["monday","wednesday","thursday"]'::jsonb,'start_time','09:05','end_time','09:55','subject','Qur''an','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_karima::text,v_halima::text],NULL))),
      jsonb_build_object('days','["tuesday","friday"]'::jsonb,'start_time','09:05','end_time','09:55','subject','Anglais','room','302','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','10:00','end_time','10:45','subject','Qur''an','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_karima::text,v_halima::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','10:45','end_time','11:05','subject','Récré','room','301','teacher_ids','[]'::jsonb),
      jsonb_build_object('days',v_all_days,'start_time','11:05','end_time','11:55','subject','Français','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','12:05','end_time','12:55','subject','Math','room','302','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","thursday","friday"]'::jsonb,'start_time','13:00','end_time','13:20','subject','Qur''an','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_raeesah::text],NULL))),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','13:00','end_time','13:20','subject','Univers Sociale','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days','["monday","thursday"]'::jsonb,'start_time','13:20','end_time','13:55','subject','Lunch','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','13:20','end_time','13:55','subject','Lunch','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','13:20','end_time','13:55','subject','Lunch','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_halima::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","thursday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','Islamic Studies','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','AP / Gym','room','Gym','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','Anglais','room','302','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days','["monday","thursday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','AP','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days','["tuesday","wednesday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Surah','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_karima::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Devoirs','room','301','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL)))
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    time_slots = EXCLUDED.time_slots, teacher_ids = EXCLUDED.teacher_ids,
    name = EXCLUDED.name, subject = EXCLUDED.subject;

  -- ════════════════════════════════════════════════════════════
  -- Grade 3-ES  (Room 203, starts 9:00)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO classes (id, name, subject, section, status, capacity, days_of_week, teacher_ids, time_slots)
  VALUES (
    ('x'||md5('DUM_GRADE3ES'))::bit(128)::uuid,
    'Grade 3-ES', '3ème Année ES', 'Grade 3-ES', 'active', 25,
    ARRAY['monday','tuesday','wednesday','thursday','friday'],
    array_remove(ARRAY[v_mariatou, v_salma, v_safiyyah, v_maysa, v_humaira, v_ihssene, v_ikram, v_halima, v_rijah], NULL),
    jsonb_build_array(
      jsonb_build_object('days',v_all_days,'start_time','09:00','end_time','09:05','subject','Assemblée','room','203','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["monday","thursday"]'::jsonb,'start_time','09:05','end_time','09:55','subject','AP','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["tuesday","friday"]'::jsonb,'start_time','09:05','end_time','09:55','subject','Devoirs','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','09:05','end_time','09:55','subject','Français','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","thursday","friday"]'::jsonb,'start_time','10:00','end_time','10:55','subject','Français','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','10:00','end_time','10:55','subject','Sciences','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_ihssene::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','10:55','end_time','11:15','subject','Récré','room','203','teacher_ids','[]'::jsonb),
      jsonb_build_object('days',v_all_days,'start_time','11:15','end_time','12:00','subject','Math','room','302','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["monday","friday"]'::jsonb,'start_time','12:05','end_time','12:55','subject','Univers Sociale','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["tuesday","wednesday"]'::jsonb,'start_time','12:05','end_time','12:55','subject','Islamic Studies','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_halima::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','12:05','end_time','12:55','subject','Anglais','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","wednesday","thursday"]'::jsonb,'start_time','13:00','end_time','13:40','subject','Lunch','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','13:00','end_time','13:40','subject','Lunch','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_halima::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','13:30','end_time','14:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","wednesday","thursday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_halima::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','AP','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","wednesday","thursday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Anglais','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL)))
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    time_slots = EXCLUDED.time_slots, teacher_ids = EXCLUDED.teacher_ids,
    name = EXCLUDED.name, subject = EXCLUDED.subject;

  -- ════════════════════════════════════════════════════════════
  -- Grade 4 / 4e Année  (Room 201/101, starts 9:00)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO classes (id, name, subject, section, status, capacity, days_of_week, teacher_ids, time_slots)
  VALUES (
    ('x'||md5('DUM_GRADE4'))::bit(128)::uuid,
    'Grade 4', '4ème Année', 'Grade 4', 'active', 25,
    ARRAY['monday','tuesday','wednesday','thursday','friday'],
    array_remove(ARRAY[v_maysa, v_ikram, v_ihssene, v_mariatou, v_salma, v_raeesah, v_rijah, v_halima], NULL),
    jsonb_build_array(
      jsonb_build_object('days',v_all_days,'start_time','09:00','end_time','09:05','subject','Assemblée','room','201','teacher_ids','[]'::jsonb),
      jsonb_build_object('days',v_all_days,'start_time','09:05','end_time','09:55','subject','Math','room','201','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','09:55','end_time','10:15','subject','Récré','room','101','teacher_ids','[]'::jsonb),
      jsonb_build_object('days',v_all_days,'start_time','10:15','end_time','11:15','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','11:15','end_time','11:55','subject','Lunch','room','201','teacher_ids',to_jsonb(array_remove(ARRAY[v_raeesah::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','12:00','end_time','12:55','subject','Français','room','201','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["monday","wednesday","thursday","friday"]'::jsonb,'start_time','13:00','end_time','13:55','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','13:00','end_time','13:55','subject','Sciences','room','201','teacher_ids',to_jsonb(array_remove(ARRAY[v_ihssene::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','14:00','end_time','14:05','subject','Salah','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday","thursday"]'::jsonb,'start_time','14:05','end_time','14:55','subject','Islamic Studies','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_raeesah::text],NULL))),
      jsonb_build_object('days','["tuesday","friday"]'::jsonb,'start_time','14:05','end_time','14:55','subject','AP / Gym','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','14:05','end_time','14:55','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_halima::text],NULL))),
      jsonb_build_object('days','["tuesday","friday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','AP / Gym','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days','["wednesday","friday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Univers Sociale','room','201','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Anglais','room','201','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_halima::text],NULL)))
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    time_slots = EXCLUDED.time_slots, teacher_ids = EXCLUDED.teacher_ids,
    name = EXCLUDED.name, subject = EXCLUDED.subject;

  -- ════════════════════════════════════════════════════════════
  -- Grade 4-ES  (Room 302/201, starts 9:00)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO classes (id, name, subject, section, status, capacity, days_of_week, teacher_ids, time_slots)
  VALUES (
    ('x'||md5('DUM_GRADE4ES'))::bit(128)::uuid,
    'Grade 4-ES', '4ème Année ES', 'Grade 4-ES', 'active', 25,
    ARRAY['monday','tuesday','wednesday','thursday','friday'],
    array_remove(ARRAY[v_ikram, v_safiyyah, v_humaira, v_mariatou, v_salma, v_maysa, v_halima], NULL),
    jsonb_build_array(
      jsonb_build_object('days',v_all_days,'start_time','09:00','end_time','09:05','subject','Assemblée','room','201','teacher_ids','[]'::jsonb),
      jsonb_build_object('days',v_all_days,'start_time','09:05','end_time','09:55','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','09:55','end_time','10:15','subject','Récré','room','201','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["monday","tuesday","wednesday","friday"]'::jsonb,'start_time','10:15','end_time','11:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','10:15','end_time','11:00','subject','Anglais','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','11:15','end_time','12:00','subject','Math','room','302','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["monday","wednesday","thursday","friday"]'::jsonb,'start_time','12:05','end_time','12:30','subject','Français','room','201','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','12:05','end_time','12:30','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','12:30','end_time','13:45','subject','Lunch','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text,v_halima::text],NULL))),
      jsonb_build_object('days','["monday","wednesday","thursday","friday"]'::jsonb,'start_time','13:45','end_time','14:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','14:00','end_time','14:00','subject','Salah','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday","friday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','Anglais','room','302','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days','["tuesday","wednesday","thursday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday","wednesday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','AP / Gym','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Anglais','room','203','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Univers Sociale','room','201','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL)))
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    time_slots = EXCLUDED.time_slots, teacher_ids = EXCLUDED.teacher_ids,
    name = EXCLUDED.name, subject = EXCLUDED.subject;

  -- ════════════════════════════════════════════════════════════
  -- Grade 5-ES  (Room 103, starts 8:00)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO classes (id, name, subject, section, status, capacity, days_of_week, teacher_ids, time_slots)
  VALUES (
    ('x'||md5('DUM_GRADE5ES'))::bit(128)::uuid,
    'Grade 5-ES', '5ème Année ES', 'Grade 5-ES', 'active', 25,
    ARRAY['monday','tuesday','wednesday','thursday','friday'],
    array_remove(ARRAY[v_safiyyah, v_ikram, v_mariatou, v_humaira, v_maysa, v_ihssene, v_rijah, v_afaf, v_salma], NULL),
    jsonb_build_array(
      jsonb_build_object('days',v_all_days,'start_time','08:00','end_time','08:05','subject','Assemblée','room','103','teacher_ids','[]'::jsonb),
      jsonb_build_object('days',v_all_days,'start_time','08:05','end_time','08:55','subject','Math','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','09:00','end_time','09:55','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','09:55','end_time','10:15','subject','Récré','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','10:15','end_time','11:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','11:05','end_time','12:00','subject','Français','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["monday"]'::jsonb,'start_time','12:00','end_time','13:00','subject','Sciences','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_ihssene::text],NULL))),
      jsonb_build_object('days','["tuesday","wednesday","thursday","friday"]'::jsonb,'start_time','12:00','end_time','13:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','13:00','end_time','13:30','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday"]'::jsonb,'start_time','13:30','end_time','14:00','subject','Lunch','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days','["tuesday","wednesday","thursday","friday"]'::jsonb,'start_time','13:30','end_time','14:00','subject','Lunch','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_afaf::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","wednesday","friday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','Anglais','room','302','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','AP / Gym','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days','["monday","wednesday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Univers Sociale','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["tuesday","thursday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Devoirs','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_ihssene::text,v_salma::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Islamic Studies','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL)))
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    time_slots = EXCLUDED.time_slots, teacher_ids = EXCLUDED.teacher_ids,
    name = EXCLUDED.name, subject = EXCLUDED.subject;

  -- ════════════════════════════════════════════════════════════
  -- Grade 5 / 5e Année  (Room 103, starts 8:00)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO classes (id, name, subject, section, status, capacity, days_of_week, teacher_ids, time_slots)
  VALUES (
    ('x'||md5('DUM_GRADE5'))::bit(128)::uuid,
    'Grade 5', '5ème Année', 'Grade 5', 'active', 25,
    ARRAY['monday','tuesday','wednesday','thursday','friday'],
    array_remove(ARRAY[v_safiyyah, v_ikram, v_halima, v_mariatou, v_maysa, v_ihssene, v_salma, v_rijah], NULL),
    jsonb_build_array(
      jsonb_build_object('days',v_all_days,'start_time','08:00','end_time','08:05','subject','Assemblée','room','103','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["monday","tuesday","thursday","friday"]'::jsonb,'start_time','08:05','end_time','08:55','subject','Math','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','08:05','end_time','08:55','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_halima::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','09:00','end_time','09:55','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','09:55','end_time','10:15','subject','Récré','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','10:15','end_time','11:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','11:05','end_time','11:55','subject','Français','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["monday"]'::jsonb,'start_time','12:00','end_time','13:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_halima::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','12:00','end_time','13:00','subject','Sciences','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_ihssene::text],NULL))),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','12:00','end_time','13:00','subject','Univers Sociale','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["thursday","friday"]'::jsonb,'start_time','12:00','end_time','13:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','13:00','end_time','13:25','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday","wednesday","thursday","friday"]'::jsonb,'start_time','13:20','end_time','14:00','subject','Lunch','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','13:20','end_time','14:00','subject','Lunch','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["monday","tuesday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','Français','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["wednesday","thursday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','AP / Gym','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','Islamic Studies','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Univers Sociale','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Devoirs','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_ihssene::text],NULL))),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Math','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_safiyyah::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Anglais','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Islamic Studies','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL)))
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    time_slots = EXCLUDED.time_slots, teacher_ids = EXCLUDED.teacher_ids,
    name = EXCLUDED.name, subject = EXCLUDED.subject;

  -- ════════════════════════════════════════════════════════════
  -- Grade 6-ES  (Room 104/302, starts 8:00)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO classes (id, name, subject, section, status, capacity, days_of_week, teacher_ids, time_slots)
  VALUES (
    ('x'||md5('DUM_GRADE6ES'))::bit(128)::uuid,
    'Grade 6-ES', '6ème Année ES', 'Grade 6-ES', 'active', 25,
    ARRAY['monday','tuesday','wednesday','thursday','friday'],
    array_remove(ARRAY[v_ikram, v_humaira, v_mariatou, v_maysa, v_rijah, v_salma], NULL),
    jsonb_build_array(
      jsonb_build_object('days',v_all_days,'start_time','08:00','end_time','08:05','subject','Assemblée','room','104','teacher_ids','[]'::jsonb),
      jsonb_build_object('days',v_all_days,'start_time','08:05','end_time','09:45','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','09:55','end_time','10:05','subject','Récré','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","wednesday","friday"]'::jsonb,'start_time','10:05','end_time','11:00','subject','Math','room','104','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','10:05','end_time','11:00','subject','English','room','302','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','11:05','end_time','12:00','subject','Français','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["monday","wednesday","friday"]'::jsonb,'start_time','12:05','end_time','13:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','12:05','end_time','13:00','subject','Univers Sociale','room','104','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','12:05','end_time','13:00','subject','AP / Gym','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','13:10','end_time','13:20','subject','Salah','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday","wednesday","thursday","friday"]'::jsonb,'start_time','13:20','end_time','14:00','subject','Lunch','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','13:20','end_time','14:00','subject','Lunch','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["monday","friday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','English','room','302','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days','["tuesday","wednesday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','AP / Gym','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days','["monday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','English','room','302','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','AP / Gym','room','Gym','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Univers Sociale','room','104','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Math','room','104','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Islamic Studies','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL)))
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    time_slots = EXCLUDED.time_slots, teacher_ids = EXCLUDED.teacher_ids,
    name = EXCLUDED.name, subject = EXCLUDED.subject;

  -- ════════════════════════════════════════════════════════════
  -- Grade 6  (Room 104/103, starts 8:00)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO classes (id, name, subject, section, status, capacity, days_of_week, teacher_ids, time_slots)
  VALUES (
    ('x'||md5('DUM_GRADE6'))::bit(128)::uuid,
    'Grade 6', '6ème Année', 'Grade 6', 'active', 25,
    ARRAY['monday','tuesday','wednesday','thursday','friday'],
    array_remove(ARRAY[v_ikram, v_ihssene, v_humaira, v_mariatou, v_maysa, v_salma, v_rijah], NULL),
    jsonb_build_array(
      jsonb_build_object('days',v_all_days,'start_time','08:00','end_time','08:05','subject','Assemblée','room','104','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["monday","wednesday","thursday","friday"]'::jsonb,'start_time','08:05','end_time','09:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','08:05','end_time','09:00','subject','Sciences','room','104','teacher_ids',to_jsonb(array_remove(ARRAY[v_ihssene::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','09:00','end_time','09:45','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','09:55','end_time','10:05','subject','Récré','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","wednesday","friday"]'::jsonb,'start_time','10:05','end_time','11:00','subject','Math','room','104','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','10:05','end_time','11:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','11:05','end_time','12:00','subject','Français','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["monday","wednesday","friday"]'::jsonb,'start_time','12:05','end_time','12:55','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','12:05','end_time','12:55','subject','Univers Sociale','room','104','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','12:05','end_time','12:55','subject','AP / Gym','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','13:10','end_time','13:20','subject','Salah','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday","wednesday","thursday","friday"]'::jsonb,'start_time','13:20','end_time','14:00','subject','Lunch','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','13:20','end_time','14:00','subject','Lunch','room','303','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["monday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','AP / Gym','room','Gym','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["tuesday","wednesday","thursday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','Français','room','104','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','14:00','end_time','14:55','subject','Islamic Studies','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','English','room','103','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','AP / Gym','room','Gym','teacher_ids',to_jsonb(array_remove(ARRAY[v_rijah::text],NULL))),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Univers Sociale','room','104','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Math','room','104','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Islamic Studies','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL)))
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    time_slots = EXCLUDED.time_slots, teacher_ids = EXCLUDED.teacher_ids,
    name = EXCLUDED.name, subject = EXCLUDED.subject;

  -- ════════════════════════════════════════════════════════════
  -- Secondary 1 & 3  (Room 102, starts 8:00)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO classes (id, name, subject, section, status, capacity, days_of_week, teacher_ids, time_slots)
  VALUES (
    ('x'||md5('DUM_SEC13'))::bit(128)::uuid,
    'Secondary 1 & 3', 'Secondary', 'Secondary', 'active', 25,
    ARRAY['monday','tuesday','wednesday','thursday','friday'],
    array_remove(ARRAY[v_ikram, v_salma, v_ihssene, v_maysa, v_mariatou, v_humaira, v_halima, v_raeesah], NULL),
    jsonb_build_array(
      jsonb_build_object('days',v_all_days,'start_time','08:00','end_time','08:05','subject','Assemblée','room','102','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["monday"]'::jsonb,'start_time','08:05','end_time','09:00','subject','Sciences','room','102','teacher_ids',to_jsonb(array_remove(ARRAY[v_ihssene::text],NULL))),
      jsonb_build_object('days','["tuesday","thursday"]'::jsonb,'start_time','08:05','end_time','09:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["wednesday","friday"]'::jsonb,'start_time','08:05','end_time','09:00','subject','Histoire','room','102','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["monday"]'::jsonb,'start_time','09:00','end_time','09:55','subject','Anglais','room','102','teacher_ids',to_jsonb(array_remove(ARRAY[v_salma::text],NULL))),
      jsonb_build_object('days','["tuesday","thursday","friday"]'::jsonb,'start_time','09:00','end_time','09:55','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','09:00','end_time','09:55','subject','Sciences','room','102','teacher_ids',to_jsonb(array_remove(ARRAY[v_ihssene::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','09:55','end_time','10:05','subject','Récré','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","thursday","friday"]'::jsonb,'start_time','10:05','end_time','11:00','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','10:05','end_time','11:00','subject','Français','room','102','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','11:05','end_time','11:55','subject','Math','room','102','teacher_ids',to_jsonb(array_remove(ARRAY[v_humaira::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','12:00','end_time','12:55','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday","wednesday","thursday","friday"]'::jsonb,'start_time','13:00','end_time','13:10','subject','Qur''an','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days',v_all_days,'start_time','13:10','end_time','13:20','subject','Salah','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday","wednesday","thursday","friday"]'::jsonb,'start_time','13:20','end_time','14:00','subject','Lunch','room','102','teacher_ids',to_jsonb(array_remove(ARRAY[v_raeesah::text],NULL))),
      jsonb_build_object('days','["monday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','AP / Gym','room','Gym','teacher_ids','[]'::jsonb),
      jsonb_build_object('days','["tuesday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','Sciences','room','102','teacher_ids',to_jsonb(array_remove(ARRAY[v_ihssene::text],NULL))),
      jsonb_build_object('days','["wednesday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','Anglais','room','102','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["thursday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','Histoire','room','102','teacher_ids',to_jsonb(array_remove(ARRAY[v_maysa::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','14:00','end_time','15:00','subject','Islamic Studies','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL))),
      jsonb_build_object('days','["monday","tuesday","wednesday","thursday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Français','room','102','teacher_ids',to_jsonb(array_remove(ARRAY[v_mariatou::text],NULL))),
      jsonb_build_object('days','["friday"]'::jsonb,'start_time','15:00','end_time','16:00','subject','Islamic Studies','room','101','teacher_ids',to_jsonb(array_remove(ARRAY[v_ikram::text],NULL)))
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    time_slots = EXCLUDED.time_slots, teacher_ids = EXCLUDED.teacher_ids,
    name = EXCLUDED.name, subject = EXCLUDED.subject;

END $$;
