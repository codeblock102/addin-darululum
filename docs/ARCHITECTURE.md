# Architecture — Dār Al-Ulūm Montréal Management System

## Project Summary

A full-stack Islamic school management platform for Dār Al-Ulūm Montréal. Administrators manage students, teachers, classes, and schedules; teachers record Quran memorization progress and attendance; parents have a read-only view of their child's data.

DUM operates two physical campuses under one madrassah record:
- **Saint-Laurent** — women's campus (`section = 'women'`)
- **Henri-Bourassa** — men's campus (`section = 'Henri-Bourassa'`)

Staff with `profiles.section` set are automatically scoped to their campus's students.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + TypeScript | UI rendering |
| Build | Vite 5 | Dev server and bundling |
| Routing | React Router v6 | Client-side navigation |
| Server state | TanStack React Query 5 | Data fetching, caching, invalidation |
| Backend | Supabase (Postgres + Auth + RLS) | Database, authentication, edge functions |
| UI | shadcn/ui + Radix + Tailwind CSS 3.4 | Accessible component library |
| Icons | Lucide React | Icon set |
| Animation | Framer Motion | Transitions and micro-interactions |
| Charts | Recharts | Data visualization |
| Calendar | FullCalendar (`@fullcalendar/react`) | Schedule views |
| Forms | react-hook-form + Zod | Form state and validation |
| Notifications | shadcn Toaster + Sonner | Toast notifications |
| Scheduling | `pg_cron` | Daily automated email digests |
| Email | Resend API | Transactional emails (attendance + progress) |

---

## Project Structure

```
src/
├── App.tsx                           # Root: routes and providers
├── main.tsx                          # Entry point
│
├── pages/                            # Route-level page components
│   ├── Index.tsx                     # Home (role-based redirect)
│   ├── Auth.tsx                      # Login page
│   ├── Dashboard.tsx                 # Admin/teacher dashboard
│   ├── Students.tsx                  # Student list (section-scoped for scoped staff)
│   ├── StudentDetail.tsx             # Student detail (tabs: Profile, Dossier, Health & IEP)
│   ├── Teachers.tsx                  # Teacher list + Staff Directory tab
│   ├── Classes.tsx                   # Class management
│   ├── Attendance.tsx                # Attendance management
│   ├── ProgressBook.tsx              # Dhor book / progress entries
│   ├── Profile.tsx                   # User profile settings (/profile)
│   ├── Settings.tsx                  # Admin settings
│   ├── Preferences.tsx               # Teacher preferences
│   ├── TeacherSchedule.tsx           # Teacher schedule view
│   ├── Parent.tsx                    # Parent dashboard
│   ├── ParentProgress.tsx
│   ├── ParentAttendance.tsx
│   ├── ParentAcademics.tsx
│   └── admin/                        # Admin-only utility pages
│       ├── Activity.tsx
│       ├── ParentAccounts.tsx
│       ├── BulkStudentImport.tsx
│       ├── TeacherSchedules.tsx
│       └── dev/                      # Dev/diagnostic tools (admin-gated)
│
├── components/
│   ├── layouts/
│   │   ├── DashboardLayout.tsx       # Outer shell — includes OnboardingModal
│   │   └── Sidebar.tsx               # Main navigation sidebar
│   │
│   ├── onboarding/
│   │   └── OnboardingModal.tsx       # First-login role-specific walkthrough
│   │
│   ├── auth/
│   │   └── ProtectedRoute.tsx        # Auth guard (requireAdmin/Teacher/Parent props)
│   │
│   ├── admin/
│   │   ├── AdminDashboard.tsx        # Welcome banner, stats, enrolment breakdown
│   │   ├── AdminStatsCards.tsx       # Stat card components
│   │   ├── messaging/                # Admin messaging hub
│   │   ├── settings/                 # Settings panels
│   │   └── teacher-accounts/         # Teacher account management
│   │
│   ├── students/
│   │   ├── StudentHealthIEP.tsx      # Health & IEP tab (inline editable)
│   │   └── StudentDossier.tsx        # Mozaïk-style dossier tab
│   │
│   ├── teachers/
│   │   └── StaffHRIS.tsx             # Staff Directory tab (searchable)
│   │
│   ├── attendance/
│   │   ├── AttendanceForm.tsx        # Single attendance entry (section auto-locks for scoped staff)
│   │   ├── LongTermAbsenceModal.tsx  # Multi-day absence date-range dialog
│   │   ├── AbsenceReasonSelect.tsx   # Mozaïk-style grouped reason dropdown
│   │   ├── form/
│   │   │   ├── AttendanceStatusRadioGroup.tsx  # Includes sick status
│   │   │   ├── BulkAttendanceGrid.tsx          # Bulk attendance (includes sick)
│   │   │   └── ReasonSelector.tsx
│   │   └── table/
│   │       ├── AttendanceDataTable.tsx
│   │       └── useAttendanceRecords.ts
│   │
│   ├── teacher-portal/               # Teacher dashboard, analytics, schedule, messaging
│   ├── dhor-book/                    # Progress book entry and classroom view
│   ├── classes/                      # Class CRUD dialog and list
│   ├── progress/                     # Progress tables, charts, stats
│   ├── student-progress/             # Student overview, exports
│   ├── shared/                       # Floating buttons, nav menu, notification bell
│   └── ui/
│       ├── status-badge.tsx          # Includes sick status (orange/thermometer)
│       └── ...                       # shadcn/Radix components
│
├── contexts/
│   ├── AuthContext.tsx               # Session state, sign-out, refresh
│   └── I18nContext.tsx               # Translations and language selection
│
├── hooks/                            # Custom hooks (see HOOKS.md)
│   ├── useStudentsQuery.ts           # Unified student fetch — applies section filter for scoped staff
│   └── ...
│
├── integrations/
│   └── supabase/
│       ├── client.ts                 # Typed Supabase client
│       └── types.ts                  # Generated DB types (includes sick in attendance_status)
│
├── types/
│   ├── attendance.ts                 # AttendanceStatus union (includes "sick")
│   ├── attendance-form.ts
│   └── ...
│
├── config/
│   └── navigation.ts                 # Role-specific sidebar definitions
│
└── utils/                            # Date, string, Quran mapping, CSV/export helpers

supabase/
├── functions/                        # Edge functions
│   ├── attendance-absence-email/     # Attendance notifications (redesigned HTML, v45)
│   ├── daily-progress-email/         # Daily digest emails (redesigned HTML, v55)
│   └── _shared/cors.ts
└── migrations/                       # SQL migrations
    ├── add_sick_attendance_status.sql
    ├── add_student_dossier_fields.sql
    └── seed_dum_schedules_v10.sql    # Run in SQL editor to populate schedules
```

