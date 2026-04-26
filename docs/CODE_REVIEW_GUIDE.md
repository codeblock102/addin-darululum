# Code Review Guide — addin-darululum
**Branch:** `claude/refactor-analytics-metrics-mPyk2`
**Prepared for:** Nasib (reviewer)
**Date:** 2026-03-23

---

## How to Use This Document

This document lists every change made in this branch, grouped by category. For each section, the **"What to check"** bullet tells Nasib exactly what to verify during review. Changes are ordered from highest-risk (security) to lowest-risk (cleanup).

---

## 1. SECURITY FIXES (Highest Priority — Review Carefully)

### 1.1 localStorage Role Bypass Removed
**File:** `src/pages/Index.tsx`

**What was wrong:** The app read `localStorage.getItem('userRole')` on startup and used it to bypass the database role check. Anyone could open DevTools, type `localStorage.setItem('userRole', 'admin')`, and get admin access without a real admin account.

**What was fixed:** All `localStorage.getItem/setItem` calls for `userRole` were removed. The role is now always resolved from the authenticated session (Supabase auth metadata or a live DB query), with no shortcuts.

**What to check:**
- Open the app in a browser, open DevTools Console, run `localStorage.setItem('userRole', 'admin')`, then navigate to `/dashboard`. You must NOT get admin access. You should be redirected to `/auth` or see Access Denied.
- Confirm `src/pages/Index.tsx` has zero references to `localStorage` for role routing.

---

### 1.2 ProtectedRoute Auth Timeout Bypass Removed
**File:** `src/components/auth/ProtectedRoute.tsx`

**What was wrong:** When the auth check timed out (e.g. slow network), the route showed a "Continue with limited access" button that let any user proceed past the guard — including protected admin and teacher routes.

**What was fixed:** On timeout, the route now redirects to `/auth` instead of showing the bypass button. No user can ever proceed past a ProtectedRoute without a verified session.

**What to check:**
- There must be no "Continue with limited access" button anywhere in `ProtectedRoute.tsx`.
- On a slow connection, verify that timing out sends the user to the login page, not the protected page.
- Check that `requireAdmin`, `requireTeacher`, and `requireParent` props still work correctly for their respective routes.

---

### 1.3 PII Console Log Leaks Removed (Two Rounds)
**Files affected (Round 1 — commit `2352a14`):**
- `src/components/attendance/AttendanceForm.tsx` — was logging parent email addresses per student
- `src/pages/TeacherMessages.tsx` — was logging teacher IDs, class IDs, student IDs, parent email counts
- `src/pages/Dashboard.tsx` — was logging teacher email on every profile fetch
- `src/pages/Auth.tsx` — was logging login email
- `src/components/dhor-book/ClassroomRecords.tsx` — was logging student IDs and dates
- `src/utils/adminUtils.ts` — was logging admin email during setup
- `src/utils/createTeacherAccount.ts` — was logging teacher name/email during account creation

**Files affected (Round 2 — commit `3813a53`):**
- `src/hooks/useRBAC.ts` — was logging role, isAdmin, isTeacher, isParent, teacherId on **every page load**
- `src/hooks/useTeacherStatus.ts` — was logging teacher/admin status and profile ID on every status check
- `src/components/dhor-book/DhorBookEntryForm.tsx` — ~14 console.logs logging form data, surah/juz/ayat selections, submit payload
- `src/components/dhor-book/DhorBookGrid.tsx` — logging entry objects on every render

**What to check:**
- Open DevTools → Console. Navigate through all pages (as admin, teacher, and parent). The console must show **zero** `console.log` output containing user data (emails, IDs, names, roles).
- `console.error` and `console.warn` are acceptable and were intentionally kept.
- Run this in DevTools to confirm no user-data logs slip through.

---

### 1.4 Dead Admin API Call Removed
**File:** `src/utils/promoteToAdmin.ts`

**What was wrong:** The file contained a call to `supabase.auth.admin.updateUserById()` — this is a **server-only** API that must only run in a backend Edge Function. Calling it from the browser leaks the service role key and the call always fails silently.

**What was fixed:** The client-side admin call was removed. The profile upsert (with RLS enforcing admin-only writes) is sufficient and correct.

**What to check:**
- `src/utils/promoteToAdmin.ts` must not contain `supabase.auth.admin.updateUserById`.
- Promoting a user to admin via the UI should still work (profile upsert via RLS).

