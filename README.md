# Dār Al-Ulūm Montréal — Islamic Education Management System

A full-stack school management platform for Dār Al-Ulūm Montréal, built to manage students, teachers, attendance, Quran progress, class schedules, and parent communication.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui (Radix), Tailwind CSS 3.4, Lucide icons, Framer Motion |
| Data | TanStack React Query 5 + Supabase JS client |
| Backend | Supabase — Postgres, Auth, Row-Level Security, Edge Functions |
| Scheduling | `pg_cron` for automated daily email digests |
| Calendar | FullCalendar (`@fullcalendar/react`) |

---

## Features

### Core
- **Student management** — profiles, enrolment, status, section/grade, guardian contacts
- **Attendance** — daily mark/bulk mark per class; statuses: present, absent, late, excused, early departure, **sick**
- **Quran progress tracking** — Hifz, Nazirah, Qaida lessons; Dhor book (revision log); juz/surah/ayah-level detail
- **Class schedules** — weekly time slots seeded from Scheduling V10; teacher assignments per period
- **Teacher portal** — dashboard, analytics, assignments, schedule view, messaging
- **Parent portal** — read-only access to child's progress, attendance, and academics
- **Admin tools** — bulk student import, parent account provisioning, role setup, database seeder

### Recently Added (Phase 1 + Phase 2 — May 2026)
| Feature | Where to find it |
|---|---|
| **Admin Reports** | `/admin/reports` — 5 reports (attendance by student/section, full roster, students by section, hifz progress) with CSV export |
| **Communication Templates** | `/admin/communication-templates` — preset Islamic message templates, CRUD |
| **Parent Weekly Agenda** | `/parent/agenda` — child's weekly class schedule grid with school events overlay |
| **Hifz Report Card** | `/students/:id/report-card` — printable per-student Quran memorization report (Cmd+P → PDF) |
| **Student Photo Upload** | StudentDialog/Detail/Popover — click avatar to upload, public Supabase bucket |
| **Parent Assignment Submission** | `/parent/academics` — parents upload completed work + note |
| **Full Contact Popover** | Primary + secondary + emergency contact + assigned teacher |
| **Teacher Visibility for Parents** | Student profile + ParentProgress show child's teacher name |
| **Sentry Error Monitoring** | `src/lib/sentry.ts` — set `VITE_SENTRY_DSN` to enable |
| **Vitest Critical-Path Tests** | `npm test` — ParentEditDialog, TeacherEditDialog, Reports CSV |
| **Section-scoped access** | Teachers/admins with `profiles.section` only see matching students |
| **Email redesign** | `attendance-absence-email` + `daily-progress-email` use gradient headers |
| **Guided onboarding** | Role-specific 5-step modal on first login |
| **Admin dashboard stats** | `/dashboard` — Today Absent, Unmarked Today, Enrolment breakdown, Attendance Today card |
| **Admin "View As" proxy** | Eye icon on Teachers/Parent Accounts — impersonate with amber banner |
| **Admin password reset** | TeacherAccountActions dropdown → Send Password Reset Email |
| **Admin edit teacher/parent** | Pencil button on Teachers + Parent Accounts |
| **Health & IEP tab** | `/students/:id` → Health & IEP tab |
| **Staff HRIS directory** | `/teachers` → Staff Directory tab |
| **Sick attendance status** | Attendance form — "Sick" with thermometer icon |
| **Multi-Day Absence Modal** | Categorized reasons (Family/Health/Legal/Other) |
| **Sortable table headers** | Students, Teachers, Parent Accounts |
| **Teacher schedules seed** | `supabase/migrations/seed_dum_schedules_v10.sql` |

---

## Domain Entities

### madrassahs
School location/branch. Key fields: `id`, `name`, `location`, `section[]`.

### profiles
Auth-linked user (admin / teacher / parent). Key fields: `id`, `email`, `name`, `role`, `madrassah_id`, `section`, `capabilities` (JSONB), `subject`, `grade`, `bio`, `phone`.

> **`section` field:** When set on a teacher or admin profile, restricts that user's student visibility to only students with the matching `section` value. Used to scope DUM staff to their location (e.g. `'women'` = Saint-Laurent, `'Henri-Bourassa'` = men's campus).

### students
Student record. Key fields: `id`, `name`, `status`, `current_juz`, `guardian_name`, `guardian_email`, `guardian_contact`, `section`, `grade`, `date_of_birth`, `madrassah_id`.  
Extended fields (health/IEP): `health_card_number`, `medical_condition`, `health_notes`, `has_iep`, `iep_accommodations`.

### classes
Scheduled class. Key fields: `id`, `name`, `time_slots` (JSONB array), `days_of_week`, `teacher_id`.  
`time_slots` format: `{ days: string[], start_time: string, end_time: string, teacher_ids: string[], subject: string, room: string }`.

