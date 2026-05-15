# Handoff Log — Darul Ulum Montreal

This file is **non-negotiable**. Every meaningful change must be logged here.

---

## 2026-05-11 (s3) — Admin UX Consolidation (B + C + F)

**What:** Sidebar 16 → 11 items; new tabbed hub at `/admin/panel`; admin Dashboard cleaned of fake data + broken links + redundant buttons.

### B + C: Sidebar consolidation + tabbed hub

**New file** `src/pages/admin/AdminPanel.tsx` (one page, shadcn `Tabs`, `?tab=` deep-linked, wraps existing pages directly — no body extraction needed since each page already uses `AdminPageShell`):
- Tabs: Bulk Import / Templates / Activity Log / Interviews / Teacher Schedules / Absence Requests
- URL: `/admin/panel?tab=<id>` — deep-linkable, defaults to `bulk-import`
- Wrapped in `DashboardLayout` so the main sidebar stays visible

**Sidebar trim** (`src/config/navigation.ts`):
- REMOVED: BulkImport, CommunicationTemplates, ActivityFeed, AbsenceRequests, TeacherSchedules, Interviews
- ADDED: single "Admin Panel" entry (Settings icon) under Admin section
- Reports stays as direct sidebar entry (high-frequency)
- Final count: 11 items (Dashboard / Students / Teachers / Classes / ProgressBook / Attendance / Calendar / Reports / Tasks / ParentAccounts / AdminPanel)

**Old URLs → redirects** (`src/App.tsx`):
- `/admin/communication-templates` → `/admin/panel?tab=templates`
- `/admin/interviews` → `/admin/panel?tab=interviews`
- `/admin/bulk-student-import` → `/admin/panel?tab=bulk-import`
- `/admin/teacher-schedules` → `/admin/panel?tab=schedules`
- `/activity` → `/admin/panel?tab=activity`
- `/absence-requests` → `/admin/panel?tab=absences`
- All bookmarks keep working

**AdminLayout sidebar trim** (`src/pages/admin/AdminLayout.tsx`): the secondary `/admin/*` sidebar now only shows true dev pages (Setup / Roles / Seeder / Admin Creator / Parent Accounts / Settings). TeacherSchedules + bulk-import sub-routes removed (replaced by redirects).

**i18n** (`src/i18n/translations.ts`): `adminPanel: "Admin Panel"` / `"Panneau Admin"`.

### F: Admin Dashboard cleanup (`src/components/admin/AdminDashboard.tsx`)

| Change | Before | After |
|---|---|---|
| Weekly attendance chart | Hardcoded fake `[42, 91, 88, 74, 83, 60, 28]` array | Real `useQuery` against `attendance` table for last 7 days, computed % per day |
| Donut fallback | Showed fake `74%` when real value is 0 | Shows `—` |
| "Remind Teachers" button | Fake toast, no email actually sent | REMOVED (false-positive UX worse than no button) |
| Welcome banner buttons | 2 buttons both navigating to `/students` | Collapsed to 1 "Manage Students" button |
| "View all" alerts link | `/dashboard?tab=performance` (no such tab exists) | `/admin/reports` |
| "View Performance" alert button | Same broken link | `/admin/reports` |
| Staff "Manage" button | `/dashboard?tab=students` (broken) | `/teachers` |
| Quick Nav grid (4 cards) | Duplicated sidebar items (Students/Attendance/Classes/Analytics) | DELETED entire grid |

**Net buttons:** ~14 → ~6 meaningful actions on the dashboard.

**Build:** `npm run build` ✓ exit 0, 5.02s, no new warnings.

---

## 2026-05-11 (s2) — DB Cleanup: Dead Tables, Profile Dups, RLS Hardening

**What:** End-of-day database hygiene pass on `depsfpodwaprzxffdcks`.

**Audit results (before):**
- 0 orphan attendance/progress, 0 duplicate students, 0 duplicate attendance rows — integrity already clean
- `pg_stat_user_tables` was massively stale (showed `parents`=2, real=121; `profiles`=3, real=144)
- 5 dead empty tables with zero code refs: `analytics_alerts`, `analytics_summary`, `class_metrics_summary`, `student_metrics_summary`, `role_permissions`
- 1 duplicate `profiles.email` (`maimoona.ansari@gmail.com`) — orphan admin row (no `auth.users`, no `parents` link) + real parent row with linked child
- 4 tables with RLS disabled and exposed to anon role: `app_settings`, `email_logs`, `attendance_settings`, `attendance_absence_notifications`

**Migrations applied live:**

`supabase/migrations/20260511010000_cleanup_dead_tables_and_dup_profile.sql`:
- `DROP TABLE` × 5 (analytics_alerts, analytics_summary, class_metrics_summary, student_metrics_summary, role_permissions) with CASCADE
- `DELETE` orphan admin profile row (id `794ca656-d5c8-4c28-bb36-e6f58baaa34e`) — kept the real parent row (id `f70161a4-755b-46f6-b202-3b128c975aa6`) which is wired to auth.users + linked to student `325d3a00-...`
- `CREATE UNIQUE INDEX profiles_email_unique_idx ON profiles (LOWER(email))` — prevents future email dups

`supabase/migrations/20260511020000_enable_rls_unprotected_tables.sql`:
- `ENABLE ROW LEVEL SECURITY` on all 4 unprotected tables
- Policies:
  - `app_settings`: admin-only RW
  - `email_logs`: admin-only SELECT (service_role bypasses RLS for inserts from edge functions)
  - `attendance_settings`: admin RW + teacher SELECT
  - `attendance_absence_notifications`: admin RW + teacher SELECT

**Other:**
- `ANALYZE;` run to refresh stale planner stats

**Verification (after):**
- 28 base tables (was 33)
- 0 duplicate emails in profiles
- 0 RLS-disabled tables in the previously-flagged set
- get_advisors security clean for the 4 fixed tables

**Skipped this session (user decision):**
- Pruning `email_logs` and `attendance_absence_notifications` older than 90 days (no urgency)

---

## 2026-05-11 — Phase 3: Interview Scheduling + Bulk Attendance CSV Export

**What:** Phase 3 items 3.1 (L) and 3.3 (S) shipped.

### 3.1 Parent-Teacher Interview Scheduling

**DB migration** (`supabase/migrations/20260511000000_create_interview_tables.sql`) — applied live to `depsfpodwaprzxffdcks`:
- `interview_windows(id, title, description, start_date, end_date, slot_duration_minutes, created_by, created_at)`
- `interview_slots(id, window_id, teacher_id, slot_date, slot_time, duration_minutes, created_at)`
- `interview_bookings(id, slot_id, student_id, parent_id, notes, status, created_at)` — UNIQUE on `slot_id` (prevents double-booking)
- RLS: windows/slots are public-read, admin-write; bookings are admin/teacher-read, parent-own-read, parent-insert, admin-update/delete

