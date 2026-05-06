# Custom Hooks Reference

All custom hooks live in `src/hooks/`. This document describes their purpose, parameters, and return shapes.

---

## Authentication & Authorization

### `useAuth`
**File:** `src/hooks/use-auth.ts`

Provides access to `AuthContext` values.

**Returns:** `{ user, session, signOut }`

---

### `useUserRole`
**File:** `src/hooks/useUserRole.ts`

Fetches the current user's role from the `profiles` table.

**Returns:** `{ role: "admin" | "teacher" | "parent" | null, isLoading: boolean }`

---

### `useRBAC`
**File:** `src/hooks/useRBAC.ts`

Role-based access control helper. Derives `isAdmin`, `isTeacher`, `isParent`, `isAttendanceTaker` from the current session. Also exposes `hasCapability(cap)` for fine-grained feature access.

**Returns:**
```ts
{
  isAdmin: boolean;
  isTeacher: boolean;
  isParent: boolean;
  isAttendanceTaker: boolean;
  hasCapability: (cap: string) => boolean;
  isLoading: boolean;
}
```

---

## Data Hooks

### `useStudentsQuery`
**File:** `src/hooks/useStudentsQuery.ts`

Unified student fetch hook used across the app. Reads `profiles.section` and automatically applies `.eq("section", section)` when non-null, scoping the results to the user's campus.

**Parameters:** `{ activeOnly?: boolean }`

**Returns:** `{ students, userData, isLoading }`

> This is the canonical hook for fetching students. Both `Students.tsx` (inline query) and `AttendanceForm.tsx` apply the same section filter independently for their specific query shapes.

---

### `useTeacherSummary`
**File:** `src/hooks/useTeacherSummary.ts`

Summary KPIs for the teacher dashboard (student count, recent activity counts).

**Parameters:** `teacherId: string`

---

### `useTeacherAccounts`
**File:** `src/hooks/useTeacherAccounts.ts`

Fetches and manages teacher account data for the admin teacher accounts page.

---

### `useLeaderboardData`
**File:** `src/hooks/useLeaderboardData.ts`

Fetches student leaderboard rankings (Juz mastery).

**Parameters:** `teacherId?: string`

---

### `useSettings`
**File:** `src/hooks/useSettings.ts`

Reads and writes application settings from Supabase (`app_settings` table).

---

### `useTeacherStatus`
**File:** `src/hooks/useTeacherStatus.ts`

Fetches teacher active/away/busy status.

---

### `useParentChildren`
**File:** `src/hooks/useParentChildren.ts`

Fetches all students linked to the current parent via `parent_children`.

---

### `useTeacherClasses`
**File:** `src/hooks/useTeacherClasses.ts`

Fetches classes and schedule data for a teacher. Used in the schedule view.

---

### `useTeacherStudentMetrics`
**File:** `src/hooks/useTeacherStudentMetrics.ts`

Live at-risk scoring for teacher's students. Flags students with low attendance or no progress in 7+ days. Used in `DashboardOverview` alert banner.

---

## Real-time Hooks

### `useRealtimeMessages`
**File:** `src/hooks/useRealtimeMessages.ts`

Supabase real-time subscription for a teacher's message inbox. Invalidates `["teacher-inbox", teacherId]` and shows toast on new messages.

**Parameters:** `teacherId: string`

---

### `useRealtimeAdminMessages`
**File:** `src/hooks/useRealtimeAdminMessages.ts`

Real-time subscription for admin messages.

---

### `useRealtimeLeaderboard`
**File:** `src/hooks/useRealtimeLeaderboard.ts`

Real-time subscription on `juz_mastery` for live leaderboard updates.

---

## UI / UX Hooks

### `usePageHelp`
**File:** `src/hooks/usePageHelp.ts`

Reads and writes the Page Assistance setting from `localStorage`. Defaults to `true` (enabled). Used by `DailyPromptModal` and wired to the Settings → User Experience toggle.

**Returns:** `{ enabled: boolean, toggle: (value: boolean) => void }`

---

### `useToast`
**File:** `src/hooks/use-toast.ts`

shadcn/ui toast hook.

**Usage:**
```tsx
const { toast } = useToast();
toast({ title: "Saved", description: "Changes saved successfully." });
```

---

### `useMobile`
**File:** `src/hooks/use-mobile.tsx`

Returns `true` when viewport width is below the mobile breakpoint.

---

### `useSidebar`
**File:** `src/hooks/use-sidebar.ts`

Sidebar open/collapsed state management.

---

### `useTheme`
**File:** `src/hooks/use-theme.ts`

Current theme and `setTheme` function. Persisted in localStorage via `next-themes`.

---

## i18n

### `useI18n`
**File:** `src/contexts/I18nContext.tsx` (exported as hook)

Returns `{ t, locale, setLocale }`. `t(key, fallback)` looks up translation keys from `src/i18n/translations.ts`.

**Usage:**
```tsx
const { t } = useI18n();
<span>{t("pages.attendance.status.sick", "Sick")}</span>
```
