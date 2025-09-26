# Dār Al‑Ulūm Madrassah Management System — Developer Guide

This document explains the application architecture, domain entities, database schema, data‑flow, routing, and a folder‑by‑folder breakdown to help developers contribute effectively.

## Architecture Overview

- Frontend: React 18 + TypeScript + Vite
- UI: shadcn‑ui (Radix), Tailwind CSS, Lucide icons, Framer Motion
- Data: Supabase client + TanStack Query for caching/sync
- Backend: Supabase (Postgres, Auth, RLS) + Edge Functions
- Schedulers: `pg_cron` for daily progress emails

High‑level flow:
1) Users authenticate via Supabase Auth. 2) Profile and role are loaded from `profiles`/role tables. 3) Pages/components read/write via Supabase; React Query caches. 4) Edge functions handle administrative and scheduled tasks.

## Domain Entities (What each entity does)

- madrassahs
  - Represents a school location/branch
  - Key fields: `id`, `name`, `location`, `section[]`
  - Linked by: `profiles.madrassah_id`, `students.madrassah_id`

- profiles
  - Auth‑linked user profile (admin/teacher/parent)
  - Key fields: `id`, `email`, `name`, `role`, `madrassah_id`, `capabilities` (JSON)
  - Used for: RBAC, ownership of classes, teacher assignments, parent linking

- students
  - Student record with demographics and guardians
  - Key fields: `id`, `name`, `status`, `current_juz`, address fields, `guardian_name`, `guardian_email`, `madrassah_id`
  - Related to: `attendance`, `progress`, `sabaq_para`, `juz_revisions`, `parent_children`

- classes
  - A scheduled class with optional teacher assignment
  - Key fields: `id`, `name`, `time_slots` (JSON), `days_of_week` (string[]), `teacher_id`
  - Related to: `attendance` (attendance taken per class), `profiles` (teacher)

- attendance
  - Daily attendance entries per student (and optionally per class)
  - Key fields: `id`, `date`, `status` (present/absent/late), `class_id`, `student_id`, `late_reason`, `notes`

- progress
  - Quran lesson entries (Hifz/Nazirah/Qaida)
  - Key fields: `id`, `date`, `lesson_type`, `current_juz`, `current_surah`, `start_ayat`, `end_ayat`, `pages_memorized`, `verses_memorized`, `memorization_quality`, `teacher_notes`

- sabaq_para
  - Tracking sabaq‑para progress/quality per juz
  - Key fields: `id`, `juz_number`, `quality_rating`, `quarters_revised`, `student_id`, `teacher_notes`

- juz_revisions
  - Dhor book: revision entries by juz/quarter
  - Key fields: `id`, `revision_date`, `juz_number`, `quarter_start`, `quarters_covered`, `memorization_quality`, `teacher_notes`, `dhor_slot`, `student_id`

- roles, role_permissions
  - Role model and granular permissions
  - Used to shape `capabilities` and UI access in combination with RLS

- parent_children
  - Map between a parent profile and one/many student(s)
  - Key fields: `parent_id` (profile.id), `student_id`, `student_ids[]`

- students_teachers
  - Association of students to teachers
  - Key fields: `teacher_id` (profile.id), `student_name` (denormalized), `active`

- surah, juz
  - Reference data for Quran structure used in validations and UIs

Enums:
- `attendance_status`: present | absent | late
- `student_status`: active | inactive
- `lesson_type`: hifz | nazirah | qaida
- `quality_rating`: excellent | good | average | needsWork | horrible

Functions:
- `call_edge_daily_report()`: server helper to trigger email function

## Database Schema (Relationships)

- profiles —(many)→ classes (via `classes.teacher_id`)
- profiles —(many)→ parent_children (via `parent_children.parent_id`)
- students —(many)→ attendance (via `attendance.student_id`)
- students —(many)→ progress (via `progress.student_id`)
- students —(many)→ sabaq_para (via `sabaq_para.student_id`)
- students —(many)→ juz_revisions (via `juz_revisions.student_id`)
- classes —(many)→ attendance (via `attendance.class_id`)
- madrassahs —(one)→ profiles and students (via `madrassah_id`)