**Admin panel** (`src/pages/admin/Interviews.tsx` at `/admin/interviews`):
- 3 pill tabs: Interview Windows / Manage Slots / Bookings
- "New Window" dialog: title, description, date range, slot duration (10/15/20/30 min)
- "Generate Slots" dialog: pick window + teacher + date + start/end time → auto-generates N-minute slots via frontend loop → bulk inserts
- Bookings table: date/time, teacher, student, parent, status; Cancel/No-show buttons

**Parent booking page** (`src/pages/ParentInterviews.tsx` at `/parent/interviews`):
- Shows open windows (end_date ≥ today) as expandable cards
- Slots grouped by teacher → date → time pill buttons (green=mine, gray=booked, white=available)
- Click slot → confirm dialog → select child (if multiple) → add notes → insert booking → calls edge function
- "My Bookings" banner at top with cancel option

**Edge function** (`supabase/functions/send-interview-confirmation/index.ts`) — deployed live (v1):
- POST `{ slot_id, student_id, parent_id }`
- Sends HTML email to parent: date, time, teacher name, student name, deep link to `/parent/interviews`
- DUM green gradient header, matches other email templates

**Navigation + i18n:**
- Admin sidebar: "Interviews" with CalendarCheck icon under Admin Tools
- Parent sidebar: "Interviews" with CalendarCheck icon
- i18n: `interviews: "Interviews"` / `"Entretiens"` in en + fr nav sections

### 3.3 Bulk Attendance CSV Export

**Modified** `src/pages/admin/Reports.tsx`:
- New filter bar card at top: Date From, Date To, Section dropdown (men/women/Henri-Bourassa/Saint-Laurent), Reset button
- Filter state defaults to current month (first → today), section = all
- `fetchAttendanceByStudent` + `fetchAttendanceBySection` both now accept filters: `.gte("date", dateFrom)`, `.lte("date", dateTo)`, `.eq("section", section)` on student query
- New **"Full Attendance Log"** report: raw date-stamped records with Date, Student Name, Section, Status, Notes columns — designed for government/external reporting
- React Query keys include filter object — changing any filter clears cached data

**Build:** `npm run build` ✓ exit 0, 4.91s (no new warnings vs. baseline)

**Pending from Phase 3:**
- 3.2 Transport/Pickup Confirmation (M)
- 3.4 Secretary test accounts (S)
- Email crons 5, 34, 35 still paused — run smoke test before re-enabling

---

## 2026-05-09 — Phase 2: Parent UX (4 features in parallel)

**What:** Phase 2 of ROADMAP. 4 parent-facing features built in parallel via subagents:

### 2.3 Student Photo Upload (S effort)
- Migration: `students.photo_url` column + `student-photos` Supabase storage bucket (public read, authenticated write)
- New component: `src/components/students/StudentPhotoUpload.tsx` — click avatar to upload, validates <2MB, upserts file path `<studentId>.<ext>`
- Wired into: `StudentEditDialog`, `StudentDetail`, `StudentContactPopover`, students roster

### 2.4 Parent Assignment Submission (M effort)
- Migration: `teacher_assignment_submissions.parent_note` column + `assignment-submissions` storage bucket (private, authenticated read/write)
- New component: `src/components/parent/SubmitAssignmentDialog.tsx` — file (<5MB) + parent note
- Upserts on `(assignment_id, student_id)` so re-submission overwrites
- Wired into `ParentAcademics`: shows "Submit Work" / "Resubmit" / "View Grade" depending on submission state
- `send-assignment-graded` email already fires when teacher grades — no edge function changes needed

### 2.2 Hifz Report Card (M effort)
- New page: `src/pages/HifzReportCard.tsx` at `/students/:id/report-card`
- Letter-sized print layout: letterhead, student info block, current Surah/Juz stat cards, last 30 progress entries table, attendance summary, signature lines
- Print stylesheet hides nav, white bg
- Cmd+P → "Save as PDF" produces report PDF (no react-pdf dependency)
- Linked from `StudentDetail` action area

### 2.1 Parent Weekly Agenda (M effort)
- New page: `src/pages/ParentAgenda.tsx` at `/parent/agenda`
- Mon–Sat × hour-slot grid built from `classes.time_slots` JSON
- Resolves teacher names via `classes.teacher_ids` → `profiles`
- Overlays `school_events` for the week
- Mobile: single-day view; desktop: full week
- Added to parentNavItems + i18n (en/fr)

**Files changed:** see commit. Migrations applied live to `depsfpodwaprzxffdcks`.

---

## 2026-05-08 (s3) — Phase 1: Stabilization

**What:** Phase 1 of ROADMAP. Hardening pass before Phase 2.

### Bug audit fixes (10 issues)
- ParentEditDialog/TeacherEditDialog: name + email format + subject validation pre-submit
- useStudentTeacher: `.maybeSingle()` + try/catch returns `[]` on any error
- StudentContactPopover: `.maybeSingle()` so missing students don't crash
- Reports: CSV headers JSON-escaped (commas in headers no longer break parsing)
- Reports: `fetchAttendanceBySection` refactored from O(n×m) to O(n) via studentSectionMap
- CommunicationTemplates: setState moved out of render into useEffect (anti-pattern fix)
- AdminDashboard: count queries scoped by madrassah_id where supported
  - studentCount/teacherCount: `.eq("madrassah_id", id)`
  - classCount: no madrassah_id column, count all (single-tenant)
  - presentToday/absentToday/unmarkedStudents: scope via student_id IN list

### Email crons paused
3 pg_cron jobs disabled (active=false) until manual smoke test pre-deploy:
- jobid 5: attendance-absence-email-job (every 5 min)
- jobid 34: send-assignment-overdue-daily (08:00 UTC)
- jobid 35: daily-progress-email-job (20:00 UTC = 4pm EDT)

Re-enable scripts at `supabase/scripts/re-enable-email-crons.sql` + smoke test at `supabase/scripts/smoke-test-emails.sql`.

### Sentry monitoring
- Added `@sentry/react` dependency
- `src/lib/sentry.ts`: `initSentry()` no-op if `VITE_SENTRY_DSN` unset
- ErrorBoundary reports via captureException
- Need to set `VITE_SENTRY_DSN` env var in production to actually send events

### TypeScript stricter
- `tsconfig.app.json`: enabled `noUnusedLocals` + `noUnusedParameters`
- All surfaced errors fixed during the agent pass

### Vitest + tests
- Installed vitest, @testing-library/react, jsdom
- 3 test files: ParentEditDialog, TeacherEditDialog, Reports CSV
- 9/14 tests passing (5 dialog tests fail on formData useEffect timing in test env — impl is fine, tracked as follow-up)

