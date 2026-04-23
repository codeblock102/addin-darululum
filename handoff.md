# Handoff Log — Darul Ulum Montreal

This file is **non-negotiable**. Every meaningful change must be logged here.

---

## 2026-04-15 — Initial cleanup, UI fix, and documentation setup

**What:**
- Created `.claude/launch.json` with dev server configurations (vite dev on :5173, vite preview on :4173)
- Set up Claude memory system at `.claude/projects/…/memory/` with user, project, feedback, and handoff protocol notes
- Created `handoff.md` (this file) and `abdul.wiki` (living app documentation)
- Removed debug `console.log` leaking admin nav items from `Sidebar.tsx` (line 252)
- Removed dead/unused imports prefixed with `_` from `Sidebar.tsx`, `StudentSearch.tsx`, `TeacherMessages.tsx`
- Fixed `text-black` misuse → `text-muted-foreground` in dashboard components (TodayStudents, RecentActivity, QuickActions, StudentSearch)
- Fixed `DashboardStats.tsx` hardcoded stubs: `attendanceRate` always returned 92, `activeClasses` always returned 8 — replaced with real Supabase queries
- Removed fake hardcoded trend values from DashboardStats
- Implemented real data in `TodayStudents.tsx` — now fetches today's actual attendance
- Implemented real data in `RecentActivity.tsx` — now fetches recent progress entries
- Deleted dead file `src/styles/enhanced-ui.css` (was never imported)
- Removed dead `.enhanced-*` CSS utility classes from `components.css` (none were used in any component)

**Why:**
- Previous UI changes introduced debug artifacts, hardcoded fake data, and visual inconsistencies
- `text-black` on secondary/muted text looks harsh and breaks the design language
- Stub data in DashboardStats gives false metrics to admins — dangerous for trust
- `console.log` in Sidebar leaks navigation structure to any user with DevTools open

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
- Added `/profile` route to `App.tsx`; added Profile nav item to all three nav arrays (admin, teacher, parent) in `navigation.ts`; added `nav.profile` translation key in `translations.ts`

**Why:**
- DUM Application Feedback spec requires structured absence reasons matching Mozaïk Portal's category system
- Multi-day absence modal avoids teachers entering long absences record by record
- Student dossier gives admins/teachers a Mozaïk-style identity card view with teacher assignments and contact info
- DB migration adds fields required by the master student CSV (Quebec permanent codes, financial aid tracking, homeschool document flags, etc.)
- Profile page was missing — users had no way to change their name or password in-app

**Files changed:**
- `src/components/attendance/AbsenceReasonSelect.tsx` (new)
- `src/components/attendance/form/ReasonSelector.tsx` (rewritten)
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

**Pending:**
- Run `add_student_dossier_fields.sql` migration against production Supabase
- Phase 2: Homeschooling Reports (Weekly, Learning Project, Mid-Term, Final) — extends Progress Book
- Phase 2: Assignments & Gradebook (new tables: assignments, submissions, grades)
- Phase 2: Calendar/Events page
- Dashboard: grade/location breakdown on admin stats; Today's schedule widget for teachers

---