---

### 1.5 Explicit Column Selection (Least-Privilege DB Queries)
**Files:** `src/pages/Teachers.tsx`, `src/pages/StudentDetail.tsx`, `src/pages/ParentAttendance.tsx`, `src/pages/Parent.tsx`

**What was wrong:** These pages used `.select('*')` — fetching every column including potential future sensitive fields. This is a least-privilege violation.

**What was fixed:** All four pages now use explicit column lists (e.g. `select("id, name, subject, email, bio, phone")`).

**What to check:**
- Search the codebase for `.select('*')` in the above four files. There should be none.
- Confirm the pages still display all their data correctly (no missing fields).

---

### 1.6 Route Guards Fixed
**File:** `src/App.tsx`

**What was wrong:**
1. `/create-demo-account`, `/create-teacher-profile`, `/admin-diagnostic` were fully public — no authentication required. Any logged-out person could access these dev/admin tools.
2. `/add-parent` had `requireParent` (wrong role) — so teachers couldn't add parents, but parents could access the add-parent form.

**What was fixed:**
1. The three dev routes are now wrapped in `requireAdmin`.
2. `/add-parent` is now correctly wrapped in `requireTeacher`.

**What to check:**
- Log in as a parent and try to navigate to `/create-demo-account` → should be blocked.
- Log in as a teacher and navigate to `/add-parent` → should work.
- Log in as a parent and try `/add-parent` → should be blocked.

---

### 1.7 Redundant ProtectedRoute Wrappers Removed
**Files:** `src/pages/Parent.tsx`, `src/pages/ParentAttendance.tsx`, `src/pages/ParentAcademics.tsx`, `src/pages/ParentProgress.tsx`

**What was wrong:** Each parent page had an inner `<ProtectedRoute requireParent>` wrapper *inside* the component. The router in `App.tsx` already wraps all `/parent/*` routes in `<ProtectedRoute requireParent>`. The inner wrappers caused a double auth check — redundant but not harmful. However redundant wrappers make code confusing and could mask issues.

**What was fixed:** The inner wrappers were removed from all four files. The router-level protection remains and is sufficient.

**What to check:**
- All parent pages still load correctly when logged in as a parent.
- Log in as a teacher and try to navigate to `/parent` → should still be blocked.

---

## 2. BUG FIXES

### 2.1 Parent Sent to AccessDenied on /dashboard
**File:** `src/pages/Dashboard.tsx`

**What was wrong:** When a parent navigated to `/dashboard`, the component checked for teacher/admin, found neither, and rendered an `AccessDenied` component — instead of redirecting to `/parent`.

**What was fixed:** An `isParent` guard was added before `AccessDenied`. Parents hitting `/dashboard` are now redirected to `/parent`.

**What to check:** Log in as a parent user → you should land on `/parent`, not an "Access Denied" page.

---

### 2.2 Dashboard Error State (Infinite Spinner)
**File:** `src/pages/Dashboard.tsx`

**What was wrong:** When the teacher profile query failed (network error, DB error), the component just showed an infinite loading spinner with no way to recover.

**What was fixed:** When the query returns an error, the page now shows "Could not load your profile" with a "Try again" button that re-fetches.

**What to check:** The error state is hard to trigger in production but you can verify the code: when `error` is truthy and user is not admin, an error div is rendered instead of the spinner.

---

### 2.3 Analytics NaN% Capacity Bug
**File:** `src/hooks/useAnalyticsLive.ts`

**What was wrong:** `current_students` on the classes table is a `string[]` (array of student IDs), not a number. The analytics hook tried to use it as a number for capacity calculation, resulting in `NaN%` capacity on the admin dashboard.

**What was fixed:** Capacity now uses `.length` on the array.

**What to check:** On the admin analytics page, all classes should show a valid capacity percentage (e.g. "12/30 — 40%"), not "NaN%" or "Infinity%".

---

### 2.4 Activity Page — Teacher Actions Count Was Always 0
**File:** `src/pages/admin/Activity.tsx`

**What was wrong:** Teacher Actions was calculated by counting progress records where `contributor_id IS NOT NULL`. However most records have a NULL `contributor_id` because the field was added later and existing data wasn't backfilled. So the count was always 0.

**What was fixed:** Teacher Actions now counts all progress entries + attendance records + assignment submissions as teacher activity — regardless of whether `contributor_id` is set.