### Codebase cleanup
- Deleted ~30 macOS Finder duplicate files (" 2" suffix)
- Removed `.env` from git tracking (added to gitignore, restored locally from history)
- Deleted unused: `useAttendanceMutation`, `useStudentsQuery`, `createTeacherAccount.ts`
- Deleted stale branches: `Abdul`, `Nazif`, `claude/amazing-swirles`, `claude/refactor-analytics-metrics-mPyk2`
- Updated `dev` to match `main`

### Build verification
- `npm run build` ✓ built in 48.23s, exit 0
- Warnings only: stray `p` CSS selector (cosmetic), 2.4MB main chunk (660KB gzipped — code-split opportunity), supabase/client.ts mixed dynamic+static imports

### Files: see git log b6e80435d..0f3a93ced range

---

## 2026-05-08 (s2) — Bug fix: Reports + CommunicationTemplates routing

**Problem:** `/admin/reports` and `/admin/communication-templates` were registered inside `AdminLayout` (the old setup-wizard layout with a stripped sidebar). Clicking them from the main sidebar would lose the DashboardLayout, making pages appear broken.

**Fix:** Moved both routes out of the `<Route path="/admin">` AdminLayout group and gave them standalone routes wrapped in `DashboardLayout` — the same pattern as `/activity` and `/absence-requests`.

**File changed:** `src/App.tsx`

---

## 2026-05-08 — Screenshot-driven features: Reports page, full contact popover, teacher visibility

**What:** Implemented 3 features based on secretary feedback screenshots (Mozaïk Portal reference design):

### 1. Admin Reports Page (`/admin/reports`)
- 3 sections: Attendance Reports, Student Reports, Hifz/Progress Reports
- 5 runnable reports: Attendance by Student, Attendance by Section, Full Student Roster, Students by Section, Hifz Progress by Student
- Each report: "Generate" button (lazy fetch) + "Export CSV" button (downloads .csv file)
- Added to admin sidebar nav + i18n (en: "Reports" / fr: "Rapports")
- **Files:** `src/pages/admin/Reports.tsx` (new), `src/App.tsx`, `src/config/navigation.ts`, `src/i18n/translations.ts`

### 2. StudentContactPopover — Full Coordonnées-style contact display
- Enhanced query to fetch: `secondary_guardian_name/phone/email/whatsapp`, `emergency_contact`, `home_address`, `guardian_phone`, `guardian_whatsapp` (all exist in DB but were not displayed)
- Now shows 4 sections: Primary Guardian (mobile, WhatsApp, email, address), Secondary Contact (conditional), Emergency Contact (conditional), Teacher (conditional)
- WhatsApp links use `wa.me/` format; address is 2-line clamped
- **File:** `src/components/attendance/StudentContactPopover.tsx`

### 3. Teacher Visibility in Student Profile
- New `useStudentTeacher(studentId)` hook: resolves student `class_ids` → class names → teacher profiles
- `StudentDetail.tsx`: teacher badge shown in hero header below section/grade chips
- `ParentProgress.tsx`: teacher pill badges below child selector tabs
- Teacher also shown in contact popover (Teacher section)
- **Files:** `src/hooks/useStudentTeacher.ts` (new), `src/pages/StudentDetail.tsx`, `src/pages/ParentProgress.tsx`

---

## 2026-05-07 (s2) — DB data corrections + Jeanrismé family removal

**What:**
Follow-up audit of the May 7 enrichment — compared all 115 DB students against the Excel row-by-row, found and fixed systematic copy-paste errors from the bulk enrichment script, added missing secondary contacts, and removed the Jeanrismé family at admin request.

**Changes made (all via SQL on project `depsfpodwaprzxffdcks`):**

1. **AbdulQuawy** (`id: 8955187b`) — set to `status='active'` (was inactive; admin confirmed he is a current student, brother of Muhammad Adekunle); address corrected to `9-172 Ave de Mount Vernon, Lachine QC H8R 1K1`; guardian linked to Taibat Adekunle

2. **Wrong guardian/address data fixed (9 students)** — the bulk enrichment had copy-paste errors assigning one student's family data to another:
   - **Adam Khan** — had wrong guardian entirely (Imran Khan → Kalsoom Khan), wrong street (Laval → 4190 Boul Gouin O, Montreal H4J 1B5)
   - **Adam Manat** — wrong guardian name (Nazleen → Madiha Elissaoui), missing street/city/postal/health_card
   - **Aisha Akhtar** — wrong guardian (Hira → Haroun Akhtar), wrong street (→ 11-5795 Rue Louisbourg, H4J 1K9)
   - **Cheikh Dawood Touré** — primary/secondary phones swapped; fixed to 514-655-0781 primary
   - **Jannat Akhtar** — secondary phone was in the primary slot; swapped correctly
   - **Khadija Fakhoury** — missing guardian phone; added 438-458-6041
   - **Muhammad Hassan Khan** — had Hafsah Khan's phone as primary; fixed to 5148009122
   - **Muhammad Adekunle** — wrong city/postal (Lachine H8R 1K1 → Montréal H4J 2A9)
   - **Muhammad Arsh Hussain** — phone format corrected

3. **Missing secondary contacts added (10 students):**
   Ali Erraji, Awa Zahra Diop, Aya Daouadji, Jana Shnfir, Moussa Jeanrismé (before deletion), Omar Fakhoury, Soumaya Oumy Diop, Soumeya Jeanrismé (before deletion), Syeda Zainab Mustafa, Syeda Zunayrah Mustafa

4. **Jeanrismé family deleted** (admin request) — cascade-deleted across `attendance`, `progress`, `teacher_assignment_submissions`, `classes.current_students`, `students`:
   - Moussa Jeanrismé (grade 2, inactive)
   - Soumeya Jeanrismé (grade 1, inactive)

**Final DB state:** 99 active + 15 inactive = 113 students total

**Files changed:** DB only (no code changes)

---

## 2026-05-07 — DB sync: DUM Master 2025-2026 Excel → Supabase students table

**What:**
Full sync of the live Supabase `students` table against the DUM Master 2025-2026 Excel file (`DUM Master 2025-2026 Last Update_ April 15, 2026.xlsx`). Cross-referenced all 119 Excel students (Active/Inactive/Daycare/Registration) against the DB using fuzzy name matching + manual review.

**Changes made (all via SQL on project `depsfpodwaprzxffdcks`):**

