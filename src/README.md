# src/ — Source Directory Overview

This directory contains all frontend application code.

---

## Top-level files

| File | Purpose |
|---|---|
| `App.tsx` | Root component — all routes and providers wired here |
| `main.tsx` | Entry point — mounts `<App />` into the DOM |

---

## Folders

### `pages/`
Route-level components. Each file maps directly to a URL (see routing table in `README.md`). Notable:
- `StudentDetail.tsx` — 4-tab student page (Profile, Dossier, Health & IEP, Progress)
- `Students.tsx` — student list with section-scoped filtering for admins/teachers with `profiles.section` set
- `SchoolCalendar.tsx` — school calendar with monthly grid, event CRUD (admin), and upcoming sidebar
- `Teachers.tsx` — teacher list + Staff Directory tab
- `Attendance.tsx` — attendance management with bulk, multi-day, and single modes
- `Profile.tsx` — user profile settings (`/profile`)
- `admin/` — admin-only utility pages (parent accounts, bulk import, schedules, role setup)

### `components/`

| Subfolder | What it contains |
|---|---|
| `layouts/` | `DashboardLayout` (includes `OnboardingModal` + `DailyPromptModal`), `Sidebar` |
| `onboarding/` | `OnboardingModal` (first-login walkthrough), `DailyPromptModal` (once-per-day checklist) |
| `auth/` | `ProtectedRoute` — auth guard with role props |
| `admin/` | Admin dashboard, stats cards, settings panels, teacher accounts, messaging |
| `students/` | `StudentHealthIEP` (Health & IEP tab), `StudentDossier` (Mozaïk dossier tab) |
| `teachers/` | `StaffHRIS` (Staff Directory tab) |
| `attendance/` | Forms, bulk grid, absence reason select, multi-day modal, data table, `StudentContactPopover`. `AttendanceForm.tsx` auto-locks section and hides section dropdown for scoped staff |
| `teacher-portal/` | Teacher dashboard, schedule, messaging, student metrics |
| `dhor-book/` | Progress book entry form and classroom view |
| `classes/` | Class CRUD dialog, list, validation |
| `progress/` | Progress entry dialog, tables, monthly stats, charts |
| `student-progress/` | Student overview, exports |
| `shared/` | Notification bell, floating buttons, nav menu |
| `ui/` | shadcn/Radix components + `status-badge` (includes sick status) |

### `contexts/`
- `AuthContext.tsx` — session state, `signOut`, auth change listener
- `I18nContext.tsx` — `t(key, fallback)` translations and `locale` state

### `hooks/`
Custom React hooks. See [`docs/HOOKS.md`](../docs/HOOKS.md) for full reference. Key hook:
- `useStudentsQuery.ts` — unified student fetch; reads `profiles.section` and applies section filter when set

### `integrations/supabase/`
- `client.ts` — typed Supabase client instance
- `types.ts` — generated DB types (includes `sick` in `attendance_status`)

### `types/`
TypeScript type definitions:
- `attendance.ts` — `AttendanceStatus` union (includes `"sick"`)
- `attendance-form.ts` — form value shapes
- `progress.ts` — progress entity types
- `teacher.ts`, `user.ts`, `adminUser.ts` — profile types
- `navigation.ts` — sidebar nav item types
- `settings.ts` — app settings shape
- `supabase.ts` — extended Supabase interaction types

### `config/`
- `navigation.ts` — role-specific sidebar definitions (admin/teacher/parent arrays)
- `defaultSettings.ts` — initial application settings

### `utils/`
- `stringUtils.ts` — `getInitials()` and other string helpers
- `formatErrorMessage.ts` — extracts readable message from unknown errors
- `exportUtils.ts` — CSV/PDF export helpers
- `quranValidation.ts`, `quranPageCalculation.ts` — domain validation
- `juzAyahMapping.ts`, `juzMetadata.ts` — Qur'an structure data
- `createParentAccount.ts`, `createTeacherAccount.ts` — scripted account creation
- `roleUtils.ts` — role mapping helpers
- `adminUtils.ts` — admin-specific utilities

### `lib/`
- `utils.ts` — `cn()` class merge helper and other shared utils
- `variants.ts` — `class-variance-authority` variant helpers
- `constants.ts` — app-wide constants

### `i18n/`
- `translations.ts` — all translation strings (EN/FR)

### `services/analytics/`
- Live analytics aggregation service (see [`services/analytics/README.md`](services/analytics/README.md))