---

## Authentication & Authorization Flow

```
User visits app
     │
     ▼
ProtectedRoute checks AuthContext
     │
     ├── Not authenticated → redirect to /auth
     │
     └── Authenticated
           │
           ▼
         useUserRole() queries profiles table
           │
           ├── role = "admin", section = null   → full student access
           ├── role = "admin", section = set    → students filtered to that section
           ├── role = "teacher", section = null → students in assigned classes
           ├── role = "teacher", section = set  → students in assigned classes, filtered to section
           └── role = "parent"                  → read-only child data via parent_children
```

- **AuthContext** (`src/contexts/AuthContext.tsx`): Wraps the app, listens to `supabase.auth.onAuthStateChange`, provides `user`, `session`, and `signOut`.
- **ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`): Redirects unauthenticated users to `/auth`. Accepts `requireAdmin`, `requireTeacher`, `requireParent` props. On timeout → redirects to `/auth` (no bypass button).
- **useRBAC** (`src/hooks/useRBAC.ts`): Returns `isAdmin`, `isTeacher`, `isParent`, and permission-check helpers.
- **useUserRole** (`src/hooks/useUserRole.ts`): Fetches the current user's role from the `profiles` table.
- **useStudentsQuery** (`src/hooks/useStudentsQuery.ts`): Unified student fetch hook — reads `profiles.section` and adds `.eq("section", section)` filter for any user with a section set.

---

## Database Schema

| Table | Purpose |
|---|---|
| `madrassahs` | School locations/branches |
| `profiles` | Auth-linked users (admin / teacher / parent) with role, section, capabilities, subject, grade, bio |
| `students` | Student records with demographics, guardian info, health fields, IEP fields, section |
| `classes` | Classes with JSONB `time_slots` for weekly schedules |
| `attendance` | Daily attendance — status: present \| absent \| late \| excused \| early_departure \| **sick** |
| `progress` | Quran lesson entries (Hifz / Nazirah / Qaida) |
| `sabaq_para` | Sabaq-para tracking per juz |
| `juz_revisions` | Dhor book — revision sessions per juz/quarter |
| `parent_children` | Parent ↔ student mapping |
| `parents` | Parent records with `student_ids` array |
| `roles / role_permissions` | RBAC model — granular permissions shaping `capabilities` JSONB |
| `communications` | Teacher ↔ admin messaging |
| `email_logs` | Daily digest send history |
| `app_settings` | Application-level configuration |
| `attendance_settings` | Per-madrassah cutoff time and last-sent-date for absence emails |
| `attendance_absence_notifications` | De-duplication log — one row per student/date to prevent duplicate sends |

### Key Enums
- `attendance_status`: present | absent | late | excused | early_departure | **sick**
- `student_status`: active | inactive
- `lesson_type`: hifz | nazirah | qaida
- `quality_rating`: excellent | good | average | needsWork | horrible

### Section Values (DUM)
| Value | Campus |
|---|---|
| `'women'` | Saint-Laurent — women's campus (all grades KG–Secondary) |
| `'Henri-Bourassa'` | Henri-Bourassa — men's campus |
| `null` | Unrestricted — sees all sections |

### time_slots JSONB format (classes table)
```json
{
  "days": ["monday", "wednesday"],
  "start_time": "09:00",
  "end_time": "09:45",
  "teacher_ids": ["uuid"],
  "subject": "Quran",
  "room": "Room 1"
}
```

---

## State Management

| Type | Tool | Usage |
|---|---|---|
| Server/async state | TanStack React Query 5 | All Supabase data fetching |
| Real-time updates | Supabase Realtime + Query invalidation | Messaging, leaderboard, analytics |
| Form state | react-hook-form + Zod | All forms |
| Local UI state | React `useState` | Tabs, toggles, modals |
| Auth state | React Context (AuthContext) | Current user session |
| Onboarding state | localStorage | `dum_onboarded_{userId}` — one-time flag |
| Theme | React Context (ThemeProvider) | Light/dark, persisted in localStorage |

---

## Key Patterns

### Data Fetching
All async data via TanStack Query `useQuery`. Query keys follow `["entity", id]` to allow targeted cache invalidation after mutations.

### Section-Scoped Access
`useStudentsQuery` reads `profiles.section` on every query. When non-null, it appends `.eq("section", section)` to the Supabase query. This applies to:
- `src/hooks/useStudentsQuery.ts` — all consumers of the shared hook
- `src/pages/Students.tsx` — inline admin query also applies the filter
- `src/components/attendance/AttendanceForm.tsx` — `loadAdminSections` effect; when section is set, `sectionFilter` is locked and the dropdown is hidden

### Mutations
`useMutation` or direct `supabase.from(...).upsert/insert/update` followed by `queryClient.invalidateQueries()`.

### Forms
`react-hook-form` + Zod (`zodResolver`). Schemas co-located with components or extracted to `*Schema.ts` files.

### i18n
All user-visible strings wrapped with `t("key", "fallback")` from `useI18n()`. Translation keys defined in `src/i18n/translations.ts`.

### RBAC
Database: RLS policies on all tables keyed to `auth.uid()` and `madrassah_id`.
Frontend: `useRBAC` and `useUserRole` gate UI elements and route access. Section filtering is additive — applied in the query layer on top of role-based access.

---

## Email System

### attendance-absence-email (v45)
Sends per-student attendance notifications to guardians. Triggered by teacher (manual, per class) or automated (scheduled, madrassah-wide after cutoff time).

**Design:** Gradient dark-green header with DUM logo → status banner (color-coded per status) → narrative message → CTA button.

Status colors: present=green (#059669), absent=red (#dc2626), late=amber (#d97706), excused=purple (#7c3aed), early_departure=orange (#ea580c), sick=cyan (#0891b2).

### daily-progress-email (v55)
Sends daily Quran progress + academic assignment digest to guardians, and a class-organized summary to admins. Triggered by `pg_cron` at 4:30 PM EST.

**Guardian email design:** Gradient header → student name band → Sabaq table (lesson/pages/quality/notes) → Academic Updates table → CTA button.

**Principal/admin email design:** Gradient header ("Principal Report") → class sections with top-student highlight + Sabaq table + assignments summary → report meta → CTA button.

---

## Real-time Subscriptions

| Hook | Table Watched | Purpose |
|---|---|---|
| `useRealtimeMessages` | `communications` | New inbox messages for teacher |
| `useRealtimeAdminMessages` | `communications` | New messages for admin |
| `useRealtimeLeaderboard` | `juz_mastery` | Live leaderboard updates |
| `useRealtimeAnalytics` | `progress` | Analytics data updates |

All hooks use `supabase.channel()` with `postgres_changes` and invalidate React Query caches on events.

---

## Security Notes

- No `localStorage` role bypass — role always resolved from live Supabase session
- No client-side `supabase.auth.admin.*` calls — admin operations are Edge Function-only
- No PII in `console.log` — logs scrubbed; only `console.error`/`console.warn` remain
- Explicit column selects on all sensitive queries (no `.select('*')` on profiles/students)
- Dev/diagnostic routes gated behind `requireAdmin`
- ProtectedRoute timeout → redirect to `/auth`, no bypass button
- Section-scoped access enforced at query layer (frontend) — DB-level RLS enforcement is additive