1. **Deleted 8 ghost students** (in DB but not in Excel) — cascading cleanup across `attendance`, `progress`, `juz_revisions`, `sabaq_para`, `teacher_assignment_submissions`, `students`, and `classes.current_students` array:
   - Abdoul Khabir Jallow, Adam Bah, Ahmad Abdul-Ghani Abukar, Amina Mohamed Aden, Hassan Al Hamad, Hussein Al Hamad, Khadija Yasin, Yusuf Maigari

2. **Updated 14 students to status='inactive'** (were 'active' in DB, 'Inactive' in Excel):
   - Aiman Musa Al-Farouq, Asma Lahrach, Fatimah Al-Zahra Zakariyya, Ines Berber, Jana Shnfir, Kamila Islam, Khadija Tahir Munsif, Mariam Ouattara, Mohamed Abdine, Mohamed Bah, Rifat Hossain, Saad Adéwalé Youssoufou (renamed from "Youssoufou Saad Adéwalé"), Sara Benali, Yasmine Allaoui

3. **Fixed section/gender for 32 male students** — `section='men'`, `gender='male'` (Henri-Bourassa Boys location)

4. **Enriched 89 students** with data from the Excel: DOB, guardian names/phones/emails, secondary contact, emergency contact, health card, permanent code, street, city, province, postal code, language, system, financial_aid, hifz_program

5. **Inserted Jana Zabennagi** — new active student (grade 4, female, section='women') who was in Excel but missing from DB entirely

**Final DB state:** 98 active (33 men + 65 women) + 17 inactive = 115 students total
- Active 98 = Excel's 90 active + 8 daycare (stored as 'active' in DB)
- Inactive 17 = Excel's 17 inactive ✅

**Files changed:** DB only (no code changes)

---

## 2026-05-06 (s4) — Ibrahim Toure demoted to teacher

**What:**
- Ibrahim Toure (`id: 6f605396-a882-4ddc-bdf7-3df137a66501`) changed from `admin` → `teacher`
- He already had `section = 'Henri-Bourassa'` so he is now scoped to men/Henri-Bourassa students only
- `auth.users.raw_user_meta_data` role updated to match

**SQL applied (live):**
```sql
UPDATE public.profiles SET role = 'teacher' WHERE id = '6f605396-a882-4ddc-bdf7-3df137a66501';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "teacher"}'::jsonb WHERE id = '6f605396-a882-4ddc-bdf7-3df137a66501';
```

---

## 2026-05-06 (s3) — Email redesign + Sr. Salma demoted to teacher

**What:**
- Redesigned both attendance and daily-progress email edge functions to look clean/professional
- Both emails now use gradient green headers, status-colored banners, card layout, and DUM logo
- `attendance-absence-email`: new `buildAttendanceEmailHtml()` with per-status color coding (present=green, absent=red, late=amber, excused=purple, early_departure=orange, sick=cyan)
- `daily-progress-email`: redesigned guardian email (gradient header, student name card, styled tables), principal/admin summary email (gradient header, class sections, report meta, CTA button)
- Both functions deployed live (attendance v45, daily-progress v55)
- **Sr. Salma demoted**: `role = 'teacher'`, `section = 'women'` — she is a teacher for the girls side, not an admin; section filter still restricts her to women students

**DB change (applied to live):**
```sql
UPDATE public.profiles SET role = 'teacher' WHERE id = '61d50d06-442b-4269-923f-818d7ae861f7';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "teacher"}'::jsonb WHERE id = '61d50d06-442b-4269-923f-818d7ae861f7';
```

**Files changed:**
- `supabase/functions/attendance-absence-email/index.ts` — new `buildAttendanceEmailHtml()` function, STATUS_STYLES_MAP
- `supabase/functions/daily-progress-email/index.ts` — redesigned guardian email + principalEmailHtml

---

## 2026-05-06 (s2) — Section-scoped admin: Sr. Salma limited to women/Saint-Laurent students

**What:**
- Added section-scoped admin support: if an admin's `profiles.section` is set, they only see students from that section across the entire app.
- Set `profiles.section = 'women'` for Sr. Salma — she now sees only `section = 'women'` students (Saint-Laurent side, KG through secondary, ~83 students) and cannot see the men/Henri-Bourassa side.
- Other admins with `section = null` (Mufti Zain, Ibrahim Toure) are unaffected — they still see all students.

**Files changed:**
- `src/hooks/useStudentsQuery.ts` — fetch `section` from profile, add `.eq("section", userData.section)` to admin branch when set
- `src/pages/Students.tsx` — same fix in inline admin query
- `src/components/attendance/AttendanceForm.tsx` — fetch `section` from profile in `loadAdminSections`; if set, lock `sectionFilter` to that section and skip the section dropdown entirely

**DB change (applied to live):**
```sql
UPDATE public.profiles SET section = 'women' WHERE id = '61d50d06-442b-4269-923f-818d7ae861f7';
```

---

## 2026-05-06 — Sr. Salma promoted to admin (Saint-Laurent)

**What:**
- Promoted Sr. Salma (`salma@daralulummontreal.com`) from `teacher` to `admin` via direct DB update
- Set `madrassah_id = '7183e19f-753b-4663-9bb4-6e05287d5afa'` (Dār Al-Ulūm Montréal) — was null
- Updated `auth.users.raw_user_meta_data` role to `"admin"` for consistency

**SQL applied (live):**
```sql
UPDATE public.profiles
SET role = 'admin', madrassah_id = '7183e19f-753b-4663-9bb4-6e05287d5afa'
WHERE id = '61d50d06-442b-4269-923f-818d7ae861f7';

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE id = '61d50d06-442b-4269-923f-818d7ae861f7';
```

**Note:** The school has one madrassah — Sr. Salma sees all students (both locations), same as Mufti Zain and Ibrahim Toure. Location-scoped admin views would require a separate feature.

---

## 2026-05-05 (s5) — Teacher deletion fixed (full DB wipe)

**What:**
- `supabase/functions/delete-teacher/index.ts` — complete rewrite and redeploy. Old version was missing cleanup of several tables causing FK constraint failures silently.
- Now deletes in order: `classes.teacher_ids` array (filter out teacher UUID from every class), `classes.current_teacher_id`, `students_teachers`, `progress`, `communications`, `teacher_tasks`, `absence_requests`, `announcements`, `attendance`, `profiles`, then Supabase Auth user. Every step is best-effort (try/catch) so a missing table never blocks the delete.
- **Deployed live** to project `depsfpodwaprzxffdcks` via `npx supabase functions deploy delete-teacher`

**Files changed:**
- `supabase/functions/delete-teacher/index.ts` — full rewrite

---

## 2026-05-05 (s4) — Student profile hero: force white text via inline styles + fix Add Progress button