**What to check:** On the admin Activity page, "Teacher Actions" should show a non-zero count if teachers have been recording attendance/progress.

---

### 2.5 Sidebar Logo Link for Parents
**File:** `src/components/layouts/Sidebar.tsx`

**What was wrong:** The logo in the sidebar always linked to `/dashboard`. Parents logging in would click the logo and land on the teacher dashboard (AccessDenied).

**What was fixed:** The logo link now navigates to `/parent` for parent users and `/dashboard` for all others.

**What to check:** Log in as a parent and click the sidebar logo → you should go to `/parent`, not `/dashboard`.

---

### 2.6 Sidebar Scroll Blocked on Desktop
**File:** `src/components/layouts/Sidebar.tsx`

**What was wrong:** The nav container had `overflow-y: hidden` which blocked scrolling on long nav lists.

**What was fixed:** Changed to `overflow-y: auto`.

**What to check:** On a screen that isn't tall enough to show all nav items, the sidebar should scroll.

---

### 2.7 Analytics — Teacher-Student Relationship Derivation
**File:** `src/hooks/useAnalyticsLive.ts`

**What was wrong:** Teacher-to-student links were being derived by matching teacher name strings — unreliable and broke when names had slight variations.

**What was fixed:** Links are now derived from `classes.teacher_ids + classes.current_students` (actual DB relationships), with a fallback to the `students_teachers` join table.

**What to check:** Admin analytics "Per Teacher" view should show correct student counts per teacher.

---

## 3. NEW FEATURES

### 3.1 Analytics Dashboard — Fully Rebuilt with Live Data
**Files:** `src/hooks/useAnalyticsLive.ts`, `src/components/analytics/OptimizedDashboard.tsx`, `src/components/analytics/StudentMetricsView.tsx`, `src/components/analytics/TeacherMetricsView.tsx`, `src/components/analytics/ClassMetricsView.tsx`

**What was built:** The admin analytics page previously relied on pre-aggregated summary tables that required a background job to populate. If the job hadn't run, all numbers were 0 or stale.

The analytics dashboard was completely rebuilt to query live data directly:
- **Student KPIs:** attendance rate, memorization pace (pages/week), days since last progress, at-risk flag (attendance <70% OR no progress in 14+ days)
- **Teacher KPIs:** per-teacher average student attendance, average pace, count of at-risk students
- **Class KPIs:** capacity utilization (enrolled/capacity), class-level attendance rate
- **6 headline KPIs** on the overview: Total Students, At-Risk Students, Overall Attendance Rate, Avg Memorization Pace, Total Classes, Active Teachers

**What to check:**
- Admin Analytics page loads without errors and shows real numbers.
- At-Risk Students count reflects students with attendance <70% or no progress in the last 14 days.
- Clicking tabs (Students, Teachers, Classes) shows the correct breakdown tables.
- If there is no data, each section shows an empty state (not an error).

---

### 3.2 Teacher Student Insights & At-Risk Alerting
**Files:** `src/hooks/useTeacherStudentMetrics.ts`, `src/components/teacher-portal/TeacherStudentInsights.tsx`, `src/components/teacher-portal/dashboard/DashboardOverview.tsx`

**What was built:**
- Teachers now see a searchable per-student metrics table: attendance rate, memorization pace, days since last progress, risk status (at-risk / stagnant / ok)
- KPI summary cards at the top of the view: count of at-risk students, average attendance, average pace
- An alert banner on the teacher dashboard overview: "X students are at risk or stagnant — view Performance tab"

**What to check:**
- Log in as a teacher with students. Go to the Analytics tab → Performance. You should see a table with a row per student.
- If any student has attendance <70% or no progress in 14 days, they should appear with a red "At Risk" badge.
- The alert banner on the main dashboard should appear if there are at-risk students.
- If the teacher has no students, show an empty state.

---

### 3.3 In-App Notification Bell
**Files:** `src/hooks/useNotifications.ts`, `src/components/shared/NotificationBell.tsx`, `src/components/layouts/Sidebar.tsx`

**What was built:** A bell icon in the sidebar header that shows a red badge count of unread notifications. Notifications are computed live from analytics data (no new DB table). Types:
- `at_risk` — student attendance <70% or no progress in 14+ days (critical)
- `stagnation` — no progress in 7–13 days (warning)
- `low_attendance` — class attendance <75% (warning/critical)
- `overcapacity` — class at ≥95% capacity (warning)
- `teacher_warning` — teacher has ≥3 at-risk students (warning/critical)