### attendance
Daily attendance per student. Key fields: `id`, `date`, `status` (present | absent | late | excused | early_departure | **sick**), `class_id`, `student_id`, `late_reason`, `notes`.

### progress
Quran lesson entries. Key fields: `id`, `date`, `lesson_type` (hifz | nazirah | qaida), `current_juz`, `current_surah`, `start_ayat`, `end_ayat`, `memorization_quality`, `teacher_notes`.

### sabaq_para
Sabaq-para tracking per juz. Key fields: `id`, `student_id`, `juz_number`, `quality_rating`, `quarters_revised`, `revision_date`.

### juz_revisions
Dhor book — revision sessions. Key fields: `id`, `student_id`, `revision_date`, `juz_number`, `quarter_start`, `quarters_covered`, `memorization_quality`, `dhor_slot`.

### parent_children
Parent ↔ student mapping. Key fields: `parent_id`, `student_id`.

### roles
RBAC model. The `role` field on `profiles` (admin / teacher / parent) drives `capabilities` JSONB and UI visibility via `useRBAC`. The legacy `role_permissions` table was dropped on 2026-05-11 (unused, replaced by hardcoded `useRBAC` rules).

---

## Database Schema (Relationships)

```
madrassahs ──< profiles (via madrassah_id)
madrassahs ──< students (via madrassah_id)
profiles   ──< classes  (via teacher_id)
profiles   ──< parent_children (via parent_id)
students   ──< attendance     (via student_id)
students   ──< progress       (via student_id)
students   ──< sabaq_para     (via student_id)
students   ──< juz_revisions  (via student_id)
classes    ──< attendance     (via class_id)
```

Migrations live in `supabase/migrations/`. Seed files: `supabase/seed.sql`, `supabase/sample-madrassahs.sql`, `supabase/migrations/seed_dum_schedules_v10.sql`.

---

## Routing

| Route | Page |
|---|---|
| `/` | `src/pages/Index.tsx` |
| `/auth` | `src/pages/Auth.tsx` |
| `/dashboard` | `src/pages/Dashboard.tsx` |
| `/students` | `src/pages/Students.tsx` |
| `/students/:id` | `src/pages/StudentDetail.tsx` |
| `/teachers` | `src/pages/Teachers.tsx` |
| `/classes` | `src/pages/Classes.tsx` |
| `/attendance` | `src/pages/Attendance.tsx` |
| `/progress` | `src/pages/Progress.tsx` |
| `/progress-book` | `src/pages/ProgressBook.tsx` |
| `/student-progress` | `src/pages/StudentProgress.tsx` |
| `/teacher-schedule` | `src/pages/TeacherSchedule.tsx` |
| `/settings` | `src/pages/Settings.tsx` |
| `/preferences` | `src/pages/Preferences.tsx` |
| `/parent` | `src/pages/Parent.tsx` |
| `/parent/progress` | `src/pages/ParentProgress.tsx` |
| `/parent/attendance` | `src/pages/ParentAttendance.tsx` |
| `/parent/academics` | `src/pages/ParentAcademics.tsx` |
| `/admin/activity` | `src/pages/admin/Activity.tsx` |
| `/admin/parent-accounts` | `src/pages/admin/ParentAccounts.tsx` |
| `/admin/bulk-student-import` | `src/pages/admin/BulkStudentImport.tsx` |
| `/admin/teacher-schedules` | `src/pages/admin/TeacherSchedules.tsx` |
| `/admin/database-seeder` | `src/pages/admin/DatabaseSeeder.tsx` |
| `/admin/manual-role-setup` | `src/pages/admin/ManualRoleSetup.tsx` |

Role-specific sidebar items are defined in `src/config/navigation.ts`.

---

## Folder Structure

```
src/
  components/
    admin/          Admin dashboards, settings, teacher accounts, messaging, reports
    attendance/     Attendance forms, tables, bulk grid, status radio group
    classes/        Class CRUD dialog, list, hooks, validation
    dhor-book/      Dhor book grid, entry dialog, juz helpers
    layouts/        DashboardLayout (includes OnboardingModal)
    onboarding/     OnboardingModal — role-specific first-login walkthrough
    progress/       Progress entry, tables, monthly stats, charts
    student-progress/ Charts, overviews, exports
    students/       StudentHealthIEP — health/IEP tab component
    teacher-portal/ Teacher dashboard, analytics, schedule, messaging
    teachers/       StaffHRIS — staff directory component
    shared/         Floating buttons, nav menu, avatar
    ui/             shadcn/Radix components + status-badge (includes sick status)
  contexts/
    AuthContext.tsx       Session state, sign-out, refresh
    I18nContext.tsx       Translations and language selection
  hooks/            useRBAC, useUserRole, useSettings, useTeacher*, realtime hooks
  integrations/
    supabase/
      client.ts     Typed Supabase client
      types.ts      Generated DB types (includes sick in attendance_status)
  config/
    navigation.ts   Role-specific sidebar definitions
  types/
    attendance.ts   AttendanceStatus union (includes "sick")
    attendance-form.ts, attendance-record.ts, progress.ts, ...
  utils/            Date, string, Quran mapping, CSV/export, account creation helpers
  lib/              utils, variants, constants

supabase/
  functions/        Edge functions (see below)
  migrations/       SQL migrations + schedule seed
```