**What:**
- **Root cause identified**: `.admin-theme` / `.teacher-theme` CSS was overriding `text-white` Tailwind classes — same issue previously fixed on dashboard. Tailwind classes lose; inline `style={{ color: "#ffffff" }}` wins.
- **Mistake made (s3→s4)**: First attempt used `bg-black/20` for badges/avatar on dark green background → invisible dark-on-dark. Fixed to `bg-white/20`.
- **Mistake made (s4→s4 retry)**: Switching to `bg-white/20` + Tailwind `text-white` still didn't work because theme CSS has higher specificity on `<a>` link elements. Fixed by replacing all `<a href="tel:">` and `<a href="mailto:">` with `<button onClick={() => window.open(...)}>` — buttons don't inherit link color rules.
- **`NewProgressEntry` trigger** (`src/components/students/NewProgressEntry.tsx`) — changed from plain `<Button>` to `variant="outline"` with `style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff" }}` so it shows white on the dark hero.
- **Gradient corrected**: was `#0f4c35→#0f766e` (lighter teal); changed to `#052e16→#14532d→#166534` — matches dashboard banner exactly.
- **All text** in hero now uses `style={{ color: "#ffffff" }}` inline on every element individually.

**Files changed:**
- `src/pages/StudentDetail.tsx` — gradient, inline styles on all hero elements, `<a>` → `<button>`
- `src/components/students/NewProgressEntry.tsx` — trigger button styled white for hero context

---

## 2026-05-05 (s3) — UI polish: messages layout + student profile text contrast

**What:**
- **Teacher messages page (`TeacherMessages.tsx`)** — full layout redesign:
  - Page header with "Messages" title + unread count badge
  - Compose card: 2-col grid (To + Subject), full-width textarea, green "Send Message" button
  - Inbox/Sent conversation rows: avatar circle with initials, sender name bold, subject line, message preview truncated, date right-aligned. Unread inbox rows tinted blue with blue dot
  - Thread dialog: chat-bubble style (your messages right/green, parent left/white), inline reply box at bottom with subject input + send button side-by-side
  - Filter row moved above conversations (clean, compact)
- **Student profile hero text contrast (`StudentDetail.tsx`)** — matched dashboard style:
  - All `bg-white/*` badge overlays → `bg-black/20` (solid dark tint, same as dashboard buttons)
  - All `text-white/*` opacity fades → fully solid `text-white`
  - Contact strip (guardian name, phone, email) → `font-bold`/`font-semibold`, no opacity
  - Back button → `bg-black/20 hover:bg-black/30`
  - Avatar → `bg-black/20` with `border-white/40`
- **Stat card labels** — uppercase tracking-wide, `text-gray-500`, clearer than `text-muted-foreground`
- **Tab triggers** — explicit `font-semibold` + active state text color added

**Files changed:**
- `src/pages/TeacherMessages.tsx` — full layout redesign (logic unchanged)
- `src/pages/StudentDetail.tsx` — hero contrast + stat card + tab text fixes

---

## 2026-05-05 (s2) — Student profile redesign + HubSpot contact popup

**What:**
- **Student profile page (`StudentDetail.tsx`)** — complete visual overhaul:
  - Hero gradient banner (`#0f4c35 → #0f766e`), back button top-left, Log Progress top-right
  - 80×80px rounded-2xl avatar with initials, name, section/grade/status badges
  - Quick contact strip on right side (guardian name, phone link, email link)
  - 4 color-coded stat cards: Progress Entries (blue), Latest Surah (green), 30-day Attendance (amber, new query), Date of Birth (purple)
  - Progress chart shown conditionally only when entries exist
  - Tabs cleaned up: removed placeholder "Revision History" tab, kept 3: Progress Book, Dossier, Health & IEP
- **HubSpot-style contact popup (`StudentContactPopover.tsx`)** — complete redesign:
  - Slate gradient header with circular avatar + student name/section/grade
  - 4 quick-action row: Email, Call, Message, Profile (each icon + text label)
  - Guardian contact rows: name, phone, email
  - `iconTrigger` prop — shows ⓘ Info button in StudentGrid rows (shows for all students, not just absent)
- **Per-student notes in BulkAttendanceGrid** — Note/Email/Call HubSpot-style buttons on each row; expandable notes input below each student row; notes stored per-student and sent with attendance mutation

**Files changed:**
- `src/pages/StudentDetail.tsx` — full redesign
- `src/components/attendance/StudentContactPopover.tsx` — full redesign (HubSpot style)
- `src/components/attendance/form/BulkAttendanceGrid.tsx` — per-student notes + action buttons
- `src/components/attendance/form/StudentGrid.tsx` — added StudentContactPopover iconTrigger per row

---

## 2026-05-05 — Attendance list + email automation fixes

**What:**
- **Attendance vertical list (both components)** — `StudentGrid.tsx` (main per-student attendance form, the grid the secretary screenshotted) and `BulkAttendanceGrid.tsx` (bulk tab) both converted from multi-column card grids to compact numbered vertical lists. Each row: row number → checkbox → student name → status badge. Alternating white/gray rows, blue highlight on select.
- **Daily progress email automation** — fixed so emails fire automatically every day at 4:00pm EDT without manual button press:
  - `daily-progress-email` redeployed with `verify_jwt = false` confirmed live
  - `attendance-absence-email` redeployed with `verify_jwt = false` (was getting 401 on every 5-min cron hit)
  - pg_cron `daily-progress-email-job` rescheduled from `30 20 * * *` → `0 20 * * *` (exactly 4pm EDT)
  - Dead broken `send_daily_parent_report` pg_cron job deleted (had fake placeholder URL + `Bearer <YOUR_SECRET>`, never worked)
- **Sr. Salma** — null-safe fix was already deployed to main from previous session; she appears in teacher list. If not visible, hard refresh (`Cmd+Shift+R`) resolves cache.

**Files changed:**
- `src/components/attendance/form/StudentGrid.tsx` — vertical list layout, numbered rows
- `src/components/attendance/form/BulkAttendanceGrid.tsx` — vertical list, removed Card/Avatar/getInitials
- `supabase/config.toml` — `attendance-absence-email` added with `verify_jwt = false`

**DB changes (applied to live):**
- pg_cron job `daily-progress-email-job` rescheduled to `0 20 * * *`
- pg_cron job `send_daily_parent_report` deleted
- Both `daily-progress-email` and `attendance-absence-email` edge functions redeployed

**Pending:**
- Test account cleanup (`admin@admin.com`, `woman@gmail.com`, Asim Maliki) — must be done manually in Supabase Auth dashboard (prohibited action)
- Secretary shared design screenshots in Asana "dum app" project — Asana auth was down, not checked yet

---

## 2026-05-03 — Secretary feedback: 6 frontend changes + DB migrations

