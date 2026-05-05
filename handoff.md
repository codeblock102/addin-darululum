# Handoff Log — Darul Ulum Montreal

This file is **non-negotiable**. Every meaningful change must be logged here.

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