---

## Edge Functions

| Function | Purpose |
|---|---|
| `create-admin` | Create admin user, set profile, link to madrassah |
| `delete-admin` | Remove admin accounts and profiles |
| `admin-update-password` | Reset/update admin password |
| `admin-send-email` | Send admin-initiated emails |
| `create-parent` | Create parent profile and link to children |
| `purge-parents-students` | Clean duplicate parent/child links |
| `daily-progress-email` | Scheduled digest to guardians + principal summary at 4:30 PM EST via `pg_cron`; gradient green email design with per-student Sabaq tables and academic updates |
| `attendance-absence-email` | Absence/attendance notifications to guardians; per-status color coding (present=green, absent=red, late=amber, excused=purple, early_departure=orange, sick=cyan) |
| `teacher_schedule_pdf` | Render teacher weekly schedules to PDF |
| `dhor_book_utils` | Dhor book computation helpers |

CORS shared utilities: `supabase/functions/_shared/cors.ts`.

---

## Security Model (RBAC + RLS)

- **Admin (unrestricted)** — full access to all students where `madrassah_id` matches; `profiles.section = null`
- **Admin (section-scoped)** — access limited to students where `students.section` matches `profiles.section`
- **Teacher (unrestricted)** — access to students in their assigned classes; attendance/progress for those students
- **Teacher (section-scoped)** — same as above, additionally filtered to `students.section = profiles.section`; attendance section dropdown auto-locks and hides
- **Parent** — read-only access to students linked via `parent_children`
- **Service role** — edge functions use service role key for provisioning and scheduled jobs

Frontend enforcement via `useRBAC`, `useUserRole`, and `useStudentsQuery`. Database enforcement via Postgres RLS policies (see migrations).

### Current DUM Staff Roles (as of 2026-05-06)

| Name | Role | Section | Access |
|---|---|---|---|
| Mufti Zain | admin | null | All students |
| Maimoona Ansari | admin | null | All students |
| Sr. Salma | teacher | women | Saint-Laurent students only |
| Ibrahim Toure | teacher | Henri-Bourassa | Henri-Bourassa students only |

---

## Local Development

```bash
npm install
npm run dev          # Vite dev server at http://localhost:8080
```

### Environment variables

**Frontend (`.env`):**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SENTRY_DSN=   # optional — Sentry frontend DSN; leave empty to disable error monitoring
```

**Supabase project secrets:**
```
RESEND_API_KEY=
RESEND_FROM_EMAIL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Apply migrations
```bash
supabase db push
```

### Seed teacher schedules
Run the contents of `supabase/migrations/seed_dum_schedules_v10.sql` in the **Supabase SQL editor**. This seeds all 12 class schedules (KG → Secondary 1 & 3) from the Scheduling V10 PDF, resolving teacher profiles by name at runtime.

---

## Coding Conventions

- TypeScript everywhere; explicit types on hooks and public APIs
- React Query for all async data; avoid local state for server data
- Forms: `react-hook-form` + `zod` resolvers
- UI: shadcn/Radix composition patterns; `class-variance-authority` for variants
- Keep functions small; early returns; meaningful error messages via `formatErrorMessage`
- i18n: wrap all user-visible strings with `t("key", "fallback")`

---

## Contribution Workflow

1. Branch from `dev`
2. Implement with types; run `npm run lint` before pushing
3. Update this README if routes or data models change
4. Open a PR with a clear description of schema changes and migrations
5. Never commit `.env` or secrets

---

## Glossary

| Term | Meaning |
|---|---|
| Hifz | Quran memorization |
| Nazirah | Recitation from the Mushaf |
| Dhor | Revision of already-memorized portions |
| Sabaq | Daily new lesson |
| Juz | One of 30 divisions of the Quran |
| Surah / Ayah | Chapter / verse |
| IEP | Individualized Education Plan |
| Section | Location/gender grouping — `'women'` = Saint-Laurent, `'Henri-Bourassa'` = men's campus |

---

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [User Guide](docs/USER_GUIDE.md)
- [Email Scheduling Setup](docs/EMAIL_SCHEDULING_SETUP.md)
- [Admin Creator Guide](docs/admin-creator-guide.md)
- [FAQ](docs/FAQ.md)
- [Glossary](docs/GLOSSARY.md)
- [Hooks Reference](docs/HOOKS.md)
- [Code Review Guide](docs/CODE_REVIEW_GUIDE.md)