Dismissed notifications persist in localStorage for 7 days.

**What to check:**
- Bell appears in the sidebar for admin and teacher roles.
- Bell does NOT appear for parents.
- Clicking the bell opens a dropdown with notifications sorted critical-first.
- Each notification can be dismissed individually. "Clear all" dismisses all.
- Clicking a notification navigates to the relevant page (e.g. analytics, student detail).
- Badge count decreases as notifications are dismissed.

---

## 4. UI/UX IMPROVEMENTS

### 4.1 Parent Dashboard — Stats, Badges, and Chat Bubbles
**Files:** `src/pages/Parent.tsx`, `src/pages/ParentAttendance.tsx`, `src/pages/ParentMessages.tsx`, `src/pages/ParentAcademics.tsx`, `src/pages/ParentProgress.tsx`, `src/components/parent/ChildSelector.tsx`

**What was improved:**
- **Parent.tsx:** Now shows 4 stat cards (attendance rate, last Qur'an position, pending assignments, recent progress count) instead of a raw data dump.
- **ParentAttendance.tsx:** Added a summary row showing attendance rate %, present/absent/late counts, and colour-coded status badges (green = present, red = absent, amber = late).
- **ParentMessages.tsx:** Replaced flat bordered boxes with chat-style bubbles — messages sent by the parent appear on the right in primary colour; received messages appear on the left in muted style.
- **ChildSelector:** A shared pill-style child selector component was extracted and used across all parent pages instead of 5 separate copy-pasted button rows.

**What to check:**
- Log in as a parent. The dashboard should show 4 stat cards, not a raw list.
- Navigate to Attendance — you should see the summary bar at the top and colour-coded badges.
- Navigate to Messages — the thread dialog should use chat bubbles.
- Switching children in any page via the ChildSelector should update all data.

---

### 4.2 Admin Mobile Layout — Responsive Sidebar
**File:** `src/pages/admin/AdminLayout.tsx`

**What was improved:** The admin layout had no mobile support. On small screens the sidebar was always visible, overlapping content.

**What was fixed:** Added a hamburger button on mobile that toggles the sidebar with a backdrop overlay.

**What to check:** On a mobile screen (or with DevTools device mode), the admin layout should show a hamburger button. Tapping it should open/close the sidebar with an overlay.

---

### 4.3 Empty States Added
**Files:** `src/pages/Parent.tsx`, `src/pages/ParentAcademics.tsx`, `src/pages/ParentMessages.tsx`

**What was improved:** These pages showed blank white space when there was no data (no children, no assignments, no messages). Now they show the shared `EmptyState` component with an icon and descriptive text.

**What to check:** Log in as a parent with no children linked → the pages should show a friendly empty state with an icon, not a blank page.

---

### 4.4 404 Not Found Page
**File:** `src/pages/NotFound.tsx`

**What was improved:** The old 404 page was a bare unstyled message. It now has a styled layout with "Go Back" and "Go to Home" buttons.

**What to check:** Navigate to a non-existent URL like `/xyz` → should see the styled 404 page.

---

### 4.5 Navigation Icons and i18n
**File:** `src/config/navigation.ts`, `src/i18n/translations.ts`

**What was fixed:**
- Duplicate icons: "Classes" and "Schedule/TeacherSchedules" had the same icon. Now Classes uses `Library`, Schedule uses `CalendarDays`.
- Missing icon: "Messages" now has `MessageSquare`.
- i18n keys added for: activityFeed, analytics, messages, bulkStudentImport, teacherSchedules (both EN and FR).

**What to check:** Check the sidebar nav items. Each item should have a distinct, meaningful icon. In French locale, nav item labels should be translated.

---

### 4.6 Teachers Page — Shared LoadingState
**File:** `src/pages/Teachers.tsx`

**What was improved:** The Teachers page used a hardcoded spinner (`<Loader2 className="... text-emerald-600" />`) instead of the shared `<LoadingState />` component. This was inconsistent with the rest of the app.

**What was fixed:** Now uses the shared `LoadingState` component.

**What to check:** Loading the Teachers page should show the same loading animation as other pages.

---

## 5. CODE CLEANUP

### 5.1 Removed 16 Dead/Unused Files
**Commit:** `8a04d17`

Files deleted (verified zero imports before deletion):

| Category | Files Deleted |
|----------|--------------|
| Pages | `pages/Progress.tsx`, `pages/StudentProgress.tsx` |
| Hooks | `useClassMetricsSummary.ts`, `useTeacherMetricsSummary.ts`, `useStudentMetricsSummary.ts`, `useRealtimeAdminMessages.ts`, `useRealtimeMessages.ts`, `useTeacherMessages.ts`, `useDashboardNavigation.ts` |
| Analytics Services | `comparisonCalculator.ts`, `programMetrics.ts` |
| Utilities | `dateUtils.ts`, `juzAyahMapping.ts`, `juzMetadata.ts`, `runAnalyticsAggregation.ts` |
| Types | `attendance-record.ts` |

**What to check:** TypeScript should compile with zero errors. Run `npx tsc --noEmit`.

---

### 5.2 Dev Pages Moved to /src/pages/dev/
**Commit:** `1db1e10`

The following dev/diagnostic pages were moved from `src/pages/` and `src/pages/admin/` into `src/pages/dev/`:
- `CreateDemoAccount.tsx`
- `CreateTeacherProfileForTestAccount.tsx`
- `DevAdminManagement.tsx`
- `AdminAccessDiagnostic.tsx`
- `DatabaseSeeder.tsx`
- `ManualRoleSetup.tsx`

They are now all gated behind `requireAdmin` in `App.tsx` (see Security section 1.6).

**What to check:** These pages should not be accessible to non-admin users.

---

### 5.3 ParentAcademics Debug Code Removed
**File:** `src/pages/ParentAcademics.tsx`

**What was wrong:** Had several unguarded `console.log` statements and a debug `<div>` element visible in the production JSX.

**What was fixed:** All debug code and the dev div were removed.

**What to check:** View source of the ParentAcademics page in browser → no debug divs or console noise.

---

## 6. DOCUMENTATION ADDED

### 6.1 User Guide
**File:** `docs/USER_GUIDE.md`

Covers teacher workflows, admin workflows, and parent workflows with step-by-step instructions for the most common tasks.

### 6.2 CHANGELOG
**File:** `CHANGELOG.md`

Updated with v1.1.5 entries covering the bug fixes and UI improvements.

---

## Summary Table for Quick Review

| # | Category | Risk | Files | Key Test |
|---|----------|------|-------|----------|
| 1.1 | localStorage bypass | 🔴 Critical | `Index.tsx` | Try spoofing role in DevTools |
| 1.2 | Auth timeout bypass | 🔴 Critical | `ProtectedRoute.tsx` | No "Continue with limited access" button |
| 1.3 | PII console logs | 🔴 Critical | Multiple | No user data in browser console |
| 1.4 | Dead admin API call | 🟠 High | `promoteToAdmin.ts` | No `supabase.auth.admin` calls |
| 1.5 | `select('*')` | 🟠 High | 4 pages | Explicit columns only |
| 1.6 | Public dev routes | 🟠 High | `App.tsx` | Dev tools blocked to non-admins |
| 1.7 | Redundant ProtectedRoute | 🟡 Medium | 4 parent pages | Parent pages still load |
| 2.1 | Parent → AccessDenied | 🟡 Medium | `Dashboard.tsx` | Parent lands on /parent |
| 2.2 | Dashboard error spinner | 🟡 Medium | `Dashboard.tsx` | Error shows retry button |
| 2.3 | Analytics NaN% | 🟡 Medium | `useAnalyticsLive.ts` | Valid % shown |
| 2.4 | Teacher Actions = 0 | 🟡 Medium | `Activity.tsx` | Non-zero count |
| 3.1 | Analytics rebuild | 🟢 Feature | Many | Live KPIs load |
| 3.2 | At-risk alerting | 🟢 Feature | 3 files | Alert banner shows |
| 3.3 | Notification bell | 🟢 Feature | 3 files | Bell shows for admin/teacher |
| 4.x | UI/UX polish | 🟢 Low | Multiple | Visual checks |
| 5.x | Code cleanup | 🟢 Low | 16+ files | `npx tsc --noEmit` passes |

---

*This document was generated from commits on branch `claude/refactor-analytics-metrics-mPyk2`.*
