# Handoff Log — Darul Ulum Montreal

This file is **non-negotiable**. Every meaningful change must be logged here.

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