Migrations are in `supabase/migrations`. Seed data is in `supabase/seed.sql` and `supabase/sample-madrassahs.sql`.

## Routing and Pages (What each page does)

Top‑level routes are in `src/pages` and wired by `react-router-dom`. Primary routes (see `src/config/navigation.ts`):
- `/dashboard`: overview for admin/teacher
- `/students`, `/teachers`, `/classes`: management UIs
- `/progress-book`, `/progress`: progress tables and entry dialogs
- `/attendance`: attendance forms and history
- `/settings`: system configuration (admin)
- Parent routes: `/parent`, `/parent/progress`, `/parent/attendance`, `/parent/academics`
- Admin pages: `/admin/*` for advanced tools (bulk import, teacher schedules, database seeding, role setup, parent accounts)

Each page composes domain components from `src/components/**` and uses hooks under `src/hooks/**` for data access.

## Folder‑by‑Folder Guide (Responsibilities)

- src/components/admin
  - Admin dashboards, settings UI, admin creator, teacher accounts management, reporting, messaging, and email schedule manager

- src/components/attendance
  - Attendance entry forms, filters, tables; form schemas and table subcomponents

- src/components/classes
  - Class dialogs, lists, validation, and hooks for create/update/delete

- src/components/dhor-book
  - Dhor book grid and forms for revision tracking; helpers for juz coverage

- src/components/progress and src/components/student-progress
  - Progress entry dialog, monthly stats, charts, export options, student overviews

- src/components/teacher-portal
  - Teacher dashboard, analytics, assignments, attendance, schedule, messaging

- src/components/shared and src/components/ui
  - Shared UI (avatars, floating buttons, nav menus) and shadcn components

- src/contexts
  - `AuthContext.tsx` provides session state, sign‑out, and refresh
  - `I18nContext.tsx` (if present) provides localization

- src/hooks
  - Data/role helpers: `useRBAC`, `useUserRole`, `useSettings`, `useTeacher*`, realtime hooks, analytics hooks, toasts, mobile detection

- src/integrations/supabase
  - `client.ts` (typed client), `types.ts` (DB schema types)

- src/config
  - `navigation.ts` defines role‑specific sidebars
  - `defaultSettings.ts` initial app settings

- src/lib and src/utils
  - Constants, variants, small utilities, Quran mapping/validation, CSV/export helpers, account creation scripts

- src/pages
  - Route components mapped directly to URLs (admin, attendance, classes, dashboard, parents, settings, students/teachers, etc.)

- supabase/functions
  - Edge functions:
    - `create-admin`, `delete-admin`, `admin-update-password`: admin lifecycle
    - `create-parent`, `purge-parents-students`: parent/child management ops
    - `daily-progress-email`, `admin-send-email`, `attendance-absence-email`: email workflows (scheduled and on‑demand)
    - `teacher_schedule_pdf`: PDF generation for teacher schedules
    - `dhor_book_utils`: utilities supporting dhor book operations

- supabase/migrations
  - SQL migrations including tables, RLS policies, and `pg_cron` schedules

## Data Flow

- Auth: Supabase Auth; `AuthProvider` loads and watches session
- RBAC: `profiles.role` + `roles/role_permissions` + profile `capabilities`
- Data access: Supabase client in hooks/components; React Query for caching
- RLS: enforced at database level using user/role context and `madrassah_id`

## Local Development