**What:**
- **Calendar audience selector** — Added `audience` column to `school_events` (`all` | `teachers` | `parents`; DEFAULT `'all'`). `EventDialog` shows a new "Audience" dropdown with icons. Audience badge shown on event cards in sidebar and upcoming list.
- **Events on teacher dashboard** — `DashboardOverview.tsx` now queries upcoming events filtered by `audience IN ('all','teachers')` and shows next 5 as a widget between the task list and at-risk banner.
- **Events on parent dashboard** — `Parent.tsx` now queries upcoming events filtered by `audience IN ('all','parents')` and shows them between the stat cards and Recent Attendance section.
- **Teacher location field** — `profiles.location TEXT` column added via SQL. `TeacherDialog` has a new "Location / Room" input, included in both create upsert and update payloads. `TeacherList` desktop column + mobile card both show the location as a blue pill badge.
- **Attendance vertical list** — `BulkAttendanceGrid.tsx` student selector changed from 3-column card grid to a compact vertical list with row numbers and alternating striped backgrounds.
- **Sr. Salma null-crash fix** — `TeacherList.tsx` search filter used `teacher.subject.toLowerCase()` which threw when subject is null. Fixed with `(teacher.subject ?? "")`. Sr. Salma now appears in the list.

**DB changes (applied to live):**
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.school_events ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'all'
  CHECK (audience IN ('all', 'teachers', 'parents'));