1) Install and run:
```bash
npm i
npm run dev
```
2) Configure environment:
- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Supabase project secrets: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`
3) Apply migrations and (optionally) seed:
```bash
supabase db push
```

## Coding Conventions

- TypeScript everywhere; prefer explicit types on public APIs and hooks
- React Query for async data; avoid redundant state
- Keep functions small, descriptive names; early returns; meaningful error handling
- UI components: composition over inheritance; match shadcn/Radix patterns

## Contributing

- Branch from `dev`; open PRs with clear descriptions
- Ensure lint passes: `npm run lint`
- Update docs when changing data models or routes
- Avoid committing secrets; use env/secret managers

## License

MIT unless otherwise specified.

---

## In‑Depth Developer Reference

### 1) Entity Deep Dive (Columns and Semantics)

The following describes the core database tables. Types are derived from `src/integrations/supabase/types.ts`. Always check migrations for authoritative definitions and RLS.

1. madrassahs
   - id: uuid (PK)
   - name: text — display name of the madrassah
   - location: text — city/region
   - section: text[] — e.g. ["Boys", "Girls"]
   - admin_id: uuid (nullable) — profile id of the main admin (if used)

2. profiles
   - id: uuid (PK) — matches auth user id
   - email: text
   - name: text
   - phone: text
   - role: text — e.g. "admin" | "teacher" | "parent" (UI uses this with capabilities)
   - madrassah_id: uuid — foreign key to madrassahs.id
   - section: text — e.g. "Boys"
   - subject: text — optional academic subject specialization
   - capabilities: jsonb — fine‑grained permission flags
   - created_at: timestamptz

3. students
   - id: uuid (PK)
   - name: text
   - status: enum student_status — "active" | "inactive"
   - current_juz: int
   - completed_juz: int[] — array of completed juz numbers
   - date_of_birth: date
   - enrollment_date: date
   - guardian_name: text
   - guardian_email: text
   - guardian_contact: text (phone)
   - madrassah_id: uuid
   - section: text — e.g. "Boys" | "Girls"
   - gender: text (if used)
   - grade: text (if used)
   - address fields: street, city, province, postal_code
   - created_at: timestamptz

4. classes
   - id: uuid (PK)
   - name: text
   - description: text
   - capacity: int
   - current_students: int
   - days_of_week: text[] — e.g. ["Mon", "Wed", "Fri"]
   - time_slots: json[] — structured schedule info ({ day, start, end })
   - room: text
   - status: text — e.g. "active" | "archived"
   - teacher_id: uuid → profiles.id (FK)
   - created_at: timestamptz

5. attendance
   - id: uuid (PK)
   - date: date — attendance day
   - time: text — optional time string
   - status: text enum attendance_status — "present" | "absent" | "late"
   - class_id: uuid → classes.id (FK)
   - student_id: uuid → students.id (FK)
   - late_reason: text
   - notes: text
   - created_at: timestamptz

6. progress
   - id: uuid (PK)
   - date: date
   - lesson_type: enum lesson_type — "hifz" | "nazirah" | "qaida"
   - current_juz: int
   - current_surah: int — surah number
   - start_ayat: int — starting ayah number
   - end_ayat: int — ending ayah number
   - pages_memorized: int
   - verses_memorized: int
   - memorization_quality: enum quality_rating — "excellent" | "good" | "average" | "needsWork" | "horrible"
   - teacher_notes: text
   - notes: text
   - last_completed_surah: text
   - last_revision_date: date
   - revision_status: text
   - qaida_lesson: text
   - completed_juz: int[]
   - student_id: uuid → students.id (FK)
   - created_at: timestamptz

7. sabaq_para
   - id: uuid (PK)
   - student_id: uuid → students.id (FK)
   - juz_number: int
   - sabaq_para_juz: int (optional)
   - sabaq_para_pages: int (optional)
   - quality_rating: enum quality_rating
   - quarters_revised: enum quarter_revised — 1st_quarter | 2_quarters | 3_quarters | 4_quarters
   - revision_date: date
   - teacher_notes: text
   - created_at: timestamptz

8. juz_revisions
   - id: uuid (PK)
   - student_id: uuid → students.id (FK)
   - revision_date: date
   - juz_number: int
   - quarter_start: int — 1..4
   - quarters_covered: int — number of quarters covered in this session
   - memorization_quality: enum quality_rating
   - dhor_slot: int — optional slot number for scheduling
   - teacher_notes: text
   - created_at: timestamptz

9. roles
   - id: uuid (PK)
   - name: text — "admin" | "teacher" | "parent" (if used)
   - created_at, updated_at: timestamptz

10. role_permissions
   - id: uuid (PK)
   - role_id: uuid → roles.id (FK)
   - permission: enum role_permission — e.g. view_reports, manage_students, manage_classes, etc.
   - created_at: timestamptz

11. parent_children
   - id: uuid (PK)
   - parent_id: uuid → profiles.id (FK)
   - student_id: uuid → students.id (FK)
   - student_ids: uuid[] (optional fan‑out)
   - created_at: timestamptz

12. students_teachers
   - id: uuid (PK)
   - teacher_id: uuid → profiles.id (FK)
   - student_name: text (denormalized for convenience)
   - assigned_date: date
   - active: boolean
   - created_at: timestamptz

13. reference data
   - surah (id, name, surah_number, total_ayat)
   - juz (id, juz_number, surah_list)

Enums
- attendance_status, mastery_level, quality_rating, quarter_revised, role_permission, student_status, lesson_type, user_role

Notes
- Most content is guarded by RLS; see migrations for policies.
- Profile `capabilities` allows feature‑flagging at the user level beyond role.

### 2) Relationship Diagram (Conceptual)

Plain text ER description:
- profiles (1) — (many) classes via classes.teacher_id
- profiles (1) — (many) parent_children via parent_children.parent_id
- madrassahs (1) — (many) profiles via profiles.madrassah_id
- madrassahs (1) — (many) students via students.madrassah_id
- classes (1) — (many) attendance via attendance.class_id
- students (1) — (many) attendance via attendance.student_id
- students (1) — (many) progress via progress.student_id
- students (1) — (many) sabaq_para via sabaq_para.student_id
- students (1) — (many) juz_revisions via juz_revisions.student_id

### 3) Routing Map (Pages to URLs)

- `/` → `src/pages/Index.tsx`
- `/auth` → `src/pages/Auth.tsx`
- `/dashboard` → `src/pages/Dashboard.tsx`
- `/students` → `src/pages/Students.tsx`
- `/students/:id` → `src/pages/StudentDetail.tsx`
- `/student-progress` → `src/pages/StudentProgress.tsx`
- `/teachers` → `src/pages/Teachers.tsx`
- `/teacher-accounts` → `src/pages/TeacherAccounts.tsx`
- `/classes` → `src/pages/Classes.tsx`
- `/attendance` → `src/pages/Attendance.tsx`
- `/progress` → `src/pages/Progress.tsx`
- `/progress-book` → `src/pages/ProgressBook.tsx`
- `/teacher-schedule` → `src/pages/TeacherSchedule.tsx`
- `/preferences` → `src/pages/Preferences.tsx`
- `/settings` → `src/pages/Settings.tsx`
- `/create-demo-account` → `src/pages/CreateDemoAccount.tsx`
- `/create-teacher-profile` → `src/pages/CreateTeacherProfileForTestAccount.tsx`
- `/reset-password` → `src/pages/ResetPassword.tsx`
- `/parent` → `src/pages/Parent.tsx`
- `/parent/progress` → `src/pages/ParentProgress.tsx`
- `/parent/attendance` → `src/pages/ParentAttendance.tsx`
- `/parent/academics` → `src/pages/ParentAcademics.tsx`
- `/admin/activity` → `src/pages/admin/Activity.tsx`
- `/admin/parent-accounts` → `src/pages/admin/ParentAccounts.tsx`
- `/admin/bulk-student-import` → `src/pages/admin/BulkStudentImport.tsx`
- `/admin/teacher-schedules` → `src/pages/admin/TeacherSchedules.tsx`
- `/admin/database-seeder` → `src/pages/admin/DatabaseSeeder.tsx`
- `/admin/manual-role-setup` → `src/pages/admin/ManualRoleSetup.tsx`
- `/admin/setup-admin` → `src/pages/admin/SetupAdmin.tsx`
- `*` → `src/pages/NotFound.tsx`

Sidebar items for each role are defined in `src/config/navigation.ts`.

### 4) Folder‑by‑Folder Responsibilities

- `src/components/admin`
  - `DevAdminCreator.tsx`: Create admin accounts and link to madrassahs
  - `EmailScheduleManager.tsx`: Cron status, trigger test email, activity log
  - `reports/ProgressReportGenerator.tsx`: Export progress PDFs/CSVs
  - `settings/*`: System settings (appearance, localization, integrations, security, notifications, data management)
  - `teacher-accounts/*`: Create/approve/manage teacher accounts
  - `messaging/*`: Admin messaging hub (compose, list, reply)
  - `UserDialog.tsx`, `user/*`: Admin user management dialogs, fields, validation

- `src/components/attendance`
  - `AttendanceForm.tsx`: Create/update attendance entries
  - `AttendanceRecordsTable.tsx` / `AttendanceTable.tsx`: Historical views
  - `AttendanceCutoffSettings.tsx`: Late cutoff configuration (UI)
  - `form/*`, `table/*`: Field groups and table components

- `src/components/classes`
  - `ClassDialog.tsx`: CRUD dialog
  - `ClassList.tsx`: List with filters
  - `hooks/*`: `useClassSubmit`, `useDeleteClass`
  - `validation/classFormSchema.ts`: zod schema

- `src/components/dhor-book`
  - Grids, summaries, new entry dialog, validation, Quran data helpers

- `src/components/progress`
  - `NewProgressDialog.tsx`: Entry dialog
  - `ProgressTable.tsx`, `MonthlyProgress.tsx`, `RecentRevisions.tsx`, `ProgressStats.tsx`

- `src/components/student-progress`
  - Charts, overviews, exports, attendance stats, search

- `src/components/teacher-portal`
  - Dashboard, analytics, assignments, attendance, schedule, messaging, tabs

- `src/components/shared`
  - Floating quick‑entry buttons, nav menu, avatar

- `src/components/ui`
  - shadcn/radix components used across the app (buttons, inputs, dialogs, etc.)

- `src/contexts`
  - `AuthContext.tsx`: session, refresh, sign‑out
  - `I18nContext.tsx`: translations and language selection

- `src/hooks`
  - Data: `useSettings`, `useAnalyticsData`, `useLeaderboardData`
  - Realtime: `useRealtime*`
  - Role/Access: `useUserRole`, `useRBAC`
  - Teacher flows: `useTeacher*`
  - UX: `use-mobile`, `use-toast`, `use-theme`, `use-sidebar`, `use-form-field`

- `src/integrations/supabase`
  - `client.ts`: typed supabase client
  - `types.ts`: generated DB types and enums

- `src/lib`
  - `utils.ts`, `variants.ts`, `constants.ts`, `reactPatches.tsx`, `stripLovId.tsx`

- `src/utils`
  - Account and CSV/export helpers, Quran mapping/validation, seed/promote scripts

- `supabase/functions`
  - Edge functions listed in the next section

### 5) Supabase Edge Functions and Workflows

All located under `supabase/functions/*`:

- create-admin
  - Purpose: Create admin user, confirm email, set profile and link to madrassah
  - Endpoints: `index.ts` (POST)
  - Auth: Service role (server‑side)

- delete-admin
  - Purpose: Remove admin accounts, clean up profiles
  - Endpoints: `index.ts` (POST)

- admin-update-password
  - Purpose: Reset or update admin password
  - Endpoints: `index.ts` (POST)

- admin-send-email
  - Purpose: Send admin‑initiated emails (e.g., notices)
  - Endpoints: `index.ts` (POST)

- create-parent
  - Purpose: Create parent profile and link to child(ren)
  - Endpoints: `index.ts` (POST)

- purge-parents-students
  - Purpose: Clean unsafe/duplicated parent/child links in dev or maintenance
  - Endpoints: `index.ts` (POST)

- daily-progress-email
  - Purpose: Scheduled digest to guardians at 4:30 PM EST (via `pg_cron`)
  - Endpoints: `index.ts` (POST)
  - See `docs/EMAIL_SCHEDULING_SETUP.md`

- attendance-absence-email
  - Purpose: Send absence notifications to guardians
  - Endpoints: `index.ts` (POST)

- teacher_schedule_pdf
  - Purpose: Render teacher weekly schedules to PDF
  - Endpoints: `index.ts` (POST)

- dhor_book_utils
  - Purpose: Helpers for Dhor book computations (e.g., summaries)
  - Endpoints: `index.ts` (POST)

Shared utilities for CORS are in `supabase/functions/_shared/cors.ts` and some features have local `cors.ts` files.

### 6) RBAC and RLS (Security Model)

Conceptual rules (verify in migrations):
- Admins: Full access to rows where `madrassah_id` matches their profile
- Teachers: Access to students they teach; attendance/progress for those students
- Parents: Read‑only access to students linked via `parent_children`
- System: Service role functions can operate with elevated privileges for provisioning and scheduled jobs.

Frontend enforcement:
- UI hides actions the user lacks capability to perform
- `useRBAC` and `useUserRole` shape menus and button visibility

Database enforcement:
- RLS policies restrict SELECT/INSERT/UPDATE/DELETE based on user id and role context
- Use Postgres functions or views where necessary to pre‑filter data

### 7) Data Access Patterns (Examples)

Example: Fetch a student’s latest progress entries (React Query + Supabase):
```tsx
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

export function useStudentProgress(studentId: string) {
  return useQuery({
    queryKey: ["progress", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress")
        .select("*")
        .eq("student_id", studentId)
        .order("date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}
```

Example: Insert attendance entry:
```tsx
async function markAttendance(studentId: string, classId: string, status: "present" | "absent" | "late") {
  const { error } = await supabase.from("attendance").insert({
    student_id: studentId,
    class_id: classId,
    date: new Date().toISOString().slice(0, 10),
    status,
  });
  if (error) throw error;
}
```

Example: Server‑side trigger for daily email (service role): see `docs/EMAIL_SCHEDULING_SETUP.md`.

### 8) Hooks Inventory (Purpose and Usage)

- `use-auth.ts`: helpers related to auth state; pairs with `AuthContext.tsx`
- `use-form-field.ts`: ergonomic form field binding
- `use-mobile.tsx`: responsive behavior for mobile breakpoints
- `use-sidebar.ts`: sidebar open/close and selection state
- `use-theme.ts`: theme switching via next-themes
- `use-toast.ts`: toast helper over Radix/sonner
- `useAnalyticsData.ts`: aggregate analytics for dashboards
- `useDashboardNavigation.ts`: tabbed dashboard routing helpers
- `useLeaderboardData.ts`: leaderboard data fetch and derive
- `useParentChildren.ts`: manage parent to student links
- `useRBAC.ts`: role capability checks and permission helpers
- `useRealtimeAdminMessages.ts`: subscribe to admin messaging channels
- `useRealtimeAnalytics.ts`: realtime events for analytics
- `useRealtimeLeaderboard.ts`: realtime leaderboard updates
- `useRealtimeMessages.ts`: general realtime messaging
- `useSettings.ts`: read/write application settings
- `useTeacherAccounts.ts`: manage teacher account lifecycle
- `useTeacherClasses.ts`: classes for a teacher and schedule
- `useTeacherMessages.ts`: messaging hooks for teachers
- `useTeacherStatus.ts`: present/away/busy status state
- `useTeacherSummary.ts`: summary KPIs for teacher dashboards
- `useUserRole.ts`: derive role and capabilities from session/profile

### 9) Types Inventory

Located in `src/types/*`:
- `adminUser.ts`: admin profile types
- `assignment.ts`: teacher assignment models
- `attendance-form.ts`, `attendance-record.ts`, `attendance.ts`: attendance models
- `auth.ts`: auth context and types
- `dhor-book.ts`: revision models
- `form.ts`: form value models
- `leaderboard.ts`: leaderboard types
- `navigation.ts`: nav item types
- `progress.ts`: progress entities
- `revision.ts`: dhor revisions
- `settings.ts`: app settings shape
- `sidebar.ts`: sidebar configuration
- `supabase.ts`: extended types for supabase interactions
- `teacher.ts`: teacher profile models
- `theme.ts`: theme settings
- `user.ts`: base user models

### 10) Utilities and Libraries

- `src/utils` highlights:
  - `adminUtils.ts`: helpers for admin flows
  - `createParentAccount.ts`, `createTeacherAccount.ts`: scripted account creation
  - `csv.ts`, `exportUtils.ts`: export helpers
  - `dateUtils.ts`: formatting and calculations
  - `juzAyahMapping.ts`, `juzMetadata.ts`: Quran structure data
  - `quranPageCalculation.ts`, `quranValidation.ts`: domain validation/calculation
  - `promoteToAdmin.ts`: elevate a user to admin
  - `seedDatabase.ts`: seed helpers
  - `roleUtils.ts`: role mapping helpers
  - `stringUtils.ts`: string formatting

- `src/lib` highlights:
  - `utils.ts`: shared utils
  - `variants.ts`: class variance helpers
  - `constants.ts`: app constants
  - `reactPatches.tsx`: React interop/helpers
  - `stripLovId.tsx`: helper used when importing from Lovable

### 11) UI Patterns and Components

- UI follows shadcn‑ui conventions; components under `src/components/ui` wrap Radix primitives with Tailwind styling
- Prefer composition via `asChild` pattern; use `class-variance-authority` for variants
- Keep forms using `react-hook-form` + zod resolvers
- Dialogs use Radix Dialog; pages use layout components from `src/components/layouts`

### 12) State, Caching, and Realtime

- Primary server state managed with React Query
- Keys scoped by entity and id (e.g., ["progress", studentId])
- Realtime subscriptions used for admin messages/analytics/leaderboard
- Avoid duplicating React state for server data; use selectors and memoization for derived data

### 13) Error Handling and UX

- Surfaces user‑visible errors via toasts; logs developer details to console
- Use guard clauses and return early
- Favor typed errors where possible; never swallow errors silently

### 14) Performance Considerations

- Paginate and limit queries (e.g., limit 50)
- Memoize heavy computations and lists
- Defer non‑critical data until component is visible
- Use `React.Suspense` patterns judiciously (opt‑in)

### 15) Testing (Guidance)

- Prefer testing hooks and utility functions in isolation
- For pages, test the data flow with mocked Supabase client
- Snapshot test key UI components with fixed props

### 16) Troubleshooting

- Cannot view data after login
  - Ensure profile row exists for the auth user
  - Check RLS policies and role/capability

- Attendance insert failing
  - Confirm `class_id` and `student_id` exist and are accessible under RLS

- Progress not visible to parent
  - Check `parent_children` mapping and email verification

- Daily emails not sending
  - See `docs/EMAIL_SCHEDULING_SETUP.md`; verify cron, env, and logs table

### 17) FAQ

- Why Supabase?
  - Managed Postgres with Auth, storage, and edge functions simplifies stack and enables RLS

- Can we add custom roles?
  - Yes; extend `roles` and `role_permissions`, update UI capability checks

- How to add a new entity?
  - Create migration, update `types.ts` via generator, add hooks and UI components, add RLS

### 18) Glossary

- Hifz: Quran memorization
- Nazirah: Recitation practice
- Dhor: Revision of memorized portions
- Sabaq: Daily new lesson
- Juz: One of 30 divisions of the Quran
- Surah/Ayah: Chapter/verse

### 19) Environment and Configuration

- Frontend
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

- Supabase project secrets (server)
  - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`

### 20) Contribution Workflow

1. Create a feature branch from `dev`
2. Implement changes with types and tests where appropriate
3. Run `npm run lint`
4. Update README/docs if schema or routes changed
5. Open a PR; describe schema changes and migrations

### 21) Example End‑to‑End Flows

Record daily progress (teacher):
1. Navigate to Teacher Dashboard → Progress Book
2. Open New Progress Dialog
3. Select student, lesson type, surah/juz/ayah, quality, and notes
4. Save; React Query invalidates and list refreshes

Take attendance (teacher):
1. Go to Attendance
2. Filter by class and date
3. Mark present/absent/late; add late reason
4. Save; entries visible in history and parent views

Create admin (developer/admin):
1. Use Admin Creator (UI) or call `create-admin` edge function
2. Assign madrassah; confirm profile
3. Share credentials securely

Daily email digest (system):
1. `pg_cron` triggers `daily-progress-email`
2. Function compiles last 24h progress per student with guardian email
3. Sends via Resend; logs results to `email_logs`

### 22) Notes for New Contributors

- Start by reading `src/README.md` and this document
- Explore `src/pages` to see routing and composition
- Review `src/integrations/supabase/types.ts` to understand the schema
- Check `supabase/functions` to learn backend workflows

---

End of developer reference.