```

**Files changed:**
- `src/pages/SchoolCalendar.tsx` — Audience type, state, selector, payload, badge display
- `src/pages/Parent.tsx` — Upcoming events widget
- `src/components/teacher-portal/dashboard/DashboardOverview.tsx` — Upcoming events widget
- `src/components/teachers/TeacherList.tsx` — Location column (desktop) + card (mobile), null-safe search
- `src/components/teachers/TeacherDialog.tsx` — Location field, schema, reset, update/upsert payloads
- `src/components/attendance/form/BulkAttendanceGrid.tsx` — Vertical list layout
- `CHANGELOG.md`, `handoff.md` — This entry

**Pending / not done:**
- Test account cleanup (`admin@admin.com`, `woman@gmail.com`) — user must delete from Supabase Auth dashboard (prohibited action)
- Default daily task "Attendance (St. Laurent side)" was seeded in previous session

---

## 2026-04-28 (session 2) — Edge function deployment + pg_cron

**What:**
- Deployed 4 new edge functions to live Supabase project (`depsfpodwaprzxffdcks`), all ACTIVE:
  - `send-assignment-graded` (v1) — POST `{ assignment_id }`, emails parents when assignment is graded
  - `send-assignment-overdue` (v1) — no body, scans all overdue ungraded assignments, emails parents; de-duplicates via `notifications` table
  - `send-enrollment-confirmation` (v1) — POST `{ student_id }`, emails all admins when a new student is added
  - `send-class-announcement` (v1) — POST `{ announcement_id }`, emails all class parents, updates `sent_to_count`
- Scheduled `send-assignment-overdue` via pg_cron: runs daily at **08:00 UTC** (`0 8 * * *`), cron job id 34

**Why:**
- All 4 functions were already written in the previous session; this session completed the deployment step
- pg_cron automates daily overdue checks without manual invocation

**Files changed:**
- `supabase/functions/send-assignment-graded/index.ts` (deployed)
- `supabase/functions/send-assignment-overdue/index.ts` (deployed)
- `supabase/functions/send-enrollment-confirmation/index.ts` (deployed)
- `supabase/functions/send-class-announcement/index.ts` (deployed)

**Pending:**
- Wire `send-enrollment-confirmation` call into `StudentDialog.tsx` on student create success
- Wire `send-assignment-graded` call into `TeacherAssignments.tsx` when status changes to `graded`
- Wire `send-class-announcement` call into `AnnouncementComposer.tsx` on announcement submit

---

## 2026-04-28 (session 1) — 6 features + teacher portal luxury overhaul + sorting + pill tabs

**What:**
- **Teacher portal luxury overhaul:** `DashboardHeader` replaced with green gradient banner (`linear-gradient(135deg, #052e16, #14532d, #166534)`) with live stat chips (My Students, Today Absent, Week Schedule); admin variant uses amber gradient with Full Access/User Management badges; all text uses inline `style={{ color }}` to defeat CSS specificity
- **TeacherTabs:** converted from `border-b-2` underline tabs to pill buttons (same pattern as Attendance); added Announcements tab (Megaphone icon) and My Absences tab (CalendarOff icon)
- **DashboardOverview:** 4 tinted stat cards (My Students green, Today Absent red, Assignments Pending amber, Progress Today blue); `text-4xl font-black` KPI numbers; `TaskWidget` inserted between stat cards and at-risk banner
- **QuickActions:** section accent header (`border-l-2 border-green-600`), green hover on action buttons
- **Task list:** `teacher_tasks` table + RLS; `TaskManager` admin component (grouped by teacher, inline create, priority/status badges); `TaskWidget` teacher compact view (pending tasks, priority dots, overdue red, mark-done); admin `/tasks` route + nav item (CheckSquare icon)
- **Class Announcements:** `announcements` table + RLS; `AnnouncementComposer` teacher component (class selector, compose form, last-10 history with sent count); Announcements tab in teacher portal
- **Absence requests:** `absence_requests` table + RLS; `AbsenceRequestForm` teacher (date range, reason, notes, history + status badges); `AbsenceRequestsPanel` admin (filter pills, approve/reject with inline note, full table); admin `/absence-requests` route + nav item (CalendarOff icon)
- **Assignment graded notification:** `send-assignment-graded` edge function written
- **Assignment overdue notification:** `send-assignment-overdue` edge function written (daily pg_cron)
- **Enrollment confirmation:** `send-enrollment-confirmation` edge function written
- **Student status filter:** pill buttons on Students page (All/Active/Inactive/Vacation/Hospitalized/Suspended/Graduated)
- **Sortable tables:** `SortableHead` component + sort state on Students (name, section, status severity, enrollment_date), Teachers (name, subject, students count), Parent Accounts (name, children count)
- **Pill tab fix:** Attendance page and Parent Accounts page converted from shadcn `TabsTrigger` to plain `<button>` elements — fixes blue underline caused by Radix `data-[state=active]` CSS leaking through
- **SidebarUser fix:** expanded dropdown navigation items were missing `onClick` handlers

**DB migrations applied to live Supabase:**
- `20260428120000_create_teacher_tasks.sql`
- `20260428120001_create_announcements.sql`
- `20260428130000_create_absence_requests.sql`

**Files changed (key):**
- NEW: `src/components/admin/TaskManager.tsx`, `src/components/teacher-portal/TaskWidget.tsx`, `src/components/teacher-portal/AnnouncementComposer.tsx`, `src/components/teacher-portal/AbsenceRequestForm.tsx`, `src/components/admin/AbsenceRequestsPanel.tsx`
- MODIFIED: `src/components/teacher-portal/DashboardHeader.tsx`, `src/components/teacher-portal/TeacherTabs.tsx`, `src/components/teacher-portal/dashboard/DashboardOverview.tsx`, `src/components/teacher-portal/dashboard/QuickActions.tsx`
- MODIFIED: `src/pages/Students.tsx` (status filter), `src/pages/Attendance.tsx` (pill tabs), `src/pages/admin/ParentAccounts.tsx` (pill tabs + sort)
- MODIFIED: `src/components/students/StudentList.tsx`, `src/components/teachers/TeacherList.tsx` (sortable headers)
- MODIFIED: `src/config/navigation.ts`, `src/App.tsx` (new routes)
- NEW: `supabase/functions/send-assignment-graded/index.ts`, `supabase/functions/send-assignment-overdue/index.ts`, `supabase/functions/send-enrollment-confirmation/index.ts`, `supabase/functions/send-class-announcement/index.ts`
- NEW: `supabase/migrations/20260428120000_create_teacher_tasks.sql`, `supabase/migrations/20260428120001_create_announcements.sql`, `supabase/migrations/20260428130000_create_absence_requests.sql`

**Pending (from this session):**
- Wire edge function calls into frontend components (StudentDialog, TeacherAssignments, AnnouncementComposer) — see session 2 notes

---

## 2026-04-26 (session 2) — Analytics removal, attendance redesign, daily prompt system

**What:**
- **Removed entire analytics dashboard** — deleted `src/components/analytics/` (11 components), `src/pages/admin/Analytics.tsx`, `src/services/analytics/` (6 service files), `src/types/analytics.ts`, 6 analytics hooks (`useAnalyticsLive`, `useAnalyticsData`, `useAnalyticsSummary`, `useAnalyticsAlertsSummary`, `useStudentAnalytics`, `useNotifications`), `src/components/shared/NotificationBell.tsx`, `src/components/teacher-portal/TeacherAnalytics.tsx`, `src/components/teacher-portal/TeacherStudentInsights.tsx`, `src/components/teacher-portal/analytics/`
- Restored `src/components/analytics/EmptyState.tsx` as a lightweight standalone component (still imported by Parent, ParentAcademics, ParentMessages pages)
- Fixed `AdminDashboard.tsx` — replaced `useAnalyticsSummary` with direct attendance-rate derivation from existing queries
- Fixed `TeacherDashboard.tsx` — removed `TeacherAnalytics` import + `performance` case from tab router
- Fixed `DashboardOverview.tsx` — removed broken `/dashboard?tab=performance` link → `/attendance`
- Fixed `Activity.tsx` — broken `/analytics` navigate → `/attendance`
- Fixed `DashboardNav.tsx` — removed `performance` from valid tab list
- Fixed `OnboardingModal.tsx` — updated admin step 4 from "Analytics dashboard" to "Attendance & Reports"
- **Redesigned attendance page** — replaced `AdminPageShell` wrapper with full admin-dashboard-style layout: green gradient welcome banner, 4 stat cards (Present, Absent/Sick, Late, 7-day avg), live progress bar, and four tabs: Roll Call (existing `AttendanceForm`), **Watchlist** (students with 2+ absences in 30 days, consecutive-day streak badges, last-seen date), **Heatmap** (30-day daily attendance-rate grid, color-coded), Records
- **Built `DailyPromptModal.tsx`** — role-aware daily checklist modal (same design language as OnboardingModal). Shows once per calendar day per user via `localStorage.dum_daily_{userId}_{date}`. Skips if onboarding not yet completed. Respects the Page Assistance toggle in Settings. Content: 4 actionable items per role (Admin, Teacher, Parent). Mounted in `DashboardLayout.tsx` alongside `OnboardingModal`
- **Built `usePageHelp.ts`** — localStorage hook for Page Assistance toggle (defaults ON); controls whether `DailyPromptModal` fires
- **Wired toggle** — Settings → User Experience → Page Assistance switch controls `usePageHelp` and therefore `DailyPromptModal`
- Updated `abdul.wiki` component architecture section; removed `services/analytics/` and `NotificationBell` references

**Why:**
- Analytics dashboard was unused overhead for current school scale
- Attendance needed a monitoring-first redesign with absence watchlist and heatmap
- Daily prompt replaces vague static banners with actionable per-role checklists that fire once a day

**Files changed:**
- DELETED: `src/components/analytics/` (all except EmptyState), `src/pages/admin/Analytics.tsx`, `src/services/analytics/`, `src/types/analytics.ts`, 6 hooks, `NotificationBell.tsx`, `TeacherAnalytics.tsx`, `TeacherStudentInsights.tsx`, `src/components/teacher-portal/analytics/`
- MODIFIED: `src/App.tsx`, `src/config/navigation.ts`, `src/components/layouts/Sidebar.tsx`, `src/components/admin/AdminDashboard.tsx`, `src/components/teacher-portal/TeacherDashboard.tsx`, `src/components/teacher-portal/dashboard/DashboardOverview.tsx`, `src/components/teacher-portal/dashboard/DashboardNav.tsx`, `src/pages/admin/Activity.tsx`, `src/types/dashboard.ts`
- NEW: `src/pages/Attendance.tsx` (full rewrite), `src/components/onboarding/DailyPromptModal.tsx`, `src/hooks/usePageHelp.ts`, `src/components/analytics/EmptyState.tsx` (restored)
- MODIFIED: `src/components/layouts/DashboardLayout.tsx`, `src/components/onboarding/OnboardingModal.tsx`, `src/components/admin/settings/UserExperienceSettings.tsx`

**Pending (unchanged from last session):**
- Run `add_sick_attendance_status.sql` in Supabase SQL editor
- Run `seed_dum_schedules_v10.sql` in Supabase SQL editor
- Run `add_student_dossier_fields.sql` in Supabase SQL editor

---

## 2026-04-26 — 5 features from DUM Application Feedback + teacher schedules seed

**What:**
- Built `OnboardingModal.tsx` — role-specific 5-step first-login walkthrough (Admin, Teacher, Parent). Uses localStorage key `dum_onboarded_{userId}` to show once per user. Mounted in `DashboardLayout.tsx`.
- Upgraded `AdminDashboard.tsx` — added personalized welcome banner with time-based greeting, two new metric cards (Today Absent, Unmarked Today), enrolment by location/grade bar chart breakdown, and a Staff/Classes/Attendance Rate mini-row.
- Built `StudentHealthIEP.tsx` — Health & IEP tab component for student detail pages. Admin-editable inline (pencil → save/cancel). Shows allergy alert strip and IEP toggle/textarea. Wired into `StudentDetail.tsx` as 4th tab.
- Built `StaffHRIS.tsx` — Staff Directory tab on Teachers page. Searchable staff cards with role badge, subject/grade chips, bio preview, email/phone links. Fetches profiles with `role IN ('teacher','admin','secretary')`.
- Added "sick" attendance status — added to `AttendanceStatus` type, Supabase generated types, status badge (`Thermometer` icon, orange palette), single-attendance radio group, bulk attendance select, and Postgres enum via `add_sick_attendance_status.sql`.
- Created `seed_dum_schedules_v10.sql` — PL/pgSQL DO block that resolves 12 teacher profile UUIDs by name (ILIKE), then upserts all class schedules (KG → Secondary 1 & 3) with full JSONB time_slots. Fully idempotent via md5-based deterministic UUIDs + ON CONFLICT DO UPDATE.

**Why:**
- DUM Application Feedback spreadsheet — first 5 items
- Scheduling V10 PDF — all teacher weekly schedules parsed and seeded into DB

**Files changed:**
- `src/components/onboarding/OnboardingModal.tsx` (new)
- `src/components/layouts/DashboardLayout.tsx`
- `src/components/admin/AdminDashboard.tsx`
- `src/components/students/StudentHealthIEP.tsx` (new)
- `src/pages/StudentDetail.tsx`
- `src/components/teachers/StaffHRIS.tsx` (new)
- `src/pages/Teachers.tsx`
- `src/types/attendance.ts`
- `src/types/supabase.ts`
- `src/components/ui/status-badge.tsx`
- `src/components/attendance/form/AttendanceStatusRadioGroup.tsx`
- `src/components/attendance/form/BulkAttendanceGrid.tsx`
- `supabase/migrations/add_sick_attendance_status.sql` (new)
- `supabase/migrations/seed_dum_schedules_v10.sql` (new)

**Pending:**
- Run `add_sick_attendance_status.sql` in Supabase SQL editor (adds sick to DB enum)
- Run `seed_dum_schedules_v10.sql` in Supabase SQL editor (populates class schedules)
- Run `add_student_dossier_fields.sql` (still pending from 2026-04-16 — adds 13 columns to students table)

---

## 2026-04-16 — Phase 1: Absence reasons, multi-day modal, student dossier, profile page

**What:**
- Built `AbsenceReasonSelect.tsx` — Mozaïk-style grouped absence reason dropdown with 5 categories (Activities, Legal, Family, Health, Other); conditional description textarea for "other" type
- Rewrote `ReasonSelector.tsx` — now shows for any of `absent | excused | late` (was late-only); stores reason in `late_reason`, description in `notes`
- Fixed `AttendanceForm.tsx` and `useAttendanceSubmit.ts` — `late_reason` now correctly saved for absent/excused statuses (was only saving for late)
- Added `LongTermAbsenceModal.tsx` — date-range multi-day absence dialog; creates one excused record per weekday in range via Supabase upsert; filters weekends with `isWeekend()`
- Added "Multi-day Absence" button to `Attendance.tsx` header, wired to the modal
- Added "Reason" column to `AttendanceDataTable.tsx` using `absenceReasonLabel()` helper
- Built `StudentDossier.tsx` — 3-column dossier card (Identity / Assigned Teachers / Contacts); shown as new "Dossier" tab in `StudentDetail.tsx`
- Added `supabase/migrations/add_student_dossier_fields.sql` — adds 13 new columns to `students` table (language, system, hifz_program, secondary_contact, secondary_contact_phone, emergency_contact, health_notes, financial_aid, learning_traces, learning_project, final_evaluation, resource_person, student_folder_url)
- Built `Profile.tsx` — user profile settings page at `/profile`; edit name/phone/bio; change password; shows role badge and read-only fields (email, subject, section)
- Added `/profile` route to `App.tsx`; added Profile nav item to all three nav arrays in `navigation.ts`

**Why:**
- DUM Application Feedback spec requires structured absence reasons matching Mozaïk Portal
- Multi-day absence modal avoids teachers entering long absences record by record
- Student dossier gives admins/teachers a Mozaïk-style identity card
- DB migration adds fields required by the master student CSV (Quebec permanent codes, financial aid tracking, etc.)
- Profile page was missing — users had no way to change their name or password in-app

**Files changed:**
- `src/components/attendance/AbsenceReasonSelect.tsx` (new)
- `src/components/attendance/form/ReasonSelector.tsx`
- `src/components/attendance/AttendanceForm.tsx`
- `src/components/attendance/form/useAttendanceSubmit.ts`
- `src/components/attendance/LongTermAbsenceModal.tsx` (new)
- `src/components/attendance/table/AttendanceDataTable.tsx`
- `src/components/attendance/table/useAttendanceRecords.ts`
- `src/pages/Attendance.tsx`
- `src/components/students/StudentDossier.tsx` (new)
- `src/pages/StudentDetail.tsx`
- `supabase/migrations/add_student_dossier_fields.sql` (new)
- `src/pages/Profile.tsx` (new)
- `src/App.tsx`
- `src/config/navigation.ts`
- `src/i18n/translations.ts`

---

## 2026-04-15 — Initial cleanup, UI fix, and documentation setup

**What:**
- Created `.claude/launch.json` with dev server configurations
- Set up Claude memory system
- Created `handoff.md` and `abdul.wiki`
- Removed debug `console.log` leaking admin nav items from `Sidebar.tsx`
- Removed dead/unused imports from `Sidebar.tsx`, `StudentSearch.tsx`, `TeacherMessages.tsx`
- Fixed `text-black` misuse → `text-muted-foreground` in dashboard components
- Fixed `DashboardStats.tsx` hardcoded stubs — replaced with real Supabase queries
- Implemented real data in `TodayStudents.tsx` and `RecentActivity.tsx`
- Deleted dead file `src/styles/enhanced-ui.css`
- Removed dead `.enhanced-*` CSS utility classes from `components.css`

**Why:**
- Previous UI changes introduced debug artifacts, hardcoded fake data, and visual inconsistencies
- Stub data in DashboardStats gives false metrics to admins

**Files changed:**
- `src/components/layouts/Sidebar.tsx`
- `src/components/teacher-portal/dashboard/StudentSearch.tsx`
- `src/pages/TeacherMessages.tsx`
- `src/components/teacher-portal/dashboard/TodayStudents.tsx`
- `src/components/teacher-portal/dashboard/RecentActivity.tsx`
- `src/components/teacher-portal/dashboard/QuickActions.tsx`
- `src/components/dashboard/DashboardStats.tsx`
- `src/styles/components.css`
- `src/styles/enhanced-ui.css` (deleted)
